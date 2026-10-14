"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { ArrestDocsFormData, ArrestWitnessItem, JamaTalashiItem } from "@/app/fir-workspace/arrest-docs/page";
import { FIRItem } from "@/types";

export interface ArrestMemoForm268Props {
  formData: ArrestDocsFormData;
  language?: "hi" | "en";
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
  language = "hi",
  onChangeField,
  onUpdateWitness,
  onAddWitness,
  onDeleteWitness,
  onUpdateJamaTalashi,
  onAddJamaTalashi,
  onDeleteJamaTalashi,
  readOnly = false,
}) => {
  const isHi = language !== "en";

  const witnessRows =
    formData.arrestWitnesses && formData.arrestWitnesses.length > 0
      ? formData.arrestWitnesses
      : [
          { id: "wit_1", name: "", address: "", signature: "" },
          { id: "wit_2", name: "", address: "", signature: "" },
          { id: "wit_3", name: "", address: "", signature: "" },
        ];

  const jamaTalashiRows =
    formData.jamaTalashiItems && formData.jamaTalashiItems.length > 0
      ? formData.jamaTalashiItems
      : [
          { id: "jt_1", srNo: "1.", description: "", quantity: "" },
          { id: "jt_2", srNo: "2.", description: "", quantity: "" },
          { id: "jt_3", srNo: "3.", description: "", quantity: "" },
        ];

  const policeQuestions = isHi
    ? [
        { key: "isDangerous", label: "(क)  खतरनाक है :" },
        { key: "escapedBailEarlier", label: "(ख)  पूर्व में किसी जमानत से बच निकला है :" },
        { key: "carriesWeapon", label: "(ग)  आमतौर पर शस्त्र रखता है :" },
        { key: "activeWithAssociates", label: "(घ)  सहयोगियो सहित क्रियाशील है :" },
        { key: "isListedCriminal", label: "(ङ)  ज्ञात/ सूचिबद्ध अपराधी है या नही:" },
        { key: "isHabitualCriminal", label: "(च)  आदतन अपराधी है या नही:" },
        { key: "escapeRiskDuringBail", label: "(छ)  जमानत के दौरान बच निकलने की सम्भावना है:" },
        {
          key: "threatRiskAfterBail",
          label: "(ज)  जमानत पर रिहा होने के बाद अपराध करने या पीडितो / गवाहो को धमकाने की सम्भावना है :",
        },
      ]
    : [
        { key: "isDangerous", label: "(a)  Dangerous :" },
        { key: "escapedBailEarlier", label: "(b)  Previously escaped / jumped bail :" },
        { key: "carriesWeapon", label: "(c)  Habitually carries weapons :" },
        { key: "activeWithAssociates", label: "(d)  Operates with active associates / gang :" },
        { key: "isListedCriminal", label: "(e)  Known / listed criminal :" },
        { key: "isHabitualCriminal", label: "(f)  Habitual criminal :" },
        { key: "escapeRiskDuringBail", label: "(g)  Likelihood of absconding during bail :" },
        {
          key: "threatRiskAfterBail",
          label: "(h)  Likelihood of committing crime or threatening victims/witnesses on bail :",
        },
      ];

  return (
    <div className="space-y-8 font-serif text-slate-950 text-[13px] leading-[1.6]">
      {/* ========================================================================= */}
      {/* PAGE 1: भाग-1 / PART-1, फार्म संख्या 26.8(1) (बिंदु 1 से 8) */}
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
            {isHi ? "गिरफ्तारी/ न्यायालय में समर्पण फार्म" : "ARREST / SURRENDER IN COURT MEMO"}
          </div>
          <div className="font-bold text-sm text-slate-950">
            {isHi ? "भाग-1" : "PART-1"}
          </div>
          <div className="font-bold text-sm text-slate-950">
            {isHi ? "फार्म संख्या 26.8(1)" : "FORM NO. 26.8(1)"}
          </div>
          <div className="text-xs text-slate-800">
            {isHi ? "(प्रत्येक अभियुक्त के लिए अलग अलग फार्म)" : "(Separate Form for Each Accused)"}
          </div>
        </div>

        {/* 1. जिला, थाना, वर्ष, FIR/ रोजनामचा रपट संख्या, दिनांक */}
        <div className="space-y-1.5 mb-3">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="font-bold shrink-0">1.</span>
            <span className="font-bold shrink-0 ml-1">{isHi ? "जिला" : "District"}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.district || ""}
              onChange={(e) => onChangeField("district", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[130px] font-medium"
            />
            <span className="font-bold shrink-0">{isHi ? "थाना" : "Police Station"}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.policeStation || ""}
              onChange={(e) => onChangeField("policeStation", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[150px] font-medium"
            />
            <span className="font-bold shrink-0">{isHi ? "वर्ष" : "Year"}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.arrestYear || "2026"}
              onChange={(e) => onChangeField("arrestYear", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 w-24 text-center font-medium"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-bold shrink-0">{isHi ? "FIR/ रोजनामचा रपट संख्या" : "FIR / GD Entry No."}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.complaintNo || ""}
              onChange={(e) => onChangeField("complaintNo", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[180px] font-bold"
            />
            <span className="font-bold shrink-0">{isHi ? "दिनांक" : "Date"}</span>
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
            <span className="font-bold shrink-0 ml-1">
              {isHi
                ? "गिरफ्तारी/ आत्म समर्पण की तिथि व समय : दिनांक"
                : "Date & Time of Arrest / Surrender : Date"}
            </span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.arrestDate || ""}
              onChange={(e) => onChangeField("arrestDate", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 w-32 text-center font-medium"
            />
            <span className="font-bold shrink-0">{isHi ? "समय" : "Time"}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.arrestTime || ""}
              onChange={(e) => onChangeField("arrestTime", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[120px] font-medium"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-bold shrink-0">{isHi ? "रोजनामचा रपट संख्या" : "GD Entry No."}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.arrestGdNo || ""}
              onChange={(e) => onChangeField("arrestGdNo", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 w-48 font-medium"
            />
            <span className="font-bold shrink-0">{isHi ? "गिरफ्तारी का स्थान" : "Place of Arrest"}</span>
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
            <span className="font-bold shrink-0">{isHi ? "थाना" : "Police Station"}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.arrestDistrict || formData.district || ""}
              onChange={(e) => onChangeField("arrestDistrict", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[130px] font-medium"
            />
            <span className="font-bold shrink-0">{isHi ? "जिला" : "District"}</span>
          </div>
        </div>

        {/* 3. न्यायालय का नाम */}
        <div className="flex flex-wrap items-baseline gap-1.5 mb-3">
          <span className="font-bold shrink-0">3.</span>
          <span className="font-bold shrink-0 ml-1">
            {isHi
              ? "न्यायालय का नाम ( यदि आत्मसमर्पण किया हो)"
              : "Name of Court (If Surrendered)"}
          </span>
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
          <span className="font-bold shrink-0 ml-1">
            {isHi ? "अधिनियम एवं धाराएं" : "Acts & Sections"}
          </span>
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
            {isHi ? "5.  गिरफ्तार व्यक्ति का विवरण :-" : "5.  Particulars of Arrested Person :-"}
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">{isHi ? "(i)  नाम" : "(i)  Name"}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.noticeeName || ""}
              onChange={(e) => onChangeField("noticeeName", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[260px] font-bold"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">
              {isHi ? "(ii)  पिता/पति/संरक्षक का नाम" : "(ii)  Father's / Husband's / Guardian's Name"}
            </span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.noticeeFather || ""}
              onChange={(e) => onChangeField("noticeeFather", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[260px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">{isHi ? "(iii)  प्रथम उपनाम" : "(iii)  Primary Alias / Nickname"}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.noticeeAlias1 || ""}
              onChange={(e) => onChangeField("noticeeAlias1", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[120px]"
            />
            <span className="font-semibold shrink-0">{isHi ? "(iv) द्वितीय उपनाम" : "(iv) Secondary Alias"}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.noticeeAlias2 || ""}
              onChange={(e) => onChangeField("noticeeAlias2", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[120px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">{isHi ? "(v)  राष्ट्रीयता" : "(v)  Nationality"}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.noticeeNationality || (isHi ? "भारतीय" : "Indian")}
              onChange={(e) => onChangeField("noticeeNationality", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 w-32"
            />
            <span className="font-semibold shrink-0">
              {isHi
                ? "(vi) (क) मतदाता या अन्य पहचान पत्र संख्या"
                : "(vi) (a) Voter ID or Other Identity Card No."}
            </span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.voterIdOrOtherId || ""}
              onChange={(e) => onChangeField("voterIdOrOtherId", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[140px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-14">
            <span className="font-semibold shrink-0">{isHi ? "(ख) पासपोर्ट संख्या" : "(b) Passport No."}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.passportNo || ""}
              onChange={(e) => onChangeField("passportNo", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[120px]"
            />
            <span className="font-semibold shrink-0">{isHi ? "(ग) जारी करने की तिथि" : "(c) Date of Issue"}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.passportIssueDate || ""}
              onChange={(e) => onChangeField("passportIssueDate", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 w-32"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-14">
            <span className="font-semibold shrink-0">{isHi ? "(घ) जारी करने का स्थान" : "(d) Place of Issue"}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.passportIssuePlace || ""}
              onChange={(e) => onChangeField("passportIssuePlace", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[200px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">{isHi ? "(vii)  धर्म" : "(vii)  Religion"}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.religion || ""}
              onChange={(e) => onChangeField("religion", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[180px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">
              {isHi
                ? "(viii) अनुसूचित जाति/अनुसूचित जनजाति/ अन्य पिछड़ा वर्ग/ सामान्य"
                : "(viii) SC / ST / OBC / General"}
            </span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.casteCategory || ""}
              onChange={(e) => onChangeField("casteCategory", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[180px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">{isHi ? "(ix)  व्यवसाय" : "(ix)  Occupation"}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.occupation || ""}
              onChange={(e) => onChangeField("occupation", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[200px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">{isHi ? "(x)  स्थाई पता" : "(x)  Permanent Address"}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.noticeeAddress || ""}
              onChange={(e) => onChangeField("noticeeAddress", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[260px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">{isHi ? "(xi)  वर्तमान पता" : "(xi)  Present Address"}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.currentAddress || formData.noticeeAddress || ""}
              onChange={(e) => onChangeField("currentAddress", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[260px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">{isHi ? "(xii)  मोबाईल नम्बर" : "(xii)  Mobile Number"}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.noticeePhone || ""}
              onChange={(e) => onChangeField("noticeePhone", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[140px]"
            />
            <span className="font-semibold shrink-0">{isHi ? "(xiii) फोन नम्बर" : "(xiii) Landline Phone No."}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.phoneLandline || ""}
              onChange={(e) => onChangeField("phoneLandline", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[140px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">
              {isHi ? "(xiv)  उपयोगकर्ता पहचान संख्या" : "(xiv)  User Identification No. (Aadhaar / ID)"}
            </span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.userIdentificationNo || ""}
              onChange={(e) => onChangeField("userIdentificationNo", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[140px]"
            />
            <span className="font-semibold shrink-0">{isHi ? "(xv) स्थाई खाता संख्या" : "(xv) PAN Number"}</span>
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
            {isHi
              ? "6.  गिरफ्तार व्यक्ति की शारीरिक दशा/ यदि कोई चोट लगी हो तो चोट तथा उसके कारण /कारणों का विवरण (यदि डॉक्टरी जांच करवाई गई हो तो उल्लेख करे)"
              : "6.  Physical condition of arrested person / Details of any injuries and causes thereof (Mention if medical exam was conducted)"}
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
            <span className="font-bold shrink-0 ml-1">
              {isHi
                ? "गिरफ्तार व्यक्ति को उसकी गिरफ्तार का कारण और उसके कानूनी अधिकार को बताते हुए दिनांक"
                : "The arrested person was taken into custody after intimating grounds of arrest and legal rights on Date"}
            </span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.custodyIntimationDate || formData.arrestDate || ""}
              onChange={(e) => onChangeField("custodyIntimationDate", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 w-32 text-center"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-bold shrink-0">{isHi ? "समय" : "Time"}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.custodyIntimationTime || formData.arrestTime || ""}
              onChange={(e) => onChangeField("custodyIntimationTime", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 w-28 text-center"
            />
            <span className="font-bold shrink-0">{isHi ? "स्थान" : "from Place"}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.custodyPlace || formData.arrestPlace || ""}
              onChange={(e) => onChangeField("custodyPlace", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[160px]"
            />
            <span className="font-bold shrink-0">{isHi ? "से हिरासत में लिया गया ।" : "."}</span>
          </div>
        </div>

        {/* 8. गवाहों के नाम और पता */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="font-bold">
              {isHi
                ? "8.  गवाहो के नाम और पता (कम से कम दो गवाह आवश्यक हैं) :-"
                : "8.  Names and Addresses of Witnesses (Minimum two witnesses required) :-"}
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={onAddWitness}
                className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> {isHi ? "गवाह जोड़ें" : "Add Witness"}
              </button>
            )}
          </div>
          <table className="w-full border-collapse border border-slate-800 text-[12px]">
            <thead>
              <tr className="bg-slate-50 font-bold text-center">
                <th className="border border-slate-800 px-2 py-1.5 w-12 text-center">{isHi ? "क्र.स." : "Sr.No."}</th>
                <th className="border border-slate-800 px-2 py-1.5 text-center w-1/3">{isHi ? "नाम" : "Name"}</th>
                <th className="border border-slate-800 px-2 py-1.5 text-center w-5/12">{isHi ? "पता" : "Address"}</th>
                <th className="border border-slate-800 px-2 py-1.5 text-center">{isHi ? "हस्ताक्षर" : "Signature"}</th>
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
                        title={isHi ? "हटाएं" : "Remove"}
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
            <span className="font-bold shrink-0 ml-1">
              {isHi ? "वारिसान" : "Next of Kin / Relative"}
            </span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.warisanName || formData.relativeName || ""}
              onChange={(e) => onChangeField("warisanName", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[130px] font-medium"
            />
            <span className="font-bold shrink-0">{isHi ? "सम्बन्ध" : "Relation"}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.warisanRelation || formData.relativeRelation || ""}
              onChange={(e) => onChangeField("warisanRelation", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[110px] font-medium"
            />
            <span className="font-bold shrink-0">{isHi ? "दिनांक" : "Date"}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.warisanDate || formData.intimationDate || ""}
              onChange={(e) => onChangeField("warisanDate", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 w-32 text-center font-medium"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-bold shrink-0">{isHi ? "समय पर" : "Time"}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.warisanTime || formData.intimationTime || ""}
              onChange={(e) => onChangeField("warisanTime", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 w-28 text-center font-medium"
            />
            <span className="font-bold shrink-0">{isHi ? "मोबाईल नम्बर" : "Mobile Number"}</span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.warisanMobile || formData.relativeMobile || ""}
              onChange={(e) => onChangeField("warisanMobile", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[140px] font-medium"
            />
            <span className="font-bold shrink-0">{isHi ? "पर सूचना दी गई ।" : "intimation was served."}</span>
          </div>
        </div>

        {/* 10. आरोपी के पारिवारिक सदस्यो का विवरण */}
        <div className="space-y-1.5 mb-4">
          <div className="font-bold">
            {isHi
              ? "10.  आरोपी के पारिवारिक सदस्यो का विवरण"
              : "10.  Details of Family Members of Accused"}
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
            {isHi
              ? "11.  आरोपी के गिरफ्तारी करने के आधार (47 BNSS) -"
              : "11.  Grounds of Arrest of Accused (Section 47 BNSS) -"}
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">
              {isHi
                ? "(क)  धाराएं जिनके तहत आरोपी द्वारा अपराध किया गया है"
                : "(a)  Sections under which offence is committed by accused"}
            </span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.groundsSections || formData.sectionsOfLaw || ""}
              onChange={(e) => onChangeField("groundsSections", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[200px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">
              {isHi
                ? "(ख)  इन अपराधों में आरोपी की विशिष्ट भूमिका"
                : "(b)  Specific role of accused in these offences"}
            </span>
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
              {isHi
                ? "(ग)  इन अपराधों में अपराधी की संलिप्तता वाले आधार (जैसे कि प्रत्यक्षदर्शी का बयान, BNSS 180/183 का बयान, CCTV/ Audio Recording, बरामदगी, फर्द इंकेसाफ इत्यादि)"
                : "(c)  Grounds showing complicity of culprit in offences (e.g., eyewitness statement, statement u/s 180/183 BNSS, CCTV / Audio Recording, recovery, disclosure memo, etc.)"}
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
            <span className="font-semibold shrink-0">
              {isHi ? "(घ)  अन्य आधार" : "(d)  Other grounds"}
            </span>
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
              {isHi ? (
                <>
                  12. &nbsp; <u>जामा तलाशी</u> - गिरफ्तार व्यक्ति की जामा तलाशी लेने पर निम्नलिखित सामान पाया, जिसे कब्जे में लेकर रसीद दी गई । यदि कुछ भी सामान नही पाया तो कुछ भी नही लिखा जाए ।
                </>
              ) : (
                <>
                  12. &nbsp; <u>Personal Search (Jama Talashi)</u> - On personal search of arrested person, the following articles were found, which were taken into custody and receipt issued. If nothing found, mention Nil.
                </>
              )}
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={onAddJamaTalashi}
                className="no-print text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1 shrink-0 ml-2"
              >
                <Plus className="w-3 h-3" /> {isHi ? "सामान जोड़ें" : "Add Item"}
              </button>
            )}
          </div>
          <table className="w-full border-collapse border border-slate-800 text-[12px]">
            <thead>
              <tr className="bg-slate-50 font-bold text-center">
                <th className="border border-slate-800 px-2 py-1.5 w-12 text-center">{isHi ? "क्र.स." : "Sr.No."}</th>
                <th className="border border-slate-800 px-2 py-1.5 text-center w-3/4">
                  {isHi ? "पाए गए सामान का विवरण" : "Description of Articles Found"}
                </th>
                <th className="border border-slate-800 px-2 py-1.5 text-center">
                  {isHi ? "मात्रा/संख्या" : "Quantity / Count"}
                </th>
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
                        title={isHi ? "हटाएं" : "Remove"}
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
              <span>
                {isHi
                  ? "मानवीय गरिमा तथा शारीरिक बचाव हेतू आवश्यक कपडे गिरफ्तार व्यक्ति के शरीर पर रहने दिए गए ।"
                  : "Necessary clothing was retained on arrested person's body for human dignity and bodily protection."}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>
                {isHi
                  ? "शिनाख्त हेतू अपने आप को मुंह ढककर रखने के लिए गिरफ्तार व्यक्ति को सचेत किया गया।"
                  : "The arrested person was cautioned to keep face muffled for identification purposes."}
              </span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="space-y-3 pt-3 text-[12.5px]">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="font-bold shrink-0">
              {isHi
                ? "गिरफ्तार व्यक्ति के हस्ताक्षर या बायें अगूठे का निशान:"
                : "Signature or Left Thumb Impression of Arrested Person:"}
            </span>
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
              <span className="font-bold w-36 shrink-0">
                {isHi ? "गवाह के हस्ताक्षर" : "Witness Signature"}
              </span>
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
            <span className="font-bold shrink-0">
              {isHi
                ? "गिरफ्तार व्यक्ति के हस्ताक्षर या बायें अगूठे का निशान:"
                : "Signature or Left Thumb Impression of Arrested Person:"}
            </span>
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
              <span className="font-bold">{isHi ? "स्थान" : "Place"}</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.signPlace || formData.policeStation || ""}
                onChange={(e) => onChangeField("signPlace", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 w-44"
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold">{isHi ? "दिनांक" : "Date"}</span>
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
            <div className="font-bold text-center underline mb-1">
              {isHi ? "जांच अधिकारी के हस्ताक्षर" : "Signature of Investigating Officer"}
            </div>
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="font-bold">{isHi ? "नाम" : "Name"}</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.officerName || ""}
                onChange={(e) => onChangeField("officerName", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 w-48 text-right font-medium"
              />
            </div>
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="font-bold">{isHi ? "पद" : "Rank"}</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.officerRank || ""}
                onChange={(e) => onChangeField("officerRank", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 w-48 text-right font-medium"
              />
            </div>
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="font-bold">{isHi ? "नम्बर" : "PNO / No."}</span>
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
            {isHi ? "गिरफ्तारी/ न्यायालय में समर्पण फार्म" : "ARREST / SURRENDER IN COURT MEMO"}
          </div>
          <div className="font-bold text-sm text-slate-950">
            {isHi ? "भाग-2" : "PART-2"}
          </div>
          <div className="font-bold text-sm text-slate-950">
            {isHi ? "पहचान पत्र" : "IDENTITY CARD / PARTICULARS"}
          </div>
          <div className="text-xs text-slate-800">
            {isHi ? "(प्रत्येक अभियुक्त के लिए अलग अलग फार्म)" : "(Separate Form for Each Accused)"}
          </div>
        </div>

        {/* Thana / District and Photo Box */}
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-baseline gap-1.5">
              <span className="font-bold shrink-0">{isHi ? "थाना" : "Police Station"}</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.policeStation || ""}
                onChange={(e) => onChangeField("policeStation", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[130px] font-medium"
              />
              <span className="font-bold shrink-0 ml-3">{isHi ? "जिला" : "District"}</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.district || ""}
                onChange={(e) => onChangeField("district", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[130px] font-medium"
              />
            </div>

            <div className="flex flex-wrap items-baseline gap-1.5 pt-1">
              <span className="font-bold shrink-0">{isHi ? "राज्य द्वारा" : "By State"}</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.stateVs || (isHi ? "हरियाणा राज्य" : "State of Haryana")}
                onChange={(e) => onChangeField("stateVs", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-baseline gap-1.5">
              <span className="font-bold shrink-0">{isHi ? "अभियोग संख्या" : "Case / FIR No."}</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.complaintNo || ""}
                onChange={(e) => onChangeField("complaintNo", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 w-24 font-bold text-center"
              />
              <span className="font-bold shrink-0">{isHi ? "दिनांक" : "Date"}</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.issueDate || ""}
                onChange={(e) => onChangeField("issueDate", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 w-24 text-center font-medium"
              />
              <span className="font-bold shrink-0">{isHi ? "धारा" : "Section"}</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.sectionsOfLaw || ""}
                onChange={(e) => onChangeField("sectionsOfLaw", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[90px] font-medium"
              />
              <span className="font-bold shrink-0">{isHi ? "थाना" : "Police Station"}</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.policeStation || ""}
                onChange={(e) => onChangeField("policeStation", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 w-28 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-baseline gap-1.5">
              <span className="font-bold shrink-0">{isHi ? "बनाम:" : "Versus:"}</span>
              <input
                type="text"
                readOnly={readOnly}
                value={
                  formData.noticeeName
                    ? `${formData.noticeeName} ${
                        formData.noticeeFather
                          ? isHi
                            ? `सुपुत्र ${formData.noticeeFather}`
                            : `s/o ${formData.noticeeFather}`
                          : ""
                      }`
                    : ""
                }
                onChange={(e) => onChangeField("noticeeName", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 font-bold"
              />
            </div>
          </div>

          {/* Bordered Photograph Box */}
          <div className="w-28 h-36 border-2 border-slate-800 flex flex-col items-center justify-center text-center p-1.5 shrink-0 bg-slate-50 relative group">
            {formData.photoUrl ? (
              <img
                src={formData.photoUrl}
                alt={isHi ? "आरोपी फोटोग्राफ" : "Accused Photo"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-800 block">
                  {isHi ? "फोटोग्राफ आरोपी" : "Accused Photo"}
                </span>
                <span className="text-[9px] text-slate-500 block">(Passport Size)</span>
              </div>
            )}
            {!readOnly && (
              <label className="no-print absolute inset-0 bg-black/40 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                {isHi ? "फोटो बदलें" : "Change Photo"}
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
            {isHi
              ? "1.  गिरफ्तार व्यक्ति की शारीरिक बनावट, विकृतियाँ एवं अन्य विवरण-"
              : "1.  Physical Build, Deformities and Other Particulars of Arrested Person-"}
          </div>

          <table className="w-full border-collapse border border-slate-800 text-[11px] leading-tight">
            {/* Row 1 Headers */}
            <thead>
              <tr className="bg-slate-50 text-center font-bold">
                <th className="border border-slate-800 p-1.5 w-1/6">{isHi ? "लिंग" : "Gender"}<br />(1)</th>
                <th className="border border-slate-800 p-1.5 w-1/6">{isHi ? "जन्म तिथि / वर्ष" : "DOB / Year"}<br />(2)</th>
                <th className="border border-slate-800 p-1.5 w-1/6">{isHi ? "शारीरिक बनावट" : "Body Build"}<br />(3)</th>
                <th className="border border-slate-800 p-1.5 w-1/6">{isHi ? "कद (सें.मी)" : "Height (cm)"}<br />(4)</th>
                <th className="border border-slate-800 p-1.5 w-1/6">{isHi ? "रंग/ब्लड ग्रुप" : "Color / Blood Grp"}<br />(5)</th>
                <th className="border border-slate-800 p-1.5 w-1/6">{isHi ? "पहचान के चिन्ह" : "ID Marks"}<br />(6)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-9">
                <td className="border border-slate-800 p-1">
                  <input
                    type="text"
                    readOnly={readOnly}
                    value={formData.gender || formData.accusedGender || ""}
                    onChange={(e) => onChangeField("gender", e.target.value)}
                    className="w-full text-center bg-transparent outline-none"
                  />
                </td>
                <td className="border border-slate-800 p-1">
                  <input
                    type="text"
                    readOnly={readOnly}
                    value={formData.dobOrYear || formData.noticeeDob || formData.noticeeAge || ""}
                    onChange={(e) => onChangeField("dobOrYear", e.target.value)}
                    className="w-full text-center bg-transparent outline-none"
                  />
                </td>
                <td className="border border-slate-800 p-1">
                  <input
                    type="text"
                    readOnly={readOnly}
                    value={formData.bodyBuild || formData.trait2Build || ""}
                    onChange={(e) => onChangeField("bodyBuild", e.target.value)}
                    className="w-full text-center bg-transparent outline-none"
                  />
                </td>
                <td className="border border-slate-800 p-1">
                  <input
                    type="text"
                    readOnly={readOnly}
                    value={formData.heightCm || formData.trait1Height || ""}
                    onChange={(e) => onChangeField("heightCm", e.target.value)}
                    className="w-full text-center bg-transparent outline-none"
                  />
                </td>
                <td className="border border-slate-800 p-1">
                  <input
                    type="text"
                    readOnly={readOnly}
                    value={formData.complexionBloodGroup || formData.trait3Color || ""}
                    onChange={(e) => onChangeField("complexionBloodGroup", e.target.value)}
                    className="w-full text-center bg-transparent outline-none"
                  />
                </td>
                <td className="border border-slate-800 p-1">
                  <input
                    type="text"
                    readOnly={readOnly}
                    value={formData.identificationMarks || formData.trait18PehchanChinh || ""}
                    onChange={(e) => onChangeField("identificationMarks", e.target.value)}
                    className="w-full text-center bg-transparent outline-none"
                  />
                </td>
              </tr>

              {/* Row 2 Headers */}
              <tr className="bg-slate-50 text-center font-bold">
                <th className="border border-slate-800 p-1.5">{isHi ? "विकृतियां/ विशेषताएं" : "Deformities"}<br />(7)</th>
                <th className="border border-slate-800 p-1.5">{isHi ? "दाँत" : "Teeth"}<br />(8)</th>
                <th className="border border-slate-800 p-1.5">{isHi ? "बाल" : "Hair"}<br />(9)</th>
                <th className="border border-slate-800 p-1.5">{isHi ? "आंखें" : "Eyes"}<br />(10)</th>
                <th className="border border-slate-800 p-1.5">{isHi ? "आदतें" : "Habits"}<br />(11)</th>
                <th className="border border-slate-800 p-1.5">{isHi ? "पहनावा" : "Dress / Clothing"}<br />(12)</th>
              </tr>
              <tr className="h-9">
                <td className="border border-slate-800 p-1">
                  <input
                    type="text"
                    readOnly={readOnly}
                    value={formData.deformities || formData.trait12Deformities || ""}
                    onChange={(e) => onChangeField("deformities", e.target.value)}
                    className="w-full text-center bg-transparent outline-none"
                  />
                </td>
                <td className="border border-slate-800 p-1">
                  <input
                    type="text"
                    readOnly={readOnly}
                    value={formData.teeth || formData.trait9Teeth || ""}
                    onChange={(e) => onChangeField("teeth", e.target.value)}
                    className="w-full text-center bg-transparent outline-none"
                  />
                </td>
                <td className="border border-slate-800 p-1">
                  <input
                    type="text"
                    readOnly={readOnly}
                    value={formData.hair || formData.trait5Hair || ""}
                    onChange={(e) => onChangeField("hair", e.target.value)}
                    className="w-full text-center bg-transparent outline-none"
                  />
                </td>
                <td className="border border-slate-800 p-1">
                  <input
                    type="text"
                    readOnly={readOnly}
                    value={formData.eyes || formData.trait4Eyes || ""}
                    onChange={(e) => onChangeField("eyes", e.target.value)}
                    className="w-full text-center bg-transparent outline-none"
                  />
                </td>
                <td className="border border-slate-800 p-1">
                  <input
                    type="text"
                    readOnly={readOnly}
                    value={formData.habits || formData.trait16Habits || ""}
                    onChange={(e) => onChangeField("habits", e.target.value)}
                    className="w-full text-center bg-transparent outline-none"
                  />
                </td>
                <td className="border border-slate-800 p-1">
                  <input
                    type="text"
                    readOnly={readOnly}
                    value={formData.dress || formData.trait15Dress || ""}
                    onChange={(e) => onChangeField("dress", e.target.value)}
                    className="w-full text-center bg-transparent outline-none"
                  />
                </td>
              </tr>

              {/* Row 3 Headers */}
              <tr className="bg-slate-50 text-center font-bold">
                <th className="border border-slate-800 p-1.5">{isHi ? "भाषा/बोली" : "Language"}<br />(13)</th>
                <th className="border border-slate-800 p-1.5">{isHi ? "जले हुये का निशान" : "Burn Marks"}<br />(14)</th>
                <th className="border border-slate-800 p-1.5">{isHi ? "ल्यूकोडर्मा/सफेद धब्बे" : "Leukoderma"}<br />(15)</th>
                <th className="border border-slate-800 p-1.5">{isHi ? "मस्सा" : "Mole"}<br />(16)</th>
                <th className="border border-slate-800 p-1.5">{isHi ? "घाव" : "Wound / Scar"}<br />(17)</th>
                <th className="border border-slate-800 p-1.5">{isHi ? "गुदे हुये का निशान" : "Tattoo Marks"}<br />(18)</th>
              </tr>
              <tr className="h-9">
                <td className="border border-slate-800 p-1">
                  <input
                    type="text"
                    readOnly={readOnly}
                    value={formData.languageDialect || formData.trait14Language || ""}
                    onChange={(e) => onChangeField("languageDialect", e.target.value)}
                    className="w-full text-center bg-transparent outline-none"
                  />
                </td>
                <td className="border border-slate-800 p-1">
                  <input
                    type="text"
                    readOnly={readOnly}
                    value={formData.burnMark || ""}
                    onChange={(e) => onChangeField("burnMark", e.target.value)}
                    className="w-full text-center bg-transparent outline-none"
                  />
                </td>
                <td className="border border-slate-800 p-1">
                  <input
                    type="text"
                    readOnly={readOnly}
                    value={formData.leukodermaSpots || ""}
                    onChange={(e) => onChangeField("leukodermaSpots", e.target.value)}
                    className="w-full text-center bg-transparent outline-none"
                  />
                </td>
                <td className="border border-slate-800 p-1">
                  <input
                    type="text"
                    readOnly={readOnly}
                    value={formData.mole || formData.trait10Mole || ""}
                    onChange={(e) => onChangeField("mole", e.target.value)}
                    className="w-full text-center bg-transparent outline-none"
                  />
                </td>
                <td className="border border-slate-800 p-1">
                  <input
                    type="text"
                    readOnly={readOnly}
                    value={formData.wound || formData.trait11Scars || ""}
                    onChange={(e) => onChangeField("wound", e.target.value)}
                    className="w-full text-center bg-transparent outline-none"
                  />
                </td>
                <td className="border border-slate-800 p-1">
                  <input
                    type="text"
                    readOnly={readOnly}
                    value={formData.tattooMark || formData.trait13Tattoo || ""}
                    onChange={(e) => onChangeField("tattooMark", e.target.value)}
                    className="w-full text-center bg-transparent outline-none"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* अन्य लक्षण यदि कोई हो तो */}
        <div className="flex flex-wrap items-baseline gap-1.5 mb-4">
          <span className="font-bold shrink-0">
            {isHi ? "अन्य लक्षण यदि कोई हो तो-" : "Other Characteristics (if any)-"}
          </span>
          <input
            type="text"
            readOnly={readOnly}
            value={formData.otherTraitsDesc || formData.otherTraitsDetails || ""}
            onChange={(e) => onChangeField("otherTraitsDesc", e.target.value)}
            className="border-b border-dotted border-slate-700 outline-none px-1 flex-1"
          />
        </div>

        {/* 2. उंगलियो के निशान लिये गए */}
        <div className="flex flex-wrap items-baseline gap-3 mb-4">
          <span className="font-bold shrink-0">
            {isHi ? "2.  उंगलियो के निशान लिये गए :" : "2.  Fingerprints Taken :"}
          </span>
          <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold">
            <input
              type="radio"
              name="fingerprintsRadio"
              disabled={readOnly}
              checked={
                formData.fingerprintsTaken === "हां" ||
                formData.fingerprintsTaken === "हाँ" ||
                formData.fingerprintsTaken === "Yes"
              }
              onChange={() => onChangeField("fingerprintsTaken", isHi ? "हां" : "Yes")}
            />
            <span>{isHi ? "हां" : "Yes"}</span>
          </label>
          <span className="text-slate-400">/</span>
          <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold">
            <input
              type="radio"
              name="fingerprintsRadio"
              disabled={readOnly}
              checked={
                formData.fingerprintsTaken === "नही" ||
                formData.fingerprintsTaken === "नहीं" ||
                formData.fingerprintsTaken === "No"
              }
              onChange={() => onChangeField("fingerprintsTaken", isHi ? "नही" : "No")}
            />
            <span>{isHi ? "नही" : "No"}</span>
          </label>
        </div>

        {/* 3. गिरफ्तार व्यक्ति की सामाजिक व आर्थिक स्थिति */}
        <div className="space-y-1.5">
          <div className="font-bold">
            {isHi
              ? "3.  गिरफ्तार व्यक्ति की सामाजिक व आर्थिक स्थिति :"
              : "3.  Socio-Economic Status of Arrested Person :"}
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">
              {isHi ? "(क)  जीवन स्तर" : "(a)  Standard of Living"}
            </span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.livingStandard || ""}
              onChange={(e) => onChangeField("livingStandard", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[200px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">
              {isHi ? "(ख)  शैक्षणिक योग्यता" : "(b)  Educational Qualification"}
            </span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.education || ""}
              onChange={(e) => onChangeField("education", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[200px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">
              {isHi ? "(ग)  व्यवसाय" : "(c)  Occupation"}
            </span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.socioOccupation || formData.occupation || ""}
              onChange={(e) => onChangeField("socioOccupation", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[200px]"
            />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 pl-5">
            <span className="font-semibold shrink-0">
              {isHi ? "(घ)  आय वर्ग" : "(d)  Income Group"}
            </span>
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
            {isHi
              ? "4.  जांच पड़ताल एवं ज्ञात पुलिस रिकार्ड के आधार पर ,क्या गिरफ्तार व्यक्ति:"
              : "4.  On the basis of investigation and known police records, is the arrested person:"}
          </div>

          {policeQuestions.map((q) => {
            const currentVal = (formData as any)[q.key];
            const isYes = currentVal === "हाँ" || currentVal === "हां" || currentVal === "Yes";
            const isNo = currentVal === "नही" || currentVal === "नहीं" || currentVal === "No";

            return (
              <div key={q.key} className="flex justify-between items-baseline pl-5 py-0.5 border-b border-slate-100">
                <span className="font-semibold">{q.label}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="inline-flex items-center gap-1 cursor-pointer font-bold">
                    <input
                      type="radio"
                      name={`radio_${q.key}`}
                      disabled={readOnly}
                      checked={isYes}
                      onChange={() => onChangeField(q.key as any, isHi ? "हाँ" : "Yes")}
                    />
                    <span>{isHi ? "हाँ" : "Yes"}</span>
                  </label>
                  <span className="text-slate-400">/</span>
                  <label className="inline-flex items-center gap-1 cursor-pointer font-bold">
                    <input
                      type="radio"
                      name={`radio_${q.key}`}
                      disabled={readOnly}
                      checked={isNo}
                      onChange={() => onChangeField(q.key as any, isHi ? "नही" : "No")}
                    />
                    <span>{isHi ? "नही" : "No"}</span>
                  </label>
                </div>
              </div>
            );
          })}

          <div className="flex flex-wrap items-baseline gap-1.5 pl-5 pt-1">
            <span className="font-semibold shrink-0">
              {isHi ? "(झ)  किसी अन्य अपराध में वांछित हैं :" : "(i)  Wanted in any other crime :"}
            </span>
            <input
              type="text"
              readOnly={readOnly}
              value={formData.wantedInOtherCrime || ""}
              onChange={(e) => onChangeField("wantedInOtherCrime", e.target.value)}
              className="border-b border-dotted border-slate-700 outline-none px-1 flex-1 min-w-[200px]"
            />
          </div>

          <div className="space-y-1 pl-5 pt-1 text-[12px] text-slate-800">
            <div>
              {isHi
                ? "यदि ख,ङ, अथवा झ का उत्तर हाँ है तो मामला संदर्भ / धाराओ का उल्लेख करे , यदि आवश्यक हो तो अलग से पृष्ठ नत्थी करें"
                : "If answer to (b), (e) or (i) is Yes, mention case reference / sections of law; attach separate sheet if necessary:"}
            </div>
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
              <span className="font-bold">{isHi ? "स्थान" : "Place"}</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.signPlace || formData.policeStation || ""}
                onChange={(e) => onChangeField("signPlace", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 w-44"
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold">{isHi ? "दिनांक" : "Date"}</span>
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
            <div className="font-bold text-center underline mb-1">
              {isHi ? "जांच अधिकारी के हस्ताक्षर" : "Signature of Investigating Officer"}
            </div>
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="font-bold">{isHi ? "नाम" : "Name"}</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.officerName || ""}
                onChange={(e) => onChangeField("officerName", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 w-48 text-right font-medium"
              />
            </div>
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="font-bold">{isHi ? "पद" : "Rank"}</span>
              <input
                type="text"
                readOnly={readOnly}
                value={formData.officerRank || ""}
                onChange={(e) => onChangeField("officerRank", e.target.value)}
                className="border-b border-dotted border-slate-700 outline-none px-1 w-48 text-right font-medium"
              />
            </div>
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="font-bold">{isHi ? "नम्बर" : "PNO / No."}</span>
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
            {isHi ? "केवल मोहर्रर थाना के प्रयोग हेतू :" : "For Use of Police Station Moharrir (MHC) Only :"}
          </div>

          <div className="space-y-1.5">
            <div className="font-bold">
              {isHi
                ? "5.  आरोपी का पूर्व आपराधिक रिकार्ड : (ICJS /Eagle/गृह थाना के रिकॉर्ड अनुसार )"
                : "5.  Previous Criminal Record of Accused : (As per ICJS / Eagle / Home Station Records)"}
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
            <span className="font-bold shrink-0">
              {isHi
                ? "6.  Eagle Software अनुसार अपराधी का Criminal ID No."
                : "6.  Criminal ID No. of Accused as per Eagle Software"}
            </span>
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
              <div className="font-bold text-center underline mb-1">
                {isHi ? "मोहर्रर थाना के हस्ताक्षर" : "Signature of Moharrir Head Constable (MHC)"}
              </div>
              <div className="flex items-baseline justify-end gap-1.5">
                <span className="font-bold">{isHi ? "नाम" : "Name"}</span>
                <input
                  type="text"
                  readOnly={readOnly}
                  value={formData.mhcName || ""}
                  onChange={(e) => onChangeField("mhcName", e.target.value)}
                  className="border-b border-dotted border-slate-700 outline-none px-1 w-48 text-right font-medium"
                />
              </div>
              <div className="flex items-baseline justify-end gap-1.5">
                <span className="font-bold">{isHi ? "पद" : "Rank"}</span>
                <input
                  type="text"
                  readOnly={readOnly}
                  value={formData.mhcRank || ""}
                  onChange={(e) => onChangeField("mhcRank", e.target.value)}
                  className="border-b border-dotted border-slate-700 outline-none px-1 w-48 text-right font-medium"
                />
              </div>
              <div className="flex items-baseline justify-end gap-1.5">
                <span className="font-bold">{isHi ? "नम्बर" : "Belt No. / PNO"}</span>
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
export function generateArrestMemo4PageHtml(
  formData: ArrestDocsFormData,
  fir?: FIRItem,
  language: "hi" | "en" = "hi"
): string {
  const isHi = language !== "en";
  const safeVal = (v?: any) => (v ? String(v).replace(/"/g, "&quot;") : "");

  const witnessRows =
    formData.arrestWitnesses && formData.arrestWitnesses.length > 0
      ? formData.arrestWitnesses
      : [
          { id: "1", name: "", address: "", signature: "" },
          { id: "2", name: "", address: "", signature: "" },
          { id: "3", name: "", address: "", signature: "" },
        ];

  const jamaTalashiRows =
    formData.jamaTalashiItems && formData.jamaTalashiItems.length > 0
      ? formData.jamaTalashiItems
      : [
          { id: "1", srNo: "1.", description: "", quantity: "" },
          { id: "2", srNo: "2.", description: "", quantity: "" },
          { id: "3", srNo: "3.", description: "", quantity: "" },
        ];

  const policeQuestions = isHi
    ? [
        { key: "isDangerous", label: "(क)  खतरनाक है :" },
        { key: "escapedBailEarlier", label: "(ख)  पूर्व में किसी जमानत से बच निकला है :" },
        { key: "carriesWeapon", label: "(ग)  आमतौर पर शस्त्र रखता है :" },
        { key: "activeWithAssociates", label: "(घ)  सहयोगियो सहित क्रियाशील है :" },
        { key: "isListedCriminal", label: "(ङ)  ज्ञात/ सूचिबद्ध अपराधी है या नही:" },
        { key: "isHabitualCriminal", label: "(च)  आदतन अपराधी है या नही:" },
        { key: "escapeRiskDuringBail", label: "(छ)  जमानत के दौरान बच निकलने की सम्भावना है:" },
        {
          key: "threatRiskAfterBail",
          label: "(ज)  जमानत पर रिहा होने के बाद अपराध करने या पीडितो / गवाहो को धमकाने की सम्भावना है :",
        },
      ]
    : [
        { key: "isDangerous", label: "(a)  Dangerous :" },
        { key: "escapedBailEarlier", label: "(b)  Previously escaped / jumped bail :" },
        { key: "carriesWeapon", label: "(c)  Habitually carries weapons :" },
        { key: "activeWithAssociates", label: "(d)  Operates with active associates / gang :" },
        { key: "isListedCriminal", label: "(e)  Known / listed criminal :" },
        { key: "isHabitualCriminal", label: "(f)  Habitual criminal :" },
        { key: "escapeRiskDuringBail", label: "(g)  Likelihood of absconding during bail :" },
        {
          key: "threatRiskAfterBail",
          label: "(h)  Likelihood of committing crime or threatening victims/witnesses on bail :",
        },
      ];

  const pageTitle = isHi
    ? `गिरफ्तारी/ न्यायालय में समर्पण फार्म संख्या 26.8(1) - ${safeVal(fir?.firNumber || formData.complaintNo)}`
    : `Arrest / Surrender in Court Memo Form 26.8(1) - ${safeVal(fir?.firNumber || formData.complaintNo)}`;

  return `<!DOCTYPE html>
<html lang="${isHi ? "hi" : "en"}">
<head>
  <meta charset="utf-8" />
  <title>${pageTitle}</title>
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
      <div style="font-size: 13pt; font-weight: bold;">${isHi ? "गिरफ्तारी/ न्यायालय में समर्पण फार्म" : "ARREST / SURRENDER IN COURT MEMO"}</div>
      <div style="font-size: 11pt; font-weight: bold;">${isHi ? "भाग-1" : "PART-1"}</div>
      <div style="font-size: 11pt; font-weight: bold;">${isHi ? "फार्म संख्या 26.8(1)" : "FORM NO. 26.8(1)"}</div>
      <div style="font-size: 9.5pt;">${isHi ? "(प्रत्येक अभियुक्त के लिए अलग अलग फार्म)" : "(Separate Form for Each Accused)"}</div>
    </div>

    <!-- 1 -->
    <div class="row">
      <span class="font-bold">1. &nbsp; ${isHi ? "जिला" : "District"}</span>
      <span class="dotted-line" style="min-width: 130px;">${safeVal(formData.district)}</span>
      <span class="font-bold">${isHi ? "थाना" : "Police Station"}</span>
      <span class="dotted-line" style="min-width: 150px;">${safeVal(formData.policeStation)}</span>
      <span class="font-bold">${isHi ? "वर्ष" : "Year"}</span>
      <span class="dotted-line" style="min-width: 80px; text-align: center;">${safeVal(formData.arrestYear || "2026")}</span>
    </div>
    <div class="row indent">
      <span class="font-bold">${isHi ? "FIR/ रोजनामचा रपट संख्या" : "FIR / GD Entry No."}</span>
      <span class="dotted-line" style="min-width: 180px; font-weight: bold;">${safeVal(formData.complaintNo)}</span>
      <span class="font-bold">${isHi ? "दिनांक" : "Date"}</span>
      <span class="dotted-line" style="min-width: 120px; text-align: center;">${safeVal(formData.issueDate)}</span>
    </div>

    <!-- 2 -->
    <div class="row" style="margin-top: 8px;">
      <span class="font-bold">2. &nbsp; ${isHi ? "गिरफ्तारी/ आत्म समर्पण की तिथि व समय : दिनांक" : "Date & Time of Arrest / Surrender : Date"}</span>
      <span class="dotted-line" style="min-width: 110px; text-align: center;">${safeVal(formData.arrestDate)}</span>
      <span class="font-bold">${isHi ? "समय" : "Time"}</span>
      <span class="dotted-line" style="min-width: 120px;">${safeVal(formData.arrestTime)}</span>
    </div>
    <div class="row indent">
      <span class="font-bold">${isHi ? "रोजनामचा रपट संख्या" : "GD Entry No."}</span>
      <span class="dotted-line" style="min-width: 160px;">${safeVal(formData.arrestGdNo)}</span>
      <span class="font-bold">${isHi ? "गिरफ्तारी का स्थान" : "Place of Arrest"}</span>
      <span class="dotted-line" style="min-width: 160px;">${safeVal(formData.arrestPlace)}</span>
    </div>
    <div class="row indent">
      <span class="dotted-line" style="min-width: 160px;">${safeVal(formData.arrestThana || formData.policeStation)}</span>
      <span class="font-bold">${isHi ? "थाना" : "Police Station"}</span>
      <span class="dotted-line" style="min-width: 160px;">${safeVal(formData.arrestDistrict || formData.district)}</span>
      <span class="font-bold">${isHi ? "जिला" : "District"}</span>
    </div>

    <!-- 3 -->
    <div class="row" style="margin-top: 8px;">
      <span class="font-bold">3. &nbsp; ${isHi ? "न्यायालय का नाम ( यदि आत्मसमर्पण किया हो)" : "Name of Court (If Surrendered)"}</span>
      <span class="dotted-line" style="flex: 1;">${safeVal(formData.courtNameSurrender)}</span>
    </div>

    <!-- 4 -->
    <div class="row" style="margin-top: 8px;">
      <span class="font-bold">4. &nbsp; ${isHi ? "अधिनियम एवं धाराएं" : "Acts & Sections"}</span>
      <span class="dotted-line" style="flex: 1; font-weight: bold;">${safeVal(formData.sectionsOfLaw)}</span>
    </div>

    <!-- 5 -->
    <div style="margin-top: 8px;">
      <div class="font-bold">${isHi ? "5.  गिरफ्तार व्यक्ति का विवरण :-" : "5.  Particulars of Arrested Person :-"}</div>
      <div class="row indent">
        <span class="font-semibold">${isHi ? "(i)  नाम" : "(i)  Name"}</span>
        <span class="dotted-line" style="flex: 1; font-weight: bold;">${safeVal(formData.noticeeName)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">${isHi ? "(ii)  पिता/पति/संरक्षक का नाम" : "(ii)  Father's / Husband's / Guardian's Name"}</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.noticeeFather)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">${isHi ? "(iii)  प्रथम उपनाम" : "(iii)  Primary Alias / Nickname"}</span>
        <span class="dotted-line" style="min-width: 130px;">${safeVal(formData.noticeeAlias1)}</span>
        <span class="font-semibold">${isHi ? "(iv) द्वितीय उपनाम" : "(iv) Secondary Alias"}</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.noticeeAlias2)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">${isHi ? "(v)  राष्ट्रीयता" : "(v)  Nationality"}</span>
        <span class="dotted-line" style="min-width: 110px;">${safeVal(formData.noticeeNationality || (isHi ? "भारतीय" : "Indian"))}</span>
        <span class="font-semibold">${isHi ? "(vi) (क) मतदाता या अन्य पहचान पत्र संख्या" : "(vi) (a) Voter ID or Other ID Card No."}</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.voterIdOrOtherId)}</span>
      </div>
      <div class="row indent-deep">
        <span class="font-semibold">${isHi ? "(ख) पासपोर्ट संख्या" : "(b) Passport No."}</span>
        <span class="dotted-line" style="min-width: 130px;">${safeVal(formData.passportNo)}</span>
        <span class="font-semibold">${isHi ? "(ग) जारी करने की तिथि" : "(c) Date of Issue"}</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.passportIssueDate)}</span>
      </div>
      <div class="row indent-deep">
        <span class="font-semibold">${isHi ? "(घ) जारी करने का स्थान" : "(d) Place of Issue"}</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.passportIssuePlace)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">${isHi ? "(vii)  धर्म" : "(vii)  Religion"}</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.religion)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">${isHi ? "(viii) अनुसूचित जाति/अनुसूचित जनजाति/ अन्य पिछड़ा वर्ग/ सामान्य" : "(viii) SC / ST / OBC / General"}</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.casteCategory)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">${isHi ? "(ix)  व्यवसाय" : "(ix)  Occupation"}</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.occupation)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">${isHi ? "(x)  स्थाई पता" : "(x)  Permanent Address"}</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.noticeeAddress)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">${isHi ? "(xi)  वर्तमान पता" : "(xi)  Present Address"}</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.currentAddress || formData.noticeeAddress)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">${isHi ? "(xii)  मोबाईल नम्बर" : "(xii)  Mobile Number"}</span>
        <span class="dotted-line" style="min-width: 150px;">${safeVal(formData.noticeePhone)}</span>
        <span class="font-semibold">${isHi ? "(xiii) फोन नम्बर" : "(xiii) Landline Phone No."}</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.phoneLandline)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">${isHi ? "(xiv)  उपयोगकर्ता पहचान संख्या" : "(xiv)  User Identification No. (Aadhaar / ID)"}</span>
        <span class="dotted-line" style="min-width: 150px;">${safeVal(formData.userIdentificationNo)}</span>
        <span class="font-semibold">${isHi ? "(xv) स्थाई खाता संख्या" : "(xv) PAN Number"}</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.panNumber)}</span>
      </div>
    </div>

    <!-- 6 -->
    <div style="margin-top: 8px;">
      <div class="font-bold">
        ${isHi
          ? "6.  गिरफ्तार व्यक्ति की शारीरिक दशा/ यदि कोई चोट लगी हो तो चोट तथा उसके कारण /कारणों का विवरण (यदि डॉक्टरी जांच करवाई गई हो तो उल्लेख करे)"
          : "6.  Physical condition of arrested person / Details of any injuries and causes thereof (Mention if medical exam was conducted)"}
      </div>
      <div class="dotted-line" style="width: 100%; margin-top: 4px;">
        ${safeVal(formData.physicalConditionOrInjuries)}
      </div>
    </div>

    <!-- 7 -->
    <div style="margin-top: 8px;">
      <div class="row">
        <span class="font-bold">
          ${isHi
            ? "7.  गिरफ्तार व्यक्ति को उसकी गिरफ्तार का कारण और उसके कानूनी अधिकार को बताते हुए दिनांक"
            : "7.  The arrested person was taken into custody after intimating grounds of arrest and legal rights on Date"}
        </span>
        <span class="dotted-line" style="min-width: 120px; text-align: center;">${safeVal(formData.custodyIntimationDate || formData.arrestDate)}</span>
      </div>
      <div class="row indent">
        <span class="font-bold">${isHi ? "समय" : "Time"}</span>
        <span class="dotted-line" style="min-width: 110px; text-align: center;">${safeVal(formData.custodyIntimationTime || formData.arrestTime)}</span>
        <span class="font-bold">${isHi ? "स्थान" : "from Place"}</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.custodyPlace || formData.arrestPlace)}</span>
        <span class="font-bold">${isHi ? "से हिरासत में लिया गया ।" : "."}</span>
      </div>
    </div>

    <!-- 8 -->
    <div style="margin-top: 8px;">
      <div class="font-bold">
        ${isHi ? "8.  गवाहो के नाम और पता (कम से कम दो गवाह आवश्यक हैं) :-" : "8.  Names and Addresses of Witnesses (Minimum two witnesses required) :-"}
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 45px; text-align: center;">${isHi ? "क्र.स." : "Sr.No."}</th>
            <th style="text-align: center; width: 35%;">${isHi ? "नाम" : "Name"}</th>
            <th style="text-align: center; width: 45%;">${isHi ? "पता" : "Address"}</th>
            <th style="text-align: center;">${isHi ? "हस्ताक्षर" : "Signature"}</th>
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
        <span class="font-bold">9. &nbsp; ${isHi ? "वारिसान" : "Next of Kin / Relative"}</span>
        <span class="dotted-line" style="min-width: 150px;">${safeVal(formData.warisanName || formData.relativeName)}</span>
        <span class="font-bold">${isHi ? "सम्बन्ध" : "Relation"}</span>
        <span class="dotted-line" style="min-width: 120px;">${safeVal(formData.warisanRelation || formData.relativeRelation)}</span>
        <span class="font-bold">${isHi ? "दिनांक" : "Date"}</span>
        <span class="dotted-line" style="min-width: 110px; text-align: center;">${safeVal(formData.warisanDate || formData.intimationDate)}</span>
      </div>
      <div class="row indent">
        <span class="font-bold">${isHi ? "समय पर" : "Time"}</span>
        <span class="dotted-line" style="min-width: 110px; text-align: center;">${safeVal(formData.warisanTime || formData.intimationTime)}</span>
        <span class="font-bold">${isHi ? "मोबाईल नम्बर" : "Mobile Number"}</span>
        <span class="dotted-line" style="min-width: 160px;">${safeVal(formData.warisanMobile || formData.relativeMobile)}</span>
        <span class="font-bold">${isHi ? "पर सूचना दी गई ।" : "intimation was served."}</span>
      </div>
    </div>

    <!-- 10 -->
    <div style="margin-bottom: 14px;">
      <div class="font-bold">${isHi ? "10.  आरोपी के पारिवारिक सदस्यो का विवरण" : "10.  Details of Family Members of Accused"}</div>
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
      <div class="font-bold">${isHi ? "11.  आरोपी के गिरफ्तारी करने के आधार (47 BNSS) -" : "11.  Grounds of Arrest of Accused (Section 47 BNSS) -"}</div>
      <div class="row indent">
        <span class="font-semibold">
          ${isHi ? "(क)  धाराएं जिनके तहत आरोपी द्वारा अपराध किया गया है" : "(a)  Sections under which offence is committed by accused"}
        </span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.groundsSections || formData.sectionsOfLaw)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">
          ${isHi ? "(ख)  इन अपराधों में आरोपी की विशिष्ट भूमिका" : "(b)  Specific role of accused in these offences"}
        </span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.groundsRole)}</span>
      </div>
      <div class="indent" style="margin-top: 4px;">
        <div class="font-semibold">
          ${isHi
            ? "(ग)  इन अपराधों में अपराधी की संलिप्तता वाले आधार (जैसे कि प्रत्यक्षदर्शी का बयान, BNSS 180/183 का बयान, CCTV/ Audio Recording, बरामदगी, फर्द इंकेसाफ इत्यादि)"
            : "(c)  Grounds showing complicity of culprit in offences (e.g., eyewitness statement, statement u/s 180/183 BNSS, CCTV / Audio recording, recovery, disclosure memo, etc.)"}
        </div>
        <div class="dotted-line" style="width: 100%; min-height: 22px; margin-top: 4px;">${safeVal(formData.groundsEvidence)}</div>
      </div>
      <div class="row indent" style="margin-top: 4px;">
        <span class="font-semibold">${isHi ? "(घ)  अन्य आधार" : "(d)  Other grounds"}</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.groundsOther)}</span>
      </div>
    </div>

    <!-- 12 -->
    <div style="margin-bottom: 16px;">
      <div class="font-bold">
        ${isHi ? (
          "12.  <u>जामा तलाशी</u> - गिरफ्तार व्यक्ति की जामा तलाशी लेने पर निम्नलिखित सामान पाया, जिसे कब्जे में लेकर रसीद दी गई । यदि कुछ भी सामान नही पाया तो कुछ भी नही लिखा जाए ।"
        ) : (
          "12.  <u>Personal Search (Jama Talashi)</u> - On personal search of arrested person, the following articles were found, which were taken into custody and receipt issued. If nothing found, mention Nil."
        )}
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 45px; text-align: center;">${isHi ? "क्र.स." : "Sr.No."}</th>
            <th style="text-align: center; width: 75%;">${isHi ? "पाए गए सामान का विवरण" : "Description of Articles Found"}</th>
            <th style="text-align: center;">${isHi ? "मात्रा/संख्या" : "Quantity / Count"}</th>
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
        <div>• ${isHi ? "मानवीय गरिमा तथा शारीरिक बचाव हेतू आवश्यक कपडे गिरफ्तार व्यक्ति के शरीर पर रहने दिए गए ।" : "Necessary clothing was retained on arrested person's body for human dignity and bodily protection."}</div>
        <div>• ${isHi ? "शिनाख्त हेतू अपने आप को मुंह ढककर रखने के लिए गिरफ्तार व्यक्ति को सचेत किया गया।" : "The arrested person was cautioned to keep face muffled for identification purposes."}</div>
      </div>
    </div>

    <!-- Signatures -->
    <div style="margin-top: 24px; font-size: 10.5pt; line-height: 1.8;">
      <div class="row">
        <span class="font-bold">${isHi ? "गिरफ्तार व्यक्ति के हस्ताक्षर या बायें अगूठे का निशान:" : "Signature or Left Thumb Impression of Arrested Person:"}</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.accusedSign1)}</span>
      </div>
      <div style="margin-top: 6px;">
        <div class="row">
          <span class="font-bold" style="width: 140px;">${isHi ? "गवाह के हस्ताक्षर" : "Witness Signature"}</span>
          <span class="font-semibold">1.</span>
          <span class="dotted-line" style="flex: 1;">${safeVal(formData.witnessSign1)}</span>
        </div>
        <div class="row" style="padding-left: 140px;">
          <span class="font-semibold">2.</span>
          <span class="dotted-line" style="flex: 1;">${safeVal(formData.witnessSign2)}</span>
        </div>
      </div>
      <div class="row" style="margin-top: 6px;">
        <span class="font-bold">${isHi ? "गिरफ्तार व्यक्ति के हस्ताक्षर या बायें अगूठे का निशान:" : "Signature or Left Thumb Impression of Arrested Person:"}</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.accusedSign2)}</span>
      </div>
    </div>

    <!-- Footer -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px;">
      <div>
        <div class="row">
          <span class="font-bold">${isHi ? "स्थान" : "Place"}</span>
          <span class="dotted-line" style="min-width: 140px;">${safeVal(formData.signPlace || formData.policeStation)}</span>
        </div>
        <div class="row">
          <span class="font-bold">${isHi ? "दिनांक" : "Date"}</span>
          <span class="dotted-line" style="min-width: 140px;">${safeVal(formData.signDate || formData.issueDate)}</span>
        </div>
      </div>
      <div class="text-right">
        <div class="font-bold underline text-center" style="margin-bottom: 4px;">
          ${isHi ? "जांच अधिकारी के हस्ताक्षर" : "Signature of Investigating Officer"}
        </div>
        <div class="row" style="justify-content: flex-end;">
          <span class="font-bold">${isHi ? "नाम" : "Name"}</span>
          <span class="dotted-line" style="min-width: 160px; text-align: right;">${safeVal(formData.officerName)}</span>
        </div>
        <div class="row" style="justify-content: flex-end;">
          <span class="font-bold">${isHi ? "पद" : "Rank"}</span>
          <span class="dotted-line" style="min-width: 160px; text-align: right;">${safeVal(formData.officerRank)}</span>
        </div>
        <div class="row" style="justify-content: flex-end;">
          <span class="font-bold">${isHi ? "नम्बर" : "PNO / No."}</span>
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
      <div style="font-size: 13pt; font-weight: bold;">${isHi ? "गिरफ्तारी/ न्यायालय में समर्पण फार्म" : "ARREST / SURRENDER IN COURT MEMO"}</div>
      <div style="font-size: 11pt; font-weight: bold;">${isHi ? "भाग-2" : "PART-2"}</div>
      <div style="font-size: 11pt; font-weight: bold;">${isHi ? "पहचान पत्र" : "IDENTITY CARD / PARTICULARS"}</div>
      <div style="font-size: 9.5pt;">${isHi ? "(प्रत्येक अभियुक्त के लिए अलग अलग फार्म)" : "(Separate Form for Each Accused)"}</div>
    </div>

    <!-- Thana, District & Photo -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 14px;">
      <div style="flex: 1;">
        <div class="row">
          <span class="font-bold">${isHi ? "थाना" : "Police Station"}</span>
          <span class="dotted-line" style="min-width: 140px;">${safeVal(formData.policeStation)}</span>
          <span class="font-bold" style="margin-left: 12px;">${isHi ? "जिला" : "District"}</span>
          <span class="dotted-line" style="min-width: 140px;">${safeVal(formData.district)}</span>
        </div>
        <div class="row" style="margin-top: 6px;">
          <span class="font-bold">${isHi ? "राज्य द्वारा" : "By State"}</span>
          <span class="dotted-line" style="flex: 1;">${safeVal(formData.stateVs || (isHi ? "हरियाणा राज्य" : "State of Haryana"))}</span>
        </div>
        <div class="row" style="margin-top: 6px;">
          <span class="font-bold">${isHi ? "अभियोग संख्या" : "Case / FIR No."}</span>
          <span class="dotted-line" style="min-width: 80px; text-align: center; font-weight: bold;">${safeVal(formData.complaintNo)}</span>
          <span class="font-bold">${isHi ? "दिनांक" : "Date"}</span>
          <span class="dotted-line" style="min-width: 80px; text-align: center;">${safeVal(formData.issueDate)}</span>
          <span class="font-bold">${isHi ? "धारा" : "Section"}</span>
          <span class="dotted-line" style="min-width: 100px;">${safeVal(formData.sectionsOfLaw)}</span>
          <span class="font-bold">${isHi ? "थाना" : "Police Station"}</span>
          <span class="dotted-line" style="min-width: 90px;">${safeVal(formData.policeStation)}</span>
        </div>
        <div class="row" style="margin-top: 6px;">
          <span class="font-bold">${isHi ? "बनाम:" : "Versus:"}</span>
          <span class="dotted-line" style="flex: 1; font-weight: bold;">
            ${safeVal(
              formData.noticeeName
                ? `${formData.noticeeName} ${
                    formData.noticeeFather
                      ? isHi
                        ? `सुपुत्र ${formData.noticeeFather}`
                        : `s/o ${formData.noticeeFather}`
                      : ""
                  }`
                : ""
            )}
          </span>
        </div>
      </div>
      <div class="photo-box">
        ${
          formData.photoUrl
            ? `<img src="${formData.photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" />`
            : safeVal(isHi ? "फोटोग्राफ आरोपी" : "Accused Photo")
        }
      </div>
    </div>

    <!-- 1. शारीरिक बनावट Table -->
    <div style="margin-bottom: 12px;">
      <div class="font-bold">
        ${isHi
          ? "1.  गिरफ्तार व्यक्ति की शारीरिक बनावट, विकृतियाँ एवं अन्य विवरण-"
          : "1.  Physical Build, Deformities and Other Particulars of Arrested Person-"}
      </div>
      <table>
        <thead>
          <tr style="text-align: center;">
            <th>${isHi ? "लिंग" : "Gender"}<br />(1)</th>
            <th>${isHi ? "जन्म तिथि / वर्ष" : "DOB / Year"}<br />(2)</th>
            <th>${isHi ? "शारीरिक बनावट" : "Body Build"}<br />(3)</th>
            <th>${isHi ? "कद (सें.मी)" : "Height (cm)"}<br />(4)</th>
            <th>${isHi ? "रंग/ब्लड ग्रुप" : "Color / Blood Grp"}<br />(5)</th>
            <th>${isHi ? "पहचान के चिन्ह" : "ID Marks"}<br />(6)</th>
          </tr>
        </thead>
        <tbody>
          <tr style="text-align: center; height: 32px;">
            <td>${safeVal(formData.gender || formData.accusedGender)}</td>
            <td>${safeVal(formData.dobOrYear || formData.noticeeDob || formData.noticeeAge)}</td>
            <td>${safeVal(formData.bodyBuild || formData.trait2Build)}</td>
            <td>${safeVal(formData.heightCm || formData.trait1Height)}</td>
            <td>${safeVal(formData.complexionBloodGroup || formData.trait3Color)}</td>
            <td>${safeVal(formData.identificationMarks || formData.trait18PehchanChinh)}</td>
          </tr>
          <tr style="text-align: center; background: #f8fafc; font-weight: bold;">
            <td>${isHi ? "विकृतियां/ विशेषताएं" : "Deformities"}<br />(7)</td>
            <td>${isHi ? "दाँत" : "Teeth"}<br />(8)</td>
            <td>${isHi ? "बाल" : "Hair"}<br />(9)</td>
            <td>${isHi ? "आंखें" : "Eyes"}<br />(10)</td>
            <td>${isHi ? "आदतें" : "Habits"}<br />(11)</td>
            <td>${isHi ? "पहनावा" : "Dress / Attire"}<br />(12)</td>
          </tr>
          <tr style="text-align: center; height: 32px;">
            <td>${safeVal(formData.deformities || formData.trait12Deformities)}</td>
            <td>${safeVal(formData.teeth || formData.trait9Teeth)}</td>
            <td>${safeVal(formData.hair || formData.trait5Hair)}</td>
            <td>${safeVal(formData.eyes || formData.trait4Eyes)}</td>
            <td>${safeVal(formData.habits || formData.trait16Habits)}</td>
            <td>${safeVal(formData.dress || formData.trait15Dress)}</td>
          </tr>
          <tr style="text-align: center; background: #f8fafc; font-weight: bold;">
            <td>${isHi ? "भाषा/बोली" : "Language"}<br />(13)</td>
            <td>${isHi ? "जले हुये का निशान" : "Burn Marks"}<br />(14)</td>
            <td>${isHi ? "ल्यूकोडर्मा/सफेद धब्बे" : "Leukoderma"}<br />(15)</td>
            <td>${isHi ? "मस्सा" : "Mole"}<br />(16)</td>
            <td>${isHi ? "घाव" : "Wound / Scar"}<br />(17)</td>
            <td>${isHi ? "गुदे हुये का निशान" : "Tattoo Marks"}<br />(18)</td>
          </tr>
          <tr style="text-align: center; height: 32px;">
            <td>${safeVal(formData.languageDialect || formData.trait14Language)}</td>
            <td>${safeVal(formData.burnMark)}</td>
            <td>${safeVal(formData.leukodermaSpots)}</td>
            <td>${safeVal(formData.mole || formData.trait10Mole)}</td>
            <td>${safeVal(formData.wound || formData.trait11Scars)}</td>
            <td>${safeVal(formData.tattooMark || formData.trait13Tattoo)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="row" style="margin-bottom: 12px;">
      <span class="font-bold">${isHi ? "अन्य लक्षण यदि कोई हो तो-" : "Other Characteristics (if any)-"}</span>
      <span class="dotted-line" style="flex: 1;">${safeVal(formData.otherTraitsDesc || formData.otherTraitsDetails)}</span>
    </div>

    <!-- 2 -->
    <div class="row" style="margin-bottom: 12px;">
      <span class="font-bold">${isHi ? "2.  उंगलियो के निशान लिये गए :  " : "2.  Fingerprints Taken :  "}</span>
      <span class="font-bold" style="border: 1px solid #000; padding: 1px 6px;">
        ${
          formData.fingerprintsTaken === "हां" ||
          formData.fingerprintsTaken === "हाँ" ||
          formData.fingerprintsTaken === "Yes"
            ? isHi ? "✓ हां" : "✓ Yes"
            : isHi ? "हां" : "Yes"
        }
      </span>
      <span>/</span>
      <span class="font-bold" style="border: 1px solid #000; padding: 1px 6px;">
        ${
          formData.fingerprintsTaken === "नही" ||
          formData.fingerprintsTaken === "नहीं" ||
          formData.fingerprintsTaken === "No"
            ? isHi ? "✓ नही" : "✓ No"
            : isHi ? "नही" : "No"
        }
      </span>
    </div>

    <!-- 3 -->
    <div>
      <div class="font-bold">${isHi ? "3.  गिरफ्तार व्यक्ति की सामाजिक व आर्थिक स्थिति :" : "3.  Socio-Economic Status of Arrested Person :"}</div>
      <div class="row indent">
        <span class="font-semibold">${isHi ? "(क)  जीवन स्तर" : "(a)  Standard of Living"}</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.livingStandard)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">${isHi ? "(ख)  शैक्षणिक योग्यता" : "(b)  Educational Qualification"}</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.education)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">${isHi ? "(ग)  व्यवसाय" : "(c)  Occupation"}</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.socioOccupation || formData.occupation)}</span>
      </div>
      <div class="row indent">
        <span class="font-semibold">${isHi ? "(घ)  आय वर्ग" : "(d)  Income Group"}</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.incomeGroup)}</span>
      </div>
    </div>
  </div>

  <!-- ================= PAGE 4 ================= -->
  <div class="a4-page">
    <div class="font-bold" style="margin-bottom: 8px;">
      ${isHi
        ? "4.  जांच पड़ताल एवं ज्ञात पुलिस रिकार्ड के आधार पर ,क्या गिरफ्तार व्यक्ति:"
        : "4.  On the basis of investigation and known police records, is the arrested person:"}
    </div>

    <div style="font-size: 10.5pt; line-height: 1.7; margin-bottom: 14px;">
      ${policeQuestions
        .map((q) => {
          const val = (formData as any)[q.key];
          const isYes = val === "हाँ" || val === "हां" || val === "Yes";
          const isNo = val === "नही" || val === "नहीं" || val === "No";
          const yesLabel = isHi ? "हाँ" : "Yes";
          const noLabel = isHi ? "नही" : "No";

          return `
            <div style="display: flex; justify-content: space-between; padding-left: 20px; border-bottom: 1px dotted #e2e8f0; padding-top: 2px; padding-bottom: 2px;">
              <span class="font-semibold">${q.label}</span>
              <span class="font-bold">${
                isYes
                  ? `<b>[ ${yesLabel} ]</b> &nbsp; ${noLabel}`
                  : isNo
                  ? `${yesLabel} &nbsp; <b>[ ${noLabel} ]</b>`
                  : `${yesLabel} / ${noLabel}`
              }</span>
            </div>
          `;
        })
        .join("")}

      <div class="row indent" style="margin-top: 6px;">
        <span class="font-semibold">${isHi ? "(झ)  किसी अन्य अपराध में वांछित हैं :" : "(i)  Wanted in any other crime :"}</span>
        <span class="dotted-line" style="flex: 1;">${safeVal(formData.wantedInOtherCrime)}</span>
      </div>

      <div class="indent" style="margin-top: 6px; font-size: 9.5pt;">
        <div>${isHi ? "यदि ख,ङ, अथवा झ का उत्तर हाँ है तो मामला संदर्भ / धाराओ का उल्लेख करे , यदि आवश्यक हो तो अलग से पृष्ठ नत्थी करें" : "If answer to (b), (e) or (i) is Yes, mention case reference / sections of law; attach separate sheet if necessary:"}</div>
        <div class="dotted-line" style="width: 100%; min-height: 22px; margin-top: 4px;">${safeVal(formData.caseReferenceIfYes)}</div>
      </div>
    </div>

    <!-- IO Signatures -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 10px; padding-bottom: 14px; border-bottom: 1px solid #222222; margin-bottom: 16px;">
      <div>
        <div class="row">
          <span class="font-bold">${isHi ? "स्थान" : "Place"}</span>
          <span class="dotted-line" style="min-width: 140px;">${safeVal(formData.signPlace || formData.policeStation)}</span>
        </div>
        <div class="row">
          <span class="font-bold">${isHi ? "दिनांक" : "Date"}</span>
          <span class="dotted-line" style="min-width: 140px;">${safeVal(formData.signDate || formData.issueDate)}</span>
        </div>
      </div>
      <div class="text-right">
        <div class="font-bold underline text-center" style="margin-bottom: 4px;">
          ${isHi ? "जांच अधिकारी के हस्ताक्षर" : "Signature of Investigating Officer"}
        </div>
        <div class="row" style="justify-content: flex-end;">
          <span class="font-bold">${isHi ? "नाम" : "Name"}</span>
          <span class="dotted-line" style="min-width: 160px; text-align: right;">${safeVal(formData.officerName)}</span>
        </div>
        <div class="row" style="justify-content: flex-end;">
          <span class="font-bold">${isHi ? "पद" : "Rank"}</span>
          <span class="dotted-line" style="min-width: 160px; text-align: right;">${safeVal(formData.officerRank)}</span>
        </div>
        <div class="row" style="justify-content: flex-end;">
          <span class="font-bold">${isHi ? "नम्बर" : "PNO / No."}</span>
          <span class="dotted-line" style="min-width: 160px; text-align: right;">${safeVal(formData.officerPno)}</span>
        </div>
      </div>
    </div>

    <!-- MHC Section -->
    <div>
      <div class="font-bold underline" style="margin-bottom: 8px;">
        ${isHi ? "केवल मोहर्रर थाना के प्रयोग हेतू :" : "For Use of Police Station Moharrir (MHC) Only :"}
      </div>

      <div style="margin-bottom: 10px;">
        <div class="font-bold">
          ${isHi
            ? "5.  आरोपी का पूर्व आपराधिक रिकार्ड : (ICJS /Eagle/गृह थाना के रिकॉर्ड अनुसार )"
            : "5.  Previous Criminal Record of Accused : (As per ICJS / Eagle / Home Station Records)"}
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
        <span class="font-bold">
          ${isHi
            ? "6.  Eagle Software अनुसार अपराधी का Criminal ID No."
            : "6.  Criminal ID No. of Accused as per Eagle Software"}
        </span>
        <span class="dotted-line" style="flex: 1; font-family: monospace; font-weight: bold;">${safeVal(formData.eagleCriminalId)}</span>
      </div>

      <!-- MHC Signature -->
      <div style="display: flex; justify-content: flex-end; margin-top: 30px;">
        <div class="text-right">
          <div class="font-bold underline text-center" style="margin-bottom: 4px;">
            ${isHi ? "मोहर्रर थाना के हस्ताक्षर" : "Signature of Moharrir Head Constable (MHC)"}
          </div>
          <div class="row" style="justify-content: flex-end;">
            <span class="font-bold">${isHi ? "नाम" : "Name"}</span>
            <span class="dotted-line" style="min-width: 160px; text-align: right;">${safeVal(formData.mhcName)}</span>
          </div>
          <div class="row" style="justify-content: flex-end;">
            <span class="font-bold">${isHi ? "पद" : "Rank"}</span>
            <span class="dotted-line" style="min-width: 160px; text-align: right;">${safeVal(formData.mhcRank)}</span>
          </div>
          <div class="row" style="justify-content: flex-end;">
            <span class="font-bold">${isHi ? "नम्बर" : "Belt No. / PNO"}</span>
            <span class="dotted-line" style="min-width: 160px; text-align: right;">${safeVal(formData.mhcBeltNo)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

</body>
</html>`;
}
