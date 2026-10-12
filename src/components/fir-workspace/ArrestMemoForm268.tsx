"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { ArrestDocsFormData, ArrestWitnessItem, JamaTalashiItem } from "@/app/fir-workspace/arrest-docs/page";
import { FIRItem } from "@/types";

interface ArrestMemoForm268Props {
  formData: ArrestDocsFormData;
  onChangeField: (field: keyof ArrestDocsFormData, value: any) => void;
  onUpdateWitness: (id: string, key: keyof ArrestWitnessItem, value: string) => void;
  onAddWitness: () => void;
  onDeleteWitness: (id: string) => void;
  onUpdateJamaTalashi: (id: string, key: keyof JamaTalashiItem, value: string) => void;
  onAddJamaTalashi: () => void;
  onDeleteJamaTalashi: (id: string) => void;
  readOnly?: boolean;
}

export const ArrestMemoForm268: React.FC<ArrestMemoForm268Props> = ({
  formData,
  onChangeField,
  onUpdateWitness,
  onAddWitness,
  onDeleteWitness,
  onUpdateJamaTalashi,
  onAddJamaTalashi,
  onDeleteJamaTalashi,
  readOnly = false,
}) => {
  const witnessRows = formData.arrestWitnesses && formData.arrestWitnesses.length > 0
    ? formData.arrestWitnesses
    : [
        { id: "wit_1", name: "", address: "", signature: "" },
        { id: "wit_2", name: "", address: "", signature: "" },
        { id: "wit_3", name: "", address: "", signature: "" },
      ];

  const jamaTalashiRows = formData.jamaTalashiItems && formData.jamaTalashiItems.length > 0
    ? formData.jamaTalashiItems
    : [
        { id: "jt_1", srNo: "1.", description: "", quantity: "" },
        { id: "jt_2", srNo: "2.", description: "", quantity: "" },
        { id: "jt_3", srNo: "3.", description: "", quantity: "" },
      ];

  return (
    <div className="space-y-8 font-serif text-slate-950 text-[13px] leading-[1.6]">
      {/* ========================================================================= */}
      {/* PAGE 1: भाग-1, फार्म संख्या 26.8(1) (बिंदु 1 से 8) */}
      {/* ========================================================================= */}
      <div
        className="a4-page bg-white border border-slate-300 p-8 sm:p-12 shadow-sm rounded-none print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:break-after-page page-break-after-always"
        style={{ minHeight: "1050px" }}
      >
        {/* Header Right: Version / Date */}
        <div className="flex justify-end mb-1">
          <input
            type="text"
            readOnly={readOnly}
            value={formData.headerVersion || "v3.0 dt 07.04.2025"}
            onChange={(e) => onChangeField("headerVersion", e.target.value)}
            className="font-bold text-xs text-right outline-none bg-transparent w-44"
          />
        </div>

        {/* Header Center */}
        <div className="text-center space-y-0.5 mb-5">
          <div className="font-bold text-base tracking-wide text-slate-950">
            गिरफ्तारी/ न्यायालय में समर्पण फार्म
          </div>
          <div className="font-bold text-sm text-slate-950">
            भाग-1
          </div>
          <div className="font-bold text-sm text-slate-950">
            फार्म संख्या 26.8(1)
          </div>
          <div className="text-xs text-slate-800">
            (प्रत्येक अभियुक्त के लिए अलग अलग फार्म)
          </div>
        </div>

        {/* 1. जिला, थाना, वर्ष, FIR/ रोजनामचा रपट संख्या, दिनांक */}
        <div className="space-y-1.5 mb-3">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="font-bold shrink-0">1.</span>
            <span className="font-bold shrink-0 ml-1">जिला</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.district || ""}
              onChange={(e) => onChangeField("district", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[130px] font-medium"
            />
            <span className="font-bold shrink-0">थाना</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.policeStation || ""}
              onChange={(e) => onChangeField("policeStation", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[150px] font-medium"
            />
            <span className="font-bold shrink-0">वर्ष</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.arrestYear || "2026"}
              onChange={(e) => onChangeField("arrestYear", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 w-24 text-center font-medium"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-bold shrink-0">FIR/ रोजनामचा रपट संख्या</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.complaintNo || ""}
              onChange={(e) => onChangeField("complaintNo", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[180px] font-bold"
            />
            <span className="font-bold shrink-0">दिनांक</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.issueDate || ""}
              onChange={(e) => onChangeField("issueDate", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 w-32 text-center font-medium"
            />
          </div>
        </div>

        {/* 2. गिरफ्तारी/ आत्म समर्पण की तिथि व समय */}
        <div className="space-y-1.5 mb-3">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="font-bold shrink-0">2.</span>
            <span className="font-bold shrink-0 ml-1">गिरफ्तारी/ आत्म समर्पण की तिथि व समय : दिनांक</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.arrestDate || ""}
              onChange={(e) => onChangeField("arrestDate", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 w-32 text-center font-medium"
            />
            <span className="font-bold shrink-0">समय</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.arrestTime || ""}
              onChange={(e) => onChangeField("arrestTime", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[120px] font-medium"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-bold shrink-0">रोजनामचा रपट संख्या</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.arrestGdNo || ""}
              onChange={(e) => onChangeField("arrestGdNo", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 w-48 font-medium"
            />
            <span className="font-bold shrink-0">गिरफ्तारी का स्थान</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.arrestPlace || ""}
              onChange={(e) => onChangeField("arrestPlace", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[160px] font-medium"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <input
              type="text"
              readOnly={readOnly}
              value={formData.arrestThana || formData.policeStation || ""}
              onChange={(e) => onChangeField("arrestThana", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[130px] font-medium"
            />
            <span className="font-bold shrink-0">थाना</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.arrestDistrict || formData.district || ""}
              onChange={(e) => onChangeField("arrestDistrict", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[130px] font-medium"
            />
            <span className="font-bold shrink-0">जिला</span>
          </div>
        </div>

        {/* 3. न्यायालय का नाम */}
        <div className="flex flex-wrap items-baseline gap-1.5 mb-3">
          <span className="font-bold shrink-0">3.</span>
          <span className="font-bold shrink-0 ml-1">न्यायालय का नाम ( यदि आत्मसमर्पण किया हो)</span>
          <input
            type="text"
            readOnly={readOnly}
            value={formData.courtNameSurrender || ""}
            onChange={(e) => onChangeField("courtNameSurrender", e.target.value)}
            className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[220px]"
          />
        </div>

        {/* 4. अधिनियम एवं धाराएं */}
        <div className="flex flex-wrap items-baseline gap-1.5 mb-3">
          <span className="font-bold shrink-0">4.</span>
          <span className="font-bold shrink-0 ml-1">अधिनियम एवं धाराएं</span>
          <input
            type="text"
            readOnly={readOnly}
            value={formData.sectionsOfLaw || ""}
            onChange={(e) => onChangeField("sectionsOfLaw", e.target.value)}
            className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[220px] font-bold"
          />
        </div>

        {/* 5. गिरफ्तार व्यक्ति का विवरण */}
        <div className="space-y-1 mb-3">
          <div className="font-bold">
            5. &nbsp; गिरफ्तार व्यक्ति का विवरण :-
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">(i) &nbsp; नाम</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.noticeeName || ""}
              onChange={(e) => onChangeField("noticeeName", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[260px] font-bold"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">(ii) &nbsp; पिता/पति/संरक्षक का नाम</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.noticeeFather || ""}
              onChange={(e) => onChangeField("noticeeFather", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[260px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">(iii) &nbsp; प्रथम उपनाम</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.noticeeAlias1 || ""}
              onChange={(e) => onChangeField("noticeeAlias1", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[120px]"
            />
            <span className="font-semibold shrink-0">(iv) द्वितीय उपनाम</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.noticeeAlias2 || ""}
              onChange={(e) => onChangeField("noticeeAlias2", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[120px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">(v) &nbsp; राष्ट्रीयता</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.noticeeNationality || "भारतीय"}
              onChange={(e) => onChangeField("noticeeNationality", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 w-32"
            />
            <span className="font-semibold shrink-0">(vi) (क) मतदाता या अन्य पहचान पत्र संख्या</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.voterIdOrOtherId || ""}
              onChange={(e) => onChangeField("voterIdOrOtherId", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[140px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-14">
            <span className="font-semibold shrink-0">(ख) पासपोर्ट संख्या</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.passportNo || ""}
              onChange={(e) => onChangeField("passportNo", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[120px]"
            />
            <span className="font-semibold shrink-0">(ग) जारी करने की तिथि</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.passportIssueDate || ""}
              onChange={(e) => onChangeField("passportIssueDate", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 w-32"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-14">
            <span className="font-semibold shrink-0">(घ) जारी करने का स्थान</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.passportIssuePlace || ""}
              onChange={(e) => onChangeField("passportIssuePlace", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[200px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">(vii) &nbsp; धर्म</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.religion || ""}
              onChange={(e) => onChangeField("religion", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[180px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">(viii) अनुसूचित जाति/अनुसूचित जनजाति/ अन्य पिछड़ा वर्ग/ सामान्य</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.casteCategory || ""}
              onChange={(e) => onChangeField("casteCategory", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[180px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">(ix) &nbsp; व्यवसाय</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.occupation || ""}
              onChange={(e) => onChangeField("occupation", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[200px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">(x) &nbsp; स्थाई पता</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.noticeeAddress || ""}
              onChange={(e) => onChangeField("noticeeAddress", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[260px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">(xi) &nbsp; वर्तमान पता</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.currentAddress || formData.noticeeAddress || ""}
              onChange={(e) => onChangeField("currentAddress", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[260px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">(xii) &nbsp; मोबाईल नम्बर</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.noticeePhone || ""}
              onChange={(e) => onChangeField("noticeePhone", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[140px]"
            />
            <span className="font-semibold shrink-0">(xiii) फोन नम्बर</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.phoneLandline || ""}
              onChange={(e) => onChangeField("phoneLandline", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[140px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">(xiv) &nbsp; उपयोगकर्ता पहचान संख्या</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.userIdentificationNo || ""}
              onChange={(e) => onChangeField("userIdentificationNo", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[140px]"
            />
            <span className="font-semibold shrink-0">(xv) स्थाई खाता संख्या</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.panNumber || ""}
              onChange={(e) => onChangeField("panNumber", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[140px]"
            />
          </div>
        </div>

        {/* 6. शारीरिक दशा / चोट */}
        <div className="space-y-1 mb-3">
          <div className="font-bold leading-normal">
            6. &nbsp; गिरफ्तार व्यक्ति की शारीरिक दशा/ यदि कोई चोट लगी हो तो चोट तथा उसके कारण /कारणों का विवरण (यदि डॉक्टरी जांच करवाई गई हो तो उल्लेख करे)
          </div>
          <input
            type="text"
            readOnly={readOnly}
            value={formData.physicalConditionOrInjuries || ""}
            onChange={(e) => onChangeField("physicalConditionOrInjuries", e.target.value)}
            className="w-full border-b border-dotted border-slate-700 outline-none px-1"
          />
        </div>

        {/* 7. हिरासत में लिया गया */}
        <div className="space-y-1 mb-3">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="font-bold shrink-0">7.</span>
            <span className="font-bold shrink-0 ml-1">गिरफ्तार व्यक्ति को उसकी गिरफ्तार का कारण और उसके कानूनी अधिकार को बताते हुए दिनांक</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.custodyIntimationDate || formData.arrestDate || ""}
              onChange={(e) => onChangeField("custodyIntimationDate", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 w-32 text-center"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-bold shrink-0">समय</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.custodyIntimationTime || formData.arrestTime || ""}
              onChange={(e) => onChangeField("custodyIntimationTime", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 w-28 text-center"
            />
            <span className="font-bold shrink-0">स्थान</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.custodyPlace || formData.arrestPlace || ""}
              onChange={(e) => onChangeField("custodyPlace", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[160px]"
            />
            <span className="font-bold shrink-0">से हिरासत में लिया गया ।</span>
          </div>
        </div>

        {/* 8. गवाहों के नाम और पता */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="font-bold">
              8. &nbsp; गवाहो के नाम और पता (कम से कम दो गवाह आवश्यक हैं) :-
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={onAddWitness}
                className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> गवाह जोड़ें
              </button>
            )}
          </div>
          <table className="w-full border-collapse border border-slate-800 text-[12px]">
            <thead>
              <tr className="bg-slate-50 font-bold text-center">
                <th className="border border-slate-800 px-2 py-1.5 w-12 text-center">क्र.स.</th>
                <th className="border border-slate-800 px-2 py-1.5 text-center w-1/3">नाम</th>
                <th className="border border-slate-800 px-2 py-1.5 text-center w-5/12">पता</th>
                <th className="border border-slate-800 px-2 py-1.5 text-center">हस्ताक्षर</th>
                {!readOnly && <th className="no-print border border-slate-800 px-1 py-1 w-8 text-center"></th>}
              </tr>
            </thead>
            <tbody>
              {witnessRows.map((w, idx) => (
                <tr key={w.id || idx}>
                  <td className="border border-slate-800 px-2 py-1 text-center font-bold">{idx + 1}.</td>
                  <td className="border border-slate-800 px-2 py-1">
                    <input
                      type="text"
                      readOnly={readOnly}
                      value={w.name || ""}
                      onChange={(e) => onUpdateWitness(w.id, "name", e.target.value)}
                      className="w-full bg-transparent outline-none"
                    />
                  </td>
                  <td className="border border-slate-800 px-2 py-1">
                    <input
                      type="text"
                      readOnly={readOnly}
                      value={w.address || ""}
                      onChange={(e) => onUpdateWitness(w.id, "address", e.target.value)}
                      className="w-full bg-transparent outline-none"
                    />
                  </td>
                  <td className="border border-slate-800 px-2 py-1 text-center">
                    <input
                      type="text"
                      readOnly={readOnly}
                      value={w.signature || ""}
                      onChange={(e) => onUpdateWitness(w.id, "signature", e.target.value)}
                      className="w-full bg-transparent outline-none text-center"
                    />
                  </td>
                  {!readOnly && (
                    <td className="no-print border border-slate-800 px-1 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteWitness(w.id)}
                        className="text-red-500 hover:text-red-700"
                        title="हटाएं"
                      >
                        <Trash2 className="w-3.5 h-3.5 mx-auto" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 2: सूचना, पारिवारिक विवरण, गिरफ्तारी आधार व जामा तलाशी (बिंदु 9 से 12) */}
      {/* ========================================================================= */}
      <div
        className="a4-page bg-white border border-slate-300 p-8 sm:p-12 shadow-sm rounded-none print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:break-after-page page-break-after-always"
        style={{ minHeight: "1050px" }}
      >
        {/* 9. वारिसान को सूचना */}
        <div className="space-y-1.5 mb-4">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="font-bold shrink-0">9.</span>
            <span className="font-bold shrink-0 ml-1">वारिसान</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.warisanName || formData.relativeName || ""}
              onChange={(e) => onChangeField("warisanName", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[130px] font-medium"
            />
            <span className="font-bold shrink-0">सम्बन्ध</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.warisanRelation || formData.relativeRelation || ""}
              onChange={(e) => onChangeField("warisanRelation", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[110px] font-medium"
            />
            <span className="font-bold shrink-0">दिनांक</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.warisanDate || formData.intimationDate || ""}
              onChange={(e) => onChangeField("warisanDate", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 w-32 text-center font-medium"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-bold shrink-0">समय पर</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.warisanTime || formData.intimationTime || ""}
              onChange={(e) => onChangeField("warisanTime", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 w-28 text-center font-medium"
            />
            <span className="font-bold shrink-0">मोबाईल नम्बर</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.warisanMobile || formData.relativeMobile || ""}
              onChange={(e) => onChangeField("warisanMobile", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[140px] font-medium"
            />
            <span className="font-bold shrink-0">पर सूचना दी गई ।</span>
          </div>
        </div>

        {/* 10. आरोपी के पारिवारिक सदस्यो का विवरण */}
        <div className="space-y-1.5 mb-4">
          <div className="font-bold">
            10. &nbsp; आरोपी के पारिवारिक सदस्यो का विवरण
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">(i)</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.familyMember1 || ""}
              onChange={(e) => onChangeField("familyMember1", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">(ii)</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.familyMember2 || ""}
              onChange={(e) => onChangeField("familyMember2", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">(iii)</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.familyMember3 || ""}
              onChange={(e) => onChangeField("familyMember3", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1"
            />
          </div>
        </div>

        {/* 11. आरोपी के गिरफ्तारी करने के आधार (47 BNSS) */}
        <div className="space-y-2 mb-4">
          <div className="font-bold">
            11. &nbsp; आरोपी के गिरफ्तारी करने के आधार (47 BNSS) -
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">(क) &nbsp; धाराएं जिनके तहत आरोपी द्वारा अपराध किया गया है</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.groundsSections || formData.sectionsOfLaw || ""}
              onChange={(e) => onChangeField("groundsSections", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[200px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">(ख) &nbsp; इन अपराधों में आरोपी की विशिष्ट भूमिका</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.groundsRole || ""}
              onChange={(e) => onChangeField("groundsRole", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[200px]"
            />
          </div>
          <div className="space-y-1 pl-5">
            <div className="font-semibold">
              (ग) &nbsp; इन अपराधों में अपराधी की संलिप्तता वाले आधार (जैसे कि प्रत्यक्षदर्शी का बयान, BNSS 180/183 का बयान, CCTV/ Audio Recording, बरामदगी, फर्द इंकेसाफ इत्यादि)
            </div>
            <textarea
              rows={2}
              readOnly={readOnly}
              value={formData.groundsEvidence || ""}
              onChange={(e) => onChangeField("groundsEvidence", e.target.value)}
              className="w-full border-b border-dotted border-slate-700 outline-none px-1 resize-y bg-transparent"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">(घ) &nbsp; अन्य आधार</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.groundsOther || ""}
              onChange={(e) => onChangeField("groundsOther", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[200px]"
            />
          </div>
        </div>

        {/* 12. जामा तलाशी */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <div className="font-bold leading-normal">
              12. &nbsp; <u>जामा तलाशी</u> - गिरफ्तार व्यक्ति की जामा तलाशी लेने पर निम्नलिखित सामान पाया, जिसे कब्जे में लेकर रसीद दी गई । यदि कुछ भी सामान नही पाया तो कुछ भी नही लिखा जाए ।
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={onAddJamaTalashi}
                className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1 shrink-0 ml-2"
              >
                <Plus className="w-3 h-3" /> सामान जोड़ें
              </button>
            )}
          </div>
          <table className="w-full border-collapse border border-slate-800 text-[12px]">
            <thead>
              <tr className="bg-slate-50 font-bold text-center">
                <th className="border border-slate-800 px-2 py-1.5 w-12 text-center">क्र.स.</th>
                <th className="border border-slate-800 px-2 py-1.5 text-center w-3/4">पाए गए सामान का विवरण</th>
                <th className="border border-slate-800 px-2 py-1.5 text-center">मात्रा/संख्या</th>
                {!readOnly && <th className="no-print border border-slate-800 px-1 py-1 w-8 text-center"></th>}
              </tr>
            </thead>
            <tbody>
              {jamaTalashiRows.map((r, idx) => (
                <tr key={r.id || idx}>
                  <td className="border border-slate-800 px-2 py-1 text-center font-bold">{idx + 1}.</td>
                  <td className="border border-slate-800 px-2 py-1">
                    <input
                      type="text"
                      readOnly={readOnly}
                      value={r.description || ""}
                      onChange={(e) => onUpdateJamaTalashi(r.id, "description", e.target.value)}
                      className="w-full bg-transparent outline-none"
                    />
                  </td>
                  <td className="border border-slate-800 px-2 py-1 text-center">
                    <input
                      type="text"
                      readOnly={readOnly}
                      value={r.quantity || ""}
                      onChange={(e) => onUpdateJamaTalashi(r.id, "quantity", e.target.value)}
                      className="w-full bg-transparent outline-none text-center"
                    />
                  </td>
                  {!readOnly && (
                    <td className="no-print border border-slate-800 px-1 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteJamaTalashi(r.id)}
                        className="text-red-500 hover:text-red-700"
                        title="हटाएं"
                      >
                        <Trash2 className="w-3.5 h-3.5 mx-auto" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bullets */}
          <div className="space-y-1 text-[12px] pt-1">
            <div className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>मानवीय गरिमा तथा शारीरिक बचाव हेतू आवश्यक कपडे गिरफ्तार व्यक्ति के शरीर पर रहने दिए गए ।</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>शिनाख्त हेतू अपने आप को मुंह ढककर रखने के लिए गिरफ्तार व्यक्ति को सचेत किया गया।</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="space-y-3 pt-3 text-[12.5px]">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="font-bold shrink-0">गिरफ्तार व्यक्ति के हस्ताक्षर या बायें अगूठे का निशान:</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.accusedSign1 || ""}
              onChange={(e) => onChangeField("accusedSign1", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[200px]"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold w-36 shrink-0">गवाह के हस्ताक्षर</span>
              <span className="font-semibold shrink-0">1.</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.witnessSign1 || ""}
                onChange={(e) => onChangeField("witnessSign1", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[240px]"
              />
            </div>
            <div className="flex items-baseline gap-1.5 pl-36">
              <span className="font-semibold shrink-0">2.</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.witnessSign2 || ""}
                onChange={(e) => onChangeField("witnessSign2", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[240px]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="font-bold shrink-0">गिरफ्तार व्यक्ति के हस्ताक्षर या बायें अगूठे का निशान:</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.accusedSign2 || ""}
              onChange={(e) => onChangeField("accusedSign2", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[200px]"
            />
          </div>
        </div>

        {/* Bottom Footer: Left Place/Date, Right IO Sign */}
        <div className="flex justify-between items-end pt-5 mt-2">
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold">स्थान</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.signPlace || formData.policeStation || ""}
                onChange={(e) => onChangeField("signPlace", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 w-44"
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold">दिनांक</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.signDate || formData.issueDate || ""}
                onChange={(e) => onChangeField("signDate", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 w-44"
              />
            </div>
          </div>
          <div className="space-y-1 text-right">
            <div className="font-bold text-center underline mb-1">जांच अधिकारी के हस्ताक्षर</div>
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="font-bold">नाम</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.officerName || ""}
                onChange={(e) => onChangeField("officerName", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 w-48 text-right font-medium"
              />
            </div>
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="font-bold">पद</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.officerRank || ""}
                onChange={(e) => onChangeField("officerRank", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 w-48 text-right font-medium"
              />
            </div>
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="font-bold">नम्बर</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.officerPno || ""}
                onChange={(e) => onChangeField("officerPno", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 w-48 text-right font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 3: भाग-2, पहचान पत्र, शारीरिक बनावट, सामाजिक-आर्थिक स्थिति */}
      {/* ========================================================================= */}
      <div
        className="a4-page bg-white border border-slate-300 p-8 sm:p-12 shadow-sm rounded-none print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:break-after-page page-break-after-always"
        style={{ minHeight: "1050px" }}
      >
        {/* Header Right */}
        <div className="flex justify-end mb-1">
          <input
            type="text"
            readOnly={readOnly}
            value={formData.headerVersion || "v3.0 dt 07.04.2025"}
            onChange={(e) => onChangeField("headerVersion", e.target.value)}
            className="font-bold text-xs text-right outline-none bg-transparent w-44"
          />
        </div>

        {/* Header Center */}
        <div className="text-center space-y-0.5 mb-4">
          <div className="font-bold text-base tracking-wide text-slate-950">
            गिरफ्तारी/ न्यायालय में समर्पण फार्म
          </div>
          <div className="font-bold text-sm text-slate-950">
            भाग-2
          </div>
          <div className="font-bold text-sm text-slate-950">
            पहचान पत्र
          </div>
          <div className="text-xs text-slate-800">
            (प्रत्येक अभियुक्त के लिए अलग अलग फार्म)
          </div>
        </div>

        {/* Thana / District and Photo Box */}
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-baseline gap-1.5">
              <span className="font-bold shrink-0">थाना</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.policeStation || ""}
                onChange={(e) => onChangeField("policeStation", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[130px] font-medium"
              />
              <span className="font-bold shrink-0 ml-3">जिला</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.district || ""}
                onChange={(e) => onChangeField("district", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[130px] font-medium"
              />
            </div>

            <div className="flex flex-wrap items-baseline gap-1.5 pt-1">
              <span className="font-bold shrink-0">राज्य द्वारा</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.stateVs || "हरियाणा राज्य"}
                onChange={(e) => onChangeField("stateVs", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-baseline gap-1.5">
              <span className="font-bold shrink-0">अभियोग संख्या</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.complaintNo || ""}
                onChange={(e) => onChangeField("complaintNo", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 w-24 font-bold text-center"
              />
              <span className="font-bold shrink-0">दिनांक</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.issueDate || ""}
                onChange={(e) => onChangeField("issueDate", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 w-24 text-center font-medium"
              />
              <span className="font-bold shrink-0">धारा</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.sectionsOfLaw || ""}
                onChange={(e) => onChangeField("sectionsOfLaw", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[90px] font-medium"
              />
              <span className="font-bold shrink-0">थाना</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.policeStation || ""}
                onChange={(e) => onChangeField("policeStation", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 w-28 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-baseline gap-1.5">
              <span className="font-bold shrink-0">बनाम:</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.noticeeName ? `${formData.noticeeName} ${formData.noticeeFather ? `सुपुत्र ${formData.noticeeFather}` : ""}` : ""}
                onChange={(e) => onChangeField("noticeeName", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 font-bold"
              />
            </div>
          </div>

          {/* Bordered Photograph Box */}
          <div className="w-28 h-36 border-2 border-slate-800 flex flex-col items-center justify-center text-center p-1.5 shrink-0 bg-slate-50 relative group">
            {formData.photoUrl ? (
              <img src={formData.photoUrl} alt="आरोपी फोटोग्राफ" className="w-full h-full object-cover" />
            ) : (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-800 block">
                  फोटोग्राफ आरोपी
                </span>
                <span className="text-[9px] text-slate-500 block">
                  (Passport Size)
                </span>
              </div>
            )}
            {!readOnly && (
              <label className="no-print absolute inset-0 bg-black/40 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                फोटो बदलें
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => onChangeField("photoUrl", evt.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            )}
          </div>
        </div>

        {/* 1. शारीरिक बनावट, विकृतियाँ एवं अन्य विवरण (Exact 3 Rows x 6 Columns) */}
        <div className="space-y-1.5 mb-3">
          <div className="font-bold text-[12.5px]">
            1. &nbsp; गिरफ्तार व्यक्ति की शारीरिक बनावट, विकृतियाँ एवं अन्य विवरण-
          </div>

          <table className="w-full border-collapse border border-slate-800 text-[11px] leading-tight">
            {/* Row 1 Headers */}
            <thead>
              <tr className="bg-slate-50 text-center font-bold">
                <th className="border border-slate-800 p-1.5 w-1/6">लिंग<br />(1)</th>
                <th className="border border-slate-800 p-1.5 w-1/6">जन्म तिथि / वर्ष<br />(2)</th>
                <th className="border border-slate-800 p-1.5 w-1/6">शारीरिक बनावट<br />(3)</th>
                <th className="border border-slate-800 p-1.5 w-1/6">कद (सें.मी)<br />(4)</th>
                <th className="border border-slate-800 p-1.5 w-1/6">रंग/ब्लड ग्रुप<br />(5)</th>
                <th className="border border-slate-800 p-1.5 w-1/6">पहचान के चिन्ह<br />(6)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-9">
                <td className="border border-slate-800 p-1"><input type="text" readOnly={readOnly} value={formData.gender || ""} onChange={(e) => onChangeField("gender", e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="border border-slate-800 p-1"><input type="text" readOnly={readOnly} value={formData.dobOrYear || ""} onChange={(e) => onChangeField("dobOrYear", e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="border border-slate-800 p-1"><input type="text" readOnly={readOnly} value={formData.bodyBuild || ""} onChange={(e) => onChangeField("bodyBuild", e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="border border-slate-800 p-1"><input type="text" readOnly={readOnly} value={formData.heightCm || ""} onChange={(e) => onChangeField("heightCm", e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="border border-slate-800 p-1"><input type="text" readOnly={readOnly} value={formData.complexionBloodGroup || ""} onChange={(e) => onChangeField("complexionBloodGroup", e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="border border-slate-800 p-1"><input type="text" readOnly={readOnly} value={formData.identificationMarks || ""} onChange={(e) => onChangeField("identificationMarks", e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
              </tr>

              {/* Row 2 Headers */}
              <tr className="bg-slate-50 text-center font-bold">
                <th className="border border-slate-800 p-1.5">विकृतियां/ विशेषताएं<br />(7)</th>
                <th className="border border-slate-800 p-1.5">दाँत<br />(8)</th>
                <th className="border border-slate-800 p-1.5">बाल<br />(9)</th>
                <th className="border border-slate-800 p-1.5">आंखें<br />(10)</th>
                <th className="border border-slate-800 p-1.5">आदतें<br />(11)</th>
                <th className="border border-slate-800 p-1.5">पहनावा<br />(12)</th>
              </tr>
              <tr className="h-9">
                <td className="border border-slate-800 p-1"><input type="text" readOnly={readOnly} value={formData.deformities || ""} onChange={(e) => onChangeField("deformities", e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="border border-slate-800 p-1"><input type="text" readOnly={readOnly} value={formData.teeth || ""} onChange={(e) => onChangeField("teeth", e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="border border-slate-800 p-1"><input type="text" readOnly={readOnly} value={formData.hair || ""} onChange={(e) => onChangeField("hair", e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="border border-slate-800 p-1"><input type="text" readOnly={readOnly} value={formData.eyes || ""} onChange={(e) => onChangeField("eyes", e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="border border-slate-800 p-1"><input type="text" readOnly={readOnly} value={formData.habits || ""} onChange={(e) => onChangeField("habits", e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="border border-slate-800 p-1"><input type="text" readOnly={readOnly} value={formData.dress || ""} onChange={(e) => onChangeField("dress", e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
              </tr>

              {/* Row 3 Headers */}
              <tr className="bg-slate-50 text-center font-bold">
                <th className="border border-slate-800 p-1.5">भाषा/बोली<br />(13)</th>
                <th className="border border-slate-800 p-1.5">जले हुये का निशान<br />(14)</th>
                <th className="border border-slate-800 p-1.5">ल्यूकोडर्मा/सफेद धब्बे<br />(15)</th>
                <th className="border border-slate-800 p-1.5">मस्सा<br />(16)</th>
                <th className="border border-slate-800 p-1.5">घाव<br />(17)</th>
                <th className="border border-slate-800 p-1.5">गुदे हुये का निशान<br />(18)</th>
              </tr>
              <tr className="h-9">
                <td className="border border-slate-800 p-1"><input type="text" readOnly={readOnly} value={formData.languageDialect || ""} onChange={(e) => onChangeField("languageDialect", e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="border border-slate-800 p-1"><input type="text" readOnly={readOnly} value={formData.burnMark || ""} onChange={(e) => onChangeField("burnMark", e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="border border-slate-800 p-1"><input type="text" readOnly={readOnly} value={formData.leukodermaSpots || ""} onChange={(e) => onChangeField("leukodermaSpots", e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="border border-slate-800 p-1"><input type="text" readOnly={readOnly} value={formData.mole || ""} onChange={(e) => onChangeField("mole", e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="border border-slate-800 p-1"><input type="text" readOnly={readOnly} value={formData.wound || ""} onChange={(e) => onChangeField("wound", e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="border border-slate-800 p-1"><input type="text" readOnly={readOnly} value={formData.tattooMark || ""} onChange={(e) => onChangeField("tattooMark", e.target.value)} className="w-full text-center bg-transparent outline-none" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* अन्य लक्षण यदि कोई हो तो */}
        <div className="flex flex-wrap items-baseline gap-1.5 mb-4">
          <span className="font-bold shrink-0">अन्य लक्षण यदि कोई हो तो-</span>
          <input
            type="text"
            readOnly={readOnly}
            value={formData.otherTraitsDesc || ""}
            onChange={(e) => onChangeField("otherTraitsDesc", e.target.value)}
            className="border-b border-dotted border-slate-700 outline-none px-1 flex-1"
          />
        </div>

        {/* 2. उंगलियो के निशान लिये गए */}
        <div className="flex flex-wrap items-baseline gap-3 mb-4">
          <span className="font-bold shrink-0">2. &nbsp; उंगलियो के निशान लिये गए :</span>
          <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold">
            <input
              type="radio"
              name="fingerprintsRadio"
              disabled={readOnly}
              checked={formData.fingerprintsTaken === "हां"}
              onChange={() => onChangeField("fingerprintsTaken", "हां")}
            />
            <span>हां</span>
          </label>
          <span className="text-slate-400">/</span>
          <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold">
            <input
              type="radio"
              name="fingerprintsRadio"
              disabled={readOnly}
              checked={formData.fingerprintsTaken === "नही"}
              onChange={() => onChangeField("fingerprintsTaken", "नही")}
            />
            <span>नही</span>
          </label>
        </div>

        {/* 3. गिरफ्तार व्यक्ति की सामाजिक व आर्थिक स्थिति */}
        <div className="space-y-1.5">
          <div className="font-bold">
            3. &nbsp; गिरफ्तार व्यक्ति की सामाजिक व आर्थिक स्थिति :
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">(क) &nbsp; जीवन स्तर</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.livingStandard || ""}
              onChange={(e) => onChangeField("livingStandard", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[200px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">(ख) &nbsp; शैक्षणिक योग्यता</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.education || ""}
              onChange={(e) => onChangeField("education", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[200px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">(ग) &nbsp; व्यवसाय</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.socioOccupation || formData.occupation || ""}
              onChange={(e) => onChangeField("socioOccupation", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[200px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">(घ) &nbsp; आय वर्ग</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.incomeGroup || ""}
              onChange={(e) => onChangeField("incomeGroup", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[200px]"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 4: जांच पड़ताल व ज्ञात रिकॉर्ड, हस्ताक्षर एवं केवल मोहर्रर प्रयोग (बिंदु 4 से 6) */}
      {/* ========================================================================= */}
      <div
        className="a4-page bg-white border border-slate-300 p-8 sm:p-12 shadow-sm rounded-none print:shadow-none print:border-none print:p-0 print:m-0 print:w-full page-break-after-always"
        style={{ minHeight: "1050px" }}
      >
        {/* 4. जांच पड़ताल एवं ज्ञात पुलिस रिकार्ड के आधार पर */}
        <div className="space-y-1.5 mb-4">
          <div className="font-bold text-[13px]">
            4. &nbsp; जांच पड़ताल एवं ज्ञात पुलिस रिकार्ड के आधार पर ,क्या गिरफ्तार व्यक्ति:
          </div>

          {[
            { key: "isDangerous", label: "(क)  खतरनाक है :" },
            { key: "escapedBailEarlier", label: "(ख)  पूर्व में किसी जमानत से बच निकला है :" },
            { key: "carriesWeapon", label: "(ग)  आमतौर पर शस्त्र रखता है :" },
            { key: "activeWithAssociates", label: "(घ)  सहयोगियो सहित क्रियाशील है :" },
            { key: "isListedCriminal", label: "(ङ)  ज्ञात/ सूचिबद्ध अपराधी है या नही:" },
            { key: "isHabitualCriminal", label: "(च)  आदतन अपराधी है या नही:" },
            { key: "escapeRiskDuringBail", label: "(छ)  जमानत के दौरान बच निकलने की सम्भावना है:" },
            { key: "threatRiskAfterBail", label: "(ज)  जमानत पर रिहा होने के बाद अपराध करने या पीडितो / गवाहो को धमकाने की सम्भावना है :" },
          ].map((q) => (
            <div key={q.key} className="flex justify-between items-baseline pl-5 py-0.5 border-b border-slate-100">
              <span className="font-semibold">{q.label}</span>
              <div className="flex items-center gap-2 shrink-0">
                <label className="inline-flex items-center gap-1 cursor-pointer font-bold">
                  <input
                    type="radio"
                    name={`radio_${q.key}`}
                    disabled={readOnly}
                    checked={(formData as any)[q.key] === "हाँ"}
                    onChange={() => onChangeField(q.key as any, "हाँ")}
                  />
                  <span>हाँ</span>
                </label>
                <span className="text-slate-400">/</span>
                <label className="inline-flex items-center gap-1 cursor-pointer font-bold">
                  <input
                    type="radio"
                    name={`radio_${q.key}`}
                    disabled={readOnly}
                    checked={(formData as any)[q.key] === "नही"}
                    onChange={() => onChangeField(q.key as any, "नही")}
                  />
                  <span>नही</span>
                </label>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-baseline gap-1.5 pl-5 pt-1">
            <span className="font-semibold shrink-0">(झ) &nbsp; किसी अन्य अपराध में वांछित हैं :</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.wantedInOtherCrime || ""}
              onChange={(e) => onChangeField("wantedInOtherCrime", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[200px]"
            />
          </div>

          <div className="space-y-1 pl-5 pt-1 text-[12px] text-slate-800">
            <div>यदि ख,ङ, अथवा झ का उत्तर हाँ है तो मामला संदर्भ / धाराओ का उल्लेख करे , यदि आवश्यक हो तो अलग से पृष्ठ नत्थी करें</div>
            <textarea
              rows={2}
              readOnly={readOnly}
              value={formData.caseReferenceIfYes || ""}
              onChange={(e) => onChangeField("caseReferenceIfYes", e.target.value)}
              className="w-full border-b border-dotted border-slate-700 outline-none px-1 resize-y bg-transparent"
            />
          </div>
        </div>

        {/* Middle IO Signatures */}
        <div className="flex justify-between items-end pt-3 pb-4 border-b border-slate-300 mb-4">
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold">स्थान</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.signPlace || formData.policeStation || ""}
                onChange={(e) => onChangeField("signPlace", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 w-44"
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold">दिनांक</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.signDate || formData.issueDate || ""}
                onChange={(e) => onChangeField("signDate", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 w-44"
              />
            </div>
          </div>
          <div className="space-y-1 text-right">
            <div className="font-bold text-center underline mb-1">जांच अधिकारी के हस्ताक्षर</div>
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="font-bold">नाम</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.officerName || ""}
                onChange={(e) => onChangeField("officerName", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 w-48 text-right font-medium"
              />
            </div>
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="font-bold">पद</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.officerRank || ""}
                onChange={(e) => onChangeField("officerRank", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 w-48 text-right font-medium"
              />
            </div>
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="font-bold">नम्बर</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.officerPno || ""}
                onChange={(e) => onChangeField("officerPno", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 w-48 text-right font-medium"
              />
            </div>
          </div>
        </div>

        {/* केवल मोहर्रर थाना के प्रयोग हेतू */}
        <div className="space-y-2.5">
          <div className="font-bold underline text-[13px]">
            केवल मोहर्रर थाना के प्रयोग हेतू :
          </div>

          <div className="space-y-1.5">
            <div className="font-bold">
              5. &nbsp; आरोपी का पूर्व आपराधिक रिकार्ड : (ICJS /Eagle/गृह थाना के रिकॉर्ड अनुसार )
            </div>
            <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
              <span className="font-semibold shrink-0">(i)</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.previousRecord1 || ""}
                onChange={(e) => onChangeField("previousRecord1", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 flex-1"
              />
            </div>
            <div className="pl-5 font-bold text-slate-400">-</div>
            <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
              <span className="font-semibold shrink-0">(ii)</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.previousRecord2 || ""}
                onChange={(e) => onChangeField("previousRecord2", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 flex-1"
              />
            </div>
            <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
              <span className="font-semibold shrink-0">(iii)</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.previousRecord3 || ""}
                onChange={(e) => onChangeField("previousRecord3", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 flex-1"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-1.5 pt-1">
            <span className="font-bold shrink-0">6. &nbsp; Eagle Software अनुसार अपराधी का Criminal ID No.</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.eagleCriminalId || ""}
              onChange={(e) => onChangeField("eagleCriminalId", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 font-mono font-bold"
            />
          </div>

          {/* Bottom Right MHC Signatures */}
          <div className="flex justify-end pt-5">
            <div className="space-y-1 text-right">
              <div className="font-bold text-center underline mb-1">मोहर्रर थाना के हस्ताक्षर</div>
              <div className="flex items-baseline justify-end gap-1.5">
                <span className="font-bold">नाम</span>
                <input
                  type="text"
                  readOnly={readOnly}
                  value={formData.mhcName || ""}
                  onChange={(e) => onChangeField("mhcName", e.target.value)}
                  className="border-b border-dotted border-slate-700 outline-none px-1 w-48 text-right font-medium"
                />
              </div>
              <div className="flex items-baseline justify-end gap-1.5">
                <span className="font-bold">पद</span>
                <input
                  type="text"
                  readOnly={readOnly}
                  value={formData.mhcRank || ""}
                  onChange={(e) => onChangeField("mhcRank", e.target.value)}
                  className="border-b border-dotted border-slate-700 outline-none px-1 w-48 text-right font-medium"
                />
              </div>
              <div className="flex items-baseline justify-end gap-1.5">
                <span className="font-bold">नम्बर</span>
                <input
                  type="text"
                  readOnly={readOnly}
                  value={formData.mhcBeltNo || ""}
                  onChange={(e) => onChangeField("mhcBeltNo", e.target.value)}
                  className="border-b border-dotted border-slate-700 outline-none px-1 w-48 text-right font-medium"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Generates self-contained, high-fidelity printable HTML across exactly 4 A4 pages.
 */
export function generateArrestMemo4PageHtml(formData: ArrestDocsFormData, fir?: FIRItem): string {
  const safeVal = (v?: any) => (v ? String(v).replace(/"/g, "&quot;") : "");

  const witnessRows = formData.arrestWitnesses && formData.arrestWitnesses.length > 0
    ? formData.arrestWitnesses
    : [
        { id: "1", name: "", address: "", signature: "" },
        { id: "2", name: "", address: "", signature: "" },
        { id: "3", name: "", address: "", signature: "" },
      ];

  const jamaTalashiRows = formData.jamaTalashiItems && formData.jamaTalashiItems.length > 0
    ? formData.jamaTalashiItems
    : [
        { id: "1", srNo: "1.", description: "", quantity: "" },
        { id: "2", srNo: "2.", description: "", quantity: "" },
        { id: "3", srNo: "3.", description: "", quantity: "" },
      ];

  return `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="utf-8" />
  <title>गिरफ्तारी/ न्यायालय में समर्पण फार्म संख्या 26.8(1) - ${safeVal(fir?.firNumber || formData.complaintNo)}</title>
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
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Nirmala UI", Arial, serif;
      font-size: 11pt;
      line-height: 1.6;
    }
    .a4-page {
      width: 100%;
      max-width: 210mm;
      min-height: 270mm;
      margin: 0 auto;
      padding: 10mm 12mm;
      background: #ffffff;
      page-break-after: always;
      break-after: page;
      position: relative;
    }
    .a4-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .font-semibold { font-weight: 600; }
    .underline { text-decoration: underline; }
    .dotted-line {
      display: inline-block;
      border-bottom: 1px dotted #222222;
      min-width: 80px;
      padding: 0 4px;
      font-weight: 500;
    }
    .dotted-fill {
      display: inline-block;
      border-bottom: 1px dotted #222222;
      flex: 1;
      padding: 0 4px;
      font-weight: 500;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 6px;
      margin-bottom: 6px;
    }
    .indent { padding-left: 20px; }
    .indent-deep { padding-left: 48px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      margin-bottom: 6px;
      font-size: 10pt;
    }
    table, th, td {
      border: 1px solid #111111;
    }
    th, td {
      padding: 5px 6px;
      vertical-align: middle;
    }
    th {
      background-color: #f8fafc;
      font-weight: bold;
    }
    .photo-box {
      width: 110px;
      height: 135px;
      border: 2px solid #111111;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 9pt;
      font-weight: bold;
      background: #fafafa;
    }
    @media print {
      body {
        background: #ffffff;
      }
      .a4-page {
        padding: 0;
        margin: 0;
        border: none;
        box-shadow: none;
        max-width: none;
      }
    }
  </style>
</head>
<body>

  <!-- ================= PAGE 1 ================= -->
  <div class="a4-page">
    <div class="text-right" style="font-size: 9pt; font-weight: bold;">
      ${safeVal(formData.headerVersion || "v3.0 dt 07.04.2025")}
    </div>
    <div class="text-center" style="margin-bottom: 18px;">
      <div style="font-size: 13pt; font-weight: bold;">गिरफ्तारी/ न्यायालय में समर्पण फार्म</div>
      <div style="font-size: 11pt; font-weight: bold;">भाग-1</div>
      <div style="font-size: 11pt; font-weight: bold;">फार्म संख्या 26.8(1)</div>
      <div style="font-size: 9.5pt;">(प्रत्येक अभियुक्त के लिए अलग अलग फार्म)</div>
    </div>

    <!-- 1 -->
    <div class="row">
      <span class="font-bold">1. &nbsp; जिला</span>
      <span class="dotted-line" style="min-width: 130px;">${safeVal(formData.district)}</span>
      <span class="font-bold">थाना</span>
      <span class="dotted-line" style="min-width: 150px;">${safeVal(formData.policeStation)}</span>
      <span class="font-bold">वर्ष</span>
      <span class="dotted-line" style="min-width: 80px; text-align: center;">${safeVal(formData.arrestYear || "2026")}</span>
    </div>
    <div class="row indent">
      <span class="font-bold">FIR/ रोजनामचा रपट संख्या</span>
      <span class="dotted-line" style="min-width: 180px; font-weight: bold;">${safeVal(formData.complaintNo)}</span>
      <span class="font-bold">दिनांक</span>
      <span class="dotted-line" style="min-width: 120px; text-align: center;">${safeVal(formData.issueDate)}</span>
    </div>

    <!-- 2 -->
    <div class="row" style="margin-top: 8px;">
      <span class="font-bold">2. &nbsp; गिरफ्तारी/ आत्म समर्पण की तिथि व समय : दिनांक</span>
      <span class="dotted-line" style="min-width: 110px; text-align: center;">${safeVal(formData.arrestDate)}</span>
      <span class="font-bold">समय</span>
      <span class="dotted-line" style="min-width: 120px;">${safeVal(formData.arrestTime)}</span>
    </div>
    <div class="row indent">
      <span class="font-bold">रोजनामचा रपट संख्या</span>
      <span class="dotted-line" style="min-width: 160px;">${safeVal(formData.arrestGdNo)}</span>
      <span class="font-bold">गिरफ्तारी का स्थान</span>
      <span class="dotted-line" style="min-width: 160px;">${safeVal(formData.arrestPlace)}</span>
    </div>
    <div class="row indent">
      <span class="dotted-line" style="min-width: 160px;">${safeVal(formData.arrestThana || formData.policeStation)}</span>
      <span class="font-bold">थाना</span>
      <span class="dotted-line" style="min-width: 160px;">${safeVal(formData.arrestDistrict || formData.district)}</span>
      <span class="font-bold">जिला</span>
    </div>

    <!-- 3 -->
    <div class="row" style="margin-top: 8px;">
      <span class="font-bold">3. &nbsp; न्यायालय का नाम ( यदि आत्मसमर्पण किया हो)</span>
      <span class="dotted-line" style="flex: 1;">${safeVal(formData.courtNameSurrender)}</span>
    </div>

    <!-- 4 -->
    <div class="row" style="margin-top: 8px;">
      <span class="font-bold">4. &nbsp; अधिनियम एवं धाराएं</span>
      <span class="dotted-line" style="flex: 1; font-weight: bold;">${safeVal(formData.sectionsOfLaw)}</span>
    </div>

    <!-- 5 -->
    <div style="margin-top: 8px;">
      <div class="font-bold">5. &nbsp; गिरफ्तार व्यक्ति का विवरण :-</div>
      <div class="row indent">
        <span class="font-semibold">(i) &nbsp; नाम</span>
        <span class="dotted-line" style="flex: 1; font-weight: bold;">${safeVal(formData.noticeeName)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">(ii) &nbsp; पिता/पति/संरक्षक का नाम</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.noticeeFather)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">(iii) &nbsp; प्रथम उपनाम</span>
        <span class="dotted-line" style="min-width: 130px;">${safeVal(formData.noticeeAlias1)}</span>
        <span class="font-semibold">(iv) द्वितीय उपनाम</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.noticeeAlias2)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">(v) &nbsp; राष्ट्रीयता</span>
        <span class="dotted-line" style="min-width: 110px;">${safeVal(formData.noticeeNationality || "भारतीय")}</span>
        <span class="font-semibold">(vi) (क) मतदाता या अन्य पहचान पत्र संख्या</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.voterIdOrOtherId)}</span>
      </div>
      <div class="row indent-deep">
        <span class="font-semibold">(ख) पासपोर्ट संख्या</span>
        <span class="dotted-line" style="min-width: 130px;">${safeVal(formData.passportNo)}</span>
        <span class="font-semibold">(ग) जारी करने की तिथि</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.passportIssueDate)}</span>
      </div>
      <div class="row indent-deep">
        <span class="font-semibold">(घ) जारी करने का स्थान</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.passportIssuePlace)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">(vii) &nbsp; धर्म</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.religion)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">(viii) अनुसूचित जाति/अनुसूचित जनजाति/ अन्य पिछड़ा वर्ग/ सामान्य</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.casteCategory)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">(ix) &nbsp; व्यवसाय</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.occupation)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">(x) &nbsp; स्थाई पता</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.noticeeAddress)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">(xi) &nbsp; वर्तमान पता</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.currentAddress || formData.noticeeAddress)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">(xii) &nbsp; मोबाईल नम्बर</span>
        <span class="dotted-line" style="min-width: 150px;">${safeVal(formData.noticeePhone)}</span>
        <span class="font-semibold">(xiii) फोन नम्बर</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.phoneLandline)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">(xiv) &nbsp; उपयोगकर्ता पहचान संख्या</span>
        <span class="dotted-line" style="min-width: 150px;">${safeVal(formData.userIdentificationNo)}</span>
        <span class="font-semibold">(xv) स्थाई खाता संख्या</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.panNumber)}</span>
      </div>
    </div>

    <!-- 6 -->
    <div style="margin-top: 8px;">
      <div class="font-bold">
        6. &nbsp; गिरफ्तार व्यक्ति की शारीरिक दशा/ यदि कोई चोट लगी हो तो चोट तथा उसके कारण /कारणों का विवरण (यदि डॉक्टरी जांच करवाई गई हो तो उल्लेख करे)
      </div>
      <div class="dotted-line" style="width: 100%; margin-top: 4px;">
        ${safeVal(formData.physicalConditionOrInjuries)}
      </div>
    </div>

    <!-- 7 -->
    <div style="margin-top: 8px;">
      <div class="row">
        <span class="font-bold">7. &nbsp; गिरफ्तार व्यक्ति को उसकी गिरफ्तार का कारण और उसके कानूनी अधिकार को बताते हुए दिनांक</span>
        <span class="dotted-line" style="min-width: 120px; text-align: center;">${safeVal(formData.custodyIntimationDate || formData.arrestDate)}</span>
      </div>
      <div class="row indent">
        <span class="font-bold">समय</span>
        <span class="dotted-line" style="min-width: 110px; text-align: center;">${safeVal(formData.custodyIntimationTime || formData.arrestTime)}</span>
        <span class="font-bold">स्थान</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.custodyPlace || formData.arrestPlace)}</span>
        <span class="font-bold">से हिरासत में लिया गया ।</span>
      </div>
    </div>

    <!-- 8 -->
    <div style="margin-top: 8px;">
      <div class="font-bold">8. &nbsp; गवाहो के नाम और पता (कम से कम दो गवाह आवश्यक हैं) :-</div>
      <table>
        <thead>
          <tr>
            <th style="width: 45px; text-align: center;">क्र.स.</th>
            <th style="text-align: center; width: 35%;">नाम</th>
            <th style="text-align: center; width: 45%;">पता</th>
            <th style="text-align: center;">हस्ताक्षर</th>
          </tr>
        </thead>
        <tbody>
          ${witnessRows.map((w, idx) => `
            <tr>
              <td style="text-align: center; font-weight: bold;">${idx + 1}.</td>
              <td>${safeVal(w.name)}</td>
              <td>${safeVal(w.address)}</td>
              <td style="text-align: center;">${safeVal(w.signature)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  </div>

  <!-- ================= PAGE 2 ================= -->
  <div class="a4-page">
    <!-- 9 -->
    <div style="margin-bottom: 12px;">
      <div class="row">
        <span class="font-bold">9. &nbsp; वारिसान</span>
        <span class="dotted-line" style="min-width: 150px;">${safeVal(formData.warisanName || formData.relativeName)}</span>
        <span class="font-bold">सम्बन्ध</span>
        <span class="dotted-line" style="min-width: 120px;">${safeVal(formData.warisanRelation || formData.relativeRelation)}</span>
        <span class="font-bold">दिनांक</span>
        <span class="dotted-line" style="min-width: 110px; text-align: center;">${safeVal(formData.warisanDate || formData.intimationDate)}</span>
      </div>
      <div class="row indent">
        <span class="font-bold">समय पर</span>
        <span class="dotted-line" style="min-width: 110px; text-align: center;">${safeVal(formData.warisanTime || formData.intimationTime)}</span>
        <span class="font-bold">मोबाईल नम्बर</span>
        <span class="dotted-line" style="min-width: 160px;">${safeVal(formData.warisanMobile || formData.relativeMobile)}</span>
        <span class="font-bold">पर सूचना दी गई ।</span>
      </div>
    </div>

    <!-- 10 -->
    <div style="margin-bottom: 14px;">
      <div class="font-bold">10. &nbsp; आरोपी के पारिवारिक सदस्यो का विवरण</div>
      <div class="row indent">
        <span class="font-semibold">(i)</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.familyMember1)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">(ii)</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.familyMember2)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">(iii)</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.familyMember3)}</span>
      </div>
    </div>

    <!-- 11 -->
    <div style="margin-bottom: 14px;">
      <div class="font-bold">11. &nbsp; आरोपी के गिरफ्तारी करने के आधार (47 BNSS) -</div>
      <div class="row indent">
        <span class="font-semibold">(क) &nbsp; धाराएं जिनके तहत आरोपी द्वारा अपराध किया गया है</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.groundsSections || formData.sectionsOfLaw)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">(ख) &nbsp; इन अपराधों में आरोपी की विशिष्ट भूमिका</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.groundsRole)}</span>
      </div>
      <div class="indent" style="margin-top: 4px;">
        <div class="font-semibold">(ग) &nbsp; इन अपराधों में अपराधी की संलिप्तता वाले आधार (जैसे कि प्रत्यक्षदर्शी का बयान, BNSS 180/183 का बयान, CCTV/ Audio Recording, बरामदगी, फर्द इंकेसाफ इत्यादि)</div>
        <div class="dotted-line" style="width: 100%; min-height: 22px; margin-top: 4px;">${safeVal(formData.groundsEvidence)}</div>
      </div>
      <div class="row indent" style="margin-top: 4px;">
        <span class="font-semibold">(घ) &nbsp; अन्य आधार</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.groundsOther)}</span>
      </div>
    </div>

    <!-- 12 -->
    <div style="margin-bottom: 16px;">
      <div class="font-bold">
        12. &nbsp; <u>जामा तलाशी</u> - गिरफ्तार व्यक्ति की जामा तलाशी लेने पर निम्नलिखित सामान पाया, जिसे कब्जे में लेकर रसीद दी गई । यदि कुछ भी सामान नही पाया तो कुछ भी नही लिखा जाए ।
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 45px; text-align: center;">क्र.स.</th>
            <th style="text-align: center; width: 75%;">पाए गए सामान का विवरण</th>
            <th style="text-align: center;">मात्रा/संख्या</th>
          </tr>
        </thead>
        <tbody>
          ${jamaTalashiRows.map((r, idx) => `
            <tr>
              <td style="text-align: center; font-weight: bold;">${idx + 1}.</td>
              <td>${safeVal(r.description)}</td>
              <td style="text-align: center;">${safeVal(r.quantity)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <div style="margin-top: 8px; font-size: 10pt;">
        <div>• मानवीय गरिमा तथा शारीरिक बचाव हेतू आवश्यक कपडे गिरफ्तार व्यक्ति के शरीर पर रहने दिए गए ।</div>
        <div>• शिनाख्त हेतू अपने आप को मुंह ढककर रखने के लिए गिरफ्तार व्यक्ति को सचेत किया गया।</div>
      </div>
    </div>

    <!-- Signatures -->
    <div style="margin-top: 24px; font-size: 10.5pt; line-height: 1.8;">
      <div class="row">
        <span class="font-bold">गिरफ्तार व्यक्ति के हस्ताक्षर या बायें अगूठे का निशान:</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.accusedSign1)}</span>
      </div>
      <div style="margin-top: 6px;">
        <div class="row">
          <span class="font-bold" style="width: 140px;">गवाह के हस्ताक्षर</span>
          <span class="font-semibold">1.</span>
          <span class="dotted-line" style="flex: 1;">${safeVal(formData.witnessSign1)}</span>
        </div>
        <div class="row" style="padding-left: 140px;">
          <span class="font-semibold">2.</span>
          <span class="dotted-line" style="flex: 1;">${safeVal(formData.witnessSign2)}</span>
        </div>
      </div>
      <div class="row" style="margin-top: 6px;">
        <span class="font-bold">गिरफ्तार व्यक्ति के हस्ताक्षर या बायें अगूठे का निशान:</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.accusedSign2)}</span>
      </div>
    </div>

    <!-- Footer -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px;">
      <div>
        <div class="row">
          <span class="font-bold">स्थान</span>
          <span class="dotted-line" style="min-width: 140px;">${safeVal(formData.signPlace || formData.policeStation)}</span>
        </div>
        <div class="row">
          <span class="font-bold">दिनांक</span>
          <span class="dotted-line" style="min-width: 140px;">${safeVal(formData.signDate || formData.issueDate)}</span>
        </div>
      </div>
      <div class="text-right">
        <div class="font-bold underline text-center" style="margin-bottom: 4px;">जांच अधिकारी के हस्ताक्षर</div>
        <div class="row" style="justify-content: flex-end;">
          <span class="font-bold">नाम</span>
          <span class="dotted-line" style="min-width: 160px; text-align: right;">${safeVal(formData.officerName)}</span>
        </div>
        <div class="row" style="justify-content: flex-end;">
          <span class="font-bold">पद</span>
          <span class="dotted-line" style="min-width: 160px; text-align: right;">${safeVal(formData.officerRank)}</span>
        </div>
        <div class="row" style="justify-content: flex-end;">
          <span class="font-bold">नम्बर</span>
          <span class="dotted-line" style="min-width: 160px; text-align: right;">${safeVal(formData.officerPno)}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ================= PAGE 3 ================= -->
  <div class="a4-page">
    <div class="text-right" style="font-size: 9pt; font-weight: bold;">
      ${safeVal(formData.headerVersion || "v3.0 dt 07.04.2025")}
    </div>
    <div class="text-center" style="margin-bottom: 16px;">
      <div style="font-size: 13pt; font-weight: bold;">गिरफ्तारी/ न्यायालय में समर्पण फार्म</div>
      <div style="font-size: 11pt; font-weight: bold;">भाग-2</div>
      <div style="font-size: 11pt; font-weight: bold;">पहचान पत्र</div>
      <div style="font-size: 9.5pt;">(प्रत्येक अभियुक्त के लिए अलग अलग फार्म)</div>
    </div>

    <!-- Thana, District & Photo -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 14px;">
      <div style="flex: 1;">
        <div class="row">
          <span class="font-bold">थाना</span>
          <span class="dotted-line" style="min-width: 140px;">${safeVal(formData.policeStation)}</span>
          <span class="font-bold" style="margin-left: 12px;">जिला</span>
          <span class="dotted-line" style="min-width: 140px;">${safeVal(formData.district)}</span>
        </div>
        <div class="row" style="margin-top: 6px;">
          <span class="font-bold">राज्य द्वारा</span>
          <span class="dotted-line" style="flex: 1;">${safeVal(formData.stateVs || "हरियाणा राज्य")}</span>
        </div>
        <div class="row" style="margin-top: 6px;">
          <span class="font-bold">अभियोग संख्या</span>
          <span class="dotted-line" style="min-width: 80px; text-align: center; font-weight: bold;">${safeVal(formData.complaintNo)}</span>
          <span class="font-bold">दिनांक</span>
          <span class="dotted-line" style="min-width: 80px; text-align: center;">${safeVal(formData.issueDate)}</span>
          <span class="font-bold">धारा</span>
          <span class="dotted-line" style="min-width: 100px;">${safeVal(formData.sectionsOfLaw)}</span>
          <span class="font-bold">थाना</span>
          <span class="dotted-line" style="min-width: 90px;">${safeVal(formData.policeStation)}</span>
        </div>
        <div class="row" style="margin-top: 6px;">
          <span class="font-bold">बनाम:</span>
          <span class="dotted-line" style="flex: 1; font-weight: bold;">${safeVal(formData.noticeeName)}</span>
        </div>
      </div>
      <div class="photo-box">
        ${formData.photoUrl ? `<img src="${formData.photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" />` : `फोटोग्राफ आरोपी`}
      </div>
    </div>

    <!-- 1. शारीरिक बनावट Table -->
    <div style="margin-bottom: 12px;">
      <div class="font-bold">1. &nbsp; गिरफ्तार व्यक्ति की शारीरिक बनावट, विकृतियाँ एवं अन्य विवरण-</div>
      <table>
        <thead>
          <tr style="text-align: center;">
            <th>लिंग<br />(1)</th>
            <th>जन्म तिथि / वर्ष<br />(2)</th>
            <th>शारीरिक बनावट<br />(3)</th>
            <th>कद (सें.मी)<br />(4)</th>
            <th>रंग/ब्लड ग्रुप<br />(5)</th>
            <th>पहचान के चिन्ह<br />(6)</th>
          </tr>
        </thead>
        <tbody>
          <tr style="text-align: center; height: 32px;">
            <td>${safeVal(formData.gender)}</td>
            <td>${safeVal(formData.dobOrYear)}</td>
            <td>${safeVal(formData.bodyBuild)}</td>
            <td>${safeVal(formData.heightCm)}</td>
            <td>${safeVal(formData.complexionBloodGroup)}</td>
            <td>${safeVal(formData.identificationMarks)}</td>
          </tr>
          <tr style="text-align: center; background: #f8fafc; font-weight: bold;">
            <td>विकृतियां/ विशेषताएं<br />(7)</td>
            <td>दाँत<br />(8)</td>
            <td>बाल<br />(9)</td>
            <td>आंखें<br />(10)</td>
            <td>आदतें<br />(11)</td>
            <td>पहनावा<br />(12)</td>
          </tr>
          <tr style="text-align: center; height: 32px;">
            <td>${safeVal(formData.deformities)}</td>
            <td>${safeVal(formData.teeth)}</td>
            <td>${safeVal(formData.hair)}</td>
            <td>${safeVal(formData.eyes)}</td>
            <td>${safeVal(formData.habits)}</td>
            <td>${safeVal(formData.dress)}</td>
          </tr>
          <tr style="text-align: center; background: #f8fafc; font-weight: bold;">
            <td>भाषा/बोली<br />(13)</td>
            <td>जले हुये का निशान<br />(14)</td>
            <td>ल्यूकोडर्मा/सफेद धब्बे<br />(15)</td>
            <td>मस्सा<br />(16)</td>
            <td>घाव<br />(17)</td>
            <td>गुदे हुये का निशान<br />(18)</td>
          </tr>
          <tr style="text-align: center; height: 32px;">
            <td>${safeVal(formData.languageDialect)}</td>
            <td>${safeVal(formData.burnMark)}</td>
            <td>${safeVal(formData.leukodermaSpots)}</td>
            <td>${safeVal(formData.mole)}</td>
            <td>${safeVal(formData.wound)}</td>
            <td>${safeVal(formData.tattooMark)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="row" style="margin-bottom: 12px;">
      <span class="font-bold">अन्य लक्षण यदि कोई हो तो-</span>
      <span class="dotted-line" style="flex: 1;">${safeVal(formData.otherTraitsDesc)}</span>
    </div>

    <!-- 2 -->
    <div class="row" style="margin-bottom: 12px;">
      <span class="font-bold">2. &nbsp; उंगलियो के निशान लिये गए : &nbsp; </span>
      <span class="font-bold" style="border: 1px solid #000; padding: 1px 6px;">${formData.fingerprintsTaken === "हां" ? "✓ हां" : "हां"}</span>
      <span>/</span>
      <span class="font-bold" style="border: 1px solid #000; padding: 1px 6px;">${formData.fingerprintsTaken === "नही" ? "✓ नही" : "नही"}</span>
    </div>

    <!-- 3 -->
    <div>
      <div class="font-bold">3. &nbsp; गिरफ्तार व्यक्ति की सामाजिक व आर्थिक स्थिति :</div>
      <div class="row indent">
        <span class="font-semibold">(क) &nbsp; जीवन स्तर</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.livingStandard)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">(ख) &nbsp; शैक्षणिक योग्यता</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.education)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">(ग) &nbsp; व्यवसाय</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.socioOccupation || formData.occupation)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">(घ) &nbsp; आय वर्ग</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.incomeGroup)}</span>
      </div>
    </div>
  </div>

  <!-- ================= PAGE 4 ================= -->
  <div class="a4-page">
    <div class="font-bold" style="margin-bottom: 8px;">
      4. &nbsp; जांच पड़ताल एवं ज्ञात पुलिस रिकार्ड के आधार पर ,क्या गिरफ्तार व्यक्ति:
    </div>

    <div style="font-size: 10.5pt; line-height: 1.7; margin-bottom: 14px;">
      ${[
        { key: "isDangerous", label: "(क)  खतरनाक है :" },
        { key: "escapedBailEarlier", label: "(ख)  पूर्व में किसी जमानत से बच निकला है :" },
        { key: "carriesWeapon", label: "(ग)  आमतौर पर शस्त्र रखता है :" },
        { key: "activeWithAssociates", label: "(घ)  सहयोगियो सहित क्रियाशील है :" },
        { key: "isListedCriminal", label: "(ङ)  ज्ञात/ सूचिबद्ध अपराधी है या नही:" },
        { key: "isHabitualCriminal", label: "(च)  आदतन अपराधी है या नही:" },
        { key: "escapeRiskDuringBail", label: "(छ)  जमानत के दौरान बच निकलने की सम्भावना है:" },
        { key: "threatRiskAfterBail", label: "(ज)  जमानत पर रिहा होने के बाद अपराध करने या पीडितो / गवाहो को धमकाने की सम्भावना है :" },
      ].map((q) => {
        const val = (formData as any)[q.key];
        return `
          <div style="display: flex; justify-content: space-between; padding-left: 20px; border-bottom: 1px dotted #e2e8f0; padding-top: 2px; padding-bottom: 2px;">
            <span class="font-semibold">${q.label}</span>
            <span class="font-bold">${val === "हाँ" ? "<b>[ हाँ ]</b> &nbsp; नही" : val === "नही" ? "हाँ &nbsp; <b>[ नही ]</b>" : "हाँ / नही"}</span>
          </div>
        `;
      }).join("")}

      <div class="row indent" style="margin-top: 6px;">
        <span class="font-semibold">(झ) &nbsp; किसी अन्य अपराध में वांछित हैं :</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.wantedInOtherCrime)}</span>
      </div>

      <div class="indent" style="margin-top: 6px; font-size: 9.5pt;">
        <div>यदि ख,ङ, अथवा झ का उत्तर हाँ है तो मामला संदर्भ / धाराओ का उल्लेख करे , यदि आवश्यक हो तो अलग से पृष्ठ नत्थी करें</div>
        <div class="dotted-line" style="width: 100%; min-height: 22px; margin-top: 4px;">${safeVal(formData.caseReferenceIfYes)}</div>
      </div>
    </div>

    <!-- IO Signatures -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 10px; padding-bottom: 14px; border-bottom: 1px solid #222222; margin-bottom: 16px;">
      <div>
        <div class="row">
          <span class="font-bold">स्थान</span>
          <span class="dotted-line" style="min-width: 140px;">${safeVal(formData.signPlace || formData.policeStation)}</span>
        </div>
        <div class="row">
          <span class="font-bold">दिनांक</span>
          <span class="dotted-line" style="min-width: 140px;">${safeVal(formData.signDate || formData.issueDate)}</span>
        </div>
      </div>
      <div class="text-right">
        <div class="font-bold underline text-center" style="margin-bottom: 4px;">जांच अधिकारी के हस्ताक्षर</div>
        <div class="row" style="justify-content: flex-end;">
          <span class="font-bold">नाम</span>
          <span class="dotted-line" style="min-width: 160px; text-align: right;">${safeVal(formData.officerName)}</span>
        </div>
        <div class="row" style="justify-content: flex-end;">
          <span class="font-bold">पद</span>
          <span class="dotted-line" style="min-width: 160px; text-align: right;">${safeVal(formData.officerRank)}</span>
        </div>
        <div class="row" style="justify-content: flex-end;">
          <span class="font-bold">नम्बर</span>
          <span class="dotted-line" style="min-width: 160px; text-align: right;">${safeVal(formData.officerPno)}</span>
        </div>
      </div>
    </div>

    <!-- MHC Section -->
    <div>
      <div class="font-bold underline" style="margin-bottom: 8px;">
        केवल मोहर्रर थाना के प्रयोग हेतू :
      </div>

      <div style="margin-bottom: 10px;">
        <div class="font-bold">
          5. &nbsp; आरोपी का पूर्व आपराधिक रिकार्ड : (ICJS /Eagle/गृह थाना के रिकॉर्ड अनुसार )
        </div>
        <div class="row indent">
          <span class="font-semibold">(i)</span>
          <span class="dotted-line" style="flex: 1;">${safeVal(formData.previousRecord1)}</span>
        </div>
        <div class="indent" style="font-weight: bold; color: #888;">-</div>
        <div class="row indent">
          <span class="font-semibold">(ii)</span>
          <span class="dotted-line" style="flex: 1;">${safeVal(formData.previousRecord2)}</span>
        </div>
        <div class="row indent">
          <span class="font-semibold">(iii)</span>
          <span class="dotted-line" style="flex: 1;">${safeVal(formData.previousRecord3)}</span>
        </div>
      </div>

      <div class="row" style="margin-bottom: 24px;">
        <span class="font-bold">6. &nbsp; Eagle Software अनुसार अपराधी का Criminal ID No.</span>
        <span class="dotted-line" style="flex: 1; font-family: monospace; font-weight: bold;">${safeVal(formData.eagleCriminalId)}</span>
      </div>

      <!-- MHC Signature -->
      <div style="display: flex; justify-content: flex-end; margin-top: 30px;">
        <div class="text-right">
          <div class="font-bold underline text-center" style="margin-bottom: 4px;">मोहर्रर थाना के हस्ताक्षर</div>
          <div class="row" style="justify-content: flex-end;">
            <span class="font-bold">नाम</span>
            <span class="dotted-line" style="min-width: 160px; text-align: right;">${safeVal(formData.mhcName)}</span>
          </div>
          <div class="row" style="justify-content: flex-end;">
            <span class="font-bold">पद</span>
            <span class="dotted-line" style="min-width: 160px; text-align: right;">${safeVal(formData.mhcRank)}</span>
          </div>
          <div class="row" style="justify-content: flex-end;">
            <span class="font-bold">नम्बर</span>
            <span class="dotted-line" style="min-width: 160px; text-align: right;">${safeVal(formData.mhcBeltNo)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

</body>
</html>`;
}
