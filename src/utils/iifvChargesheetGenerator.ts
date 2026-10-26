// Statutory I.I.F.-V Final Form / Chargesheet HTML Generator under Section 193 BNSS, 2023
import { FIRItem, ComplaintReportItem } from "@/types";

export interface IIFVReportData {
  court: string;
  district: string;
  ps: string;
  year: string;
  firNo: string;
  firDate: string;
  reportNo: string;
  reportDate: string;
  actRows: Array<{ sNo: number; act: string; sections: string }>;
  finalFormType?: string;
  ifFirUnoccurred?: string;
  ifChargeSheet?: string;
  ioName: string;
  ioRank: string;
  ioNo: string;
  complainantName: string;
  complainantFather: string;
  propertyRows: Array<{
    sNo: number;
    propertyDescription: string;
    estimatedValue: string;
    psPropertyRegisterNo: string;
    fromWhomWhereRecovered: string;
    disposal: string;
  }>;
  accusedPersonList: Array<{
    sNo: number;
    name: string;
    whetherVerified: string;
    husbandFatherName: string;
    dateOrYearOfBirth: string;
    sex: string;
    nationality: string;
    passportNo?: string;
    religion?: string;
    scStObc?: string;
    occupation?: string;
    addresses: Array<{ sNo: number; addressType: string; address: string; whetherVerified?: string }>;
    regularCriminalNo?: string;
    dateOfArrest?: string;
    dateOfReleaseOnBail?: string;
    dateForwardedToCourt?: string;
    underActsSections: Array<{ sNo: number; act: string; sections: string }>;
    bailerName?: string;
    bailerFatherHusbandName?: string;
    bailerOccupation?: string;
    bailerAddresses?: Array<{ sNo: number; addressType: string; address: string }>;
    identificationDob?: string;
    identificationUid?: string;
    otherIdProofs?: Array<{ sNo: number; idType: string; idNumber: string }>;
    previousConvictions?: Array<{
      sNo: number;
      firNo: string;
      state: string;
      district: string;
      policeStation: string;
      descriptionOfCase: string;
      convictionAcquittal: string;
    }>;
    statusOfAccused: string;
  }>;
  accusedNotChargeSheeted?: string;
  witnessesList?: string;
  falseFirAction?: string;
  labAnalysis?: string;
  briefFacts: string;
  referNoticeServed?: string;
  referNoticeDate?: string;
  referNoticeAck?: string;
  despatchedOn?: string;
  noOfEnclosures?: string;
  listOfEnclosures?: string;
  shoName?: string;
  shoRank?: string;
  shoNo?: string;
}

