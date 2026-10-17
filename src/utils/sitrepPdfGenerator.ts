/**
 * Dedicated Crime SITREP PDF Generator & Downloader for Haryana Police CMS
 * 
 * Generates and downloads true .pdf files matching the official police template:
 * - Direct PDF download from active template view (CrimeSitrepView)
 * - Direct PDF download from Saved Reports cards (SavedReportsView)
 * - Exact layout preservation: emblem, 17 crime summary heads, sections I-XI, tables, signatures
 */

import { CrimeSitrepData } from "@/types/reports";
import { printA4Element } from "./printElement";

export function generateSitrepTemplateHtml(data: CrimeSitrepData): string {
  const safeStr = (v?: any) => (v !== undefined && v !== null && String(v).trim() !== "" ? String(v) : "--");

  // Summary rows
  const summaryRows = (data.section1HeadCounts || [])
    .map(
      (h) => `
      <tr style="border-bottom: 1px solid #cbd5e1; ${h.srNo === 14 || h.srNo === 17 ? "background-color: #f1f5f9; font-weight: bold;" : ""}">
        <td style="padding: 6px 10px; border: 1px solid #94a3b8; text-align: center; width: 60px;">${h.srNo}</td>
        <td style="padding: 6px 10px; border: 1px solid #94a3b8;">${h.head}</td>
        <td style="padding: 6px 10px; border: 1px solid #94a3b8; text-align: center; width: 120px; font-weight: bold;">${h.totalNumber}</td>
      </tr>`
    )
    .join("");

  // Section I FIRs
  const firCards = (data.firEntries || [])
    .map(
      (f, idx) => `
      <div style="border: 1px solid #94a3b8; border-radius: 6px; margin-bottom: 14px; page-break-inside: avoid; break-inside: avoid; background: #ffffff;">
        <div style="background: #0f172a; color: #ffffff; padding: 6px 12px; font-weight: bold; font-size: 11px; display: flex; justify-content: space-between;">
          <span>RECORD #${f.srNo || idx + 1} &bull; PS ${f.ps} &bull; FIR NO: ${f.firNo}</span>
          <span style="color: #fde047;">${f.head}</span>
        </div>
        <div style="padding: 10px; font-size: 11px; line-height: 1.5;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 50%; vertical-align: top; padding: 4px 6px; border: 1px solid #e2e8f0;">
                <span style="font-weight: bold; color: #475569;">Dated:</span> ${f.dated}<br/>
                <span style="font-weight: bold; color: #475569;">U/S:</span> ${f.us}<br/>
                <span style="font-weight: bold; color: #475569;">Complainant:</span> ${f.complainant}<br/>
                <span style="font-weight: bold; color: #475569;">Complainant Mob:</span> ${f.complainantMobile}<br/>
                <span style="font-weight: bold; color: #475569;">Victim:</span> ${f.victim}
              </td>
              <td style="width: 50%; vertical-align: top; padding: 4px 6px; border: 1px solid #e2e8f0;">
                <span style="font-weight: bold; color: #475569;">Occurrence From:</span> ${f.occurrenceFrom}<br/>
                <span style="font-weight: bold; color: #475569;">Occurrence To:</span> ${f.occurrenceTo}<br/>
                <span style="font-weight: bold; color: #475569;">Place:</span> ${f.placeOfOccurrence}<br/>
                <span style="font-weight: bold; color: #475569;">Property Amount:</span> ₹ ${f.totalPropertyAmount}<br/>
                <span style="font-weight: bold; color: #475569;">Delay Reason:</span> ${f.reasonOfDelay}
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 6px; border: 1px solid #e2e8f0; background: #f8fafc;">
                <span style="font-weight: bold; color: #1e293b;">Accused Details:</span> ${safeStr(f.accused)}
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 6px; border: 1px solid #e2e8f0;">
                <span style="font-weight: bold; color: #1e293b;">Brief Facts:</span> ${safeStr(f.briefFacts)}
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 6px; border: 1px solid #e2e8f0; background: #f1f5f9; font-weight: bold;">
                <span>Investigation Officer (I.O.): ${f.ioNameRank} (Mob: ${f.ioMobile})</span>
              </td>
            </tr>
          </table>
        </div>
      </div>`
    )
    .join("");

  // Section II Arrests
  const arrestRows = (data.arrests || [])
    .map(
      (a) => `
      <tr style="border-bottom: 1px solid #cbd5e1; page-break-inside: avoid; break-inside: avoid;">
        <td style="padding: 6px; border: 1px solid #94a3b8; text-align: center;">${a.srNo}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8; font-family: monospace;">${a.gdNoArrestTime}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8;">${a.ps}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8; font-weight: bold;">${a.firNoAndUs}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8;">${a.head}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8; font-family: monospace;">${a.firDate}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8;">${a.accusedDetails}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8;">${a.ioDetails}</td>
      </tr>`
    )
    .join("");

  // Section III Recoveries
  const recoveryRows = (data.recoveries || [])
    .map(
      (r) => `
      <tr style="border-bottom: 1px solid #cbd5e1; page-break-inside: avoid; break-inside: avoid;">
        <td style="padding: 6px; border: 1px solid #94a3b8; text-align: center;">${r.srNo}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8; font-family: monospace;">${r.gdNoRecoveryTime}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8;">${r.ps}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8; font-weight: bold;">${r.firNoAndUs}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8;">${r.head}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8; font-family: monospace;">${r.firDate}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8; font-weight: bold; color: #047857;">${r.recoveredItems}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8;">${r.ioDetails}</td>
      </tr>`
    )
    .join("");

  // Section IV Modifications
  const modRows = (data.modifications || [])
    .map(
      (m) => `
      <tr style="border-bottom: 1px solid #cbd5e1; page-break-inside: avoid; break-inside: avoid;">
        <td style="padding: 6px; border: 1px solid #94a3b8; text-align: center;">${m.srNo}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8;">${m.ps}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8; font-weight: bold;">${m.firNo}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8; font-family: monospace;">${m.firDate}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8;">${m.originalSection}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8; color: #15803d; font-weight: bold;">${m.sectionAdded}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8; color: #b91c1c;">${m.sectionRemoved}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8;">${m.head}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8; font-family: monospace;">${m.dateOfModification}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8;">${m.ioDetails}</td>
      </tr>`
    )
    .join("");

  // Section V Disposals (Complete, Partial, Cancellation, Untraced)
  const completeRows = (data.completeChallans || [])
    .map(
      (c) => `
      <tr style="border-bottom: 1px solid #cbd5e1;">
        <td style="padding: 5px; border: 1px solid #94a3b8; text-align: center;">${c.srNo}</td>
        <td style="padding: 5px; border: 1px solid #94a3b8;">${c.ps}</td>
        <td style="padding: 5px; border: 1px solid #94a3b8; font-weight: bold;">${c.firNo}</td>
        <td style="padding: 5px; border: 1px solid #94a3b8;">${c.firDate}</td>
        <td style="padding: 5px; border: 1px solid #94a3b8;">${c.head}</td>
        <td style="padding: 5px; border: 1px solid #94a3b8; text-align: center;">${c.accusedArrested}</td>
        <td style="padding: 5px; border: 1px solid #94a3b8;">${c.type}</td>
        <td style="padding: 5px; border: 1px solid #94a3b8;">${c.ioDetails}</td>
      </tr>`
    )
    .join("");

  const cancellationRows = (data.cancellations || [])
    .map(
      (c) => `
      <tr style="border-bottom: 1px solid #cbd5e1;">
        <td style="padding: 5px; border: 1px solid #94a3b8; text-align: center;">${c.srNo}</td>
        <td style="padding: 5px; border: 1px solid #94a3b8;">${c.ps}</td>
        <td style="padding: 5px; border: 1px solid #94a3b8; font-weight: bold;">${c.firNo}</td>
        <td style="padding: 5px; border: 1px solid #94a3b8;">${c.firDate}</td>
        <td style="padding: 5px; border: 1px solid #94a3b8;">${c.head}</td>
        <td style="padding: 5px; border: 1px solid #94a3b8;">${c.ioDetails}</td>
        <td style="padding: 5px; border: 1px solid #94a3b8; font-weight: bold; color: #b91c1c;">${c.reason}</td>
      </tr>`
    )
    .join("");

  const untracedRows = (data.untraced || [])
    .map(
      (u) => `
      <tr style="border-bottom: 1px solid #cbd5e1;">
        <td style="padding: 5px; border: 1px solid #94a3b8; text-align: center;">${u.srNo}</td>
        <td style="padding: 5px; border: 1px solid #94a3b8;">${u.ps}</td>
        <td style="padding: 5px; border: 1px solid #94a3b8; font-weight: bold;">${u.firNo}</td>
        <td style="padding: 5px; border: 1px solid #94a3b8;">${u.firDate}</td>
        <td style="padding: 5px; border: 1px solid #94a3b8;">${u.head}</td>
        <td style="padding: 5px; border: 1px solid #94a3b8; text-align: center;">${u.byName}</td>
        <td style="padding: 5px; border: 1px solid #94a3b8;">${u.ioDetails}</td>
        <td style="padding: 5px; border: 1px solid #94a3b8;">₹ ${u.propertyStolenOrInvolved}</td>
      </tr>`
    )
    .join("");

  // Section X Rukkas
  const rukkaRows = (data.rukkas || [])
    .map(
      (rk) => `
      <tr style="border-bottom: 1px solid #cbd5e1; page-break-inside: avoid; break-inside: avoid;">
        <td style="padding: 6px; border: 1px solid #94a3b8; text-align: center;">${rk.srNo}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8;">${rk.ps}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8; font-weight: bold;">${rk.patientDetails}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8; font-family: monospace;">${rk.rukkaIdHospital}</td>
        <td style="padding: 6px; border: 1px solid #94a3b8;">${rk.briefDetails}</td>
      </tr>`
    )
    .join("");

  // Section XI Uploads
  let totalReg = 0;
  let totalUp = 0;
  let totalNotUp = 0;
  const uploadRows = (data.uploadSummaries || [])
    .map((up) => {
      totalReg += up.registeredPreviousDay;
      totalUp += up.uploadedCitizenPortal;
      totalNotUp += up.notUploadedCitizenPortal;
      return `
      <tr style="border-bottom: 1px solid #cbd5e1;">
        <td style="padding: 5px 8px; border: 1px solid #94a3b8; font-weight: 500;">${up.ps}</td>
        <td style="padding: 5px 8px; border: 1px solid #94a3b8; text-align: center; font-weight: bold;">${up.registeredPreviousDay}</td>
        <td style="padding: 5px 8px; border: 1px solid #94a3b8; text-align: center; color: #15803d; font-weight: bold;">${up.uploadedCitizenPortal}</td>
        <td style="padding: 5px 8px; border: 1px solid #94a3b8; text-align: center; color: #b91c1c; font-weight: bold;">${up.notUploadedCitizenPortal}</td>
      </tr>`;
    })
    .join("");

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.4; font-size: 11px;">
      
      <!-- 1. OFFICIAL COVER HEADER -->
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
        <div style="width: 44px; height: 44px; margin: 0 auto 8px auto; border-radius: 50%; background: #0f172a; color: #fde047; font-weight: bold; font-size: 16px; line-height: 44px; text-align: center;">
          ह.पु
        </div>
        <h1 style="font-size: 18px; font-weight: 900; text-transform: uppercase; margin: 0; letter-spacing: 0.5px;">
          ${data.reportTitle || "CRIME SITREP"} For ${data.officeTitle || "Superintendent of Police"},
        </h1>
        <h2 style="font-size: 16px; font-weight: bold; text-transform: uppercase; margin: 2px 0 6px 0;">
          ${data.district}
        </h2>
        <div style="font-size: 12px; font-weight: bold; color: #1e293b; margin-bottom: 2px;">
          Report Date: <span style="font-family: monospace;">${data.reportDate}</span>
        </div>
        <div style="font-size: 11px; font-family: monospace; font-style: italic; color: #475569;">
          ${data.cutoffTime}
        </div>
        
        <div style="margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 6px; display: flex; justify-content: space-between; font-size: 10px; font-family: monospace; color: #64748b;">
          <span>Generated: ${data.generatedDateTime || new Date().toLocaleString("en-IN")}</span>
          <span style="font-weight: bold; color: #0f172a;">Office: ${data.officeLocation || `Superintendent of Police, ${data.district}`}</span>
          <span>Page 1 of ${data.totalPages || 19}</span>
        </div>
      </div>

      <!-- 2. CRIME SUMMARY (PAGE 1) -->
      <div style="margin-bottom: 24px; page-break-after: always; break-after: page;">
        <div style="background: #0b192c; color: #ffffff; padding: 6px 10px; font-weight: bold; font-size: 12px; border-radius: 4px 4px 0 0;">
          Crime Summary — Page 1
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #e2e8f0; font-weight: bold;">
              <th style="padding: 6px 10px; border: 1px solid #94a3b8; text-align: center; width: 60px;">Sr. No.</th>
              <th style="padding: 6px 10px; border: 1px solid #94a3b8; text-align: left;">HEAD</th>
              <th style="padding: 6px 10px; border: 1px solid #94a3b8; text-align: center; width: 120px;">TOTAL NUMBER</th>
            </tr>
          </thead>
          <tbody>
            ${summaryRows || `<tr><td colspan="3" style="text-align: center; padding: 12px; border: 1px solid #94a3b8;">No records</td></tr>`}
          </tbody>
        </table>
      </div>

      <!-- 3. SECTION I: REGISTRATION OF FIR -->
      <div style="margin-bottom: 24px; page-break-after: always; break-after: page;">
        <div style="background: #0b192c; color: #ffffff; padding: 6px 10px; font-weight: bold; font-size: 12px; border-radius: 4px 4px 0 0; margin-bottom: 12px;">
          Section I: Registration of FIR (Pages 2–6)
        </div>
        ${firCards || `<p style="text-align: center; color: #64748b; padding: 16px; border: 1px dashed #cbd5e1;">इस तारीख को कोई FIR दर्ज नहीं पाई गई (No FIRs registered)</p>`}
      </div>

      <!-- 4. SECTION II: ACCUSED ARRESTED -->
      <div style="margin-bottom: 24px; page-break-after: always; break-after: page;">
        <div style="background: #0b192c; color: #ffffff; padding: 6px 10px; font-weight: bold; font-size: 12px; border-radius: 4px 4px 0 0;">
          Section II: Accused arrested (Pages 7–8)
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
          <thead>
            <tr style="background: #e2e8f0; font-weight: bold;">
              <th style="padding: 6px; border: 1px solid #94a3b8;">SNo.</th>
              <th style="padding: 6px; border: 1px solid #94a3b8;">GD No. / Arrest Time</th>
              <th style="padding: 6px; border: 1px solid #94a3b8;">PS</th>
              <th style="padding: 6px; border: 1px solid #94a3b8;">FIR No. & U/S</th>
              <th style="padding: 6px; border: 1px solid #94a3b8;">Head</th>
              <th style="padding: 6px; border: 1px solid #94a3b8;">FIR Date</th>
              <th style="padding: 6px; border: 1px solid #94a3b8;">Details of Accused</th>
              <th style="padding: 6px; border: 1px solid #94a3b8;">Details of IO</th>
            </tr>
          </thead>
          <tbody>
            ${arrestRows || `<tr><td colspan="8" style="text-align: center; padding: 10px; border: 1px solid #94a3b8;">No arrested accused records</td></tr>`}
          </tbody>
        </table>
      </div>

      <!-- 5. SECTION III: CASE PROPERTY RECOVERED/SEIZED -->
      <div style="margin-bottom: 24px; page-break-after: always; break-after: page;">
        <div style="background: #0b192c; color: #ffffff; padding: 6px 10px; font-weight: bold; font-size: 12px; border-radius: 4px 4px 0 0;">
          Section III: Case Property Recovered/Seized (Pages 8–12)
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
          <thead>
            <tr style="background: #e2e8f0; font-weight: bold;">
              <th style="padding: 6px; border: 1px solid #94a3b8;">SNo.</th>
              <th style="padding: 6px; border: 1px solid #94a3b8;">GD No. / Recovery Time</th>
              <th style="padding: 6px; border: 1px solid #94a3b8;">PS</th>
              <th style="padding: 6px; border: 1px solid #94a3b8;">FIR No. & U/S</th>
              <th style="padding: 6px; border: 1px solid #94a3b8;">Head</th>
              <th style="padding: 6px; border: 1px solid #94a3b8;">FIR Date</th>
              <th style="padding: 6px; border: 1px solid #94a3b8;">Recovered Items</th>
              <th style="padding: 6px; border: 1px solid #94a3b8;">Details of IO</th>
            </tr>
          </thead>
          <tbody>
            ${recoveryRows || `<tr><td colspan="8" style="text-align: center; padding: 10px; border: 1px solid #94a3b8;">No seized property records</td></tr>`}
          </tbody>
        </table>
      </div>

      <!-- 6. SECTION IV: MODIFICATION OF SECTIONS -->
      <div style="margin-bottom: 24px;">
        <div style="background: #0b192c; color: #ffffff; padding: 6px 10px; font-weight: bold; font-size: 12px; border-radius: 4px 4px 0 0;">
          Section IV: Modification of sections (Pages 12–13)
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background: #e2e8f0; font-weight: bold;">
              <th style="padding: 5px; border: 1px solid #94a3b8;">SNo.</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">PS</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">FIR No.</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">FIR Date</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">Original Section</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">Section Added</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">Section Removed</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">Head</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">Modification Date</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">Details of IO</th>
            </tr>
          </thead>
          <tbody>
            ${modRows || `<tr><td colspan="10" style="text-align: center; padding: 10px; border: 1px solid #94a3b8;">No modified sections recorded</td></tr>`}
          </tbody>
        </table>
      </div>

      <!-- 7. SECTION V: DISPOSAL OF CASES -->
      <div style="margin-bottom: 24px; page-break-after: always; break-after: page;">
        <div style="background: #0b192c; color: #ffffff; padding: 6px 10px; font-weight: bold; font-size: 12px; border-radius: 4px 4px 0 0;">
          Section V: Disposal of Cases (Pages 13–16)
        </div>
        
        <h4 style="font-size: 11px; font-weight: bold; margin: 10px 0 4px 0; color: #1e293b;">(A) Complete Challans</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 12px;">
          <thead>
            <tr style="background: #e2e8f0; font-weight: bold;">
              <th style="padding: 5px; border: 1px solid #94a3b8;">SNo.</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">PS</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">FIR No.</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">FIR Date</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">Head</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">Accused Arrested</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">Type</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">Details of IO</th>
            </tr>
          </thead>
          <tbody>
            ${completeRows || `<tr><td colspan="8" style="text-align: center; padding: 6px; border: 1px solid #94a3b8;">No complete challans</td></tr>`}
          </tbody>
        </table>

        <h4 style="font-size: 11px; font-weight: bold; margin: 10px 0 4px 0; color: #1e293b;">(B) Cancellations</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 12px;">
          <thead>
            <tr style="background: #e2e8f0; font-weight: bold;">
              <th style="padding: 5px; border: 1px solid #94a3b8;">SNo.</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">PS</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">FIR No.</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">FIR Date</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">Head</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">IO Details</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">Reason of Cancellation</th>
            </tr>
          </thead>
          <tbody>
            ${cancellationRows || `<tr><td colspan="7" style="text-align: center; padding: 6px; border: 1px solid #94a3b8;">No cancellations</td></tr>`}
          </tbody>
        </table>

        <h4 style="font-size: 11px; font-weight: bold; margin: 10px 0 4px 0; color: #1e293b;">(C) Untraced Cases</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background: #e2e8f0; font-weight: bold;">
              <th style="padding: 5px; border: 1px solid #94a3b8;">SNo.</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">PS</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">FIR No.</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">FIR Date</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">Head</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">By Name</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">IO Details</th>
              <th style="padding: 5px; border: 1px solid #94a3b8;">Stolen/Involved Amount</th>
            </tr>
          </thead>
          <tbody>
            ${untracedRows || `<tr><td colspan="8" style="text-align: center; padding: 6px; border: 1px solid #94a3b8;">No untraced cases</td></tr>`}
          </tbody>
        </table>
      </div>

      <!-- 8. SECTION X: RUKKA ISSUED -->
      <div style="margin-bottom: 24px; page-break-after: always; break-after: page;">
        <div style="background: #0b192c; color: #ffffff; padding: 6px 10px; font-weight: bold; font-size: 12px; border-radius: 4px 4px 0 0;">
          Section X: Rukka issued (Pages 16–19)
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
          <thead>
            <tr style="background: #e2e8f0; font-weight: bold;">
              <th style="padding: 6px; border: 1px solid #94a3b8; width: 50px;">SNo.</th>
              <th style="padding: 6px; border: 1px solid #94a3b8; width: 140px;">PS</th>
              <th style="padding: 6px; border: 1px solid #94a3b8; width: 220px;">Patient Details</th>
              <th style="padding: 6px; border: 1px solid #94a3b8; width: 180px;">Rukka ID, Hospital</th>
              <th style="padding: 6px; border: 1px solid #94a3b8;">Brief details of the incident</th>
            </tr>
          </thead>
          <tbody>
            ${rukkaRows || `<tr><td colspan="5" style="text-align: center; padding: 10px; border: 1px solid #94a3b8;">No Rukka records on this audit date</td></tr>`}
          </tbody>
        </table>
      </div>

      <!-- 9. SECTION XI: FIR UPLOAD SUMMARY -->
      <div style="margin-bottom: 24px;">
        <div style="background: #0b192c; color: #ffffff; padding: 6px 10px; font-weight: bold; font-size: 12px; border-radius: 4px 4px 0 0;">
          Section XI: FIR Upload Summary Report (Page 19)
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #e2e8f0; font-weight: bold;">
              <th style="padding: 6px 8px; border: 1px solid #94a3b8; text-align: left;">Police Station</th>
              <th style="padding: 6px 8px; border: 1px solid #94a3b8; text-align: center;">FIR Registered on Previous Day</th>
              <th style="padding: 6px 8px; border: 1px solid #94a3b8; text-align: center;">FIR Uploaded in Citizen Portal</th>
              <th style="padding: 6px 8px; border: 1px solid #94a3b8; text-align: center;">FIR NOT Uploaded in Citizen Portal</th>
            </tr>
          </thead>
          <tbody>
            ${uploadRows}
            <tr style="background: #0f172a; color: #ffffff; font-weight: bold;">
              <td style="padding: 6px 8px; border: 1px solid #0f172a;">TOTAL</td>
              <td style="padding: 6px 8px; border: 1px solid #0f172a; text-align: center;">${totalReg}</td>
              <td style="padding: 6px 8px; border: 1px solid #0f172a; text-align: center; color: #4ade80;">${totalUp}</td>
              <td style="padding: 6px 8px; border: 1px solid #0f172a; text-align: center; color: #f87171;">${totalNotUp}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 10. OFFICIAL STAMP & SIGNATURE BLOCK -->
      <div style="margin-top: 32px; border-top: 2px solid #0f172a; padding-top: 16px; display: flex; justify-content: space-between; page-break-inside: avoid; break-inside: avoid;">
        <div style="font-size: 10px; color: #64748b; max-width: 450px;">
          <p style="margin: 0; font-weight: bold; color: #0f172a;">CONFIDENTIAL LEGAL POLICE DOCUMENT</p>
          <p style="margin: 2px 0;">Generated automatically via Haryana Police Centralized Management System.</p>
          <p style="margin: 0; font-family: monospace;">Record Verification Hash: SHA256-${Date.now().toString(36).toUpperCase()}</p>
        </div>
        <div style="text-align: right; font-size: 11px;">
          <p style="margin: 0; font-weight: bold; color: #0f172a;">${data.controlRoomIncharge || `Incharge Control Room, ${data.district}`}</p>
          <p style="margin: 2px 0; font-weight: 900; text-transform: uppercase;">${data.officeTitle || "SUPERINTENDENT OF POLICE"}, ${data.district}</p>
          <p style="margin: 0; font-size: 10px; font-family: monospace; color: #64748b;">Dated ${data.reportDate}</p>
        </div>
      </div>

    </div>
  `;
}

/**
 * Downloads a CrimeSitrepData instance directly as a styled .pdf file.
 * Used in SavedReportsView when clicking "Download PDF" on any saved report.
 */
export async function downloadSitrepDataAsPdf(data: CrimeSitrepData, customFilename?: string): Promise<void> {
  if (typeof window === "undefined") return;

  const district = (data.district || "DISTRICT").toUpperCase();
  const dateStr = (data.reportDate || "DATE").replace(/\//g, "-");
  const filename = customFilename || `CRIME_SITREP_${district}_${dateStr}`;

  // Create temporary container
  const container = document.createElement("div");
  container.id = "temp-pdf-export-container";
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "900px";
  container.style.padding = "24px";
  container.style.background = "#ffffff";
  container.style.zIndex = "-1000";
  container.innerHTML = generateSitrepTemplateHtml(data);
  document.body.appendChild(container);

  try {
    const html2pdf = (await import("html2pdf.js")).default;
    const opt = {
      margin: [10, 8, 10, 8] as [number, number, number, number],
      filename: `${filename}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        windowWidth: 1024,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait" as const,
        compress: true,
      },
      pagebreak: { mode: ["css", "legacy"] },
    };

    await html2pdf().from(container).set(opt).save();
  } catch (err) {
    console.warn("Direct html2pdf conversion encountered an issue, falling back to print utility:", err);
    printA4Element(container, filename);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Downloads an active live DOM element (e.g. #printable-sitrep-document) directly as a styled .pdf file.
 * Used in CrimeSitrepView when user clicks "Save to Reports History" or "Download PDF".
 */
export async function downloadElementAsPdf(elementOrId: HTMLElement | string, filename: string): Promise<void> {
  if (typeof window === "undefined") return;

  const el = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;
  if (!el) {
    console.warn("Element not found for PDF download:", elementOrId);
    return;
  }

  const clone = el.cloneNode(true) as HTMLElement;

  // Convert inputs, textareas, selects into plain text spans
  const origInputs = el.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "input, textarea, select"
  );
  const cloneInputs = clone.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "input, textarea, select"
  );
  for (let i = 0; i < origInputs.length; i++) {
    const orig = origInputs[i];
    const dest = cloneInputs[i];
    if (!dest) continue;
    const span = document.createElement("span");
    span.textContent = orig.value || "--";
    span.className = "font-medium text-slate-900";
    dest.parentNode?.replaceChild(span, dest);
  }

  // Remove interactive / screen-only elements
  clone.querySelectorAll(".print\\:hidden, .no-print, button, [data-no-print]").forEach((h) => h.remove());

  // Mount off-screen for crisp rendering
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-9999px";
  wrapper.style.top = "0";
  wrapper.style.width = "960px";
  wrapper.style.padding = "20px";
  wrapper.style.background = "#ffffff";
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    const html2pdf = (await import("html2pdf.js")).default;
    const opt = {
      margin: [8, 8, 8, 8] as [number, number, number, number],
      filename: `${filename}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        windowWidth: 1024,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait" as const,
        compress: true,
      },
      pagebreak: { mode: ["css", "legacy"] },
    };

    await html2pdf().from(wrapper).set(opt).save();
  } catch (err) {
    console.warn("Direct html2pdf conversion encountered an issue, falling back to print utility:", err);
    printA4Element(wrapper, filename);
  } finally {
    if (document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }
  }
}
