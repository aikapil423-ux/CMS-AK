import { processingAIAvailable, PROCESSING_MODEL, processWithAI } from "@/lib/openRouter";
import { apiAccess } from "@/lib/apiSecurity";
import { NextRequest, NextResponse } from "next/server";
import { ComplaintItem, InvestigationSummaryReport } from "@/types";
import { ComplaintSummaryService } from "@/services/complaintSummaryService";
import { readComplaints } from "@/services/complaintRepository";
import { savedCaseEvidence } from "@/services/savedCaseEvidence";
import { canViewComplaint } from "@/utils/complaintPermissions";


export async function POST(req: NextRequest) {
  const apiUser = await apiAccess(req); if (apiUser instanceof Response) return apiUser;

  try {
    const body = await req.json();
    const { complaint: input, existingSummary, generatedByName } = body as {
      complaint: ComplaintItem;
      existingSummary?: InvestigationSummaryReport;
      generatedByName?: string;
    };

    if (!input?.id) {
      return NextResponse.json({ error: "Complaint data is required" }, { status: 400 });
    }
    const complaint = (await readComplaints()).find(record => record.id === input.id && canViewComplaint(apiUser, record).allowed);
    if (!complaint) return NextResponse.json({ error: "Saved complaint not found or access denied." }, { status: 404 });

    // Baseline structured summary
    const baseSummary = ComplaintSummaryService.buildLocalSummary(
      complaint,
      existingSummary,
      generatedByName || "CMS Intelligence Engine"
    );

    if (processingAIAvailable()) {
      const evidence = JSON.stringify(await savedCaseEvidence([complaint.id], apiUser));
      const prompt = `You are an elite Senior Police Supervisory Officer & Investigative Analyst for Haryana Police (CMS Portal / BNSS 2023).
Analyze the following police complaint case details covering Overview, Attached Documents, and Historical Timeline.

STRICT ANTI-FABRICATION & ANTI-HALLUCINATION RULE (रिकॉर्ड में जो है केवल वही लिखें, खुद से मनगढ़ंत डेटा न बनाएं):
- User instruction: "jaha be kuch generate ho raha hai usme jo data mila ha process and analysis kre ke vi dekhye aur forms me fill kre khud se generate na kre na milne par btaye no found jo data nhi mila aur jo fill krna hai to fill na kre blank rhne de khud se fill na kre aur false informaction na to fill kre na show kre".
- Strictly base all analysis ONLY on the actual verified facts, documents, and timeline events provided below.
- ABSOLUTELY DO NOT INVENT, FABRICATE, ASSUME, OR HALLUCINATE ANY FACTS, DATES, PERSONS, WITNESSES, EVIDENCE, OR POLICE ACTIONS!
- If any detail is missing (e.g. mobile number not in document, no documents attached, no spot visit, no EO assigned), you must explicitly write "दस्तावेज़ / रिकॉर्ड में उल्लेख नहीं (Not Found on Record)".
- NEVER output false or fabricated information under any circumstance.

COMPLAINT OVERVIEW:
- Complaint Number: ${complaint.complaintNumber}
- Complainant: ${complaint.complainantName} (${complaint.complainantRelationType || ""} ${complaint.complainantRelativeName || ""})
- Complainant Mobile: ${complaint.complainantMobile}
- Complainant Address: ${complaint.complainantAddress}, ${complaint.complainantCity}, ${complaint.complainantDistrict}
- Accused: ${complaint.accusedList?.map(a => a.name).join(", ") || "Unknown"}
- Category: ${complaint.categoryDisplay || complaint.category}
- Incident Place: ${complaint.incidentPlace}
- Incident Date: ${complaint.incidentDate}
- Description & Allegations: ${complaint.complaintDescription || complaint.incidentDetails}
- Assigned Officer: ${complaint.assignedEoName || "Unassigned"}
- Current Status: ${complaint.status}
- Days Pending: ${complaint.daysPending || 0} days

DOCUMENTS & EVIDENCE ATTACHMENTS:
${complaint.attachments?.map((a, i) => `${i + 1}. ${a.name} (${a.category}) - ${a.description || "Uploaded evidence"}`).join("\n") || "No external attachments"}

SAVED PROCESSED EVIDENCE:
${evidence}

HISTORY & TIMELINE:
${complaint.timeline?.map((t, i) => `${i + 1}. [${t.timestamp}] ${t.title} by ${t.officerName}: ${t.description || ""}`).join("\n") || "Registration on record"}

TASK:
Produce an authoritative, high-level executive investigative summary in Hindi (formal official police Hindi / देवनागरी लिपि) addressing:
1. "kitnaKaamHuaHai" (Work completed so far - कितना काम हुआ है अब तक): Clear synthesis of what has been done by police/EO, documents received, statements taken.
2. "kyaBaakiHai" (Pending work - क्या बाकी है): Clear breakdown of what investigation steps, notices, forensics, or approvals are still pending.
3. "executiveSynopsis" (Case synopsis in Hindi): 2-3 sentences concise case briefing.
4. "primaFacieObservation": Legal assessment of whether allegations disclose a cognizable offence under BNS 2023 or civil dispute.

Return ONLY a valid JSON object matching this schema:
{
  "executiveSynopsis": "...",
  "kitnaKaamHuaHai": "...",
  "kyaBaakiHai": "...",
  "primaFacieObservation": "..."
}`;

      try {
        if (prompt.length > 600000) throw new Error("Summary source too large");
        const parsed = JSON.parse(await processWithAI([{ text: prompt }], { json: true }));
        if (typeof parsed.executiveSynopsis === "string" && parsed.executiveSynopsis.trim()) baseSummary.caseSynopsis = parsed.executiveSynopsis;
        if (typeof parsed.kitnaKaamHuaHai === "string" && parsed.kitnaKaamHuaHai.trim()) baseSummary.workDoneSummary = parsed.kitnaKaamHuaHai;
        if (typeof parsed.kyaBaakiHai === "string" && parsed.kyaBaakiHai.trim()) baseSummary.pendingWorkSummary = parsed.kyaBaakiHai;
        if (typeof parsed.primaFacieObservation === "string" && parsed.primaFacieObservation.trim()) baseSummary.primaFacieObservation = parsed.primaFacieObservation;
        baseSummary.generatedBy = `OpenRouter (${PROCESSING_MODEL}) & CMS Intelligence`;
      } catch {
        // The locally generated summary remains available if the provider fails.
      }
    }

    return NextResponse.json({ summary: baseSummary });
  } catch (err: any) {
    console.error("Error generating investigation summary:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate investigation summary" },
      { status: 500 }
    );
  }
}