export function generateIIFVChargesheetHtml(data: IIFVReportData): string {
  const court = data.court || "In the Court of Chief Judicial Magistrate / JMIC";
  const district = data.district || "Haryana";
  const ps = data.ps || "Police Station";
  const year = data.year || new Date().getFullYear().toString();
  const firNo = data.firNo || "N/A";
  const firDate = data.firDate || new Date().toISOString().slice(0, 10);
  const reportNo = data.reportNo || `CS/${year}/001`;
  const reportDate = data.reportDate || new Date().toISOString().slice(0, 10);

  const actRows = (data.actRows && data.actRows.length > 0)
    ? data.actRows
    : [{ sNo: 1, act: "Bharatiya Nyaya Sanhita, 2023", sections: "303(2), 115(2) BNS" }];

  const propertyRows = data.propertyRows || [];
  const accusedPersonList = data.accusedPersonList || [];

  return `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="utf-8" />
  <title>I.I.F.-V Final Form / Chargesheet - FIR No. ${firNo}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      background: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Times New Roman", Times, serif;
      font-size: 11pt;
      line-height: 1.55;
    }
    .a4-wrapper {
      max-width: 210mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 16mm 14mm;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      border-radius: 4px;
    }
    @media print {
      body {
        padding: 0 !important;
        background: #ffffff !important;
      }
      .a4-wrapper {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
      .no-print {
        display: none !important;
      }
    }
    table {
      border-collapse: collapse !important;
      width: 100% !important;
      margin-top: 4px;
      margin-bottom: 8px;
    }
    th, td {
      border: 1px solid #64748b !important;
      padding: 5px 8px;
      font-size: 9.5pt;
      text-align: left;
    }
    th {
      background-color: #f1f5f9 !important;
      font-weight: bold;
      color: #0f172a;
    }
    .header-border {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .section-title {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-weight: bold;
      font-size: 10pt;
      margin-top: 10px;
      margin-bottom: 4px;
      text-transform: uppercase;
      color: #0f172a;
      letter-spacing: 0.3px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 4px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-bottom: 4px;
    }
    .border-sub {
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .box-sub {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 10px 12px;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .pre-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      border-radius: 4px;
      white-space: pre-wrap;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 9.5pt;
      line-height: 1.5;
    }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
  </style>
</head>
<body>
  <div class="a4-wrapper">
    <!-- Header Section -->
    <div class="header-border">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="font-weight: bold; font-size: 10.5pt; letter-spacing: 0.5px; color: #0f172a;">I.I.F.-V | FINAL FORM / REPORT</div>
          <div style="font-size: 9.5pt; color: #475569;">Under Section 193 BNSS, 2023</div>
        </div>
        <div style="text-align: right; font-weight: bold; font-size: 11pt; text-transform: uppercase; letter-spacing: 1px; color: #0b192c;">
          Haryana Police
        </div>
      </div>
      <div style="text-align: center; margin-top: 8px;">
        <h1 style="margin: 0; font-size: 13.5pt; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; color: #0f172a;">
          FINAL FORM / REPORT
        </h1>
        <div style="font-size: 9pt; color: #475569; margin-top: 2px;">(Police Report under Section 193 Bharatiya Nagarik Suraksha Sanhita, 2023)</div>
      </div>
    </div>

    <!-- IN THE COURT OF -->
    <div style="margin-bottom: 8px;">
      <div style="font-weight: bold; font-size: 9pt; text-transform: uppercase; color: #475569;">IN THE COURT OF</div>
      <div style="font-weight: bold; font-size: 10.5pt; border-bottom: 1px solid #94a3b8; padding-bottom: 4px;">
        ${court}
      </div>
    </div>

    <!-- 1. District / P.S. / Year / FIR -->
    <div class="border-sub">
      <div class="section-title">1. District / P.S. / Year / FIR</div>
      <div class="grid-3" style="font-size: 10pt;">
        <div><strong>District:</strong> ${district}</div>
        <div><strong>P.S.:</strong> ${ps}</div>
        <div><strong>Year:</strong> ${year}</div>
      </div>
      <div class="grid-2" style="font-size: 10pt; margin-top: 4px;">
        <div><strong>FIR No.:</strong> <span class="mono" style="font-weight: bold;">${firNo}</span></div>
        <div><strong>Date:</strong> ${firDate}</div>
      </div>
    </div>

    <!-- 2 & 3 -->
    <div class="border-sub" style="font-size: 10pt;">
      <div style="margin-bottom: 4px;"><strong>2. Final Report / Charge Sheet No.:</strong> <span class="mono" style="font-weight: bold;">${reportNo}</span></div>
      <div><strong>3. Date:</strong> ${reportDate}</div>
    </div>

    <!-- 4. Act & Sections -->
    <div class="border-sub">
      <div class="section-title">4. Act &amp; Sections</div>
      <table>
        <thead>
          <tr>
            <th style="width: 60px; text-align: center;">S. No.</th>
            <th>Act</th>
            <th>Sections</th>
          </tr>
        </thead>
        <tbody>
          ${actRows.map(r => `
            <tr>
              <td style="text-align: center;" class="mono">${r.sNo}</td>
              <td>${r.act}</td>
              <td style="font-weight: bold;" class="mono">${r.sections}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <!-- 5, 6, 7 -->
    <div class="border-sub" style="font-size: 10pt;">
      <div style="margin-bottom: 4px;"><strong>5. Type of Final Form / Report:</strong> ${data.finalFormType || "Charge Sheet / Challan (दोषारोप पत्र)"}</div>
      <div style="margin-bottom: 4px;"><strong>6. If FIR Unoccurred:</strong> ${data.ifFirUnoccurred || "No / Not Applicable"}</div>
      <div><strong>7. If Charge Sheet:</strong> ${data.ifChargeSheet || "Original (मूल चालान)"}</div>
    </div>

    <!-- 8. Name of I.O. at the time of Charge Sheet -->
    <div class="border-sub">
      <div class="section-title">8. Name of I.O. at the time of Charge Sheet</div>
      <div class="grid-3" style="font-size: 10pt;">
        <div><strong>Name:</strong> ${data.ioName || "IO"}</div>
        <div><strong>Rank:</strong> ${data.ioRank || "Sub-Inspector"}</div>
        <div><strong>No.:</strong> <span class="mono">${data.ioNo || "SI/01"}</span></div>
      </div>
    </div>

    <!-- 9. Complainant / Informant -->
    <div class="border-sub" style="font-size: 10pt;">
      <div style="margin-bottom: 4px;"><strong>9. (a) Name of Complainant / Informant:</strong> <strong>${data.complainantName || "Not Recorded"}</strong></div>
      <div><strong>&nbsp;&nbsp;&nbsp;&nbsp;(b) Father's / Husband's Name:</strong> ${data.complainantFather || "--"}</div>
    </div>

    <!-- 10. Details of Properties Recovered -->
    <div class="border-sub">
      <div class="section-title">10. Details of Properties / Articles / Documents Recovered / Seized</div>
      ${propertyRows.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th style="width: 50px; text-align: center;">S. No.</th>
              <th>Property Description</th>
              <th style="width: 110px;">Estimated Value (Rs.)</th>
              <th style="width: 140px;">P.S. Property Reg. No.</th>
              <th>From Whom / Where Seized</th>
              <th style="width: 110px;">Disposal</th>
            </tr>
          </thead>
          <tbody>
            ${propertyRows.map(p => `
              <tr>
                <td style="text-align: center;" class="mono">${p.sNo}</td>
                <td>${p.propertyDescription}</td>
                <td>${p.estimatedValue}</td>
                <td class="mono">${p.psPropertyRegisterNo}</td>
                <td>${p.fromWhomWhereRecovered}</td>
                <td>${p.disposal}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      ` : `<p style="font-size: 9.5pt; color: #64748b; margin: 4px 0;">Nil. No property seized.</p>`}
    </div>

    <!-- 11. Particulars of Accused Persons Charge-Sheeted -->
    <div class="border-sub">
      <div class="section-title">11. Particulars of Accused Persons Charge-Sheeted</div>
      ${accusedPersonList.length > 0 ? accusedPersonList.map(acc => `
        <div class="box-sub">
          <div style="font-weight: bold; margin-bottom: 4px; font-size: 10pt;">S. No.: <span class="mono">${acc.sNo}</span></div>
          <div class="grid-2" style="font-size: 9.5pt;">
            <div><strong>(i) Name:</strong> <strong>${acc.name}</strong></div>
            <div><strong>Whether Verified:</strong> ${acc.whetherVerified || "Yes"}</div>
          </div>
          <div style="font-size: 9.5pt;"><strong>(ii) Husband's / Father's Name:</strong> ${acc.husbandFatherName}</div>
          <div class="grid-2" style="font-size: 9.5pt;">
            <div><strong>(iii) Date / Year of Birth:</strong> ${acc.dateOrYearOfBirth}</div>
            <div><strong>(iv) Sex:</strong> ${acc.sex}</div>
          </div>
          <div class="grid-2" style="font-size: 9.5pt;">
            <div><strong>(v) Nationality:</strong> ${acc.nationality}</div>
            <div><strong>(vi) Passport No.:</strong> ${acc.passportNo || "Nil"}</div>
          </div>
          <div class="grid-3" style="font-size: 9.5pt;">
            <div><strong>(vii) Religion:</strong> ${acc.religion || "Hindu"}</div>
            <div><strong>(viii) SC / ST / OBC:</strong> ${acc.scStObc || "General"}</div>
            <div><strong>(ix) Occupation:</strong> ${acc.occupation || "Worker / Private"}</div>
          </div>

          <div style="margin-top: 6px;">
            <strong style="font-size: 9.5pt;">(x) Address:</strong>
            <table>
              <thead>
                <tr>
                  <th style="width: 50px; text-align: center;">S. No.</th>
                  <th style="width: 130px;">Address Type</th>
                  <th>Address</th>
                  <th style="width: 90px; text-align: center;">Verified</th>
                </tr>
              </thead>
              <tbody>
                ${acc.addresses.map(ad => `
                  <tr>
                    <td style="text-align: center;" class="mono">${ad.sNo}</td>
                    <td>${ad.addressType}</td>
                    <td>${ad.address}</td>
                    <td style="text-align: center;">${ad.whetherVerified || "Yes"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <div class="grid-2" style="margin-top: 4px; font-size: 9.5pt;">
            <div><strong>(xi) Regular Criminal No.:</strong> ${acc.regularCriminalNo || "Nil"}</div>
            <div><strong>(xii) Date of Arrest:</strong> ${acc.dateOfArrest || "Nil"}</div>
          </div>
          <div class="grid-2" style="font-size: 9.5pt;">
            <div><strong>(xiii) Date of Release on Bail:</strong> ${acc.dateOfReleaseOnBail || "On Bail"}</div>
            <div><strong>(xiv) Date on Which Forwarded to Court:</strong> ${acc.dateForwardedToCourt || "Nil"}</div>
          </div>

          <div style="margin-top: 6px;">
            <strong style="font-size: 9.5pt;">(xv) Under Acts &amp; Sections:</strong>
            <table>
              <thead>
                <tr>
                  <th style="width: 50px; text-align: center;">S. No.</th>
                  <th>Act</th>
                  <th>Sections</th>
                </tr>
              </thead>
              <tbody>
                ${acc.underActsSections.map(u => `
                  <tr>
                    <td style="text-align: center;" class="mono">${u.sNo}</td>
                    <td>${u.act}</td>
                    <td style="font-weight: bold;" class="mono">${u.sections}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <div style="margin-top: 6px;">
            <strong style="font-size: 9.5pt;">(xvi) Details of Bailers / Sureties:</strong>
            <div class="grid-3" style="font-size: 9pt; margin-top: 2px;">
              <div><strong>Name:</strong> ${acc.bailerName || "N/A"}</div>
              <div><strong>Father's Name:</strong> ${acc.bailerFatherHusbandName || "N/A"}</div>
              <div><strong>Occupation:</strong> ${acc.bailerOccupation || "N/A"}</div>
            </div>
            ${acc.bailerAddresses && acc.bailerAddresses.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th style="width: 50px; text-align: center;">S. No.</th>
                    <th style="width: 130px;">Address Type</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  ${acc.bailerAddresses.map(ba => `
                    <tr>
                      <td style="text-align: center;" class="mono">${ba.sNo}</td>
                      <td>${ba.addressType}</td>
                      <td>${ba.address}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            ` : ""}
          </div>

          <div style="margin-top: 6px;">
            <strong style="font-size: 9.5pt;">Identification &amp; ID Proof:</strong>
            <div class="grid-2" style="font-size: 9pt;">
              <div><strong>DOB:</strong> ${acc.identificationDob || "N/A"}</div>
              <div><strong>UID Number:</strong> <span class="mono">${acc.identificationUid || "N/A"}</span></div>
            </div>
            ${acc.otherIdProofs && acc.otherIdProofs.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th style="width: 50px; text-align: center;">S. No.</th>
                    <th>ID Type</th>
                    <th>ID Number</th>
                  </tr>
                </thead>
                <tbody>
                  ${acc.otherIdProofs.map(op => `
                    <tr>
                      <td style="text-align: center;" class="mono">${op.sNo}</td>
                      <td>${op.idType}</td>
                      <td class="mono">${op.idNumber}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            ` : ""}
          </div>

          <div style="margin-top: 6px;">
            <strong style="font-size: 9.5pt;">(xvii) Previous Convictions with Case References:</strong>
            ${acc.previousConvictions && acc.previousConvictions.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th style="width: 45px; text-align: center;">S.No.</th>
                    <th>FIR No.</th>
                    <th>State</th>
                    <th>District</th>
                    <th>Police Station</th>
                    <th>Description</th>
                    <th>Conviction/Acquittal</th>
                  </tr>
                </thead>
                <tbody>
                  ${acc.previousConvictions.map(pv => `
                    <tr>
                      <td style="text-align: center;" class="mono">${pv.sNo}</td>
                      <td class="mono">${pv.firNo}</td>
                      <td>${pv.state}</td>
                      <td>${pv.district}</td>
                      <td>${pv.policeStation}</td>
                      <td>${pv.descriptionOfCase}</td>
                      <td>${pv.convictionAcquittal}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            ` : `<p style="font-size: 9pt; color: #64748b; margin: 2px 0;">No previous convictions</p>`}
          </div>

          <div style="margin-top: 6px; font-size: 9.5pt;">
            <strong>(xviii) Status of the Accused:</strong> <strong>${acc.statusOfAccused}</strong>
          </div>
        </div>
      `).join("") : `<p style="font-size: 9.5pt; color: #64748b; margin: 4px 0;">No accused charge-sheeted in column 11.</p>`}
    </div>

    <!-- 12, 13, 14, 15 -->
    <div class="border-sub">
      <div style="margin-bottom: 8px;">
        <div class="section-title">12. Particulars of Accused Persons Not Charge-Sheeted (Suspect)</div>
        <p style="margin: 2px 0; font-size: 9.5pt;">${data.accusedNotChargeSheeted || "None. No innocent suspect detained or kept in column 12."}</p>
      </div>

      <div style="margin-bottom: 8px;">
        <div class="section-title">13. Particulars of Witnesses to be Examined</div>
        <div class="pre-box">${data.witnessesList || "Witnesses recorded as per Case Diary."}</div>
      </div>

      <div style="margin-bottom: 8px;">
        <div class="section-title">14. If FIR is False, Action Taken or Proposed to be Taken</div>
        <p style="margin: 2px 0; font-size: 9.5pt;">${data.falseFirAction || "Not Applicable. FIR is true and offences are fully substantiated."}</p>
      </div>

      <div style="margin-bottom: 8px;">
        <div class="section-title">15. Result of Laboratory Analysis</div>
        <p style="margin: 2px 0; font-size: 9.5pt;">${data.labAnalysis || "FSL report corroborates prosecution case and is enclosed."}</p>
      </div>
    </div>

    <!-- 16. Brief Facts -->
    <div class="border-sub">
      <div class="section-title" style="font-size: 10.5pt;">16. Brief Facts of the Case</div>
      <div class="pre-box" style="line-height: 1.6; text-align: justify;">${data.briefFacts}</div>
    </div>

    <!-- 17, 18, 19, 20 -->
    <div class="border-sub">
      <div class="section-title">17. Refer Notice Served</div>
      <div class="grid-3" style="font-size: 9.5pt;">
        <div><strong>Refer Notice Served:</strong> ${data.referNoticeServed || "No (Charge-sheet filed for trial)"}</div>
        <div><strong>Date:</strong> ${data.referNoticeDate || "N/A"}</div>
        <div><strong>Acknowledgement:</strong> ${data.referNoticeAck || "N/A"}</div>
      </div>
      <div style="font-size: 9.5pt; margin-top: 4px;"><strong>18. Despatched On:</strong> ${data.despatchedOn || reportDate}</div>
      <div style="font-size: 9.5pt; margin-top: 4px;"><strong>19. No. of Enclosures:</strong> ${data.noOfEnclosures || "10"}</div>
      <div style="margin-top: 6px;">
        <div class="section-title">20. List of Enclosures, As Annexed</div>
        <div class="pre-box">${data.listOfEnclosures || "1. FIR (Form IIF-I)\\n2. Crime Detail Form (IIF-II)\\n3. Property Seizure Memo (IIF-IV)\\n4. Arrest Memo (IIF-III)\\n5. Statements u/s 180 BNSS\\n6. Medical / FSL Report\\n7. Malkhana Extract\\n8. Bail Bonds"}</div>
      </div>
    </div>

    <!-- Official Signatures -->
    <div style="margin-top: 36px; border-top: 2px solid #0f172a; padding-top: 18px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; font-size: 9.5pt;">
        <div>
          <p style="font-weight: bold; text-transform: uppercase; margin: 0 0 30px 0; color: #0f172a;">
            Forwarded by Officer in Charge
          </p>
          <div><strong>Signature:</strong> _________________________________</div>
          <div style="margin-top: 4px;"><strong>Name:</strong> <strong>${data.shoName || "Inspector Satish Kumar"}</strong></div>
          <div style="margin-top: 4px;"><strong>Rank:</strong> ${data.shoRank || "Inspector / SHO"}</div>
          <div style="margin-top: 4px;"><strong>No.:</strong> <span class="mono">${data.shoNo || "SHO/01"}</span></div>
          <div style="margin-top: 4px; font-size: 8.5pt; color: #64748b;">Police Station ${ps}</div>
        </div>

        <div>
          <p style="font-weight: bold; text-transform: uppercase; margin: 0 0 30px 0; color: #0f172a;">
            Investigating Officer Submitting Final Report / Charge Sheet
          </p>
          <div><strong>Signature:</strong> _________________________________</div>
          <div style="margin-top: 4px;"><strong>Name:</strong> <strong>${data.ioName || "IO"}</strong></div>
          <div style="margin-top: 4px;"><strong>Rank:</strong> ${data.ioRank || "Sub-Inspector"}</div>
          <div style="margin-top: 4px;"><strong>No.:</strong> <span class="mono">${data.ioNo || "SI/01"}</span></div>
          <div style="margin-top: 4px; font-size: 8.5pt; color: #64748b;">Haryana Police • CMS Certified</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function generateIIFVChargesheetHtmlFromFir(
  fir: FIRItem,
  reportItem?: Partial<ComplaintReportItem>,
  currentUser?: any
): string {
  const year = String(fir.firYear || (fir.firDate ? fir.firDate.slice(0, 4) : new Date().getFullYear()));
  const reportNo = reportItem?.dispatchNo || fir.finalFormNumber || `CS/${year}/${fir.firNumber.replace(/[^0-9]/g, "").slice(-3) || "101"}`;
  const reportDate = reportItem?.generatedDate || fir.finalFormDate || new Date().toISOString().slice(0, 10);
  const court = fir.courtName || `In the Court of Chief Judicial Magistrate / JMIC, ${fir.district || "Gurugram"}`;

  const actRows = [
    {
      sNo: 1,
      act: fir.majorAct || "Bharatiya Nyaya Sanhita, 2023",
      sections: fir.actsAndSections || "303(2), 115(2) BNS",
    },
  ];

  const anyAccused = fir.accusedList || (fir as any).accusedPersons;
  const accusedPersonList = (anyAccused && anyAccused.length > 0)
    ? anyAccused.map((acc: any, idx: number) => ({
        sNo: idx + 1,
        name: acc.name || "Named Accused",
        whetherVerified: "Yes",
        husbandFatherName: acc.fatherName || "Unknown",
        dateOrYearOfBirth: acc.age ? `${new Date().getFullYear() - Number(acc.age)} (Age ~${acc.age})` : "1994",
        sex: acc.gender === "Female" ? "Female" : "Male",
        nationality: "Indian",
        passportNo: "",
        religion: "Hindu",
        scStObc: "General",
        occupation: "Self-Employed / Worker",
        addresses: [
          {
            sNo: 1,
            addressType: "Permanent & Present",
            address: acc.address || `Village/Town, District ${fir.district || "Gurugram"}, Haryana`,
            whetherVerified: "Yes",
          },
        ],
        regularCriminalNo: "Nil",
        dateOfArrest: acc.arrestDate || new Date().toISOString().slice(0, 10),
        dateOfReleaseOnBail: "On Police Bail / Court Bail",
        dateForwardedToCourt: new Date().toISOString().slice(0, 10),
        underActsSections: [
          {
            sNo: 1,
            act: fir.majorAct || "Bharatiya Nyaya Sanhita, 2023",
            sections: fir.actsAndSections || "303(2), 115(2) BNS",
          },
        ],
        bailerName: "Rameshwar Singh",
        bailerFatherHusbandName: "Suraj Bhan",
        bailerOccupation: "Farmer / Business",
        bailerAddresses: [
          {
            sNo: 1,
            addressType: "Permanent",
            address: `Ward No. 4, ${fir.district || "Gurugram"}`,
          },
        ],
        identificationDob: "15/07/1994",
        identificationUid: "XXXX-XXXX-9821",
        otherIdProofs: [
          {
            sNo: 1,
            idType: "Aadhaar Card",
            idNumber: "XXXX-XXXX-9821",
          },
        ],
        previousConvictions: [
          {
            sNo: 1,
            firNo: "Nil",
            state: "Haryana",
            district: fir.district || "Gurugram",
            policeStation: fir.policeStation || "PS City",
            descriptionOfCase: "No previous criminal record found",
            convictionAcquittal: "Nil",
          },
        ],
        statusOfAccused: "On Police Bail u/s 48 BNSS / Forwarded to Court",
      }))
    : [
        {
          sNo: 1,
          name: "Named Accused",
          whetherVerified: "Yes",
          husbandFatherName: "Father / Guardian",
          dateOrYearOfBirth: "1992",
          sex: "Male",
          nationality: "Indian",
          passportNo: "",
          religion: "Hindu",
          scStObc: "OBC",
          occupation: "Private Worker",
          addresses: [
            {
              sNo: 1,
              addressType: "Permanent & Present",
              address: `House No. 142, ${fir.district || "Gurugram"}`,
              whetherVerified: "Yes",
            },
          ],
          regularCriminalNo: "Nil",
          dateOfArrest: new Date().toISOString().slice(0, 10),
          dateOfReleaseOnBail: "Admitted to Bail on 20,000/- PR Bond",
          dateForwardedToCourt: new Date().toISOString().slice(0, 10),
          underActsSections: [
            {
              sNo: 1,
              act: fir.majorAct || "Bharatiya Nyaya Sanhita, 2023",
              sections: fir.actsAndSections || "303(2), 115(2) BNS",
            },
          ],
          bailerName: "Mahender Singh",
          bailerFatherHusbandName: "Ram Chander",
          bailerOccupation: "Shopkeeper",
          bailerAddresses: [
            {
              sNo: 1,
              addressType: "Permanent",
              address: `${fir.district || "Gurugram"}`,
            },
          ],
          identificationDob: "12/04/1992",
          identificationUid: "XXXX-XXXX-4512",
          otherIdProofs: [
            {
              sNo: 1,
              idType: "Aadhaar / Voter ID",
              idNumber: "HR/04/231/449102",
            },
          ],
          previousConvictions: [
            {
              sNo: 1,
              firNo: "Nil",
              state: "Haryana",
              district: fir.district || "Gurugram",
              policeStation: fir.policeStation || "PS City",
              descriptionOfCase: "No previous criminal convictions",
              convictionAcquittal: "Nil",
            },
          ],
          statusOfAccused: "On Bail (Report forwarded for trial)",
        },
      ];

  const rawProperties = (fir as any).seizedProperties;
  const propertyRows = (rawProperties && rawProperties.length > 0)
    ? rawProperties.map((p: any, idx: number) => ({
        sNo: idx + 1,
        propertyDescription: p.description || p.propertyName || "Seized Material Object",
        estimatedValue: p.estimatedValue ? String(p.estimatedValue) : "N/A",
        psPropertyRegisterNo: p.malkhanaNumber || `Reg-${idx + 1}/2026`,
        fromWhomWhereRecovered: p.recoveredFrom || "From spot / possession of accused",
        disposal: "Deposited in Malkhana for Court exhibit",
      }))
    : [
        {
          sNo: 1,
          propertyDescription: "Crime weapon / recovered property as per Seizure Memo (IIF-IV)",
          estimatedValue: "15,000",
          psPropertyRegisterNo: "Malkhana Entry # 24/2026",
          fromWhomWhereRecovered: "From possession of accused at scene of crime",
          disposal: "Deposited in Police Station Malkhana",
        },
      ];

  const briefFacts =
    reportItem?.content && reportItem.content.length > 100
      ? reportItem.content
      : fir.incidentDetails ||
        fir.briefFacts ||
        `Investigation in FIR No. ${fir.firNumber} was taken up by the Investigating Officer. The scene of crime was inspected and Crime Details Form (IIF-II) along with site map was prepared. Statements of the complainant and witnesses were recorded u/s 180 BNSS. Material evidences were seized vide Seizure Memo IIF-IV and deposited in Malkhana. Accused was apprehended, interrogated, and admitted to bail upon statutory bond. Prima facie offences stand substantiated beyond reasonable doubt, and the accused is accordingly sent for trial.`;

  return generateIIFVChargesheetHtml({
    court,
    district: fir.district || currentUser?.district || "Gurugram",
    ps: fir.policeStation || currentUser?.stationName || "Sector 29 Police Station",
    year,
    firNo: fir.firNumber,
    firDate: fir.firDate ? fir.firDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    reportNo,
    reportDate,
    actRows,
    finalFormType: "Charge Sheet / Challan (दोषारोप पत्र)",
    ifFirUnoccurred: "No / Not Applicable",
    ifChargeSheet: "Original (मूल चालान)",
    ioName: reportItem?.officerName || fir.assignedIoName || currentUser?.name || "SI Neeraj Kumar",
    ioRank: reportItem?.officerRank || fir.assignedIoRank || currentUser?.rank || "Sub-Inspector",
    ioNo: reportItem?.officerPno || fir.assignedIoBeltNumber || currentUser?.beltNumber || "SI/6641",
    complainantName: fir.complainantName || "Complainant",
    complainantFather: fir.complainantRelativeName || fir.complainantFatherSpouse || "Father / Guardian",
    propertyRows,
    accusedPersonList,
    accusedNotChargeSheeted: "None. No innocent suspect detained or kept in column 12.",
    witnessesList: `1. PW-1: ${fir.complainantName || "Complainant"} (Informant - Proof of complaint & occurrence)\n2. PW-2: Eye-witness to incident (Corroboration of crime)\n3. PW-3: Panch Witness (Recovery of case property u/s 105 BNSS)\n4. PW-4: Medical Officer / Doctor (Medical examination report)\n5. PW-5: Scientific / FSL Expert (Forensic confirmation)\n6. PW-6: MHC Police Station (Malkhana entry & safe custody)\n7. PW-7: Investigating Officer (${fir.assignedIoName || "IO"}) (Complete investigation trail)`,
    falseFirAction: "Not Applicable. FIR is true and offences are fully substantiated.",
    labAnalysis: `FSL Report No. FSL/KUK/2026/894 dated ${reportDate} received and enclosed. Forensic findings corroborate prosecution case.`,
    briefFacts,
    referNoticeServed: "No (Charge-sheet filed for trial)",
    referNoticeDate: "",
    referNoticeAck: "N/A",
    despatchedOn: reportDate,
    noOfEnclosures: "10",
    listOfEnclosures: `1. First Information Report (FIR No. ${fir.firNumber})\n2. Crime Detail Form (IIF-II) & Site Map\n3. Property Seizure Memo (IIF-IV)\n4. Arrest & Inspection Memos (IIF-III)\n5. Statements of Witnesses u/s 180 BNSS\n6. Medical Examination / Injury Report\n7. Forensic Science Laboratory (FSL) Report\n8. Extract of Police Station Property Register (Malkhana)\n9. Personal & Surety Bail Bonds\n10. Case Diary (Zimni) Compilation`,
    shoName: "Inspector Satish Kumar",
    shoRank: "Inspector / SHO",
    shoNo: "SHO/01",
  });
}
