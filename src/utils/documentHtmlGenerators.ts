// High-fidelity HTML & Print Generators for Haryana Police Official Legal Documents & Enquiry Reports
import { PoliceReportFormData, NoticeFormData } from "@/types";

const BASE_DOC_STYLES = `
  @page {
    size: A4;
    margin: 15mm 15mm 15mm 15mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
    background-color: #ffffff;
    line-height: 1.5;
    font-size: 11.5pt;
    margin: 0;
    padding: 24px;
  }
  .doc-sheet {
    max-width: 820px;
    margin: 0 auto;
    background: #ffffff;
    border: 2px solid #cbd5e1;
    border-radius: 12px;
    padding: 36px 44px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  }
  @media print {
    body {
      padding: 0;
      background: none;
    }
    .doc-sheet {
      border: none !important;
      border-radius: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      max-width: 100% !important;
    }
    .no-print {
      display: none !important;
    }
  }
  .header-seal {
    text-align: center;
    border-bottom: 2.5px solid #0b192c;
    padding-bottom: 14px;
    margin-bottom: 16px;
  }
  .police-title {
    font-size: 15pt;
    font-weight: 900;
    letter-spacing: 2.5px;
    color: #0b192c;
    text-transform: uppercase;
    margin: 0;
  }
  .state-title {
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: #475569;
    text-transform: uppercase;
    margin: 2px 0 6px 0;
  }
  .station-title {
    font-size: 12pt;
    font-weight: 800;
    text-transform: uppercase;
    color: #0b192c;
    margin: 0;
  }
  .doc-title-block {
    text-align: center;
    margin: 16px 0 20px 0;
  }
  .doc-main-title {
    font-size: 12pt;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-decoration: underline;
    text-underline-offset: 4px;
    color: #0b192c;
    margin: 0 0 4px 0;
  }
  .doc-sub-title {
    font-size: 9.5pt;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 16px;
    background-color: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 18px;
    font-size: 9pt;
  }
  .meta-item strong {
    color: #475569;
    text-transform: uppercase;
    font-size: 8pt;
    display: inline-block;
    min-width: 95px;
  }
  .meta-item span {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-weight: 700;
    color: #0b192c;
  }
  .party-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 18px;
  }
  .party-box {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 10px 14px;
    background-color: #ffffff;
    font-size: 9.5pt;
  }
  .party-header {
    font-size: 8.5pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
    margin-bottom: 8px;
  }
  .party-header.complainant {
    color: #1d4ed8;
  }
  .party-header.accused {
    color: #b91c1c;
  }
  .party-field {
    margin-bottom: 4px;
  }
  .party-field strong {
    color: #64748b;
    font-size: 8.5pt;
  }
  .section-block {
    margin-bottom: 14px;
  }
  .section-label {
    font-size: 8.5pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #475569;
    margin-bottom: 4px;
  }
  .section-content {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 9px 12px;
    font-size: 9.5pt;
    white-space: pre-wrap;
    line-height: 1.6;
    color: #1e293b;
  }
  .section-content.highlight {
    background-color: #fffbeb;
    border-color: #fde68a;
    color: #78350f;
    font-weight: 600;
  }
  .signatures-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 26px;
    padding-top: 16px;
    border-top: 1px solid #cbd5e1;
  }
  .seal-box {
    width: 140px;
    text-align: center;
  }
  .seal-stamp {
    height: 60px;
    border: 1.5px dashed #94a3b8;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 7.5pt;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .seal-label {
    margin-top: 4px;
    font-size: 8pt;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
  }
  .officer-block {
    text-align: right;
    width: 250px;
    font-size: 9pt;
  }
  .officer-block .officer-name {
    font-weight: 800;
    color: #0b192c;
    font-size: 10pt;
  }
  .officer-block .officer-role {
    font-size: 8pt;
    font-weight: 700;
    color: #0b192c;
    text-transform: uppercase;
  }
  .sho-endorsement {
    margin-top: 22px;
    padding-top: 14px;
    border-top: 2px solid #cbd5e1;
    font-size: 9pt;
  }
  .sho-header {
    display: flex;
    justify-content: space-between;
    font-weight: 800;
    text-transform: uppercase;
    color: #0b192c;
    margin-bottom: 6px;
  }
  .sho-text {
    font-style: italic;
    color: #334155;
    margin-bottom: 12px;
    line-height: 1.5;
  }
  .sho-sign {
    text-align: right;
    font-size: 8.5pt;
  }
  .badge-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
    background-color: #f1f5f9;
    border: 1px solid #cbd5e1;
    color: #334155;
  }
`;

