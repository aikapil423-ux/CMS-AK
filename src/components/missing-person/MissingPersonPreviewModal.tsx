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
  User,
  AlertTriangle,
} from "lucide-react";
import { MissingPersonRecord } from "@/types/missingPerson";
import { missingPersonService } from "@/services/missingPersonService";
import { printA4Element } from "@/utils/printElement";

interface MissingPersonPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: Partial<MissingPersonRecord>;
  isNewRecord?: boolean;
  onFinalSubmit?: (savedRecord: MissingPersonRecord) => void;
  isPendingFinalSubmit?: boolean;
  onBackToEdit?: () => void;
}

export const MissingPersonPreviewModal: React.FC<MissingPersonPreviewModalProps> = ({
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

  const displayRegNumber =
    record.registrationNumber ||
    (record.registrationYear ? `0002/${record.registrationYear}` : "0002/2019");

  const handlePrint = () => {
    if (printContainerRef.current) {
      const regSanitized = displayRegNumber.replace(/[\/\\]/g, "_");
      printA4Element(
        printContainerRef.current,
        `MISSING_PERSON_${regSanitized}_CCTNS_SLIP`
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
      const saved = missingPersonService.saveRecord(record);
      if (onFinalSubmit) {
        onFinalSubmit(saved);
      }
      alert(
        `Missing Person Registration No. ${saved.registrationNumber} has been successfully registered!\n\nलापता व्यक्ति पंजीकरण सं. ${saved.registrationNumber} पोर्टल पर दर्ज कर लिया गया है।`
      );
      onClose();
    } catch (e: any) {
      alert("Error saving Missing Person registration: " + (e?.message || e));
    }
  };

  const missingPersonFullName = [
    record.firstName,
    record.middleName,
    record.lastName,
  ]
    .filter(Boolean)
    .join(" ") || "Monu Kumar";

  const complainantFullName = [
    record.complainantFirstName,
    record.complainantMiddleName,
    record.complainantLastName,
  ]
    .filter(Boolean)
    .join(" ") || "RAVI Kumar";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-2xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in-50">
        {/* Top Control Bar (matching UIDB/UD format) */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <div>
              <span className="font-bold text-xs sm:text-sm tracking-tight">
                CCTNS Form I.I.F.-MP — Registration of Missing Person (लापता व्यक्ति का पंजीकरण)
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Reg No: {displayRegNumber} &bull; GD No: {record.gdNumber || "002"} &bull; PS {record.policeStation || "PANCHKULA SECTOR-5"}
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
                title="Final Submit & Save to Missing Person Register"
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
                <strong>प्रपत्र पूर्वावलोकन (Missing Person Preview):</strong> कृपया भरे गए विवरण की जाँच कर लें। रिकॉर्ड को पोर्टल पर सुरक्षित करने हेतु ऊपर या नीचे दिए गए <strong>&ldquo;Final Submit (अंतिम सबमिट)&rdquo;</strong> बटन पर क्लिक करें।
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
            id="missing-person-cctns-document"
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
                  I.I.F.-MP (एकीकृत जाँच फॉर्म - गुमशुदा व्यक्ति)
                </div>

                <div className="text-center pt-2 space-y-0.5">
                  <h1 className="font-bold text-[15px] tracking-tight text-slate-950 uppercase underline decoration-1 underline-offset-4">
                    REGISTRATION OF MISSING PERSON
                  </h1>
                  <h2 className="font-bold text-[13px] tracking-tight text-slate-900 uppercase">
                    (COMPLAINT / GENERAL DIARY INTIMATION REPORT)
                  </h2>
                  <div className="font-bold text-[13px] text-slate-900 pt-0.5">
                    लापता / गुमशुदा व्यक्ति का पंजीकरण
                  </div>
                  <div className="font-semibold text-[12px] text-slate-800">
                    (शिकायत / रोज़नामचा आम सूचना प्रपत्र)
                  </div>
                </div>
              </div>

              {/* Reg Number & Photo Frame on Right side */}
              <div className="shrink-0 flex flex-col items-center ml-4">
                <div className="font-bold text-[12px] mb-1.5 text-slate-950 font-mono">
                  MP Reg No: {displayRegNumber}
                </div>

                <div className="w-28 h-32 border-2 border-slate-900 bg-slate-50 flex flex-col items-center justify-center p-1 text-center overflow-hidden">
                  {record.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={record.photoUrl}
                      alt="Missing Person Photo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="space-y-1">
                      <div className="w-8 h-8 rounded-full border border-dashed border-slate-400 mx-auto flex items-center justify-center text-slate-400 text-xs">
                        📷
                      </div>
                      <span className="font-bold text-[11px] text-slate-700 block">
                        Photo/चित्र
                      </span>
                      <span className="text-[9px] text-slate-400 block font-mono">
                        {missingPersonFullName}
                      </span>
                    </div>
                  )}
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
                <span className="font-mono">{record.registrationYear || "2019"}</span>
              </div>
              <div>
                <span className="font-bold">&nbsp;&nbsp;&nbsp;&nbsp;(e) GD/SD/DD No. (रोज़नामचा सं.): </span>
                <span className="font-mono font-bold text-blue-950">{record.gdNumber || "002"}</span>
              </div>
              <div>
                <span className="font-bold">(f) GD Date &amp; Time (जी.डी. समय): </span>
                <span className="font-mono">{record.gdDateTime || "19/04/2019, 10:45"} hrs</span>
              </div>
            </div>

            {/* 2. Occurrence / Loss Details */}
            <div className="py-2.5 border-b border-slate-200 text-[12px]">
              <div className="font-bold mb-1.5">
                2. Occurrence / Missing Details (गुमशुदगी घटना विवरण):
              </div>
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 pl-2 text-[11px]">
                <div>
                  <span className="font-bold">Date &amp; Time since Missing: </span>
                  <span className="font-mono">{record.dateSinceMissing} {record.timeSinceMissing} hrs</span>
                </div>
                <div>
                  <span className="font-bold">Place of Missing (गुमशुदगी का स्थान): </span>
                  <span className="font-semibold">{record.placeOfMissing || "Panchkula bus stand"}</span>
                </div>
                <div>
                  <span className="font-bold">Linked FIR No. (संबंधित प्राथमिकी): </span>
                  <span className="font-mono">{record.firNumber ? `${record.firNumber}/${record.firYear}` : "Not Linked"}</span>
                </div>
                <div>
                  <span className="font-bold">Date of Registration: </span>
                  <span className="font-mono">{record.registrationDateTime || "19/04/2019 15:19"} hrs</span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold">Brief of Incident (घटना का संक्षिप्त विवरण): </span>
                  <span className="italic">{record.briefOfIncident || "Missing Person"}</span>
                </div>
              </div>
            </div>

            {/* 3. Acts & Sections Table */}
            {record.actsSections && record.actsSections.length > 0 && (
              <div className="py-2.5 border-b border-slate-200">
                <div className="font-bold mb-1.5">
                  3. Acts &amp; Sections of Law (अधिनियम व धाराएँ):
                </div>
                <table className="w-full border-collapse border border-slate-400 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900">
                      <th className="border border-slate-400 px-3 py-1 text-center w-16">
                        S.No.
                      </th>
                      <th className="border border-slate-400 px-3 py-1 text-left">
                        Acts (अधिनियम)
                      </th>
                      <th className="border border-slate-400 px-3 py-1 text-left w-48">
                        Sections (धाराएँ)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.actsSections.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="border border-slate-400 px-3 py-1 text-center font-mono">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-400 px-3 py-1 font-medium">
                          {item.act}
                        </td>
                        <td className="border border-slate-400 px-3 py-1 font-mono font-bold">
                          {item.section}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. Missing Person Particulars */}
            <div className="py-2.5 border-b border-slate-200 text-[12px]">
              <div className="font-bold mb-1.5">
                4. Missing Person Details (लापता व्यक्ति का व्यक्तिगत विवरण):
              </div>
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 pl-2 text-[11px]">
                <div>
                  <span className="font-bold">(a) Full Name (पूरा नाम): </span>
                  <span className="uppercase font-bold text-blue-950">{missingPersonFullName}</span>
                </div>
                <div>
                  <span className="font-bold">(b) Relative Name (संबंधी का नाम): </span>
                  <span>{record.relationType || "Father"}: {record.relativeName || "Shyam"}</span>
                </div>
                <div>
                  <span className="font-bold">(c) Alias / Nickname: </span>
                  <span>{record.alias || "Chhotu"}</span>
                </div>
                <div>
                  <span className="font-bold">(d) Gender &amp; Classification: </span>
                  <span>{record.gender || "Male"} &bull; {record.majorMinor || "Major"}</span>
                </div>
                <div>
                  <span className="font-bold">(e) UID / Aadhaar No.: </span>
                  <span className="font-mono">{record.uid || "7719-2810-4412"}</span>
                </div>
                <div>
                  <span className="font-bold">(f) Mobile / Contact: </span>
                  <span className="font-mono">{record.mobileNo || "+91 9416088219"}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold">(g) Age Details: </span>
                  <span>
                    DOB: <strong>{record.dob || "02/12/1990"}</strong> &bull; Birth Year: <strong>{record.yearOfBirth || "1990"}</strong> &bull; Age: <strong>{record.ageYears || "28"} Years {record.ageMonths || "4"} Months</strong>
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold">(h) Present &amp; Permanent Address: </span>
                  <span>
                    {record.presentAddress?.houseNo && `${record.presentAddress.houseNo}, `}
                    {record.presentAddress?.streetName && `${record.presentAddress.streetName}, `}
                    {record.presentAddress?.colony && `${record.presentAddress.colony}, `}
                    {record.presentAddress?.villageTownCity || "pkl"}, {record.presentAddress?.tehsil || "Panchkula"}, Distt: {record.presentAddress?.district || "PANCHKULA"}, State: {record.presentAddress?.state || "HARYANA"} - {record.presentAddress?.pincode || "134109"}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Physical Description of Missing Person */}
            <div className="py-2.5 border-b border-slate-200 text-[12px]">
              <div className="font-bold mb-1.5">
                5. Physical Description &amp; Appearance (शारीरिक हुलिया व पहचान चिन्ह):
              </div>
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 pl-2 text-[11px]">
                <div>
                  <span className="font-bold">Height (कद): </span>
                  <span>{record.heightFeet || "5"}&apos; {record.heightInches || "7"}&quot;</span>
                </div>
                <div>
                  <span className="font-bold">Complexion &amp; Build: </span>
                  <span>{record.complexion || "Wheatish"} &bull; {record.build || "Medium"}</span>
                </div>
                <div>
                  <span className="font-bold">Face &amp; Hair: </span>
                  <span>{record.faceType || "Round"} &bull; Hair: {record.hairColor || "Black"}</span>
                </div>
                <div>
                  <span className="font-bold">Languages Spoken: </span>
                  <span>{record.languagesKnown || "Hindi, Punjabi"}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold">Identifying Marks / Tattoos (पहचान चिन्ह): </span>
                  <span className="font-semibold">{record.identifyingMarks || "Mole on right cheek, small burn scar on left forearm"}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold">Clothing Details when Missing (पहने हुए कपड़े): </span>
                  <span>{record.clothingDetails || "Blue checked shirt, dark jeans, white sneakers"}</span>
                </div>
                {record.habitsEccentricities && (
                  <div className="col-span-2">
                    <span className="font-bold">Habits / Demeanor: </span>
                    <span className="italic">{record.habitsEccentricities}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 6. Complainant Information */}
            <div className="py-2.5 border-b border-slate-200 text-[12px]">
              <div className="font-bold mb-1.5">
                6. Complainant / Informant Particulars (शिकायतकर्ता / सूचनादाता विवरण):
              </div>
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 pl-2 text-[11px]">
                <div>
                  <span className="font-bold">Full Name (नाम): </span>
                  <span className="font-semibold uppercase">{complainantFullName}</span>
                </div>
                <div>
                  <span className="font-bold">Relative Name: </span>
                  <span>{record.complainantRelationType || "Father"}: {record.complainantRelativeName || "Shyam"}</span>
                </div>
                <div>
                  <span className="font-bold">Gender: </span>
                  <span>{record.complainantGender || "Male"}</span>
                </div>
                <div>
                  <span className="font-bold">Mobile Contact: </span>
                  <span className="font-mono font-semibold">{record.complainantMobile || "+91 9812033441"}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold">Address: </span>
                  <span>
                    {record.complainantPresentAddress?.houseNo && `${record.complainantPresentAddress.houseNo}, `}
                    {record.complainantPresentAddress?.villageTownCity || "pkl"}, {record.complainantPresentAddress?.district || "PANCHKULA"}, {record.complainantPresentAddress?.state || "HARYANA"}
                  </span>
                </div>
                {record.complainantIdList && record.complainantIdList.length > 0 && (
                  <div className="col-span-2">
                    <span className="font-bold">Identity Documents: </span>
                    <span className="font-mono">
                      {record.complainantIdList.map((d) => `${d.idType}: ${d.idNumber}`).join(" | ")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 7. Details of Enquiry Officer */}
            <div className="py-2.5 border-b border-slate-200 text-[12px]">
              <div className="font-bold mb-1.5">
                7. Details of Enquiry / Investigating Officer (जांच अधिकारी विवरण):
              </div>
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 pl-2 text-[11px]">
                <div>
                  <span className="font-bold">Name &amp; Designation: </span>
                  <span className="font-semibold">{record.nameOfEo || "ASI Sandeep Singh - 49102"}</span>
                </div>
                <div>
                  <span className="font-bold">Rank &amp; Belt/PNO: </span>
                  <span>{record.eoRank || "Assistant Sub Inspector"} &bull; {record.eoNumber || "49102"}</span>
                </div>
                <div>
                  <span className="font-bold">Expected Completion Date: </span>
                  <span className="font-mono font-bold text-amber-900">{record.expectedDateToComplete || "26/04/2019"}</span>
                </div>
                <div>
                  <span className="font-bold">Action Taken: </span>
                  <span className="text-emerald-700 font-semibold">WT Flash dispatched &bull; Circular issued</span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold">Officer Remarks: </span>
                  <span className="italic">{record.remarks || "WT message flashed to all police stations in Haryana and Chandigarh."}</span>
                </div>
              </div>
            </div>

            {/* 8. Signatures & Official Seal (matching UIDB/UD) */}
            <div className="pt-8 grid grid-cols-3 gap-4 text-center text-[11px]">
              <div>
                <div className="h-12 flex items-end justify-center">
                  <span className="font-script text-base text-slate-700 italic">
                    {record.complainantFirstName || "RAVI"}
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
                    {record.eoRank || "ASI"} {record.eoNumber || "49102"}
                  </span>
                </div>
                <div className="border-t border-slate-900 pt-1 font-bold">
                  Signature of Enquiry Officer
                </div>
                <div className="text-[10px] text-slate-600">
                  {record.nameOfEo || "ASI Sandeep Singh - 49102"}
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

            {/* Statutory Disclaimer & Footer */}
            <div className="mt-8 pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-500 text-center font-sans">
              * Statutory Missing Person Intimation Record generated via Haryana Police CCTNS System. Valid for inter-district alerts, railway police circulars, and SCRB publication.
              <br />
              Generated via computerized Haryana Police Case Management System (CCTNS IIF-MP Compliant) &bull; Date of Generation: {new Date().toLocaleDateString("en-IN")}
            </div>
          </div>
        </div>

        {/* Bottom Actions Footer for Final Submission (matching UIDB/UD) */}
        {effectiveIsPending && (
          <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0 text-white">
            <div className="text-[11px] text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>
                <strong>&ldquo;Final Submit&rdquo;</strong> पर क्लिक करने पर यह प्रविष्टि Missing Person रजिस्टर में आधिकारिक पंजीकरण संख्या (Reg No: {displayRegNumber}) सहित दर्ज हो जाएगी।
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
