import { NextRequest, NextResponse } from "next/server";
import { ComplaintItem, InvestigationSummaryReport } from "@/types";
import { ComplaintSummaryService } from "@/services/complaintSummaryService";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { complaint, existingSummary, generatedByName } = body as {
      complaint: ComplaintItem;
      existingSummary?: InvestigationSummaryReport;
      generatedByName?: string;
    };

    if (!complaint) {
      return NextResponse.json({ error: "Complaint data is required" }, { status: 400 });
    }

    // Baseline structured summary
    const baseSummary = ComplaintSummaryService.buildLocalSummary(
      complaint,
      existingSummary,
      generatedByName || "CMS Intelligence Engine"
    );

    // If Gemini API Key is available, augment executive summaries with Gemini generative synthesis
    if (GEMINI_API_KEY) {
      const candidateModels = [
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-3.5-flash",
      ];

      const prompt = `You are an elite Senior Police Supervisory Officer & Investigative Analyst for Haryana Police (CMS Portal / BNSS 2023).
Analyze the following police complaint case details covering Overview, Attached Documents, and Historical Timeline.

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

      for (const model of candidateModels) {
        try {
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
          const geminiRes = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json",
              },
            }),
          });

          if (geminiRes.ok) {
            const result = await geminiRes.json();
            const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const parsed = JSON.parse(rawText.trim());
              if (parsed.executiveSynopsis) baseSummary.caseSynopsis = parsed.executiveSynopsis;
              if (parsed.kitnaKaamHuaHai) baseSummary.workDoneSummary = parsed.kitnaKaamHuaHai;
              if (parsed.kyaBaakiHai) baseSummary.pendingWorkSummary = parsed.kyaBaakiHai;
              if (parsed.primaFacieObservation) baseSummary.primaFacieObservation = parsed.primaFacieObservation;
              baseSummary.generatedBy = `Gemini AI (${model}) & CMS Intelligence`;
              break;
            }
          }
        } catch (e) {
          // fallback to next model or local summary
        }
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
