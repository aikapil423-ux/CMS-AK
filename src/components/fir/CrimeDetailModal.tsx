"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  Plus,
  Trash2,
  FileText,
  MapPin,
  Compass,
  User,
  Shield,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Save,
  Printer,
  Calendar,
  Clock,
  Car,
  Eye,
  Gavel,
  ShieldAlert,
  HelpCircle,
  Download,
  ArrowLeft,
  ExternalLink,
  FileCheck2,
} from "lucide-react";
import { FIRItem } from "@/types";
import { persistentFirService as firService } from "@/services/persistentFirService";
import { GeneralDiaryService } from "@/services/generalDiaryService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { printA4Element } from "@/utils/printElement";

interface CrimeDetailModalProps {
  fir: FIRItem;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (updatedFir: FIRItem) => void;
  currentUserName?: string;
}

export function CrimeDetailModal({
  fir,
  isOpen,
  onClose,
  onSubmitted,
  currentUserName = "Investigating Officer",
}: CrimeDetailModalProps) {
  const [activeTab, setActiveTab] = useState<
    "place" | "modus" | "accused" | "victim" | "witness" | "property"
  >("place");

  const [placeSubTab, setPlaceSubTab] = useState<"general" | "shown_by">("general");

  // Check if FIR already has saved crime details data (from fir props or dedicated localStorage backup)
  const savedCrimeData = React.useMemo(() => {
    if ((fir as any)?.crimeDetailsData) return (fir as any).crimeDetailsData;
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(`haryana_police_cms_fir_crimedetails_${fir.id}`);
        if (raw) return JSON.parse(raw);
      } catch (_) {}
    }
    return undefined;
  }, [fir]);

  // Form State initialized with FIR's existing data where available
  const [isHeinous, setIsHeinous] = useState(savedCrimeData?.isHeinous ?? fir.isHeinous ?? false);
  const [isSensitive, setIsSensitive] = useState(savedCrimeData?.isSensitive ?? fir.isSensitive ?? false);

  // 1. Place of Occurrence
  const [longitude, setLongitude] = useState(savedCrimeData?.placeOfOccurrence?.longitude || "76.8485° E");
  const [latitude, setLatitude] = useState(savedCrimeData?.placeOfOccurrence?.latitude || "30.7046° N");
  const [visitDateTime, setVisitDateTime] = useState(
    savedCrimeData?.placeOfOccurrence?.visitDateTime || new Date().toISOString().slice(0, 16)
  );
  const [beatNo, setBeatNo] = useState(savedCrimeData?.placeOfOccurrence?.beatNo || fir.beatNumber || "Beat No. 1");
  const [majorPlaceType, setMajorPlaceType] = useState(
    savedCrimeData?.placeOfOccurrence?.majorPlaceType || "Commercial / Residential Area"
  );
  const [minorPlaceType, setMinorPlaceType] = useState(
    savedCrimeData?.placeOfOccurrence?.minorPlaceType || "Public Street / Commercial Premises"
  );
  const [gist, setGist] = useState(
    savedCrimeData?.placeOfOccurrence?.gist || fir.briefFacts || fir.incidentDetails?.slice(0, 300) || ""
  );
  const [description, setDescription] = useState(
    savedCrimeData?.placeOfOccurrence?.description ||
      fir.incidentDetails ||
      "घटनास्थल का मुआयना किया गया। भौतिक स्थिति का निरीक्षण कर नजरी नक्शा मौका तैयार किया गया।"
  );
  const [physicalEvidenceDetails, setPhysicalEvidenceDetails] = useState(
    savedCrimeData?.placeOfOccurrence?.physicalEvidenceDetails ||
      "घटनास्थल से भौतिक साक्ष्य संकलित किए गए। घटनास्थल की वीडियोग्राफी / फोटोग्राफी करवाई गई।"
  );

  // Four Boundaries of Crime Scene
  const [eastBoundary, setEastBoundary] = useState(savedCrimeData?.placeOfOccurrence?.eastBoundary || "रास्ता / मुख्य मार्ग");
  const [westBoundary, setWestBoundary] = useState(savedCrimeData?.placeOfOccurrence?.westBoundary || "मकान / खुला स्थान");
  const [northBoundary, setNorthBoundary] = useState(savedCrimeData?.placeOfOccurrence?.northBoundary || "सड़क / आम गली");
  const [southBoundary, setSouthBoundary] = useState(savedCrimeData?.placeOfOccurrence?.southBoundary || "प्लाॅट / खाली भूमि");

  // Shown By
  const [shownByName, setShownByName] = useState(
    savedCrimeData?.placeOfOccurrence?.shownBy?.name || fir.complainantName || ""
  );
  const [shownByRelative, setShownByRelative] = useState(
    savedCrimeData?.placeOfOccurrence?.shownBy?.relativeName || fir.complainantFatherSpouse || ""
  );
  const [shownByRelationType, setShownByRelationType] = useState(
    savedCrimeData?.placeOfOccurrence?.shownBy?.relationType || "Father"
  );
  const [shownByGender, setShownByGender] = useState(
    savedCrimeData?.placeOfOccurrence?.shownBy?.gender || fir.complainantGender || "Male"
  );
  const [shownByMobile, setShownByMobile] = useState(
    savedCrimeData?.placeOfOccurrence?.shownBy?.mobile || fir.complainantMobile || ""
  );
  const [shownByAge, setShownByAge] = useState(
    String(savedCrimeData?.placeOfOccurrence?.shownBy?.age || fir.complainantAge || 35)
  );
  const [shownByAddress, setShownByAddress] = useState(
    savedCrimeData?.placeOfOccurrence?.shownBy?.address || fir.complainantAddress || fir.incidentPlace || ""
  );
  const [shownByDistrict, setShownByDistrict] = useState(
    savedCrimeData?.placeOfOccurrence?.shownBy?.district || fir.district || ""
  );
  const [shownByPs, setShownByPs] = useState(
    savedCrimeData?.placeOfOccurrence?.shownBy?.policeStation || fir.policeStation || ""
  );

  // 2. Modus Operandi List
  const [motive, setMotive] = useState(
    savedCrimeData?.modusOperandi?.[0]?.motive || "COMMISSION OF COGNIZABLE OFFENCE / FRAUDULENT GAIN"
  );
  const [conveyanceType, setConveyanceType] = useState(
    savedCrimeData?.modusOperandi?.[0]?.conveyance?.split("(")[0]?.trim() || "Motorcycle / Two Wheeler"
  );
  const [conveyanceColor, setConveyanceColor] = useState("Dark / Normal");
  const [conveyanceNumber, setConveyanceNumber] = useState("");
  const [majorHead, setMajorHead] = useState(fir.categoryDisplay || "OFFENCE HEAD");
  const [minorHead, setMinorHead] = useState(fir.bnsSections?.[0] ? `UNDER SEC ${fir.bnsSections[0]}` : "COGNIZABLE OFFENCE");
  const [method, setMethod] = useState(
    savedCrimeData?.modusOperandi?.[0]?.method || "PHYSICAL COMMISSION / FORCED ENTRY"
  );
  const [characterAssumed, setCharacterAssumed] = useState(
    savedCrimeData?.modusOperandi?.[0]?.characterAssumed || "PASSERBY / UNKNOWN"
  );
  const [languageDialect, setLanguageDialect] = useState(
    savedCrimeData?.modusOperandi?.[0]?.languageDialect || "HINDI / LOCAL DIALECT"
  );
  const [specialFeature, setSpecialFeature] = useState(
    savedCrimeData?.modusOperandi?.[0]?.specialFeature || "CONCEALED IDENTITY"
  );

  const [modusList, setModusList] = useState<any[]>(
    savedCrimeData?.modusOperandi || [
      {
        id: "mo-1",
        motive: "COMMISSION OF COGNIZABLE OFFENCE / FRAUDULENT GAIN",
        conveyance: "Motorcycle / Two Wheeler",
        crimeHead: `${fir.categoryDisplay || "OFFENCE"} - INVESTIGATION`,
        method: "COMMISSION OF REPORTED OFFENCE",
        specialFeature: "CONCEALED IDENTITY",
      },
    ]
  );

  // 3. Accused List
  const [accusedType, setAccusedType] = useState<"Known" | "Unknown">("Unknown");
  const [accusedName, setAccusedName] = useState("");
  const [accusedAlias, setAccusedAlias] = useState("");
  const [accusedGender, setAccusedGender] = useState("Male");
  const [accusedAge, setAccusedAge] = useState("25-35");
  const [accusedBuild, setAccusedBuild] = useState("Normal / Medium");
  const [accusedComplexion, setAccusedComplexion] = useState("Wheatish / Brownish");
  const [accusedHeight, setAccusedHeight] = useState("5 ft 8 in (172 cm)");
  const [accusedClothes, setAccusedClothes] = useState("साधारण वस्त्र (Normal Clothes)");
  const [accusedMarks, setAccusedMarks] = useState("कोई स्पष्ट पहचान चिह्न नहीं (None visible)");

  const [accusedEntries, setAccusedEntries] = useState<any[]>(
    savedCrimeData?.accusedSuspects ||
      (fir.accusedList && fir.accusedList.length > 0
        ? fir.accusedList.map((a, idx) => ({
            id: a.id || `acc-${idx + 1}`,
            accusedType: a.isIdentified ? "Known" : "Unknown",
            name: a.name || "Unknown suspect",
            alias: a.alias || "",
            gender: "Male",
            age: "25-35",
            description: a.physicalDescription || "Normal build",
            clothes: "साधारण वस्त्र",
            marks: (a as any).identificationMarks || "कोई स्पष्ट पहचान चिह्न नहीं",
          }))
        : [
            {
              id: "acc-1",
              accusedType: "Unknown",
              name: "अज्ञात संदिग्ध (Unknown Suspect)",
              alias: "",
              gender: "Male",
              age: "25-35",
              description: "मध्यम कद-काठी",
              clothes: "साधारण वस्त्र",
              marks: "कोई विशेष पहचान नहीं",
            },
          ])
  );

  // 4. Victim List
  const [victimName, setVictimName] = useState(fir.complainantName || "");
  const [victimRelative, setVictimRelative] = useState(fir.complainantFatherSpouse || "");
  const [victimGender, setVictimGender] = useState(fir.complainantGender || "Male");
  const [victimAge, setVictimAge] = useState(String(fir.complainantAge || 35));
  const [victimAddress, setVictimAddress] = useState(fir.complainantAddress || "");
  const [victimOccupation, setVictimOccupation] = useState("Business / Private");
  const [victimCondition, setVictimCondition] = useState("Not Injured");
  const [victimInjury, setVictimInjury] = useState("None (Loss of property / rights only)");
  const [victimStatement, setVictimStatement] = useState(
    fir.briefFacts || fir.incidentDetails || "घटना के संबंध में आवश्यक साक्ष्य एवं विवरण दर्ज कराए गए।"
  );

  const [victimEntries, setVictimEntries] = useState<any[]>(
    savedCrimeData?.victims || [
      {
        id: "vic-1",
        name: fir.complainantName || "शिकायतकर्ता / पीड़ित",
        relativeName: fir.complainantFatherSpouse || "",
        gender: fir.complainantGender || "Male",
        age: String(fir.complainantAge || 35),
        dob: "",
        nationality: "Indian",
        religion: "Hindu",
        caste: "General",
        occupation: "Business / Private",
        address: fir.complainantAddress || "",
        condition: "Not Injured",
        injury: "None / Not Injured",
        statement: fir.briefFacts || fir.incidentDetails || "घटना के संबंध में आवश्यक साक्ष्य एवं विवरण दर्ज कराए गए।",
      },
    ]
  );

  // 5. Witness List
  const [witnessName, setWitnessName] = useState("");
  const [witnessRelative, setWitnessRelative] = useState("");
  const [witnessRole, setWitnessRole] = useState("Eye-witness / Spot Witness");
  const [witnessMobile, setWitnessMobile] = useState("");
  const [witnessStatement, setWitnessStatement] = useState("");

  const [witnessEntries, setWitnessEntries] = useState<any[]>(
    savedCrimeData?.witnesses ||
      ((fir as any).arrestWitnesses?.length
        ? (fir as any).arrestWitnesses.map((w: any, idx: number) => ({
            id: w.id || `wit-${idx + 1}`,
            name: w.name,
            relativeName: "",
            role: "Independent Witness",
            mobile: "",
            statement: "मौका व तथ्यों की पुष्टि की गई।",
          }))
        : [])
  );

  // 6. Property of Interest
  const [hasProperty, setHasProperty] = useState<boolean>(
    savedCrimeData?.propertyOfInterest?.hasProperty ??
      Boolean(fir.stolenPropertyDetails || fir.propertiesList?.length || fir.totalPropertyEstimatedValue)
  );
  const [propCategory, setPropCategory] = useState("ELECTRICAL / VALUABLE GADGETS & CASH");
  const [propType, setPropType] = useState("Goods / Valuable Property");
  const [propEstimatedValue, setPropEstimatedValue] = useState(
    String(fir.totalPropertyEstimatedValue || 0)
  );
  const [propRecoveredValue, setPropRecoveredValue] = useState("0");
  const [propStatus,setPropStatus]=useState("");
  const [propRecoveredAt,setPropRecoveredAt]=useState("");
  const [propDesc, setPropDesc] = useState(fir.stolenPropertyDetails || "");

  const [propertyEntries, setPropertyEntries] = useState<any[]>(
    fir.propertiesList?.length ? fir.propertiesList.map((p,idx)=>({id:p.id || `prop-${idx+1}`,category:p.propertyCategory || p.propertyType || '',description:p.description || '',estimatedValue:p.estimatedValue ?? '',recoveredValue:(p as any).recoveredValue ?? '',status:p.status || '',recoveredAt:p.recoveredAt || ''}))
      : savedCrimeData?.propertyOfInterest?.properties || (fir.stolenPropertyDetails ? [{id:'prop-1',category:'',description:fir.stolenPropertyDetails,estimatedValue:fir.totalPropertyEstimatedValue ?? '',recoveredValue:'',status:'',recoveredAt:''}] : [])
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // Split acts and sections for Table 2 matching official IIF-II proforma
  const actsAndSectionsList = React.useMemo(() => {
    if (!fir.actsAndSections) {
      return [{ sNo: 1, act: "Bharatiya Nyaya Sanhita, 2023", sections: "Sec 103, 303(2) BNS" }];
    }
    const raw = fir.actsAndSections;
    const parts = raw.split(/;|\n/);
    if (parts.length > 1) {
      return parts.map((p, i) => {
        const trimmed = p.trim();
        const hasAct = trimmed.toLowerCase().includes("act");
        return {
          sNo: i + 1,
          act: hasAct ? trimmed.split(/sec|section/i)[0].trim() : (fir.majorAct || "Bharatiya Nyaya Sanhita, 2023"),
          sections: hasAct ? (trimmed.match(/sec.*|section.*/i)?.[0] || trimmed) : trimmed,
        };
      });
    }
    return [
      {
        sNo: 1,
        act: raw.toLowerCase().includes("arms") ? "ARMS ACT, 1959" : (fir.majorAct || "Bharatiya Nyaya Sanhita, 2023"),
        sections: raw.toLowerCase().includes("arms") ? "25" : (fir.bnsSections?.join(", ") || raw),
      },
      {
        sNo: 2,
        act: raw.toLowerCase().includes("arms") ? (fir.majorAct || "IPC 1860 / BNS 2023") : "Special & Local Laws (SLL)",
        sections: raw.toLowerCase().includes("arms") ? (fir.bnsSections?.join(", ") || "302 / 103") : "Applicable Provisions",
      },
    ];
  }, [fir.actsAndSections, fir.majorAct, fir.bnsSections]);

  const handleDownloadProforma = () => {
    const el = document.getElementById("cctns-iif2-official-sheet");
    if (!el) return;
    const filename = `CRIME_DETAILS_FORM_IIF2_${(fir.firNumber || "FIR").replace(/[\/\s]/g, "_")}.html`;
    const fullHtml = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="utf-8"/>
  <title>Crime Details Form (IIF-II) - ${fir.firNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    body { font-family: "Times New Roman", Times, serif; font-size: 11px; color: #000; background: #fff; margin: 0; padding: 15px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th, td { border: 1px solid #444; padding: 4px 6px; vertical-align: top; font-size: 11px; }
    th { background-color: #f2f2f2; font-weight: bold; }
    .page-break { page-break-before: always; break-before: page; margin-top: 25px; padding-top: 15px; }
    .no-print { display: none !important; }
  </style>
</head>
<body>
  ${el.innerHTML}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintProforma = () => {
    printA4Element("cctns-iif2-official-sheet", `CRIME_DETAILS_FORM_IIF2_${fir.firNumber}`);
  };

  const handleSaveToFirProfile = async () => {
    setIsSubmitting(true);
    const el = document.getElementById("cctns-iif2-official-sheet");
    const htmlSnapshot = el ? `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="utf-8"/>
  <title>Crime Details Form (IIF-II) - ${fir.firNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    body { font-family: "Times New Roman", Times, serif; font-size: 11px; color: #000; background: #fff; margin: 0; padding: 15px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th, td { border: 1px solid #444; padding: 4px 6px; vertical-align: top; font-size: 11px; }
    th { background-color: #f2f2f2; font-weight: bold; }
    .page-break { page-break-before: always; break-before: page; margin-top: 25px; padding-top: 15px; }
  </style>
</head>
<body>
  ${el.innerHTML}
</body>
</html>` : "";

    const crimeDetailsPayload = {
      formTitle: "Crime Detail Form IIF-II",
      formCode: "IIF-II",
      firNumber: fir.firNumber,
      firDate: fir.firDate,
      policeStation: fir.policeStation,
      district: fir.district,
      actsAndSections: fir.actsAndSections,
      isHeinous,
      isSensitive,
      placeOfOccurrence: {
        longitude,
        latitude,
        visitDateTime,
        beatNo,
        majorPlaceType,
        minorPlaceType,
        gist,
        description,
        physicalEvidenceDetails,
        eastBoundary,
        westBoundary,
        northBoundary,
        southBoundary,
        shownBy: {
          name: shownByName,
          relativeName: shownByRelative,
          relationType: shownByRelationType,
          gender: shownByGender,
          mobile: shownByMobile,
          age: shownByAge,
          address: shownByAddress,
          district: shownByDistrict,
          policeStation: shownByPs,
        },
      },
      modusOperandi: modusList,
      accusedSuspects: accusedEntries,
      victims: victimEntries,
      witnesses: witnessEntries,
      propertyOfInterest: {
        hasProperty,
        properties: propertyEntries,
      },
      submittedAt: new Date().toISOString(),
      submittedBy: currentUserName,
    };

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(
          `haryana_police_cms_fir_crimedetails_${fir.id}`,
          JSON.stringify(crimeDetailsPayload)
        );
      } catch (e) {
        console.warn("Direct localStorage backup failed:", e);
      }
    }

    const updated = await firService.saveCrimeDetails(fir.id, crimeDetailsPayload, currentUserName, htmlSnapshot);

    // Trigger Roznamcha GD auto-suggestion for Crime Details IIF-II
    try {
      void GeneralDiaryService.createFirActionSuggestion({
        actionType: "CRIME_DETAILS",
        firId: fir.id,
        firNumber: fir.firNumber,
        policeStation: fir.policeStation,
        district: fir.district,
        officer: {
          name: currentUserName || "IO",
          rank: "Sub-Inspector",
          beltNumber: "IO/FIR",
        },
        actsAndSections: fir.actsAndSections,
        place: majorPlaceType ? `${majorPlaceType} - ${minorPlaceType}` : fir.incidentPlace,
        dateTime: visitDateTime,
        docTitle: `Crime Detail Form (IIF-II) - ${fir.firNumber}`,
        details: `Crime Detail Form (IIF-II) inspected and recorded by ${currentUserName}`,
      });
    } catch (gdErr) {
      console.warn("Failed to create Roznamcha GD suggestion for Crime Details:", gdErr);
    }

    setIsSubmitting(false);

    if (updated) {
      setIsSavedSuccess(true);
      onSubmitted(updated);
    }
  };

  if (!isOpen) return null;

  // Add Modus Operandi handler
  const handleAddModus = () => {
    if (!majorHead) return;
    const newEntry = {
      id: `mo-${Date.now()}`,
      motive,
      conveyance: `${conveyanceType} (${conveyanceColor}), ${conveyanceNumber}`,
      crimeHead: `${majorHead} - ${minorHead}`,
      method,
      specialFeature,
      characterAssumed,
      languageDialect,
    };
    setModusList([...modusList, newEntry]);
  };

  // Add Accused handler
  const handleAddAccused = () => {
    if (!accusedName.trim()) return;
    const newEntry = {
      id: `acc-${Date.now()}`,
      accusedType,
      name: accusedName,
      alias: accusedAlias,
      gender: accusedGender,
      age: accusedAge,
      description: `${accusedBuild}, ${accusedComplexion}, Height: ${accusedHeight}`,
      clothes: accusedClothes || "साधारण वस्त्र",
      marks: accusedMarks || "कोई स्पष्ट पहचान नहीं",
    };
    setAccusedEntries([...accusedEntries, newEntry]);
    setAccusedName("");
    setAccusedAlias("");
  };

  // Add Victim handler
  const handleAddVictim = () => {
    if (!victimName.trim()) return;
    const newEntry = {
      id: `vic-${Date.now()}`,
      name: victimName,
      relativeName: victimRelative || shownByRelative || "",
      gender: victimGender,
      age: victimAge || shownByAge || "",
      dob: "",
      nationality: "Indian",
      religion: "Hindu",
      caste: "General",
      occupation: victimOccupation || "Business / Private",
      address: victimAddress || shownByAddress || "",
      condition: victimCondition,
      injury: victimInjury,
      statement: victimStatement,
    };
    setVictimEntries([...victimEntries, newEntry]);
    setVictimName("");
  };

  // Add Witness handler
  const handleAddWitness = () => {
    if (!witnessName.trim()) return;
    const newEntry = {
      id: `wit-${Date.now()}`,
      name: witnessName,
      relativeName: witnessRelative,
      role: witnessRole,
      mobile: witnessMobile,
      statement: witnessStatement,
      address: shownByAddress || "",
    };
    setWitnessEntries([...witnessEntries, newEntry]);
    setWitnessName("");
    setWitnessStatement("");
  };

  // Add Property handler
  const handleAddProperty = () => {
    if (!propDesc.trim()) return;
    if (["RECOVERED","SEIZED"].includes(propStatus) && !propRecoveredAt) {alert("Enter the actual recovery/seizure date.");return;}
    const newEntry = {
      id: `prop-${Date.now()}`,
      category: propCategory,
      description: propDesc,
      estimatedValue: Number(propEstimatedValue) || 0,
      recoveredValue: Number(propRecoveredValue) || 0,
      status:propStatus,recoveredAt:propRecoveredAt,
    };
    setPropertyEntries([...propertyEntries, newEntry]);
    setPropDesc("");
  };

  // Final Submit Handler
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);

    const crimeDetailsPayload = {
      formTitle: "Crime Detail Form IIF-II",
      formCode: "IIF-II",
      firNumber: fir.firNumber,
      firDate: fir.firDate,
      policeStation: fir.policeStation,
      district: fir.district,
      actsAndSections: fir.actsAndSections,
      isHeinous,
      isSensitive,
      placeOfOccurrence: {
        longitude,
        latitude,
        visitDateTime,
        beatNo,
        majorPlaceType,
        minorPlaceType,
        gist,
        description,
        physicalEvidenceDetails,
        shownBy: {
          name: shownByName,
          relativeName: shownByRelative,
          relationType: shownByRelationType,
          gender: shownByGender,
          mobile: shownByMobile,
          age: shownByAge,
          address: shownByAddress,
          district: shownByDistrict,
          policeStation: shownByPs,
        },
      },
      modusOperandi: modusList,
      accusedSuspects: accusedEntries,
      victims: victimEntries,
      witnesses: witnessEntries,
      propertyOfInterest: {
        hasProperty,
        properties: propertyEntries,
      },
      submittedAt: new Date().toISOString(),
      submittedBy: currentUserName,
    };

    const updated = await firService.saveCrimeDetails(fir.id, crimeDetailsPayload, currentUserName);
    setIsSubmitting(false);
    setShowConfirmDialog(false);

    if (updated) {
      onSubmitted(updated);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-slate-300 flex flex-col">
        {/* Modal Header Strip (CCTNS IIF-II Official Style) */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#0b192c] via-[#1e3e62] to-[#0b192c] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded">
                  FORM IIF-II
                </span>
                <h3 className="text-sm sm:text-base font-black truncate">
                  Crime Detail Form (IIF-II) / अपराध विवरण प्रपत्र
                </h3>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                CCTNS Standard Investigation Proforma • FIR: {fir.firNumber} • PS: {fir.policeStation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[11px] font-mono text-amber-300 bg-amber-950/50 border border-amber-500/40 px-2 py-0.5 rounded">
              {fir.actsAndSections}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CCTNS Navigation Tabs (Panels) */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-100 border-b border-slate-200 overflow-x-auto text-xs shrink-0">
          {[
            { key: "place", label: "1. Place of Occurrence (घटना स्थल)", icon: MapPin },
            { key: "modus", label: `2. Modus Operandi (${modusList.length})`, icon: Compass },
            { key: "accused", label: `3. Accused / Suspects (${accusedEntries.length})`, icon: User },
            { key: "victim", label: `4. Victim Details (${victimEntries.length})`, icon: Shield },
            { key: "witness", label: `5. Witness Details (${witnessEntries.length})`, icon: Eye },
            { key: "property", label: `6. Property of Interest (${propertyEntries.length})`, icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#0b192c] text-white shadow-xs"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6 text-xs text-slate-800">
          {/* Header Context Summary Banner */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[11px]">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">FIR / NCR No</span>
                <strong className="text-slate-900 font-mono text-xs">{fir.firNumber}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Registration Date</span>
                <span className="text-slate-800">{fir.firDate}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Police Station</span>
                <span className="text-slate-800">{fir.policeStation} ({fir.district})</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Statutory Acts & Sections</span>
                <span className="text-red-700 font-bold font-mono">{fir.actsAndSections}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-semibold">
                <input
                  type="checkbox"
                  checked={isHeinous}
                  onChange={(e) => setIsHeinous(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span>जघन्य (Heinous Crime)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-semibold">
                <input
                  type="checkbox"
                  checked={isSensitive}
                  onChange={(e) => setIsSensitive(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span>संवेदनशील (Sensitive FIR)</span>
              </label>
            </div>
          </div>

          {/* 1. PLACE OF OCCURRENCE PANEL */}
          {activeTab === "place" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setPlaceSubTab("general")}
                  className={`px-3 py-1 rounded-md font-bold text-xs cursor-pointer ${
                    placeSubTab === "general"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  General Information (सामान्य विवरण)
                </button>
                <button
                  type="button"
                  onClick={() => setPlaceSubTab("shown_by")}
                  className={`px-3 py-1 rounded-md font-bold text-xs cursor-pointer ${
                    placeSubTab === "shown_by"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Shown By (घटना स्थल दर्शाने वाला)
                </button>
              </div>

              {placeSubTab === "general" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Longitude (देशांतर)
                      </label>
                      <input
                        type="text"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Latitude (अक्षांश)
                      </label>
                      <input
                        type="text"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Date & Time of Visit to Place * <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={visitDateTime}
                        onChange={(e) => setVisitDateTime(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Beat Number (बीट संख्या)
                      </label>
                      <input
                        type="text"
                        value={beatNo}
                        onChange={(e) => setBeatNo(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Major Type of Place of Occurrence
                      </label>
                      <input
                        type="text"
                        value={majorPlaceType}
                        onChange={(e) => setMajorPlaceType(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Minor Type of Place of Occurrence
                      </label>
                      <input
                        type="text"
                        value={minorPlaceType}
                        onChange={(e) => setMinorPlaceType(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Gist of Occurrence (संक्षिप्त विवरण - 500 Chars)
                    </label>
                    <textarea
                      rows={2}
                      value={gist}
                      onChange={(e) => setGist(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Description of Crime Scene (घटनास्थल का पूर्ण विवरण) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Details of Physical Evidence Found on Spot (भौतिक साक्ष्य विवरण)
                    </label>
                    <textarea
                      rows={2}
                      value={physicalEvidenceDetails}
                      onChange={(e) => setPhysicalEvidenceDetails(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs leading-relaxed"
                    />
                  </div>

                  {/* Crime Scene Boundaries */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <label className="block font-bold text-slate-800 text-xs">
                      Boundaries of Place of Occurrence (घटनास्थल की चौहद्दी विवरण - पूर्व, पश्चिम, उत्तर, दक्षिण)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">पूर्व (East Boundary)</label>
                        <input
                          type="text"
                          value={eastBoundary}
                          onChange={(e) => setEastBoundary(e.target.value)}
                          placeholder="उदा. रास्ता / पड़ोसी भवन / मुख्य मार्ग"
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">पश्चिम (West Boundary)</label>
                        <input
                          type="text"
                          value={westBoundary}
                          onChange={(e) => setWestBoundary(e.target.value)}
                          placeholder="उदा. मकान / खुला स्थान / सड़क"
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">उत्तर (North Boundary)</label>
                        <input
                          type="text"
                          value={northBoundary}
                          onChange={(e) => setNorthBoundary(e.target.value)}
                          placeholder="उदा. सड़क / गली / भवन"
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">दक्षिण (South Boundary)</label>
                        <input
                          type="text"
                          value={southBoundary}
                          onChange={(e) => setSouthBoundary(e.target.value)}
                          placeholder="उदा. प्लाॅट / खुला मैदान / सर्विस लेन"
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Shown By Sub-tab */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        value={shownByName}
                        onChange={(e) => setShownByName(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Relative Name</label>
                      <input
                        type="text"
                        value={shownByRelative}
                        onChange={(e) => setShownByRelative(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Relation Type</label>
                      <select
                        value={shownByRelationType}
                        onChange={(e) => setShownByRelationType(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-medium"
                      >
                        <option value="Father">Father (पिता)</option>
                        <option value="Husband">Husband (पति)</option>
                        <option value="Mother">Mother (माता)</option>
                        <option value="Wife">Wife (पत्नी)</option>
                        <option value="Brother">Brother (भाई)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Gender *</label>
                      <select
                        value={shownByGender}
                        onChange={(e) => setShownByGender(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-medium"
                      >
                        <option value="Male">Male (पुरुष)</option>
                        <option value="Female">Female (महिला)</option>
                        <option value="Transgender">Transgender</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
                      <input
                        type="text"
                        value={shownByMobile}
                        onChange={(e) => setShownByMobile(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Age (Years)</label>
                      <input
                        type="text"
                        value={shownByAge}
                        onChange={(e) => setShownByAge(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Present Address *</label>
                      <input
                        type="text"
                        value={shownByAddress}
                        onChange={(e) => setShownByAddress(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">District *</label>
                      <input
                        type="text"
                        value={shownByDistrict}
                        onChange={(e) => setShownByDistrict(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Police Station *</label>
                      <input
                        type="text"
                        value={shownByPs}
                        onChange={(e) => setShownByPs(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. MODUS OPERANDI PANEL */}
          {activeTab === "modus" && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-600" />
                  <span>तरीका-ए-वारदात प्रविष्टि (Add Modus Operandi)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Motive of Crime (अपराध का उद्देश्य)</label>
                    <select
                      value={motive}
                      onChange={(e) => setMotive(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    >
                      <option value="CARRY AWAY PROPERTY / FRAUDULENT GAIN">CARRY AWAY PROPERTY / FRAUDULENT GAIN</option>
                      <option value="THEFT / BURGLARY">THEFT / BURGLARY</option>
                      <option value="REVENGE / ENEMITY">REVENGE / ENEMITY</option>
                      <option value="SUDDEN QUARREL">SUDDEN QUARREL</option>
                      <option value="ASSAULT">ASSAULT</option>
                      <option value="CHEATING">CHEATING</option>
                      <option value="ACCIDENT">ACCIDENT</option>
                      <option value="DOWRY">DOWRY</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Conveyance Type (वाहन प्रकार)</label>
                    <select
                      value={conveyanceType}
                      onChange={(e) => setConveyanceType(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    >
                      <option value="Motorcycle / Two Wheeler">Motorcycle / Two Wheeler</option>
                      <option value="Car / Motor Car">Car / Motor Car</option>
                      <option value="Auto Rickshaw">Auto Rickshaw</option>
                      <option value="Bicycle">Bicycle</option>
                      <option value="Heavy Truck">Heavy Truck</option>
                      <option value="Foot / Pedestrian">Foot / Pedestrian</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Conveyance Color & Number</label>
                    <input
                      type="text"
                      value={conveyanceNumber}
                      onChange={(e) => setConveyanceNumber(e.target.value)}
                      placeholder="Color, Number or Without Plate"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Method (तरीका)</label>
                    <input
                      type="text"
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      placeholder="e.g. Forced Entry / Robbery / Snatching"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Character Assumed (चरित्रधारण)</label>
                    <input
                      type="text"
                      value={characterAssumed}
                      onChange={(e) => setCharacterAssumed(e.target.value)}
                      placeholder="e.g. Passerby / Courier / Customer"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Language / Dialect Used</label>
                    <input
                      type="text"
                      value={languageDialect}
                      onChange={(e) => setLanguageDialect(e.target.value)}
                      placeholder="e.g. Hindi / Haryanvi / Local"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Special Feature</label>
                    <input
                      type="text"
                      value={specialFeature}
                      onChange={(e) => setSpecialFeature(e.target.value)}
                      placeholder="e.g. Mask / Helmet / Disguise"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    onClick={handleAddModus}
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold gap-1 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>सूची में जोड़ें (Add to List)</span>
                  </Button>
                </div>
              </div>

              {/* Modus Operandi Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">S.No</th>
                      <th className="p-2.5">Motive</th>
                      <th className="p-2.5">Conveyance</th>
                      <th className="p-2.5">Method</th>
                      <th className="p-2.5">Special Feature</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {modusList.map((mo, idx) => (
                      <tr key={mo.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold font-mono">{idx + 1}</td>
                        <td className="p-2.5 font-medium">{mo.motive}</td>
                        <td className="p-2.5">{mo.conveyance}</td>
                        <td className="p-2.5">{mo.method}</td>
                        <td className="p-2.5">{mo.specialFeature}</td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => setModusList(modusList.filter((m) => m.id !== mo.id))}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. ACCUSED / SUSPECT PANEL */}
          {activeTab === "accused" && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <User className="w-4 h-4 text-purple-600" />
                  <span>अभियुक्त / संदिग्ध विवरण प्रविष्टि (Accused Details Entry)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Accused Type</label>
                    <select
                      value={accusedType}
                      onChange={(e) => setAccusedType(e.target.value as any)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                    >
                      <option value="Unknown">Unknown (अज्ञात / देखा गया)</option>
                      <option value="Known">Known (ज्ञात / नामजद)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Name / Suspect Label *</label>
                    <input
                      type="text"
                      value={accusedName}
                      onChange={(e) => setAccusedName(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Gender / Estimated Age</label>
                    <input
                      type="text"
                      value={accusedAge}
                      onChange={(e) => setAccusedAge(e.target.value)}
                      placeholder="e.g. Male / 25-30 yrs"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Body Build & Height</label>
                    <input
                      type="text"
                      value={accusedHeight}
                      onChange={(e) => setAccusedHeight(e.target.value)}
                      placeholder="e.g. Medium build, 5 ft 8 in"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Clothes Worn / Physical Features</label>
                    <input
                      type="text"
                      value={accusedClothes}
                      onChange={(e) => setAccusedClothes(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Identification Marks / Helmet / Mask</label>
                    <input
                      type="text"
                      value={accusedMarks}
                      onChange={(e) => setAccusedMarks(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    onClick={handleAddAccused}
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold gap-1 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>अभियुक्त जोड़ें (Add Accused)</span>
                  </Button>
                </div>
              </div>

              {/* Accused Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">S.No</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Name / Suspect</th>
                      <th className="p-2.5">Age / Gender</th>
                      <th className="p-2.5">Physical Description</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {accusedEntries.map((acc, idx) => (
                      <tr key={acc.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold font-mono">{idx + 1}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              acc.accusedType === "Known"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {acc.accusedType}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">{acc.name}</td>
                        <td className="p-2.5">{acc.gender} / {acc.age}</td>
                        <td className="p-2.5">{acc.description}</td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => setAccusedEntries(accusedEntries.filter((a) => a.id !== acc.id))}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. VICTIM PANEL */}
          {activeTab === "victim" && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>पीड़ित विवरण प्रविष्टि (Victim Details Entry)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Victim Name *</label>
                    <input
                      type="text"
                      value={victimName}
                      onChange={(e) => setVictimName(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Physical Condition *</label>
                    <select
                      value={victimCondition}
                      onChange={(e) => setVictimCondition(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                    >
                      <option value="Not Injured">Not Injured (कोई शारीरिक चोट नहीं)</option>
                      <option value="Simple Hurt">Simple Hurt (साधारण चोट)</option>
                      <option value="Grievously Hurt">Grievously Hurt (गंभीर चोट/फ्रैक्चर)</option>
                      <option value="Deceased">Deceased (मृतक)</option>
                      <option value="Condition Unknown">Condition Unknown</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Injury / Loss Assessment</label>
                    <input
                      type="text"
                      value={victimInjury}
                      onChange={(e) => setVictimInjury(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Relative Name (पिता/पति)</label>
                    <input
                      type="text"
                      value={victimRelative}
                      onChange={(e) => setVictimRelative(e.target.value)}
                      placeholder="उदा. पिता/पति का नाम"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Age (वर्ष)</label>
                    <input
                      type="text"
                      value={victimAge}
                      onChange={(e) => setVictimAge(e.target.value)}
                      placeholder="उदा. 35"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Occupation (व्यवसाय)</label>
                    <input
                      type="text"
                      value={victimOccupation}
                      onChange={(e) => setVictimOccupation(e.target.value)}
                      placeholder="उदा. व्यापार / सेवा"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Address (पता)</label>
                    <input
                      type="text"
                      value={victimAddress}
                      onChange={(e) => setVictimAddress(e.target.value)}
                      placeholder="उदा. पता / कालोनी"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Victim Statement (पीड़ित का बयान)</label>
                  <textarea
                    rows={2}
                    value={victimStatement}
                    onChange={(e) => setVictimStatement(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs leading-relaxed"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    onClick={handleAddVictim}
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold gap-1 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>पीड़ित जोड़ें (Add Victim)</span>
                  </Button>
                </div>
              </div>

              {/* Victim Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">S.No</th>
                      <th className="p-2.5">Victim Name</th>
                      <th className="p-2.5">Condition</th>
                      <th className="p-2.5">Injury / Loss</th>
                      <th className="p-2.5">Statement</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {victimEntries.map((vic, idx) => (
                      <tr key={vic.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold font-mono">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900">{vic.name}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {vic.condition}
                          </span>
                        </td>
                        <td className="p-2.5">{vic.injury}</td>
                        <td className="p-2.5 truncate max-w-xs">{vic.statement}</td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => setVictimEntries(victimEntries.filter((v) => v.id !== vic.id))}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. WITNESS PANEL */}
          {activeTab === "witness" && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>गवाह विवरण एवं बयान प्रविष्टि (Witness Entry)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Witness Name *</label>
                    <input
                      type="text"
                      value={witnessName}
                      onChange={(e) => setWitnessName(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Relative Name</label>
                    <input
                      type="text"
                      value={witnessRelative}
                      onChange={(e) => setWitnessRelative(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Role / Evidence Type *</label>
                    <select
                      value={witnessRole}
                      onChange={(e) => setWitnessRole(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    >
                      <option value="Eye-witness / Spot Witness">Eye-witness / Spot Witness</option>
                      <option value="Valet Parking Guard">Valet Parking Guard / Security</option>
                      <option value="Complainant Corroborator">Complainant Corroborator</option>
                      <option value="Medical Officer / Doctor">Medical Officer / Doctor</option>
                      <option value="Forensic Expert">Forensic Expert</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mobile No</label>
                    <input
                      type="text"
                      value={witnessMobile}
                      onChange={(e) => setWitnessMobile(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Witness Statement (गवाह का बयान) *</label>
                  <textarea
                    rows={2}
                    value={witnessStatement}
                    onChange={(e) => setWitnessStatement(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs leading-relaxed"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    onClick={handleAddWitness}
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold gap-1 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>गवाह जोड़ें (Add Witness)</span>
                  </Button>
                </div>
              </div>

              {/* Witness Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">S.No</th>
                      <th className="p-2.5">Witness Name</th>
                      <th className="p-2.5">Evidence Type / Role</th>
                      <th className="p-2.5">Mobile</th>
                      <th className="p-2.5">Statement</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {witnessEntries.map((wit, idx) => (
                      <tr key={wit.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold font-mono">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900">{wit.name}</td>
                        <td className="p-2.5">{wit.role}</td>
                        <td className="p-2.5 font-mono">{wit.mobile}</td>
                        <td className="p-2.5 truncate max-w-xs">{wit.statement}</td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => setWitnessEntries(witnessEntries.filter((w) => w.id !== wit.id))}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. PROPERTY OF INTEREST PANEL */}
          {activeTab === "property" && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <span>मुकदमा से संबंधित संपत्ति विवरण (Property of Interest)</span>
                  </h4>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                    <span>Any Property of Interest?</span>
                    <input
                      type="checkbox"
                      checked={hasProperty}
                      onChange={(e) => setHasProperty(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                  </label>
                </div>

                {hasProperty && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Property Category *</label>
                        <select
                          value={propCategory}
                          onChange={(e) => setPropCategory(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                        >
                          <option value="ELECTRICAL / VALUABLE GADGETS & CASH">ELECTRICAL / VALUABLE GADGETS & CASH</option>
                          <option value="JEWELLERY / BULLION">JEWELLERY / BULLION</option>
                          <option value="ARMS AND AMMUNITION">ARMS AND AMMUNITION</option>
                          <option value="MOTOR VEHICLE">MOTOR VEHICLE</option>
                          <option value="DOCUMENTS / VALUABLE SECURITY">DOCUMENTS / VALUABLE SECURITY</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Estimated Value (Lost / Stolen) ₹ *</label>
                        <input
                          type="number"
                          value={propEstimatedValue}
                          onChange={(e) => setPropEstimatedValue(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Seized / Recovered Value ₹</label>
                        <input
                          type="number"
                          value={propRecoveredValue}
                          onChange={(e) => setPropRecoveredValue(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Property Description & Make / Serial No. *</label>
                      <input
                        type="text"
                        value={propDesc}
                        onChange={(e) => setPropDesc(e.target.value)}
                        placeholder="Brand, model, serial number, identification marks..."
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs font-semibold">Property status<select className="mt-1 w-full rounded border p-2" value={propStatus} onChange={e=>setPropStatus(e.target.value)}><option value="">Not recorded</option><option value="STOLEN">Stolen / missing</option><option value="RECOVERED">Recovered</option><option value="SEIZED">Seized</option></select></label>
                      <label className="text-xs font-semibold">Actual recovery / seizure date<input className="mt-1 w-full rounded border p-2" type="date" value={propRecoveredAt} onChange={e=>setPropRecoveredAt(e.target.value)} /></label>
                    </div>
                    <div className="flex justify-end pt-1">
                      <Button
                        type="button"
                        onClick={handleAddProperty}
                        size="sm"
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold gap-1 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>संपत्ति जोड़ें (Add Property)</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Property Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">S.No</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5">Estimated Value</th>
                      <th className="p-2.5">Recovered Value</th><th className="p-2.5">Status / recovery date</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {propertyEntries.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold font-mono">{idx + 1}</td>
                        <td className="p-2.5 font-semibold text-slate-900">{p.category}</td>
                        <td className="p-2.5">{p.description}</td>
                        <td className="p-2.5 font-mono font-bold text-red-700">₹{p.estimatedValue?.toLocaleString?.("en-IN") || p.estimatedValue}</td>
                        <td className="p-2.5 font-mono text-emerald-700">₹{p.recoveredValue?.toLocaleString?.("en-IN") || p.recoveredValue}</td>
                        <td className="p-2.5">{p.status || "Not recorded"} {p.recoveredAt || ""}</td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => setPropertyEntries(propertyEntries.filter((item) => item.id !== p.id))}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">
              भरे गए विवरण स्वतः आधिकारिक <strong>Crime Detail Form (IIF-II)</strong> के रूप में एफआईआर केस रिकॉर्ड में संलग्न होंगे।
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs font-semibold cursor-pointer"
            >
              रद्द करें (Cancel)
            </Button>

            <Button
              type="button"
              onClick={() => setShowPdfPreview(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md gap-1.5 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>पूर्वावलोकन देखें एवं पुष्टि करें (Preview &amp; Confirm) →</span>
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* OFFICIAL CCTNS IIF-II PROFORMA PREVIEW (MATCHING HARYANA POLICE PDF EXACTLY) */}
        {/* ========================================================================= */}
        {showPdfPreview && (
          <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex flex-col p-2 sm:p-4 overflow-hidden animate-in fade-in-0 duration-200">
            {/* Top Toolbar */}
            <div className="bg-[#0b192c] text-white px-4 py-3 rounded-t-xl border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-md shrink-0">
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPdfPreview(false)}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>वापस संपादन करें (Back to Edit)</span>
                </Button>
                <div className="hidden sm:block">
                  <h4 className="text-xs sm:text-sm font-black text-white">
                    I.I.F.-II / अपराध विवरण प्रपत्र - CCTNS Proforma Preview
                  </h4>
                  <p className="text-[10px] text-slate-300">
                    FIR No: {fir.cctnsFirNumber || fir.firNumber} • PS: {fir.policeStation} • Dist: {fir.district}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadProforma}
                  className="bg-white hover:bg-slate-100 text-slate-800 border-slate-300 font-bold text-xs gap-1.5 cursor-pointer"
                  title="Download filled Crime Details Form IIF-II as HTML / A4 Document"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>डाउनलोड A4 प्रपत्र (Download)</span>
                </Button>

                <Button
                  size="sm"
                  onClick={handlePrintProforma}
                  className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
                  title="Print official A4 proforma"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>प्रिंट A4 (Print)</span>
                </Button>

                <Button
                  size="sm"
                  onClick={handleSaveToFirProfile}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs gap-1.5 shadow-lg shadow-emerald-900/40 cursor-pointer animate-pulse"
                  title="Confirm and Save Crime Details Form to FIR Profile Documents"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? "सहेजा जा रहा है..." : "✓ पुष्टि करें एवं अंतिम सबमिट करें (Confirm & Final Submit)"}</span>
                </Button>

                <button
                  type="button"
                  onClick={() => setShowPdfPreview(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Proforma Canvas */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-800/60 flex justify-center">
              <div
                id="cctns-iif2-official-sheet"
                data-no-translate="true"
                data-processed="true"
                data-autofill="true"
                className="bg-white text-black p-8 sm:p-14 shadow-2xl rounded-sm max-w-4xl w-full font-serif border border-slate-400 space-y-6 page-sheet no-translate user-data"
                style={{ minHeight: "1100px", lineHeight: "1.4" }}
              >
                {/* Page 1 */}
                <div className="page-sheet">
                  {/* Top Right Header */}
                  <div className="text-right text-xs font-semibold space-y-0.5 mb-2">
                    <p className="font-bold">Haryana Police (हरियाणा पुलिस)</p>
                    <p className="text-[11px] font-bold">I.I.F.-II/एकीकृत जाँच फार्म-II</p>
                  </div>

                  {/* Centered Heading */}
                  <div className="text-center my-4">
                    <h2 className="text-sm sm:text-base font-bold uppercase underline tracking-wide">
                      CRIME DETAILS FORM (अपराध विवरण प्रपत्र)
                    </h2>
                  </div>

                  {/* Section 1: District, P.S., Year, FIR No., Date */}
                  <div className="space-y-1.5 text-xs font-serif mb-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <strong>1. District (जिला):</strong> {fir.district || "Gurugram"}
                      </div>
                      <div>
                        <strong>P.S. (थाना):</strong> {fir.policeStation || "Sector 29"}
                      </div>
                      <div>
                        <strong>Year (वर्ष):</strong> {fir.firYear || new Date().getFullYear()}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <strong>FIR No. (प्र.सू.रि. सं.):</strong> {fir.cctnsFirNumber || fir.firNumber}
                      </div>
                      <div>
                        <strong>Date (दिनांक):</strong> {fir.firDate}
                      </div>
                      <div></div>
                    </div>
                  </div>

                  {/* Section 2: Acts and Sections Table */}
                  <div className="mb-3">
                    <table className="w-full border-collapse border border-slate-600 text-[11px]">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-600 px-2 py-1 text-center w-16">
                            2. S.No. (क्र.सं.)
                          </th>
                          <th className="border border-slate-600 px-2 py-1 text-left">
                            Acts (अधिनियम)
                          </th>
                          <th className="border border-slate-600 px-2 py-1 text-left">
                            Sections (धारा(एं))
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {actsAndSectionsList.map((item, idx) => (
                          <tr key={idx}>
                            <td className="border border-slate-600 px-2 py-1 text-center font-mono">
                              {item.sNo}
                            </td>
                            <td className="border border-slate-600 px-2 py-1 font-bold">
                              {item.act}
                            </td>
                            <td className="border border-slate-600 px-2 py-1 font-mono font-bold">
                              {item.sections}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Section 3: Place of occurrence shown by */}
                  <div className="mb-3">
                    <div className="font-bold text-xs mb-1">
                      3. Place of occurrence shown by (के द्वारा दिखाया गया घटना स्थल):
                    </div>
                    <table className="w-full border-collapse border border-slate-600 text-[11px]">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-600 px-2 py-1 text-center w-16">
                            S.No. (क्र.सं.)
                          </th>
                          <th className="border border-slate-600 px-2 py-1 text-left">
                            Name (नाम):
                          </th>
                          <th className="border border-slate-600 px-2 py-1 text-left">
                            Relative Type (संबंध प्रकार)
                          </th>
                          <th className="border border-slate-600 px-2 py-1 text-left">
                            Relative Name (संबंध का नाम)
                          </th>
                          <th className="border border-slate-600 px-2 py-1 text-left">
                            Address (पता)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-slate-600 px-2 py-1 text-center">1</td>
                          <td className="border border-slate-600 px-2 py-1 font-bold">
                            {shownByName || fir.complainantName}
                          </td>
                          <td className="border border-slate-600 px-2 py-1">
                            {shownByRelationType}
                          </td>
                          <td className="border border-slate-600 px-2 py-1">
                            {shownByRelative || fir.complainantFatherSpouse || "—"}
                          </td>
                          <td className="border border-slate-600 px-2 py-1 text-[10px]">
                            <div>Permanent Address: {shownByAddress}, {shownByDistrict}</div>
                            <div>Present Address: {shownByAddress}, {shownByDistrict}</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Section 4: Type of crime */}
                  <div className="mb-3 space-y-1.5">
                    <div className="font-bold text-xs">4. Type of crime (अपराध का प्रकार):</div>

                    {/* (i) & (ii) side by side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-start gap-1">
                        <span className="font-bold text-xs shrink-0">(i)</span>
                        <table className="w-full border-collapse border border-slate-600 text-[11px]">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="border border-slate-600 px-2 py-0.5 text-center w-14">S. No. (क्र.सं.)</th>
                              <th className="border border-slate-600 px-2 py-0.5 text-left">Major Head (मुख्य शीर्ष)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-slate-600 px-2 py-1 text-center">1</td>
                              <td className="border border-slate-600 px-2 py-1 font-bold uppercase">{majorHead || "PROPERTY THEFT / OFFENCE"}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="flex items-start gap-1">
                        <span className="font-bold text-xs shrink-0">(ii)</span>
                        <table className="w-full border-collapse border border-slate-600 text-[11px]">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="border border-slate-600 px-2 py-0.5 text-center w-14">S. No. (क्र.सं.)</th>
                              <th className="border border-slate-600 px-2 py-0.5 text-left">Minor Head (लघु शीर्ष)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-slate-600 px-2 py-1 text-center">1</td>
                              <td className="border border-slate-600 px-2 py-1 uppercase">{minorHead || "FOR GAIN"}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* (iii) Modus Operandi */}
                    <div className="flex items-start gap-1">
                      <span className="font-bold text-xs shrink-0">(iii)</span>
                      <table className="w-full border-collapse border border-slate-600 text-[11px]">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="border border-slate-600 px-2 py-0.5 text-center w-14">S. No. (क्र.सं.)</th>
                            <th className="border border-slate-600 px-2 py-0.5 text-left">Modus Operandi (तरीका वारदात)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-600 px-2 py-1 text-center">1</td>
                            <td className="border border-slate-600 px-2 py-1 uppercase">{method || "BLUNT WEAPON / FORCED ENTRY"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* (iv) Conveyance(s) Used */}
                    <div className="flex items-start gap-1">
                      <span className="font-bold text-xs shrink-0">(iv)</span>
                      <table className="w-full border-collapse border border-slate-600 text-[11px]">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="border border-slate-600 px-2 py-0.5 text-center w-14">S. No. (क्र.सं.)</th>
                            <th className="border border-slate-600 px-2 py-0.5 text-left">Conveyance(s) Used (वाहन प्रयोग किया गया)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-600 px-2 py-1 text-center">1</td>
                            <td className="border border-slate-600 px-2 py-1">{conveyanceType} {conveyanceNumber ? `(${conveyanceNumber})` : ""}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* (v) Character Assumed */}
                    <div className="flex items-start gap-1">
                      <span className="font-bold text-xs shrink-0">(v)</span>
                      <table className="w-full border-collapse border border-slate-600 text-[11px]">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="border border-slate-600 px-2 py-0.5 text-center w-14">S. No. (क्र.सं.)</th>
                            <th className="border border-slate-600 px-2 py-0.5 text-left">Character Assumed (चरित्रधारण (वेशभूषा))</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-600 px-2 py-1 text-center">1</td>
                            <td className="border border-slate-600 px-2 py-1 uppercase">{characterAssumed || "PASSERBY / RIDER"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* (vi) Language / Dialect Used */}
                    <div className="flex items-start gap-1">
                      <span className="font-bold text-xs shrink-0">(vi)</span>
                      <table className="w-full border-collapse border border-slate-600 text-[11px]">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="border border-slate-600 px-2 py-0.5 text-center w-14">S. No. (क्र.सं.)</th>
                            <th className="border border-slate-600 px-2 py-0.5 text-left">Language / Dialect Used (भाषा / बोली का प्रयोग)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-600 px-2 py-1 text-center">1</td>
                            <td className="border border-slate-600 px-2 py-1 uppercase">{languageDialect || "HINDI / HARYANVI"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* (vii) Special Feature */}
                    <div className="flex items-start gap-1">
                      <span className="font-bold text-xs shrink-0">(vii)</span>
                      <table className="w-full border-collapse border border-slate-600 text-[11px]">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="border border-slate-600 px-2 py-0.5 text-center w-14">S. No. (क्र.सं.)</th>
                            <th className="border border-slate-600 px-2 py-0.5 text-left">Special Feature (विशेष लक्षण)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-600 px-2 py-1 text-center">1</td>
                            <td className="border border-slate-600 px-2 py-1 uppercase">{specialFeature || "CHANGING OF CLOTHES / CONCEALED FACE"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* (viii) Type of place of occurrence */}
                    <div className="flex items-start gap-1">
                      <span className="font-bold text-xs shrink-0">(viii)</span>
                      <table className="w-full border-collapse border border-slate-600 text-[11px]">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="border border-slate-600 px-2 py-0.5 text-center w-14">S. No. (क्र.सं.)</th>
                            <th className="border border-slate-600 px-2 py-0.5 text-left">Type of place of occurrence (घटनास्थल का प्रकार)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-600 px-2 py-1 text-center">1</td>
                            <td className="border border-slate-600 px-2 py-1 space-y-0.5">
                              <div><strong>Major Type of Place of Occurence:</strong> {majorPlaceType}</div>
                              <div><strong>Minor Type of Place of Occurence:</strong> {minorPlaceType}</div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* (ix) Type of property stolen */}
                    <div className="flex items-start gap-1">
                      <span className="font-bold text-xs shrink-0">(ix)</span>
                      <table className="w-full border-collapse border border-slate-600 text-[11px]">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="border border-slate-600 px-2 py-0.5 text-center w-14">S. No. (क्र.सं.)</th>
                            <th className="border border-slate-600 px-2 py-0.5 text-left">Type of property stolen (चोरी की गयी सम्पत्ति का प्रकार)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {propertyEntries && propertyEntries.length > 0 ? (
                            propertyEntries.map((p, idx) => (
                              <tr key={idx}>
                                <td className="border border-slate-600 px-2 py-1 text-center">{idx + 1}</td>
                                <td className="border border-slate-600 px-2 py-1 font-semibold">{p.category}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="border border-slate-600 px-2 py-1 text-center">1</td>
                              <td className="border border-slate-600 px-2 py-1 font-semibold">{propCategory}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 5: Particulars of the victim(s) */}
                  <div className="mb-3">
                    <div className="font-bold text-xs mb-1">
                      5. Particulars of the victim(s) (पीड़ित (ओं) का विवरण):
                    </div>
                    <table className="w-full border-collapse border border-slate-600 text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 font-bold">
                          <th className="border border-slate-600 px-1 py-1 text-center">S. No.<br/>(क्र.सं.)</th>
                          <th className="border border-slate-600 px-1.5 py-1 text-left">Name (नाम)</th>
                          <th className="border border-slate-600 px-1.5 py-1 text-left">Father&apos;s / Husband&apos;s Name<br/>(पिता / पति का नाम)</th>
                          <th className="border border-slate-600 px-1 py-1 text-center">Date of Birth / Age<br/>(जन्म तिथि / आयु)</th>
                          <th className="border border-slate-600 px-1 py-1 text-center">Sex<br/>(लिंग)</th>
                          <th className="border border-slate-600 px-1 py-1 text-center">Nationality<br/>(राष्ट्रीयता)</th>
                          <th className="border border-slate-600 px-1 py-1 text-center">Religion<br/>(धर्म)</th>
                        </tr>
                        <tr className="bg-slate-50 text-slate-500 font-mono text-[9px] text-center">
                          <th className="border border-slate-600 py-0.5">1</th>
                          <th className="border border-slate-600 py-0.5">2</th>
                          <th className="border border-slate-600 py-0.5">3</th>
                          <th className="border border-slate-600 py-0.5">4</th>
                          <th className="border border-slate-600 py-0.5">5</th>
                          <th className="border border-slate-600 py-0.5">6</th>
                          <th className="border border-slate-600 py-0.5">7</th>
                        </tr>
                      </thead>
                      <tbody>
                        {victimEntries && victimEntries.length > 0 ? (
                          victimEntries.map((vic, idx) => (
                            <tr key={vic.id || idx}>
                              <td className="border border-slate-600 px-1 py-1 text-center font-mono">{idx + 1}</td>
                              <td className="border border-slate-600 px-1.5 py-1 font-bold uppercase">{vic.name || "—"}</td>
                              <td className="border border-slate-600 px-1.5 py-1">{vic.relativeName ? `Father/Spouse: ${vic.relativeName}` : (shownByRelative ? `Father: ${shownByRelative}` : "—")}</td>
                              <td className="border border-slate-600 px-1 py-1 text-center font-mono">{vic.dob ? `${vic.dob} / ` : ""}{vic.age || shownByAge || "—"}</td>
                              <td className="border border-slate-600 px-1 py-1 text-center">{vic.gender || "—"}</td>
                              <td className="border border-slate-600 px-1 py-1 text-center">{vic.nationality || "Indian"}</td>
                              <td className="border border-slate-600 px-1 py-1 text-center">{vic.religion || "Hindu"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="border border-slate-600 px-1 py-1 text-center">1</td>
                            <td className="border border-slate-600 px-1.5 py-1 font-bold uppercase">{victimName || fir.complainantName || "—"}</td>
                            <td className="border border-slate-600 px-1.5 py-1">{shownByRelative ? `Father: ${shownByRelative}` : "—"}</td>
                            <td className="border border-slate-600 px-1 py-1 text-center font-mono">{shownByAge || "—"}</td>
                            <td className="border border-slate-600 px-1 py-1 text-center">{victimGender || "Male"}</td>
                            <td className="border border-slate-600 px-1 py-1 text-center">Indian</td>
                            <td className="border border-slate-600 px-1 py-1 text-center">Hindu</td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    <table className="w-full border-collapse border border-slate-600 text-[10px] mt-1">
                      <thead>
                        <tr className="bg-slate-100 font-bold">
                          <th className="border border-slate-600 px-1 py-1 text-left">Whether SC/ST/OBC<br/>(यदि अनु.जाति / जनजाति / पिछड़ी जाति)</th>
                          <th className="border border-slate-600 px-1.5 py-1 text-left">Occupation<br/>(व्यवसाय)</th>
                          <th className="border border-slate-600 px-2 py-1 text-left">Address<br/>(पता)</th>
                          <th className="border border-slate-600 px-1.5 py-1 text-left">Injury (Grievous / Simple)<br/>(घायल (गंभीर / साधारण))</th>
                          <th className="border border-slate-600 px-1.5 py-1 text-left">Means of causing injury<br/>(घायल होने का कारण)</th>
                        </tr>
                        <tr className="bg-slate-50 text-slate-500 font-mono text-[9px] text-center">
                          <th className="border border-slate-600 py-0.5">8</th>
                          <th className="border border-slate-600 py-0.5">9</th>
                          <th className="border border-slate-600 py-0.5">10</th>
                          <th className="border border-slate-600 py-0.5">11</th>
                          <th className="border border-slate-600 py-0.5">12</th>
                        </tr>
                      </thead>
                      <tbody>
                        {victimEntries && victimEntries.length > 0 ? (
                          victimEntries.map((vic, idx) => (
                            <tr key={vic.id || idx}>
                              <td className="border border-slate-600 px-1 py-1">{vic.caste || "General"}</td>
                              <td className="border border-slate-600 px-1.5 py-1">{vic.occupation || "Business / Private"}</td>
                              <td className="border border-slate-600 px-2 py-1 text-[9px]">
                                <div>Present Address: {vic.address || shownByAddress || "—"}{shownByDistrict ? `, ${shownByDistrict}` : ""}</div>
                                <div>Permanent Address: {vic.address || shownByAddress || "—"}{shownByDistrict ? `, ${shownByDistrict}` : ""}</div>
                              </td>
                              <td className="border border-slate-600 px-1.5 py-1 font-semibold">{vic.injury || vic.condition || "None / Not Injured"}</td>
                              <td className="border border-slate-600 px-1.5 py-1">{vic.statement?.slice(0, 50) || "—"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="border border-slate-600 px-1 py-1">General</td>
                            <td className="border border-slate-600 px-1.5 py-1">Business / Private</td>
                            <td className="border border-slate-600 px-2 py-1 text-[9px]">
                              <div>Present Address: {shownByAddress || "—"}{shownByDistrict ? `, ${shownByDistrict}` : ""}</div>
                              <div>Permanent Address: {shownByAddress || "—"}{shownByDistrict ? `, ${shownByDistrict}` : ""}</div>
                            </td>
                            <td className="border border-slate-600 px-1.5 py-1 font-semibold">{victimInjury || "None / Not Injured"}</td>
                            <td className="border border-slate-600 px-1.5 py-1">{physicalEvidenceDetails?.slice(0, 45) || "—"}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Section 6: Motive of crime */}
                  <div className="mb-3">
                    <div className="font-bold text-xs mb-1">6. Motive of crime (अपराध का उद्देश्य):</div>
                    <table className="w-full border-collapse border border-slate-600 text-[11px]">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-600 px-2 py-0.5 text-center w-14">S. No. (क्र.सं.)</th>
                          <th className="border border-slate-600 px-2 py-0.5 text-left">Motive of crime (अपराध का उद्देश्य)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-slate-600 px-2 py-1 text-center">1</td>
                          <td className="border border-slate-600 px-2 py-1 uppercase">{motive}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Section 7: Details of properties stolen / involved */}
                  <div className="mb-4">
                    <div className="font-bold text-xs mb-1">
                      7. Details of properties stolen / involved (चोरी गयी / संलिप्त सम्पत्ति का विवरण):
                    </div>
                    <table className="w-full border-collapse border border-slate-600 text-[11px]">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-600 px-2 py-0.5 text-center w-14">S. No. (क्र.सं.)</th>
                          <th className="border border-slate-600 px-2 py-0.5 text-left">Property Type (सम्पत्ति का प्रकार)</th>
                          <th className="border border-slate-600 px-2 py-0.5 text-left">Property Name (सम्पत्ति का नाम)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {propertyEntries && propertyEntries.length > 0 ? (
                          propertyEntries.map((p, idx) => (
                            <tr key={idx}>
                              <td className="border border-slate-600 px-2 py-1 text-center font-mono">{idx + 1}</td>
                              <td className="border border-slate-600 px-2 py-1 font-semibold">{p.category}</td>
                              <td className="border border-slate-600 px-2 py-1 uppercase font-bold">{p.description}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="border border-slate-600 px-2 py-1 text-center">1</td>
                            <td className="border border-slate-600 px-2 py-1 font-semibold">{propCategory}</td>
                            <td className="border border-slate-600 px-2 py-1 uppercase font-bold">{propDesc}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Page 1 Number */}
                  <div className="text-center font-bold text-xs py-2 border-t border-slate-300">
                    1
                  </div>
                </div>

                {/* Page 2 */}
                <div className="page-sheet pt-6 border-t-2 border-dashed border-slate-400 mt-6">
                  <div className="text-right text-xs font-semibold mb-2">
                    <p className="font-bold">Haryana Police (हरियाणा पुलिस) • I.I.F.-II/एकीकृत जाँच फार्म-II</p>
                    <p className="text-[10px] text-slate-500 font-mono">FIR No: {fir.cctnsFirNumber || fir.firNumber} • Page 2</p>
                  </div>

                  {/* Section 8: Suspected / Accused Persons */}
                  <div className="mb-4">
                    <div className="font-bold text-xs mb-1">
                      8. Details of Suspected / Accused Persons (संदिग्ध / अभियुक्तों का विवरण):
                    </div>
                    <table className="w-full border-collapse border border-slate-600 text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 font-bold">
                          <th className="border border-slate-600 px-1 py-1 text-center w-10">क्र.सं.</th>
                          <th className="border border-slate-600 px-1.5 py-1 text-left">स्थिति (Status)</th>
                          <th className="border border-slate-600 px-2 py-1 text-left">नाम व उपनाम (Name &amp; Alias)</th>
                          <th className="border border-slate-600 px-1.5 py-1 text-center">लिंग / आयु</th>
                          <th className="border border-slate-600 px-2 py-1 text-left">शारीरिक विवरण व कद</th>
                          <th className="border border-slate-600 px-2 py-1 text-left">पहने हुए वस्त्र व पहचान चिह्न</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accusedEntries.map((acc, idx) => (
                          <tr key={idx}>
                            <td className="border border-slate-600 px-1 py-1 text-center font-mono">{idx + 1}</td>
                            <td className="border border-slate-600 px-1.5 py-1 font-bold">{acc.accusedType}</td>
                            <td className="border border-slate-600 px-2 py-1 font-bold">
                              {acc.name} {acc.alias ? `(${acc.alias})` : ""}
                            </td>
                            <td className="border border-slate-600 px-1.5 py-1 text-center">{acc.gender || "Male"} / {acc.age || "25-35"}</td>
                            <td className="border border-slate-600 px-2 py-1">{acc.description || "—"}</td>
                            <td className="border border-slate-600 px-2 py-1">
                              {acc.clothes ? acc.clothes : (accusedClothes || "साधारण वस्त्र")} {acc.marks ? `• ${acc.marks}` : (accusedMarks ? `• ${accusedMarks}` : "")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Section 9: Witnesses */}
                  <div className="mb-4">
                    <div className="font-bold text-xs mb-1">
                      9. Details of Witnesses (साक्षियों का विवरण):
                    </div>
                    <table className="w-full border-collapse border border-slate-600 text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 font-bold">
                          <th className="border border-slate-600 px-1 py-1 text-center w-10">क्र.सं.</th>
                          <th className="border border-slate-600 px-2 py-1 text-left">साक्षी का नाम व संबंध</th>
                          <th className="border border-slate-600 px-2 py-1 text-left">भूमिका / साक्ष्य प्रकार</th>
                          <th className="border border-slate-600 px-2 py-1 text-left">संपर्क व पता</th>
                          <th className="border border-slate-600 px-2 py-1 text-left">बयान का सार (Statement Summary)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {witnessEntries && witnessEntries.length > 0 ? (
                          witnessEntries.map((wit, idx) => (
                            <tr key={idx}>
                              <td className="border border-slate-600 px-1 py-1 text-center font-mono">{idx + 1}</td>
                              <td className="border border-slate-600 px-2 py-1 font-bold">
                                {wit.name} {wit.relativeName ? `s/o ${wit.relativeName}` : ""}
                              </td>
                              <td className="border border-slate-600 px-2 py-1">{wit.role || "Spot Witness"}</td>
                              <td className="border border-slate-600 px-2 py-1 font-mono text-[9px]">
                                {wit.mobile || "—"} {wit.address ? `(${wit.address})` : ""}
                              </td>
                              <td className="border border-slate-600 px-2 py-1 italic">{wit.statement || "—"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="border border-slate-600 px-2 py-2 text-center text-slate-500 italic">
                              कोई स्वतंत्र साक्षी अभी दर्ज नहीं / Witnesses to be examined during ongoing investigation
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Section 10: Place of Occurrence Detailed Inspection & Boundaries */}
                  <div className="mb-6 border border-slate-600 p-3 text-[11px] space-y-2 bg-slate-50/40">
                    <div className="font-bold text-xs uppercase underline">
                      10. Place of Occurrence Inspection &amp; Physical Boundaries (घटनास्थल निरीक्षण एवं चौहद्दी विवरण):
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                      <div><strong>GPS अक्षांश (Latitude):</strong> {latitude}</div>
                      <div><strong>GPS देशांतर (Longitude):</strong> {longitude}</div>
                      <div><strong>बीट संख्या (Beat No):</strong> {beatNo}</div>
                      <div><strong>निरीक्षण दिनांक व समय:</strong> {visitDateTime} hrs</div>
                    </div>
                    <div className="border-t border-slate-400 pt-2 grid grid-cols-2 gap-2 text-[10px]">
                      <div><strong>पूर्व (East):</strong> {eastBoundary || "रास्ता / मुख्य मार्ग"}</div>
                      <div><strong>पश्चिम (West):</strong> {westBoundary || "मकान / खुला स्थान"}</div>
                      <div><strong>उत्तर (North):</strong> {northBoundary || "सड़क / गली"}</div>
                      <div><strong>दक्षिण (South):</strong> {southBoundary || "प्लाॅट / कृषि भूमि"}</div>
                    </div>
                    <div className="border-t border-slate-400 pt-2 text-[10px]">
                      <strong>विवेचक द्वारा घटनास्थल निरीक्षण की संक्षिप्त टिप्पणी:</strong>
                      <p className="mt-0.5">{description}</p>
                    </div>
                    <div className="border-t border-slate-400 pt-2 text-[10px]">
                      <strong>घटनास्थल से संकलित भौतिक साक्ष्य (Physical Evidence Gathered):</strong>
                      <p className="mt-0.5">{physicalEvidenceDetails}</p>
                    </div>
                  </div>

                  {/* Official Signatures & Seal Block */}
                  <div className="pt-6 border-t border-slate-400 flex items-end justify-between text-xs">
                    <div className="space-y-1 text-[11px]">
                      <p><strong>निरीक्षणकर्ता अधिकारी:</strong> {currentUserName}</p>
                      <p><strong>पद / बेल्ट सं.:</strong> Sub-Inspector / Investigating Officer</p>
                      <p><strong>थाना:</strong> {fir.policeStation}, {fir.district}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Date: {visitDateTime ? visitDateTime.slice(0, 10) : new Date().toISOString().slice(0, 10)}</p>
                    </div>

                    <div className="text-center space-y-12">
                      <div className="w-24 h-24 border-2 border-dashed border-slate-400 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 mx-auto">
                        थाना मुहर / Official Seal
                      </div>
                      <div className="border-t border-slate-800 pt-1 font-bold text-xs px-6">
                        हस्ताक्षर अनुसंधान अधिकारी (Signature of IO)
                      </div>
                    </div>
                  </div>

                  {/* Page 2 Number */}
                  <div className="text-center font-bold text-xs pt-4">
                    2
                  </div>

                  {/* Bottom Confirmation Action Banner (no-print) */}
                  <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg my-6 no-print">
                    <div className="space-y-1">
                      <h5 className="font-bold text-sm text-emerald-950 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>प्रपत्र पूर्वावलोकन सत्यापन (Crime Details Proforma Verification)</span>
                      </h5>
                      <p className="text-xs text-emerald-800">
                        कृपया ऊपर भरे गए समस्त विवरणों की भली-भांति जाँच कर लें। सबमिट करने पर यह अपराध विवरण प्रपत्र FIR प्रोफाइल के दस्तावेजों में पंजीकृत हो जाएगा।
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPdfPreview(false)}
                        className="text-xs font-semibold bg-white hover:bg-slate-50 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                        वापस संपादन करें
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSaveToFirProfile}
                        disabled={isSubmitting}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isSubmitting ? "सहेजा जा रहा है..." : "✓ पुष्टि करें एवं अंतिम सबमिट करें"}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Success Dialog */}
            {isSavedSuccess && (
              <div className="fixed inset-0 z-70 bg-black/70 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-emerald-300 animate-in zoom-in-95">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-300">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      अपराध विवरण प्रपत्र (IIF-II) सफलतापूर्वक सहेजा गया!
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      दस्तावेज FIR प्रोफाइल के <strong>Documents</strong> टैब में पंजीकृत हो चुका है। अब इस केस के लिए <strong>Arrest &amp; Surrender Documents (गिरफ्तारी दस्तावेज)</strong> बनाने की अनुमति अनलॉक हो गई है।
                    </p>
                  </div>

                  <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-left flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                    <div className="text-xs text-purple-900">
                      <span className="font-bold">रोजनामचा आम (GD) ऑटो-सुझाव तैयार:</span>
                      <p className="text-[11px] text-purple-700 mt-0.5 leading-relaxed">
                        अपराध विवरण प्रपत्र (IIF-II) का ऑटो-सुझाव रोजनामचा GD के <strong>Suggestions &amp; Drafts</strong> टैब में दर्ज हो चुका है।
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownloadProforma}
                      className="w-full sm:w-auto text-xs font-semibold gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>प्रपत्र डाउनलोड करें</span>
                    </Button>
                    <a
                      href="/general-diary?tab=SUGGESTIONS_DRAFTS"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>रोजनामचा GD सुझाव देखें</span>
                    </a>
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowPdfPreview(false);
                        onClose();
                      }}
                      className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>FIR Profile पर जाएं</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
