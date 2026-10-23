"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Scale,
  Printer,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Eye,
  Edit3,
  FileCheck2,
  FileText,
  Download,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FIRItem, ComplaintReportItem } from "@/types";
import { firService } from "@/services/firService";
import { GeneralDiaryService } from "@/services/generalDiaryService";
import { printA4Element, downloadA4DocumentAsHtml } from "@/utils/printElement";

interface ActSectionRow {
  sNo: number;
  act: string;
  sections: string;
}

interface PropertyRow {
  sNo: number;
  propertyDescription: string;
  estimatedValue: string;
  psPropertyRegisterNo: string;
  fromWhomWhereRecovered: string;
  disposal: string;
}

interface AccusedAddressRow {
  sNo: number;
  addressType: string;
  address: string;
  whetherVerified: "Yes" | "No";
}

interface IdProofRow {
  sNo: number;
  idType: string;
  idNumber: string;
}

interface ConvictionRow {
  sNo: number;
  firNo: string;
  state: string;
  district: string;
  policeStation: string;
  descriptionOfCase: string;
  convictionAcquittal: string;
}

interface AccusedPersonDetail {
  sNo: number;
  name: string;
  whetherVerified: "Yes" | "No";
  husbandFatherName: string;
  dateOrYearOfBirth: string;
  sex: "Male" | "Female" | "Other";
  nationality: string;
  passportNo: string;
  passportDateOfIssue: string;
  passportPlaceOfIssue: string;
  religion: string;
  scStObc: string;
  occupation: string;
  addresses: AccusedAddressRow[];
  regularCriminalNo: string;
  dateOfArrest: string;
  dateOfReleaseOnBail: string;
  dateForwardedToCourt: string;
  underActsSections: ActSectionRow[];
  bailerName: string;
  bailerFatherHusbandName: string;
  bailerOccupation: string;
  bailerAddresses: { sNo: number; addressType: string; address: string }[];
  identificationDob: string;
  identificationUid: string;
  otherIdProofs: IdProofRow[];
  previousConvictions: ConvictionRow[];
  statusOfAccused: string;
}

export interface IIFVChargesheetFormProps {
  fir: FIRItem;
  currentUser: {
    id?: string;
    name?: string;
    rank?: string;
    role?: string;
    beltNumber?: string;
    pno?: string;
    stationName?: string;
    district?: string;
  };
  onSaved?: (report: ComplaintReportItem) => void;
  onClose?: () => void;
  inline?: boolean;
}

