"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Shield,
  User,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle2,
  Printer,
  ArrowRight,
  ArrowLeft,
  Users,
  Building,
  Calendar,
  Phone,
  BookOpen,
  Clock,
  Trash2,
  Plus,
  Scale,
  Sparkles,
  UserCheck,
  Eye,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { firService } from "@/services/firService";
import { ComplaintService } from "@/services/complaintService";
import { ComplaintItem, AccusedPerson } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { MOCK_ENQUIRY_OFFICERS } from "@/lib/mockData";
import { FIRReceiptModal } from "@/components/fir/FIRReceiptModal";

function RegisterFIRForm() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const complaintIdParam = searchParams.get("complaintId");

  const [linkedComplaint, setLinkedComplaint] = useState<ComplaintItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registeredFir, setRegisteredFir] = useState<any | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Form Fields
  const [policeStation, setPoliceStation] = useState("Sector 29 Police Station");
  const [district, setDistrict] = useState("Gurugram");
  const [state, setState] = useState("Haryana");
  const [typeOfInfo, setTypeOfInfo] = useState<"WRITTEN" | "ORAL" | "E_COMPLAINT">("WRITTEN");
  const [gdEntryNumber, setGdEntryNumber] = useState("");
  const [gdEntryDateTime, setGdEntryDateTime] = useState("");

  // Acts and Sections
  const [actsAndSections, setActsAndSections] = useState("Sec 303(2), 305 Bharatiya Nyaya Sanhita, 2023 (BNS)");
  const [majorAct, setMajorAct] = useState("Bharatiya Nyaya Sanhita, 2023");
  const [category, setCategory] = useState("THEFT");

  // Occurrence
  const [incidentDateFrom, setIncidentDateFrom] = useState(new Date().toISOString().split("T")[0]);
  const [incidentDateTo, setIncidentDateTo] = useState("");
  const [incidentTimeFrom, setIncidentTimeFrom] = useState("10:00");
  const [incidentTimeTo, setIncidentTimeTo] = useState("");
  const [incidentPlace, setIncidentPlace] = useState("");
  const [incidentLandmark, setIncidentLandmark] = useState("");
  const [distanceFromPs, setDistanceFromPs] = useState("Approx. 2 KM");
  const [beatNumber, setBeatNumber] = useState("Beat No. 2");

  // Complainant
  const [complainantName, setComplainantName] = useState("");
  const [complainantFatherSpouse, setComplainantFatherSpouse] = useState("");
  const [complainantGender, setComplainantGender] = useState<"MALE" | "FEMALE" | "TRANSGENDER" | "OTHER">("MALE");
  const [complainantAge, setComplainantAge] = useState<number | undefined>(undefined);
  const [complainantMobile, setComplainantMobile] = useState("");
  const [complainantAddress, setComplainantAddress] = useState("");
  const [complainantCity, setComplainantCity] = useState("Gurugram");
  const [complainantDistrict, setComplainantDistrict] = useState("Gurugram");

  // Accused Persons
  const [isAccusedKnown, setIsAccusedKnown] = useState(false);
  const [accusedList, setAccusedList] = useState<AccusedPerson[]>([
    {
      id: "acc-1",
      name: "",
      fatherName: "",
      address: "",
      phone: "",
      physicalDescription: "",
      isIdentified: false,
    },
  ]);

  // Property Details
  const [stolenPropertyDetails, setStolenPropertyDetails] = useState("");
  const [totalPropertyEstimatedValue, setTotalPropertyEstimatedValue] = useState<number | undefined>(undefined);

  // FIR Substance / Details
  const [incidentDetails, setIncidentDetails] = useState("");

  // IO Assignment
  const [assignedIoId, setAssignedIoId] = useState("");
  const [assignedDirections, setAssignmentDirections] = useState("");

  // Load from Complaint if complaintId provided
  useEffect(() => {
    if (complaintIdParam) {
      ComplaintService.getComplaintById(complaintIdParam)
        .then((c) => {
          if (c) {
            setLinkedComplaint(c);
            setComplainantName(c.complainantName || "");
            setComplainantFatherSpouse(c.complainantFatherSpouse || c.complainantRelativeName || "");
            setComplainantGender(c.complainantGender || "MALE");
            setComplainantAge(c.complainantAge);
            setComplainantMobile(c.complainantMobile || "");
            setComplainantAddress(c.complainantAddress || "");
            setComplainantCity(c.complainantCity || "Gurugram");
            setComplainantDistrict(c.complainantDistrict || "Gurugram");
            setIncidentPlace(c.incidentPlace || c.complainantAddress || "");
            setIncidentDetails(c.incidentDetails || "");
            if (c.incidentDate) setIncidentDateFrom(c.incidentDate);
            if ((c as any).gdEntryNumber) setGdEntryNumber((c as any).gdEntryNumber);
            if (c.assignedEoId) setAssignedIoId(c.assignedEoId);

            // If complaint already has legal suggestions or acts
            if (c.legalAnalysis?.suggestedSections && c.legalAnalysis.suggestedSections.length > 0) {
              const secStr = c.legalAnalysis.suggestedSections
                .map((s: any) => `${s.actShortName} Sec ${s.sectionNumber}`)
                .join(", ");
              setActsAndSections(secStr);
            } else if (c.category) {
              setCategory(c.category);
            }
          }
        })
        .catch((e) => {
          console.warn("Could not prefill from complaint:", e);
        });
    }
  }, [complaintIdParam]);

  const handleAddAccused = () => {
    setAccusedList((prev) => [
      ...prev,
      {
        id: `acc-${Date.now()}`,
        name: "",
        fatherName: "",
        address: "",
        phone: "",
        physicalDescription: "",
        isIdentified: false,
      },
    ]);
  };

  const handleRemoveAccused = (idx: number) => {
    setAccusedList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateAccused = (idx: number, field: keyof AccusedPerson, val: any) => {
    setAccusedList((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complainantName.trim()) {
      alert("Please enter the Complainant / Informant name.");
      return;
    }
    if (!actsAndSections.trim()) {
      alert("Please provide the Acts and Sections.");
      return;
    }
    if (!incidentDetails.trim()) {
      alert("Please enter the FIR substance / details.");
      return;
    }

    setSubmitting(true);
    try {
      const selectedOfficer = MOCK_ENQUIRY_OFFICERS.find((eo) => eo.id === assignedIoId);

      // Clean accused list
      const cleanAccused = isAccusedKnown
        ? accusedList.filter((a) => a.name.trim() !== "")
        : [
            {
              id: `acc-unknown-${Date.now()}`,
              name: "Unknown Accused",
              isIdentified: false,
              physicalDescription: "Identity to be established during investigation",
            },
          ];

      const newFir = firService.registerFir({
        sourceComplaintId: linkedComplaint?.id,
        sourceComplaintNumber: linkedComplaint?.complaintNumber,
        policeStation,
        district,
        state,
        typeOfInformation: typeOfInfo,
        gdEntryNumber,
        gdEntryDateTime: gdEntryDateTime || new Date().toISOString(),
        actsAndSections,
        majorAct,
        category: category as any,
        categoryDisplay: category.replace(/_/g, " "),
        priority: "URGENT",
        incidentDateFrom,
        incidentDateTo: incidentDateTo || undefined,
        incidentTimeFrom,
        incidentTimeTo: incidentTimeTo || undefined,
        incidentPlace,
        incidentLandmark,
        distanceFromPs,
        beatNumber,
        complainantName,
        complainantFatherSpouse,
        complainantGender,
        complainantAge: complainantAge ? Number(complainantAge) : undefined,
        complainantMobile,
        complainantAddress,
        complainantCity,
        complainantDistrict,
        complainantState: state,
        isAccusedKnown,
        accusedList: cleanAccused,
        stolenPropertyDetails: stolenPropertyDetails || undefined,
        totalPropertyEstimatedValue: totalPropertyEstimatedValue
          ? Number(totalPropertyEstimatedValue)
          : undefined,
        incidentDetails,
        registeredBy: currentUser.name || "Station House Officer",
        assignedIoId: selectedOfficer?.id,
        assignedIoName: selectedOfficer?.name,
        assignedIoRank: selectedOfficer?.rank,
        assignedIoBeltNumber: selectedOfficer?.pno,
        assignedIoPhone: selectedOfficer?.phone,
        assignedDirections,
      });

      setRegisteredFir(newFir);
      setShowReceiptModal(true);
    } catch (err) {
      console.error("Failed to register FIR:", err);
      alert("Failed to register FIR. Please check console.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/fir">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-500 hover:text-slate-800">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center text-red-700">
                <Scale className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-black text-[#0b192c] tracking-tight">
                Register First Information Report (FIR)
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Under Section 173 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 • Haryana Police CCTNS Alignment
            </p>
          </div>
        </div>

        <Link href="/fir">
          <Button variant="outline" size="sm" className="text-xs">
            Cancel &amp; Back
          </Button>
        </Link>
      </div>

      {/* Linked Complaint Banner */}
      {linkedComplaint && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-900">
                Registering FIR from Complaint #{linkedComplaint.complaintNumber}
              </p>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Complainant: {linkedComplaint.complainantName} • Category: {linkedComplaint.categoryDisplay || linkedComplaint.category}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono bg-blue-200/60 text-blue-800 px-2.5 py-1 rounded-md font-bold">
            Synchronized Mode
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. General & Police Station Information */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="py-3 px-5 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              1. General &amp; Police Station Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Police Station</label>
              <input
                type="text"
                value={policeStation}
                onChange={(e) => setPoliceStation(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">District</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Type of Information</label>
              <select
                value={typeOfInfo}
                onChange={(e) => setTypeOfInfo(e.target.value as any)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium bg-white"
              >
                <option value="WRITTEN">Written (लिखित तहरीर)</option>
                <option value="ORAL">Oral / Reduced to writing (मौखिक)</option>
                <option value="E_COMPLAINT">E-Complaint / Online (ई-शिकायत)</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">GD Entry Ref (Roznamcha)</label>
              <input
                type="text"
                placeholder="e.g. GD-0042/28-03-2026"
                value={gdEntryNumber}
                onChange={(e) => setGdEntryNumber(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">GD Entry Date/Time</label>
              <input
                type="text"
                placeholder="YYYY-MM-DD HH:MM"
                value={gdEntryDateTime}
                onChange={(e) => setGdEntryDateTime(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. Acts and Sections */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="py-3 px-5 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Scale className="w-4 h-4 text-red-600" />
              2. Acts &amp; Sections (Statutory Charging Sections) *
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Acts &amp; Sections (Applicable Penal &amp; Special Law) *
              </label>
              <input
                type="text"
                value={actsAndSections}
                onChange={(e) => setActsAndSections(e.target.value)}
                placeholder="e.g. Sec 303(2), 305 Bharatiya Nyaya Sanhita, 2023 (BNS)"
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium text-slate-900"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Specify BNS, IT Act, NDPS, Arms Act, or applicable statutory sections.
              </p>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Major Offence Classification</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium bg-white"
              >
                <option value="THEFT">Theft / Burglary (धारा 303/305 BNS)</option>
                <option value="PHYSICAL_ASSAULT">Assault / Grievous Hurt (धारा 115/118 BNS)</option>
                <option value="CYBER_FINANCIAL_FRAUD">Cyber Fraud / Cheating (धारा 318 BNS / 66D IT Act)</option>
                <option value="DOMESTIC_VIOLENCE_HARASSMENT">Domestic Violence / Harassment (धारा 85/86 BNS)</option>
                <option value="LAND_PROPERTY_DISPUTE">Criminal Trespass / Land Dispute (धारा 329 BNS)</option>
                <option value="THREATS_INTIMIDATION">Criminal Intimidation (धारा 351 BNS)</option>
                <option value="PUBLIC_NUISANCE">Public Nuisance / Affray</option>
                <option value="OTHER">Other Cognizable Offence</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* 3. Occurrence of Offence & Place */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="py-3 px-5 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              3. Occurrence of Offence &amp; Place (घटना का समय व स्थान)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Date From *</label>
              <input
                type="date"
                value={incidentDateFrom}
                onChange={(e) => setIncidentDateFrom(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Date To (If span)</label>
              <input
                type="date"
                value={incidentDateTo}
                onChange={(e) => setIncidentDateTo(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Time From</label>
              <input
                type="time"
                value={incidentTimeFrom}
                onChange={(e) => setIncidentTimeFrom(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Time To</label>
              <input
                type="time"
                value={incidentTimeTo}
                onChange={(e) => setIncidentTimeTo(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Place of Occurrence (घटना स्थल) *</label>
              <input
                type="text"
                value={incidentPlace}
                onChange={(e) => setIncidentPlace(e.target.value)}
                placeholder="e.g. Sector 29 Commercial Market, Near Metro Gate 2"
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Landmark</label>
              <input
                type="text"
                value={incidentLandmark}
                onChange={(e) => setIncidentLandmark(e.target.value)}
                placeholder="e.g. Opposite State Bank ATM"
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Distance &amp; Direction from PS</label>
              <input
                type="text"
                value={distanceFromPs}
                onChange={(e) => setDistanceFromPs(e.target.value)}
                placeholder="e.g. 2 KM South-East"
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
              />
            </div>
          </CardContent>
        </Card>

        {/* 4. Complainant / Informant Details */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="py-3 px-5 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-purple-600" />
              4. Complainant / Informant Details (शिकायतकर्ता / सूचनाकर्ता) *
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
              <input
                type="text"
                value={complainantName}
                onChange={(e) => setComplainantName(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Father / Spouse Name</label>
              <input
                type="text"
                value={complainantFatherSpouse}
                onChange={(e) => setComplainantFatherSpouse(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Gender</label>
              <select
                value={complainantGender}
                onChange={(e) => setComplainantGender(e.target.value as any)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium bg-white"
              >
                <option value="MALE">Male (पुरुष)</option>
                <option value="FEMALE">Female (महिला)</option>
                <option value="TRANSGENDER">Transgender (ट्रांसजेंडर)</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Age</label>
              <input
                type="number"
                value={complainantAge || ""}
                onChange={(e) => setComplainantAge(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g. 35"
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mobile Number</label>
              <input
                type="tel"
                value={complainantMobile}
                onChange={(e) => setComplainantMobile(e.target.value)}
                placeholder="10 digit mobile"
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Address</label>
              <input
                type="text"
                value={complainantAddress}
                onChange={(e) => setComplainantAddress(e.target.value)}
                placeholder="House No., Street, Sector"
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
              />
            </div>
          </CardContent>
        </Card>

        {/* 5. Accused Persons */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="py-3 px-5 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              5. Accused Particulars (नामित या अज्ञात आरोपी)
            </CardTitle>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={isAccusedKnown}
                  onChange={(e) => setIsAccusedKnown(e.target.checked)}
                  className="rounded text-red-600 border-slate-300"
                />
                <span>Accused Person(s) Known / Named</span>
              </label>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {isAccusedKnown ? (
              <div className="space-y-3">
                {accusedList.map((acc, idx) => (
                  <div key={acc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">Accused #{idx + 1}</span>
                      {accusedList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAccused(idx)}
                          className="text-red-600 hover:text-red-800 text-xs flex items-center gap-1 font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Accused Name *</label>
                        <input
                          type="text"
                          value={acc.name}
                          onChange={(e) => handleUpdateAccused(idx, "name", e.target.value)}
                          placeholder="Name of accused"
                          className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Father&apos;s Name</label>
                        <input
                          type="text"
                          value={acc.fatherName || ""}
                          onChange={(e) => handleUpdateAccused(idx, "fatherName", e.target.value)}
                          placeholder="S/o"
                          className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={acc.phone || ""}
                          onChange={(e) => handleUpdateAccused(idx, "phone", e.target.value)}
                          placeholder="Mobile"
                          className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Address / Location</label>
                        <input
                          type="text"
                          value={acc.address || ""}
                          onChange={(e) => handleUpdateAccused(idx, "address", e.target.value)}
                          placeholder="Known residence or workplace"
                          className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Physical Description</label>
                        <input
                          type="text"
                          value={acc.physicalDescription || ""}
                          onChange={(e) => handleUpdateAccused(idx, "physicalDescription", e.target.value)}
                          placeholder="Height, build, scars, vehicle"
                          className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAccused}
                  className="text-xs border-dashed border-slate-300 text-slate-700"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Another Accused
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-900">
                Accused marked as <strong>Unknown Suspect(s)</strong>. Identity will be determined during statutory investigation.
              </div>
            )}
          </CardContent>
        </Card>

        {/* 6. FIR Content / Substance of Information */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="py-3 px-5 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-600" />
              6. Content of FIR / Tehreer (प्रथम सूचना रिपोर्ट का मुख्य विवरण) *
            </CardTitle>
            <VoiceInputButton
              onTranscript={(text) => setIncidentDetails((prev) => (prev ? `${prev} ${text}` : text))}
            />
          </CardHeader>
          <CardContent className="p-5 space-y-2">
            <textarea
              rows={6}
              value={incidentDetails}
              onChange={(e) => setIncidentDetails(e.target.value)}
              placeholder="Record the verbatim statement or typed Hindi/English substance of the complaint (Tehreer) here..."
              className="w-full p-3 rounded-lg border border-slate-300 text-xs font-serif leading-relaxed focus:ring-2 focus:ring-red-500/20"
              required
            />
            <p className="text-[11px] text-slate-500">
              Ensure accurate recording of dates, times, weapons/instruments, loss amount, and statements.
            </p>
          </CardContent>
        </Card>

        {/* 7. IO Assignment & Supervisory Directions */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="py-3 px-5 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              7. Investigating Officer (IO) Assignment (SHO Order)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Assign Investigating Officer (IO)
              </label>
              <select
                value={assignedIoId}
                onChange={(e) => setAssignedIoId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium bg-white"
              >
                <option value="">-- Assign Later by SHO --</option>
                {MOCK_ENQUIRY_OFFICERS.map((eo) => (
                  <option key={eo.id} value={eo.id}>
                    {eo.name} ({eo.rank} • PNO: {eo.pno})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Directions for Investigation
              </label>
              <input
                type="text"
                value={assignedDirections}
                onChange={(e) => setAssignmentDirections(e.target.value)}
                placeholder="e.g. Inspect crime scene, prepare site plan, secure CCTV footage."
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <Link href="/fir">
            <Button type="button" variant="outline" className="text-xs">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-2 px-6 shadow-sm"
          >
            <Scale className="w-4 h-4" />
            {submitting ? "Registering FIR..." : "Register FIR & Generate Official Copy"}
          </Button>
        </div>
      </form>

      {/* Statutory Receipt Print Modal */}
      {showReceiptModal && registeredFir && (
        <FIRReceiptModal
          fir={registeredFir}
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            router.push(`/fir/${registeredFir.id}`);
          }}
        />
      )}
    </div>
  );
}

export default function RegisterFIRPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading FIR Register form...</div>}>
      <RegisterFIRForm />
    </Suspense>
  );
}
