"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Printer,
  CheckCircle2,
  AlertTriangle,
  User,
  Shield,
  FileText,
  MapPin,
  Sparkles,
  Phone,
  RotateCcw,
  Upload,
  Link,
  Unlink,
} from "lucide-react";
import {
  MissingPersonRecord,
  ActSectionEntry,
  IdentificationDoc,
  MISSING_PERSON_ID_TYPES,
  STANDARD_ACTS,
  SAMPLE_MISSING_PERSON_PHOTO,
} from "@/types/missingPerson";
import {
  AddressInfo,
  HARYANA_DISTRICTS,
  MOCK_ENQUIRY_OFFICERS_LIST,
  GDSearchResultItem,
} from "@/types/lostProperty";
import { MissingPersonGDSearchModal } from "./MissingPersonGDSearchModal";
import { MissingPersonPreviewModal } from "./MissingPersonPreviewModal";

interface RegisterMissingPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newRecord: MissingPersonRecord) => void;
  initialRecord?: MissingPersonRecord | null;
}

export const RegisterMissingPersonModal: React.FC<RegisterMissingPersonModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRecord,
}) => {
  // Main Tab State (5 statutory tabs)
  const [activeTab, setActiveTab] = useState<
    "GENERAL" | "COMPLAINANT" | "MISSING_PERSON" | "PHYSICAL" | "IO_EO"
  >("GENERAL");

  // Subtabs inside Complainant Information
  const [complainantSubTab, setComplainantSubTab] = useState<
    "PERSONAL" | "ADDRESS" | "OTHER"
  >("PERSONAL");

  // Subtabs inside Missing Person Details
  const [missingSubTab, setMissingSubTab] = useState<
    "PERSONAL" | "ADDRESS" | "OTHER"
  >("PERSONAL");

  // Modals state
  const [isGdSearchOpen, setIsGdSearchOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Tab 1: General Details
  const [registrationDateTime, setRegistrationDateTime] = useState(
    initialRecord?.registrationDateTime || "19/04/2019 15:19"
  );
  const [gdNumber, setGdNumber] = useState(initialRecord?.gdNumber || "002");
  const [gdDateTime, setGdDateTime] = useState(
    initialRecord?.gdDateTime || "19/04/2019, 10:45"
  );
  const [briefOfIncident, setBriefOfIncident] = useState(
    initialRecord?.briefOfIncident || "Missing Person"
  );
  const [dateSinceMissing, setDateSinceMissing] = useState(
    initialRecord?.dateSinceMissing || "2019-04-19"
  );
  const [timeSinceMissing, setTimeSinceMissing] = useState(
    initialRecord?.timeSinceMissing || "11:00"
  );
  const [firNumber, setFirNumber] = useState(initialRecord?.firNumber || "0042");
  const [firYear, setFirYear] = useState(initialRecord?.firYear || "2019");
  const [placeOfMissing, setPlaceOfMissing] = useState(
    initialRecord?.placeOfMissing || "Panchkula bus stand"
  );

  // Acts and Sections
  const [selectedAct, setSelectedAct] = useState<string>("Police Act 1861");
  const [selectedSection, setSelectedSection] = useState<string>("Section 34");
  const [actsSections, setActsSections] = useState<ActSectionEntry[]>(
    initialRecord?.actsSections || [
      { id: "act_1", act: "Police Act 1861", section: "Section 34" },
    ]
  );

  // Tab 2: Complainant Information - Personal
  const [complainantUid, setComplainantUid] = useState(
    initialRecord?.complainantUid || "4829-1092-3849"
  );
  const [complainantFirstName, setComplainantFirstName] = useState(
    initialRecord?.complainantFirstName || "RAVI"
  );
  const [complainantMiddleName, setComplainantMiddleName] = useState(
    initialRecord?.complainantMiddleName || ""
  );
  const [complainantLastName, setComplainantLastName] = useState(
    initialRecord?.complainantLastName || "Kumar"
  );
  const [complainantRelationType, setComplainantRelationType] = useState<any>(
    initialRecord?.complainantRelationType || "Father"
  );
  const [complainantRelativeName, setComplainantRelativeName] = useState(
    initialRecord?.complainantRelativeName || "Shyam"
  );
  const [complainantMobile, setComplainantMobile] = useState(
    initialRecord?.complainantMobile || "+91 9812033441"
  );
  const [complainantLandline, setComplainantLandline] = useState(
    initialRecord?.complainantLandline || ""
  );
  const [complainantEmail, setComplainantEmail] = useState(
    initialRecord?.complainantEmail || ""
  );
  const [complainantGender, setComplainantGender] = useState<any>(
    initialRecord?.complainantGender || "Male"
  );

  // Complainant Address
  const defaultAddress: AddressInfo = {
    houseNo: "Plot 12",
    streetName: "Bus Stand Road",
    colony: "Sector 5",
    villageTownCity: "pkl",
    tehsil: "Panchkula",
    country: "INDIA",
    state: "HARYANA",
    district: "PANCHKULA",
    policeStation: "PANCHKULA SECTOR-5",
    pincode: "134109",
  };

  const [complainantPresentAddress, setComplainantPresentAddress] = useState<AddressInfo>(
    initialRecord?.complainantPresentAddress || defaultAddress
  );
  const [complainantSameAsPresent, setComplainantSameAsPresent] = useState<boolean>(
    initialRecord?.complainantSameAsPresent ?? true
  );
  const [complainantPermanentAddress, setComplainantPermanentAddress] = useState<AddressInfo>(
    initialRecord?.complainantPermanentAddress || defaultAddress
  );

  // Complainant Other Information
  const [complainantNationality, setComplainantNationality] = useState(
    initialRecord?.complainantNationality || "INDIA"
  );
  const [complainantIdTypeInput, setComplainantIdTypeInput] = useState<string>("Ration Card");
  const [complainantIdNoInput, setComplainantIdNoInput] = useState<string>("RC-HR-PKL-99201");
  const [complainantIdList, setComplainantIdList] = useState<IdentificationDoc[]>(
    initialRecord?.complainantIdList || [
      { id: "cid_1", idType: "Ration Card", idNumber: "RC-HR-PKL-99201" },
    ]
  );

  // Tab 3: Missing Person Details - Personal
  const [uid, setUid] = useState(initialRecord?.uid || "7719-2810-4412");
  const [firstName, setFirstName] = useState(initialRecord?.firstName || "Monu");
  const [middleName, setMiddleName] = useState(initialRecord?.middleName || "");
  const [lastName, setLastName] = useState(initialRecord?.lastName || "Kumar");
  const [alias, setAlias] = useState(initialRecord?.alias || "Chhotu");
  const [relationType, setRelationType] = useState<any>(
    initialRecord?.relationType || "Father"
  );
  const [relativeName, setRelativeName] = useState(
    initialRecord?.relativeName || "Shyam"
  );
  const [photoUrl, setPhotoUrl] = useState<string>(
    initialRecord?.photoUrl || SAMPLE_MISSING_PERSON_PHOTO
  );
  const [gender, setGender] = useState<any>(initialRecord?.gender || "Male");
  const [majorMinor, setMajorMinor] = useState<"Major" | "Minor">(
    initialRecord?.majorMinor || "Major"
  );
  const [mobileNo, setMobileNo] = useState(
    initialRecord?.mobileNo || "+91 9416088219"
  );
  const [landlineNo, setLandlineNo] = useState(
    initialRecord?.landlineNo || ""
  );
  const [emailId, setEmailId] = useState(initialRecord?.emailId || "");

  // Missing Person Age Panel
  const [dob, setDob] = useState(initialRecord?.dob || "1990-12-02");
  const [yearOfBirth, setYearOfBirth] = useState(
    initialRecord?.yearOfBirth || "1990"
  );
  const [ageYears, setAgeYears] = useState(initialRecord?.ageYears || "28");
  const [ageMonths, setAgeMonths] = useState(initialRecord?.ageMonths || "4");
  const [ageRangeFrom, setAgeRangeFrom] = useState(
    initialRecord?.ageRangeFrom || ""
  );
  const [ageRangeTo, setAgeRangeTo] = useState(
    initialRecord?.ageRangeTo || ""
  );

  // Missing Person Address
  const [sameAsComplainantAddress, setSameAsComplainantAddress] = useState(
    initialRecord?.sameAsComplainantAddress ?? true
  );
  const [presentAddress, setPresentAddress] = useState<AddressInfo>(
    initialRecord?.presentAddress || defaultAddress
  );
  const [sameAsPresentAddress, setSameAsPresentAddress] = useState(
    initialRecord?.sameAsPresentAddress ?? true
  );
  const [permanentAddress, setPermanentAddress] = useState<AddressInfo>(
    initialRecord?.permanentAddress || defaultAddress
  );

  // Missing Person Other Info
  const [nationality, setNationality] = useState(
    initialRecord?.nationality || "INDIA"
  );
  const [occupation, setOccupation] = useState(
    initialRecord?.occupation || "Student / Shop Helper"
  );
  const [mpIdTypeInput, setMpIdTypeInput] = useState<string>("Aadhar Card");
  const [mpIdNoInput, setMpIdNoInput] = useState<string>("7719 2810 4412");
  const [mpIdList, setMpIdList] = useState<IdentificationDoc[]>(
    initialRecord?.idList || [
      { id: "mpid_1", idType: "Aadhar Card", idNumber: "7719 2810 4412" },
    ]
  );

  // Tab 4: Physical Description
  const [heightFeet, setHeightFeet] = useState(
    initialRecord?.heightFeet || "5"
  );
  const [heightInches, setHeightInches] = useState(
    initialRecord?.heightInches || "7"
  );
  const [complexion, setComplexion] = useState(
    initialRecord?.complexion || "Wheatish"
  );
  const [build, setBuild] = useState(initialRecord?.build || "Medium");
  const [faceType, setFaceType] = useState(
    initialRecord?.faceType || "Round"
  );
  const [hairColor, setHairColor] = useState(
    initialRecord?.hairColor || "Black"
  );
  const [eyeColor, setEyeColor] = useState(
    initialRecord?.eyeColor || "Dark Brown"
  );
  const [languagesKnown, setLanguagesKnown] = useState(
    initialRecord?.languagesKnown || "Hindi, Punjabi"
  );
  const [identifyingMarks, setIdentifyingMarks] = useState(
    initialRecord?.identifyingMarks ||
      "Mole on right cheek, small burn scar on left forearm"
  );
  const [clothingDetails, setClothingDetails] = useState(
    initialRecord?.clothingDetails ||
      "Blue checked shirt, dark jeans, white sneakers"
  );
  const [habitsEccentricities, setHabitsEccentricities] = useState(
    initialRecord?.habitsEccentricities ||
      "Polite demeanor, no mental disability reported"
  );

  // Tab 5: IO/EO Details
  const [nameOfEo, setNameOfEo] = useState(
    initialRecord?.nameOfEo || "ASI Sandeep Singh - 49102"
  );
  const [eoRank, setEoRank] = useState(
    initialRecord?.eoRank || "Assistant Sub Inspector"
  );
  const [eoNumber, setEoNumber] = useState(
    initialRecord?.eoNumber || "49102"
  );
  const [policeStation, setPoliceStation] = useState(
    initialRecord?.policeStation || "PANCHKULA SECTOR-5"
  );
  const [district, setDistrict] = useState(
    initialRecord?.district || "PANCHKULA"
  );
  const [expectedDateToComplete, setExpectedDateToComplete] = useState(
    initialRecord?.expectedDateToComplete || "2019-04-26"
  );
  const [remarks, setRemarks] = useState(
    initialRecord?.remarks ||
      "WT message flashed to all police stations in Haryana and Chandigarh. Missing person poster dispatched to public bus stands."
  );

  // Name autocomplete
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const commonNames = [
    "RAVI Kumar",
    "RAJESH Sharma",
    "RAMESH Verma",
    "RAKESH Yadav",
    "RAKSHIT Malik",
    "RAMAN Deep",
  ];

  // Address auto sync
  useEffect(() => {
    if (complainantSameAsPresent) {
      setComplainantPermanentAddress({ ...complainantPresentAddress });
    }
  }, [complainantSameAsPresent, complainantPresentAddress]);

  useEffect(() => {
    if (sameAsComplainantAddress) {
      setPresentAddress({ ...complainantPresentAddress });
      setPermanentAddress({ ...complainantPermanentAddress });
    }
  }, [sameAsComplainantAddress, complainantPresentAddress, complainantPermanentAddress]);

  useEffect(() => {
    if (sameAsPresentAddress) {
      setPermanentAddress({ ...presentAddress });
    }
  }, [sameAsPresentAddress, presentAddress]);

  if (!isOpen) return null;

  // Autocomplete for Complainant Name
  const handleComplainantNameChange = (val: string) => {
    setComplainantFirstName(val);
    if (val.trim().length >= 2) {
      const matches = commonNames.filter((n) =>
        n.toLowerCase().includes(val.toLowerCase())
      );
      setNameSuggestions(matches);
    } else {
      setNameSuggestions([]);
    }
  };

  // Add Act & Section
  const handleAddActSection = () => {
    if (selectedAct && selectedSection.trim()) {
      setActsSections([
        ...actsSections,
        {
          id: `act_${Date.now()}`,
          act: selectedAct,
          section: selectedSection.trim(),
        },
      ]);
      setSelectedSection("");
    }
  };

  // Add Complainant ID
  const handleAddComplainantId = () => {
    if (complainantIdNoInput.trim()) {
      setComplainantIdList([
        ...complainantIdList,
        {
          id: `cid_${Date.now()}`,
          idType: complainantIdTypeInput,
          idNumber: complainantIdNoInput.trim(),
        },
      ]);
      setComplainantIdNoInput("");
    }
  };

  // Add Missing Person ID
  const handleAddMpId = () => {
    if (mpIdNoInput.trim()) {
      setMpIdList([
        ...mpIdList,
        {
          id: `mpid_${Date.now()}`,
          idType: mpIdTypeInput,
          idNumber: mpIdNoInput.trim(),
        },
      ]);
      setMpIdNoInput("");
    }
  };

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setPhotoUrl(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle GD select
  const handleSelectGd = (gd: GDSearchResultItem) => {
    setGdNumber(gd.gdNumber);
    setGdDateTime(gd.dateTime);
  };

  // Reset Age panel
  const handleResetAge = () => {
    setDob("");
    setYearOfBirth("");
    setAgeYears("");
    setAgeMonths("");
    setAgeRangeFrom("");
    setAgeRangeTo("");
  };

  // Handle EO selection
  const handleEoChange = (selectedEoString: string) => {
    setNameOfEo(selectedEoString);
    const found = MOCK_ENQUIRY_OFFICERS_LIST.find(
      (eo) => eo.display === selectedEoString
    );
    if (found) {
      setEoRank(found.rank);
      setEoNumber(found.number);
    }
  };

  // Prepare Record
  const currentRecord: Partial<MissingPersonRecord> = {
    id: initialRecord?.id || `mp_${Date.now()}`,
    registrationNumber: initialRecord?.registrationNumber || "",
    registrationYear: initialRecord?.registrationYear || "2019",
    createdAt: initialRecord?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: initialRecord?.status || "OPEN",
    registrationDateTime,
    gdNumber,
    gdDateTime,
    briefOfIncident,
    dateTimeSinceMissing: `${dateSinceMissing} ${timeSinceMissing}`,
    dateSinceMissing,
    timeSinceMissing,
    firNumber,
    firYear,
    placeOfMissing,
    actsSections,
    complainantUid,
    complainantFirstName,
    complainantMiddleName,
    complainantLastName,
    complainantRelationType,
    complainantRelativeName,
    complainantMobile,
    complainantLandline,
    complainantEmail,
    complainantGender,
    complainantPresentAddress,
    complainantSameAsPresent,
    complainantPermanentAddress,
    complainantNationality,
    complainantIdList,
    uid,
    firstName,
    middleName,
    lastName,
    alias,
    relationType,
    relativeName,
    photoUrl,
    gender,
    majorMinor,
    mobileNo,
    landlineNo,
    emailId,
    dob,
    yearOfBirth,
    ageYears,
    ageMonths,
    ageRangeFrom,
    ageRangeTo,
    sameAsComplainantAddress,
    presentAddress,
    sameAsPresentAddress,
    permanentAddress,
    nationality,
    occupation,
    idList: mpIdList,
    heightFeet,
    heightInches,
    complexion,
    build,
    faceType,
    hairColor,
    eyeColor,
    languagesKnown,
    identifyingMarks,
    clothingDetails,
    habitsEccentricities,
    nameOfEo,
    eoRank,
    eoNumber,
    policeStation,
    district,
    expectedDateToComplete,
    remarks,
  };

  // Submit Handler
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!gdNumber.trim()) {
      alert("Please select or enter GD/SD/DD Number *");
      setActiveTab("GENERAL");
      return;
    }
    if (!dateSinceMissing || !timeSinceMissing) {
      alert("Please enter Date / Time since missing *");
      setActiveTab("GENERAL");
      return;
    }
    if (!placeOfMissing.trim()) {
      alert("Please enter Place of Missing *");
      setActiveTab("GENERAL");
      return;
    }
    if (!complainantFirstName.trim()) {
      alert("Please enter Complainant First Name *");
      setActiveTab("COMPLAINANT");
      setComplainantSubTab("PERSONAL");
      return;
    }
    if (!complainantRelativeName.trim()) {
      alert("Please enter Complainant Relative Name *");
      setActiveTab("COMPLAINANT");
      setComplainantSubTab("PERSONAL");
      return;
    }
    if (!complainantMobile.trim() && !complainantLandline.trim() && !complainantEmail.trim()) {
      alert("Please enter at least one Contact Detail for Complainant (Mobile / Landline / Email) *");
      setActiveTab("COMPLAINANT");
      setComplainantSubTab("PERSONAL");
      return;
    }
    if (!firstName.trim()) {
      alert("Please enter Missing Person First Name *");
      setActiveTab("MISSING_PERSON");
      setMissingSubTab("PERSONAL");
      return;
    }
    if (!relativeName.trim()) {
      alert("Please enter Missing Person Relative Name *");
      setActiveTab("MISSING_PERSON");
      setMissingSubTab("PERSONAL");
      return;
    }
    if (!nameOfEo.trim()) {
      alert("Please select Investigating / Enquiry Officer *");
      setActiveTab("IO_EO");
      return;
    }

    const confirmed = window.confirm("Do you want to submit the record?");
    if (confirmed) {
      setIsPreviewOpen(true);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
        <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden text-xs">
          {/* Header */}
          <div className="bg-blue-950 text-white px-5 py-3.5 flex items-center justify-between border-b border-blue-900 shadow">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-900 rounded-lg border border-blue-700">
                <User className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
                  <span>Register Missing Person (लापता व्यक्ति का पंजीकरण)</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-medium">
                    CCTNS FORM IIF-MP
                  </span>
                </h2>
                <p className="text-[11px] text-blue-200">
                  Haryana Police Portal &bull; State Crime Records Bureau (SCRB)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-blue-300 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs (5 Statutory Tabs) */}
          <div className="bg-slate-100 border-b border-slate-300 px-4 pt-2 flex items-center gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("GENERAL")}
              className={`px-3.5 py-2 font-bold text-xs rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 border-t border-x whitespace-nowrap ${
                activeTab === "GENERAL"
                  ? "bg-white text-blue-950 border-slate-300 border-b-white -mb-px font-black"
                  : "bg-slate-200/80 text-slate-600 border-transparent hover:bg-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-700" />
              <span>1. General Details</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("COMPLAINANT")}
              className={`px-3.5 py-2 font-bold text-xs rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 border-t border-x whitespace-nowrap ${
                activeTab === "COMPLAINANT"
                  ? "bg-white text-blue-950 border-slate-300 border-b-white -mb-px font-black"
                  : "bg-slate-200/80 text-slate-600 border-transparent hover:bg-slate-200"
              }`}
            >
              <User className="w-3.5 h-3.5 text-blue-700" />
              <span>2. Complainant Information</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("MISSING_PERSON")}
              className={`px-3.5 py-2 font-bold text-xs rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 border-t border-x whitespace-nowrap ${
                activeTab === "MISSING_PERSON"
                  ? "bg-white text-blue-950 border-slate-300 border-b-white -mb-px font-black"
                  : "bg-slate-200/80 text-slate-600 border-transparent hover:bg-slate-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>3. Missing Person Details</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("PHYSICAL")}
              className={`px-3.5 py-2 font-bold text-xs rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 border-t border-x whitespace-nowrap ${
                activeTab === "PHYSICAL"
                  ? "bg-white text-blue-950 border-slate-300 border-b-white -mb-px font-black"
                  : "bg-slate-200/80 text-slate-600 border-transparent hover:bg-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span>4. Physical Description</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("IO_EO")}
              className={`px-3.5 py-2 font-bold text-xs rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 border-t border-x whitespace-nowrap ${
                activeTab === "IO_EO"
                  ? "bg-white text-blue-950 border-slate-300 border-b-white -mb-px font-black"
                  : "bg-slate-200/80 text-slate-600 border-transparent hover:bg-slate-200"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-blue-700" />
              <span>5. IO/EO Details</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-6">
            {/* ============================================================== */}
            {/* TAB 1: GENERAL DETAILS                                         */}
            {/* ============================================================== */}
            {activeTab === "GENERAL" && (
              <div className="space-y-4 animate-in fade-in duration-100">
                <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-300 shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider pb-2 border-b border-slate-200">
                    General Details (सामान्य विवरण)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Date &amp; Time of Registration
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={registrationDateTime}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md font-mono text-xs bg-slate-100 font-bold"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        पहले से भरा 19/04/2019 15:19
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        GD/SD/DD Number <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          required
                          value={gdNumber}
                          onChange={(e) => setGdNumber(e.target.value)}
                          placeholder="e.g. 002"
                          className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md font-mono text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                        <button
                          type="button"
                          onClick={() => setIsGdSearchOpen(true)}
                          title="Search General Diary"
                          className="px-2.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                        >
                          <Search className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        GD खोजने का आइकन; चयन 002
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        GD की तारीख और समय (GD Date &amp; Time)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={gdDateTime}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md font-mono text-xs bg-slate-100 text-slate-700 font-semibold"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        GD चुनने के बाद अलग बॉक्स में
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Date / Time since missing <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="date"
                          required
                          value={dateSinceMissing}
                          onChange={(e) => setDateSinceMissing(e.target.value)}
                          className="px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                        />
                        <input
                          type="time"
                          required
                          value={timeSinceMissing}
                          onChange={(e) => setTimeSinceMissing(e.target.value)}
                          className="px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        19/04/2019, 11:00
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        FIR No. (प्राथमिकी सं. / वर्ष)
                      </label>
                      <div className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          placeholder="0042"
                          value={firNumber}
                          onChange={(e) => setFirNumber(e.target.value)}
                          className="w-24 px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                        />
                        <span className="text-slate-400">/</span>
                        <input
                          type="text"
                          placeholder="2019"
                          value={firYear}
                          onChange={(e) => setFirYear(e.target.value)}
                          className="w-20 px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => alert(`FIR Linked: ${firNumber}/${firYear}`)}
                          className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Search className="w-3 h-3" />
                          <span>Search</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFirNumber("");
                            setFirYear("");
                          }}
                          className="px-2.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Unlink className="w-3 h-3" />
                          <span>Delink</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Place of Missing <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="e.g. Panchkula bus stand"
                      value={placeOfMissing}
                      onChange={(e) => setPlaceOfMissing(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Brief of incident (घटना का संक्षिप्त विवरण)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Missing Person"
                      value={briefOfIncident}
                      onChange={(e) => setBriefOfIncident(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  {/* Acts and Sections Table */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                        Acts &amp; Sections (अधिनियम व धाराएँ)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                      <div>
                        <select
                          value={selectedAct}
                          onChange={(e) => setSelectedAct(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                        >
                          {STANDARD_ACTS.map((act) => (
                            <option key={act} value={act}>
                              {act}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="e.g. Section 34 / Section 106"
                          value={selectedSection}
                          onChange={(e) => setSelectedSection(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleAddActSection}
                          className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActsSections([])}
                          className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 rounded-md text-xs font-semibold text-slate-700 cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-md overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200">
                            <th className="py-2 px-3 w-14 text-center">S.No.</th>
                            <th className="py-2 px-4">Acts</th>
                            <th className="py-2 px-4">Sections</th>
                            <th className="py-2 px-3 w-16 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {actsSections.length > 0 ? (
                            actsSections.map((item, idx) => (
                              <tr key={item.id} className="hover:bg-slate-50">
                                <td className="py-2 px-3 text-center font-mono text-slate-500">
                                  {idx + 1}
                                </td>
                                <td className="py-2 px-4 font-medium text-slate-800">
                                  {item.act}
                                </td>
                                <td className="py-2 px-4 font-mono font-bold text-blue-900">
                                  {item.section}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActsSections(
                                        actsSections.filter((_, i) => i !== idx)
                                      )
                                    }
                                    className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="py-3 text-center text-slate-400 italic">
                                No Acts &amp; Sections added
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 2: COMPLAINANT INFORMATION                                 */}
            {/* ============================================================== */}
            {activeTab === "COMPLAINANT" && (
              <div className="space-y-4 animate-in fade-in duration-100">
                {/* Subtab Switcher */}
                <div className="flex border-b border-slate-200 bg-white px-3 pt-2 rounded-t-lg gap-2">
                  <button
                    type="button"
                    onClick={() => setComplainantSubTab("PERSONAL")}
                    className={`px-3 py-1.5 text-xs font-bold border-b-2 cursor-pointer ${
                      complainantSubTab === "PERSONAL"
                        ? "border-blue-700 text-blue-900"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Personal Information
                  </button>
                  <button
                    type="button"
                    onClick={() => setComplainantSubTab("ADDRESS")}
                    className={`px-3 py-1.5 text-xs font-bold border-b-2 cursor-pointer ${
                      complainantSubTab === "ADDRESS"
                        ? "border-blue-700 text-blue-900"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Address (पता)
                  </button>
                  <button
                    type="button"
                    onClick={() => setComplainantSubTab("OTHER")}
                    className={`px-3 py-1.5 text-xs font-bold border-b-2 cursor-pointer ${
                      complainantSubTab === "OTHER"
                        ? "border-blue-700 text-blue-900"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Other Information (पहचान पत्र)
                  </button>
                </div>

                {/* Subtab 1: Personal Information */}
                {complainantSubTab === "PERSONAL" && (
                  <div className="bg-white p-4 sm:p-5 rounded-b-lg border border-slate-300 shadow-2xs space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          UID
                        </label>
                        <input
                          type="text"
                          value={complainantUid}
                          onChange={(e) => setComplainantUid(e.target.value)}
                          placeholder="e.g. 4829-1092-3849"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                        />
                      </div>

                      <div className="relative">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={complainantFirstName}
                          onChange={(e) => handleComplainantNameChange(e.target.value)}
                          placeholder="e.g. RAVI"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                        {nameSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-slate-300 rounded-md shadow-lg overflow-hidden">
                            {nameSuggestions.map((sug, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  const parts = sug.split(" ");
                                  setComplainantFirstName(parts[0] || "");
                                  if (parts.length > 1) {
                                    setComplainantLastName(parts.slice(1).join(" "));
                                  }
                                  setNameSuggestions([]);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-slate-800 border-b border-slate-100 last:border-b-0 cursor-pointer"
                              >
                                {sug}
                              </button>
                            ))}
                          </div>
                        )}
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          RAVI भरा गया
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Middle Name
                        </label>
                        <input
                          type="text"
                          value={complainantMiddleName}
                          onChange={(e) => setComplainantMiddleName(e.target.value)}
                          placeholder="Middle name"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={complainantLastName}
                          onChange={(e) => setComplainantLastName(e.target.value)}
                          placeholder="Last name"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Relation Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={complainantRelationType}
                          onChange={(e) => setComplainantRelationType(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-medium"
                        >
                          <option value="Select">Select</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Husband">Husband</option>
                          <option value="Wife">Wife</option>
                        </select>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          Father चुना गया
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Relative Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={complainantRelativeName}
                          onChange={(e) => setComplainantRelativeName(e.target.value)}
                          placeholder="e.g. Shyam"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Gender <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={complainantGender}
                          onChange={(e) => setComplainantGender(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-medium"
                        >
                          <option value="Select">Select</option>
                          <option value="Unknown">Unknown</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Transgender">Transgender</option>
                        </select>
                      </div>
                    </div>

                    {/* Contact Details (Any One) * */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                        Contact Details (Any One) <span className="text-red-500">*</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                            Mobile No. (+91)
                          </label>
                          <input
                            type="text"
                            value={complainantMobile}
                            onChange={(e) => setComplainantMobile(e.target.value)}
                            placeholder="+91 9812033441"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                            Landline No.
                          </label>
                          <input
                            type="text"
                            value={complainantLandline}
                            onChange={(e) => setComplainantLandline(e.target.value)}
                            placeholder="STD - Number"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                            Email ID
                          </label>
                          <input
                            type="email"
                            value={complainantEmail}
                            onChange={(e) => setComplainantEmail(e.target.value)}
                            placeholder="complainant@example.com"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setComplainantFirstName("");
                          setComplainantMiddleName("");
                          setComplainantLastName("");
                          setComplainantRelativeName("");
                          setComplainantMobile("");
                          setComplainantEmail("");
                        }}
                        className="px-3 py-1 border border-slate-300 hover:bg-slate-100 rounded text-xs font-semibold text-slate-700 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Subtab 2: Address */}
                {complainantSubTab === "ADDRESS" && (
                  <div className="bg-white p-4 sm:p-5 rounded-b-lg border border-slate-300 shadow-2xs space-y-4">
                    {/* Present Address */}
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 bg-slate-100 p-2 rounded mb-3">
                        Present Address (वर्तमान पता)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">House No.</label>
                          <input
                            type="text"
                            value={complainantPresentAddress.houseNo}
                            onChange={(e) =>
                              setComplainantPresentAddress({
                                ...complainantPresentAddress,
                                houseNo: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Street Name</label>
                          <input
                            type="text"
                            value={complainantPresentAddress.streetName}
                            onChange={(e) =>
                              setComplainantPresentAddress({
                                ...complainantPresentAddress,
                                streetName: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Colony / Locality / Area</label>
                          <input
                            type="text"
                            value={complainantPresentAddress.colony}
                            onChange={(e) =>
                              setComplainantPresentAddress({
                                ...complainantPresentAddress,
                                colony: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                            Village / Town / City <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={complainantPresentAddress.villageTownCity}
                            onChange={(e) =>
                              setComplainantPresentAddress({
                                ...complainantPresentAddress,
                                villageTownCity: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Tehsil / Block / Mandal</label>
                          <input
                            type="text"
                            value={complainantPresentAddress.tehsil}
                            onChange={(e) =>
                              setComplainantPresentAddress({
                                ...complainantPresentAddress,
                                tehsil: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Country *</label>
                          <select
                            value={complainantPresentAddress.country}
                            onChange={(e) =>
                              setComplainantPresentAddress({
                                ...complainantPresentAddress,
                                country: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                          >
                            <option value="INDIA">INDIA</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">State *</label>
                          <select
                            value={complainantPresentAddress.state}
                            onChange={(e) =>
                              setComplainantPresentAddress({
                                ...complainantPresentAddress,
                                state: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                          >
                            <option value="HARYANA">HARYANA</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">District *</label>
                          <select
                            value={complainantPresentAddress.district}
                            onChange={(e) =>
                              setComplainantPresentAddress({
                                ...complainantPresentAddress,
                                district: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-semibold"
                          >
                            {HARYANA_DISTRICTS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Police Station</label>
                          <input
                            type="text"
                            value={complainantPresentAddress.policeStation}
                            onChange={(e) =>
                              setComplainantPresentAddress({
                                ...complainantPresentAddress,
                                policeStation: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Pincode</label>
                          <input
                            type="text"
                            value={complainantPresentAddress.pincode}
                            onChange={(e) =>
                              setComplainantPresentAddress({
                                ...complainantPresentAddress,
                                pincode: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Yes / No Toggle for copying */}
                    <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-950">
                        Present address: Permanent address same as Present?
                      </span>
                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="complainantSameAsPresentRadio"
                            checked={complainantSameAsPresent === true}
                            onChange={() => setComplainantSameAsPresent(true)}
                          />
                          <span>Yes</span>
                        </label>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="complainantSameAsPresentRadio"
                            checked={complainantSameAsPresent === false}
                            onChange={() => setComplainantSameAsPresent(false)}
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>

                    {/* Permanent Address */}
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 bg-slate-100 p-2 rounded mb-3 flex items-center justify-between">
                        <span>Permanent Address (स्थायी पता)</span>
                        {complainantSameAsPresent && (
                          <span className="text-[10px] text-blue-700 font-semibold normal-case">
                            (वर्तमान पते से स्वचालित रूप से कॉपी किया गया)
                          </span>
                        )}
                      </h4>
                      <div
                        className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${
                          complainantSameAsPresent ? "opacity-60 pointer-events-none" : ""
                        }`}
                      >
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">House No.</label>
                          <input
                            type="text"
                            disabled={complainantSameAsPresent}
                            value={complainantPermanentAddress.houseNo}
                            onChange={(e) =>
                              setComplainantPermanentAddress({
                                ...complainantPermanentAddress,
                                houseNo: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Street Name</label>
                          <input
                            type="text"
                            disabled={complainantSameAsPresent}
                            value={complainantPermanentAddress.streetName}
                            onChange={(e) =>
                              setComplainantPermanentAddress({
                                ...complainantPermanentAddress,
                                streetName: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Colony</label>
                          <input
                            type="text"
                            disabled={complainantSameAsPresent}
                            value={complainantPermanentAddress.colony}
                            onChange={(e) =>
                              setComplainantPermanentAddress({
                                ...complainantPermanentAddress,
                                colony: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Village/Town/City</label>
                          <input
                            type="text"
                            disabled={complainantSameAsPresent}
                            value={complainantPermanentAddress.villageTownCity}
                            onChange={(e) =>
                              setComplainantPermanentAddress({
                                ...complainantPermanentAddress,
                                villageTownCity: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">District</label>
                          <select
                            disabled={complainantSameAsPresent}
                            value={complainantPermanentAddress.district}
                            onChange={(e) =>
                              setComplainantPermanentAddress({
                                ...complainantPermanentAddress,
                                district: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                          >
                            {HARYANA_DISTRICTS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Pincode</label>
                          <input
                            type="text"
                            disabled={complainantSameAsPresent}
                            value={complainantPermanentAddress.pincode}
                            onChange={(e) =>
                              setComplainantPermanentAddress({
                                ...complainantPermanentAddress,
                                pincode: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subtab 3: Other Information */}
                {complainantSubTab === "OTHER" && (
                  <div className="bg-white p-4 sm:p-5 rounded-b-lg border border-slate-300 shadow-2xs space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Country of Nationality
                        </label>
                        <select
                          value={complainantNationality}
                          onChange={(e) => setComplainantNationality(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                        >
                          <option value="INDIA">INDIA</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          ID Type
                        </label>
                        <select
                          value={complainantIdTypeInput}
                          onChange={(e) => setComplainantIdTypeInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-medium"
                        >
                          {MISSING_PERSON_ID_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          ID No.
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={complainantIdNoInput}
                            onChange={(e) => setComplainantIdNoInput(e.target.value)}
                            placeholder="e.g. RC-HR-PKL-99201"
                            className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleAddComplainantId}
                            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Table columns: S.No., ID Type, ID No., Delete */}
                    <div className="border border-slate-200 rounded-md overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200">
                            <th className="py-2 px-3 w-14 text-center">S.No.</th>
                            <th className="py-2 px-4">ID Type</th>
                            <th className="py-2 px-4">ID No.</th>
                            <th className="py-2 px-3 w-16 text-center">Delete</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {complainantIdList.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 text-center font-mono text-slate-500">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-4 font-semibold text-slate-800">
                                {item.idType}
                              </td>
                              <td className="py-2 px-4 font-mono font-bold text-blue-900">
                                {item.idNumber}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setComplainantIdList(
                                      complainantIdList.filter((_, i) => i !== idx)
                                    )
                                  }
                                  className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
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
            )}

            {/* ============================================================== */}
            {/* TAB 3: MISSING PERSON DETAILS                                  */}
            {/* ============================================================== */}
            {activeTab === "MISSING_PERSON" && (
              <div className="space-y-4 animate-in fade-in duration-100">
                {/* Subtab Switcher */}
                <div className="flex border-b border-slate-200 bg-white px-3 pt-2 rounded-t-lg gap-2">
                  <button
                    type="button"
                    onClick={() => setMissingSubTab("PERSONAL")}
                    className={`px-3 py-1.5 text-xs font-bold border-b-2 cursor-pointer ${
                      missingSubTab === "PERSONAL"
                        ? "border-blue-700 text-blue-900"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Personal Information
                  </button>
                  <button
                    type="button"
                    onClick={() => setMissingSubTab("ADDRESS")}
                    className={`px-3 py-1.5 text-xs font-bold border-b-2 cursor-pointer ${
                      missingSubTab === "ADDRESS"
                        ? "border-blue-700 text-blue-900"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Address (लापता व्यक्ति का पता)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMissingSubTab("OTHER")}
                    className={`px-3 py-1.5 text-xs font-bold border-b-2 cursor-pointer ${
                      missingSubTab === "OTHER"
                        ? "border-blue-700 text-blue-900"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Other Information (पहचान पत्र)
                  </button>
                </div>

                {/* Subtab 1: Personal Information */}
                {missingSubTab === "PERSONAL" && (
                  <div className="bg-white p-4 sm:p-5 rounded-b-lg border border-slate-300 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      {/* Form inputs */}
                      <div className="flex-1 space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              UID
                            </label>
                            <input
                              type="text"
                              value={uid}
                              onChange={(e) => setUid(e.target.value)}
                              placeholder="7719-2810-4412"
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              placeholder="e.g. Monu"
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold text-blue-950 focus:outline-none focus:ring-1 focus:ring-blue-600"
                            />
                            <span className="text-[10px] text-slate-500 mt-0.5 block">
                              Monu भरा गया
                            </span>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Middle Name
                            </label>
                            <input
                              type="text"
                              value={middleName}
                              onChange={(e) => setMiddleName(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              placeholder="Kumar"
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Alias (उर्फ़)
                            </label>
                            <input
                              type="text"
                              value={alias}
                              onChange={(e) => setAlias(e.target.value)}
                              placeholder="e.g. Chhotu"
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Relation Type <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={relationType}
                              onChange={(e) => setRelationType(e.target.value as any)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-medium"
                            >
                              <option value="Select">Select</option>
                              <option value="Father">Father</option>
                              <option value="Mother">Mother</option>
                              <option value="Guardian">Guardian</option>
                              <option value="Husband">Husband</option>
                              <option value="Wife">Wife</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Relative Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={relativeName}
                              onChange={(e) => setRelativeName(e.target.value)}
                              placeholder="e.g. Shyam"
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Gender <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={gender}
                              onChange={(e) => setGender(e.target.value as any)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-medium"
                            >
                              <option value="Select">Select</option>
                              <option value="Unknown">Unknown</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Transgender">Transgender</option>
                            </select>
                          </div>
                        </div>

                        {/* Major / Minor Radio & Contacts */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Major / Minor
                            </label>
                            <div className="flex gap-4 font-semibold text-xs">
                              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="majorMinor"
                                  value="Major"
                                  checked={majorMinor === "Major"}
                                  onChange={() => setMajorMinor("Major")}
                                />
                                <span>Major (वयस्क)</span>
                              </label>
                              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="majorMinor"
                                  value="Minor"
                                  checked={majorMinor === "Minor"}
                                  onChange={() => setMajorMinor("Minor")}
                                />
                                <span>Minor (नाबालिग)</span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Mobile No. (+91)
                            </label>
                            <input
                              type="text"
                              value={mobileNo}
                              onChange={(e) => setMobileNo(e.target.value)}
                              placeholder="+91 9416088219"
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Landline No.
                            </label>
                            <input
                              type="text"
                              value={landlineNo}
                              onChange={(e) => setLandlineNo(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Email ID
                            </label>
                            <input
                              type="email"
                              value={emailId}
                              onChange={(e) => setEmailId(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Photo Upload Box on Right */}
                      <div className="w-full sm:w-36 shrink-0 flex flex-col items-center">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 text-center">
                          Upload Photo <span className="text-red-500">*</span>
                        </label>
                        <div className="w-28 h-36 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 flex flex-col items-center justify-center p-1 relative overflow-hidden group">
                          {photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photoUrl}
                              alt="Missing Person"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center text-slate-400">
                              <Upload className="w-6 h-6 mx-auto mb-1" />
                              <span className="text-[10px] block">Upload Photo</span>
                            </div>
                          )}
                          <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold">
                            <Upload className="w-4 h-4 mb-0.5" />
                            <span>Change Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handlePhotoUpload}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Age Panel * */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Age Panel (आयु विवरण) <span className="text-red-500">*</span>
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleResetAge}
                            className="px-2.5 py-1 text-slate-600 border border-slate-300 rounded hover:bg-white text-[11px] font-medium cursor-pointer"
                          >
                            Reset
                          </button>
                          <button
                            type="button"
                            onClick={handleResetAge}
                            className="px-2.5 py-1 text-slate-600 border border-slate-300 rounded hover:bg-white text-[11px] font-medium cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={dob}
                            onChange={(e) => {
                              setDob(e.target.value);
                              if (e.target.value) {
                                const yr = e.target.value.split("-")[0];
                                setYearOfBirth(yr);
                                const diff = 2019 - parseInt(yr);
                                if (diff > 0) setAgeYears(diff.toString());
                              }
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono"
                          />
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            02/12/1990
                          </span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Year of birth
                          </label>
                          <input
                            type="number"
                            value={yearOfBirth}
                            onChange={(e) => setYearOfBirth(e.target.value)}
                            placeholder="1990"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono"
                          />
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            1990 दिखाई देता है
                          </span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Age (Year / Month)
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="number"
                              placeholder="Years"
                              value={ageYears}
                              onChange={(e) => setAgeYears(e.target.value)}
                              className="px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono"
                            />
                            <input
                              type="number"
                              placeholder="Months"
                              value={ageMonths}
                              onChange={(e) => setAgeMonths(e.target.value)}
                              className="px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Age Range (From - To)
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="number"
                              placeholder="From"
                              value={ageRangeFrom}
                              onChange={(e) => setAgeRangeFrom(e.target.value)}
                              className="px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono"
                            />
                            <input
                              type="number"
                              placeholder="To"
                              value={ageRangeTo}
                              onChange={(e) => setAgeRangeTo(e.target.value)}
                              className="px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subtab 2: Address */}
                {missingSubTab === "ADDRESS" && (
                  <div className="bg-white p-4 sm:p-5 rounded-b-lg border border-slate-300 shadow-2xs space-y-4">
                    <div className="bg-blue-50 border border-blue-200 p-2.5 rounded flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-950">
                        Missing Person address same as Complainant&apos;s Address?
                      </span>
                      <label className="inline-flex items-center gap-1.5 font-semibold text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sameAsComplainantAddress}
                          onChange={(e) => setSameAsComplainantAddress(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span>Same as Complainant</span>
                      </label>
                    </div>

                    <div
                      className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${
                        sameAsComplainantAddress ? "opacity-60 pointer-events-none" : ""
                      }`}
                    >
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">House No.</label>
                        <input
                          type="text"
                          value={presentAddress.houseNo}
                          onChange={(e) =>
                            setPresentAddress({ ...presentAddress, houseNo: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Street Name</label>
                        <input
                          type="text"
                          value={presentAddress.streetName}
                          onChange={(e) =>
                            setPresentAddress({ ...presentAddress, streetName: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Colony</label>
                        <input
                          type="text"
                          value={presentAddress.colony}
                          onChange={(e) =>
                            setPresentAddress({ ...presentAddress, colony: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Village / Town / City</label>
                        <input
                          type="text"
                          value={presentAddress.villageTownCity}
                          onChange={(e) =>
                            setPresentAddress({ ...presentAddress, villageTownCity: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">District</label>
                        <select
                          value={presentAddress.district}
                          onChange={(e) =>
                            setPresentAddress({ ...presentAddress, district: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-semibold"
                        >
                          {HARYANA_DISTRICTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Pincode</label>
                        <input
                          type="text"
                          value={presentAddress.pincode}
                          onChange={(e) =>
                            setPresentAddress({ ...presentAddress, pincode: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Subtab 3: Other Information */}
                {missingSubTab === "OTHER" && (
                  <div className="bg-white p-4 sm:p-5 rounded-b-lg border border-slate-300 shadow-2xs space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Nationality
                        </label>
                        <input
                          type="text"
                          value={nationality}
                          onChange={(e) => setNationality(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Occupation
                        </label>
                        <input
                          type="text"
                          value={occupation}
                          onChange={(e) => setOccupation(e.target.value)}
                          placeholder="Student / Private job..."
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Add ID Document
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={mpIdNoInput}
                            onChange={(e) => setMpIdNoInput(e.target.value)}
                            placeholder="ID Number..."
                            className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleAddMpId}
                            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-md overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200">
                            <th className="py-2 px-3 w-14 text-center">S.No.</th>
                            <th className="py-2 px-4">ID Type</th>
                            <th className="py-2 px-4">ID No.</th>
                            <th className="py-2 px-3 w-16 text-center">Delete</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {mpIdList.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 text-center font-mono text-slate-500">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-4 font-semibold text-slate-800">
                                {item.idType}
                              </td>
                              <td className="py-2 px-4 font-mono font-bold text-blue-900">
                                {item.idNumber}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setMpIdList(mpIdList.filter((_, i) => i !== idx))
                                  }
                                  className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
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
            )}

            {/* ============================================================== */}
            {/* TAB 4: PHYSICAL DESCRIPTION                                    */}
            {/* ============================================================== */}
            {activeTab === "PHYSICAL" && (
              <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-300 shadow-2xs space-y-4 animate-in fade-in duration-100">
                <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider pb-2 border-b border-slate-200">
                  Physical Description of Missing Person (शारीरिक हुलिया विवरण)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Height (कद)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="number"
                        placeholder="Feet"
                        value={heightFeet}
                        onChange={(e) => setHeightFeet(e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                      />
                      <input
                        type="number"
                        placeholder="Inches"
                        value={heightInches}
                        onChange={(e) => setHeightInches(e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Complexion (रंग-रूप)
                    </label>
                    <select
                      value={complexion}
                      onChange={(e) => setComplexion(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                    >
                      <option value="Fair">Fair (गोरा)</option>
                      <option value="Wheatish">Wheatish (गेहुंआ)</option>
                      <option value="Dark">Dark (सांवला / काला)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Build (शारीरिक बनावट)
                    </label>
                    <select
                      value={build}
                      onChange={(e) => setBuild(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                    >
                      <option value="Slim">Slim (पतला)</option>
                      <option value="Medium">Medium (सामान्य)</option>
                      <option value="Heavy">Heavy (मजबूत / भारी)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Face Type
                    </label>
                    <input
                      type="text"
                      placeholder="Round / Oval / Long"
                      value={faceType}
                      onChange={(e) => setFaceType(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Hair Color
                    </label>
                    <input
                      type="text"
                      placeholder="Black / Grey"
                      value={hairColor}
                      onChange={(e) => setHairColor(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Eye Color
                    </label>
                    <input
                      type="text"
                      placeholder="Dark Brown / Black"
                      value={eyeColor}
                      onChange={(e) => setEyeColor(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Languages Spoken
                    </label>
                    <input
                      type="text"
                      placeholder="Hindi, Punjabi"
                      value={languagesKnown}
                      onChange={(e) => setLanguagesKnown(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Identifying Marks / Tattoos / Scars (पहचान चिन्ह / तिल / टैटू)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mole on right cheek, small burn scar on left forearm"
                    value={identifyingMarks}
                    onChange={(e) => setIdentifyingMarks(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Clothing Details when Missing (पहने हुए वस्त्र)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Blue checked shirt, dark jeans, white sneakers"
                    value={clothingDetails}
                    onChange={(e) => setClothingDetails(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Habits / Demeanor / Mental Condition (आदतें व स्वभाव)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Speaks politely, no mental disability reported..."
                    value={habitsEccentricities}
                    onChange={(e) => setHabitsEccentricities(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                  />
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 5: IO/EO DETAILS                                           */}
            {/* ============================================================== */}
            {activeTab === "IO_EO" && (
              <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-300 shadow-2xs space-y-4 animate-in fade-in duration-100">
                <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider pb-2 border-b border-slate-200">
                  IO/EO Details (जांच अधिकारी का विवरण)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Name of IO/EO <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={nameOfEo}
                      onChange={(e) => handleEoChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">Select Officer</option>
                      {MOCK_ENQUIRY_OFFICERS_LIST.map((eo, idx) => (
                        <option key={idx} value={eo.display}>
                          {eo.display}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Rank
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={eoRank}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs bg-slate-100 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Expected Date to Complete Enquiry
                    </label>
                    <input
                      type="date"
                      value={expectedDateToComplete}
                      onChange={(e) => setExpectedDateToComplete(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Police Station
                    </label>
                    <input
                      type="text"
                      value={policeStation}
                      onChange={(e) => setPoliceStation(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      District
                    </label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Remarks / Flash Directive
                  </label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="WT message flashed, circular issued to neighboring districts..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions: Submit, Close, Print */}
          <div className="bg-slate-100 px-5 py-3 border-t border-slate-300 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-mono">
                Tab: {activeTab}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-blue-300" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmit()}
                className="px-6 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Submit (जमा करें)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GD Search Popup Modal */}
      <MissingPersonGDSearchModal
        isOpen={isGdSearchOpen}
        onClose={() => setIsGdSearchOpen(false)}
        onSelectGd={handleSelectGd}
      />

      {/* Official A4 Preview Modal with Final Submit, Download, and Print */}
      <MissingPersonPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        record={currentRecord}
        isNewRecord={!initialRecord?.registrationNumber}
        isPendingFinalSubmit={true}
        onBackToEdit={() => setIsPreviewOpen(false)}
        onFinalSubmit={(saved) => {
          if (onSuccess) {
            onSuccess(saved);
          }
          onClose();
        }}
      />
    </>
  );
};