export function generateEnquiryReportHtml(
  formData: PoliceReportFormData,
  categoryKey: string
): string {
  const categoryTitles: Record<string, { title: string; subtitle: string }> = {
    land_dispute: {
      title: "ENQUIRY REPORT - LAND / PASSAGE BOUNDARY DISPUTE (CIVIL NATURE)",
      subtitle: "FIELD VERIFICATION UNDER SECTION 173(3) BNSS, 2023 / CHAPTER XXII PPR",
    },
    financial_fraud: {
      title: "PRELIMINARY ENQUIRY REPORT - FINANCIAL CHEATING & FRAUD",
      subtitle: "INQUIRY UNDER SECTION 173(3) BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023",
    },
    assault_ncr: {
      title: "NON-COGNIZABLE REPORT (NCR) & PRELIMINARY ENQUIRY REPORT",
      subtitle: "RECORDED UNDER SECTION 174 BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023",
    },
    matrimonial_dispute: {
      title: "ENQUIRY REPORT & RECONCILIATION PROCEEDINGS - MATRIMONIAL DISPUTE",
      subtitle: "DOMESTIC DISPUTE VERIFICATION & COMPROMISE COUNSELLING (BNSS / PPR)",
    },
    cyber_crime: {
      title: "PRELIMINARY ENQUIRY REPORT - FINANCIAL CYBER CRIME / ONLINE FRAUD",
      subtitle: "CYBER HELPLINE 1930 / I4C NATIONAL CYBER REPORTING VERIFICATION",
    },
    lost_property_ncr: {
      title: "LOST PROPERTY REPORT / NON-COGNIZABLE NCR (LOST ARTICLES / DOCUMENTS)",
      subtitle: "RECORDED UNDER SECTION 174 BHARATIYA NAGARIK SURAKSHA SANHITA, 2023",
    },
  };

  const titleInfo = categoryTitles[categoryKey] || {
    title: "OFFICIAL ENQUIRY REPORT & FINDINGS DOCKET",
    subtitle: "INVESTIGATION REPORT UNDER BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023",
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${formData.dispatchNo || "ENQUIRY_REPORT"} - Haryana Police</title>
  <style>
    ${BASE_DOC_STYLES}
  </style>
</head>
<body>
  <div class="doc-sheet">
    <!-- Header Seal -->
    <div class="header-seal">
      <div style="font-size: 26px; line-height: 1; margin-bottom: 4px;">&#9733; &#9773; &#9733;</div>
      <h1 class="police-title">HARYANA POLICE</h1>
      <div class="state-title">GOVERNMENT OF HARYANA</div>
      <div class="station-title">${formData.policeStation || "POLICE STATION CITY THANESAR"}, DISTRICT ${formData.district || "KURUKSHETRA, HARYANA"}</div>
    </div>

    <!-- Title Block -->
    <div class="doc-title-block">
      <h2 class="doc-main-title">${titleInfo.title}</h2>
      <p class="doc-sub-title">${titleInfo.subtitle}</p>
    </div>

    <!-- Official Dispatch Metadata -->
    <div class="meta-grid">
      <div class="meta-item">
        <strong>Dispatch No:</strong>
        <span>${formData.dispatchNo || "HP/KKR/CT/2026/ENQ-01"}</span>
      </div>
      <div class="meta-item">
        <strong>Date & Time:</strong>
        <span>${formData.reportDate || new Date().toISOString().split("T")[0]} (${formData.reportTime || "12:00 PM"})</span>
      </div>
      <div class="meta-item">
        <strong>Complaint Ref:</strong>
        <span>${formData.complaintRefNo || "HAR-KKR-2026-CMP-001"}</span>
      </div>
      <div class="meta-item">
        <strong>GD Entry:</strong>
        <span>${formData.gdEntryNo || "GD Entry No. 018"}</span>
      </div>
    </div>

    <!-- Parties Grid -->
    <div class="party-grid">
      <!-- Complainant -->
      <div class="party-box">
        <div class="party-header complainant">&#9632; COMPLAINANT / INFORMANT</div>
        <div class="party-field"><strong>Name:</strong> <b>${formData.complainantName || "N/A"}</b></div>
        <div class="party-field"><strong>Father/Spouse:</strong> ${formData.complainantFather || "N/A"}</div>
        <div class="party-field"><strong>Age / Occ:</strong> ${formData.complainantAge || "Adult"}</div>
        <div class="party-field"><strong>Address:</strong> ${formData.complainantAddress || "N/A"}</div>
        <div class="party-field"><strong>Mobile No:</strong> ${formData.complainantPhone || "N/A"}</div>
      </div>

      <!-- Accused -->
      <div class="party-box">
        <div class="party-header accused">&#9632; ACCUSED / OPPOSITE PARTY</div>
        <div class="party-field"><strong>Name:</strong> <b>${formData.accusedName || "N/A"}</b></div>
        <div class="party-field"><strong>Father's Name:</strong> ${formData.accusedFather || "N/A"}</div>
        <div class="party-field"><strong>Address:</strong> ${formData.accusedAddress || "N/A"}</div>
        <div class="party-field"><strong>Mobile No:</strong> ${formData.accusedPhone || "N/A"}</div>
        <div class="party-field"><strong>Status:</strong> Suspect / Non-Applicant</div>
      </div>
    </div>

    <!-- Matter Details -->
    <div class="section-block">
      <div class="section-label">SUBJECT & STATUTORY SECTIONS OF LAW</div>
      <div class="section-content" style="background-color: #f1f5f9; font-weight: 600;">
        <b>Subject:</b> ${formData.disputeSubject || "Matter under enquiry"}<br/>
        <b>Sections / Nature:</b> ${formData.sectionsOfLaw || "Section 173(3) BNSS"}
        ${formData.amountOrPropertyDetails ? `<br/><b>Property / Disputed Matter:</b> ${formData.amountOrPropertyDetails}` : ""}
      </div>
    </div>

    <!-- Complaint Substance -->
    <div class="section-block">
      <div class="section-label">SUBSTANCE OF COMPLAINT / ALLEGATIONS</div>
      <div class="section-content">${formData.complaintSubstance || "No specific allegations stated."}</div>
    </div>

    <!-- Witnesses & Documents Examined -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
      <div class="section-block" style="margin-bottom: 0;">
        <div class="section-label">WITNESSES EXAMINED & STATEMENTS RECORDED</div>
        <div class="section-content" style="min-height: 90px;">${formData.witnessesExamined || "None examined"}</div>
      </div>
      <div class="section-block" style="margin-bottom: 0;">
        <div class="section-label">DOCUMENTS & MATERIAL EVIDENCE VERIFIED</div>
        <div class="section-content" style="min-height: 90px;">${formData.documentsVerified || "None verified"}</div>
      </div>
    </div>

    <!-- Enquiry Findings -->
    <div class="section-block">
      <div class="section-label">ENQUIRY FINDINGS & SPOT VERIFICATION OBSERVATIONS</div>
      <div class="section-content">${formData.enquiryFindings || "Verification conducted."}</div>
    </div>

    <!-- Final Conclusion -->
    <div class="section-block">
      <div class="section-label">FINAL CONCLUSION OF ENQUIRY OFFICER</div>
      <div class="section-content highlight">${formData.finalConclusion || "Enquiry concluded."}</div>
    </div>

    <!-- Recommendation -->
    <div class="section-block">
      <div class="section-label">RECOMMENDATION TO S.H.O. FOR DISPOSAL / ORDER</div>
      <div class="section-content">${formData.shoRecommendation || "Submitted for orders."}</div>
    </div>

    <!-- Signatures & Seal Block -->
    <div class="signatures-row">
      <div class="seal-box">
        <div class="seal-stamp">Official Station Seal</div>
        <div class="seal-label">POLICE STATION SEAL</div>
      </div>
      <div class="officer-block">
        <div class="officer-name">${formData.officerName || "Surender Pal"}</div>
        <div>${formData.officerRank || "Assistant Sub-Inspector (ASI)"}</div>
        <div style="font-family: monospace; color: #475569;">${formData.officerPno || "PNO-23841"}</div>
        <div class="officer-role">Enquiry / Reporting Officer</div>
      </div>
    </div>

    <!-- Endorsement by SHO -->
    <div class="sho-endorsement">
      <div class="sho-header">
        <span>ORDER / ENDORSEMENT BY SHO / S.H.O. OFFICE</span>
        <span style="font-family: monospace; font-size: 8pt; color: #64748b;">Dated: ${formData.reportDate}</span>
      </div>
      <div class="sho-text">
        &ldquo;Perused the preliminary enquiry report submitted by the Enquiry Officer. Findings and recommendations are hereby approved. Order entry in General Diary / Registration of case / Disposal accordingly.&rdquo;
      </div>
      <div class="sho-sign">
        <p style="color: #94a3b8; margin: 0 0 2px 0;">_________________________________</p>
        <b style="color: #0b192c;">Station House Officer (SHO)</b><br/>
        <span style="color: #64748b;">${formData.policeStation || "Police Station City Thanesar"}</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function generateNoticeDocumentHtml(
  formData: NoticeFormData,
  templateType: string
): string {
  const templateTitles: Record<string, { title: string; subtitle: string; mandateText: string }> = {
    accused_notice_bnss: {
      title: "NOTICE OF APPEARANCE UNDER SECTION 35(3) BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023",
      subtitle: "(Mandatory Statutory Notice to Accused/Suspect where arrest is not immediately required)",
      mandateText: "You are hereby directed to join the ongoing police enquiry and appear in person before the undersigned Enquiry Officer without fail.",
    },
    witness_notice_bnss: {
      title: "NOTICE TO WITNESS TO ATTEND AND GIVE STATEMENT UNDER SECTION 179 BNSS, 2023",
      subtitle: "(Statutory Notice for Examination of Witness acquainted with the facts of the case)",
      mandateText: "You appear to be acquainted with the facts and circumstances of the case mentioned below. You are hereby required to attend before the undersigned to give your statement.",
    },
    complaint_receipt: {
      title: "OFFICIAL COMPLAINT ACKNOWLEDGMENT & RECEIPT MEMO",
      subtitle: "CITIZEN INTAKE ACKNOWLEDGMENT UNDER CHAPTER XXII PUNJAB POLICE RULES (HARYANA)",
      mandateText: "This official receipt confirms the due intake and digital registration of your written complaint in the Police Station General Docket.",
    },
    transfer_memo: {
      title: "OFFICIAL CASE TRANSFER / JURISDICTIONAL FORWARDING MEMO",
      subtitle: "INTER-STATION TRANSMISSION UNDER PUNJAB POLICE RULES / BNSS",
      mandateText: "The complaint cited below is forwarded herewith along with preliminary enquiry notes for necessary legal action by the competent Police Station.",
    },
    summons_production: {
      title: "REQUISITION FOR PRODUCTION OF DOCUMENTS / DIGITAL RECORDS (SECTION 94 BNSS, 2023)",
      subtitle: "STATUTORY SUMMONS FOR DOCUMENTARY / ELECTRONIC EVIDENCE PRODUCTION",
      mandateText: "You are hereby required to produce or cause to be produced before the undersigned Enquiry Officer the specified documents, registers, or electronic records.",
    },
  };

  const info = templateTitles[templateType] || {
    title: "OFFICIAL POLICE NOTICE / REQUISITION MEMO",
    subtitle: "ISSUED UNDER BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023",
    mandateText: "You are hereby directed to comply with the instructions detailed below.",
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${formData.dispatchNo || "NOTICE"} - Haryana Police</title>
  <style>
    ${BASE_DOC_STYLES}
  </style>
</head>
<body>
  <div class="doc-sheet">
    <!-- Header Seal -->
    <div class="header-seal">
      <div style="font-size: 26px; line-height: 1; margin-bottom: 4px;">&#9733; &#9773; &#9733;</div>
      <h1 class="police-title">HARYANA POLICE</h1>
      <div class="state-title">GOVERNMENT OF HARYANA</div>
      <div class="station-title">${formData.policeStation || "POLICE STATION CITY THANESAR"}, DISTRICT ${formData.district || "KURUKSHETRA, HARYANA"}</div>
    </div>

    <!-- Title Block -->
    <div class="doc-title-block">
      <h2 class="doc-main-title">${info.title}</h2>
      <p class="doc-sub-title">${info.subtitle}</p>
    </div>

    <!-- Dispatch & Issue Date -->
    <div class="meta-grid">
      <div class="meta-item">
        <strong>Dispatch No:</strong>
        <span>${formData.dispatchNo || "HP/KKR/CT/2026/NTC-01"}</span>
      </div>
      <div class="meta-item">
        <strong>Date of Issue:</strong>
        <span>${formData.issueDate || new Date().toISOString().split("T")[0]}</span>
      </div>
      <div class="meta-item">
        <strong>Complaint Ref:</strong>
        <span>${formData.complaintNo || "HAR-KKR-2026-CMP-001"}</span>
      </div>
      <div class="meta-item">
        <strong>Complainant:</strong>
        <span>${formData.complainantName || "State / Citizen"}</span>
      </div>
    </div>

    <!-- Noticee Address Block -->
    <div class="party-box" style="margin-bottom: 18px; border-left: 4px solid #0b192c;">
      <div class="party-header complainant">&#9632; TO (PERSON CONCERNED / NOTICEE):</div>
      <div class="party-field" style="font-size: 11pt;"><strong>Name:</strong> <b>${formData.noticeeName || "N/A"}</b></div>
      <div class="party-field"><strong>Father's / Spouse's Name:</strong> ${formData.noticeeFather || "N/A"}</div>
      <div class="party-field"><strong>Residential Address:</strong> ${formData.noticeeAddress || "N/A"}</div>
      <div class="party-field"><strong>Contact Mobile:</strong> ${formData.noticeePhone || "N/A"}</div>
      <div class="party-field"><strong>Capacity / Status:</strong> <span class="badge-tag">${formData.noticeeRole || "Noticee"}</span></div>
    </div>

    <!-- Reference / Allegations -->
    <div class="section-block">
      <div class="section-label">SUBJECT MATTER & GIST OF ALLEGATIONS / ENQUIRY</div>
      <div class="section-content" style="background-color: #f1f5f9;">
        <b>Subject / Allegations:</b> ${formData.allegationsBrief || "Verification of facts"}<br/>
        <b>Sections of Law:</b> ${formData.sectionsOfLaw || "Section 173(3) BNSS"}<br/>
        <b>Date of Alleged Incident:</b> ${formData.incidentDate || "N/A"}
      </div>
    </div>

    <!-- Mandate & Appearance Schedule -->
    <div class="section-block">
      <div class="section-label">MANDATE OF ATTENDANCE & INSTRUCTIONS</div>
      <div class="section-content highlight" style="line-height: 1.7;">
        ${info.mandateText}<br/><br/>
        <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt;">
          <tr>
            <td style="padding: 4px 8px; font-weight: bold; width: 160px; color: #475569;">Date of Appearance:</td>
            <td style="padding: 4px 8px; font-weight: 800; color: #0b192c;">${formData.appearanceDate || "Forthwith / As directed"}</td>
          </tr>
          <tr>
            <td style="padding: 4px 8px; font-weight: bold; color: #475569;">Time of Appearance:</td>
            <td style="padding: 4px 8px; font-weight: 800; color: #0b192c;">${formData.appearanceTime || "11:00 AM"}</td>
          </tr>
          <tr>
            <td style="padding: 4px 8px; font-weight: bold; color: #475569;">Place of Appearance:</td>
            <td style="padding: 4px 8px; font-weight: 800; color: #0b192c;">${formData.appearancePlace || "Police Station City Thanesar"}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Documents to be produced -->
    ${formData.documentsRequired ? `
    <div class="section-block">
      <div class="section-label">DOCUMENTS / RECORDS REQUIRED TO BE PRODUCED</div>
      <div class="section-content">${formData.documentsRequired}</div>
    </div>
    ` : ""}

    <!-- Statutory Warning -->
    <div class="section-block">
      <div class="section-label">LEGAL NOTICE & STATUTORY CONSEQUENCE OF NON-COMPLIANCE</div>
      <div class="section-content" style="background-color: #fef2f2; border-color: #fecaca; color: #991b1b; font-size: 8.5pt;">
        TAKE NOTICE that failure to comply with the terms of this notice without reasonable cause will render you liable for legal action under Section 35(4) / 35(5) of Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023, and may result in your arrest upon issuance of orders by the competent Court, as well as prosecution under Section 221 of Bharatiya Nyaya Sanhita (BNS), 2023.
      </div>
    </div>

    <!-- Officer Signatures Block -->
    <div class="signatures-row">
      <div class="seal-box">
        <div class="seal-stamp">Police Station Seal</div>
        <div class="seal-label">OFFICIAL STATION SEAL</div>
      </div>
      <div class="officer-block">
        <div class="officer-name">${formData.officerName || "Surender Pal"}</div>
        <div>${formData.officerRank || "Assistant Sub-Inspector (ASI)"}</div>
        <div style="font-family: monospace; color: #475569;">${formData.officerPno || "PNO-23841"}</div>
        <div>Mobile: ${formData.officerPhone || "9812000000"}</div>
        <div class="officer-role">Issuing Enquiry Officer</div>
      </div>
    </div>

    <!-- Service / Acknowledgment Return Memo -->
    <div class="sho-endorsement">
      <div class="sho-header">
        <span>SERVICE RETURN & ACKNOWLEDGMENT MEMO</span>
        <span style="font-size: 8pt; color: #64748b;">(For Police Station MHC Records)</span>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 8.5pt; margin-top: 10px;">
        <div style="border: 1px dashed #cbd5e1; padding: 10px; border-radius: 6px;">
          <b>Served By (Police Official):</b><br/>
          Name: ${formData.mhcName || "HC Devinder Kumar"}<br/>
          Rank / Belt: ${formData.mhcRank || "Head Constable"} (${formData.mhcBeltNumber || "889/KKR"})<br/>
          Date & Time of Service: ____-____-2026 at ____:____ hrs<br/>
          Signature of Process Server: ____________________
        </div>
        <div style="border: 1px dashed #cbd5e1; padding: 10px; border-radius: 6px;">
          <b>Acknowledgment of Recipient:</b><br/>
          I have received a copy of this notice in person.<br/>
          Signature / Thumb Impression: ____________________<br/>
          Date & Time: ____-____-2026 at ____:____ hrs<br/>
          Mobile No: ${formData.noticeePhone || "____________________"}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
