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
} from "lucide-react";
import { FIRItem } from "@/types";
import { firService } from "@/services/firService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  // Form State initialized with FIR's existing data where available
  const [isHeinous, setIsHeinous] = useState(fir.isHeinous || false);
  const [isSensitive, setIsSensitive] = useState(fir.isSensitive || false);

  // 1. Place of Occurrence
  const [longitude, setLongitude] = useState("76.8485° E");
  const [latitude, setLatitude] = useState("30.7046° N");
  const [visitDateTime, setVisitDateTime] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [beatNo, setBeatNo] = useState(fir.beatNumber || "Beat No. 4");
  const [majorPlaceType, setMajorPlaceType] = useState("Commercial Area / Market Complex");
  const [minorPlaceType, setMinorPlaceType] = useState("Vehicle Parking Lot");
  const [gist, setGist] = useState(
    fir.briefFacts || fir.incidentDetails?.slice(0, 300) || ""
  );
  const [description, setDescription] = useState(
    fir.incidentDetails || "Occurrence place inspected. Physical scene examined and site plan drafted."
  );
  const [physicalEvidenceDetails, setPhysicalEvidenceDetails] = useState(
    "Car window pane broken glass fragments collected. Tyre marks photographed. CCTV camera location noted."
  );

  // Shown By
  const [shownByName, setShownByName] = useState(fir.complainantName || "");
  const [shownByRelative, setShownByRelative] = useState(fir.complainantFatherSpouse || "");
  const [shownByRelationType, setShownByRelationType] = useState("Father");
  const [shownByGender, setShownByGender] = useState(fir.complainantGender || "Male");
  const [shownByMobile, setShownByMobile] = useState(fir.complainantMobile || "");
  const [shownByAge, setShownByAge] = useState(String(fir.complainantAge || 34));
  const [shownByAddress, setShownByAddress] = useState(fir.complainantAddress || "Sector 29, Gurugram");
  const [shownByDistrict, setShownByDistrict] = useState(fir.district || "Gurugram");
  const [shownByPs, setShownByPs] = useState(fir.policeStation || "Sector 29 Police Station");

  // 2. Modus Operandi List
  const [motive, setMotive] = useState("CARRY AWAY PROPERTY / FRAUDULENT GAIN");
  const [conveyanceType, setConveyanceType] = useState("Motorcycle / Two Wheeler");
  const [conveyanceColor, setConveyanceColor] = useState("Dark Colour (Black)");
  const [conveyanceNumber, setConveyanceNumber] = useState("Without Number Plate");
  const [majorHead, setMajorHead] = useState(fir.categoryDisplay || "PROPERTY THEFT");
  const [minorHead, setMinorHead] = useState("THEFT FROM VEHICLE / CONVEYANCE");
  const [method, setMethod] = useState("BREAKING CAR WINDOW PANE BY BLUNT INSTRUMENT");
  const [characterAssumed, setCharacterAssumed] = useState("PASSERBY / RIDER");
  const [languageDialect, setLanguageDialect] = useState("HINDI / HARYANVI");
  const [specialFeature, setSpecialFeature] = useState("RIDER WEARING HELMET TO CONCEAL IDENTITY");

  const [modusList, setModusList] = useState<any[]>([
    {
      id: "mo-1",
      motive: "CARRY AWAY PROPERTY / FRAUDULENT GAIN",
      conveyance: "Motorcycle (Black Pulsar), No Plate",
      crimeHead: `${fir.categoryDisplay || "PROPERTY THEFT"} - THEFT FROM VEHICLE`,
      method: "BREAKING CAR WINDOW PANE BY BLUNT INSTRUMENT",
      specialFeature: "RIDER WEARING HELMET TO CONCEAL IDENTITY",
    },
  ]);

  // 3. Accused List
  const [accusedType, setAccusedType] = useState<"Known" | "Unknown">("Unknown");
  const [accusedName, setAccusedName] = useState("Unknown Suspect (Helmet worn)");
  const [accusedAlias, setAccusedAlias] = useState("");
  const [accusedGender, setAccusedGender] = useState("Male");
  const [accusedAge, setAccusedAge] = useState("25-30");
  const [accusedBuild, setAccusedBuild] = useState("Normal / Medium");
  const [accusedComplexion, setAccusedComplexion] = useState("Brownish Dark");
  const [accusedHeight, setAccusedHeight] = useState("5 ft 8 in (172 cm)");
  const [accusedClothes, setAccusedClothes] = useState("Black jacket, dark trousers, full face helmet");
  const [accusedMarks, setAccusedMarks] = useState("Face concealed under black helmet visor");

  const [accusedEntries, setAccusedEntries] = useState<any[]>(
    fir.accusedList?.map((a, idx) => ({
      id: a.id || `acc-${idx + 1}`,
      accusedType: a.isIdentified ? "Known" : "Unknown",
      name: a.name || "Unknown suspect",
      alias: a.alias || "",
      gender: "Male",
      age: "25-30",
      description: a.physicalDescription || "Rider on Pulsar bike",
    })) || [
      {
        id: "acc-1",
        accusedType: "Unknown",
        name: "Unknown suspect (Motorcycle helmet worn)",
        alias: "",
        gender: "Male",
        age: "25-30",
        description: "Medium build, black jacket, rider on Pulsar bike without number plate",
      },
    ]
  );

  // 4. Victim List
  const [victimName, setVictimName] = useState(fir.complainantName || "Vikas Sharma");
  const [victimGender, setVictimGender] = useState(fir.complainantGender || "Male");
  const [victimCondition, setVictimCondition] = useState("Not Injured");
  const [victimInjury, setVictimInjury] = useState("None (Loss of personal property only)");
  const [victimStatement, setVictimStatement] = useState(
    "प्रार्थी ने अपनी गाड़ी पार्क की थी। वापस आने पर खिड़की का शीशा टूटा मिला और अंदर रखा बैग चोरी हो चुका था।"
  );

  const [victimEntries, setVictimEntries] = useState<any[]>([
    {
      id: "vic-1",
      name: fir.complainantName || "Vikas Sharma",
      gender: fir.complainantGender || "Male",
      condition: "Not Injured",
      injury: "Property loss quantified at ₹94,000",
      statement: "प्रार्थी ने अपनी गाड़ी पार्क की थी। वापस आने पर खिड़की का शीशा टूटा मिला और अंदर रखा बैग चोरी हो चुका था।",
    },
  ]);

  // 5. Witness List
  const [witnessName, setWitnessName] = useState("Rameshwar Dayal");
  const [witnessRelative, setWitnessRelative] = useState("Sh. Jai Kishan");
  const [witnessRole, setWitnessRole] = useState("Valet Parking Guard / Eye-witness");
  const [witnessMobile, setWitnessMobile] = useState("9812904411");
  const [witnessStatement, setWitnessStatement] = useState(
    "मैंने रात करीब 10:15 बजे दो युवकों को बिना नंबर की पल्सर मोटरसाइकिल पर गाड़ी के पास रुकते और फिर तेजी से गलेरिया रोड की तरफ भागते देखा था।"
  );

  const [witnessEntries, setWitnessEntries] = useState<any[]>([
    {
      id: "wit-1",
      name: "Rameshwar Dayal",
      relativeName: "Sh. Jai Kishan",
      role: "Valet Parking Guard / Eye-witness",
      mobile: "9812904411",
      statement: "मैंने रात करीब 10:15 बजे दो युवकों को बिना नंबर की पल्सर मोटरसाइकिल पर गाड़ी के पास रुकते और फिर तेजी से भागते देखा था।",
    },
  ]);

  // 6. Property of Interest
  const [hasProperty, setHasProperty] = useState<boolean>(true);
  const [propCategory, setPropCategory] = useState("ELECTRICAL / VALUABLE GADGETS & CASH");
  const [propType, setPropType] = useState("HP Laptop Pavilion, Leather Bag, Cash Currency");
  const [propEstimatedValue, setPropEstimatedValue] = useState(
    String(fir.totalPropertyEstimatedValue || 94000)
  );
  const [propRecoveredValue, setPropRecoveredValue] = useState("0");
  const [propDesc, setPropDesc] = useState(
    fir.stolenPropertyDetails || "HP Laptop Serial HP-8849201, Black leather bag, Rs 24,000 currency notes"
  );

  const [propertyEntries, setPropertyEntries] = useState<any[]>([
    {
      id: "prop-1",
      category: "ELECTRICAL / VALUABLE GADGETS & CASH",
      description: fir.stolenPropertyDetails || "HP Laptop Serial HP-8849201, Black leather bag, Rs 24,000 currency notes",
      estimatedValue: fir.totalPropertyEstimatedValue || 94000,
      recoveredValue: 0,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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
      description: `${accusedBuild}, ${accusedComplexion}, Height: ${accusedHeight}, Clothes: ${accusedClothes}`,
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
      gender: victimGender,
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
    };
    setWitnessEntries([...witnessEntries, newEntry]);
    setWitnessName("");
    setWitnessStatement("");
  };

  // Add Property handler
  const handleAddProperty = () => {
    if (!propDesc.trim()) return;
    const newEntry = {
      id: `prop-${Date.now()}`,
      category: propCategory,
      description: propDesc,
      estimatedValue: Number(propEstimatedValue) || 0,
      recoveredValue: Number(propRecoveredValue) || 0,
    };
    setPropertyEntries([...propertyEntries, newEntry]);
    setPropDesc("");
  };

  // Final Submit Handler
  const handleFinalSubmit = () => {
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

    const updated = firService.saveCrimeDetails(fir.id, crimeDetailsPayload, currentUserName);
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Method (तरीका)</label>
                    <input
                      type="text"
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Language / Dialect Used</label>
                    <input
                      type="text"
                      value={languageDialect}
                      onChange={(e) => setLanguageDialect(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Special Feature</label>
                    <input
                      type="text"
                      value={specialFeature}
                      onChange={(e) => setSpecialFeature(e.target.value)}
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
                      <th className="p-2.5">Recovered Value</th>
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
              onClick={() => setShowConfirmDialog(true)}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>अपराध विवरण प्रपत्र सबमिट करें (Submit IIF-II)</span>
            </Button>
          </div>
        </div>

        {/* Save Confirmation Dialog (matching CCTNS Video page 49) */}
        {showConfirmDialog && (
          <div className="fixed inset-0 z-60 bg-slate-950/70 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto border border-amber-300">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-slate-900">
                अपराध विवरण प्रपत्र सत्यापन (Save Confirmation)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-mono bg-slate-50 p-3 rounded-lg border border-slate-200">
                &quot;All details entered in the form will be saved. Do you wish to submit the form?&quot;
              </p>
              <p className="text-[11px] text-slate-500">
                यह फॉर्म सबमिट होते ही FIR के Documents टैब में <strong>Crime Detail Form (IIF-II)</strong> जुड़ जाएगा और इस केस में <strong>Arrest Docs</strong> बनाने की अनुमति अनलॉक हो जाएगी।
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-2 rounded-xl shadow-md"
                >
                  {isSubmitting ? "Submitting..." : "OK (Submit Form)"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