export function IIFVChargesheetForm({
  fir,
  currentUser,
  onSaved,
  onClose,
  inline = false,
}: IIFVChargesheetFormProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState<"form" | "preview">("form");
  const [submitting, setSubmitting] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Initial Form Data pre-populated from FIR
  const initialData = useMemo(() => {
    const autoKeys = new Set<string>();

    const court = `In the Court of Chief Judicial Magistrate / JMIC, ${
      fir.district || currentUser.district || "Kurukshetra"
    }`;
    autoKeys.add("court");

    const district = fir.district || currentUser.district || "Kurukshetra";
    autoKeys.add("district");

    const ps = fir.policeStation || currentUser.stationName || "PS City Thanesar";
    autoKeys.add("ps");

    const year = String(fir.firYear || (fir.firDate ? fir.firDate.slice(0, 4) : new Date().getFullYear()));
    autoKeys.add("year");

    const firNo = fir.firNumber || "";
    autoKeys.add("firNo");

    const firDate = fir.firDate ? fir.firDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
    autoKeys.add("firDate");

    const reportNo = `CS/${year}/${Math.floor(100 + Math.random() * 900)}`;
    const reportDate = new Date().toISOString().slice(0, 10);
    autoKeys.add("reportDate");

    // Acts & sections
    const actRows: ActSectionRow[] = [
      {
        sNo: 1,
        act: fir.majorAct || "Bharatiya Nyaya Sanhita, 2023",
        sections: fir.actsAndSections || "303(2), 115(2) BNS",
      },
    ];
    autoKeys.add("acts");

    const ioName =
      fir.assignedIoName ||
      (fir as any).assignedOfficerName ||
      currentUser.name ||
      "SI Neeraj Kumar";
    autoKeys.add("ioName");

    const ioRank =
      fir.assignedIoRank ||
      (fir as any).assignedOfficerRank ||
      currentUser.rank ||
      "Sub-Inspector";
    autoKeys.add("ioRank");

    const ioNo =
      fir.assignedIoBeltNumber ||
      fir.assignedIoPno ||
      (fir as any).assignedOfficerBelt ||
      currentUser.beltNumber ||
      currentUser.pno ||
      "SI/6641";
    autoKeys.add("ioNo");

    const complainantName = fir.complainantName || (fir as any).informantName || "";
    if (complainantName) autoKeys.add("complainantName");

    const complainantFather = fir.complainantRelativeName || fir.complainantFatherSpouse || (fir as any).informantFatherName || "";
    if (complainantFather) autoKeys.add("complainantFather");

    // Seized property rows
    const rawProperties = (fir as any).seizedProperties;
    const propertyRows: PropertyRow[] = (rawProperties && rawProperties.length > 0)
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
    autoKeys.add("properties");

    // Accused list
    const anyAccused = fir.accusedList || (fir as any).accusedPersons;
    const accusedPersonList: AccusedPersonDetail[] = (anyAccused && anyAccused.length > 0)
      ? anyAccused.map((acc: any, idx: number) => ({
          sNo: idx + 1,
          name: acc.name || "Named Accused",
          whetherVerified: "Yes",
          husbandFatherName: acc.fatherName || "Unknown",
          dateOrYearOfBirth: acc.age ? `${new Date().getFullYear() - Number(acc.age)} (Age ~${acc.age})` : "1994",
          sex: (acc.gender === "Female" ? "Female" : "Male") as "Male" | "Female",
          nationality: "Indian",
          passportNo: "",
          passportDateOfIssue: "",
          passportPlaceOfIssue: "",
          religion: "Hindu",
          scStObc: "General",
          occupation: "Self-Employed / Worker",
          addresses: [
            {
              sNo: 1,
              addressType: "Permanent & Present",
              address: acc.address || "Village/Town, District Kurukshetra, Haryana",
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
              address: "Ward No. 4, Thanesar, District Kurukshetra",
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
              district: "Kurukshetra",
              policeStation: "PS City Thanesar",
              descriptionOfCase: "No previous criminal record found",
              convictionAcquittal: "Nil",
            },
          ],
          statusOfAccused: "On Police Bail u/s 48 BNSS / Forwarded to Court",
        }))
      : [
          {
            sNo: 1,
            name: "Rajesh Kumar s/o Sompal",
            whetherVerified: "Yes",
            husbandFatherName: "Sompal",
            dateOrYearOfBirth: "1992",
            sex: "Male",
            nationality: "Indian",
            passportNo: "",
            passportDateOfIssue: "",
            passportPlaceOfIssue: "",
            religion: "Hindu",
            scStObc: "OBC",
            occupation: "Private Driver",
            addresses: [
              {
                sNo: 1,
                addressType: "Permanent & Present",
                address: "House No. 142, Subhash Nagar, Thanesar, Kurukshetra",
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
                address: "Railway Road, Thanesar",
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
                district: "Kurukshetra",
                policeStation: "PS City Thanesar",
                descriptionOfCase: "No previous criminal convictions",
                convictionAcquittal: "Nil",
              },
            ],
            statusOfAccused: "On Bail (Report forwarded for trial)",
          },
        ];
    autoKeys.add("accused");

    const briefFacts =
      fir.incidentDetails ||
      fir.briefFacts ||
      (fir as any).description ||
      `Investigation in FIR No. ${fir.firNumber} was taken up by the Investigating Officer. The scene of crime was inspected and Crime Details Form (IIF-II) along with site map was prepared. Statements of the complainant and witnesses were recorded u/s 180 BNSS. Material evidences were seized vide Seizure Memo IIF-IV and deposited in Malkhana. Accused was apprehended, interrogated, and admitted to bail upon statutory bond. Prima facie offences stand substantiated beyond reasonable doubt, and the accused is accordingly sent for trial.`;
    autoKeys.add("briefFacts");

    return {
      autoKeys,
      court,
      district,
      ps,
      year,
      firNo,
      firDate,
      reportNo,
      reportDate,
      actRows,
      ioName,
      ioRank,
      ioNo,
      complainantName,
      complainantFather,
      propertyRows,
      accusedPersonList,
      briefFacts,
    };
  }, [fir, currentUser]);

  // Form State
  const [court, setCourt] = useState(initialData.court);
  const [district, setDistrict] = useState(initialData.district);
  const [ps, setPs] = useState(initialData.ps);
  const [year, setYear] = useState(initialData.year);
  const [firNo, setFirNo] = useState(initialData.firNo);
  const [firDate, setFirDate] = useState(initialData.firDate);
  const [reportNo, setReportNo] = useState(initialData.reportNo);
  const [reportDate, setReportDate] = useState(initialData.reportDate);
  const [actRows, setActRows] = useState<ActSectionRow[]>(initialData.actRows);
  const [finalFormType, setFinalFormType] = useState<string>("Charge Sheet / Challan (दोषारोप पत्र)");
  const [ifFirUnoccurred, setIfFirUnoccurred] = useState<string>("No / Not Applicable");
  const [ifChargeSheet, setIfChargeSheet] = useState<string>("Original (मूल चालान)");
  const [ioName, setIoName] = useState(initialData.ioName);
  const [ioRank, setIoRank] = useState(initialData.ioRank);
  const [ioNo, setIoNo] = useState(initialData.ioNo);
  const [complainantName, setComplainantName] = useState(initialData.complainantName);
  const [complainantFather, setComplainantFather] = useState(initialData.complainantFather);
  const [propertyRows, setPropertyRows] = useState<PropertyRow[]>(initialData.propertyRows);
  const [accusedPersonList, setAccusedPersonList] = useState<AccusedPersonDetail[]>(
    initialData.accusedPersonList
  );
  const [accusedNotChargeSheeted, setAccusedNotChargeSheeted] = useState<string>(
    "None. No innocent suspect detained or kept in column 12."
  );
  const [witnessesList, setWitnessesList] = useState<string>(
    `1. PW-1: ${initialData.complainantName || "Complainant"} (Informant - Proof of complaint & occurrence)\n2. PW-2: Eye-witness to incident (Corroboration of crime)\n3. PW-3: Panch Witness (Recovery of case property u/s 105 BNSS)\n4. PW-4: Medical Officer / Doctor (Medical examination report)\n5. PW-5: Scientific / FSL Expert (Forensic & ballistic confirmation)\n6. PW-6: MHC Police Station (Malkhana entry & safe custody)\n7. PW-7: Investigating Officer (${initialData.ioName}) (Complete investigation trail)`
  );
  const [falseFirAction, setFalseFirAction] = useState<string>(
    "Not Applicable. FIR is true and offences are fully substantiated."
  );
  const [labAnalysis, setLabAnalysis] = useState<string>(
    "FSL Report No. FSL/KUK/2026/894 dated " +
      initialData.reportDate +
      " received and enclosed. Forensic findings corroborate prosecution case."
  );
  const [briefFacts, setBriefFacts] = useState<string>(initialData.briefFacts);
  const [referNoticeServed, setReferNoticeServed] = useState<string>("No (Charge-sheet filed for trial)");
  const [referNoticeDate, setReferNoticeDate] = useState<string>("");
  const [referNoticeAck, setReferNoticeAck] = useState<string>("N/A");
  const [despatchedOn, setDespatchedOn] = useState<string>(initialData.reportDate);
  const [noOfEnclosures, setNoOfEnclosures] = useState<string>("10");
  const [listOfEnclosures, setListOfEnclosures] = useState<string>(
    `1. First Information Report (FIR No. ${fir.firNumber})\n2. Crime Detail Form (IIF-II) & Site Map\n3. Property Seizure Memo (IIF-IV)\n4. Arrest & Inspection Memos (IIF-III)\n5. Statements of Witnesses u/s 180 BNSS\n6. Medical Examination / Injury Report\n7. Forensic Science Laboratory (FSL) Report\n8. Extract of Police Station Property Register (Malkhana)\n9. Personal & Surety Bail Bonds\n10. Case Diary (Zimni) Compilation`
  );

  // Signatures
  const [shoName, setShoName] = useState<string>("Inspector Satish Kumar");
  const [shoRank, setShoRank] = useState<string>("Inspector / SHO");
  const [shoNo, setShoNo] = useState<string>("SHO/01");

  const autoKeys = initialData.autoKeys;

  // Add / Delete helper functions
  const addActRow = () => {
    setActRows([
      ...actRows,
      {
        sNo: actRows.length + 1,
        act: "Bharatiya Nyaya Sanhita, 2023",
        sections: "",
      },
    ]);
  };

  const removeActRow = (index: number) => {
    setActRows(actRows.filter((_, i) => i !== index).map((r, i) => ({ ...r, sNo: i + 1 })));
  };

  const addPropertyRow = () => {
    setPropertyRows([
      ...propertyRows,
      {
        sNo: propertyRows.length + 1,
        propertyDescription: "",
        estimatedValue: "",
        psPropertyRegisterNo: "",
        fromWhomWhereRecovered: "",
        disposal: "",
      },
    ]);
  };

  const removePropertyRow = (index: number) => {
    setPropertyRows(propertyRows.filter((_, i) => i !== index).map((r, i) => ({ ...r, sNo: i + 1 })));
  };

  const addAccusedPerson = () => {
    const nextNo = accusedPersonList.length + 1;
    setAccusedPersonList([
      ...accusedPersonList,
      {
        sNo: nextNo,
        name: "",
        whetherVerified: "Yes",
        husbandFatherName: "",
        dateOrYearOfBirth: "",
        sex: "Male",
        nationality: "Indian",
        passportNo: "",
        passportDateOfIssue: "",
        passportPlaceOfIssue: "",
        religion: "",
        scStObc: "General",
        occupation: "",
        addresses: [
          {
            sNo: 1,
            addressType: "Permanent",
            address: "",
            whetherVerified: "Yes",
          },
        ],
        regularCriminalNo: "Nil",
        dateOfArrest: "",
        dateOfReleaseOnBail: "",
        dateForwardedToCourt: "",
        underActsSections: [
          {
            sNo: 1,
            act: fir.majorAct || "Bharatiya Nyaya Sanhita, 2023",
            sections: fir.actsAndSections || "",
          },
        ],
        bailerName: "",
        bailerFatherHusbandName: "",
        bailerOccupation: "",
        bailerAddresses: [
          {
            sNo: 1,
            addressType: "Permanent",
            address: "",
          },
        ],
        identificationDob: "",
        identificationUid: "",
        otherIdProofs: [
          {
            sNo: 1,
            idType: "Aadhaar Card",
            idNumber: "",
          },
        ],
        previousConvictions: [
          {
            sNo: 1,
            firNo: "Nil",
            state: "Haryana",
            district: district,
            policeStation: ps,
            descriptionOfCase: "No previous criminal record",
            convictionAcquittal: "Nil",
          },
        ],
        statusOfAccused: "On Bail",
      },
    ]);
  };

  const removeAccusedPerson = (index: number) => {
    setAccusedPersonList(
      accusedPersonList.filter((_, i) => i !== index).map((a, i) => ({ ...a, sNo: i + 1 }))
    );
  };

  const glowStyle = (key: string) => {
    if (autoKeys.has(key)) {
      return "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/50 shadow-xs shadow-emerald-200 transition-all";
    }
    return "border-slate-300 bg-white";
  };

  const autoBadge = (key: string) => {
    if (autoKeys.has(key)) {
      return (
        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1 py-0.2 rounded inline-flex items-center gap-0.5 ml-1.5 shadow-2xs">
          ✓ Auto-filled
        </span>
      );
    }
    return null;
  };

  // Final Submit Handler
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const now = new Date();
      const reportId = `rep_final_${Date.now()}`;
      const reportItem: ComplaintReportItem = {
        id: reportId,
        complaintId: fir.id,
        versionNumber: 1,
        title: `Final Form / Chargesheet No. ${reportNo} - FIR No. ${fir.firNumber}`,
        reportType: "CHARGESHEET",
        reportTypeLabel: "I.I.F.-V Final Form / Chargesheet (Sec 193 BNSS)",
        dispatchNo: `${reportNo}/C-1`,
        generatedDate: reportDate,
        officerName: ioName,
        officerRank: ioRank,
        officerPno: ioNo,
        conclusionSummary: `Statutory Police Report (IIF-V u/s 193 BNSS) submitted to ${court}. ${accusedPersonList.length} accused person(s) sent for trial under Section(s) ${actRows.map(r => r.sections).join(", ")}.`,
        content: `I.I.F.-V | FINAL FORM / REPORT UNDER SECTION 193 BNSS\nCourt: ${court}\nFIR No: ${firNo} dated ${firDate}\nDistrict: ${district}, PS: ${ps}\nChargesheet No: ${reportNo}\nIO: ${ioName} (${ioRank})\nBrief Facts: ${briefFacts}`,
        fileFormat: "PDF / Official I.I.F.-V",
        status: "Saved",
        createdAt: now.toISOString(),
        createdBy: currentUser.id || currentUser.name || "IO",
      };

      // 1. Add report to FIR
      firService.addReport(fir.id, reportItem);

      // 2. Add auto-suggestion in draft to Roznamcha GD
      try {
        await GeneralDiaryService.createFirActionSuggestion({
          actionType: "FINAL_REPORT",
          firId: fir.id,
          firNumber: fir.firNumber,
          policeStation: ps,
          district: district,
          officer: {
            name: ioName,
            rank: ioRank,
            beltNumber: ioNo,
          },
          actsAndSections: actRows.map((r) => r.sections).join(", "),
          personName: accusedPersonList.map((a) => a.name).join(", "),
          details: `Statutory Chargesheet / Final Report No. ${reportNo} under Sec 193 BNSS submitted.`,
        });
      } catch (gdErr) {
        console.warn("Could not create Roznamcha GD draft entry:", gdErr);
      }

      setSaveSuccessMsg("✅ Final Report successfully saved in Case Reports & Roznamcha GD Draft!");
      setTimeout(() => setSaveSuccessMsg(""), 6000);

      if (onSaved) onSaved(reportItem);
      if (onClose) onClose();
    } catch (err) {
      console.error("Failed to submit final report:", err);
      alert("Failed to submit final report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const contentJsx = (
    <div className="space-y-6">
      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-100 border border-emerald-400 text-emerald-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {activeStep === "form" ? (
        /* ========================================================= */
        /* 1. EDITABLE STATUTORY INPUT FORM WITH AUTO-FILL GLOW     */
        /* ========================================================= */
        <div className="space-y-6">
          {/* Informational banner about auto-filled fields */}
          <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-3 flex items-center justify-between gap-3 text-xs text-emerald-950">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>FIR से प्राप्त विवरण:</strong> इस FIR के डेटा से संबंधित सभी फील्ड्स पहले से भर दिए गए हैं और वे <span className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold border border-emerald-400">हरे रंग से ग्लो (Green Glow)</span> कर रहे हैं। आप किसी भी फील्ड में बदलाव या नया विवरण दर्ज कर सकते हैं।
              </span>
            </div>
          </div>

          {/* Header Box */}
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-4 space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-slate-900 uppercase tracking-wide">
                    I.I.F.-V | FINAL FORM / REPORT (Under Section 193 BNSS)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Statutory Police Report Submitted by Investigating Officer
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                  Haryana Police
                </span>
              </div>

              {/* IN THE COURT OF */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center">
                  <span>IN THE COURT OF (माननीय न्यायालय)</span>
                  {autoBadge("court")}
                </label>
                <input
                  type="text"
                  value={court}
                  onChange={(e) => setCourt(e.target.value)}
                  className={`w-full text-xs px-3 py-2 rounded-lg border font-medium ${glowStyle("court")}`}
                  placeholder="e.g. In the Court of Chief Judicial Magistrate, Kurukshetra"
                />
              </div>

              {/* 1. District / P.S. / Year / FIR */}
              <div className="pt-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                  1. District / P.S. / Year / FIR
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center">
                      <span>District</span>
                      {autoBadge("district")}
                    </label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className={`w-full text-xs px-2.5 py-1.5 rounded-lg border ${glowStyle("district")}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center">
                      <span>P.S. (थाना)</span>
                      {autoBadge("ps")}
                    </label>
                    <input
                      type="text"
                      value={ps}
                      onChange={(e) => setPs(e.target.value)}
                      className={`w-full text-xs px-2.5 py-1.5 rounded-lg border ${glowStyle("ps")}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center">
                      <span>Year</span>
                      {autoBadge("year")}
                    </label>
                    <input
                      type="text"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className={`w-full text-xs px-2.5 py-1.5 rounded-lg border ${glowStyle("year")}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center">
                      <span>FIR No.</span>
                      {autoBadge("firNo")}
                    </label>
                    <input
                      type="text"
                      value={firNo}
                      onChange={(e) => setFirNo(e.target.value)}
                      className={`w-full text-xs px-2.5 py-1.5 rounded-lg border font-mono font-bold ${glowStyle("firNo")}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center">
                      <span>Date (दिनांक)</span>
                      {autoBadge("firDate")}
                    </label>
                    <input
                      type="date"
                      value={firDate}
                      onChange={(e) => setFirDate(e.target.value)}
                      className={`w-full text-xs px-2.5 py-1.5 rounded-lg border ${glowStyle("firDate")}`}
                    />
                  </div>
                </div>
              </div>

              {/* 2 & 3. Final Report No & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    2. Final Report / Charge Sheet No. (चालान क्रमांक)
                  </label>
                  <input
                    type="text"
                    value={reportNo}
                    onChange={(e) => setReportNo(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                    placeholder="e.g. CS/2026/01"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center">
                    <span>3. Date (प्रस्तुति दिनांक)</span>
                    {autoBadge("reportDate")}
                  </label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className={`w-full text-xs px-3 py-2 rounded-lg border ${glowStyle("reportDate")}`}
                  />
                </div>
              </div>

              {/* 4. Act & Sections */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center">
                    <span>4. Act &amp; Sections (अधिनियम व धाराएं)</span>
                    {autoBadge("acts")}
                  </label>
                  <button
                    type="button"
                    onClick={addActRow}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Act &amp; Section</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2 text-center w-14">S. No.</th>
                        <th className="p-2 text-left">Act</th>
                        <th className="p-2 text-left">Sections</th>
                        <th className="p-2 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {actRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2 text-center font-mono text-slate-500">{row.sNo}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.act}
                              onChange={(e) => {
                                const next = [...actRows];
                                next[idx].act = e.target.value;
                                setActRows(next);
                              }}
                              className={`w-full px-2 py-1 text-xs rounded border ${glowStyle("acts")}`}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={row.sections}
                              onChange={(e) => {
                                const next = [...actRows];
                                next[idx].sections = e.target.value;
                                setActRows(next);
                              }}
                              className={`w-full px-2 py-1 text-xs rounded border font-mono font-bold ${glowStyle("acts")}`}
                              placeholder="e.g. 303(2), 115(2) BNS"
                            />
                          </td>
                          <td className="p-2 text-center">
                            {actRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeActRow(idx)}
                                className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5, 6, 7. Type of Final Form / If FIR Unoccurred / If Charge Sheet */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    5. Type of Final Form / Report
                  </label>
                  <select
                    value={finalFormType}
                    onChange={(e) => setFinalFormType(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white font-semibold"
                  >
                    <option value="Charge Sheet / Challan (दोषारोप पत्र)">Charge Sheet / Challan (दोषारोप पत्र)</option>
                    <option value="Closure Report (FR) (खारिजी रिपोर्ट)">Closure Report (FR) (खारिजी रिपोर्ट)</option>
                    <option value="Untraced Report (अदम सुराग)">Untraced Report (अदम सुराग)</option>
                    <option value="Cancellation Report (कैंसिलेशन रिपोर्ट)">Cancellation Report (कैंसिलेशन रिपोर्ट)</option>
                    <option value="Abated Final Report (अभियुक्त की मृत्यु)">Abated Final Report (अभियुक्त की मृत्यु)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    6. If FIR Unoccurred
                  </label>
                  <input
                    type="text"
                    value={ifFirUnoccurred}
                    onChange={(e) => setIfFirUnoccurred(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300"
                    placeholder="e.g. No / Not Applicable / False"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    7. If Charge Sheet
                  </label>
                  <select
                    value={ifChargeSheet}
                    onChange={(e) => setIfChargeSheet(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white font-semibold"
                  >
                    <option value="Original (मूल चालान)">Original (मूल चालान)</option>
                    <option value="Supplementary (पूरक चालान)">Supplementary (पूरक चालान)</option>
                    <option value="N/A (Closure/Untraced)">N/A (Closure/Untraced)</option>
                  </select>
                </div>
              </div>

              {/* 8. Name of I.O. at the time of Charge Sheet */}
              <div className="pt-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                  8. Name of I.O. at the time of Charge Sheet
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center">
                      <span>Name (नाम)</span>
                      {autoBadge("ioName")}
                    </label>
                    <input
                      type="text"
                      value={ioName}
                      onChange={(e) => setIoName(e.target.value)}
                      className={`w-full text-xs px-2.5 py-1.5 rounded-lg border ${glowStyle("ioName")}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center">
                      <span>Rank (पद)</span>
                      {autoBadge("ioRank")}
                    </label>
                    <input
                      type="text"
                      value={ioRank}
                      onChange={(e) => setIoRank(e.target.value)}
                      className={`w-full text-xs px-2.5 py-1.5 rounded-lg border ${glowStyle("ioRank")}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center">
                      <span>No. (Belt / PNO No.)</span>
                      {autoBadge("ioNo")}
                    </label>
                    <input
                      type="text"
                      value={ioNo}
                      onChange={(e) => setIoNo(e.target.value)}
                      className={`w-full text-xs px-2.5 py-1.5 rounded-lg border font-mono ${glowStyle("ioNo")}`}
                    />
                  </div>
                </div>
              </div>

              {/* 9. Complainant / Informant */}
              <div className="pt-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                  9. Complainant / Informant (शिकायतकर्ता / सूचनादाता)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center">
                      <span>(a) Name of Complainant / Informant</span>
                      {autoBadge("complainantName")}
                    </label>
                    <input
                      type="text"
                      value={complainantName}
                      onChange={(e) => setComplainantName(e.target.value)}
                      className={`w-full text-xs px-2.5 py-1.5 rounded-lg border ${glowStyle("complainantName")}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center">
                      <span>(b) Father&apos;s / Husband&apos;s Name</span>
                      {autoBadge("complainantFather")}
                    </label>
                    <input
                      type="text"
                      value={complainantFather}
                      onChange={(e) => setComplainantFather(e.target.value)}
                      className={`w-full text-xs px-2.5 py-1.5 rounded-lg border ${glowStyle("complainantFather")}`}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 10. Details of Properties Recovered */}
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center">
                    <span>10. Details of Properties / Articles / Documents Recovered / Seized During Investigation and Relied Upon</span>
                    {autoBadge("properties")}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    अनुसंधान के दौरान बरामद / जब्त की गई संपत्तियों व दस्तावेजों का विवरण
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addPropertyRow}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Property Row</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full text-xs border-collapse min-w-[650px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2 text-center w-12">S. No.</th>
                      <th className="p-2 text-left">Property Description</th>
                      <th className="p-2 text-left w-28">Estimated Value (Rs.)</th>
                      <th className="p-2 text-left w-36">P.S. Property Reg. No.</th>
                      <th className="p-2 text-left">From Whom / Where Seized</th>
                      <th className="p-2 text-left w-32">Disposal</th>
                      <th className="p-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {propertyRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2 text-center font-mono text-slate-500">{row.sNo}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.propertyDescription}
                            onChange={(e) => {
                              const next = [...propertyRows];
                              next[idx].propertyDescription = e.target.value;
                              setPropertyRows(next);
                            }}
                            className={`w-full px-2 py-1 text-xs rounded border ${glowStyle("properties")}`}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.estimatedValue}
                            onChange={(e) => {
                              const next = [...propertyRows];
                              next[idx].estimatedValue = e.target.value;
                              setPropertyRows(next);
                            }}
                            className={`w-full px-2 py-1 text-xs rounded border ${glowStyle("properties")}`}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.psPropertyRegisterNo}
                            onChange={(e) => {
                              const next = [...propertyRows];
                              next[idx].psPropertyRegisterNo = e.target.value;
                              setPropertyRows(next);
                            }}
                            className={`w-full px-2 py-1 text-xs rounded border ${glowStyle("properties")}`}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.fromWhomWhereRecovered}
                            onChange={(e) => {
                              const next = [...propertyRows];
                              next[idx].fromWhomWhereRecovered = e.target.value;
                              setPropertyRows(next);
                            }}
                            className={`w-full px-2 py-1 text-xs rounded border ${glowStyle("properties")}`}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.disposal}
                            onChange={(e) => {
                              const next = [...propertyRows];
                              next[idx].disposal = e.target.value;
                              setPropertyRows(next);
                            }}
                            className={`w-full px-2 py-1 text-xs rounded border ${glowStyle("properties")}`}
                          />
                        </td>
                        <td className="p-2 text-center">
                          {propertyRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePropertyRow(idx)}
                              className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 11. Particulars of Accused Persons Charge-Sheeted */}
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center">
                    <span>11. Particulars of Accused Persons Charge-Sheeted</span>
                    {autoBadge("accused")}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    चालान किए गए नामजद अभियुक्तों का पूर्ण वैधानिक विवरण
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addAccusedPerson}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Accused</span>
                </button>
              </div>

              {accusedPersonList.map((accused, accIdx) => (
                <div
                  key={accIdx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3.5 relative"
                >
                  {accusedPersonList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAccusedPerson(accIdx)}
                      className="absolute right-3 top-3 text-red-500 hover:text-red-700 p-1 rounded-lg bg-red-50 cursor-pointer"
                      title="Remove Accused"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
                      {accused.sNo}
                    </span>
                    <h4 className="font-bold text-xs text-slate-800">
                      Accused Person #{accused.sNo}: {accused.name || "Untitled"}
                    </h4>
                  </div>

                  {/* Row 1 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center">
                        <span>(i) Name (अभियुक्त का नाम)</span>
                        {autoBadge("accused")}
                      </label>
                      <input
                        type="text"
                        value={accused.name}
                        onChange={(e) => {
                          const next = [...accusedPersonList];
                          next[accIdx].name = e.target.value;
                          setAccusedPersonList(next);
                        }}
                        className={`w-full text-xs px-2.5 py-1.5 rounded-lg border ${glowStyle("accused")}`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Whether Verified (सत्यापित)
                      </label>
                      <select
                        value={accused.whetherVerified}
                        onChange={(e) => {
                          const next = [...accusedPersonList];
                          next[accIdx].whetherVerified = e.target.value as "Yes" | "No";
                          setAccusedPersonList(next);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="Yes">Yes (सत्यापित)</option>
                        <option value="No">No (असत्यापित)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center">
                        <span>(ii) Husband&apos;s / Father&apos;s Name</span>
                        {autoBadge("accused")}
                      </label>
                      <input
                        type="text"
                        value={accused.husbandFatherName}
                        onChange={(e) => {
                          const next = [...accusedPersonList];
                          next[accIdx].husbandFatherName = e.target.value;
                          setAccusedPersonList(next);
                        }}
                        className={`w-full text-xs px-2.5 py-1.5 rounded-lg border ${glowStyle("accused")}`}
                      />
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center">
                        <span>(iii) Date / Year of Birth</span>
                        {autoBadge("accused")}
                      </label>
                      <input
                        type="text"
                        value={accused.dateOrYearOfBirth}
                        onChange={(e) => {
                          const next = [...accusedPersonList];
                          next[accIdx].dateOrYearOfBirth = e.target.value;
                          setAccusedPersonList(next);
                        }}
                        className={`w-full text-xs px-2.5 py-1.5 rounded-lg border ${glowStyle("accused")}`}
                        placeholder="e.g. 1994 (Age ~32)"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        (iv) Sex (लिंग)
                      </label>
                      <select
                        value={accused.sex}
                        onChange={(e) => {
                          const next = [...accusedPersonList];
                          next[accIdx].sex = e.target.value as any;
                          setAccusedPersonList(next);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="Male">Male (पुरुष)</option>
                        <option value="Female">Female (महिला)</option>
                        <option value="Other">Other (अन्य)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        (v) Nationality (राष्ट्रीयता)
                      </label>
                      <input
                        type="text"
                        value={accused.nationality}
                        onChange={(e) => {
                          const next = [...accusedPersonList];
                          next[accIdx].nationality = e.target.value;
                          setAccusedPersonList(next);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        (vi) Passport No. (पासपोर्ट क्रमांक)
                      </label>
                      <input
                        type="text"
                        value={accused.passportNo}
                        onChange={(e) => {
                          const next = [...accusedPersonList];
                          next[accIdx].passportNo = e.target.value;
                          setAccusedPersonList(next);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                        placeholder="Nil / None"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Date of Issue
                      </label>
                      <input
                        type="date"
                        value={accused.passportDateOfIssue}
                        onChange={(e) => {
                          const next = [...accusedPersonList];
                          next[accIdx].passportDateOfIssue = e.target.value;
                          setAccusedPersonList(next);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Place of Issue
                      </label>
                      <input
                        type="text"
                        value={accused.passportPlaceOfIssue}
                        onChange={(e) => {
                          const next = [...accusedPersonList];
                          next[accIdx].passportPlaceOfIssue = e.target.value;
                          setAccusedPersonList(next);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>

                  {/* Row 4 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        (vii) Religion (धर्म)
                      </label>
                      <input
                        type="text"
                        value={accused.religion}
                        onChange={(e) => {
                          const next = [...accusedPersonList];
                          next[accIdx].religion = e.target.value;
                          setAccusedPersonList(next);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        (viii) Whether SC / ST / OBC
                      </label>
                      <input
                        type="text"
                        value={accused.scStObc}
                        onChange={(e) => {
                          const next = [...accusedPersonList];
                          next[accIdx].scStObc = e.target.value;
                          setAccusedPersonList(next);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        (ix) Occupation (व्यवसाय)
                      </label>
                      <input
                        type="text"
                        value={accused.occupation}
                        onChange={(e) => {
                          const next = [...accusedPersonList];
                          next[accIdx].occupation = e.target.value;
                          setAccusedPersonList(next);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>

                  {/* (x) Address Table */}
                  <div className="pt-1">
                    <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center">
                      <span>. (x) Address (पता)</span>
                      {autoBadge("accused")}
                    </label>
                    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                      <table className="w-full text-xs border-collapse">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-1.5 text-center w-12">S. No.</th>
                            <th className="p-1.5 text-left w-36">Address Type</th>
                            <th className="p-1.5 text-left">Address</th>
                            <th className="p-1.5 text-center w-28">Whether Verified</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accused.addresses.map((addr, aIdx) => (
                            <tr key={aIdx}>
                              <td className="p-1.5 text-center font-mono">{addr.sNo}</td>
                              <td className="p-1.5">
                                <input
                                  type="text"
                                  value={addr.addressType}
                                  onChange={(e) => {
                                    const next = [...accusedPersonList];
                                    next[accIdx].addresses[aIdx].addressType = e.target.value;
                                    setAccusedPersonList(next);
                                  }}
                                  className="w-full px-2 py-1 text-xs rounded border border-slate-200"
                                />
                              </td>
                              <td className="p-1.5">
                                <input
                                  type="text"
                                  value={addr.address}
                                  onChange={(e) => {
                                    const next = [...accusedPersonList];
                                    next[accIdx].addresses[aIdx].address = e.target.value;
                                    setAccusedPersonList(next);
                                  }}
                                  className={`w-full px-2 py-1 text-xs rounded border ${glowStyle("accused")}`}
                                />
                              </td>
                              <td className="p-1.5 text-center">
                                <select
                                  value={addr.whetherVerified}
                                  onChange={(e) => {
                                    const next = [...accusedPersonList];
                                    next[accIdx].addresses[aIdx].whetherVerified = e.target.value as "Yes" | "No";
                                    setAccusedPersonList(next);
                                  }}
                                  className="px-2 py-1 text-xs rounded border border-slate-200 bg-white"
                                >
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Row 5 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        (xi) Regular Criminal No.
                      </label>
                      <input
                        type="text"
                        value={accused.regularCriminalNo}
                        onChange={(e) => {
                          const next = [...accusedPersonList];
                          next[accIdx].regularCriminalNo = e.target.value;
                          setAccusedPersonList(next);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center">
                        <span>(xii) Date of Arrest</span>
                        {autoBadge("accused")}
                      </label>
                      <input
                        type="text"
                        value={accused.dateOfArrest}
                        onChange={(e) => {
                          const next = [...accusedPersonList];
                          next[accIdx].dateOfArrest = e.target.value;
                          setAccusedPersonList(next);
                        }}
                        className={`w-full text-xs px-2.5 py-1.5 rounded-lg border ${glowStyle("accused")}`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        (xiii) Date of Release on Bail
                      </label>
                      <input
                        type="text"
                        value={accused.dateOfReleaseOnBail}
                        onChange={(e) => {
                          const next = [...accusedPersonList];
                          next[accIdx].dateOfReleaseOnBail = e.target.value;
                          setAccusedPersonList(next);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        (xiv) Date on Which Forwarded
                      </label>
                      <input
                        type="text"
                        value={accused.dateForwardedToCourt}
                        onChange={(e) => {
                          const next = [...accusedPersonList];
                          next[accIdx].dateForwardedToCourt = e.target.value;
                          setAccusedPersonList(next);
                        }}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>

                  {/* (xv) Under Acts & Sections */}
                  <div className="pt-1">
                    <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center">
                      <span>. (xv) Under Acts &amp; Sections (लागू धाराएं)</span>
                      {autoBadge("acts")}
                    </label>
                    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                      <table className="w-full text-xs border-collapse">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-1.5 text-center w-12">S. No.</th>
                            <th className="p-1.5 text-left">Act</th>
                            <th className="p-1.5 text-left">Sections</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accused.underActsSections.map((uRow, uIdx) => (
                            <tr key={uIdx}>
                              <td className="p-1.5 text-center font-mono">{uRow.sNo}</td>
                              <td className="p-1.5">
                                <input
                                  type="text"
                                  value={uRow.act}
                                  onChange={(e) => {
                                    const next = [...accusedPersonList];
                                    next[accIdx].underActsSections[uIdx].act = e.target.value;
                                    setAccusedPersonList(next);
                                  }}
                                  className={`w-full px-2 py-1 text-xs rounded border ${glowStyle("acts")}`}
                                />
                              </td>
                              <td className="p-1.5">
                                <input
                                  type="text"
                                  value={uRow.sections}
                                  onChange={(e) => {
                                    const next = [...accusedPersonList];
                                    next[accIdx].underActsSections[uIdx].sections = e.target.value;
                                    setAccusedPersonList(next);
                                  }}
                                  className={`w-full px-2 py-1 text-xs rounded border font-mono font-bold ${glowStyle("acts")}`}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* (xvi) Details of Bailers / Sureties */}
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                    <label className="block text-[11px] font-bold text-slate-800">
                      . (xvi) Details of Bailers / Sureties (जमानती का विवरण)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold">Name:</span>
                        <input
                          type="text"
                          value={accused.bailerName}
                          onChange={(e) => {
                            const next = [...accusedPersonList];
                            next[accIdx].bailerName = e.target.value;
                            setAccusedPersonList(next);
                          }}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-200"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold">Father&apos;s / Husband&apos;s Name:</span>
                        <input
                          type="text"
                          value={accused.bailerFatherHusbandName}
                          onChange={(e) => {
                            const next = [...accusedPersonList];
                            next[accIdx].bailerFatherHusbandName = e.target.value;
                            setAccusedPersonList(next);
                          }}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-200"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold">Occupation:</span>
                        <input
                          type="text"
                          value={accused.bailerOccupation}
                          onChange={(e) => {
                            const next = [...accusedPersonList];
                            next[accIdx].bailerOccupation = e.target.value;
                            setAccusedPersonList(next);
                          }}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-200"
                        />
                      </div>
                    </div>

                    {/* Bailer Address Table */}
                    <div className="border border-slate-200 rounded overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-600 font-bold">
                          <tr>
                            <th className="p-1 text-center w-10">S. No.</th>
                            <th className="p-1 text-left w-32">Address Type</th>
                            <th className="p-1 text-left">Address</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accused.bailerAddresses.map((bAddr, bIdx) => (
                            <tr key={bIdx}>
                              <td className="p-1 text-center font-mono">{bAddr.sNo}</td>
                              <td className="p-1">
                                <input
                                  type="text"
                                  value={bAddr.addressType}
                                  onChange={(e) => {
                                    const next = [...accusedPersonList];
                                    next[accIdx].bailerAddresses[bIdx].addressType = e.target.value;
                                    setAccusedPersonList(next);
                                  }}
                                  className="w-full px-1.5 py-0.5 text-xs rounded border border-slate-200"
                                />
                              </td>
                              <td className="p-1">
                                <input
                                  type="text"
                                  value={bAddr.address}
                                  onChange={(e) => {
                                    const next = [...accusedPersonList];
                                    next[accIdx].bailerAddresses[bIdx].address = e.target.value;
                                    setAccusedPersonList(next);
                                  }}
                                  className="w-full px-1.5 py-0.5 text-xs rounded border border-slate-200"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Identification */}
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                    <label className="block text-[11px] font-bold text-slate-800">
                      . Identification (पहचान विवरण)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold">Date of Birth:</span>
                        <input
                          type="text"
                          value={accused.identificationDob}
                          onChange={(e) => {
                            const next = [...accusedPersonList];
                            next[accIdx].identificationDob = e.target.value;
                            setAccusedPersonList(next);
                          }}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-200"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold">UID Number (Aadhaar):</span>
                        <input
                          type="text"
                          value={accused.identificationUid}
                          onChange={(e) => {
                            const next = [...accusedPersonList];
                            next[accIdx].identificationUid = e.target.value;
                            setAccusedPersonList(next);
                          }}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-200 font-mono"
                        />
                      </div>
                    </div>

                    {/* Any Other ID Proof Table */}
                    <div className="border border-slate-200 rounded overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-600 font-bold">
                          <tr>
                            <th className="p-1 text-center w-10">S. No.</th>
                            <th className="p-1 text-left w-36">ID Type</th>
                            <th className="p-1 text-left">ID Number</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accused.otherIdProofs.map((idRow, idIdx) => (
                            <tr key={idIdx}>
                              <td className="p-1 text-center font-mono">{idRow.sNo}</td>
                              <td className="p-1">
                                <input
                                  type="text"
                                  value={idRow.idType}
                                  onChange={(e) => {
                                    const next = [...accusedPersonList];
                                    next[accIdx].otherIdProofs[idIdx].idType = e.target.value;
                                    setAccusedPersonList(next);
                                  }}
                                  className="w-full px-1.5 py-0.5 text-xs rounded border border-slate-200"
                                />
                              </td>
                              <td className="p-1">
                                <input
                                  type="text"
                                  value={idRow.idNumber}
                                  onChange={(e) => {
                                    const next = [...accusedPersonList];
                                    next[accIdx].otherIdProofs[idIdx].idNumber = e.target.value;
                                    setAccusedPersonList(next);
                                  }}
                                  className="w-full px-1.5 py-0.5 text-xs rounded border border-slate-200 font-mono"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* (xvii) Previous Convictions Table */}
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                    <label className="block text-[11px] font-bold text-slate-800">
                      . (xvii) Previous Convictions with Case References (पूर्व दोषसिद्धियां)
                    </label>
                    <div className="border border-slate-200 rounded overflow-x-auto">
                      <table className="w-full text-xs min-w-[600px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-600 font-bold">
                          <tr>
                            <th className="p-1 text-center w-10">S. No.</th>
                            <th className="p-1 text-left w-24">FIR No.</th>
                            <th className="p-1 text-left w-24">State</th>
                            <th className="p-1 text-left w-24">District</th>
                            <th className="p-1 text-left w-28">Police Station</th>
                            <th className="p-1 text-left">Description of Case</th>
                            <th className="p-1 text-left w-28">Conviction/Acquittal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accused.previousConvictions.map((cRow, cIdx) => (
                            <tr key={cIdx}>
                              <td className="p-1 text-center font-mono">{cRow.sNo}</td>
                              <td className="p-1">
                                <input
                                  type="text"
                                  value={cRow.firNo}
                                  onChange={(e) => {
                                    const next = [...accusedPersonList];
                                    next[accIdx].previousConvictions[cIdx].firNo = e.target.value;
                                    setAccusedPersonList(next);
                                  }}
                                  className="w-full px-1.5 py-0.5 text-xs rounded border border-slate-200"
                                />
                              </td>
                              <td className="p-1">
                                <input
                                  type="text"
                                  value={cRow.state}
                                  onChange={(e) => {
                                    const next = [...accusedPersonList];
                                    next[accIdx].previousConvictions[cIdx].state = e.target.value;
                                    setAccusedPersonList(next);
                                  }}
                                  className="w-full px-1.5 py-0.5 text-xs rounded border border-slate-200"
                                />
                              </td>
                              <td className="p-1">
                                <input
                                  type="text"
                                  value={cRow.district}
                                  onChange={(e) => {
                                    const next = [...accusedPersonList];
                                    next[accIdx].previousConvictions[cIdx].district = e.target.value;
                                    setAccusedPersonList(next);
                                  }}
                                  className="w-full px-1.5 py-0.5 text-xs rounded border border-slate-200"
                                />
                              </td>
                              <td className="p-1">
                                <input
                                  type="text"
                                  value={cRow.policeStation}
                                  onChange={(e) => {
                                    const next = [...accusedPersonList];
                                    next[accIdx].previousConvictions[cIdx].policeStation = e.target.value;
                                    setAccusedPersonList(next);
                                  }}
                                  className="w-full px-1.5 py-0.5 text-xs rounded border border-slate-200"
                                />
                              </td>
                              <td className="p-1">
                                <input
                                  type="text"
                                  value={cRow.descriptionOfCase}
                                  onChange={(e) => {
                                    const next = [...accusedPersonList];
                                    next[accIdx].previousConvictions[cIdx].descriptionOfCase = e.target.value;
                                    setAccusedPersonList(next);
                                  }}
                                  className="w-full px-1.5 py-0.5 text-xs rounded border border-slate-200"
                                />
                              </td>
                              <td className="p-1">
                                <input
                                  type="text"
                                  value={cRow.convictionAcquittal}
                                  onChange={(e) => {
                                    const next = [...accusedPersonList];
                                    next[accIdx].previousConvictions[cIdx].convictionAcquittal = e.target.value;
                                    setAccusedPersonList(next);
                                  }}
                                  className="w-full px-1.5 py-0.5 text-xs rounded border border-slate-200"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* (xviii) Status of the Accused */}
                  <div className="pt-1">
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      (xviii) Status of the Accused (अभियुक्त की वर्तमान स्थिति)
                    </label>
                    <input
                      type="text"
                      value={accused.statusOfAccused}
                      onChange={(e) => {
                        const next = [...accusedPersonList];
                        next[accIdx].statusOfAccused = e.target.value;
                        setAccusedPersonList(next);
                      }}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold"
                      placeholder="e.g. On Police Bail / In Judicial Custody / Forwarded to Court / Absconding"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 12, 13, 14, 15 */}
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  12. Particulars of Accused Persons – Not Charge-Sheeted (Suspect) [कॉलम 12 - जिन्हें चालान नहीं किया गया]
                </label>
                <textarea
                  rows={2}
                  value={accusedNotChargeSheeted}
                  onChange={(e) => setAccusedNotChargeSheeted(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  13. Particulars of Witnesses to be Examined (परीक्षित किए जाने वाले गवाहान की सूची व विवरण)
                </label>
                <textarea
                  rows={4}
                  value={witnessesList}
                  onChange={(e) => setWitnessesList(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  14. If FIR Is False, Indicate Action Taken or Proposed to Be Taken u/s 182/211 I.P.C. / 217/248 B.N.S.
                </label>
                <input
                  type="text"
                  value={falseFirAction}
                  onChange={(e) => setFalseFirAction(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  15. Result of Laboratory Analysis (FSL / सीएफएसएल रासायनिक एवं वैज्ञानिक प्रयोगशाला रिपोर्ट)
                </label>
                <textarea
                  rows={2}
                  value={labAnalysis}
                  onChange={(e) => setLabAnalysis(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-sans"
                />
              </div>
            </CardContent>
          </Card>

          {/* 16. Brief Facts */}
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-4 space-y-2">
              <label className="block text-xs font-black text-slate-900 uppercase tracking-wide flex items-center">
                <span>16. Brief Facts of the Case (प्रकरण के संक्षिप्त तथ्य एवं अनुसंधान निष्कर्ष)</span>
                {autoBadge("briefFacts")}
              </label>
              <p className="text-[11px] text-slate-500">
                घटना का संक्षेप, अनुसंधान का क्रमबद्ध विवरण, संकलित साक्ष्य व दोषारोप के आधार
              </p>
              <textarea
                rows={8}
                value={briefFacts}
                onChange={(e) => setBriefFacts(e.target.value)}
                className={`w-full text-xs p-3 rounded-lg border font-sans leading-relaxed ${glowStyle("briefFacts")}`}
              />
            </CardContent>
          </Card>

          {/* 17, 18, 19, 20 */}
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-4 space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                  17. Refer Notice Served (रेफर नोटिस तामील विवरण)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Refer Notice Served:
                    </label>
                    <input
                      type="text"
                      value={referNoticeServed}
                      onChange={(e) => setReferNoticeServed(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Date:
                    </label>
                    <input
                      type="date"
                      value={referNoticeDate}
                      onChange={(e) => setReferNoticeDate(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Acknowledgement to Be Placed:
                    </label>
                    <input
                      type="text"
                      value={referNoticeAck}
                      onChange={(e) => setReferNoticeAck(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    18. Despatched On (रवानगी दिनांक)
                  </label>
                  <input
                    type="date"
                    value={despatchedOn}
                    onChange={(e) => setDespatchedOn(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    19. No. of Enclosures (संलग्नकों की कुल संख्या)
                  </label>
                  <input
                    type="number"
                    value={noOfEnclosures}
                    onChange={(e) => setNoOfEnclosures(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  20. List of Enclosures, As Annexed (संलग्न दस्तावेजों की क्रमवार सूची)
                </label>
                <textarea
                  rows={5}
                  value={listOfEnclosures}
                  onChange={(e) => setListOfEnclosures(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono text-slate-800"
                />
              </div>
            </CardContent>
          </Card>

          {/* Signatures */}
          <Card className="border-slate-200 shadow-xs bg-slate-50/70">
            <CardContent className="p-4 space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Signatory Officers Particulars (हस्ताक्षरकर्ता अधिकारी विवरण)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                  <p className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1">
                    Forwarded by Officer in Charge (थाना प्रभारी / SHO)
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold">Name:</span>
                      <input
                        type="text"
                        value={shoName}
                        onChange={(e) => setShoName(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold">Rank:</span>
                      <input
                        type="text"
                        value={shoRank}
                        onChange={(e) => setShoRank(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold">No.:</span>
                      <input
                        type="text"
                        value={shoNo}
                        onChange={(e) => setShoNo(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-200 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                  <p className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1">
                    Investigating Officer Submitting Final Report (तफ्तीश अधिकारी / IO)
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold">Name:</span>
                      <input
                        type="text"
                        value={ioName}
                        onChange={(e) => setIoName(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold">Rank:</span>
                      <input
                        type="text"
                        value={ioRank}
                        onChange={(e) => setIoRank(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold">No.:</span>
                      <input
                        type="text"
                        value={ioNo}
                        onChange={(e) => setIoNo(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-200 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {onClose && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="cursor-pointer text-xs"
              >
                Cancel (रद्द करें)
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => setActiveStep("preview")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm cursor-pointer px-5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Submit for Statutory Preview (प्रारूप पूर्वावलोकन) →</span>
            </Button>
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* 2. STATUTORY PREVIEW MATCHING THE 6-PAGE PDF FORMAT      */
        /* ========================================================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-800">
                Statutory IIF-V Report Preview (मानक प्रारूप पूर्वावलोकन)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { if (previewRef.current) printA4Element(previewRef.current); }}
                className="text-xs font-bold gap-1 border-slate-300 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-blue-600" />
                <span>Print (प्रिंट करें)</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { if (previewRef.current) downloadA4DocumentAsHtml(previewRef.current, `IIF-V_Final_Report_FIR_${fir.firNumber}.html`); }}
                className="text-xs font-bold gap-1 border-slate-300 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Download (डाउनलोड)</span>
              </Button>
              <Button
                size="sm"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md cursor-pointer px-4"
              >
                <FileCheck2 className="w-4 h-4 text-emerald-200" />
                <span>{submitting ? "Saving to Case..." : "Final Submit & Save to Case (अंतिम रूप से जमा करें)"}</span>
              </Button>
            </div>
          </div>

          {/* Printable Statutory Document Canvas */}
          <div
            ref={previewRef}
            className="bg-white p-8 sm:p-12 rounded-xl shadow-lg border border-slate-300 font-serif text-slate-900 space-y-6 max-w-4xl mx-auto"
            style={{ fontSize: "12px", lineHeight: "1.6" }}
          >
            {/* Header Section */}
            <div className="border-b-2 border-slate-900 pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-sans font-bold text-xs tracking-wider">
                    I.I.F.-V | FINAL FORM / REPORT
                  </h4>
                  <p className="font-sans text-[11px] text-slate-600">
                    Under Section 193 BNSS
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-sans font-bold text-xs uppercase tracking-wider">
                    Haryana Police
                  </span>
                </div>
              </div>
              <div className="text-center mt-3">
                <h2 className="font-sans font-black text-base sm:text-lg tracking-wide uppercase">
                  FINAL FORM / REPORT
                </h2>
              </div>
            </div>

            {/* IN THE COURT OF */}
            <div className="space-y-1">
              <div className="font-bold text-[11px] font-sans uppercase">IN THE COURT OF</div>
              <div className="border-b border-slate-400 pb-1 font-bold text-xs font-sans">
                {court || "Chief Judicial Magistrate, Kurukshetra"}
              </div>
            </div>

            {/* 1. District / P.S. / Year / FIR */}
            <div className="space-y-2">
              <div className="font-bold text-xs font-sans">1. District / P.S. / Year / FIR</div>
              <div className="grid grid-cols-3 gap-4 border-b border-slate-300 pb-2 text-xs">
                <div>
                  <span className="font-bold">District: </span>
                  <span>{district}</span>
                </div>
                <div>
                  <span className="font-bold">P.S.: </span>
                  <span>{ps}</span>
                </div>
                <div>
                  <span className="font-bold">Year: </span>
                  <span>{year}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b border-slate-300 pb-2 text-xs">
                <div>
                  <span className="font-bold">FIR No.: </span>
                  <span className="font-bold font-mono">{firNo}</span>
                </div>
                <div>
                  <span className="font-bold">Date: </span>
                  <span>{firDate}</span>
                </div>
              </div>
            </div>

            {/* 2 & 3 */}
            <div className="space-y-2 text-xs">
              <div className="border-b border-slate-300 pb-2">
                <span className="font-bold">2. Final Report / Charge Sheet No.: </span>
                <span className="font-bold font-mono">{reportNo}</span>
              </div>
              <div className="border-b border-slate-300 pb-2">
                <span className="font-bold">3. Date: </span>
                <span>{reportDate}</span>
              </div>
            </div>

            {/* 4. Act & Sections */}
            <div className="space-y-1.5 text-xs">
              <div className="font-bold font-sans">4. Act &amp; Sections</div>
              <table className="w-full border-collapse border border-slate-400 text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-400">
                    <th className="border border-slate-400 p-1.5 w-14 text-center">S. No.</th>
                    <th className="border border-slate-400 p-1.5">Act</th>
                    <th className="border border-slate-400 p-1.5">Sections</th>
                  </tr>
                </thead>
                <tbody>
                  {actRows.map((r, i) => (
                    <tr key={i}>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">{r.sNo}</td>
                      <td className="border border-slate-400 p-1.5">{r.act}</td>
                      <td className="border border-slate-400 p-1.5 font-bold font-mono">{r.sections}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 5, 6, 7 */}
            <div className="space-y-2 text-xs border-b border-slate-300 pb-2">
              <div>
                <span className="font-bold">5. Type of Final Form / Report: </span>
                <span>{finalFormType}</span>
              </div>
              <div>
                <span className="font-bold">6. If FIR Unoccurred: </span>
                <span>{ifFirUnoccurred}</span>
              </div>
              <div>
                <span className="font-bold">7. If Charge Sheet: </span>
                <span>{ifChargeSheet}</span>
              </div>
            </div>

            {/* 8. Name of I.O. at the time of Charge Sheet */}
            <div className="space-y-1 text-xs border-b border-slate-300 pb-2">
              <div className="font-bold font-sans">8. Name of I.O. at the time of Charge Sheet</div>
              <div className="grid grid-cols-3 gap-4 pt-1">
                <div>
                  <span className="font-bold">Name: </span>
                  <span>{ioName}</span>
                </div>
                <div>
                  <span className="font-bold">Rank: </span>
                  <span>{ioRank}</span>
                </div>
                <div>
                  <span className="font-bold">No.: </span>
                  <span className="font-mono">{ioNo}</span>
                </div>
              </div>
            </div>

            {/* 9. Complainant / Informant */}
            <div className="space-y-1 text-xs border-b border-slate-300 pb-2">
              <div>
                <span className="font-bold">9. (a) Name of Complainant / Informant: </span>
                <span className="font-semibold">{complainantName}</span>
              </div>
              <div>
                <span className="font-bold">&nbsp;&nbsp;&nbsp;&nbsp;(b) Father&apos;s / Husband&apos;s Name: </span>
                <span>{complainantFather}</span>
              </div>
            </div>

            {/* 10. Details of Properties Recovered */}
            <div className="space-y-1.5 text-xs">
              <div className="font-bold font-sans">
                10. Details of Properties / Articles / Documents Recovered / Seized
              </div>
              <table className="w-full border-collapse border border-slate-400 text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-400">
                    <th className="border border-slate-400 p-1.5 w-12 text-center">S. No.</th>
                    <th className="border border-slate-400 p-1.5">Property Description</th>
                    <th className="border border-slate-400 p-1.5 w-24">Estimated Value (Rs.)</th>
                    <th className="border border-slate-400 p-1.5 w-28">P.S. Property Register No.</th>
                    <th className="border border-slate-400 p-1.5">From Whom / Where Seized</th>
                    <th className="border border-slate-400 p-1.5 w-24">Disposal</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyRows.map((p, idx) => (
                    <tr key={idx}>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">{p.sNo}</td>
                      <td className="border border-slate-400 p-1.5">{p.propertyDescription}</td>
                      <td className="border border-slate-400 p-1.5">{p.estimatedValue}</td>
                      <td className="border border-slate-400 p-1.5 font-mono">{p.psPropertyRegisterNo}</td>
                      <td className="border border-slate-400 p-1.5">{p.fromWhomWhereRecovered}</td>
                      <td className="border border-slate-400 p-1.5">{p.disposal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 11. Particulars of Accused Persons Charge-Sheeted */}
            <div className="space-y-3 text-xs pt-2">
              <div className="font-bold font-sans border-b border-slate-400 pb-1 uppercase tracking-wide">
                11. Particulars of Accused Persons Charge-Sheeted
              </div>

              {accusedPersonList.map((acc, aIdx) => (
                <div key={aIdx} className="space-y-2 border border-slate-300 p-3 rounded bg-slate-50/30">
                  <div className="font-bold font-sans">
                    S. No.: <span className="font-mono">{acc.sNo}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-bold">(i) Name: </span>
                      <span className="font-bold">{acc.name}</span>
                    </div>
                    <div>
                      <span className="font-bold">Whether Verified: </span>
                      <span>{acc.whetherVerified}</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold">(ii) Husband&apos;s / Father&apos;s Name: </span>
                    <span>{acc.husbandFatherName}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-bold">(iii) Date / Year of Birth: </span>
                      <span>{acc.dateOrYearOfBirth}</span>
                    </div>
                    <div>
                      <span className="font-bold">(iv) Sex: </span>
                      <span>{acc.sex}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-bold">(v) Nationality: </span>
                      <span>{acc.nationality}</span>
                    </div>
                    <div>
                      <span className="font-bold">(vi) Passport No.: </span>
                      <span>{acc.passportNo || "Nil"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="font-bold">(vii) Religion: </span>
                      <span>{acc.religion}</span>
                    </div>
                    <div>
                      <span className="font-bold">(viii) Whether SC / ST / OBC: </span>
                      <span>{acc.scStObc}</span>
                    </div>
                    <div>
                      <span className="font-bold">(ix) Occupation: </span>
                      <span>{acc.occupation}</span>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1 pt-1">
                    <div className="font-bold">. (x) Address</div>
                    <table className="w-full border-collapse border border-slate-300 text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300">
                          <th className="border border-slate-300 p-1 w-10 text-center">S. No.</th>
                          <th className="border border-slate-300 p-1 w-32">Address Type</th>
                          <th className="border border-slate-300 p-1">Address</th>
                          <th className="border border-slate-300 p-1 w-24 text-center">Verified</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acc.addresses.map((ad, idx) => (
                          <tr key={idx}>
                            <td className="border border-slate-300 p-1 text-center font-mono">{ad.sNo}</td>
                            <td className="border border-slate-300 p-1">{ad.addressType}</td>
                            <td className="border border-slate-300 p-1">{ad.address}</td>
                            <td className="border border-slate-300 p-1 text-center">{ad.whetherVerified}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <span className="font-bold">(xi) Regular Criminal No.: </span>
                      <span>{acc.regularCriminalNo || "Nil"}</span>
                    </div>
                    <div>
                      <span className="font-bold">(xii) Date of Arrest: </span>
                      <span>{acc.dateOfArrest}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-bold">(xiii) Date of Release on Bail: </span>
                      <span>{acc.dateOfReleaseOnBail}</span>
                    </div>
                    <div>
                      <span className="font-bold">(xiv) Date on Which Forwarded to Court: </span>
                      <span>{acc.dateForwardedToCourt}</span>
                    </div>
                  </div>

                  {/* Under Acts & Sections */}
                  <div className="space-y-1 pt-1">
                    <div className="font-bold">. (xv) Under Acts &amp; Sections</div>
                    <table className="w-full border-collapse border border-slate-300 text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300">
                          <th className="border border-slate-300 p-1 w-10 text-center">S. No.</th>
                          <th className="border border-slate-300 p-1">Act</th>
                          <th className="border border-slate-300 p-1">Sections</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acc.underActsSections.map((u, idx) => (
                          <tr key={idx}>
                            <td className="border border-slate-300 p-1 text-center font-mono">{u.sNo}</td>
                            <td className="border border-slate-300 p-1">{u.act}</td>
                            <td className="border border-slate-300 p-1 font-bold font-mono">{u.sections}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Bailers / Sureties */}
                  <div className="space-y-1 pt-1">
                    <div className="font-bold">. (xvi) Details of Bailers / Sureties</div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div><span className="font-bold">Name: </span>{acc.bailerName}</div>
                      <div><span className="font-bold">Father&apos;s Name: </span>{acc.bailerFatherHusbandName}</div>
                      <div><span className="font-bold">Occupation: </span>{acc.bailerOccupation}</div>
                    </div>
                    <table className="w-full border-collapse border border-slate-300 text-[11px] mt-1">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300">
                          <th className="border border-slate-300 p-1 w-10 text-center">S. No.</th>
                          <th className="border border-slate-300 p-1 w-32">Address Type</th>
                          <th className="border border-slate-300 p-1">Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acc.bailerAddresses.map((ba, idx) => (
                          <tr key={idx}>
                            <td className="border border-slate-300 p-1 text-center font-mono">{ba.sNo}</td>
                            <td className="border border-slate-300 p-1">{ba.addressType}</td>
                            <td className="border border-slate-300 p-1">{ba.address}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Identification */}
                  <div className="space-y-1 pt-1 text-[11px]">
                    <div className="font-bold">. Identification</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><span className="font-bold">Date of Birth: </span>{acc.identificationDob}</div>
                      <div><span className="font-bold">UID Number: </span><span className="font-mono">{acc.identificationUid}</span></div>
                    </div>
                    <div className="font-bold pt-1">. Any Other ID Proof</div>
                    <table className="w-full border-collapse border border-slate-300 text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300">
                          <th className="border border-slate-300 p-1 w-10 text-center">S. No.</th>
                          <th className="border border-slate-300 p-1 w-36">ID Type</th>
                          <th className="border border-slate-300 p-1">ID Number</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acc.otherIdProofs.map((op, idx) => (
                          <tr key={idx}>
                            <td className="border border-slate-300 p-1 text-center font-mono">{op.sNo}</td>
                            <td className="border border-slate-300 p-1">{op.idType}</td>
                            <td className="border border-slate-300 p-1 font-mono">{op.idNumber}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Previous Convictions */}
                  <div className="space-y-1 pt-1 text-[11px]">
                    <div className="font-bold">. (xvii) Previous Convictions with Case References</div>
                    <table className="w-full border-collapse border border-slate-300 text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300">
                          <th className="border border-slate-300 p-1 w-8 text-center">S.No.</th>
                          <th className="border border-slate-300 p-1">FIR No.</th>
                          <th className="border border-slate-300 p-1">State</th>
                          <th className="border border-slate-300 p-1">District</th>
                          <th className="border border-slate-300 p-1">Police Station</th>
                          <th className="border border-slate-300 p-1">Description of Case</th>
                          <th className="border border-slate-300 p-1">Details of Conviction/Acquittal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acc.previousConvictions.map((pv, idx) => (
                          <tr key={idx}>
                            <td className="border border-slate-300 p-1 text-center font-mono">{pv.sNo}</td>
                            <td className="border border-slate-300 p-1">{pv.firNo}</td>
                            <td className="border border-slate-300 p-1">{pv.state}</td>
                            <td className="border border-slate-300 p-1">{pv.district}</td>
                            <td className="border border-slate-300 p-1">{pv.policeStation}</td>
                            <td className="border border-slate-300 p-1">{pv.descriptionOfCase}</td>
                            <td className="border border-slate-300 p-1">{pv.convictionAcquittal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-1">
                    <span className="font-bold">(xviii) Status of the Accused: </span>
                    <span className="font-bold">{acc.statusOfAccused}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 12, 13, 14, 15 */}
            <div className="space-y-3 text-xs border-t border-slate-300 pt-3">
              <div>
                <div className="font-bold font-sans">
                  12. Particulars of Accused Persons Not Charge-Sheeted (Suspect)
                </div>
                <p className="mt-1 whitespace-pre-wrap text-slate-800">{accusedNotChargeSheeted}</p>
              </div>

              <div>
                <div className="font-bold font-sans">
                  13. Particulars of Witnesses to be Examined
                </div>
                <pre className="mt-1 whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed bg-slate-50 p-2 border border-slate-200 rounded">
                  {witnessesList}
                </pre>
              </div>

              <div>
                <div className="font-bold font-sans">
                  14. If FIR is False, Action Taken or Proposed to be Taken
                </div>
                <p className="mt-1 text-slate-800">{falseFirAction}</p>
              </div>

              <div>
                <div className="font-bold font-sans">
                  15. Result of Laboratory Analysis
                </div>
                <p className="mt-1 text-slate-800">{labAnalysis}</p>
              </div>
            </div>

            {/* 16. Brief Facts */}
            <div className="space-y-2 text-xs border-t border-slate-300 pt-3">
              <div className="font-bold font-sans text-sm uppercase tracking-wide">
                16. Brief Facts of the Case
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-slate-900 text-justify bg-slate-50/50 p-3 rounded border border-slate-200">
                {briefFacts}
              </div>
            </div>

            {/* 17, 18, 19, 20 */}
            <div className="space-y-2 text-xs border-t border-slate-300 pt-3">
              <div className="font-bold font-sans">17. Refer Notice Served</div>
              <div className="grid grid-cols-3 gap-4">
                <div><span className="font-bold">Refer Notice Served: </span>{referNoticeServed}</div>
                <div><span className="font-bold">Date: </span>{referNoticeDate || "N/A"}</div>
                <div><span className="font-bold">Acknowledgement to be Placed: </span>{referNoticeAck}</div>
              </div>

              <div className="pt-1">
                <span className="font-bold">18. Despatched On: </span>{despatchedOn}
              </div>

              <div>
                <span className="font-bold">19. No. of Enclosures: </span>{noOfEnclosures}
              </div>

              <div className="pt-1">
                <div className="font-bold font-sans">20. List of Enclosures, As Annexed</div>
                <pre className="mt-1 whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed bg-slate-50 p-2.5 border border-slate-200 rounded">
                  {listOfEnclosures}
                </pre>
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-12 border-t-2 border-slate-800">
              <div className="grid grid-cols-2 gap-8 text-xs font-sans">
                {/* Left: Forwarded by Officer in Charge */}
                <div className="space-y-2">
                  <p className="font-bold text-slate-900 uppercase">Forwarded by Officer in Charge</p>
                  <div className="pt-8">
                    <div>
                      <span className="font-semibold text-slate-700">Signature: </span>
                      <span className="font-mono text-slate-500">_________________________________</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="font-semibold text-slate-700">Name: </span>
                      <span className="font-bold text-slate-900">{shoName}</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="font-semibold text-slate-700">Rank: </span>
                      <span className="text-slate-800">{shoRank}</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="font-semibold text-slate-700">No.: </span>
                      <span className="font-mono text-slate-800">{shoNo}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Signature of Investigating Officer */}
                <div className="space-y-2">
                  <p className="font-bold text-slate-900 uppercase">
                    Investigating Officer Submitting Final Report / Charge Sheet
                  </p>
                  <div className="pt-8">
                    <div>
                      <span className="font-semibold text-slate-700">Signature: </span>
                      <span className="font-mono text-slate-500">_________________________________</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="font-semibold text-slate-700">Name: </span>
                      <span className="font-bold text-slate-900">{ioName}</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="font-semibold text-slate-700">Rank: </span>
                      <span className="text-slate-800">{ioRank}</span>
                    </div>
                    <div className="mt-1.5">
                      <span className="font-semibold text-slate-700">No.: </span>
                      <span className="font-mono text-slate-800">{ioNo}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons in Preview */}
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveStep("form")}
              className="border-slate-300 text-slate-700 text-xs font-bold gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
              <span>← Edit Form (संशोधित करें)</span>
            </Button>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { if (previewRef.current) printA4Element(previewRef.current); }}
                className="text-xs font-bold gap-1 border-slate-300 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-blue-600" />
                <span>Print</span>
              </Button>

              <Button
                size="sm"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md cursor-pointer px-5"
              >
                <FileCheck2 className="w-4 h-4 text-emerald-200" />
                <span>{submitting ? "Submitting..." : "Final Submit & Save to Case (अंतिम रूप से जमा करें)"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (inline) {
    return contentJsx;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-[#0b192c] to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                  I.I.F.-V • Under Section 193 BNSS
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  FIR #{fir.firNumber}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Final Form / Police Report (अंतिम रिपोर्ट / चालान)</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeStep === "form" ? (
              <Button
                size="sm"
                onClick={() => setActiveStep("preview")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Submit for Preview (प्रारूप पूर्वावलोकन) →</span>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveStep("form")}
                className="border-slate-600 text-slate-200 hover:bg-slate-800 text-xs font-bold gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>← Edit Form (संशोधित करें)</span>
              </Button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60 space-y-6">
          {contentJsx}
        </div>
      </div>
    </div>
  );
}

export function FinalReportModal(props: {
  fir: FIRItem;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (report: ComplaintReportItem) => void;
  currentUser: any;
}) {
  if (!props.isOpen) return null;
  return (
    <IIFVChargesheetForm
      fir={props.fir}
      currentUser={props.currentUser}
      onSaved={props.onSaved}
      onClose={props.onClose}
      inline={false}
    />
  );
}
