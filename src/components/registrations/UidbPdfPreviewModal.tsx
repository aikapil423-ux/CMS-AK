"use client";

import React, { useRef } from "react";
import { X, Printer, Download, FileText, CheckCircle, CheckCircle2, Edit2, ArrowLeft } from "lucide-react";
import { UidbFormData } from "@/types/uidb";
import { printA4Element } from "@/utils/printElement";

interface UidbPdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: UidbFormData;
  onFinalSubmit?: (data: UidbFormData) => void;
  isPendingFinalSubmit?: boolean;
  onBackToEdit?: () => void;
}

export function UidbPdfPreviewModal({
  isOpen,
  onClose,
  data,
  onFinalSubmit,
  isPendingFinalSubmit,
  onBackToEdit,
}: UidbPdfPreviewModalProps) {
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (printContainerRef.current) {
      printA4Element(printContainerRef.current, `UIDB_${data.regNumber.replace(/[\/\\]/g, "_")}_IIF_X`);
    } else {
      window.print();
    }
  };

  const handleDownload = () => {
    handlePrint();
  };

  // Find front-view photo or any uploaded photo
  const frontPhoto =
    data.photos?.find((p) => p.fileSubType === "Front View" && p.dataUrl) ||
    data.photos?.find((p) => Boolean(p.dataUrl)) ||
    ((data as any).photoUrl ? { dataUrl: (data as any).photoUrl } : undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-2xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in-50">
        {/* Top Control Bar */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <div>
              <span className="font-bold text-xs sm:text-sm tracking-tight">
                I.I.F.-X — Registration of Unidentified Dead Body (अज्ञात शव का पंजीकरण)
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                UD No: {data.regNumber || "Pending"} • Sec 194 BNSS / 174 CrPC
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPendingFinalSubmit && onBackToEdit && (
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

            {isPendingFinalSubmit && onFinalSubmit && (
              <button
                type="button"
                onClick={() => onFinalSubmit(data)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer ring-2 ring-emerald-400/40"
                title="Final Submit & Save to Registration List"
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

        {/* Informative Preview Banner when awaiting final submission */}
        {isPendingFinalSubmit && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 bg-amber-50 shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>प्रपत्र पूर्वावलोकन (I.I.F.-X Preview):</strong> कृपया भरे गए विवरण की जाँच कर लें। रिकॉर्ड को पोर्टल पर सुरक्षित करने हेतु ऊपर या नीचे दिए गए <strong>&ldquo;Final Submit (अंतिम सबमिट)&rdquo;</strong> बटन पर क्लिक करें।
              </span>
            </div>
            {onFinalSubmit && (
              <button
                type="button"
                onClick={() => onFinalSubmit(data)}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Final Submit</span>
              </button>
            )}
          </div>
        )}

        {/* Printable Document Body matching exact CCTNS I.I.F.-X format */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70">
          <div
            ref={printContainerRef}
            id="uidb-iif-x-document"
            className="max-w-[794px] mx-auto bg-white p-8 sm:p-10 shadow-lg border border-slate-300 font-serif text-slate-900 text-[12px] leading-relaxed print:shadow-none print:border-none print:p-6"
            style={{ minHeight: "1123px" }}
          >
            {/* Top Right State Name */}
            <div className="text-right font-bold text-[13px] tracking-wide text-slate-900 mb-2">
              Haryana Police (हरियाणा पुलिस)
            </div>

            {/* IIF Form Header & Box */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex-1 pt-1">
                <div className="text-right sm:text-right pr-6 font-bold text-[13px] uppercase tracking-wider text-slate-800">
                  I.I.F.-X (एकीकृत जाँच फॉर्म-X)
                </div>

                <div className="text-center pt-2 space-y-0.5">
                  <h1 className="font-bold text-[15px] tracking-tight text-slate-950 uppercase underline decoration-1 underline-offset-4">
                    REGISTRATION OF UNIDENTIFIED DEAD BODY
                  </h1>
                  <h2 className="font-bold text-[13px] tracking-tight text-slate-900 uppercase">
                    (UNDER SECTION 174 CRPC / SECTION 194 BNSS)
                  </h2>
                  <div className="font-bold text-[13px] text-slate-900 pt-0.5">
                    अज्ञात शव का पंजीकरण
                  </div>
                  <div className="font-semibold text-[12px] text-slate-800">
                    (अंतर्गत धारा 174 दंड प्रक्रिया संहिता / धारा 194 BNSS)
                  </div>
                </div>
              </div>

              {/* UD Number & Photo Frame on Right side */}
              <div className="shrink-0 flex flex-col items-center ml-4">
                <div className="font-bold text-[12px] mb-1.5 text-slate-950 font-mono">
                  UD No.(अज्ञात शव सं.): {data.regNumber}
                </div>

                <div className="w-28 h-32 border-2 border-slate-900 bg-slate-50 flex flex-col items-center justify-center p-1 text-center overflow-hidden">
                  {frontPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={frontPhoto.dataUrl}
                      alt="Deceased Photo"
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
                      <span className="text-[9px] text-slate-400 block">
                        (Front View)
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
                <span className="uppercase">{data.state || "HARYANA"}</span>
              </div>
              <div>
                <span className="font-bold">(b) District (जिला): </span>
                <span className="uppercase">{data.district || "PANCHKULA"}</span>
              </div>
              <div>
                <span className="font-bold">&nbsp;&nbsp;&nbsp;&nbsp;(c) P.S. (थाना): </span>
                <span className="uppercase">{data.stationName || "PANCHKULA SECTOR-5"}</span>
              </div>
              <div>
                <span className="font-bold">(d) Year (वर्ष): </span>
                <span className="font-mono">{data.year || new Date().getFullYear()}</span>
              </div>
              <div className="col-span-2">
                <span className="font-bold">&nbsp;&nbsp;&nbsp;&nbsp;(e) Date &amp; Time (दिनांक और समय): </span>
                <span className="font-mono">{data.date} {data.time} hrs</span>
              </div>
            </div>

            {/* 2. Acts & Sections of Law */}
            <div className="py-2.5 border-b border-slate-200">
              <div className="font-bold mb-1.5">
                2. Acts &amp; Sections of Law (कानून के अधिनियम और धाराएँ):
              </div>
              <table className="w-full border-collapse border border-slate-400 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-900">
                    <th className="border border-slate-400 px-3 py-1 text-center w-16">
                      S.No. (क्र.सं.)
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
                  <tr>
                    <td className="border border-slate-400 px-3 py-1 text-center font-mono">1</td>
                    <td className="border border-slate-400 px-3 py-1">
                      Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023 / Cr.P.C. 1973
                    </td>
                    <td className="border border-slate-400 px-3 py-1 font-mono font-bold">
                      194 BNSS / 174 Cr.P.C.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 3. GD Information */}
            <div className="py-2.5 border-b border-slate-200 space-y-1.5 text-[12px]">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-bold">3. (a) G.D. No. (रोजनामचा सं.): </span>
                  <span className="font-mono font-bold">{data.gdNumber || "007"}</span>
                </div>
                <div>
                  <span className="font-bold">(b) G.D. Date &amp; Time (रोजनामचा दिनांक व समय): </span>
                  <span className="font-mono">{data.gdDateTime || "22/04/2019 15:16 hrs"}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-bold">&nbsp;&nbsp;&nbsp;&nbsp;(c) Date &amp; Time of Information (सूचना का दिनांक और समय): </span>
                  <span className="font-mono">{data.dateTimeOfInformation || data.gdDateTime || "—"}</span>
                </div>
                <div>
                  <span className="font-bold">(d) Source of Information (सूचना का स्रोत): </span>
                  <span>{data.sourceOfInformation || "Citizen/General Public"}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-bold">&nbsp;&nbsp;&nbsp;&nbsp;(e) Mode of Information (सूचना का माध्यम): </span>
                  <span>{data.modeOfInformation || "By Phone"}</span>
                </div>
                <div>
                  <span className="font-bold">(f) Inquest Prepared By: </span>
                  <span className="font-semibold">{data.inquestReportPreparedBy || "Lalit Kumar"}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-bold">&nbsp;&nbsp;&nbsp;&nbsp;(g) Body Type: </span>
                  <span className="font-bold uppercase">{data.bodyType}</span>
                </div>
                <div>
                  <span className="font-bold">(h) Case Type: </span>
                  <span>{data.caseType || "Death due to Accident"}</span>
                </div>
              </div>
              {data.briefOfIncident && (
                <div className="pt-1">
                  <span className="font-bold">&nbsp;&nbsp;&nbsp;&nbsp;(i) Brief of Incident (घटना का संक्षिप्त विवरण): </span>
                  <span className="italic">{data.briefOfIncident}</span>
                </div>
              )}
            </div>

            {/* 4. Place Where Body was Found */}
            <div className="py-2.5 border-b border-slate-200 space-y-1 text-[12px]">
              <div className="font-bold">
                4. Place Where Body was Found Details (शव मिलने का स्थान विवरण):
              </div>
              <div className="pl-4 space-y-1">
                <div>
                  <span className="font-bold">Location (स्थान): </span>
                  <span>{data.placeWhereFound || "—"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="font-bold">Distance from P.S. (थाने से दूरी): </span>
                    <span className="font-mono font-bold">{data.distanceFromPsKm || "4"} Km</span>
                  </div>
                  <div>
                    <span className="font-bold">Direction from P.S. (दिशा): </span>
                    <span className="font-bold">{data.directionFromPs || "NORTH-EAST"}</span>
                  </div>
                  <div>
                    <span className="font-bold">Date &amp; Time when Found: </span>
                    <span className="font-mono">{data.dateTimeWhenFound || data.gdDateTime || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Informant Details */}
            <div className="py-2.5 border-b border-slate-200 space-y-1 text-[12px]">
              <div className="font-bold">
                5. Informant Information (सूचनाकर्ता का विवरण):
              </div>
              <div className="pl-4 grid grid-cols-2 gap-2">
                <div>
                  <span className="font-bold">Name (नाम): </span>
                  <span className="font-bold uppercase">
                    {[data.informantFirstName, data.informantMiddleName, data.informantLastName]
                      .filter(Boolean)
                      .join(" ") || "RAJNISH KUMAR"}
                  </span>
                </div>
                <div>
                  <span className="font-bold">Relative / Relation: </span>
                  <span>
                    {data.informantRelativeName || "Sh. Rameshwar"} ({data.informantRelationType || "Citizen"})
                  </span>
                </div>
                <div>
                  <span className="font-bold">Mobile No. (मोबाइल नं.): </span>
                  <span className="font-mono">+91-{data.informantMobile || "9812034567"}</span>
                </div>
                <div>
                  <span className="font-bold">Nationality: </span>
                  <span>{data.informantNationality || "INDIA"}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold">Present Address (वर्तमान पता): </span>
                  <span>
                    {[
                      data.presentHouseNo && `H.No. ${data.presentHouseNo}`,
                      data.presentStreet,
                      data.presentColony,
                      data.presentCity,
                      data.presentTehsil,
                      data.presentDistrict && `Distt: ${data.presentDistrict}`,
                      data.presentPincode && `Pin: ${data.presentPincode}`,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Sector 5, Panchkula, Haryana"}
                  </span>
                </div>
                {data.informantIds && data.informantIds.length > 0 && (
                  <div className="col-span-2">
                    <span className="font-bold">Identity Proof (पहचान प्रमाण): </span>
                    <span className="font-mono">
                      {data.informantIds.map((id) => `${id.idType}: ${id.idNo}`).join(" | ")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 6. Physical Description */}
            <div className="py-2.5 border-b border-slate-200 space-y-1 text-[12px]">
              <div className="font-bold">
                6. Deceased Person Information / Physical Description (मृतक का शारीरिक विवरण):
              </div>
              <div className="pl-4 grid grid-cols-3 gap-2">
                <div>
                  <span className="font-bold">Gender (लिंग): </span>
                  <span className="font-bold">{data.gender || "Male"}</span>
                </div>
                <div>
                  <span className="font-bold">Approx. Age (अनुमानित आयु): </span>
                  <span className="font-mono">{data.ageYears || "32"} Yrs (Range: {data.ageRangeFrom || "30"} - {data.ageRangeTo || "35"} Yrs)</span>
                </div>
                <div>
                  <span className="font-bold">Height Range (कद): </span>
                  <span className="font-mono">
                    {data.heightFeetFrom || "5"}&apos;{data.heightInchesFrom || "7"}&quot; - {data.heightFeetTo || "5"}&apos;{data.heightInchesTo || "9"}&quot; ({data.heightCmsFrom || "170"}-{data.heightCmsTo || "175"} cm)
                  </span>
                </div>
                <div>
                  <span className="font-bold">Body Build (बनावट): </span>
                  <span>{data.bodyBuildType || "Medium"}</span>
                </div>
                <div>
                  <span className="font-bold">Complexion (रंग): </span>
                  <span>{data.bodyComplexionType || "Wheatish"}</span>
                </div>
                <div>
                  <span className="font-bold">Hair (बाल): </span>
                  <span>{data.hairColor || "Black"}, {data.hairType || "Straight"}</span>
                </div>
                <div>
                  <span className="font-bold">Face &amp; Eyes: </span>
                  <span>{data.faceType || "Oval"} face, {data.eyesColor || "Black"} eyes</span>
                </div>
                <div>
                  <span className="font-bold">Beard &amp; Moustache: </span>
                  <span>{data.beard || "Clean Shaven"} / {data.moustaches || "Small Trimmed"}</span>
                </div>
                <div>
                  <span className="font-bold">Blood Group: </span>
                  <span className="font-mono">{data.marksBloodGroup || "B+"}</span>
                </div>
              </div>

              <div className="pl-4 pt-1 space-y-1">
                <div>
                  <span className="font-bold">Clothes Worn (पहने हुए कपड़े): </span>
                  <span>
                    Top: {data.clothesOuterTop || "Blue Shirt"} | Bottom: {data.clothesOuterBottom || "Black Denim Jeans"} | Footwear: {data.clothesFootwear || "Brown Leather Shoes"}
                  </span>
                </div>
                <div>
                  <span className="font-bold">Identification Marks / Tattoos (पहचान चिन्ह व टैटू): </span>
                  <span className="font-semibold text-slate-900">
                    {[data.marksTattooMarks, data.marksScarMarks, data.marksMoles, data.marksOthers]
                      .filter(Boolean)
                      .join("; ") || "OM tattoo on right forearm, old scar on left knee."}
                  </span>
                </div>
              </div>
            </div>

            {/* 7. Dead Body Details & Condition */}
            <div className="py-2.5 border-b border-slate-200 space-y-1 text-[12px]">
              <div className="font-bold">
                7. Dead Body Physical Condition &amp; Inquest Findings (शव की स्थिति व जाँच विवरण):
              </div>
              <div className="pl-4 grid grid-cols-2 gap-2">
                <div>
                  <span className="font-bold">Condition of Body (शव की स्थिति): </span>
                  <span className="font-bold">{data.conditionOfDeadBody || "Normal Condition"}</span>
                </div>
                <div>
                  <span className="font-bold">Probable Cause of Death: </span>
                  <span>{data.probableCauseOfDeath || "Accidental head injury"}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold">Injuries / Violence Marks: </span>
                  <span>{data.detailOfInjuries || "Crush injury on frontal skull, abrasions on right shoulder."}</span>
                </div>
                <div>
                  <span className="font-bold">Probable Weapon Used: </span>
                  <span>{data.probableWeapon || "Vehicular collision impact"}</span>
                </div>
                <div>
                  <span className="font-bold">Finger Tips Preserved: </span>
                  <span className="font-bold font-mono">{data.fingerTipsPreserved || "Yes"}</span>
                </div>
                <div>
                  <span className="font-bold">Strangulation Evidence on Neck: </span>
                  <span className="font-mono">{data.markOnNeckStrangulation || "No"}</span>
                </div>
                <div>
                  <span className="font-bold">Suicide Conditions: </span>
                  <span className="font-mono">{data.conditionsEvidencingSuicide || "No"}</span>
                </div>
                <div>
                  <span className="font-bold">Request to Waive Post-Mortem: </span>
                  <span>{data.requestToWaivePostMortem || "No"}</span>
                </div>
                <div>
                  <span className="font-bold">Blood / Stain Details: </span>
                  <span>{data.detailOfBloodOnBody || "Dried blood near nasal cavity"}</span>
                </div>
              </div>
            </div>

            {/* 8. Unnatural Death Details */}
            <div className="py-2.5 border-b border-slate-200 space-y-1 text-[12px]">
              <div className="font-bold">
                8. Unnatural Death Investigation Details (अस्वाभाविक मृत्यु विवरण):
              </div>
              <div className="pl-4 grid grid-cols-2 gap-2">
                <div>
                  <span className="font-bold">Position of Limbs / Eyes: </span>
                  <span>{data.positionOfLimb || "Legs straight"}, {data.positionOfEyes || "semi-open"}</span>
                </div>
                <div>
                  <span className="font-bold">DNA / FSL Examination Samples: </span>
                  <span className="font-bold">{data.samplesCollectedDnaFsl || "Yes"}</span>
                </div>
                <div>
                  <span className="font-bold">Custodial / Dowry Death: </span>
                  <span>{data.isCustodialDowryDeath || "No"}</span>
                </div>
                <div>
                  <span className="font-bold">Articles Found Near Body: </span>
                  <span>{data.articleFoundInHandOrBody || data.otherEvidenceFound || "None"}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold">Circumstances / Rumours: </span>
                  <span className="italic">{data.circumstancesSuicideRumours || "Hit and run road accidental trauma."}</span>
                </div>
              </div>
            </div>

            {/* 9. Signatures & Official Seal */}
            <div className="pt-8 grid grid-cols-2 gap-4 text-center text-[11px]">
              <div>
                <div className="h-12 flex items-end justify-center">
                  <span className="font-script text-base text-slate-700 italic">
                    {data.officerName?.split(" ")[0] || "Lalit Kumar"}
                  </span>
                </div>
                <div className="border-t border-slate-900 pt-1 font-bold">
                  Signature of Investigating / Inquest Officer
                </div>
                <div className="text-[10px] text-slate-600">
                  {data.officerName || "Lalit Kumar (Inspector) - 53175"}
                </div>
              </div>

              <div>
                <div className="h-12 flex items-end justify-center">
                  <span className="text-[10px] font-mono text-slate-400">
                    [ Official Police Seal ]
                  </span>
                </div>
                <div className="border-t border-slate-900 pt-1 font-bold">
                  Signature &amp; Stamp of Station House Officer (SHO)
                </div>
                <div className="text-[10px] text-slate-600">
                  Police Station: {data.stationName || "Panchkula Sector-5"}
                </div>
              </div>
            </div>

            {/* Footer note */}
            <div className="mt-8 pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-500 text-center font-sans">
              Generated via computerized Haryana Police Case Management System (CCTNS IIF-X Compliant) • Date of Generation: {new Date().toLocaleDateString("en-IN")}
            </div>
          </div>
        </div>

        {/* Bottom Actions Footer for Final Submission */}
        {isPendingFinalSubmit && (
          <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0 text-white">
            <div className="text-[11px] text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>
                <strong>&ldquo;Final Submit&rdquo;</strong> पर क्लिक करने पर यह प्रविष्टि UIDB/UD रजिस्टर में फोटो सहित दर्ज हो जाएगी।
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
              {onFinalSubmit && (
                <button
                  type="button"
                  onClick={() => onFinalSubmit(data)}
                  className="inline-flex items-center gap-1.5 px-5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-colors"
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>Final Submit (अंतिम सबमिट करें)</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
