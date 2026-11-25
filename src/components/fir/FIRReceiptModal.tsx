"use client";

import React, { useRef } from "react";
import { Printer, X, Download, FileDown } from "lucide-react";
import { FIRItem } from "@/types";
import { Button } from "@/components/ui/button";
import { printA4Element, downloadA4DocumentAsHtml } from "@/utils/printElement";
import { useAuth } from "@/context/AuthContext";
import { DEMO_USERS } from "@/lib/mockData";

interface FIRReceiptModalProps {
  fir: FIRItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FIRReceiptModal({ fir, isOpen, onClose }: FIRReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !fir) return null;

  // Format date DD/MM/YYYY
  const formatDateDMY = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("T")[0].split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Safe strings
  const firNumberDisplay = fir.firNumber?.replace(/^FIR\//i, "")?.replace(/\/\d{4}$/, "") || fir.firNumber || "";
  const firDateDMY = formatDateDMY(fir.firDate || "");
  const firTimeHrs = fir.firTime ? `${fir.firTime} hrs` : "";
  const gdDateDMY = formatDateDMY(fir.gdDate || fir.firDate || "");
  const gdTimeHrs = fir.gdTime ? `${fir.gdTime} hrs` : (fir.firTime ? `${fir.firTime} hrs` : "");
  const occDateFromDMY = formatDateDMY(fir.incidentDateFrom);
  const occDateToDMY = formatDateDMY(fir.incidentDateTo || fir.incidentDateFrom);

  const ioName = fir.assignedIoName || fir.actionTakenData?.directedIoName || "";
  const ioRank = fir.assignedIoRank || fir.actionTakenData?.directedIoRank || "";
  const ioBelt = fir.assignedIoBeltNumber || fir.actionTakenData?.directedIoBelt || fir.assignedIoPno || "";

  const { currentUser } = useAuth();
  const registeredName = fir.signatureData?.officerInChargeName || fir.registeredBy?.split("(")[0]?.trim() || currentUser?.name || "";
  const matchedUser = DEMO_USERS.find((u) =>
    u.name.toLowerCase().trim() === registeredName.toLowerCase().trim() ||
    registeredName.toLowerCase().includes(u.name.toLowerCase().split(",")[0].trim()) ||
    (currentUser && currentUser.name.toLowerCase().trim() === u.name.toLowerCase().trim())
  ) || currentUser;

  const officerNameDisplay = fir.signatureData?.officerInChargeName || registeredName;
  const officerRankDisplay =
    fir.signatureData?.officerInChargeRank ||
    fir.registeredBy?.match(/\((.*?)\)/)?.[1] ||
    matchedUser?.rankDisplay ||
    matchedUser?.roleDisplay ||
    "";
  const officerNoDisplay =
    fir.signatureData?.officerInChargeNumber ||
    matchedUser?.pno ||
    "";

  // Total Property value
  const totalPropVal = fir.totalPropertyEstimatedValue ?? (
    fir.propertiesList && fir.propertiesList.length > 0
      ? fir.propertiesList.reduce((acc, p) => acc + (Number(p.estimatedValue) || 0), 0)
      : undefined
  );

  // Complainant Address fallback
  const presentAddressStr = [
    fir.complainantPresentHouseNo || fir.complainantHouseNo,
    fir.complainantPresentStreet || fir.complainantStreet,
    fir.complainantPresentColony || fir.complainantColony,
    fir.complainantPresentVillageCity || fir.complainantCity || fir.complainantAddress,
    fir.complainantPresentDistrict || fir.complainantDistrict,
    fir.complainantPresentState || fir.complainantState || "",
    ""
  ].filter(Boolean).join(", ");

  const permanentAddressStr = [
    fir.complainantPermanentHouseNo || fir.complainantHouseNo || fir.complainantAddress,
    fir.complainantPermanentStreet || fir.complainantStreet,
    fir.complainantPermanentColony || fir.complainantColony,
    fir.complainantPermanentVillageCity || fir.complainantCity,
    fir.complainantPermanentDistrict || fir.complainantDistrict,
    fir.complainantPermanentState || fir.complainantState || "",
    ""
  ].filter(Boolean).join(", ");

  const handlePrint = () => {
    printA4Element("cctns-printable-fir", `FIR_${firNumberDisplay}`);
  };

  const handleDownload = () => {
    downloadA4DocumentAsHtml(
      "cctns-printable-fir",
      `FIR_${firNumberDisplay}`,
      `FIRST INFORMATION REPORT - ${firNumberDisplay}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 overflow-y-auto animate-in fade-in-50">
      <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-2xl border border-neutral-300 overflow-hidden flex flex-col my-auto max-h-[96vh]">
        {/* Top Floating Control Bar - Pure Dark Neutral (No Blue Tint) */}
        <div className="no-print flex items-center justify-between px-5 py-3 bg-neutral-900 text-white border-b border-neutral-700">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              Official FIR Preview (I.I.F.-I) • Haryana Police
            </h3>
            <p className="text-[11px] text-neutral-300">
              Statutory Form under Section 173 B.N.S.S.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownload}
              size="sm"
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-medium text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-300" />
              Download A4
            </Button>
            <Button
              onClick={handlePrint}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print FIR (A4)
            </Button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-white hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Form Area - Neutral Desk Backdrop, Continuous White A4 Sheet */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-neutral-200/90 block">
          <div
            id="cctns-printable-fir"
            ref={receiptRef}
            className="bg-white border border-neutral-300 p-8 sm:p-12 shadow-md w-full max-w-[850px] mx-auto font-serif text-black leading-normal text-[13px] space-y-6 h-auto min-h-full"
          >
            {/* Top Running Header */}
            <div>
              <div className="flex justify-end text-right text-[13px] font-bold">
                <div>
                  <div>Haryana Police (हरियाणा पुलिस)</div>
                  <div>I.I.F.-I (एकीकृत जाँच फार्म-I)</div>
                </div>
              </div>
              <hr className="border-t border-black mt-2 mb-4" />
            </div>

            {/* Document Main Heading */}
            <div className="text-center space-y-0.5 pb-2">
              <h1 className="font-bold text-[15px] uppercase tracking-wide">
                FIRST INFORMATION REPORT
              </h1>
              <div className="text-[13px] font-bold">
                (Under Section 173 B.N.S.S)
              </div>
              <h2 className="font-bold text-[15px] pt-1">
                प्रथम सूचना रिपोर्ट
              </h2>
              <div className="text-[13px] font-bold">
                (धारा 173 बी एन एस एस के तहत)
              </div>
            </div>

            {/* 1. Basic Details */}
            <div className="space-y-1.5 text-[13px]">
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-4">
                  <strong>1. District (जिला):</strong> {fir.district || ""}
                </div>
                <div className="col-span-4">
                  <strong>P.S. (थाना):</strong> {fir.policeStation || ""}
                </div>
                <div className="col-span-4 text-right">
                  <strong>Year (वर्ष):</strong> {fir.firYear || ""}
                </div>
              </div>

              <div className="grid grid-cols-12 gap-2 pt-1">
                <div className="col-span-5">
                  <strong>FIR No. (प्र.सू.रि. सं.):</strong> {firNumberDisplay}
                </div>
                <div className="col-span-7">
                  <strong>Date and Time of FIR (प्र.सू.रि. की दिनांक और समय):</strong>
                  <div className="pl-6 font-medium">
                    {firDateDMY} {firTimeHrs}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Acts and Sections Table */}
            <div className="space-y-1">
              <div className="flex items-start gap-4">
                <strong className="w-5 shrink-0">2.</strong>
                <div className="flex-1">
                  <table className="w-full border-collapse border border-black text-[12px]">
                    <thead>
                      <tr className="border-b border-black text-left">
                        <th className="border-r border-black p-1.5 w-20 font-bold">
                          S.No. (क्र.सं.)
                        </th>
                        <th className="border-r border-black p-1.5 font-bold">
                          Acts (अधिनियम)
                        </th>
                        <th className="p-1.5 font-bold w-40">
                          Sections (धारा(एँ))
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Official Haryana Police FIR format: Every section has its own individual row with separate S.No.
                        const expandedRows: { act: string; section: string }[] = [];

                        if (fir.actsAndSectionsList && fir.actsAndSectionsList.length > 0) {
                          for (const row of fir.actsAndSectionsList) {
                            const act = (row.act || "").trim();
                            const actUpper = act.toUpperCase();
                            // Exclude BNSS and BSA procedural/evidentiary codes
                            if (
                              actUpper.includes("BNSS") ||
                              actUpper.includes("NAGARIK") ||
                              actUpper.includes("SURAKSHA") ||
                              actUpper.includes("BSA") ||
                              actUpper.includes("SAKSHYA")
                            ) {
                              continue;
                            }
                            const rawSections = (row.sections || "")
                              .replace(/^Sec(tion)?\.?\s*/gi, "")
                              .split(/[,;]/)
                              .map((s) => s.trim().replace(/^Sec(tion)?\.?\s*/i, ""))
                              .filter(Boolean);

                            for (const sec of rawSections) {
                              if (sec.includes("173(3)") && !sec.includes("303") && !sec.includes("351")) continue;
                              expandedRows.push({
                                act: act,
                                section: sec,
                              });
                            }
                          }
                        }

                        // If expandedRows is still empty, fallback to substantive penal acts
                        if (expandedRows.length === 0) {
                          const actName =
                            fir.majorAct && !fir.majorAct.toUpperCase().includes("BNSS")
                              ? fir.majorAct
                              : "";

                          const sourceSections = fir.bnsSections?.length
                            ? fir.bnsSections
                            : (fir.actsAndSections || "")
                                .replace(/BNSS.*?(\;|$)/gi, "")
                                .replace(/;\s*$/, "")
                                .split(/[,;]/)
                                .map((s) => s.trim().replace(/^Sec(tion)?\.?\s*/i, ""))
                                .filter(Boolean);

                          for (const sec of sourceSections) {
                            expandedRows.push({
                              act: actName,
                              section: sec,
                            });
                          }
                        }

                        return expandedRows.map((row, idx) => (
                          <tr key={idx} className="border-b border-black last:border-b-0">
                            <td className="border-r border-black p-1.5 text-center">
                              {idx + 1}
                            </td>
                            <td className="border-r border-black p-1.5">
                              {row.act}
                            </td>
                            <td className="p-1.5 font-medium">
                              {row.section}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 3. Occurrence of Offence & GD Reference */}
            <div className="space-y-2 text-[13px]">
              <div className="flex items-start gap-4">
                <strong className="w-5 shrink-0">3.</strong>
                <div className="flex-1 space-y-2">
                  <div>
                    <strong>(a) Occurrence of offence (अपराध की घटना):</strong>
                  </div>

                  <div className="pl-4 space-y-1.5">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-4">
                        <strong>1 Day (दिन):</strong> {fir.incidentDay || ""}
                      </div>
                      <div className="col-span-4">
                        <strong>Date from (दिनांक से):</strong>
                        <div>{occDateFromDMY || ""}</div>
                      </div>
                      <div className="col-span-4">
                        <strong>Date To (दिनांक तक):</strong>
                        <div>{occDateToDMY || ""}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-2 pt-1">
                      <div className="col-span-4">
                        <strong>Time Period (समय अवधि):</strong> {fir.incidentTimePeriod || ""}
                      </div>
                      <div className="col-span-4">
                        <strong>Time From (समय से):</strong> {fir.incidentTimeFrom ? `${fir.incidentTimeFrom} hrs` : ""}
                      </div>
                      <div className="col-span-4">
                        <strong>Time To (समय तक):</strong> {fir.incidentTimeTo ? `${fir.incidentTimeTo} hrs` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-6">
                        <strong>(b) Information received at P.S. (थाना जहां सूचना प्राप्त हुई):</strong>
                      </div>
                      <div className="col-span-3">
                        <strong>Date (दिनांक):</strong> {firDateDMY}
                      </div>
                      <div className="col-span-3">
                        <strong>Time (समय):</strong> {firTimeHrs}
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-5">
                        <strong>(c) General Diary Reference (रोजनामचा संदर्भ):</strong>
                      </div>
                      <div className="col-span-3">
                        <strong>Entry No. (प्रविष्टि सं.):</strong> {fir.gdEntryNumber || ""}
                      </div>
                      <div className="col-span-4">
                        <strong>Date and Time (दिनांक और समय):</strong>
                        <div>{gdDateDMY} {gdTimeHrs}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Type of Information */}
            <div className="flex items-start gap-4 text-[13px]">
              <strong className="w-5 shrink-0">4.</strong>
              <div>
                <strong>Type of Information (सूचना का प्रकार):</strong>{" "}
                {fir.typeOfInformation ? (fir.typeOfInformation === "ORAL" ? "Oral" : "Written") : ""}
              </div>
            </div>

            {/* 5. Place of Occurrence */}
            <div className="flex items-start gap-4 text-[13px]">
              <strong className="w-5 shrink-0">5.</strong>
              <div className="flex-1 space-y-1.5">
                <div>
                  <strong>Place of Occurrence (घटनास्थल):</strong>
                </div>
                <div className="pl-4 space-y-1">
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-8">
                      <strong>1. (a) Direction and distance from P.S. (थाना से दूरी और दिशा):</strong>{" "}
                      {fir.distanceFromPs || ""}
                    </div>
                    <div className="col-span-4">
                      <strong>Beat No. (बीट सं.):</strong> {fir.beatNumber || ""}
                    </div>
                  </div>

                  <div>
                    <strong>(b) Address (पता):</strong> {fir.incidentPlace || ""}
                  </div>

                  <div>
                    <strong>(c) In case, outside the limit of this Police Station, then Name of P.S. (यदि थाना सीमा के बाहर है तो थाना का नाम):</strong>{" "}
                    {fir.outsidePsDetails || ""}
                  </div>

                  <div>
                    <strong>District (State) (जिला (राज्य)):</strong>{" "}
                    {fir.outsideDistrict ? `${fir.outsideDistrict} (${fir.outsideState || ""})` : ""}
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Complainant / Informant */}
            <div className="flex items-start gap-4 text-[13px]">
              <strong className="w-5 shrink-0">6.</strong>
              <div className="flex-1 space-y-1.5">
                <div>
                  <strong>Complainant / Informant (शिकायतकर्ता / सूचनाकर्ता):</strong>
                </div>

                <div className="pl-4 space-y-1.5">
                  <div>
                    <strong>(a) Name (नाम):</strong> {fir.complainantName || ""}
                  </div>

                  <div>
                    <strong>(b) Father&apos;s/Husband&apos;s Name (पिता/पति का नाम):</strong> {fir.complainantFatherSpouse || fir.complainantRelativeName || ""}
                  </div>

                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-6">
                      <strong>(c) Date/Year of Birth (जन्म तिथि / वर्ष):</strong> {fir.complainantDob ? formatDateDMY(fir.complainantDob) : (fir.complainantYearOfBirth || "")}
                    </div>
                    <div className="col-span-6">
                      <strong>(d) Nationality (राष्ट्रीयता):</strong> {fir.complainantNationality || ""}
                    </div>
                  </div>

                  <div>
                    <strong>(e) UID No. (यूआईडी सं.):</strong> {fir.complainantUid || ""}
                  </div>

                  <div>
                    <strong>(f) Passport No. (पासपोर्ट सं.):</strong> {fir.complainantPassportNumber || ""}
                    <div className="grid grid-cols-12 gap-2 pt-0.5">
                      <div className="col-span-6">
                        <strong>Date of Issue (जारी करने की दिनांक):</strong> {fir.complainantPassportIssueDate || fir.complainantPassportDateOfIssue || ""}
                      </div>
                      <div className="col-span-6">
                        <strong>Place of Issue (जारी करने का स्थान):</strong> {fir.complainantPassportIssuePlace || fir.complainantPassportPlaceOfIssue || ""}
                      </div>
                    </div>
                  </div>

                  {/* (g) ID Details Table */}
                  <div className="pt-1">
                    <strong>(g) ID Details (Ration Card, Voter ID Card, Passport, UID No., Driving License, PAN) (पहचान विवरण (राशन कार्ड ,मतदाता कार्ड ,पासपोर्ट, यूआईडी सं., ड्राइविंग लाइसेंस, पैन कार्ड))</strong>
                    <div className="mt-1">
                      <table className="w-full border-collapse border border-black text-[12px]">
                        <thead>
                          <tr className="border-b border-black text-left">
                            <th className="border-r border-black p-1 w-24 font-bold">
                              S. No. (क्र.सं.)
                            </th>
                            <th className="border-r border-black p-1 font-bold">
                              ID Type (पहचान पत्र का प्रकार)
                            </th>
                            <th className="p-1 font-bold">
                              ID Number (पहचान संख्या)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {fir.complainantIdentifications && fir.complainantIdentifications.length > 0 ? (
                            fir.complainantIdentifications.map((idRow, idx) => (
                              <tr key={idx} className="border-b border-black last:border-b-0">
                                <td className="border-r border-black p-1 text-center">{idx + 1}</td>
                                <td className="border-r border-black p-1">{idRow.idType}</td>
                                <td className="p-1">{idRow.idNumber}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="border-r border-black p-1 text-center h-6"></td>
                              <td className="border-r border-black p-1"></td>
                              <td className="p-1"></td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <strong>(h) Occupation (व्यवसाय):</strong> {fir.complainantOccupation || ""}
                  </div>

                  {/* (i) Address Table */}
                  <div className="pt-1">
                    <strong>(i) Address (पता):</strong>
                    <div className="mt-1">
                      <table className="w-full border-collapse border border-black text-[12px]">
                        <thead>
                          <tr className="border-b border-black text-left">
                            <th className="border-r border-black p-1 w-20 font-bold">
                              S.No. (क्र.सं.)
                            </th>
                            <th className="border-r border-black p-1 w-48 font-bold">
                              Address Type (पता का प्रकार)
                            </th>
                            <th className="p-1 font-bold">
                              Address (पता)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-black">
                            <td className="border-r border-black p-1 text-center">1</td>
                            <td className="border-r border-black p-1 font-medium">Present Address</td>
                            <td className="p-1">
                              {presentAddressStr || ""}
                            </td>
                          </tr>
                          <tr>
                            <td className="border-r border-black p-1 text-center">2</td>
                            <td className="border-r border-black p-1 font-medium">Permanent Address</td>
                            <td className="p-1">
                              {permanentAddressStr || ""}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 pt-1">
                    <div className="col-span-6">
                      <strong>(j) Phone number (दूरभाष सं.):</strong> {fir.complainantLandline || fir.complainantAltPhone || ""}
                    </div>
                    <div className="col-span-6">
                      <strong>Mobile (मोबाइल सं.):</strong> {fir.complainantMobile ? (fir.complainantMobile.startsWith("91-") ? fir.complainantMobile : `91-${fir.complainantMobile}`) : ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 7. Accused Table */}
            <div className="space-y-1.5 text-[13px]">
              <div>
                <strong>7. Details of known / suspected / unknown accused with full particulars (ज्ञात / संदिग्ध / अज्ञात अभियुक्त का पूरे विवरण सहित वर्णन):</strong>
              </div>
              <table className="w-full border-collapse border border-black text-[12px]">
                <thead>
                  <tr className="border-b border-black text-left">
                    <th className="border-r border-black p-1.5 w-16 font-bold">
                      S. No. (क्र.सं.)
                    </th>
                    <th className="border-r border-black p-1.5 font-bold w-36">
                      Name (नाम)
                    </th>
                    <th className="border-r border-black p-1.5 font-bold w-24">
                      Alias (उपनाम)
                    </th>
                    <th className="border-r border-black p-1.5 font-bold w-48">
                      Relative&apos;s Name (रिश्तेदार का नाम)
                    </th>
                    <th className="p-1.5 font-bold">
                      Present Address(वर्तमान पता)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fir.accusedList && fir.accusedList.length > 0 ? (
                    fir.accusedList.map((acc, idx) => (
                      <tr key={idx} className="border-b border-black last:border-b-0">
                        <td className="border-r border-black p-1.5 text-center">
                          {idx + 1}
                        </td>
                        <td className="border-r border-black p-1.5 font-medium">
                          {acc.name}
                        </td>
                        <td className="border-r border-black p-1.5">
                          {acc.alias || ""}
                        </td>
                        <td className="border-r border-black p-1.5">
                          {acc.fatherName || acc.relativeName ? `Father's Name: ${acc.fatherName || acc.relativeName}` : ""}
                        </td>
                        <td className="p-1.5">
                          {acc.address || (acc.physicalDescription ? `1. ${acc.physicalDescription}` : "")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="border-r border-black p-1.5 text-center h-6"></td>
                      <td className="border-r border-black p-1.5"></td>
                      <td className="border-r border-black p-1.5"></td>
                      <td className="border-r border-black p-1.5"></td>
                      <td className="p-1.5"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 8. Reasons for delay */}
            <div className="text-[13px] space-y-1">
              <div>
                <strong>8. Reasons for delay in reporting by the complainant / informant (शिकायतकर्ता / सूचनाकर्ता द्वारा रिपोर्ट देरी से दर्ज कराने के कारण):</strong>
              </div>
              <div className="pl-4">
                {fir.reasonsForDelay || fir.delayReason || ""}
              </div>
            </div>

            {/* 9. Particulars of properties of interest Table */}
            <div className="space-y-1.5 text-[13px]">
              <div>
                <strong>9. Particulars of properties of interest (संबन्धित सम्पति का विवरण):</strong>
              </div>
              <table className="w-full border-collapse border border-black text-[12px]">
                <thead>
                  <tr className="border-b border-black text-left">
                    <th className="border-r border-black p-1.5 w-16 font-bold">
                      S. No. (क्र.सं.)
                    </th>
                    <th className="border-r border-black p-1.5 font-bold w-40">
                      Property Category (सम्पत्ति श्रेणी)
                    </th>
                    <th className="border-r border-black p-1.5 font-bold w-36">
                      Property Type (सम्पत्ति के प्रकार)
                    </th>
                    <th className="border-r border-black p-1.5 font-bold">
                      Description (विवरण)
                    </th>
                    <th className="p-1.5 font-bold w-28 text-right">
                      Value(In Rs/-) (मूल्य (रु में))
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fir.propertiesList && fir.propertiesList.length > 0 ? (
                    fir.propertiesList.map((p, idx) => (
                      <tr key={idx} className="border-b border-black last:border-b-0">
                        <td className="border-r border-black p-1.5 text-center">
                          {p.srNo || idx + 1}
                        </td>
                        <td className="border-r border-black p-1.5">
                          {p.propertyCategory}
                        </td>
                        <td className="border-r border-black p-1.5">
                          {p.propertyType}
                        </td>
                        <td className="border-r border-black p-1.5">
                          {p.description}
                        </td>
                        <td className="p-1.5 text-right font-mono">
                          {p.estimatedValue ? `${Number(p.estimatedValue).toFixed(2)}` : ""}
                        </td>
                      </tr>
                    ))
                  ) : fir.stolenPropertyDetails ? (
                    <tr>
                      <td className="border-r border-black p-1.5 text-center">1</td>
                      <td className="border-r border-black p-1.5">OTHERS</td>
                      <td className="border-r border-black p-1.5">MISC</td>
                      <td className="border-r border-black p-1.5">{fir.stolenPropertyDetails}</td>
                      <td className="p-1.5 text-right font-mono">
                        {totalPropVal ? `${Number(totalPropVal).toFixed(2)}` : ""}
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td className="border-r border-black p-1.5 text-center h-6"></td>
                      <td className="border-r border-black p-1.5"></td>
                      <td className="border-r border-black p-1.5"></td>
                      <td className="border-r border-black p-1.5"></td>
                      <td className="p-1.5 text-center font-mono"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 10. Total value of property */}
            <div className="text-[13px]">
              <strong>10. Total value of property (In Rs/-) (सम्पत्ति का कुल मूल्य(रु में)):</strong>{" "}
              <span className="font-mono">
                {totalPropVal && Number(totalPropVal) > 0 ? `${Number(totalPropVal).toFixed(2)}` : ""}
              </span>
            </div>

            {/* 11. Inquest Report / U.D. case No. */}
            <div className="space-y-1.5 text-[13px]">
              <div>
                <strong>11. Inquest Report / U.D. case No., if any (मृत्यु समीक्षा रिपोर्ट / यू.डी.प्रकरण सं., यदि कोई हो):</strong>{" "}
                {fir.inquestReportNo || fir.actionTakenData?.inquestCaseNo || ""}
              </div>
              <div className="pl-4">
                <table className="w-80 border-collapse border border-black text-[12px]">
                  <thead>
                    <tr className="border-b border-black text-left">
                      <th className="border-r border-black p-1 w-20 font-bold">
                        S. No. (क्र.सं.)
                      </th>
                      <th className="p-1 font-bold">
                        UIDB Number (यू.डी.प्रकरण सं.)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fir.uidbEntries && fir.uidbEntries.length > 0 ? (
                      fir.uidbEntries.map((u, idx) => (
                        <tr key={idx} className="border-b border-black last:border-b-0">
                          <td className="border-r border-black p-1 text-center">{idx + 1}</td>
                          <td className="p-1 font-mono">{u.uidbNumber}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="border-r border-black p-1 text-center h-6"></td>
                        <td className="p-1"></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 12. First Information contents */}
            <div className="space-y-2 text-[13px]">
              <div>
                <strong>12. First Information contents (प्रथम सूचना तथ्य):</strong>
              </div>
              <div className="pl-4 pr-2 text-justify whitespace-pre-wrap leading-relaxed">
                {fir.firContentText || fir.incidentDetails || ""}
              </div>
            </div>

            {/* 13. Action Taken */}
            <div className="space-y-2 text-[13px] pt-2">
              <div>
                <strong>Action taken: Since the above information reveals commission of offence(s) u/s as mentioned at Item No. 2.</strong>
                <div>
                  <strong>(की गयी कार्यवाही : चूंकि उपरोक्त जानकारी से पता चलता है कि अपराध करने का तरीका मद सं. 2 में उल्लेख धारा के तहत है.):</strong>
                </div>
              </div>

              <div className="pl-4 space-y-1.5">
                <div>
                  <strong>(1) Registered the case and took up the investigation (प्रकरण दर्ज किया गया और जांच के लिए लिया गया): / or (या)</strong>
                </div>

                <div>
                  <strong>(2) Directed (Name of I.O.) (जांच अधिकारी का नाम):</strong> {ioName} &nbsp;&nbsp;&nbsp;&nbsp;
                  <strong>Rank (पद):</strong> {ioRank}
                  <div className="pt-0.5">
                    <strong>No. (सं.):</strong> {ioBelt} &nbsp;&nbsp;&nbsp;&nbsp;
                    <strong>to take up the Investigation (को जांच अपने पास में लेने के लिए निर्देश दिया गया) or (या)</strong>
                  </div>
                </div>

                <div>
                  <strong>(3) Refused investigation due to (जांच के लिए):</strong> {fir.actionTakenData?.refusedReason || ""} &nbsp;&nbsp;&nbsp;&nbsp;
                  <strong>or (के कारण इंकार किया या)</strong>
                </div>

                <div>
                  <strong>(4) Transferred to P.S. (थाना):</strong> {fir.actionTakenData?.transferredPs || ""} &nbsp;&nbsp;&nbsp;&nbsp;
                  <strong>District (जिला):</strong> {fir.actionTakenData?.transferredDistrict || ""}
                  <div className="pt-0.5">
                    <strong>on point of jurisdiction (को क्षेत्राधिकार के कारण हस्तांतरित).</strong>
                  </div>
                </div>

                <div className="pt-2 text-justify">
                  F.I.R. read over to the complainant / informant, admitted to be correctly recorded and a copy given to the complainant /informant, free of cost. (शिकायतकर्ता / सूचनाकर्ता को प्राथमिकी पढ़ कर सुनाई गयी, सही दर्ज हुई माना और एक कॉपी निशुल्क शिकायतकर्ता को दी गयी)
                </div>

                <div className="pt-1">
                  <strong>R.O.A.C.</strong>
                  <div><strong>(आर.ओ.ए.सी.)</strong></div>
                </div>
              </div>
            </div>

            {/* 14. Signatures */}
            <div className="pt-8 grid grid-cols-12 gap-4 text-[13px]">
              <div className="col-span-6 space-y-1">
                <div><strong>14. Signature / Thumb impression</strong></div>
                <div className="pl-6"><strong>of the complainant / informant</strong></div>
                <div className="pl-6"><strong>(शिकायतकर्ता / सूचनाकर्ता के हस्ताक्षर /अंगूठे का निशान)</strong></div>
                <div className="pt-8 pl-6 text-black italic">
                  {fir.complainantName}
                </div>
              </div>

              <div className="col-span-6 space-y-1 text-right">
                <div><strong>Signature of Officer in charge, Police Station</strong></div>
                <div><strong>(थाना प्रभारी के हस्ताक्षर)</strong></div>
                <div className="pt-4 space-y-0.5">
                  <div><strong>Name (नाम):</strong> {officerNameDisplay}</div>
                  <div><strong>Rank (पद):</strong> {officerRankDisplay}</div>
                  <div><strong>No. (सं.):</strong> {officerNoDisplay}</div>
                </div>
              </div>
            </div>

            {/* 15. Court Dispatch */}
            <div className="pt-6 space-y-1 text-[13px]">
              <div>
                <strong>15. Date and time of dispatch to the court (अदालत में प्रेषण की दिनांक और समय):</strong>{" "}
                <span>{fir.courtDispatchDateTime ? `${formatDateDMY(fir.courtDispatchDateTime.split("T")[0])}${fir.courtDispatchDateTime.split("T")[1] ? ` ${fir.courtDispatchDateTime.split("T")[1]} hrs` : ""}` : ""}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
