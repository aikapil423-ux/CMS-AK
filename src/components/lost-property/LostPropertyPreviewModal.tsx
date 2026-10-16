"use client";

import React, { useRef } from "react";
import {
  X,
  Printer,
  Download,
  FileText,
  CheckCircle,
  CheckCircle2,
  ArrowLeft,
  Shield,
  QrCode,
} from "lucide-react";
import { LostPropertyRecord } from "@/types/lostProperty";
import { lostPropertyService } from "@/services/lostPropertyService";
import { printA4Element } from "@/utils/printElement";

interface LostPropertyPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: Partial<LostPropertyRecord>;
  isNewRecord?: boolean;
  onFinalSubmit?: (savedRecord: LostPropertyRecord) => void;
  isPendingFinalSubmit?: boolean;
  onBackToEdit?: () => void;
}

export const LostPropertyPreviewModal: React.FC<LostPropertyPreviewModalProps> = ({
  isOpen,
  onClose,
  record,
  isNewRecord = false,
  onFinalSubmit,
  isPendingFinalSubmit = false,
  onBackToEdit,
}) => {
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const effectiveIsPending = isPendingFinalSubmit || isNewRecord;

  const handlePrint = () => {
    if (printContainerRef.current) {
      const regSanitized = (record.registrationNumber || "0002_2019").replace(
        /[\/\\]/g,
        "_"
      );
      printA4Element(
        printContainerRef.current,
        `LOST_PROPERTY_${regSanitized}_CCTNS_SLIP`
      );
    } else {
      window.print();
    }
  };

  const handleDownload = () => {
    handlePrint();
  };

  const handleExecuteFinalSubmit = () => {
    try {
      const fullRecord: LostPropertyRecord = {
        id: record.id || `lp_${Date.now()}`,
        registrationNumber: record.registrationNumber || lostPropertyService.getNextRegistrationNumber(),
        registrationYear: record.registrationYear || String(new Date().getFullYear()),
        createdAt: record.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: record.status || "UNDER_ENQUIRY",
        gdNumber: record.gdNumber || "",
        gdDateTime: record.gdDateTime || "",
        dateOfPropertyMissing: record.dateOfPropertyMissing || new Date().toISOString().split("T")[0],
        timeOfPropertyMissing: record.timeOfPropertyMissing || "12:00",
        district: record.district || "PANCHKULA",
        year: record.year || String(new Date().getFullYear()),
        placeFromWhereMissing: record.placeFromWhereMissing || "",
        policeStation: record.policeStation || "PANCHKULA SECTOR-5",
        properties: record.properties || [],
        uid: record.uid || "",
        firstName: record.firstName || "Applicant",
        middleName: record.middleName || "",
        lastName: record.lastName || "",
        gender: record.gender || "Male",
        occupation: record.occupation || "",
        relationType: record.relationType || "Father",
        relativeName: record.relativeName || "",
        mobileNumbers: record.mobileNumbers || [],
        dob: record.dob || "",
        yearOfBirth: record.yearOfBirth || "",
        ageYears: record.ageYears || "",
        ageMonths: record.ageMonths || "",
        ageRangeFrom: record.ageRangeFrom || "",
        ageRangeTo: record.ageRangeTo || "",
        presentAddress: record.presentAddress || {
          houseNo: "",
          streetName: "",
          colony: "",
          villageTownCity: "",
          tehsil: "",
          country: "INDIA",
          state: "HARYANA",
          district: "PANCHKULA",
          policeStation: "PANCHKULA SECTOR-5",
          pincode: "",
        },
        ...record,
      } as LostPropertyRecord;
      const saved = lostPropertyService.save(fullRecord);
      if (onFinalSubmit) {
        onFinalSubmit(saved);
      }
      alert(
        `Lost Property Registration No. ${saved.registrationNumber} has been successfully generated!\n\nखोई संपत्ति पंजीकरण सं. ${saved.registrationNumber} सफलतापूर्वक दर्ज कर लिया गया है।`
      );
      onClose();
    } catch (e: any) {
      alert("Error saving lost property registration: " + (e?.message || e));
    }
  };

  const totalLostValue = (record.properties || []).reduce(
    (sum, p) => sum + (Number(p.estimatedValue) || 0),
    0
  );

  const displayRegNumber =
    record.registrationNumber ||
    (record.year ? `0002/${record.year}` : "0002/2019");

  const complainantFullName = [
    record.firstName,
    record.middleName,
    record.lastName,
  ]
    .filter(Boolean)
    .join(" ") || "raju Singh";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-2xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in-50">
        {/* Top Control Bar (matching UIDB/UD format) */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <div>
              <span className="font-bold text-xs sm:text-sm tracking-tight">
                CCTNS Form — Registration of Lost Property / Article (खोई संपत्ति / सामान का पंजीकरण)
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Reg No: {displayRegNumber} &bull; GD No: {record.gdNumber || "003"} &bull; PS {record.policeStation || "PANCHKULA SECTOR-5"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {effectiveIsPending && onBackToEdit && (
              <button
                type="button"
                onClick={onBackToEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                title="Go back to make changes in the form"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Form (संशोधन)</span>
              </button>
            )}

            {effectiveIsPending && (
              <button
                type="button"
                onClick={handleExecuteFinalSubmit}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer ring-2 ring-emerald-400/40"
                title="Final Submit & Save to Lost Property Register"
              >
                <CheckCircle className="w-4 h-4 text-white" />
                <span>Final Submit (अंतिम सबमिट)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              title="Download official PDF copy"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Informative Preview Banner when awaiting final submission (matching UIDB/UD) */}
        {effectiveIsPending && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 bg-amber-50 shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>प्रपत्र पूर्वावलोकन (Lost Property Preview):</strong> कृपया भरे गए विवरण की जाँच कर लें। रिकॉर्ड को पोर्टल पर सुरक्षित करने हेतु ऊपर या नीचे दिए गए <strong>&ldquo;Final Submit (अंतिम सबमिट)&rdquo;</strong> बटन पर क्लिक करें।
              </span>
            </div>
            <button
              type="button"
              onClick={handleExecuteFinalSubmit}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Final Submit</span>
            </button>
          </div>
        )}

        {/* Printable Document Body matching exact CCTNS I.I.F. format */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70">
          <div
            ref={printContainerRef}
            id="lost-property-cctns-document"
            className="max-w-[794px] mx-auto bg-white p-8 sm:p-10 shadow-lg border border-slate-300 font-serif text-slate-900 text-[12px] leading-relaxed print:shadow-none print:border-none print:p-6"
            style={{ minHeight: "1123px" }}
          >
            {/* Top Right State Name */}
            <div className="text-right font-bold text-[13px] tracking-wide text-slate-900 mb-2">
              Haryana Police (हरियाणा पुलिस)
            </div>

            {/* Form Header & Box */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex-1 pt-1">
                <div className="text-right sm:text-right pr-6 font-bold text-[13px] uppercase tracking-wider text-slate-800">
                  CCTNS FORM IIF-LP (एकीकृत फॉर्म - खोई संपत्ति)
                </div>

                <div className="text-center pt-2 space-y-0.5">
                  <h1 className="font-bold text-[15px] tracking-tight text-slate-950 uppercase underline decoration-1 underline-offset-4">
                    REGISTRATION OF LOST PROPERTY / ARTICLE
                  </h1>
                  <h2 className="font-bold text-[13px] tracking-tight text-slate-900 uppercase">
                    (COMPLAINT / GENERAL DIARY INTIMATION REPORT)
                  </h2>
                  <div className="font-bold text-[13px] text-slate-900 pt-0.5">
                    खोई संपत्ति / सामान का पंजीकरण
                  </div>
                  <div className="font-semibold text-[12px] text-slate-800">
                    (शिकायत / रोज़नामचा आम सूचना प्रपत्र)
                  </div>
                </div>
              </div>

              {/* Registration Number & QR/Seal Frame on Right side */}
              <div className="shrink-0 flex flex-col items-center ml-4">
                <div className="font-bold text-[12px] mb-1.5 text-slate-950 font-mono">
                  Reg No.(पंजीकरण सं.): {displayRegNumber}
                </div>

                <div className="w-28 h-32 border-2 border-slate-900 bg-slate-50 flex flex-col items-center justify-center p-2 text-center overflow-hidden">
                  <Shield className="w-9 h-9 text-blue-900 mb-1" />
                  <span className="font-bold text-[10px] text-slate-900 block uppercase tracking-tight">
                    HARYANA POLICE
                  </span>
                  <span className="text-[9px] text-slate-600 block font-mono">
                    CCTNS VERIFIED
                  </span>
                  <div className="mt-1 font-mono text-[8px] bg-slate-200 px-1 py-0.5 rounded">
                    GD #{record.gdNumber || "003"}
                  </div>
                </div>
              </div>
            </div>

            {/* 1. State, District, PS, Year, Date Time */}
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 py-2 border-b border-slate-200 text-[12px]">
              <div>
                <span className="font-bold">1. (a) State (राज्य): </span>
                <span className="uppercase">HARYANA</span>
              </div>
              <div>
                <span className="font-bold">(b) District (जिला): </span>
                <span className="uppercase">{record.district || "PANCHKULA"}</span>
              </div>
              <div>
                <span className="font-bold">&nbsp;&nbsp;&nbsp;&nbsp;(c) P.S. (थाना): </span>
                <span className="uppercase">{record.policeStation || "PANCHKULA SECTOR-5"}</span>
              </div>
              <div>
                <span className="font-bold">(d) Year (वर्ष): </span>
                <span className="font-mono">{record.year || "2019"}</span>
              </div>
              <div>
                <span className="font-bold">&nbsp;&nbsp;&nbsp;&nbsp;(e) GD/SD/DD No. (रोज़नामचा सं.): </span>
                <span className="font-mono font-bold text-blue-950">{record.gdNumber || "003"}</span>
              </div>
              <div>
                <span className="font-bold">(f) GD Date &amp; Time (जी.डी. समय): </span>
                <span className="font-mono">{record.gdDateTime || "22/04/2019, 11:33"} hrs</span>
              </div>
            </div>

            {/* 2. Occurrence / Loss Details */}
            <div className="py-2.5 border-b border-slate-200 text-[12px]">
              <div className="font-bold mb-1.5">
                2. Occurrence / Loss Details (घटना व गुमशुदगी विवरण):
              </div>
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 pl-2 text-[11px]">
                <div>
                  <span className="font-bold">Date &amp; Time of Property Missing: </span>
                  <span className="font-mono">{record.dateOfPropertyMissing} {record.timeOfPropertyMissing} hrs</span>
                </div>
                <div>
                  <span className="font-bold">Place Reported Missing (गुमशुदगी का स्थान): </span>
                  <span>{record.placeFromWhereMissing || "Bus stand PKL"}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold">General Diary Brief / Incident Note: </span>
                  <span className="italic">
                    Complainant reported missing/lost article at {record.placeFromWhereMissing || "Bus stand PKL"}. Immediate prompt entered under GD Entry #{record.gdNumber || "003"}.
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Lost Property Details Table */}
            <div className="py-2.5 border-b border-slate-200">
              <div className="font-bold mb-1.5">
                3. Lost Property Particulars (खोई संपत्ति / सामान का विवरण):
              </div>
              <table className="w-full border-collapse border border-slate-400 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-900">
                    <th className="border border-slate-400 px-2.5 py-1.5 text-center w-14">
                      S.No. (क्र.सं.)
                    </th>
                    <th className="border border-slate-400 px-3 py-1.5 text-left">
                      Property Category (श्रेणी)
                    </th>
                    <th className="border border-slate-400 px-3 py-1.5 text-left">
                      Property Sub Type / Item Name (सामान)
                    </th>
                    <th className="border border-slate-400 px-3 py-1.5 text-left">
                      Make, Model &amp; Identification / IMEI No.
                    </th>
                    <th className="border border-slate-400 px-3 py-1.5 text-right w-36">
                      Estimated Lost Value (Rs.)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {record.properties && record.properties.length > 0 ? (
                    record.properties.map((prop, idx) => (
                      <tr key={prop.id || idx}>
                        <td className="border border-slate-400 px-2.5 py-1.5 text-center font-mono">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-400 px-3 py-1.5 font-medium">
                          {prop.category}
                        </td>
                        <td className="border border-slate-400 px-3 py-1.5 font-bold">
                          {prop.subType}
                        </td>
                        <td className="border border-slate-400 px-3 py-1.5 text-[10px]">
                          <div><strong>Make/Brand:</strong> {prop.makeManufacturer || "Samsung"} (Qty: {prop.quantity || 1})</div>
                          {prop.identificationNumbers && prop.identificationNumbers.length > 0 && (
                            <div className="font-mono text-slate-700">
                              <strong>{prop.idType || "IMEI/ID"}:</strong> {prop.identificationNumbers.join(", ")}
                            </div>
                          )}
                          {prop.remarks && (
                            <div className="italic text-slate-600 mt-0.5">{prop.remarks}</div>
                          )}
                        </td>
                        <td className="border border-slate-400 px-3 py-1.5 text-right font-mono font-bold">
                          ₹{Number(prop.estimatedValue || 0).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="border border-slate-400 p-2 text-center text-slate-500 italic">
                        No property items added
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={4} className="border border-slate-400 px-3 py-1.5 text-right uppercase tracking-wider text-[11px]">
                      Total Estimated Lost Value (कुल अनुमानित मूल्य):
                    </td>
                    <td className="border border-slate-400 px-3 py-1.5 text-right font-mono text-[12px] text-blue-950">
                      ₹{totalLostValue.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 4. Complainant Personal Details */}
            <div className="py-2.5 border-b border-slate-200 text-[12px]">
              <div className="font-bold mb-1.5">
                4. Complainant Particulars (शिकायतकर्ता का विवरण):
              </div>
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 pl-2 text-[11px]">
                <div>
                  <span className="font-bold">(a) Full Name (पूरा नाम): </span>
                  <span className="uppercase font-semibold">{complainantFullName}</span>
                </div>
                <div>
                  <span className="font-bold">(b) Relative Name (संबंधी का नाम): </span>
                  <span>{record.relationType || "Father"}: {record.relativeName || "Shyam Singh"}</span>
                </div>
                <div>
                  <span className="font-bold">(c) Gender (लिंग): </span>
                  <span>{record.gender || "Male"}</span>
                </div>
                <div>
                  <span className="font-bold">(d) Occupation (व्यवसाय): </span>
                  <span>{record.occupation || "Private Service"}</span>
                </div>
                <div>
                  <span className="font-bold">(e) UID / Aadhaar No. (पहचान संख्या): </span>
                  <span className="font-mono">{record.uid || "8910-2391-4491"}</span>
                </div>
                <div>
                  <span className="font-bold">(f) Mobile Contact (मोबाइल सं.): </span>
                  <span className="font-mono font-semibold">{record.mobileNumbers?.join(", ") || "+91 9812033441"}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold">(g) Age Details (आयु विवरण): </span>
                  <span>
                    DOB: <strong>{record.dob || "15/08/1994"}</strong> &bull; Birth Year: <strong>{record.yearOfBirth || "1994"}</strong> &bull; Age: <strong>{record.ageYears || "24"} Years {record.ageMonths || "8"} Months</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Complainant Address */}
            <div className="py-2.5 border-b border-slate-200 text-[12px]">
              <div className="font-bold mb-1.5">
                5. Complainant Address (शिकायतकर्ता का पता विवरण):
              </div>
              <div className="grid grid-cols-2 gap-3 pl-2 text-[11px]">
                <div className="border border-slate-300 p-2 rounded bg-slate-50/50">
                  <span className="font-bold block text-[11px] underline mb-1">
                    Present Address (वर्तमान पता):
                  </span>
                  <div>House/Street: {record.presentAddress?.houseNo || "Flat 402, Tower B"}, {record.presentAddress?.streetName || "Old Ropar Road"}</div>
                  <div>Colony/Area: {record.presentAddress?.colony || "Sector 14"}</div>
                  <div>City/Tehsil: {record.presentAddress?.villageTownCity || "PKL"}, {record.presentAddress?.tehsil || "Panchkula"}</div>
                  <div>District/State: <strong>{record.presentAddress?.district || "PANCHKULA"}</strong>, {record.presentAddress?.state || "HARYANA"}</div>
                  <div>Police Station &amp; PIN: {record.presentAddress?.policeStation || "PANCHKULA SECTOR-5"} - <span className="font-mono">{record.presentAddress?.pincode || "134112"}</span></div>
                </div>

                <div className="border border-slate-300 p-2 rounded bg-slate-50/50">
                  <span className="font-bold block text-[11px] underline mb-1">
                    Permanent Address (स्थायी पता):
                  </span>
                  <div>House/Street: {record.permanentAddress?.houseNo || "Flat 402, Tower B"}, {record.permanentAddress?.streetName || "Old Ropar Road"}</div>
                  <div>Colony/Area: {record.permanentAddress?.colony || "Sector 14"}</div>
                  <div>City/Tehsil: {record.permanentAddress?.villageTownCity || "PKL"}, {record.permanentAddress?.tehsil || "Panchkula"}</div>
                  <div>District/State: <strong>{record.permanentAddress?.district || "PANCHKULA"}</strong>, {record.permanentAddress?.state || "HARYANA"}</div>
                  <div>Police Station &amp; PIN: {record.permanentAddress?.policeStation || "PANCHKULA SECTOR-5"} - <span className="font-mono">{record.permanentAddress?.pincode || "134112"}</span></div>
                </div>
              </div>
            </div>

            {/* 6. Details of Enquiry Officer */}
            <div className="py-2.5 border-b border-slate-200 text-[12px]">
              <div className="font-bold mb-1.5">
                6. Details of Enquiry Officer (जांच अधिकारी का विवरण):
              </div>
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 pl-2 text-[11px]">
                <div>
                  <span className="font-bold">Name &amp; Rank of EO: </span>
                  <span className="font-semibold">{record.nameOfEo || "Lalit Kumar (I (Inspector))-53175"}</span>
                </div>
                <div>
                  <span className="font-bold">Designated Rank &amp; PNO: </span>
                  <span>Rank: <strong>{record.eoRank || "I (Inspector)"}</strong> | Number: <strong className="font-mono">{record.eoNumber || "53175"}</strong></span>
                </div>
                <div>
                  <span className="font-bold">Expected Date to Complete Enquiry: </span>
                  <span className="font-mono font-bold text-amber-900">{record.expectedDateToComplete || "24/04/2019"}</span>
                </div>
                <div>
                  <span className="font-bold">CEIR Portal Tracing Status: </span>
                  <span className="text-emerald-700 font-semibold">Initiated for Central Equipment Identity Register</span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold">Enquiry Officer Remarks: </span>
                  <span className="italic">{record.remarks || "Enquiry entrusted to Inspector Lalit Kumar. CDR/Tower dump verification & CEIR portal blocking initiated."}</span>
                </div>
              </div>
            </div>

            {/* 7. Signatures & Official Seal (matching UIDB/UD) */}
            <div className="pt-8 grid grid-cols-3 gap-4 text-center text-[11px]">
              <div>
                <div className="h-12 flex items-end justify-center">
                  <span className="font-script text-base text-slate-700 italic">
                    {record.firstName || "raju"}
                  </span>
                </div>
                <div className="border-t border-slate-900 pt-1 font-bold">
                  Signature of Complainant
                </div>
                <div className="text-[10px] text-slate-600">
                  (शिकायतकर्ता के हस्ताक्षर)
                </div>
              </div>

              <div>
                <div className="h-12 flex items-end justify-center">
                  <span className="font-script text-base text-slate-700 italic">
                    {record.eoRank || "Inspector"} {record.eoNumber || "53175"}
                  </span>
                </div>
                <div className="border-t border-slate-900 pt-1 font-bold">
                  Signature of Enquiry Officer
                </div>
                <div className="text-[10px] text-slate-600">
                  {record.nameOfEo || "Lalit Kumar (Inspector) - 53175"}
                </div>
              </div>

              <div>
                <div className="h-12 flex items-end justify-center">
                  <span className="text-[10px] font-mono text-slate-400">
                    [ Official Police Seal ]
                  </span>
                </div>
                <div className="border-t border-slate-900 pt-1 font-bold">
                  Signature &amp; Stamp of SHO
                </div>
                <div className="text-[10px] text-slate-600">
                  Police Station: {record.policeStation || "PANCHKULA SECTOR-5"}
                </div>
              </div>
            </div>

            {/* Statutory Disclaimer & Footer note */}
            <div className="mt-8 pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-500 text-center font-sans">
              * Note: This is an official system generated statutory intimation report under CCTNS Project, Haryana Police. Valid for official inquiries, telecommunication verification (CEIR / SIM reissue), and insurance claims as prescribed by law.
              <br />
              Generated via computerized Haryana Police Case Management System (CCTNS IIF-LP Compliant) &bull; Date of Generation: {new Date().toLocaleDateString("en-IN")}
            </div>
          </div>
        </div>

        {/* Bottom Actions Footer for Final Submission (matching UIDB/UD) */}
        {effectiveIsPending && (
          <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0 text-white">
            <div className="text-[11px] text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>
                <strong>&ldquo;Final Submit&rdquo;</strong> पर क्लिक करने पर यह प्रविष्टि Lost Property रजिस्टर में आधिकारिक पंजीकरण संख्या (Reg No: {displayRegNumber}) सहित दर्ज हो जाएगी।
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onBackToEdit && (
                <button
                  type="button"
                  onClick={onBackToEdit}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Edit Form (सुधार करें)</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleExecuteFinalSubmit}
                className="inline-flex items-center gap-1.5 px-5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-colors"
              >
                <CheckCircle className="w-4 h-4 text-white" />
                <span>Final Submit (अंतिम सबमिट करें)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
