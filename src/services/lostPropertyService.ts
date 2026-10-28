import { escapeDocumentValue } from "@/lib/dataIntegrity";
import { LostPropertyRecord, GDSearchResultItem } from "@/types/lostProperty";

const STORAGE_KEY = "haryana_police_cms_lost_property_records_v1";

const SEED_RECORDS: LostPropertyRecord[] = [
  {
    id: "lp_rec_2019_0002",
    registrationNumber: "0002/2019",
    registrationYear: "2019",
    createdAt: "2019-04-22T11:45:00.000Z",
    updatedAt: "2019-04-22T11:45:00.000Z",
    status: "UNDER_ENQUIRY",
    gdNumber: "003",
    gdDateTime: "22/04/2019, 11:33",
    dateOfPropertyMissing: "2019-04-22",
    timeOfPropertyMissing: "11:30",
    district: "PANCHKULA",
    year: "2019",
    placeFromWhereMissing: "Bus stand PKL",
    policeStation: "PANCHKULA SECTOR-5",
    properties: [
      {
        id: "prop_item_01",
        category: "ELECTRICAL AND ELECTRONIC GOODS",
        subType: "MOBILE PHONE",
        estimatedValue: 12000,
        idType: "IMEI NO.",
        identificationNumbers: ["864920048192031"],
        quantity: 1,
        makeManufacturer: "Samsung",
        remarks: "Samsung Galaxy Smartphone Black colour with Jio SIM inserted.",
      },
    ],
    uid: "8910-2391-4491",
    firstName: "raju",
    middleName: "",
    lastName: "Singh",
    gender: "Male",
    occupation: "Private Service",
    relationType: "Father",
    relativeName: "Shyam Singh",
    mobileNumbers: ["+91 9812033441"],
    dob: "1994-08-15",
    yearOfBirth: "1994",
    ageYears: "24",
    ageMonths: "8",
    ageRangeFrom: "",
    ageRangeTo: "",
    presentAddress: {
      houseNo: "Flat 402, Tower B",
      streetName: "Old Ropar Road",
      colony: "Sector 14",
      villageTownCity: "PKL",
      tehsil: "Panchkula",
      country: "INDIA",
      state: "HARYANA",
      district: "PANCHKULA",
      policeStation: "PANCHKULA SECTOR-5",
      pincode: "134112",
    },
    sameAsPresent: true,
    permanentAddress: {
      houseNo: "Flat 402, Tower B",
      streetName: "Old Ropar Road",
      colony: "Sector 14",
      villageTownCity: "PKL",
      tehsil: "Panchkula",
      country: "INDIA",
      state: "HARYANA",
      district: "PANCHKULA",
      policeStation: "PANCHKULA SECTOR-5",
      pincode: "134112",
    },
    nameOfEo: "Lalit Kumar (I (Inspector))-53175",
    eoRank: "I (Inspector)",
    eoNumber: "53175",
    remarks: "Enquiry entrusted to Inspector Lalit Kumar. CDR/Tower dump verification & CEIR portal blocking initiated.",
    expectedDateToComplete: "2019-04-24",
    registeredBy: "Inspector Lalit Kumar",
  },
];

export const MOCK_GD_SEARCH_RESULTS: GDSearchResultItem[] = [
  {
    id: "gd_search_003",
    gdNumber: "003",
    gdType: "Lost Property",
    dateTime: "22/04/2019 11:33",
    entryForOfficer: "Lalit Kumar, Inspector",
    subject: "GD for Lost property",
    brief: "Complainant Raju Singh reported loss of Samsung Mobile phone at Bus stand PKL at 11:30 AM while boarding local bus.",
  },
  {
    id: "gd_search_014",
    gdNumber: "014",
    gdType: "Lost Property",
    dateTime: "15/10/2026 14:15",
    entryForOfficer: "Vikram Singh, Sub-Inspector",
    subject: "Report of Lost Documents & Driving License",
    brief: "Citizen reported loss of original driving license, RC folder and PAN card near Main Market Thanesar.",
  },
  {
    id: "gd_search_028",
    gdNumber: "028",
    gdType: "Lost Property",
    dateTime: "16/10/2026 09:40",
    entryForOfficer: "Devinder Kumar, HC",
    subject: "Lost Apple iPhone 14 Pro Max",
    brief: "Loss of gold-coloured mobile phone during transit from Sector 7 to Bus Terminal, IMEI submitted for CEIR tracing.",
  },
];

