// High-fidelity HTML & Print Generators for Haryana Police Official Legal Documents & Enquiry Reports
import { PoliceReportFormData, NoticeFormData, DynamicDocumentSection } from "@/types";

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
  .section-content.danger {
    background-color: #fef2f2;
    border-color: #fecaca;
    color: #991b1b;
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
  categoryKey: string,
  customSections?: DynamicDocumentSection[],
  customTitle?: { title?: string; subtitle?: string }
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

  const defaultTitleInfo = categoryTitles[categoryKey] || {
    title: "OFFICIAL ENQUIRY REPORT & FINDINGS DOCKET",
    subtitle: "INVESTIGATION REPORT UNDER BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023",
  };

  const titleInfo = {
    title: customTitle?.title || defaultTitleInfo.title,
    subtitle: customTitle?.subtitle || defaultTitleInfo.subtitle,
  };

  const bodySectionsHtml = (customSections && customSections.length > 0)
    ? customSections.map((sec) => `
    <div class="section-block">
      <div class="section-label">${sec.title}</div>
      <div class="section-content ${sec.variant === "highlight" ? "highlight" : sec.variant === "danger" ? "danger" : ""}">${sec.content}</div>
    </div>
    `).join("\n")
    : `
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
    `;

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

    ${bodySectionsHtml}

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
  templateType: string,
  customSections?: DynamicDocumentSection[],
  customTitle?: { title?: string; subtitle?: string }
): string {
  // 1. SPECIFIC LAYOUT: Haryana Police Appearance Notice (हरियाणा पुलिस सूचना-पत्र)
  if (templateType === "haryana_notice") {
    const fAny = formData as any;
    const borderCss = fAny.borderStyle === "none"
      ? "border: none !important; box-shadow: none !important;"
      : fAny.borderStyle === "double"
      ? "border: 4px double #000 !important;"
      : fAny.borderStyle === "light"
      ? "border: 1px solid #cbd5e1 !important;"
      : "border: 2px solid #000;";
    const fontCss = fAny.fontSize === "compact"
      ? "font-size: 10.5pt !important; line-height: 1.5 !important;"
      : fAny.fontSize === "large"
      ? "font-size: 13pt !important; line-height: 1.9 !important;"
      : "";

    const districtText = formData.district
      ? (formData.district.startsWith("जिला") ? formData.district : `जिला ${formData.district}`)
      : "जिला अम्बाला";
    const districtFormatted = districtText.endsWith("।") ? districtText : `${districtText}।`;

    return `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${formData.docTitle || "सूचना-पत्र"} - हरियाणा पुलिस</title>
  <style>
    ${BASE_DOC_STYLES}
    body {
      font-family: 'Nirmala UI', 'Mangal', 'Arial Unicode MS', sans-serif;
      margin: 0;
      padding: 24px;
      color: #000;
      background: #fff;
      font-size: 11.5pt;
      line-height: 1.7;
      ${fontCss}
    }
    .doc-sheet {
      max-width: 820px;
      margin: 0 auto;
      padding: 40px 48px;
      background: #fff;
      ${borderCss}
    }
    .top-header {
      text-align: center;
      margin-bottom: 24px;
    }
    .main-title {
      font-size: 17pt;
      font-weight: 900;
      text-decoration: underline;
      text-underline-offset: 4px;
      letter-spacing: 0.5px;
    }
    .sub-title {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      margin: 22px 0 22px 0;
    }
    .body-para {
      text-indent: 48px;
      text-align: justify;
      margin: 18px 0;
      line-height: 1.8;
      font-size: 11.5pt;
    }
    .dotted-fill {
      font-weight: bold;
      padding: 0 4px;
    }
    .annexure-line {
      margin: 24px 0 36px 0;
      font-size: 11.5pt;
      font-weight: bold;
    }
    .bottom-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 36px;
      font-size: 11.5pt;
    }
    .bottom-table td {
      vertical-align: top;
    }
    @media print {
      body { padding: 0; }
      .doc-sheet { border: none !important; box-shadow: none !important; padding: 15mm 20mm; }
    }
  </style>
</head>
<body>
  <div class="doc-sheet">
    <!-- शीर्ष हेडिंग: हरियाणा पुलिस (केंद्रित, रेखांकित) -->
    <div class="top-header">
      <span class="main-title">हरियाणा पुलिस</span>
    </div>

    <!-- थाना/यूनिट एवं जिला अम्बाला। पंक्ति -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 12pt; font-weight: bold;">
      <tr>
        <td style="width: 60%; text-align: left;">
          थाना/यूनिट <span class="dotted-fill">${formData.policeStation || "............................................"}</span>
        </td>
        <td style="width: 40%; text-align: right;">
          ${districtFormatted}
        </td>
      </tr>
    </table>

    <!-- मुख्य शीर्षक: सूचना-पत्र -->
    <div class="sub-title">
      सूचना-पत्र
    </div>

    <!-- क्रमांक एवं दिनांक -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 11.5pt;">
      <tr>
        <td style="width: 50%; text-align: left;">
          क्रमांक <span class="dotted-fill">${formData.dispatchNo || ".................."}</span>
        </td>
        <td style="width: 50%; text-align: left; padding-left: 20px;">
          दिनांक <span class="dotted-fill">${formData.issueDate || "................."}</span>
        </td>
      </tr>
    </table>

    <!-- पैरा 1: परिवादी एवं शिकायत प्राप्ति विवरण -->
    <p class="body-para">
      आपको इस नोटिस के माध्यम से सूचित किया जाता है कि परिवादी <span class="dotted-fill">${formData.complainantName || "..................."}</span> वासी <span class="dotted-fill">${formData.complainantAddress || "...................................................."}</span> से शिकायत संख्या <span class="dotted-fill">${formData.complaintNo || "..................................."}</span> दिनांक <span class="dotted-fill">${formData.incidentDate || "............................."}</span> को थाना/यूनिट <span class="dotted-fill">${formData.policeStation || "...................................................."}</span> में प्राप्त हुई है। (छायाप्रति साथ संलग्न है)
    </p>

    <!-- पैरा 2: उपस्थिति निर्देश -->
    <p class="body-para">
      इसलिये आप <span class="dotted-fill">${formData.noticeeName ? `${formData.noticeeName}${formData.noticeeFather ? ` पुत्र/सुपुत्र ${formData.noticeeFather}` : ""}${formData.noticeeAddress ? ` वासी ${formData.noticeeAddress}` : ""}` : "....................................................................................."}</span> को निर्देश दिये जाते है कि आप दिनांक <span class="dotted-fill">${formData.appearanceDate || "............................."}</span> को थाना/यूनिट <span class="dotted-fill">${formData.appearancePlace || formData.policeStation || "................................."}</span> में समय <span class="dotted-fill">${formData.appearanceTime || "........................"}</span> पर प्रारम्भिक जांच में सभी प्रासंगिक दस्तावेजो, साक्ष्यों और रिकार्ड सहित व्यक्तिगत तौर पर या अपने प्रतिनिधि के माध्यम से शामिल होवें।
    </p>

    <!-- पैरा 3: वीडियो कॉन्फ्रेंसिंग का विकल्प -->
    <p class="body-para">
      शिकायत की जांच के सम्बन्ध में यदि आप अपनी उपस्थिति को वीडियो कान्फ्रेंस के माध्यम से चाहते है तो इस थाना/यूनिट की ई.मेल आई.डी. <span class="dotted-fill">${formData.stationEmail || formData.officerEmail || "..................................................................................................."}</span> पर लिखित निवेदन दिनांक <span class="dotted-fill">${formData.videoConferenceDeadline || formData.appearanceDate || "............................."}</span> से पहले भेजना सुनिश्चित करें।
    </p>

    <!-- पैरा 4: वैधानिक स्पष्टीकरण (एफआईआर अंकित नहीं / गिरफ्तारी नहीं) -->
    <p class="body-para">
      इस नोटिस के सम्बन्ध में आपको यह भी स्पष्ट किया जाता है कि यह नोटिस केवल शिकायत की जांच के सम्बन्ध में जारी किया गया है। अभी तक आपके विरुद्ध कोई भी प्रथम सूचना रिपोर्ट अंकित नहीं की गई है और शिकायत की जांच के दौरान आपको गिरफ्तार नहीं किया जायेगा।
    </p>

    <!-- संलग्नक -->
    <div class="annexure-line">
      संलग्न :- &nbsp;&nbsp;शिकायत की छायाप्रति।
    </div>

    <!-- हस्ताक्षर एवं मोहर तालिका -->
    <table class="bottom-table">
      <tr>
        <td style="width: 45%; vertical-align: top; padding-top: 10px;">
          <b>थाना/यूनिट की मोहर</b>
          <div style="margin-top: 60px; color: #94a3b8; font-size: 9pt;">
            &nbsp;
          </div>
        </td>
        <td style="width: 55%; vertical-align: top; line-height: 2.1;">
          जांच अधिकारी के हस्ताक्षर <span class="dotted-fill">.................................</span><br/>
          नाम व पद <span class="dotted-fill">${formData.officerName || ".................................................."} ${formData.officerRank ? `, ${formData.officerRank}` : ""}</span><br/>
          थाना/यूनिट <span class="dotted-fill">${formData.policeStation || "................................................."}</span><br/>
          मोबाईल नम्बर <span class="dotted-fill">${formData.officerPhone || "............................................."}</span><br/>
          ई.मेल आई.डी. <span class="dotted-fill">${formData.officerEmail || formData.stationEmail || "................................................"}</span>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
  }

  // 2. SPECIFIC LAYOUT: CDR & Digital Evidence Requisition Form (Haryana Police Official Proforma बाबत काल डिटेल)
  if (templateType === "cdr_requisition") {
    const fAny = formData as any;
    const targetRows: any[] = Array.isArray(fAny.cdrRows) && fAny.cdrRows.length > 0
      ? fAny.cdrRows
      : [
          { id: "1", phone: formData.noticeePhone || "", periodFrom: formData.appearanceDate || "", periodTo: formData.issueDate || "", reason: formData.documentsRequired || "" },
          { id: "2", phone: "", periodFrom: "", periodTo: "", reason: "" },
          { id: "3", phone: "", periodFrom: "", periodTo: "", reason: "" },
          { id: "4", phone: "", periodFrom: "", periodTo: "", reason: "" },
          { id: "5", phone: "", periodFrom: "", periodTo: "", reason: "" },
          { id: "6", phone: "", periodFrom: "", periodTo: "", reason: "" },
          { id: "7", phone: "", periodFrom: "", periodTo: "", reason: "" },
        ];

    const borderCss = fAny.borderStyle === "none"
      ? "border: none !important; box-shadow: none !important;"
      : fAny.borderStyle === "double"
      ? "border: 4px double #000 !important;"
      : fAny.borderStyle === "light"
      ? "border: 1px solid #cbd5e1 !important;"
      : "border: 2px solid #000;";
    const fontCss = fAny.fontSize === "compact"
      ? "font-size: 10pt !important; line-height: 1.35 !important;"
      : fAny.fontSize === "large"
      ? "font-size: 13pt !important; line-height: 1.6 !important;"
      : "";

    return `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${formData.docTitle || "प्रारुप बाबत काल डिटेल"} - HARYANA POLICE</title>
  <style>
    ${BASE_DOC_STYLES}
    body {
      font-family: 'Nirmala UI', 'Mangal', 'Arial Unicode MS', sans-serif;
      margin: 0;
      padding: 20px;
      color: #000;
      background: #fff;
      font-size: 11pt;
      line-height: 1.5;
      ${fontCss}
    }
    .doc-sheet {
      max-width: 850px;
      margin: 0 auto;
      padding: 30px;
      background: #fff;
      ${borderCss}
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .header-table td {
      vertical-align: top;
      padding: 2px 4px;
    }
    .case-row-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 14px 0;
      font-weight: bold;
    }
    .case-row-table td {
      padding: 4px 6px;
      font-size: 11pt;
    }
    .body-para {
      text-indent: 40px;
      margin: 8px 0 14px 0;
      line-height: 1.6;
    }
    table.proforma-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0 12px 0;
      border: 1.5px solid #000;
      font-size: 9.5pt;
    }
    table.proforma-table th, table.proforma-table td {
      border: 1px solid #000;
      padding: 6px 6px;
    }
    table.proforma-table th {
      font-weight: bold;
      text-align: center;
      vertical-align: middle;
      background-color: #fafafa;
    }
    .declarations {
      margin-top: 10px;
      font-size: 9pt;
      line-height: 1.5;
      font-weight: 500;
    }
    .sig-table {
      width: 100%;
      margin-top: 25px;
      border-collapse: collapse;
    }
    .sig-table td {
      vertical-align: top;
      font-size: 9.5pt;
      line-height: 1.6;
    }
    @media print {
      body { padding: 0; }
      .doc-sheet { border: none !important; box-shadow: none !important; padding: 12mm; }
    }
  </style>
</head>
<body>
  <div class="doc-sheet">
    <!-- Header: Left, Center, Right -->
    <table class="header-table">
      <tr>
        <td style="width: 33%; font-weight: bold; font-size: 12pt;">
          ${formData.policeStation || "थाना शहर पानीपत"}
        </td>
        <td style="width: 34%; text-align: center; font-weight: bold; font-size: 13pt;">
          ${formData.docTitle || "प्रारुप बाबत काल डिटेल"}
        </td>
        <td style="width: 33%; text-align: right; font-size: 11pt; line-height: 1.4;">
          <b>${formData.district ? (formData.district.startsWith("जिला") ? formData.district : `जिला ${formData.district}`) : "जिला पानीपत"}</b><br/>
          नम्बर- ${formData.dispatchNo || "............"}<br/>
          दिनांक- ${formData.issueDate || ".........."}
        </td>
      </tr>
    </table>

    <!-- Case Details Row: अभियोग संख्या, दिनांक, धारा, थाना शहर पानीपत -->
    <table class="case-row-table">
      <tr>
        <td style="width: 25%;">अभियोग संख्या: <span>${formData.complaintNo || "........"}</span></td>
        <td style="width: 25%;">दिनांक: <span>${formData.incidentDate || "........"}</span></td>
        <td style="width: 25%;">धारा: <span>${formData.sectionsOfLaw || "........"}</span></td>
        <td style="width: 25%; text-align: right;">${formData.policeStation || "थाना शहर पानीपत"}</td>
      </tr>
    </table>

    <!-- सेवा में, पुलिस अधीक्षक पानीपत। -->
    <div style="margin-top: 12px; font-size: 11pt;">
      <b>सेवा में,</b><br/>
      <div style="padding-left: 36px; font-weight: bold; margin-top: 4px;">
        ${formData.toAuthority || "पुलिस अधीक्षक पानीपत।"}
      </div>
    </div>

    <!-- श्रीमान जी, निवेदन है कि... -->
    <div style="margin-top: 14px; font-size: 11pt;">
      <b>श्रीमान जी,</b><br/>
      <div class="body-para">
        ${formData.allegationsBrief || "निवेदन है कि उपरोक्त अभियोग में निम्नलिखित मोबाईल फोन की काल डिटेल व कैफ आई0डी0/आई.एम.ई.आई. की सर्चिंग की आवश्यकता है। उपलब्ध करवायी जावे।"}
      </div>
    </div>

    <!-- Proforma Table -->
    <table class="proforma-table">
      <thead>
        <tr>
          <th rowspan="2" style="width: 5%;">क्र.स.</th>
          <th rowspan="2" style="width: 32%;">मोबाईल फोन/ आई.एम.ई.आई. / आई पी/ व्हाटसअप नम्बर जिनकी डिटेल की आवश्यकता है</th>
          <th colspan="2" style="width: 25%;">समय अवधि</th>
          <th rowspan="2" style="width: 38%;">अभियोग का विवरण एवं डाटा किस कारण से जरूरी है संक्षिप्त विवरण</th>
        </tr>
        <tr>
          <th style="width: 12.5%;">कब से</th>
          <th style="width: 12.5%;">कब तक</th>
        </tr>
      </thead>
      <tbody>
        ${targetRows.map((r: any, idx: number) => `
          <tr>
            <td style="text-align: center; font-weight: bold; height: 26px;">${idx + 1}</td>
            <td style="font-weight: bold; font-family: monospace;">${r.phone || ""}</td>
            <td style="text-align: center;">${r.periodFrom || r.period || ""}</td>
            <td style="text-align: center;">${r.periodTo || ""}</td>
            <td>${r.reason || r.details || ""}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <!-- Declarations (Exact English Legal Text from Image) -->
    <div class="declarations">
      <div><b>1.</b> The Subscriber identity has been ascertained and it is ensured that person in question is not someone whose call details are of sensitive nature.</div>
      <div style="margin-top: 3px;"><b>2.</b> The number is not subscribed in the name of a sitting MP/MLA/MLC &amp; Governor.</div>
    </div>

    <!-- Signatures: IO on Right, SHO & Supervisory Officer Forwarding on Left/Center -->
    <table class="sig-table">
      <tr>
        <td style="width: 50%;"></td>
        <td style="width: 50%; text-align: left; padding-left: 60px;">
          <b>हस्ताक्षर अनुसंधान अधिकारी</b><br/>
          नाम- ${formData.officerName || "................................"}<br/>
          रैन्क- ${formData.officerRank || "..............................."}<br/>
          फोन न0- ${formData.officerPhone || "..........................."}<br/>
          थाना/यूनिट- ${formData.policeStation || "...................."}
        </td>
      </tr>
      <tr>
        <td style="width: 50%; padding-top: 25px;">
          <b>अग्रेषित</b><br/>
          <b>${formData.shoName || "प्रबंधक अफसर"}</b>
        </td>
        <td style="width: 50%;"></td>
      </tr>
      <tr>
        <td colspan="2" style="text-align: center; padding-top: 30px;">
          <b>अग्रेषित</b><br/>
          <b>${formData.supervisoryOfficerName || "पर्यवेक्षण अधिकारी"}</b>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
  }

  // 2. SPECIFIC LAYOUT: Arrest & Surrender Memo Form 26.8(1) - 4 Pages Official Haryana Police Format
  if (templateType === "arrest_memo") {
    const fAny = formData as any;
    const borderCss = fAny.borderStyle === "none"
      ? "border: none !important; box-shadow: none !important;"
      : fAny.borderStyle === "double"
      ? "border: 4px double #000 !important;"
      : fAny.borderStyle === "light"
      ? "border: 1px solid #cbd5e1 !important;"
      : "border: 1.5px solid #000;";
    const fontCss = fAny.fontSize === "compact"
      ? "font-size: 9.5pt !important; line-height: 1.4 !important;"
      : fAny.fontSize === "large"
      ? "font-size: 11pt !important; line-height: 1.65 !important;"
      : "";

    const witnesses = formData.arrestWitnesses && formData.arrestWitnesses.length > 0
      ? formData.arrestWitnesses
      : [
          { id: "w1", srNo: "1", name: "", address: "", signature: "" },
          { id: "w2", srNo: "2", name: "", address: "", signature: "" },
          { id: "w3", srNo: "3", name: "", address: "", signature: "" },
        ];

    const jtItems = formData.jamaTalashiItems && formData.jamaTalashiItems.length > 0
      ? formData.jamaTalashiItems
      : [
          { id: "jt1", srNo: "1.", description: "", quantity: "" },
          { id: "jt2", srNo: "2.", description: "", quantity: "" },
          { id: "jt3", srNo: "3.", description: "", quantity: "" },
        ];

    return `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>गिरफ्तारी/ न्यायालय में समर्पण फार्म 26.8(1) - ${formData.noticeeName || "अभियुक्त"}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Nirmala UI', 'Mangal', 'Segoe UI', Arial, sans-serif;
      color: #000;
      background-color: #f1f5f9;
      line-height: 1.5;
      font-size: 10pt;
      margin: 0;
      padding: 20px 10px;
      ${fontCss}
    }
    .page-sheet {
      max-width: 820px;
      margin: 0 auto 30px auto;
      background: #ffffff;
      ${borderCss}
      padding: 34px 44px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      position: relative;
    }
    .page-version-tag {
      text-align: right;
      font-size: 9pt;
      font-weight: bold;
      color: #000;
      margin-bottom: 6px;
      font-family: Arial, sans-serif;
    }
    .header-center-title {
      text-align: center;
      font-weight: bold;
      line-height: 1.35;
      margin-bottom: 16px;
    }
    .header-center-title .h-main {
      font-size: 12.5pt;
    }
    .header-center-title .h-sub {
      font-size: 11pt;
    }
    .header-center-title .h-note {
      font-size: 9.5pt;
      font-weight: normal;
    }
    .point-row {
      margin-bottom: 7px;
      line-height: 1.6;
    }
    .fill {
      font-weight: bold;
      color: #000;
      padding: 0 3px;
    }
    .sub-point {
      margin-left: 20px;
      margin-bottom: 5px;
      line-height: 1.6;
    }
    table.grid-tbl {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #000;
      margin: 6px 0 10px 0;
      font-size: 9pt;
    }
    table.grid-tbl th, table.grid-tbl td {
      border: 1px solid #000;
      padding: 4px 6px;
      vertical-align: middle;
      text-align: center;
    }
    table.grid-tbl th {
      font-weight: bold;
      background-color: #f8fafc;
    }
    .sig-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 18px;
      font-size: 9.5pt;
    }
    .sig-table td {
      vertical-align: top;
      padding: 2px 0;
    }
    .photo-box {
      width: 110px;
      height: 125px;
      border: 1.5px solid #000;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 9pt;
      font-weight: bold;
      line-height: 1.3;
      padding: 4px;
    }
    .page-break {
      page-break-after: always;
      break-after: page;
      height: 0;
      margin: 0;
      border: none;
    }
    @media print {
      body {
        padding: 0;
        background: none;
      }
      .page-sheet {
        border: none !important;
        box-shadow: none !important;
        padding: 10mm 15mm !important;
        margin: 0 auto !important;
        min-height: 100vh;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- ========================================================================= -->
  <!-- PAGE 1: गिरफ्तारी/ न्यायालय में समर्पण फार्म - भाग-1 - फार्म संख्या 26.8(1)     -->
  <!-- ========================================================================= -->
  <div class="page-sheet">
    <div class="page-version-tag">v3.0 dt 07.04.2025</div>

    <div class="header-center-title">
      <div class="h-main">गिरफ्तारी/ न्यायालय में समर्पण फार्म</div>
      <div class="h-sub">भाग-1</div>
      <div class="h-sub">फार्म संख्या 26.8(1)</div>
      <div class="h-note">(प्रत्येक अभियुक्त के लिए अलग अलग फार्म)</div>
    </div>

    <!-- 1. जिला थाना वर्ष / FIR संख्या -->
    <div class="point-row">
      <b>1.</b> &nbsp;&nbsp;
      जिला <span class="fill">${formData.district || "...................................."}</span>
      थाना <span class="fill">${formData.policeStation || "...................................."}</span>
      वर्ष <span class="fill">${formData.arrestYear || "................"}</span>
      <div style="padding-left: 24px; margin-top: 3px;">
        FIR/ रोजनामचा रपट संख्या <span class="fill">${formData.complaintNo || "...................................."}</span>
        दिनांक <span class="fill">${formData.issueDate || formData.incidentDate || "...................................."}</span>
      </div>
    </div>

    <!-- 2. गिरफ्तारी / आत्म समर्पण तिथि व समय -->
    <div class="point-row" style="margin-top: 8px;">
      <b>2.</b> &nbsp;&nbsp;
      गिरफ्तारी/ आत्म समर्पण की तिथि व समय : &nbsp;&nbsp;
      दिनांक <span class="fill">${formData.arrestDate || "................................"}</span> &nbsp;&nbsp;
      समय <span class="fill">${formData.arrestTime || "................................"}</span>
      <div style="padding-left: 24px; margin-top: 3px;">
        रोजनामचा रपट संख्या <span class="fill">${formData.arrestGdNo || "...................................."}</span> &nbsp;&nbsp;
        गिरफ्तारी का स्थान <span class="fill">${formData.arrestPlace || "................................................................"}</span>
      </div>
      <div style="padding-left: 24px; margin-top: 3px;">
        <span class="fill">${formData.arrestPlaceContinuation || "...................................................."}</span>
        थाना <span class="fill">${formData.arrestPoliceStation || formData.policeStation || "................................"}</span>
        जिला <span class="fill">${formData.arrestDistrict || formData.district || "................................"}</span>
      </div>
    </div>

    <!-- 3. न्यायालय का नाम -->
    <div class="point-row" style="margin-top: 8px;">
      <b>3.</b> &nbsp;&nbsp;
      न्यायालय का नाम ( यदि आत्मसमर्पण किया हो) &nbsp;
      <span class="fill">${formData.courtNameSurrender || "................................................................................................"}</span>
    </div>

    <!-- 4. अधिनियम एवं धाराएं -->
    <div class="point-row" style="margin-top: 8px;">
      <b>4.</b> &nbsp;&nbsp;
      अधिनियम एंव धाराएं &nbsp;
      <span class="fill">${formData.sectionsOfLaw || "................................................................................................"}</span>
    </div>

    <!-- 5. गिरफ्तार व्यक्ति का विवरण -->
    <div class="point-row" style="margin-top: 8px;">
      <b>5.</b> &nbsp;&nbsp;
      <b>गिरफ्तार व्यक्ति का विवरण :-</b>
      <div class="sub-point">
        (i) &nbsp;&nbsp; नाम <span class="fill">${formData.noticeeName || "...................................."}</span>
      </div>
      <div class="sub-point">
        (ii) &nbsp; पिता/पति/संरक्षक का नाम <span class="fill">${formData.noticeeFather || "...................................................."}</span>
      </div>
      <div class="sub-point">
        (iii) प्रथम उपनाम <span class="fill">${formData.noticeeAlias1 || "...................................."}</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        (iv) द्वितीय उपनाम <span class="fill">${formData.noticeeAlias2 || "...................................."}</span>
      </div>
      <div class="sub-point">
        (v) &nbsp; राष्ट्रीयता <span class="fill">${formData.noticeeNationality || "...................................."}</span> &nbsp;&nbsp;&nbsp;&nbsp;
        (vi) (क) मतदाता या अन्य पहचान पत्र संख्या <span class="fill">${formData.voterOrIdCardNo || "...................................."}</span>
      </div>
      <div class="sub-point" style="padding-left: 32px;">
        (ख) पासपोर्ट संख्या <span class="fill">${formData.passportNo || "................................"}</span> &nbsp;&nbsp;&nbsp;&nbsp;
        (ग) जारी करने की तिथि <span class="fill">${formData.passportIssueDate || "................................"}</span>
      </div>
      <div class="sub-point" style="padding-left: 32px;">
        (घ) जारी करने का स्थान <span class="fill">${formData.passportIssuePlace || "................................................................"}</span>
      </div>
      <div class="sub-point">
        (vii) धर्म <span class="fill">${formData.religion || "...................................."}</span>
      </div>
      <div class="sub-point">
        (viii) अनुसूचित जाति/अनुसूचित जनजाति/ अन्य पिछड़ा वर्ग/ सामान्य <span class="fill">${formData.categoryCaste || "...................................."}</span>
      </div>
      <div class="sub-point">
        (ix) व्यवसाय <span class="fill">${formData.occupation || "...................................."}</span>
      </div>
      <div class="sub-point">
        (x) &nbsp; स्थाई पता <span class="fill">${formData.permanentAddress || formData.noticeeAddress || "................................................................................................"}</span>
      </div>
      <div class="sub-point">
        (xi) वर्तमान पता <span class="fill">${formData.currentAddress || formData.noticeeAddress || "................................................................................................"}</span>
      </div>
      <div class="sub-point">
        (xii) मोबाईल नम्बर <span class="fill">${formData.mobileNo || formData.noticeePhone || "................................"}</span> &nbsp;&nbsp;&nbsp;&nbsp;
        (xiii) फोन नम्बर <span class="fill">${formData.phoneNo || "................................"}</span>
      </div>
      <div class="sub-point">
        (xiv) उपयोगकर्ता पहचान संख्या <span class="fill">${formData.userIdentificationNo || formData.accusedAadhaar || "................................"}</span> &nbsp;&nbsp;&nbsp;&nbsp;
        (xv) स्थाई खाता संख्या <span class="fill">${formData.panNo || formData.accusedPan || "...................................."}</span>
      </div>
    </div>

    <!-- 6. शारीरिक दशा / चोट विवरण -->
    <div class="point-row" style="margin-top: 8px;">
      <b>6.</b> &nbsp;&nbsp;
      गिरफ्तार व्यक्ति की शारीरिक दशा/ यदि कोई चोट लगी हो तो चोट तथा उसके कारण /कारणों का विवरण (यदि डाक्टरी जांच करवाई गई हो तो उल्लेख करे)
      <div style="padding-left: 24px; margin-top: 2px;">
        <span class="fill">${formData.physicalConditionOrInjuries || "................................................................................................................................................"}</span>
      </div>
    </div>

    <!-- 7. गिरफ्तारी का कारण एवं हिरासत विवरण -->
    <div class="point-row" style="margin-top: 8px;">
      <b>7.</b> &nbsp;&nbsp;
      गिरफ्तार व्यक्ति को उसकी गिरफ्तार का कारण और उसके कानूनी अधिकार को बताते हुए दिनांक
      <span class="fill">${formData.custodyDate || formData.arrestDate || "................................"}</span>
      समय <span class="fill">${formData.custodyTime || formData.arrestTime || "...................."}</span>
      स्थान <span class="fill">${formData.custodyPlace || formData.arrestPlace || "...................................................."}</span>
      से हिरासत में लिया गया।
    </div>

    <!-- 8. गवाहों के नाम और पता (कम से कम दो गवाह आवश्यक हैं) -->
    <div class="point-row" style="margin-top: 8px;">
      <b>8.</b> &nbsp;&nbsp;
      <b>गवाहो के नाम और पता (कम से कम दो गवाह आवश्यक हैं) -</b>
      <table class="grid-tbl">
        <thead>
          <tr>
            <th style="width: 10%;">क्र.स.</th>
            <th style="width: 32%;">नाम</th>
            <th style="width: 38%;">पता</th>
            <th style="width: 20%;">हस्ताक्षर</th>
          </tr>
        </thead>
        <tbody>
          ${witnesses.map((w, idx) => `
            <tr>
              <td>${w.srNo || idx + 1}</td>
              <td style="text-align: left; padding-left: 8px;">${w.name || "&nbsp;"}</td>
              <td style="text-align: left; padding-left: 8px;">${w.address || "&nbsp;"}</td>
              <td>${w.signature || "&nbsp;"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ========================================================================= -->
  <!-- PAGE 2: वारसान, परिवार विवरण, धारा 47 BNSS आधार, जामा तलाशी                 -->
  <!-- ========================================================================= -->
  <div class="page-sheet">
    <!-- 9. वारसान को सूचना -->
    <div class="point-row" style="margin-top: 10px;">
      <b>9.</b> &nbsp;&nbsp;
      वारसान <span class="fill">${formData.relativeName || "...................................................."}</span>
      सम्बन्ध <span class="fill">${formData.relativeRelation || "...................................."}</span>
      दिनांक <span class="fill">${formData.intimationDate || "................................"}</span>
      <div style="padding-left: 24px; margin-top: 3px;">
        समय पर <span class="fill">${formData.intimationTime || "...................."}</span>
        मोबाईल नम्बर <span class="fill">${formData.relativeMobile || "...................................."}</span>
        पर सूचना दी गई।
      </div>
    </div>

    <!-- 10. आरोपी के पारिवारिक सदस्यों का विवरण -->
    <div class="point-row" style="margin-top: 14px;">
      <b>10.</b> &nbsp;
      <b>आरोपी के पारिवारिक सदस्यो का विवरण</b>
      <div class="sub-point" style="margin-top: 4px;">
        (i) &nbsp;&nbsp; <span class="fill">${formData.familyMember1 || "................................................................................................................................"}</span>
      </div>
      <div class="sub-point">
        (ii) &nbsp; <span class="fill">${formData.familyMember2 || "................................................................................................................................"}</span>
      </div>
      <div class="sub-point">
        (iii) <span class="fill">${formData.familyMember3 || "................................................................................................................................"}</span>
      </div>
    </div>

    <!-- 11. आरोपी के गिरफ्तारी करने के आधार (47 BNSS) -->
    <div class="point-row" style="margin-top: 14px;">
      <b>11.</b> &nbsp;
      <b>आरोपी के गिरफ्तारी करने के आधार (47 BNSS) –</b>
      <div class="sub-point" style="margin-top: 4px;">
        (क) धाराएं जिनके तहत आरोपी द्वारा अपराध किया गया है &nbsp;
        <span class="fill">${formData.grounds47Sections || formData.sectionsOfLaw || "................................................................................................"}</span>
      </div>
      <div class="sub-point">
        (ख) इन अपराधों में आरोपी की विशिष्ट भूमिका &nbsp;
        <span class="fill">${formData.grounds47Role || "........................................................................................................"}</span>
      </div>
      <div class="sub-point">
        (ग) इन अपराधों में अपराधी की संलिप्ता बारे आधार (जैसे कि प्रत्यक्षदर्शी का ब्यान, BNSS 180/183 का ब्यान, CCTV/ Audio Recording, बरामदगी, फर्द इंक्साफ इत्यादि) &nbsp;
        <span class="fill">${formData.grounds47Evidence || "........................................................................................................"}</span>
      </div>
      <div class="sub-point">
        (घ) अन्य आधार &nbsp;
        <span class="fill">${formData.grounds47Other || "................................................................................................................................"}</span>
      </div>
    </div>

    <!-- 12. जामा तलाशी -->
    <div class="point-row" style="margin-top: 14px;">
      <b>12.</b> &nbsp;
      <b><u>जामा तलाशी</u> -</b> गिरफ्तार व्यक्ति की जामा तलाशी लेने पर निम्नलिखित सामान पाया, जिसे कब्जे में लेकर रसीद दी गई। यदि कुछ भी सामान नहीं पाया तो कुछ भी नहीं लिखा जाए।
      <table class="grid-tbl">
        <thead>
          <tr>
            <th style="width: 12%;">क्र.स.</th>
            <th style="width: 63%;">पाए गए सामान का विवरण</th>
            <th style="width: 25%;">मात्रा/संख्या</th>
          </tr>
        </thead>
        <tbody>
          ${jtItems.map((item, idx) => `
            <tr>
              <td>${item.srNo || `${idx + 1}.`}</td>
              <td style="text-align: left; padding-left: 10px;">${item.description || "&nbsp;"}</td>
              <td>${item.quantity || "&nbsp;"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <ul style="margin: 6px 0 16px 20px; padding: 0; line-height: 1.6; font-size: 9.5pt;">
        <li>मानवीय गरिमा तथा शारीरिक बचाव हेतू आवश्यक कपडे गिरफ्तार व्यक्ति के शरीर पर रहने दिए गए।</li>
        <li>शिनाख्त हेतू अपने आप को मुंह ढककर रखने के लिए गिरफ्तार व्यक्ति को सचेत किया गया।</li>
      </ul>

      <div style="margin-top: 16px; font-size: 9.5pt;">
        <b>गिरफ्तार व्यक्ति के हस्ताक्षर या बायें अगूंठे का निशान:</b>
        <div style="margin: 14px 0 16px 0; border-bottom: 1px solid #000; width: 340px;"></div>
      </div>

      <div style="margin-top: 14px; font-size: 9.5pt;">
        <b>गवाह के हस्ताक्षर</b> &nbsp;&nbsp;&nbsp;&nbsp;
        1. <span class="fill">${formData.witnessSign1 || "...................................................................."}</span>
        <div style="padding-left: 110px; margin-top: 12px;">
          2. <span class="fill">${formData.witnessSign2 || "...................................................................."}</span>
        </div>
      </div>

      <div style="margin-top: 20px; font-size: 9.5pt;">
        <b>गिरफ्तार व्यक्ति के हस्ताक्षर या बायें अगूंठे का निशान:</b>
        <div style="margin: 14px 0 20px 0; border-bottom: 1px solid #000; width: 340px;"></div>
      </div>

      <!-- Signatures at Bottom of Page 2 -->
      <table class="sig-table">
        <tr>
          <td style="width: 45%;">
            स्थान <span class="fill">${formData.ioSignPlace || formData.district || "...................................."}</span><br/><br/>
            दिनांक <span class="fill">${formData.ioSignDate || formData.issueDate || "................................"}</span>
          </td>
          <td style="width: 55%; text-align: left; padding-left: 50px;">
            <b>जांच अधिकारी के हस्ताक्षर</b><br/><br/>
            नाम <span class="fill">${formData.officerName || "...................................................."}</span><br/>
            पद <span class="fill">${formData.officerRank || "...................................................."}</span><br/>
            नम्बर <span class="fill">${formData.officerPno || formData.officerBeltNo || "................................................"}</span>
          </td>
        </tr>
      </table>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ========================================================================= -->
  <!-- PAGE 3: भाग-2 पहचान पत्र (प्रत्येक अभियुक्त के लिए अलग अलग फार्म)               -->
  <!-- ========================================================================= -->
  <div class="page-sheet">
    <div class="page-version-tag">v3.0 dt 07.04.2025</div>

    <div class="header-center-title">
      <div class="h-main">गिरफ्तारी/ न्यायालय में समर्पण फार्म</div>
      <div class="h-sub">भाग-2</div>
      <div class="h-sub">पहचान पत्र</div>
      <div class="h-note">(प्रत्येक अभियुक्त के लिए अलग अलग फार्म)</div>
    </div>

    <!-- थाना / जिला पंक्ति एवं फोटोग्राफ बॉक्स -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
      <div style="flex: 1; padding-top: 10px; line-height: 2.2;">
        थाना <span class="fill">${formData.policeStation || "...................................................."}</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        जिला <span class="fill">${formData.district || "...................................."}</span>
        <br/>
        राज्य द्वारा <span class="fill">${formData.stateCaseTitle || "................................................................................................"}</span>
        <br/>
        अभियोग संख्या <span class="fill">${formData.caseNo || formData.complaintNo || "...................."}</span> &nbsp;&nbsp;
        दिनांक <span class="fill">${formData.caseDate || formData.issueDate || "...................."}</span> &nbsp;&nbsp;
        धारा <span class="fill">${formData.caseSections || formData.sectionsOfLaw || "...................."}</span> &nbsp;&nbsp;
        थाना <span class="fill">${formData.casePs || formData.policeStation || "...................."}</span>
        <br/>
        बनाम: <span class="fill">${formData.vsName || formData.noticeeName || "................................................................................................"}</span>
      </div>
      <div class="photo-box">
        फोटोग्राफ आरोपी
      </div>
    </div>

    <!-- 1. शारीरिक बनावट, विकृतियाँ एवं अन्य विवरण 18-कॉलम तालिका -->
    <div class="point-row" style="margin-top: 10px;">
      <b>1.</b> &nbsp;&nbsp;
      <b>गिरफ्तार व्यक्ति की शारीरिक बनावट, विकृतियाँ एंव अन्य विवरण-</b>
      <table class="grid-tbl" style="margin-top: 8px;">
        <thead>
          <tr>
            <th style="width: 15%;">लिंग<br/>(1)</th>
            <th style="width: 17%;">जन्म तिथि / वर्ष<br/>(2)</th>
            <th style="width: 17%;">शारीरिक बनावट<br/>(3)</th>
            <th style="width: 16%;">कद (सें.मी)<br/>(4)</th>
            <th style="width: 17%;">रंग/ब्लड ग्रुप<br/>(5)</th>
            <th style="width: 18%;">पहचान के चिन्ह<br/>(6)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${formData.gender || formData.accusedGender || "&nbsp;"}</td>
            <td>${formData.dobYear || formData.noticeeAge || "&nbsp;"}</td>
            <td>${formData.bodyBuild || "&nbsp;"}</td>
            <td>${formData.heightCm || "&nbsp;"}</td>
            <td>${formData.colorBloodGroup || "&nbsp;"}</td>
            <td>${formData.identMarks || "&nbsp;"}</td>
          </tr>
          <tr>
            <th>विकृतिया/ विशिष्टयां<br/>(7)</th>
            <th>दाँत<br/>(8)</th>
            <th>बाल<br/>(9)</th>
            <th>आंखें<br/>(10)</th>
            <th>आदतें<br/>(11)</th>
            <th>पहनावा<br/>(12)</th>
          </tr>
          <tr>
            <td>${formData.deformities || "&nbsp;"}</td>
            <td>${formData.teeth || "&nbsp;"}</td>
            <td>${formData.hair || "&nbsp;"}</td>
            <td>${formData.eyes || "&nbsp;"}</td>
            <td>${formData.habits || "&nbsp;"}</td>
            <td>${formData.dress || "&nbsp;"}</td>
          </tr>
          <tr>
            <th>भाषा/बोली<br/>(13)</th>
            <th>जले हुये का निशान<br/>(14)</th>
            <th>लुकोदर्मा/सफेद धब्बे<br/>(15)</th>
            <th>मस्सा<br/>(16)</th>
            <th>घाव<br/>(17)</th>
            <th>गुदे हुये का निशान<br/>(18)</th>
          </tr>
          <tr>
            <td>${formData.languageDialect || "&nbsp;"}</td>
            <td>${formData.burnMarks || "&nbsp;"}</td>
            <td>${formData.leukodermaSpots || "&nbsp;"}</td>
            <td>${formData.moleMarks || "&nbsp;"}</td>
            <td>${formData.scarWoundMarks || "&nbsp;"}</td>
            <td>${formData.tattooMarks || "&nbsp;"}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 8px;">
        अन्य लक्षण यदि कोई हो तो- <span class="fill">${formData.otherIdentTraits || "................................................................................................"}</span>
      </div>
    </div>

    <!-- 2. उंगलियों के निशान -->
    <div class="point-row" style="margin-top: 14px;">
      <b>2.</b> &nbsp;&nbsp;
      उंगलियो के निशान लिये गए : &nbsp;&nbsp; <b>${formData.fingerprintsTaken || "हां / नही"}</b>
    </div>

    <!-- 3. सामाजिक व आर्थिक स्थिति -->
    <div class="point-row" style="margin-top: 14px;">
      <b>3.</b> &nbsp;&nbsp;
      <b>गिरफ्तार व्यक्ति की सामाजिक व आर्थिक स्थिति :</b>
      <div class="sub-point" style="margin-top: 6px;">
        (क) &nbsp;&nbsp; जीवन स्तर <span class="fill">${formData.livingStandard || "...................................................................."}</span>
      </div>
      <div class="sub-point">
        (ख) &nbsp;&nbsp; शैक्षणिक योग्यता <span class="fill">${formData.educationalQualification || "............................................................"}</span>
      </div>
      <div class="sub-point">
        (ग) &nbsp;&nbsp; व्यवसाय <span class="fill">${formData.profession || formData.occupation || "...................................................................."}</span>
      </div>
      <div class="sub-point">
        (घ) &nbsp;&nbsp; आय वर्ग <span class="fill">${formData.incomeGroup || "...................................................................."}</span>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ========================================================================= -->
  <!-- PAGE 4: जोखिम मूल्यांकन एवं केवल मोहर्र थाना के प्रयोग हेतू                   -->
  <!-- ========================================================================= -->
  <div class="page-sheet">
    <!-- 4. जांच पड़ताल एवं ज्ञात पुलिस रिकार्ड के आधार पर -->
    <div class="point-row" style="margin-top: 6px;">
      <b>4.</b> &nbsp;&nbsp;
      <b>जांच पडताल एंव ज्ञात पुलिस रिकार्ड के आधार पर ,क्या गिरफ्तार व्यक्ति:</b>

      <div class="sub-point" style="margin-top: 6px; display: flex; justify-content: space-between; max-width: 580px;">
        <span>(क) &nbsp;&nbsp; खतरनाक है :</span>
        <b>${formData.isDangerous || "हाँ /नही"}</b>
      </div>
      <div class="sub-point" style="display: flex; justify-content: space-between; max-width: 580px;">
        <span>(ख) &nbsp;&nbsp; पूर्व में किसी जमानत से बच निकला है :</span>
        <b>${formData.isBailJumped || "हाँ / नही"}</b>
      </div>
      <div class="sub-point" style="display: flex; justify-content: space-between; max-width: 580px;">
        <span>(ग) &nbsp;&nbsp; आमतौर पर शस्त्र रखता है :</span>
        <b>${formData.usuallyCarriesArms || "हाँ/ नही"}</b>
      </div>
      <div class="sub-point" style="display: flex; justify-content: space-between; max-width: 580px;">
        <span>(घ) &nbsp;&nbsp; सहयोगियो सहित क्रियाशील है :</span>
        <b>${formData.activeWithGang || "हाँ/ नही"}</b>
      </div>
      <div class="sub-point" style="display: flex; justify-content: space-between; max-width: 580px;">
        <span>(ङ) &nbsp;&nbsp; ज्ञात/ सूचिबद्ध अपराधी है या नही:</span>
        <b>${formData.isKnownListedCriminal || "हाँ / नही"}</b>
      </div>
      <div class="sub-point" style="display: flex; justify-content: space-between; max-width: 580px;">
        <span>(च) &nbsp;&nbsp; आदतन अपराधी है या नही:</span>
        <b>${formData.isHabitualOffender || "हाँ/ नही"}</b>
      </div>
      <div class="sub-point" style="display: flex; justify-content: space-between; max-width: 580px;">
        <span>(छ) &nbsp;&nbsp; जमानत के दौरान बच निकलने की सम्भावना है:</span>
        <b>${formData.isLikelyToEscapeBail || "हाँ/ नही"}</b>
      </div>
      <div class="sub-point" style="display: flex; justify-content: space-between; max-width: 580px;">
        <span>(ज) &nbsp;&nbsp; जमानत पर रिहा होने के बाद अपराध करने या पीडितो / गवाहो को धमकाने की सम्भावना है :</span>
        <b>${formData.isLikelyToThreatenOrRepeat || "हाँ /नही"}</b>
      </div>
      <div class="sub-point" style="margin-top: 4px;">
        (झ) &nbsp;&nbsp; किसी अन्य अपराध में वांछित है : &nbsp;
        <span class="fill">${formData.wantedInOtherCrime || "...................................................................."}</span>
      </div>

      <div style="margin-top: 8px; font-size: 9.5pt; line-height: 1.6;">
        यदि ख,ङ, अथवा झ का उत्तर हाँ है तो मामला संदर्भ / धाराओ का उल्लेख करे , यदि आवश्यक हो तो अलग से पृष्ठ नत्थी करें
        <div style="margin-top: 3px;">
          <span class="fill">${formData.riskNotesRemarks || "................................................................................................................................"}</span>
        </div>
      </div>
    </div>

    <!-- जांच अधिकारी के हस्ताक्षर (पृष्ठ 4) -->
    <table class="sig-table" style="margin-top: 18px;">
      <tr>
        <td style="width: 45%;">
          स्थान <span class="fill">${formData.ioSignPlaceP4 || formData.ioSignPlace || formData.district || "...................................."}</span><br/><br/>
          दिनांक <span class="fill">${formData.ioSignDateP4 || formData.ioSignDate || formData.issueDate || "................................"}</span>
        </td>
        <td style="width: 55%; text-align: left; padding-left: 50px;">
          <b>जांच अधिकारी के हस्ताक्षर</b><br/><br/>
          नाम <span class="fill">${formData.ioNameP4 || formData.officerName || "...................................................."}</span><br/>
          पद <span class="fill">${formData.ioRankP4 || formData.officerRank || "...................................................."}</span><br/>
          नम्बर <span class="fill">${formData.ioBeltNoP4 || formData.officerPno || formData.officerBeltNo || "................................................"}</span>
        </td>
      </tr>
    </table>

    <!-- केवल मोहर्र थाना के प्रयोग हेतू -->
    <div style="margin-top: 26px; border-top: 1.5px solid #000; padding-top: 10px;">
      <div style="font-weight: bold; font-size: 10.5pt; text-decoration: underline; margin-bottom: 8px;">
        केवल मोहर्र थाना के प्रयोग हेतू :
      </div>

      <!-- 5. आरोपी का पूर्व आपराधिक रिकार्ड -->
      <div class="point-row">
        <b>5.</b> &nbsp;&nbsp;
        <b>आरोपी का पूर्व आपराधिक रिकार्ड : (ICJS /Eagle /गृह थाना के रिकॉर्ड अनुसार )</b>
        <div class="sub-point" style="margin-top: 6px;">
          (i) &nbsp;&nbsp; <span class="fill">${formData.priorRecord1 || "................................................................................................................................"}</span>
        </div>
        <div style="padding-left: 20px; margin: 4px 0;">-</div>
        <div class="sub-point">
          (ii) &nbsp; <span class="fill">${formData.priorRecord2 || "................................................................................................................................"}</span>
        </div>
        <div class="sub-point">
          (iii) <span class="fill">${formData.priorRecord3 || "................................................................................................................................"}</span>
        </div>
      </div>

      <!-- 6. Eagle Software Criminal ID -->
      <div class="point-row" style="margin-top: 14px;">
        <b>6.</b> &nbsp;&nbsp;
        <b>Eagle Software अनुसार अपराधी का Criminal ID No.-------------------------</b> &nbsp;
        <span class="fill font-mono font-bold">${formData.eagleCriminalId || ""}</span>
      </div>

      <!-- मोहर्र थाना के हस्ताक्षर -->
      <div style="margin-top: 22px; text-align: right; padding-right: 20px; font-size: 9.5pt; line-height: 1.8;">
        <b>मोहर्र थाना के हस्ताक्षर</b><br/>
        नाम <span class="fill">${formData.mhcName || "...................................................."}</span><br/>
        पद <span class="fill">${formData.mhcRank || "...................................................."}</span><br/>
        नम्बर <span class="fill">${formData.mhcBeltNumber || "...................................................."}</span>
      </div>
    </div>
  </div>

</body>
</html>`;
  }

  // 3. SPECIFIC LAYOUT: NATGRID Intelligence Requisition Proforma (Exact Official Performa)
  if (templateType === "natgrid_proforma") {
    const fAny = formData as any;
    const borderCss = fAny.borderStyle === "none"
      ? "border: none !important; box-shadow: none !important;"
      : fAny.borderStyle === "double"
      ? "border: 4px double #000 !important;"
      : fAny.borderStyle === "light"
      ? "border: 1px solid #cbd5e1 !important;"
      : "border: 2px solid #cbd5e1;";
    const fontCss = fAny.fontSize === "compact"
      ? "font-size: 10pt !important; line-height: 1.35 !important;"
      : fAny.fontSize === "large"
      ? "font-size: 13pt !important; line-height: 1.6 !important;"
      : "";

    const shoRankTitle = formData.shoName || "Inspector, SHO";
    const shoMob = formData.shoPhone || "";
    const shoEmail = formData.shoEmail || "";

    const firVal = formData.complaintNo || "";
    const dateVal = formData.incidentDate || formData.issueDate || "";
    const psVal = formData.policeStation || "";
    const distVal = formData.district || "Sirsa";

    const offenceVal = formData.sectionsOfLaw || "";
    const summaryVal = formData.allegationsBrief || "";
    const ioDetails = formData.officerName
      ? `${formData.officerName}${formData.officerRank ? `, ${formData.officerRank}` : ""}${formData.officerPhone ? `, Mob: ${formData.officerPhone}` : ""}`
      : "";

    const isNatSec = formData.natgridNationalSecurity ?? false;
    const isCounterTerror = formData.natgridCounterTerror ?? false;
    const isHeinous = formData.natgridHeinousCrime ?? true;

    const validReason = formData.natgridReason || "To apprehend the accused";
    const deptRequired = formData.natgridDepartment || "";
    const infoRequired = formData.natgridInfoRequired || "";

    const suspectName = formData.noticeeName || "";
    const suspectFather = formData.noticeeFather || "";
    const suspectAddress = formData.noticeeAddress || "";
    const suspectDob = formData.noticeeDob || formData.appearanceDate || "";
    const suspectMob = formData.noticeePhone || "";
    const suspectAadhaar = formData.accusedAadhaar || "";
    const suspectPan = formData.accusedPan || "";
    const otherInfo = formData.natgridOtherInfo || formData.documentsRequired || "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NATGRID PERFORMA${firVal ? ` - FIR ${firVal}` : ""}</title>
  <style>
    ${BASE_DOC_STYLES}
    .doc-sheet {
      ${borderCss}
      padding: 30px 40px !important;
      font-family: 'Times New Roman', Times, serif !important;
      color: #000 !important;
    }
    body { ${fontCss} font-family: 'Times New Roman', Times, serif; color: #000; }
    .natgrid-header-title {
      text-align: center;
      font-weight: bold;
      text-decoration: underline;
      font-size: 14pt;
      margin-bottom: 14px;
      letter-spacing: 0.5px;
      font-family: 'Times New Roman', Times, serif;
    }
    .natgrid-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #000;
      font-size: 10pt;
      font-family: 'Times New Roman', Times, serif;
      color: #000;
    }
    .natgrid-table td {
      border: 1px solid #000;
      padding: 6px 8px;
      vertical-align: top;
    }
    .check-box {
      width: 24px;
      height: 18px;
      border: 1.5px solid #000;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      margin: 2px 0;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .doc-sheet { border: none !important; box-shadow: none !important; padding: 20px 25px !important; }
    }
  </style>
</head>
<body>
  <div class="doc-sheet">
    <div class="natgrid-header-title">NATGRID PERFORMA</div>

    <table class="natgrid-table">
      <tbody>
        <tr>
          <td style="width: 26%; font-weight: 500;">
            Name of Incharge<br/>Unit/SHO (with<br/>Rank)
          </td>
          <td colspan="3" style="width: 74%;">
            ${shoRankTitle}
          </td>
        </tr>
        <tr>
          <td style="font-weight: 500;">Mobile No.</td>
          <td colspan="3">${shoMob}</td>
        </tr>
        <tr>
          <td style="font-weight: 500;">Govt. Email ID</td>
          <td colspan="3">${shoEmail}</td>
        </tr>
        <tr>
          <td style="width: 26%;"><b>FIR No.</b> ${firVal}</td>
          <td style="width: 24%;"><b>Date :-</b> ${dateVal}</td>
          <td style="width: 25%;"><b>P.S.</b> ${psVal}</td>
          <td style="width: 25%;"><b>District</b> ${distVal}</td>
        </tr>
        <tr>
          <td colspan="4">
            <b>Offence U/s</b> ${offenceVal}
          </td>
        </tr>
        <tr>
          <td colspan="4" style="min-height: 55px; padding-bottom: 16px;">
            <b>Brief summary of case :- &ldquo;</b>${summaryVal}<b>&rdquo;</b>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <b>Name/Rank of I.O. with Mobile No :-</b> ${ioDetails}
          </td>
        </tr>
        <tr>
          <td colspan="3" style="vertical-align: middle; padding: 8px 10px;">
            <div style="font-weight: 500; margin-bottom: 4px;">For what reason/purpose this case is related to</div>
            <div style="line-height: 1.7; padding-left: 2px;">
              1.&nbsp;&nbsp;National security<br/>
              2.&nbsp;&nbsp;Counter terror<br/>
              3.&nbsp;&nbsp;Heinous Crime (Punishment should be 7 years or more)
            </div>
          </td>
          <td style="vertical-align: middle; text-align: center; width: 25%; padding: 8px 10px;">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: space-around; gap: 8px; height: 100%;">
              <div class="check-box">${isNatSec ? "&#10003;" : ""}</div>
              <div class="check-box">${isCounterTerror ? "&#10003;" : ""}</div>
              <div class="check-box">${isHeinous ? "&#10003;" : ""}</div>
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <b>Explain along with a Valid Reason :-</b> ${validReason}
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <b>Name of Department from which Information is required:-</b> ${deptRequired}
          </td>
        </tr>
        <tr>
          <td colspan="4" style="min-height: 50px;">
            <b>What type of information is required?</b><br/>
            <div style="margin-top: 4px; line-height: 1.5;">${infoRequired}</div>
          </td>
        </tr>
        <tr>
          <td colspan="4" style="line-height: 1.85; padding: 10px 12px;">
            <b>Information available at your end:-</b><br/>
            <b>Name &ndash;</b> ${suspectName}<br/>
            <b>Father Name &ndash;</b> ${suspectFather}<br/>
            <b>Address &ndash;</b> ${suspectAddress}<br/>
            <b>Date of Birth &ndash;</b> ${suspectDob}<br/>
            <b>Mobile No. &ndash;</b> ${suspectMob}<br/>
            <b>Aadhar No. &ndash;</b> ${suspectAadhaar}<br/>
            <b>PAN -</b> ${suspectPan}<br/>
            <b>Any other information-</b> ${otherInfo}
          </td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top: 55px; display: flex; justify-content: flex-end; padding-right: 20px;">
      <div style="text-align: left; font-size: 11pt; line-height: 1.45; font-family: 'Times New Roman', Times, serif;">
        <b>Signature of Incharge/SHO</b><br/>
        <b>With Seal/Stamp</b>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  // 4. DEFAULT & HARYANA POLICE NOTICE (haryana_notice, etc.)
  const templateTitles: Record<string, { title: string; subtitle: string; mandateText: string }> = {
    haryana_notice: {
      title: "NOTICE OF APPEARANCE IN PRELIMINARY ENQUIRY (सूचना-पत्र)",
      subtitle: "ISSUED UNDER SECTION 173(3) BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023",
      mandateText: "You are hereby intimated and directed to join the preliminary enquiry into the complaint mentioned below and appear in person before the Enquiry Officer or produce relevant material/evidence.",
    },
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
  };

  const defaultInfo = templateTitles[templateType] || {
    title: "OFFICIAL POLICE NOTICE / REQUISITION MEMO (सूचना-पत्र)",
    subtitle: "ISSUED UNDER BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023",
    mandateText: "You are hereby directed to comply with the instructions detailed below.",
  };

  const info = {
    title: customTitle?.title || defaultInfo.title,
    subtitle: customTitle?.subtitle || defaultInfo.subtitle,
    mandateText: defaultInfo.mandateText,
  };

  const fNoticeAny = formData as any;
  const showHeaderNotice = fNoticeAny.showHeader !== false;
  const showSignaturesNotice = fNoticeAny.showSignatures !== false;
  const showAppearanceDirectivesNotice = fNoticeAny.showAppearanceDirectives !== false;
  const showDocumentsRequiredNotice = fNoticeAny.showDocumentsRequired !== false;
  const showStatutoryProtectionNotice = fNoticeAny.showStatutoryProtection !== false;

  const borderCssNotice = fNoticeAny.borderStyle === "none"
    ? "border: none !important; box-shadow: none !important;"
    : fNoticeAny.borderStyle === "double"
    ? "border: 4px double #0b192c !important;"
    : fNoticeAny.borderStyle === "light"
    ? "border: 1px solid #cbd5e1 !important;"
    : "border: 2px solid #cbd5e1;";
  const fontCssNotice = fNoticeAny.fontSize === "compact"
    ? "font-size: 10pt !important; line-height: 1.35 !important;"
    : fNoticeAny.fontSize === "large"
    ? "font-size: 13pt !important; line-height: 1.6 !important;"
    : "";

  const bodySectionsHtml = (customSections && customSections.length > 0)
    ? customSections.map((sec) => `
    <div class="section-block">
      <div class="section-label">${sec.title}</div>
      <div class="section-content ${sec.variant === "highlight" ? "highlight" : sec.variant === "danger" ? "danger" : ""}">${sec.content}</div>
    </div>
    `).join("\n")
    : `
    <!-- Reference / Allegations -->
    <div class="section-block">
      <div class="section-label">SUBJECT MATTER & GIST OF COMPLAINT / ENQUIRY</div>
      <div class="section-content" style="background-color: #f1f5f9;">
        <b>Subject / Allegations:</b> ${formData.allegationsBrief || "Verification of facts"}<br/>
        <b>Sections of Law:</b> ${formData.sectionsOfLaw || "Section 173(3) BNSS"}<br/>
        <b>Date of Alleged Incident:</b> ${formData.incidentDate || "N/A"}
      </div>
    </div>

    <!-- Mandate & Appearance Schedule -->
    ${showAppearanceDirectivesNotice ? `
    <div class="section-block">
      <div class="section-label">MANDATE OF ATTENDANCE & INSTRUCTIONS</div>
      <div class="section-content highlight" style="line-height: 1.7;">
        ${formData.groundsBrief || info.mandateText}<br/><br/>
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
            <td style="padding: 4px 8px; font-weight: bold; color: #475569;">Place / Room of Enquiry:</td>
            <td style="padding: 4px 8px; font-weight: 800; color: #0b192c;">${formData.appearancePlace || "Police Station City Ambala (Or via designated Video Conferencing Link)"}</td>
          </tr>
        </table>
      </div>
    </div>` : ""}

    <!-- Documents to be produced -->
    ${showDocumentsRequiredNotice && formData.documentsRequired ? `
    <div class="section-block">
      <div class="section-label">DOCUMENTS / RECORDS REQUIRED TO BE PRODUCED</div>
      <div class="section-content">${formData.documentsRequired}</div>
    </div>
    ` : ""}

    <!-- Protective Statutory Warning / Clarification from Haryana Police PDF -->
    ${showStatutoryProtectionNotice ? `
    <div class="section-block">
      <div class="section-label">IMPORTANT STATUTORY CLARIFICATION & PROTECTION NOTICE</div>
      <div class="section-content" style="background-color: #f0fdf4; border-color: #bbf7d0; color: #166534; font-size: 9pt; font-weight: 600;">
        ${formData.statutoryClarification || "NOTICE: This proceeding is a preliminary enquiry conducted under Section 173(3) BNSS, 2023. An FIR has NOT been registered in this matter yet, and NO arrest will be made during the course of this preliminary enquiry. You are afforded full opportunity to present your defense, documents, and witnesses."}
      </div>
    </div>` : ""}
    `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${formData.dispatchNo || "NOTICE"} - Haryana Police</title>
  <style>
    ${BASE_DOC_STYLES}
    .doc-sheet { ${borderCssNotice} }
    body { ${fontCssNotice} }
  </style>
</head>
<body>
  <div class="doc-sheet">
    ${showHeaderNotice ? `
    <div class="header-seal">
      <div style="font-size: 26px; line-height: 1; margin-bottom: 4px;">&#9733; &#9773; &#9733;</div>
      <h1 class="police-title">${formData.headerDept || "HARYANA POLICE"}</h1>
      <div class="state-title">${formData.headerGovt || "GOVERNMENT OF HARYANA"}</div>
      <div class="station-title">${formData.policeStation || "POLICE STATION CITY AMBALA"}, DISTRICT ${formData.district || "AMBALA, HARYANA"}</div>
    </div>` : ""}

    <div class="doc-title-block">
      <h2 class="doc-main-title">${formData.docTitle || info.title}</h2>
      <p class="doc-sub-title">${formData.docSubTitle || info.subtitle}</p>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <strong>Notice No:</strong>
        <span>${formData.dispatchNo || "HP/AMB/CT/2026/NTC-0142"}</span>
      </div>
      <div class="meta-item">
        <strong>Date of Issue:</strong>
        <span>${formData.issueDate || new Date().toISOString().split("T")[0]}</span>
      </div>
      <div class="meta-item">
        <strong>Complaint Ref:</strong>
        <span>${formData.complaintNo || "HAR-AMB-2026-CMP-00482"}</span>
      </div>
      <div class="meta-item">
        <strong>Complainant:</strong>
        <span>${formData.complainantName || "State / Citizen"}</span>
      </div>
    </div>

    <div class="party-box" style="margin-bottom: 18px; border-left: 4px solid #0b192c;">
      <div class="party-header complainant">&#9632; ${formData.recipientDesignation || "TO (PERSON CONCERNED / NOTICEE):"}</div>
      <div class="party-field" style="font-size: 11pt;"><strong>Name:</strong> <b>${formData.noticeeName || "N/A"}</b></div>
      <div class="party-field"><strong>Father's / Spouse's Name:</strong> ${formData.noticeeFather || "N/A"}</div>
      <div class="party-field"><strong>Residential Address:</strong> ${formData.noticeeAddress || "N/A"}</div>
      <div class="party-field"><strong>Contact Mobile:</strong> ${formData.noticeePhone || "N/A"}</div>
      <div class="party-field"><strong>Capacity / Role:</strong> <span class="badge-tag">${formData.noticeeRole || "Noticee"}</span></div>
    </div>

    ${bodySectionsHtml}

    <div class="signatures-row">
      <div class="seal-box">
        <div class="seal-stamp">Police Station Seal</div>
        <div class="seal-label">OFFICIAL STATION SEAL</div>
      </div>
      <div class="officer-block">
        <div class="officer-name">${formData.officerName || "Surender Pal"}</div>
        <div>${formData.officerRank || "Sub-Inspector / Enquiry Officer"}</div>
        <div style="font-family: monospace; color: #475569;">${formData.officerPno || "PNO-23841"}</div>
        <div>Mobile: ${formData.officerPhone || "9812034567"}</div>
        <div class="officer-role">Investigating Officer</div>
      </div>
    </div>

    <div class="sho-endorsement">
      <div class="sho-header">
        <span>SERVICE RETURN & ACKNOWLEDGMENT MEMO</span>
        <span style="font-size: 8pt; color: #64748b;">(For Police Station MHC Records)</span>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 8.5pt; margin-top: 10px;">
        <div style="border: 1px dashed #cbd5e1; padding: 10px; border-radius: 6px;">
          <b>Served By (Police Official):</b><br/>
          Name: ${formData.mhcName || "HC Devinder Kumar"}<br/>
          Rank / Belt: ${formData.mhcRank || "Head Constable"} (${formData.mhcBeltNumber || "889/AMB"})<br/>
          Date & Time: ____-____-2026 at ____:____ hrs<br/>
          Signature: ____________________
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

export interface HaryanaPoliceProformaData {
  headerLeft?: string; // e.g. "पुलिस विभाग"
  headerRight?: string; // e.g. "जिला पानीपत"
  subHeaderLeft?: string; // e.g. "श्रीमान जी"
  title: string; // e.g. "जांच रिपोर्ट परिवाद नम्बरी 128-SPL-III DT 10.02.2026"
  subTitle?: string; // e.g. "परिवाद की जांच रिपोर्ट इस प्रकार है -"
  columns?: string[]; // If multi-column table (e.g. 3-column proforma)
  rows: {
    id: string;
    label?: string; // Col 1
    cells: string[]; // Cell text
  }[];
  closingLine?: string; // e.g. "रिपोर्ट सेवा में पेश है।"
  officerName?: string;
  officerRank?: string;
  officerLocation?: string;
  reportDate?: string;
  borderStyle?: "solid" | "double" | "light" | "none";
}

export function generateHaryanaPoliceProformaHtml(data: HaryanaPoliceProformaData): string {
  const borderCss =
    data.borderStyle === "none"
      ? "border: none;"
      : data.borderStyle === "light"
      ? "border: 1px solid #cbd5e1;"
      : data.borderStyle === "double"
      ? "border: 3px double #000000;"
      : "border: 1.5px solid #000000;";

  const cellBorderCss =
    data.borderStyle === "none"
      ? "border: none;"
      : data.borderStyle === "light"
      ? "border: 1px solid #e2e8f0;"
      : "border: 1.5px solid #000000;";

  // If table has column headers (like PDF 3)
  const isMultiCol = data.columns && data.columns.length > 0;

  const tableHeaderHtml = isMultiCol
    ? `<thead>
        <tr>
          ${data.columns!
            .map(
              (col) =>
                `<th style="padding: 8px 10px; ${cellBorderCss} background-color: #f8fafc; font-weight: 800; font-size: 10.5pt; text-align: left; vertical-align: top; color: #000000;">${col}</th>`
            )
            .join("\n")}
        </tr>
      </thead>`
    : "";

  const tableBodyHtml = `<tbody>
    ${data.rows
      .map((row) => {
        if (isMultiCol) {
          return `<tr>
            ${row.cells
              .map(
                (cell) =>
                  `<td style="padding: 8px 10px; ${cellBorderCss} vertical-align: top; font-size: 10pt; line-height: 1.6; white-space: pre-wrap; color: #000000;">${cell || ""}</td>`
              )
              .join("\n")}
          </tr>`;
        }

        // Standard 2-column key-value proforma (like PDF 1, 2, 5)
        const label = row.label || "";
        const val = row.cells?.[0] || "";
        return `<tr>
          <td style="width: 140px; min-width: 120px; max-width: 160px; padding: 8px 10px; ${cellBorderCss} font-weight: 800; font-size: 10.5pt; vertical-align: top; color: #000000;">
            ${label}
          </td>
          <td style="padding: 8px 10px; ${cellBorderCss} vertical-align: top; font-size: 10pt; line-height: 1.65; white-space: pre-wrap; color: #000000;">
            ${val}
          </td>
        </tr>`;
      })
      .join("\n")}
  </tbody>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title || "ENQUIRY REPORT"} - HARYANA POLICE</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Mangal", "Nirmala UI", "Mukta", Roboto, Arial, sans-serif;
      color: #000000;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 10pt;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .sheet {
      max-width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 16mm 18mm;
      background: #ffffff;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
      font-weight: 800;
      font-size: 11pt;
    }
    .header-sub {
      font-weight: 800;
      font-size: 11pt;
      margin-bottom: 8px;
    }
    .report-title-block {
      text-align: center;
      margin: 12px 0 16px 0;
    }
    .report-title {
      font-weight: 800;
      font-size: 11.5pt;
      margin: 0 0 4px 0;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
    .report-subtitle {
      font-weight: 700;
      font-size: 10.5pt;
      margin: 0;
    }
    table.proforma-table {
      width: 100%;
      border-collapse: collapse;
      ${borderCss}
      margin-top: 10px;
      margin-bottom: 16px;
    }
    .closing-line {
      margin-top: 18px;
      margin-bottom: 24px;
      font-size: 10.5pt;
      font-weight: 700;
      text-align: left;
    }
    .signature-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 30px;
      page-break-inside: avoid;
    }
    .signature-block {
      width: 240px;
      text-align: right;
      font-size: 10pt;
      line-height: 1.5;
    }
    .signature-mark {
      height: 48px;
      display: flex;
      align-items: flex-end;
      justify-content: flex-end;
      padding-bottom: 4px;
    }
    .officer-name {
      font-weight: 800;
      font-size: 10.5pt;
      color: #000000;
    }
    .officer-rank {
      font-weight: 700;
      color: #000000;
    }
    .officer-location {
      font-weight: 600;
      color: #000000;
    }
    .report-date {
      font-weight: 700;
      margin-top: 2px;
      color: #000000;
    }
    @media print {
      body {
        background: transparent;
      }
      .sheet {
        padding: 0;
        margin: 0;
        max-width: 100%;
        min-height: auto;
      }
    }
  </style>
</head>
<body>
  <div class="sheet">
    ${(data.headerLeft || data.headerRight) ? `
    <div class="header-top">
      <div>${data.headerLeft || ""}</div>
      <div>${data.headerRight || ""}</div>
    </div>` : ""}

    ${data.subHeaderLeft ? `<div class="header-sub">${data.subHeaderLeft}</div>` : ""}

    <div class="report-title-block">
      <div class="report-title">${data.title || "जांच रिपोर्ट"}</div>
      ${data.subTitle ? `<div class="report-subtitle">${data.subTitle}</div>` : ""}
    </div>

    <table class="proforma-table">
      ${tableHeaderHtml}
      ${tableBodyHtml}
    </table>

    ${data.closingLine ? `<div class="closing-line">${data.closingLine}</div>` : ""}

    <div class="signature-container">
      <div class="signature-block">
        <div class="signature-mark">
          <svg width="120" height="42" viewBox="0 0 120 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 32C25 15 45 8 70 20C90 28 85 10 110 12" stroke="#1e293b" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </div>
        ${data.officerName ? `<div class="officer-name">${data.officerName}</div>` : ""}
        ${data.officerRank ? `<div class="officer-rank">${data.officerRank}</div>` : ""}
        ${data.officerLocation ? `<div class="officer-location">${data.officerLocation}</div>` : ""}
        ${data.reportDate ? `<div class="report-date">${data.reportDate}</div>` : ""}
      </div>
    </div>
  </div>
</body>
</html>`;
}

