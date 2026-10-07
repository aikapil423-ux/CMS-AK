// Document generator for complaint intake verification proforma
import { ComplaintPreviewData } from "@/components/complaints/ComplaintVerificationModal";

export function generateComplaintIntakeHtml(data: ComplaintPreviewData, complaintNo: string): string {
  const primaryComp = data.complainants[0];
  const dateFormatted = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeFormatted = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const complainantsHtml = data.complainants
    .map(
      (c, idx) => `
    <div style="margin-bottom: 12px; padding: 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;">
      <div style="font-weight: bold; font-size: 13px; color: #0f172a;">
        #${idx + 1} ${c.name} ${c.relativeName ? `(${c.relationType || "S/o"} ${c.relativeName})` : ""}
        <span style="float: right; font-family: monospace; color: #1e3a8a; background: #dbeafe; padding: 2px 6px; border-radius: 4px;">
          Mob: +91 ${c.mobile}
        </span>
      </div>
      <div style="font-size: 11px; color: #334155; margin-top: 6px;">
        <strong>Gender/Age:</strong> ${c.gender || "—"} / ${c.age ? `${c.age} Yrs` : "—"} |
        <strong>Nationality:</strong> ${c.nationalityChoice || "Indian"}
      </div>
      <div style="font-size: 11px; color: #334155; margin-top: 4px;">
        <strong>Present Address:</strong> ${c.presentAddress}, ${c.presentCity}, ${c.presentDistrict}, ${c.presentState}
      </div>
    </div>
  `
    )
    .join("");

  const accusedHtml =
    data.isAccusedKnown && data.accusedList.length > 0
      ? data.accusedList
          .map(
            (a, idx) => `
      <div style="margin-bottom: 8px; padding: 8px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; font-size: 12px;">
        <strong>#${idx + 1} ${a.name} ${a.alias ? `(Alias: ${a.alias})` : ""}</strong>
        ${a.phone ? `<span style="float: right; font-family: monospace;">Mob: ${a.phone}</span>` : ""}
        <div style="font-size: 11px; color: #4b5563; margin-top: 3px;">
          <strong>Address:</strong> ${a.address || "Not specified"}
          ${a.relationWithComplainant ? ` | <strong>Relation:</strong> ${a.relationWithComplainant}` : ""}
        </div>
      </div>
    `
          )
          .join("")
      : `<div style="padding: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-style: italic; font-size: 12px; color: #64748b;">
        Accused is unknown at preliminary stage (अज्ञात / To be identified during preliminary enquiry).
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Complaint Intake Verification Proforma - ${complaintNo}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      line-height: 1.5;
      color: #0f172a;
      background: #fff;
      margin: 0;
      padding: 20px;
    }
    .sheet {
      border: 2px solid #000;
      border-radius: 8px;
      padding: 24px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .seal {
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 2px;
      color: #0b192c;
    }
    h1 {
      font-size: 18px;
      font-weight: 900;
      text-transform: uppercase;
      margin: 4px 0;
      color: #000;
    }
    .subline {
      font-size: 12px;
      font-weight: bold;
      color: #334155;
      text-transform: uppercase;
    }
    .badge-bar {
      display: flex;
      justify-content: space-between;
      background: #f1f5f9;
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 12px;
      margin-bottom: 16px;
    }
    .sec-title {
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin-top: 14px;
      margin-bottom: 8px;
      color: #0f172a;
    }
    .box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px;
      font-size: 12px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 2px solid #000;
      padding-top: 24px;
      margin-top: 30px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="seal">HARYANA POLICE</div>
      <h1>Citizen Complaint Intake Verification Proforma</h1>
      <div class="subline">${data.policeStation}, District ${data.district}</div>
      <div style="font-size: 11px; color: #64748b; font-style: italic; margin-top: 2px;">
        (Under PPR Rule 22.48 &amp; Section 173(3) of Bharatiya Nagarik Suraksha Sanhita, 2023)
      </div>
    </div>

    <div class="badge-bar">
      <div><strong>Complaint No:</strong> <span style="font-family: monospace; color: #1e3a8a; font-weight: bold;">${complaintNo}</span></div>
      <div><strong>Date/Time:</strong> ${dateFormatted} ${timeFormatted}</div>
      <div><strong>Channel:</strong> ${data.sourceChannel}</div>
      <div><strong>Priority:</strong> ${data.priorityLevel}</div>
    </div>

    <div class="sec-title">1. Complainant Particulars</div>
    ${complainantsHtml}

    <div class="sec-title">2. Accused / Suspect Particulars</div>
    ${accusedHtml}

    <div class="sec-title">3. Occurrence &amp; Allegation Particulars</div>
    <div class="box">
      <div style="margin-bottom: 6px;">
        <strong>Place of Incident:</strong> ${data.incidentPlace} ${data.incidentLandmark ? `(Landmark: ${data.incidentLandmark})` : ""} |
        <strong>Date/Time:</strong> ${data.isDateTimeKnown ? `${data.incidentDate} ${data.incidentTime || ""}` : data.incidentApproxPeriod || "Undated"}
      </div>
      <div style="margin-bottom: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
        <strong style="text-transform: uppercase; color: #0f172a;">Subject / विषय:</strong>
        <div style="font-weight: bold; font-size: 13px; color: #000; margin-top: 2px;">${data.complaintSubject}</div>
      </div>
      <div style="padding-top: 6px; border-top: 1px solid #e2e8f0;">
        <strong style="text-transform: uppercase; color: #0f172a;">Brief Synopsis / विवरण:</strong>
        <div style="color: #1e293b; margin-top: 2px; white-space: pre-wrap;">${data.complaintDescription}</div>
      </div>
    </div>

    ${
      data.isSho && data.shouldAssignEoNow && data.selectedEoName
        ? `
      <div class="sec-title">4. Immediate Enquiry Officer (EO) Allocation</div>
      <div style="padding: 10px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 6px; font-size: 12px;">
        <strong>Assigned Officer:</strong> ${data.selectedEoName} (${data.selectedEoRank || "EO"}) |
        <strong>PNO:</strong> ${data.selectedEoPno || "—"} |
        <strong>Target:</strong> ${data.targetDays || 14} Days
        ${data.assignedDirections ? `<div style="font-style: italic; color: #581c87; margin-top: 4px;">&ldquo;${data.assignedDirections}&rdquo;</div>` : ""}
      </div>
    `
        : ""
    }

    <div class="footer">
      <div style="text-align: center; width: 140px;">
        <div style="height: 50px; border: 1px dashed #94a3b8; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #94a3b8;">
          Thumb / Sign
        </div>
        <div style="font-weight: bold; font-size: 11px; margin-top: 4px;">Complainant Signature</div>
      </div>

      <div style="text-align: right;">
        <div>______________________________________</div>
        <div style="font-weight: bold; font-size: 13px; color: #0f172a; margin-top: 4px;">${data.registeredBy}</div>
        <div style="color: #475569; font-size: 11px;">Intake Officer / Duty Clerk</div>
        <div style="color: #64748b; font-size: 10px; font-family: monospace;">${data.policeStation}, District ${data.district}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