let inMemoryRecords: LostPropertyRecord[] = [...SEED_RECORDS];

export const lostPropertyService = {
  getAll(): LostPropertyRecord[] {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            inMemoryRecords = parsed;
            return parsed;
          }
        }
      } catch (err) {
        console.error("Failed to read lost property from localStorage:", err);
      }
    }
    return inMemoryRecords;
  },

  getById(id: string): LostPropertyRecord | undefined {
    const list = this.getAll();
    return list.find((r) => r.id === id || r.registrationNumber === id);
  },

  getRecordById(id: string): LostPropertyRecord | undefined {
    return this.getById(id);
  },

  getRecordByRegNumber(regNo: string): LostPropertyRecord | undefined {
    return this.getAll().find((r) => r.registrationNumber === regNo);
  },

  getNextRegistrationNumber(yearStr: string = String(new Date().getFullYear())): string {
    const list = this.getAll();
    const sameYear = list.filter((r) => r.registrationYear === yearStr || r.registrationNumber.endsWith(`/${yearStr}`));
    const nextSeq = sameYear.reduce((max, r) => Math.max(max, Number(/^(\d+)\//.exec(r.registrationNumber)?.[1] || 0)), 0) + 1;
    return `${String(nextSeq).padStart(4, "0")}/${yearStr}`;
  },

  save(record: LostPropertyRecord): LostPropertyRecord {
    const list = structuredClone(this.getAll());
    const updated = {
      ...record,
      updatedAt: new Date().toISOString(),
    };

    const idx = list.findIndex((r) => r.id === record.id);
    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.unshift(updated);
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent("cms_lost_property_changed", { detail: updated }));
      } catch (err) {
        throw new Error("Lost property record could not be saved. Check browser storage and retry.");
      }
    }
    inMemoryRecords = [...list];
    return updated;
  },

  saveRecord(record: LostPropertyRecord): LostPropertyRecord {
    return this.save(record);
  },

  updateStatus(idOrRegNum: string, status: "OPEN" | "TRACED" | "CLOSED"): boolean {
    const list = structuredClone(this.getAll());
    const target = idOrRegNum?.toLowerCase().trim();
    const idx = list.findIndex(
      (r) =>
        r.id?.toLowerCase().trim() === target ||
        r.registrationNumber?.toLowerCase().trim() === target
    );
    if (idx >= 0) {
      const updated = {
        ...list[idx],
        status,
        updatedAt: new Date().toISOString(),
      };
      list[idx] = updated;

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
          inMemoryRecords = [...list];
          window.dispatchEvent(new CustomEvent("cms_lost_property_changed", { detail: updated }));
          return true;
        } catch (err) {
          throw new Error("Lost property status could not be saved.");
        }
      }
      return true;
    }
    return false;
  },

  delete(id: string): boolean {
    const list = this.getAll();
    const filtered = list.filter((r) => r.id !== id && r.registrationNumber !== id);
    inMemoryRecords = [...filtered];
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent("cms_lost_property_changed"));
        return true;
      } catch {
        return false;
      }
    }
    return true;
  },

  searchGD(query: {
    gdNumber?: string;
    gdType?: string;
    subject?: string;
    entryForOfficer?: string;
    dateFrom?: string;
    dateTo?: string;
  }): GDSearchResultItem[] {
    return MOCK_GD_SEARCH_RESULTS.filter((gd) => {
      if (query.gdNumber && !gd.gdNumber.toLowerCase().includes(query.gdNumber.toLowerCase())) {
        return false;
      }
      if (query.subject && !gd.subject.toLowerCase().includes(query.subject.toLowerCase())) {
        return false;
      }
      if (query.entryForOfficer && !gd.entryForOfficer.toLowerCase().includes(query.entryForOfficer.toLowerCase())) {
        return false;
      }
      if (query.gdType && gd.gdType.toLowerCase() !== query.gdType.toLowerCase()) return false;
      const [day, month, year] = gd.dateTime.slice(0,10).split('/');
      const date = `${year}-${month}-${day}`;
      if (query.dateFrom && date < query.dateFrom || query.dateTo && date > query.dateTo) return false;
      return true;
    });
  },

  generatePrintableHtml(record: LostPropertyRecord): string {
    record=escapeDocumentValue(record);
    const totalVal = record.properties.reduce((sum, p) => sum + (Number(p.estimatedValue) || 0), 0);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Lost Property Registration — ${record.registrationNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm 15mm 15mm; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; line-height: 1.35; margin: 0; padding: 0; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
    .title-main { font-size: 15pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
    .subtitle { font-size: 11pt; font-weight: bold; margin-top: 2px; }
    .badge-bar { display: flex; justify-content: space-between; font-size: 9.5pt; font-weight: bold; margin-top: 6px; border-top: 1px dashed #666; padding-top: 4px; }
    .section-title { font-size: 10.5pt; font-weight: bold; background: #e2e8f0; border-left: 4px solid #0f172a; padding: 3px 6px; margin: 10px 0 6px 0; text-transform: uppercase; }
    table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10pt; }
    table.data-table th, table.data-table td { border: 1px solid #475569; padding: 4px 6px; }
    table.data-table th { background: #f1f5f9; text-align: left; font-weight: bold; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .label { font-weight: bold; color: #334155; }
    .watermark { position: fixed; top: 40%; left: 15%; width: 70%; text-align: center; opacity: 0.06; font-size: 48pt; font-weight: 900; transform: rotate(-30deg); pointer-events: none; z-index: -1; }
    .footer-sign { display: flex; justify-content: space-between; margin-top: 30px; font-size: 10pt; }
    .sign-box { text-align: center; width: 45%; border-top: 1px solid #000; padding-top: 4px; }
  </style>
</head>
<body>
  <div class="watermark">HARYANA POLICE OFFICIAL</div>
  <div class="header">
    <div style="font-size: 11pt; font-weight: bold; letter-spacing: 1px;">HARYANA POLICE DEPARTMENT</div>
    <div class="title-main">LOST PROPERTY REGISTRATION REPORT</div>
    <div class="subtitle">(खोई संपत्ति / वस्तु पंजीकरण प्रतिवेदन)</div>
    <div class="badge-bar">
      <span>DISTRICT: ${record.district}</span>
      <span>PS: ${record.policeStation}</span>
      <span>REG. NO.: ${record.registrationNumber}</span>
      <span>YEAR: ${record.registrationYear}</span>
    </div>
  </div>

  <div class="section-title">1. Occurrence & General Diary (GD) Details</div>
  <table class="data-table">
    <tr>
      <td style="width: 25%;" class="label">GD/SD/DD Number:</td>
      <td style="width: 25%; font-weight: bold;">${record.gdNumber || "—"}</td>
      <td style="width: 25%;" class="label">GD Date & Time:</td>
      <td style="width: 25%;">${record.gdDateTime || "—"}</td>
    </tr>
    <tr>
      <td class="label">Date & Time of Missing:</td>
      <td>${record.dateOfPropertyMissing} at ${record.timeOfPropertyMissing}</td>
      <td class="label">Place of Occurrence:</td>
      <td style="font-weight: bold;">${record.placeFromWhereMissing}</td>
    </tr>
  </table>

  <div class="section-title">2. Details of Lost Property / Articles</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 5%;">S.No.</th>
        <th style="width: 28%;">Property Category</th>
        <th style="width: 25%;">Property Sub Type (Item)</th>
        <th style="width: 22%;">Make & Identification (IMEI/SIM/ID)</th>
        <th style="width: 20%; text-align: right;">Estimated Value (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${record.properties
        .map(
          (p, i) => `
      <tr>
        <td style="text-align: center;">${i + 1}</td>
        <td><strong>${p.category}</strong></td>
        <td>${p.subType} (Qty: ${p.quantity})</td>
        <td>${p.makeManufacturer || "—"}<br/><small>${p.idType ? `${p.idType}: ` : ""}${p.identificationNumbers.join(", ") || "—"}</small></td>
        <td style="text-align: right; font-family: monospace; font-weight: bold;">₹${Number(p.estimatedValue).toFixed(2)}</td>
      </tr>`
        )
        .join("")}
      <tr>
        <td colspan="4" style="text-align: right; font-weight: bold; background: #f8fafc;">Total Estimated Loss Value:</td>
        <td style="text-align: right; font-family: monospace; font-weight: 900; background: #f8fafc;">₹${totalVal.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">3. Complainant / Informant Details</div>
  <table class="data-table">
    <tr>
      <td style="width: 25%;" class="label">Complainant Full Name:</td>
      <td style="width: 35%; font-weight: bold;">${record.firstName} ${record.middleName ? record.middleName + " " : ""}${record.lastName}</td>
      <td style="width: 20%;" class="label">Gender:</td>
      <td style="width: 20%;">${record.gender}</td>
    </tr>
    <tr>
      <td class="label">Relation & Relative:</td>
      <td>${record.relationType}: ${record.relativeName || "—"}</td>
      <td class="label">Occupation:</td>
      <td>${record.occupation || "—"}</td>
    </tr>
    <tr>
      <td class="label">Mobile Number(s):</td>
      <td>${record.mobileNumbers.join(", ") || "—"}</td>
      <td class="label">Age / DOB:</td>
      <td>${record.ageYears ? `${record.ageYears} Years` : record.dob || "—"}</td>
    </tr>
    <tr>
      <td class="label">Present Address:</td>
      <td colspan="3">${record.presentAddress.houseNo ? record.presentAddress.houseNo + ", " : ""}${record.presentAddress.streetName ? record.presentAddress.streetName + ", " : ""}${record.presentAddress.villageTownCity}, District: ${record.presentAddress.district}, State: ${record.presentAddress.state} - ${record.presentAddress.pincode}</td>
    </tr>
    ${
      !record.sameAsPresent
        ? `<tr>
      <td class="label">Permanent Address:</td>
      <td colspan="3">${record.permanentAddress.houseNo ? record.permanentAddress.houseNo + ", " : ""}${record.permanentAddress.villageTownCity}, District: ${record.permanentAddress.district}, State: ${record.permanentAddress.state}</td>
    </tr>`
        : ""
    }
  </table>

  <div class="section-title">4. Details of Enquiry Officer (EO) & Statutory Remarks</div>
  <table class="data-table">
    <tr>
      <td style="width: 25%;" class="label">Enquiry Officer (EO):</td>
      <td style="width: 35%; font-weight: bold;">${record.nameOfEo}</td>
      <td style="width: 20%;" class="label">EO Rank:</td>
      <td style="width: 20%; font-weight: bold;">${record.eoRank}</td>
    </tr>
    <tr>
      <td class="label">Target Enquiry Completion:</td>
      <td>${record.expectedDateToComplete || "—"}</td>
      <td class="label">Registration Status:</td>
      <td><strong style="color: #0369a1;">${record.status}</strong></td>
    </tr>
    <tr>
      <td class="label">Remarks / Action Taken:</td>
      <td colspan="3">${record.remarks || "Enquiry marked to EO for necessary field verification and portal update."}</td>
    </tr>
  </table>

  <div style="font-size: 8.5pt; color: #475569; margin-top: 15px; border: 1px dashed #94a3b8; padding: 6px;">
    <strong>Statutory Notice:</strong> This document is an electronically generated statutory registration of Lost Property under the regulations of Haryana Police & CCTNS. CEIR tracking / blocking must be submitted and confirmed separately by the authorized officer.
  </div>

  <div class="footer-sign">
    <div class="sign-box">
      <strong>Signature / Thumb Impression of Complainant</strong><br/>
      Date: ${record.dateOfPropertyMissing || "—"}
    </div>
    <div class="sign-box">
      <strong>Signature of Enquiry Officer / Duty Officer</strong><br/>
      Name: ${record.nameOfEo.split("-")[0] || "Officer"}<br/>
      PS ${record.policeStation}
    </div>
  </div>
</body>
</html>`;
  },
};
