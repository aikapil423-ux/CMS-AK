"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
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
  Edit2,
  Plus,
  Scale,
  Sparkles,
  UserCheck,
  Eye,
  Save,
  PenTool,
  Crosshair,
  Package,
  Activity,
  Layers,
  X,
  RotateCcw,
  Upload,
  Search,
  Check,
  CheckSquare,
  Square,
  ChevronDown,
  RefreshCw,
  Info,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { firService } from "@/services/firService";
import { ComplaintService } from "@/services/complaintService";
import { ActsService } from "@/services/actsService";
import {
  getUnifiedActsCatalog,
  UnifiedActOption,
  UnifiedSectionOption,
} from "@/lib/cctnsActsData";
import {
  ComplaintItem,
  AccusedPerson,
  FIRItem,
  FIRActSectionEntry,
  FIRMajorMinorHeadEntry,
  FIROccurrenceItem,
  FIRAliasEntry,
  FIRIdentificationEntry,
  FIRPropertyItem,
  FIRDepartmentEntry,
  FIRUidbEntry,
  FIRHurtDetails,
  FIRSignatureData,
} from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePickerDDMMYYYY } from "@/components/ui/date-picker-ddmmyyyy";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { MOCK_ENQUIRY_OFFICERS } from "@/lib/mockData";
import { FIRReceiptModal } from "@/components/fir/FIRReceiptModal";

// Sub-dialogs and Inline Form Sections
import { GDLookupDialog, GDLookupResult } from "@/components/fir/dialogs/GDLookupDialog";
import { ConfirmActionDialog } from "@/components/fir/dialogs/ConfirmActionDialog";
import { InlineOccurrenceSection, ExtendedFIROccurrenceItem } from "@/components/fir/sections/InlineOccurrenceSection";
import { InlineVictimSection, VictimItemData } from "@/components/fir/sections/InlineVictimSection";
import { InlineAccusedSection, ExtendedAccusedPerson } from "@/components/fir/sections/InlineAccusedSection";
import {
  SOURCE_OF_COMPLAINT_OPTIONS,
  DIRECTION_FROM_PS_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  RELATION_TYPE_OPTIONS,
  CASTE_CATEGORY_OPTIONS,
  IDENTIFICATION_TYPE_OPTIONS,
  ACTION_TAKEN_OPTIONS,
  PROPERTY_CATEGORIES,
  PROPERTY_TYPES_BY_CATEGORY,
  getDynamicSourceOfComplaint,
  getDynamicDirectionFromPs,
  getDynamicActionTakenOptions,
  getDynamicCasteCategories,
  getDynamicMajorHeads,
} from "@/components/fir/firDropdownConstants";

// Exactly 10 Main Tabs in strict order — Tag FIR is excluded
export type MainTabKey =
  | "act_section"
  | "occurrence"
  | "complainant"
  | "fir_content"
  | "action_taken"
  | "victim_info"
  | "accused"
  | "property"
  | "hurt_detail"
  | "signature";

const TAB_CONFIG: { key: MainTabKey; label: string; icon: any; shortTitle: string }[] = [
  { key: "act_section", label: "1. Act & Section", shortTitle: "Act & Section", icon: Scale },
  { key: "occurrence", label: "2. Occurrence", shortTitle: "Occurrence", icon: MapPin },
  { key: "complainant", label: "3. Complainant", shortTitle: "Complainant", icon: User },
  { key: "fir_content", label: "4. FIR Content", shortTitle: "FIR Content", icon: FileText },
  { key: "action_taken", label: "5. Action Taken", shortTitle: "Action Taken", icon: Shield },
  { key: "victim_info", label: "6. Victim Information", shortTitle: "Victim Info", icon: Users },
  { key: "accused", label: "7. Accused", shortTitle: "Accused", icon: Crosshair },
  { key: "property", label: "8. Property of Interest", shortTitle: "Property", icon: Package },
  { key: "hurt_detail", label: "9. Hurt Case Detail", shortTitle: "Hurt Case", icon: Activity },
  { key: "signature", label: "10. Signature", shortTitle: "Signature", icon: PenTool },
];

const MAJOR_HEADS = [
  "Crime Against Property",
  "Crime Against Body",
  "Crime Against Women",
  "Economic Offences",
  "Cyber Crime",
  "Narcotic Drugs",
  "Public Peace & Order",
  "Special & Local Laws",
  "Traffic & Motor Vehicles",
];

const MINOR_HEADS: Record<string, string[]> = {
  "Crime Against Property": ["Theft", "Burglary", "Robbery", "Dacoity", "Extortion", "Criminal Trespass", "Mischief"],
  "Crime Against Body": ["Murder", "Attempt to Murder", "Culpable Homicide", "Grievous Hurt", "Simple Hurt", "Kidnapping", "Abduction"],
  "Crime Against Women": ["Rape", "Molestation / Outraging Modesty", "Dowry Harassment", "Cruelty by Husband/Relatives", "Stalking"],
  "Economic Offences": ["Cheating", "Criminal Breach of Trust", "Forgery", "Counterfeiting", "Bank Fraud"],
  "Cyber Crime": ["Financial Cyber Fraud", "Identity Theft", "Hacking", "Cyber Stalking", "Obscene Content"],
  "Narcotic Drugs": ["Possession of Commercial Quantity", "Intermediate Quantity", "Small Quantity", "Trafficking"],
  "Public Peace & Order": ["Rioting", "Unlawful Assembly", "Affray", "Obstruction of Public Servant"],
  "Special & Local Laws": ["Arms Act Violation", "Excise Act Violation", "Gambling Act Violation"],
  "Traffic & Motor Vehicles": ["Rash and Negligent Driving", "Fatal Accident", "Hit and Run"],
};

function RegisterFIRForm() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const complaintIdParam = searchParams.get("complaintId");

  const [activeTab, setActiveTab] = useState<MainTabKey>("act_section");
  const [complainantSubtab, setComplainantSubtab] = useState<"personal" | "address" | "other">("personal");

  // Linked Complaint & Status
  const [linkedComplaint, setLinkedComplaint] = useState<ComplaintItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registeredFir, setRegisteredFir] = useState<FIRItem | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [draftRestoredNotice, setDraftRestoredNotice] = useState<string | null>(null);
  const [saveDraftFeedback, setSaveDraftFeedback] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generated FIR Number for display
  const [autoFirNumber, setAutoFirNumber] = useState<{ firNumber: string; firYear: number }>(() => {
    return firService.generateNextFirNumber();
  });

  // Jurisdiction & Header
  const [state, setState] = useState("Haryana");
  const [district, setDistrict] = useState("Gurugram");
  const [policeStation, setPoliceStation] = useState("Sector 29 Police Station");
  const [firDate, setFirDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [firTime, setFirTime] = useState(() => new Date().toTimeString().slice(0, 5));

  // Dialog Visibility & Edit States
  const [showGDLookupDialog, setShowGDLookupDialog] = useState(false);

  // Occurrence Inline Handlers
  const handleAddOccurrence = (item: ExtendedFIROccurrenceItem) => {
    setOccurrencesList((prev) => [...prev, item]);
  };
  const handleUpdateOccurrence = (item: ExtendedFIROccurrenceItem) => {
    setOccurrencesList((prev) => prev.map((it) => (it.id === item.id ? item : it)));
  };
  const handleDeleteOccurrence = (id: string) => {
    setOccurrencesList((prev) => prev.filter((it) => it.id !== id));
  };

  // Victim Inline Handlers
  const handleAddVictim = (item: VictimItemData) => {
    setVictimsList((prev) => [...prev, item]);
  };
  const handleUpdateVictim = (item: VictimItemData) => {
    setVictimsList((prev) => prev.map((it) => (it.id === item.id ? item : it)));
  };
  const handleDeleteVictim = (id: string) => {
    setVictimsList((prev) => prev.filter((it) => it.id !== id));
  };

  // Accused Inline Handlers
  const handleAddAccused = (item: ExtendedAccusedPerson) => {
    setAccusedList((prev) => [...prev, item]);
  };
  const handleUpdateAccused = (item: ExtendedAccusedPerson) => {
    setAccusedList((prev) => prev.map((it) => (it.id === item.id ? item : it)));
  };
  const handleDeleteAccused = (id: string) => {
    setAccusedList((prev) => prev.filter((it) => it.id !== id));
  };

  // Common Action Confirmation Modal
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "primary";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // TAB 1: Act & Section
  const [gdEntryNumber, setGdEntryNumber] = useState("");
  const [gdDate, setGdDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [gdTime, setGdTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [sourceOfComplaint, setSourceOfComplaint] = useState("Citizen/General Public");
  const [complaintNumber, setComplaintNumber] = useState("");
  const [isHeinousCrime, setIsHeinousCrime] = useState(false);
  const [isSensitiveFIR, setIsSensitiveFIR] = useState(false);
  const [originalDateTime, setOriginalDateTime] = useState("");
  const [actRemarks, setActRemarks] = useState("");
  const [typeOfInfo, setTypeOfInfo] = useState<"WRITTEN" | "ORAL">("WRITTEN");

  // Act & Section list
  const [unifiedActs, setUnifiedActs] = useState<UnifiedActOption[]>(() => {
    return getUnifiedActsCatalog(ActsService.getAllActs());
  });
  const [selectedActId, setSelectedActId] = useState<string>("act_bns_2023");
  const [currentAct, setCurrentAct] = useState("Bharatiya Nyaya Sanhita, 2023 (BNS)");
  const [actSearchQuery, setActSearchQuery] = useState("");
  const [isActDropdownOpen, setIsActDropdownOpen] = useState(false);
  const actDropdownRef = useRef<HTMLDivElement | null>(null);
  const actSearchInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [sectionSearchQuery, setSectionSearchQuery] = useState("");
  const [currentSection, setCurrentSection] = useState("");
  const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);
  const sectionDropdownRef = useRef<HTMLDivElement | null>(null);
  const [actsAndSectionsList, setActsAndSectionsList] = useState<FIRActSectionEntry[]>([]);

  // Major / Minor Head list
  const [currentMajorHead, setCurrentMajorHead] = useState(MAJOR_HEADS[0]);
  const [currentMinorHead, setCurrentMinorHead] = useState(MINOR_HEADS[MAJOR_HEADS[0]][0] || "");
  const [majorMinorHeadsList, setMajorMinorHeadsList] = useState<FIRMajorMinorHeadEntry[]>([]);

  // Dynamic Options from DropdownManagerService
  const [sourceOfComplaintList, setSourceOfComplaintList] = useState<string[]>(getDynamicSourceOfComplaint);
  const [actionTakenList, setActionTakenList] = useState<string[]>(getDynamicActionTakenOptions);
  const [casteCategoryList, setCasteCategoryList] = useState<string[]>(getDynamicCasteCategories);
  const [majorHeadsOptions, setMajorHeadsOptions] = useState<string[]>(() => getDynamicMajorHeads(MAJOR_HEADS));

  useEffect(() => {
    const refreshDropdowns = () => {
      setSourceOfComplaintList(getDynamicSourceOfComplaint());
      setActionTakenList(getDynamicActionTakenOptions());
      setCasteCategoryList(getDynamicCasteCategories());
      setMajorHeadsOptions(getDynamicMajorHeads(MAJOR_HEADS));
    };
    window.addEventListener("cms-dropdowns-updated", refreshDropdowns);
    return () => window.removeEventListener("cms-dropdowns-updated", refreshDropdowns);
  }, []);

  // TAB 2: Occurrence
  const [occurrencesList, setOccurrencesList] = useState<ExtendedFIROccurrenceItem[]>([]);

  // TAB 3: Complainant (3 Subtabs)
  // 3.1 Personal
  const [complainantUid, setComplainantUid] = useState("");
  const [complainantFirstName, setComplainantFirstName] = useState("");
  const [complainantMiddleName, setComplainantMiddleName] = useState("");
  const [complainantLastName, setComplainantLastName] = useState("");
  const [complainantAliases, setComplainantAliases] = useState<FIRAliasEntry[]>([]);
  const [tempAlias, setTempAlias] = useState("");
  const [complainantGender, setComplainantGender] = useState<string>("Male");
  const [complainantMaritalStatus, setComplainantMaritalStatus] = useState<string>("Married");
  const [complainantCategory, setComplainantCategory] = useState<string>("GENERAL");
  const [complainantMobile, setComplainantMobile] = useState("");
  const [complainantLandline, setComplainantLandline] = useState("");
  const [complainantEmail, setComplainantEmail] = useState("");
  const [complainantRelationType, setComplainantRelationType] = useState<string>("Father");
  const [complainantRelativeName, setComplainantRelativeName] = useState("");
  const [complainantRelativeAlias, setComplainantRelativeAlias] = useState("");
  const [complainantSameAsVictim, setComplainantSameAsVictim] = useState(true);
  const [complainantDob, setComplainantDob] = useState("");
  const [complainantYearOfBirth, setComplainantYearOfBirth] = useState("");
  const [complainantAge, setComplainantAge] = useState<string>("");
  const [complainantAgeMonths, setComplainantAgeMonths] = useState<string>("");
  const [complainantAgeRange, setComplainantAgeRange] = useState<string>("Not Specified");

  // 3.2 Address
  const [permHouseNo, setPermHouseNo] = useState("");
  const [permStreet, setPermStreet] = useState("");
  const [permColony, setPermColony] = useState("");
  const [permCity, setPermCity] = useState("Gurugram");
  const [permTehsil, setPermTehsil] = useState("Gurugram");
  const [permCountry, setPermCountry] = useState("India");
  const [permState, setPermState] = useState("Haryana");
  const [permDistrict, setPermDistrict] = useState("Gurugram");
  const [permPs, setPermPs] = useState("Sector 29 Police Station");
  const [permPincode, setPermPincode] = useState("");
  const [presentSameAsPerm, setPresentSameAsPerm] = useState(true);
  const [presHouseNo, setPresHouseNo] = useState("");
  const [presStreet, setPresStreet] = useState("");
  const [presColony, setPresColony] = useState("");
  const [presCity, setPresCity] = useState("Gurugram");
  const [presTehsil, setPresTehsil] = useState("Gurugram");
  const [presDistrict, setPresDistrict] = useState("Gurugram");
  const [presState, setPresState] = useState("Haryana");
  const [presPincode, setPresPincode] = useState("");
  const [presAddressFull, setPresAddressFull] = useState("");

  // 3.3 Other Info
  const [complainantOccupation, setComplainantOccupation] = useState("Private Service");
  const [complainantNationality, setComplainantNationality] = useState("Indian");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportIssueDate, setPassportIssueDate] = useState("");
  const [passportIssuePlace, setPassportIssuePlace] = useState("");
  const [identificationsList, setIdentificationsList] = useState<FIRIdentificationEntry[]>([]);
  const [tempIdType, setTempIdType] = useState<string>("Aadhar Card");
  const [tempIdNumber, setTempIdNumber] = useState("");

  // TAB 4: FIR Content (No voice buttons, 10,000 char counter)
  const [firContentText, setFirContentText] = useState("");
  const [briefFacts, setBriefFacts] = useState("");
  const [reasonsForDelay, setReasonsForDelay] = useState("");
  const [uploadedContentFiles, setUploadedContentFiles] = useState<string[]>([]);

  // TAB 5: Action Taken
  const [isSecretFir, setIsSecretFir] = useState(false);
  const [actionType, setActionType] = useState<string>("Investigation/Assign IO");
  const [assignedIoId, setAssignedIoId] = useState("eo_3");
  const [refusedReason, setRefusedReason] = useState("");
  const [transferredPs, setTransferredPs] = useState("");
  const [transferredDistrict, setTransferredDistrict] = useState("");
  const [assignedDirections, setAssignedDirections] = useState("");
  const [departmentList, setDepartmentList] = useState<FIRDepartmentEntry[]>([]);
  const [tempDeptName, setTempDeptName] = useState("");
  const [tempDeptEmail, setTempDeptEmail] = useState("");
  const [inquestReportNo, setInquestReportNo] = useState("");
  const [courtDispatchDateTime, setCourtDispatchDateTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return `${d.toISOString().split("T")[0]}T${d.toTimeString().slice(0, 5)}`;
  });
  const [roacConfirmed, setRoacConfirmed] = useState(true);
  const [freeCopyGiven, setFreeCopyGiven] = useState(true);

  // TAB 6: Victim Information
  const [victimsList, setVictimsList] = useState<any[]>([]);

  // TAB 7: Accused
  const [isAccusedKnown, setIsAccusedKnown] = useState(true);
  const [accusedMoreThan, setAccusedMoreThan] = useState("");
  const [accusedList, setAccusedList] = useState<ExtendedAccusedPerson[]>([]);

  // TAB 8: Property of Interest (Excluding Nature of Property)
  const [propertiesList, setPropertiesList] = useState<FIRPropertyItem[]>([]);
  const [tempPropCategory, setTempPropCategory] = useState<string>(PROPERTY_CATEGORIES[0]);
  const [tempPropType, setTempPropType] = useState<string>(PROPERTY_TYPES_BY_CATEGORY[PROPERTY_CATEGORIES[0]][0]);
  const [tempPropDescription, setTempPropDescription] = useState("");
  const [tempPropValue, setTempPropValue] = useState("");

  // TAB 9: Hurt Case Detail
  const [countDeceased, setCountDeceased] = useState("0");
  const [countSeriouslyHurt, setCountSeriouslyHurt] = useState("0");
  const [countSimpleHurt, setCountSimpleHurt] = useState("0");
  const [countNonInjured, setCountNonInjured] = useState("0");
  const [injuryDescription, setInjuryDescription] = useState("");
  const [weaponUsed, setWeaponUsed] = useState("Physical assault / Blunt");
  const [videoFootageAvailable, setVideoFootageAvailable] = useState(false);
  const [uploadedMedicalDocs, setUploadedMedicalDocs] = useState<string[]>([]);

  // TAB 10: Signature
  const [signatureCanvasDrawn, setSignatureCanvasDrawn] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hardwareOfflineNotice, setHardwareOfflineNotice] = useState(false);
  const [officerName, setOfficerName] = useState(() => currentUser?.name || "Inspector Rajesh Kumar");
  const [officerRank, setOfficerRank] = useState("Inspector (SHO)");
  const [officerNumber, setOfficerNumber] = useState("SHO/2901");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dropdown click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sectionDropdownRef.current && !sectionDropdownRef.current.contains(event.target as Node)) {
        setIsSectionDropdownOpen(false);
      }
      if (actDropdownRef.current && !actDropdownRef.current.contains(event.target as Node)) {
        setIsActDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update dependent Property Types when category changes
  useEffect(() => {
    const types = PROPERTY_TYPES_BY_CATEGORY[tempPropCategory] || [];
    if (types.length > 0) {
      setTempPropType(types[0]);
    } else {
      setTempPropType("");
    }
  }, [tempPropCategory]);

  // Load Draft or Linked Complaint on Mount
  useEffect(() => {
    ActsService.getAllActsAsync()
      .then((acts) => {
        setUnifiedActs(getUnifiedActsCatalog(acts));
      })
      .catch(() => {});

    if (complaintIdParam) {
      ComplaintService.getComplaintById(complaintIdParam)
        .then((c) => {
          if (c) {
            setLinkedComplaint(c);
            setComplaintNumber(c.complaintNumber);
            setSourceOfComplaint("Haryana Police Grievance Portal");
            const names = (c.complainantName || "").split(" ");
            setComplainantFirstName(names[0] || "");
            setComplainantLastName(names.slice(1).join(" ") || "");
            setComplainantRelativeName(c.complainantFatherSpouse || c.complainantRelativeName || "");
            setComplainantGender((c.complainantGender as any) || "MALE");
            if (c.complainantAge) setComplainantAge(String(c.complainantAge));
            setComplainantMobile(c.complainantMobile || "");
            setPermHouseNo(c.complainantAddress || "");
            setPermCity(c.complainantCity || "Gurugram");
            setPermDistrict(c.complainantDistrict || "Gurugram");
            setFirContentText(c.incidentDetails || "");
            setBriefFacts(c.incidentDetails?.slice(0, 300) || "");
            if ((c as any).gdEntryNumber) setGdEntryNumber((c as any).gdEntryNumber);
            if (c.assignedEoId) setAssignedIoId(c.assignedEoId);

            // Legal analysis prefill
            if (c.legalAnalysis?.suggestedSections && c.legalAnalysis.suggestedSections.length > 0) {
              const acts = c.legalAnalysis.suggestedSections.map((s: any, idx: number) => ({
                id: `act-pre-${idx}`,
                srNo: idx + 1,
                act: s.actShortName || "Bharatiya Nyaya Sanhita, 2023 (BNS)",
                sections: `Sec ${s.sectionNumber}`,
              }));
              setActsAndSectionsList(acts);
            } else {
              setActsAndSectionsList([
                {
                  id: "act-1",
                  srNo: 1,
                  act: "Bharatiya Nyaya Sanhita, 2023 (BNS)",
                  sections: "Sec 303(2), 305",
                },
              ]);
            }

            // Occurrence prefill
            setOccurrencesList([
              {
                id: "occ-1",
                srNo: 1,
                day: "Monday",
                dateFrom: c.incidentDate || new Date().toISOString().split("T")[0],
                dateTo: c.incidentDate || new Date().toISOString().split("T")[0],
                timeFrom: "10:00",
                timeTo: "12:00",
                timePeriod: "Morning / Pahar 1",
                directionFromPs: "EAST",
                distanceKm: "1.5",
                area: c.incidentPlace || "Commercial Area",
                city: "Gurugram",
                beatNo: "Beat No. 2",
                isKnownDate: true,
                isForestPlace: false,
              },
            ]);
          }
        })
        .catch((e) => console.warn("Prefill error:", e));
    } else {
      const draft = typeof firService?.getFirDraft === "function" ? firService.getFirDraft() : null;
      if (draft && draft.savedAt) {
        setDraftRestoredNotice(
          `A saved draft from ${new Date(draft.savedAt).toLocaleTimeString()} was found. You can restore it.`
        );
      }
    }
  }, [complaintIdParam]);

  // Restore Draft Action
  const handleRestoreDraft = () => {
    const draft = typeof firService?.getFirDraft === "function" ? firService.getFirDraft() : null;
    if (!draft) return;
    try {
      if (draft.actsAndSectionsList) setActsAndSectionsList(draft.actsAndSectionsList);
      if (draft.majorMinorHeadsList) setMajorMinorHeadsList(draft.majorMinorHeadsList);
      if (draft.gdEntryNumber) setGdEntryNumber(draft.gdEntryNumber);
      if (draft.occurrencesList) setOccurrencesList(draft.occurrencesList);
      if (draft.complainantFirstName) setComplainantFirstName(draft.complainantFirstName);
      if (draft.complainantLastName) setComplainantLastName(draft.complainantLastName);
      if (draft.complainantMobile) setComplainantMobile(draft.complainantMobile);
      if (draft.complainantGender) setComplainantGender(draft.complainantGender);
      if (draft.complainantCategory) setComplainantCategory(draft.complainantCategory);
      if (draft.complainantAge) setComplainantAge(draft.complainantAge);
      if (draft.permHouseNo) setPermHouseNo(draft.permHouseNo);
      if (draft.firContentText) setFirContentText(draft.firContentText);
      if (draft.briefFacts) setBriefFacts(draft.briefFacts);
      if (draft.reasonsForDelay) setReasonsForDelay(draft.reasonsForDelay);
      if (draft.actionType) setActionType(draft.actionType);
      if (draft.assignedIoId) setAssignedIoId(draft.assignedIoId);
      if (draft.victimsList) setVictimsList(draft.victimsList);
      if (draft.accusedList) setAccusedList(draft.accusedList);
      if (draft.propertiesList) setPropertiesList(draft.propertiesList);
      setDraftRestoredNotice(null);
      setSaveDraftFeedback("Draft successfully restored!");
      setTimeout(() => setSaveDraftFeedback(null), 3000);
    } catch (e) {
      console.error("Failed to restore draft:", e);
    }
  };

  // Save Draft Action
  const handleSaveDraft = () => {
    const currentDraft = {
      actsAndSectionsList,
      majorMinorHeadsList,
      gdEntryNumber,
      occurrencesList,
      complainantFirstName,
      complainantLastName,
      complainantMobile,
      complainantGender,
      complainantCategory,
      complainantAge,
      permHouseNo,
      firContentText,
      briefFacts,
      reasonsForDelay,
      actionType,
      assignedIoId,
      victimsList,
      accusedList,
      propertiesList,
    };
    firService.saveFirDraft(currentDraft);
    setSaveDraftFeedback("Draft saved to browser storage at " + new Date().toLocaleTimeString());
    setTimeout(() => setSaveDraftFeedback(null), 4000);
  };

  // Clear All Form Fields
  const handleClearAll = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Clear All FIR Data?",
      description: "This will reset all 10 tabs and erase all entered acts, occurrences, complainant details, and facts. This action cannot be reversed.",
      variant: "danger",
      confirmLabel: "Yes, Clear All Fields",
      onConfirm: () => {
        setActsAndSectionsList([]);
        setMajorMinorHeadsList([]);
        setOccurrencesList([]);
        setVictimsList([]);
        setAccusedList([]);
        setPropertiesList([]);
        setDepartmentList([]);
        setIdentificationsList([]);
        setComplainantAliases([]);
        setGdEntryNumber("");
        setComplaintNumber("");
        setOriginalDateTime("");
        setActRemarks("");
        setComplainantFirstName("");
        setComplainantMiddleName("");
        setComplainantLastName("");
        setComplainantMobile("");
        setComplainantEmail("");
        setComplainantRelativeName("");
        setComplainantAge("");
        setComplainantDob("");
        setComplainantYearOfBirth("");
        setPermHouseNo("");
        setPermStreet("");
        setPermColony("");
        setPermPincode("");
        setFirContentText("");
        setBriefFacts("");
        setReasonsForDelay("");
        setCountDeceased("0");
        setCountSeriouslyHurt("0");
        setCountSimpleHurt("0");
        setCountNonInjured("0");
        setInjuryDescription("");
        setSignatureCanvasDrawn(false);
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        setSaveDraftFeedback("All FIR form fields have been reset.");
        setTimeout(() => setSaveDraftFeedback(null), 3000);
      },
    });
  };

  // Close / Exit Confirmation
  const handleCloseForm = () => {
    const hasData =
      actsAndSectionsList.length > 0 ||
      complainantFirstName.trim().length > 0 ||
      firContentText.trim().length > 0;

    if (hasData) {
      setConfirmConfig({
        isOpen: true,
        title: "Discard Unsaved FIR Changes?",
        description: "You have unsaved information entered in this FIR registration form. Are you sure you want to close and return to the FIR list?",
        variant: "warning",
        confirmLabel: "Discard & Exit",
        onConfirm: () => {
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
          router.push("/fir");
        },
      });
    } else {
      router.push("/fir");
    }
  };

  // Reset Age Details
  const handleResetAge = () => {
    setComplainantDob("");
    setComplainantYearOfBirth("");
    setComplainantAge("");
    setComplainantAgeMonths("");
    setComplainantAgeRange("Not Specified");
  };

  // Validate Integer Hurt Count
  const handleHurtCountChange = (setter: (v: string) => void, val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 0) {
      setter("0");
    } else {
      setter(String(num));
    }
  };

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.strokeStyle = "#0b192c";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
    setSignatureCanvasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureCanvasDrawn(false);
  };

  // Tab 1 Inline Act & Section Helpers
  const handleSelectAct = (actId: string) => {
    setSelectedActId(actId);
    const found = unifiedActs.find((a) => a.id === actId);
    if (found) setCurrentAct(found.name);
    setSelectedSections([]);
    setSectionSearchQuery("");
  };

  const handleToggleSection = (secNum: string) => {
    setSelectedSections((prev) =>
      prev.includes(secNum) ? prev.filter((s) => s !== secNum) : [...prev, secNum]
    );
  };

  const handleAddCustomSection = (rawInput: string) => {
    const trimmed = rawInput.trim().replace(/^Sec(tion)?\.?\s*/i, "");
    if (!trimmed) return;
    if (!selectedSections.includes(trimmed)) {
      setSelectedSections((prev) => [...prev, trimmed]);
    }
    setSectionSearchQuery("");
  };

  const handleAddActSectionInline = () => {
    const finalSections = [...selectedSections];
    if (sectionSearchQuery.trim()) {
      const typed = sectionSearchQuery.trim().replace(/^Sec(tion)?\.?\s*/i, "");
      if (typed && !finalSections.includes(typed)) finalSections.push(typed);
    } else if (currentSection.trim()) {
      const parts = currentSection
        .split(",")
        .map((s) => s.trim().replace(/^Sec(tion)?\.?\s*/i, ""))
        .filter(Boolean);
      for (const p of parts) {
        if (!finalSections.includes(p)) finalSections.push(p);
      }
    }

    if (finalSections.length === 0) {
      alert("Please select or type at least one section number for this Act.");
      return;
    }

    const currentActObj = unifiedActs.find((a) => a.id === selectedActId);
    const actName = currentActObj?.name || currentAct;

    const newEntry: FIRActSectionEntry = {
      id: `act-${Date.now()}`,
      srNo: actsAndSectionsList.length + 1,
      act: actName,
      sections: finalSections.join(", "),
    };
    setActsAndSectionsList([...actsAndSectionsList, newEntry]);
    setSelectedSections([]);
    setSectionSearchQuery("");
    setCurrentSection("");
    setIsSectionDropdownOpen(false);
  };

  // Major / Minor Head helpers
  const handleAddMajorMinorHead = () => {
    if (!currentMinorHead) return;
    const newEntry: FIRMajorMinorHeadEntry = {
      id: `head-${Date.now()}`,
      srNo: majorMinorHeadsList.length + 1,
      majorHead: currentMajorHead,
      minorHead: currentMinorHead,
    };
    setMajorMinorHeadsList([...majorMinorHeadsList, newEntry]);
  };

  // Complainant Aliases & IDs helpers
  const handleAddAlias = () => {
    if (!tempAlias.trim()) return;
    setComplainantAliases([
      ...complainantAliases,
      { id: `alias-${Date.now()}`, aliasName: tempAlias.trim() },
    ]);
    setTempAlias("");
  };

  const handleAddIdentification = () => {
    if (!tempIdNumber.trim()) return;
    setIdentificationsList([
      ...identificationsList,
      { id: `id-${Date.now()}`, idType: tempIdType, idNumber: tempIdNumber.trim() },
    ]);
    setTempIdNumber("");
  };

  // Department Table helpers (Tab 5)
  const handleAddDepartment = () => {
    if (!tempDeptName.trim()) return;
    setDepartmentList([
      ...departmentList,
      {
        id: `dept-${Date.now()}`,
        departmentName: tempDeptName.trim(),
        departmentEmail: tempDeptEmail.trim(),
      },
    ]);
    setTempDeptName("");
    setTempDeptEmail("");
  };

  // Link Complainant as Victim (Tab 6)
  const handleLinkComplainantAsVictim = () => {
    const compVictim = {
      id: `vic-${Date.now()}`,
      srNo: victimsList.length + 1,
      name: `${complainantFirstName} ${complainantLastName}`.trim() || "Complainant",
      gender: complainantGender,
      age: complainantAge || "Adult",
      victimType: "Complainant",
      address: permHouseNo ? `${permHouseNo}, ${permCity}, ${permDistrict}` : "As per Complainant Record",
      mobile: complainantMobile,
      relativeName: complainantRelativeName,
      statements: [],
    };
    setVictimsList([...victimsList, compVictim]);
  };

  // Property of Interest helpers (Tab 8)
  const handleAddProperty = () => {
    if (!tempPropDescription.trim()) {
      alert("Please enter property description.");
      return;
    }
    const newProp: FIRPropertyItem = {
      id: `prop-${Date.now()}`,
      srNo: propertiesList.length + 1,
      propertyCategory: tempPropCategory,
      propertyType: tempPropType || "Miscellaneous",
      description: tempPropDescription.trim(),
      estimatedValue: tempPropValue ? Number(tempPropValue) : 0,
    };
    setPropertiesList([...propertiesList, newProp]);
    setTempPropDescription("");
    setTempPropValue("");
  };

  // Build full FIR object for Draft / Submit / Preview
  const buildCurrentFirItem = (): FIRItem => {
    const actsStr = actsAndSectionsList.map((a) => `${a.act}: ${a.sections}`).join("; ") || "Sec 173 BNSS";
    const selectedOfficer = MOCK_ENQUIRY_OFFICERS.find((eo) => eo.id === assignedIoId);

    const primaryOcc = occurrencesList[0] || {
      dateFrom: firDate,
      dateTo: firDate,
      timeFrom: "10:00",
      timeTo: "12:00",
      day: "Monday",
      timePeriod: "Morning / Pahar 1",
      directionFromPs: "East",
      distanceKm: "1.5",
      area: "Area of incident",
      city: district,
      beatNo: "Beat No. 1",
    };

    return {
      id: `fir-${autoFirNumber.firNumber.replace(/\//g, "-")}`,
      firNumber: autoFirNumber.firNumber,
      firYear: autoFirNumber.firYear,
      firDate,
      firTime,
      policeStation,
      district,
      state,
      sourceComplaintId: linkedComplaint?.id,
      sourceComplaintNumber: linkedComplaint?.complaintNumber || complaintNumber,
      category: "GENERAL",
      categoryDisplay: majorMinorHeadsList[0]?.majorHead || "Cognizable Offence",
      priority: isHeinousCrime ? "URGENT" : isSensitiveFIR ? "HIGH" : "NORMAL",
      status: "UNDER_INVESTIGATION",
      mainStatus: "Under Investigation",
      gdNumber: gdEntryNumber,
      gdDate,
      gdTime,
      sourceOfComplaint,
      complaintNumber,
      isHeinousCrime,
      isSensitiveFIR,
      originalDateTime,
      remarks: actRemarks,
      typeOfInformation: typeOfInfo,
      actsAndSections: actsStr,
      actsAndSectionsList,
      majorMinorHeadsList,
      occurrencesList,
      incidentDateFrom: primaryOcc.dateFrom,
      incidentDateTo: primaryOcc.dateTo,
      incidentTimeFrom: primaryOcc.timeFrom,
      incidentTimeTo: primaryOcc.timeTo,
      incidentDay: primaryOcc.day,
      incidentTimePeriod: primaryOcc.timePeriod,
      distanceFromPs: `${primaryOcc.distanceKm} KM ${primaryOcc.directionFromPs}`,
      incidentPlace: primaryOcc.area || "Area of incident",
      incidentLandmark: primaryOcc.landmark,
      beatNumber: primaryOcc.beatNo,
      complainantName: `${complainantFirstName} ${complainantLastName}`.trim() || "Complainant",
      complainantFatherSpouse: complainantRelativeName,
      complainantRelationType,
      complainantDob,
      complainantYearOfBirth,
      complainantAge: complainantAge ? Number(complainantAge) : undefined,
      complainantGender,
      complainantMaritalStatus,
      complainantCategory,
      complainantMobile,
      complainantEmail,
      complainantAddress: permHouseNo
        ? `${permHouseNo}, ${permStreet ? permStreet + ", " : ""}${permColony ? permColony + ", " : ""}${permCity}`
        : "Address on file",
      complainantCity: permCity,
      complainantDistrict: permDistrict,
      complainantState: permState,
      complainantUid,
      complainantOccupation,
      complainantNationality,
      complainantPincode: permPincode,
      isAccusedKnown,
      accusedList:
        accusedList.length > 0
          ? accusedList
          : [
              {
                id: "acc-un",
                name: isAccusedKnown ? "Identified Suspect" : "Accused is not known",
                isIdentified: isAccusedKnown,
                isKnown: isAccusedKnown,
                physicalDescription: "Under investigation",
              },
            ],
      victimsList,
      propertiesList,
      totalPropertyEstimatedValue: propertiesList.reduce(
        (acc, p) => acc + (Number(p.estimatedValue) || 0),
        0
      ),
      firContentText: firContentText || briefFacts,
      incidentDetails: firContentText || briefFacts,
      reasonsForDelay,
      registeredBy: `${officerName} (${officerRank})`,
      assignedIoId: actionType === "Investigation/Assign IO" ? selectedOfficer?.id : undefined,
      assignedIoName:
        actionType === "Investigation/Assign IO"
          ? selectedOfficer?.name
          : actionType === "Self Investigation"
          ? officerName
          : undefined,
      assignedIoRank:
        actionType === "Investigation/Assign IO"
          ? selectedOfficer?.rank
          : actionType === "Self Investigation"
          ? officerRank
          : undefined,
      assignedIoBeltNumber:
        actionType === "Investigation/Assign IO"
          ? selectedOfficer?.pno || selectedOfficer?.beltNumber
          : actionType === "Self Investigation"
          ? officerNumber
          : undefined,
      assignedIoPhone: actionType === "Investigation/Assign IO" ? selectedOfficer?.phone : undefined,
      assignedDirections,
      actionTakenData: {
        actionType,
        isSecretFir,
        directedIoId: actionType === "Investigation/Assign IO" ? selectedOfficer?.id : undefined,
        directedIoName:
          actionType === "Investigation/Assign IO"
            ? selectedOfficer?.name
            : actionType === "Self Investigation"
            ? officerName
            : undefined,
        directedIoRank:
          actionType === "Investigation/Assign IO"
            ? selectedOfficer?.rank
            : actionType === "Self Investigation"
            ? officerRank
            : undefined,
        directedIoBelt:
          actionType === "Investigation/Assign IO"
            ? selectedOfficer?.beltNumber || selectedOfficer?.pno
            : actionType === "Self Investigation"
            ? officerNumber
            : undefined,
        refusedReason,
        transferredPs,
        transferredDistrict,
        inquestReportNo,
        courtDispatchDateTime,
        roacConfirmed,
        freeCopyGiven,
      },
      inquestReportNo,
      courtDispatchDateTime,
      daysPending: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  // Form Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (actsAndSectionsList.length === 0) {
      newErrors.act_section = "At least one Act and Section must be added.";
    }
    if (!complainantFirstName.trim()) {
      newErrors.complainant = "Complainant First Name is mandatory.";
    }
    if (!complainantMobile.trim()) {
      newErrors.complainantMobile = "Complainant Mobile number is mandatory.";
    }
    if (!firContentText.trim() && !briefFacts.trim()) {
      newErrors.fir_content = "FIR Contents / Tehreer text is mandatory.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.act_section) setActiveTab("act_section");
      else if (newErrors.complainant || newErrors.complainantMobile) setActiveTab("complainant");
      else if (newErrors.fir_content) setActiveTab("fir_content");
      return false;
    }
    return true;
  };

  // Final Submit Handler with Confirmation Dialog
  const handleInitiateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setConfirmConfig({
      isOpen: true,
      title: "Confirm Statutory FIR Registration",
      description: `You are about to register FIR No. ${autoFirNumber.firNumber} under Section 173 BNSS at ${policeStation}, ${district}. Once registered, statutory notifications will be issued to the Court and supervisory officers.`,
      variant: "primary",
      confirmLabel: "Yes, Register FIR",
      onConfirm: () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        executeRegistration();
      },
    });
  };

  const executeRegistration = () => {
    setSubmitting(true);
    try {
      const liveItem = buildCurrentFirItem();
      const created = firService.registerFir(liveItem);

      firService.clearFirDraft();
      setRegisteredFir(created);
      setShowReceiptModal(true);
    } catch (err: any) {
      console.error("Failed to register FIR:", err);
      alert("Failed to register FIR: " + (err.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  // Tab Navigation Helpers
  const currentTabIndex = TAB_CONFIG.findIndex((t) => t.key === activeTab);
  const handleNextTab = () => {
    if (currentTabIndex < TAB_CONFIG.length - 1) {
      setActiveTab(TAB_CONFIG[currentTabIndex + 1].key);
    }
  };
  const handlePrevTab = () => {
    if (currentTabIndex > 0) {
      setActiveTab(TAB_CONFIG[currentTabIndex - 1].key);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-16 animate-in fade-in-50 text-slate-800">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCloseForm}
            className="h-9 w-9 p-0 text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-700 shadow-xs">
                <Scale className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-black text-[#0b192c] tracking-tight">
                Register First Information Report (FIR)
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Section 173 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 • Haryana Police CCTNS IIF-I Form
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="text-xs text-red-700 border-red-200 hover:bg-red-50 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Clear All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            className="text-xs text-slate-700 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5 text-blue-600" />
            Save Draft
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setRegisteredFir(buildCurrentFirItem());
              setShowReceiptModal(true);
            }}
            className="text-xs text-slate-700 flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-purple-600" />
            Preview IIF-I
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCloseForm}
            className="text-xs text-slate-700 hover:bg-slate-100"
          >
            Close
          </Button>
        </div>
      </div>

      {/* Special Report (SR) Alert Banner */}
      {(isHeinousCrime || isSensitiveFIR) && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-3.5 flex items-start gap-3 shadow-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-red-900 uppercase tracking-wide flex items-center gap-1.5">
              <span>Special Report (SR) Mandatory Alert</span>
              <span className="bg-red-200 text-red-800 text-[10px] px-1.5 py-0.5 rounded font-mono">
                {isHeinousCrime && isSensitiveFIR ? "HEINOUS & SENSITIVE" : isHeinousCrime ? "HEINOUS CRIME" : "SENSITIVE FIR"}
              </span>
            </p>
            <p className="text-red-800 mt-0.5 leading-relaxed">
              Under Punjab Police Rules (PPR) as applicable to Haryana and Section 173 BNSS, a formal Special Report must be dispatched to the Superintendent of Police (SP), Deputy Commissioner / District Magistrate (DM), and Range IG within 24 hours.
            </p>
          </div>
        </div>
      )}

      {/* Draft Restored Banner */}
      {draftRestoredNotice && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-medium">
            <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{draftRestoredNotice}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRestoreDraft}
              className="text-xs bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200"
            >
              Restore Draft
            </Button>
            <button
              onClick={() => setDraftRestoredNotice(null)}
              className="p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {saveDraftFeedback && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 flex items-center gap-2 text-xs text-emerald-900 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveDraftFeedback}</span>
        </div>
      )}

      {/* Linked Complaint Banner */}
      {linkedComplaint && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-900">
                Registering FIR from Linked Complaint #{linkedComplaint.complaintNumber}
              </p>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Complainant: {linkedComplaint.complainantName} • Category: {linkedComplaint.categoryDisplay || linkedComplaint.category} • IO: {linkedComplaint.assignedEoName || "Unassigned"}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono bg-blue-200/80 text-blue-900 px-2.5 py-1 rounded-md font-bold">
            Synchronized Mode
          </span>
        </div>
      )}

      {/* A. FIR HEADER / BASIC DETAILS PANEL */}
      <Card className="border-slate-200 shadow-xs bg-white">
        <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs bg-slate-50/70 border-b border-slate-200">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full mt-0.5 p-1.5 rounded border border-slate-300 bg-white font-medium text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block">District</label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full mt-0.5 p-1.5 rounded border border-slate-300 bg-white font-medium text-xs"
            />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] uppercase font-bold text-slate-500 block">Police Station</label>
            <input
              type="text"
              value={policeStation}
              onChange={(e) => setPoliceStation(e.target.value)}
              className="w-full mt-0.5 p-1.5 rounded border border-slate-300 bg-white font-semibold text-xs text-slate-900"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block">FIR Number</label>
            <input
              type="text"
              value={autoFirNumber.firNumber}
              disabled
              className="w-full mt-0.5 p-1.5 rounded border border-slate-200 bg-slate-100 font-mono font-bold text-red-900 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block">Reg. Date &amp; Time</label>
            <div className="flex gap-1 mt-0.5">
              <div className="w-1/2">
                <DatePickerDDMMYYYY
                  value={firDate}
                  onChange={(e) => setFirDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  size="sm"
                />
              </div>
              <input
                type="time"
                value={firTime}
                onChange={(e) => setFirTime(e.target.value)}
                className="w-1/2 p-1.5 rounded border border-slate-300 bg-white text-xs font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* B. MAIN 10 TABS NAVIGATION BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const hasError = errors[tab.key];
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#0b192c] text-white shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                } ${hasError ? "ring-2 ring-red-500" : ""}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-red-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {hasError && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* FORM BODY */}
      <form onSubmit={handleInitiateSubmit} className="space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: ACT & SECTION */}
        {/* ========================================================================= */}
        {activeTab === "act_section" && (
          <div className="space-y-5 animate-in fade-in-30">
            {/* GD & General Details Panel */}
            <Card className="border-slate-200">
              <CardHeader className="py-2.5 px-4 bg-slate-50 border-b border-slate-200">
                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  General &amp; General Diary (GD) Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* GD Number with Lookup Button */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 block">
                      GD / SD / DD Number <span className="text-red-600">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <VoiceInputButton
                        onTranscript={(t) => setGdEntryNumber(t)}
                        currentValue={gdEntryNumber}
                        fieldLabel="GD Number"
                        iconOnly={true}
                      />
                      <button
                        type="button"
                        onClick={() => setShowGDLookupDialog(true)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Search className="w-3 h-3" />
                        Lookup GD
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. GD-0042/28-03-2026"
                      value={gdEntryNumber}
                      onChange={(e) => setGdEntryNumber(e.target.value)}
                      className="flex-1 p-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-blue-600"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowGDLookupDialog(true)}
                      className="text-xs text-blue-700 border-blue-300 hover:bg-blue-50 shrink-0"
                    >
                      Search
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">GD Entry Date &amp; Time</label>
                  <div className="flex gap-2">
                    <div className="w-1/2">
                      <DatePickerDDMMYYYY
                        value={gdDate}
                        onChange={(e) => setGdDate(e.target.value)}
                        placeholder="DD/MM/YYYY"
                        size="sm"
                      />
                    </div>
                    <input
                      type="time"
                      value={gdTime}
                      onChange={(e) => setGdTime(e.target.value)}
                      className="w-1/2 p-2 rounded-lg border border-slate-300 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Source of Complaint</label>
                  <select
                    value={sourceOfComplaint}
                    onChange={(e) => setSourceOfComplaint(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                  >
                    {sourceOfComplaintList.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 block">Complaint / Docket No.</label>
                    <VoiceInputButton
                      onTranscript={(t) => setComplaintNumber(t)}
                      currentValue={complaintNumber}
                      fieldLabel="Complaint Docket No"
                      iconOnly={true}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. COMP/2026/00142"
                    value={complaintNumber}
                    onChange={(e) => setComplaintNumber(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Original Date &amp; Time (Offence/Info)</label>
                  <input
                    type="datetime-local"
                    value={originalDateTime}
                    onChange={(e) => setOriginalDateTime(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Type of Information</label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="typeOfInfo"
                        checked={typeOfInfo === "WRITTEN"}
                        onChange={() => setTypeOfInfo("WRITTEN")}
                        className="text-blue-600"
                      />
                      <span className="font-semibold text-slate-800">Written (लिखित)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="typeOfInfo"
                        checked={typeOfInfo === "ORAL"}
                        onChange={() => setTypeOfInfo("ORAL")}
                        className="text-blue-600"
                      />
                      <span className="font-semibold text-slate-800">Oral (मौखिक)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">FIR Classification / Category</label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={isHeinousCrime}
                        onChange={(e) => setIsHeinousCrime(e.target.checked)}
                        className="rounded text-red-600"
                      />
                      <span className="font-bold text-red-800">Heinous Crime</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={isSensitiveFIR}
                        onChange={(e) => setIsSensitiveFIR(e.target.checked)}
                        className="rounded text-purple-600"
                      />
                      <span className="font-bold text-purple-800">Sensitive FIR</span>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 block">Remarks</label>
                    <VoiceInputButton
                      onTranscript={(t) => setActRemarks((prev) => (prev ? prev + " " + t : t))}
                      currentValue={actRemarks}
                      fieldLabel="GD Remarks"
                      iconOnly={true}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="GD reference or administrative remarks"
                    value={actRemarks}
                    onChange={(e) => setActRemarks(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Acts and Sections Repeatable Panel */}
            <Card className="border-slate-200 overflow-visible relative z-30">
              <CardHeader className="py-2.5 px-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Scale className="w-4 h-4 text-red-600" />
                  Acts and Sections Applicable
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {actsAndSectionsList.length} Act(s) Added
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs overflow-visible">
                {/* Inline Acts and Sections Selection */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-end relative overflow-visible z-30">
                  <div className="md:col-span-5 relative z-50" ref={actDropdownRef}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 block">Select Act</label>
                      {selectedActId && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          {(() => {
                            const act = unifiedActs.find((a) => a.id === selectedActId);
                            return act ? `${act.sections.length} Sections available` : "";
                          })()}
                        </span>
                      )}
                    </div>

                    <div
                      onClick={() => {
                        setIsActDropdownOpen((prev) => {
                          const nextState = !prev;
                          if (nextState) {
                            setIsSectionDropdownOpen(false);
                            setTimeout(() => actSearchInputRef.current?.focus(), 50);
                          }
                          return nextState;
                        });
                      }}
                      className="w-full min-h-[38px] p-2 rounded-lg border border-slate-300 bg-white text-xs cursor-pointer flex items-center justify-between gap-1 shadow-2xs hover:border-slate-400 focus-within:ring-2 focus-within:ring-[#0b192c]"
                    >
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {(() => {
                          const act = unifiedActs.find((a) => a.id === selectedActId) || unifiedActs[0];
                          if (!act) return <span className="text-slate-400">Select an Act...</span>;
                          return (
                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                              <span className="font-semibold text-slate-800 truncate">
                                {act.name}
                              </span>
                              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0">
                                {act.sections.length} Sec
                              </span>
                              {act.isCustom && (
                                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[9px] font-semibold shrink-0">
                                  Custom
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                          isActDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    {isActDropdownOpen && (
                      <div
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute left-0 w-full sm:min-w-[420px] md:min-w-[480px] max-w-[calc(100vw-2.5rem)] top-full mt-1.5 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 p-2.5 space-y-2.5"
                      >
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            ref={actSearchInputRef}
                            type="text"
                            placeholder="Type to search Act name or category..."
                            value={actSearchQuery}
                            onChange={(e) => setActSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                setIsActDropdownOpen(false);
                              }
                            }}
                            className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#0b192c]"
                          />
                          {actSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setActSearchQuery("")}
                              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {(() => {
                          const q = actSearchQuery.toLowerCase().trim();
                          const filtered = unifiedActs.filter((a) => {
                            if (!q) return true;
                            return (
                              a.name.toLowerCase().includes(q) ||
                              a.title.toLowerCase().includes(q) ||
                              a.category.toLowerCase().includes(q) ||
                              a.id.toLowerCase().includes(q)
                            );
                          });

                          if (filtered.length === 0) {
                            return (
                              <div className="p-4 text-center text-xs text-slate-500">
                                No matching acts found for &quot;{actSearchQuery}&quot;
                              </div>
                            );
                          }

                          const categories = Array.from(new Set(filtered.map((a) => a.category)));

                          return (
                            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white">
                              {categories.map((cat) => {
                                const actsInCat = filtered.filter((a) => a.category === cat);
                                return (
                                  <div key={cat} className="p-1">
                                    <div className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-400 bg-slate-50/80 rounded">
                                      {cat}
                                    </div>
                                    <div className="space-y-0.5 mt-0.5">
                                      {actsInCat.map((act) => {
                                        const isSelected = selectedActId === act.id;
                                        return (
                                          <div
                                            key={act.id}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleSelectAct(act.id);
                                              setIsActDropdownOpen(false);
                                              setActSearchQuery("");
                                            }}
                                            className={`p-2 flex items-center justify-between cursor-pointer text-xs rounded-md transition-colors ${
                                              isSelected
                                                ? "bg-blue-50 text-blue-950 font-semibold border border-blue-200"
                                                : "hover:bg-slate-50 text-slate-700"
                                            }`}
                                          >
                                            <div className="min-w-0 pr-2">
                                              <div className="font-semibold text-slate-800 leading-tight">
                                                {act.name}
                                              </div>
                                              <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                <span className="font-mono text-blue-700 font-bold">
                                                  {act.sections.length} Sections
                                                </span>
                                                {act.isCustom && (
                                                  <span className="text-amber-700 font-medium">
                                                    • [Custom Bare Act]
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                            {isSelected && (
                                              <Check className="w-4 h-4 text-blue-600 shrink-0 font-bold" />
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-5 relative z-40" ref={sectionDropdownRef}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 block">Select Section &amp; Sub Section</label>
                      {selectedSections.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSections([]);
                          }}
                          className="text-[10px] text-red-600 hover:underline font-semibold"
                        >
                          Clear ({selectedSections.length})
                        </button>
                      )}
                    </div>

                    <div
                      onClick={() => {
                        setIsSectionDropdownOpen((prev) => {
                          if (!prev) setIsActDropdownOpen(false);
                          return !prev;
                        });
                      }}
                      className="w-full min-h-[38px] p-1.5 rounded-lg border border-slate-300 bg-white text-xs cursor-pointer flex items-center justify-between gap-1 shadow-2xs hover:border-slate-400 focus-within:ring-2 focus-within:ring-[#0b192c]"
                    >
                      <div className="flex flex-wrap gap-1 items-center flex-1 min-w-0">
                        {selectedSections.length > 0 ? (
                          selectedSections.map((sec) => (
                            <span
                              key={sec}
                              className="inline-flex items-center gap-1 bg-[#0b192c] text-white px-2 py-0.5 rounded text-[11px] font-mono font-bold shrink-0"
                            >
                              <span>Sec {sec}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleSection(sec);
                                }}
                                className="hover:text-red-300 ml-0.5"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">Click to select sections...</span>
                        )}
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>

                    {isSectionDropdownOpen && (
                      <div
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute left-0 w-full sm:min-w-[420px] md:min-w-[480px] max-w-[calc(100vw-2.5rem)] top-full mt-1.5 bg-white border border-slate-300 rounded-xl shadow-2xl z-50 p-2.5 space-y-2.5"
                      >
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            placeholder="Type to filter or add custom section..."
                            value={sectionSearchQuery}
                            onChange={(e) => setSectionSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (sectionSearchQuery.trim()) {
                                  handleAddCustomSection(sectionSearchQuery);
                                }
                              }
                            }}
                            className="w-full pl-8 pr-16 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-[#0b192c]"
                          />
                          {sectionSearchQuery.trim() && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddCustomSection(sectionSearchQuery);
                              }}
                              className="absolute right-1 top-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold"
                            >
                              + Add
                            </button>
                          )}
                        </div>

                        {(() => {
                          const activeObj = unifiedActs.find((a) => a.id === selectedActId) || unifiedActs[0];
                          const secList = activeObj?.sections || [];
                          const q = sectionSearchQuery.toLowerCase().trim();
                          const filtered = secList.filter((s) => {
                            if (!q) return true;
                            return (
                              s.sectionNumber.toLowerCase().includes(q) ||
                              (s.title && s.title.toLowerCase().includes(q))
                            );
                          });

                          return (
                            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white">
                              {filtered.length > 0 ? (
                                filtered.map((sec) => {
                                  const isSelected = selectedSections.includes(sec.sectionNumber);
                                  return (
                                    <div
                                      key={sec.sectionNumber}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleSection(sec.sectionNumber);
                                      }}
                                      className={`p-2 flex items-center justify-between cursor-pointer text-xs rounded-md transition-colors ${
                                        isSelected
                                          ? "bg-blue-50 text-blue-950 font-semibold border border-blue-200"
                                          : "hover:bg-slate-50 text-slate-700"
                                      }`}
                                    >
                                      <div className="flex items-start gap-2 min-w-0">
                                        <div
                                          className={`w-3.5 h-3.5 mt-0.5 rounded flex items-center justify-center shrink-0 text-[10px] border ${
                                            isSelected
                                              ? "bg-blue-600 text-white border-blue-600 font-bold"
                                              : "border-slate-300"
                                          }`}
                                        >
                                          {isSelected ? "✓" : ""}
                                        </div>
                                        <div className="min-w-0 leading-tight">
                                          <span className="font-mono font-bold text-blue-900 mr-1.5">
                                            {sec.sectionNumber}
                                          </span>
                                          {sec.title && (
                                            <span className="text-[11px] text-slate-600 font-normal">
                                              — {sec.title}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="p-3 text-center text-slate-500 text-xs">
                                  <p>No section found for &ldquo;{sectionSearchQuery}&rdquo;.</p>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        <div className="pt-1.5 flex items-center justify-between border-t border-slate-100 text-[11px]">
                          <span className="text-slate-600 font-medium">
                            {selectedSections.length} section(s) selected
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsSectionDropdownOpen(false);
                            }}
                            className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold shadow-xs"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Button
                      type="button"
                      onClick={handleAddActSectionInline}
                      className="w-full bg-[#0b192c] hover:bg-slate-800 text-white text-xs flex items-center justify-center gap-1 h-[38px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Act
                    </Button>
                  </div>
                </div>

                {/* Table */}
                {actsAndSectionsList.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 w-14">S.No.</th>
                          <th className="p-2.5">Acts</th>
                          <th className="p-2.5">Sections</th>
                          <th className="p-2.5 w-20 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {actsAndSectionsList.map((row, idx) => (
                          <tr key={row.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-500">{row.srNo || idx + 1}</td>
                            <td className="p-2.5 font-semibold text-slate-900">{row.act}</td>
                            <td className="p-2.5 font-mono text-blue-900 font-bold">{row.sections}</td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setActsAndSectionsList(
                                    actsAndSectionsList.filter((_, i) => i !== idx).map((it, i) => ({ ...it, srNo: i + 1 }))
                                  )
                                }
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                    No acts &amp; sections added yet. Click &quot;Add Acts &amp; Sections (Dialog)&quot; or use the inline selector above.
                  </div>
                )}
                {errors.act_section && (
                  <p className="text-red-600 text-[11px] font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.act_section}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Major Head & Minor Head Panel */}
            <Card className="border-slate-200">
              <CardHeader className="py-2.5 px-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600" />
                  Major &amp; Minor Heads (Crime Classification)
                </CardTitle>
                <span className="text-[11px] font-semibold text-slate-500">
                  {majorMinorHeadsList.length} Head(s) Added
                </span>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-5">
                    <label className="font-bold text-slate-700 block mb-1">Major Head</label>
                    <select
                      value={currentMajorHead}
                      onChange={(e) => {
                        setCurrentMajorHead(e.target.value);
                        setCurrentMinorHead(MINOR_HEADS[e.target.value]?.[0] || "");
                      }}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                    >
                      {majorHeadsOptions.map((mh) => (
                        <option key={mh} value={mh}>
                          {mh}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-5">
                    <label className="font-bold text-slate-700 block mb-1">Minor Head</label>
                    <select
                      value={currentMinorHead}
                      onChange={(e) => setCurrentMinorHead(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                    >
                      {(MINOR_HEADS[currentMajorHead] || []).map((min) => (
                        <option key={min} value={min}>
                          {min}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Button
                      type="button"
                      onClick={handleAddMajorMinorHead}
                      className="w-full bg-[#0b192c] hover:bg-slate-800 text-white text-xs flex items-center justify-center gap-1 h-[38px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Head
                    </Button>
                  </div>
                </div>

                {majorMinorHeadsList.length > 0 && (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 w-14">S.No.</th>
                          <th className="p-2.5">Major Heads</th>
                          <th className="p-2.5">Minor Heads</th>
                          <th className="p-2.5 w-20 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {majorMinorHeadsList.map((row, idx) => (
                          <tr key={row.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-500">{row.srNo || idx + 1}</td>
                            <td className="p-2.5 font-semibold text-slate-900">{row.majorHead}</td>
                            <td className="p-2.5 font-medium text-slate-700">{row.minorHead}</td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setMajorMinorHeadsList(
                                    majorMinorHeadsList.filter((_, i) => i !== idx).map((it, i) => ({ ...it, srNo: i + 1 }))
                                  )
                                }
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: OCCURRENCE */}
        {/* ========================================================================= */}
        {/* TAB 2: OCCURRENCE (DIRECT INLINE ENTRY & RECORDED LIST) */}
        {/* ========================================================================= */}
        {activeTab === "occurrence" && (
          <div className="space-y-5 animate-in fade-in-30">
            <InlineOccurrenceSection
              occurrencesList={occurrencesList}
              onAddOccurrence={handleAddOccurrence}
              onUpdateOccurrence={handleUpdateOccurrence}
              onDeleteOccurrence={handleDeleteOccurrence}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: COMPLAINANT (3 SUBTABS) */}
        {/* ========================================================================= */}
        {activeTab === "complainant" && (
          <div className="space-y-4 animate-in fade-in-30">
            {/* Subtab Navigation */}
            <div className="flex border-b border-slate-200 gap-2">
              <button
                type="button"
                onClick={() => setComplainantSubtab("personal")}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
                  complainantSubtab === "personal"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                3.1 Personal Information
              </button>
              <button
                type="button"
                onClick={() => setComplainantSubtab("address")}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
                  complainantSubtab === "address"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                3.2 Address Details
              </button>
              <button
                type="button"
                onClick={() => setComplainantSubtab("other")}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
                  complainantSubtab === "other"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                3.3 Other Information &amp; IDs
              </button>
            </div>

            {/* Subtab 3.1: Personal */}
            {complainantSubtab === "personal" && (
              <Card className="border-slate-200">
                <CardContent className="p-4 space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700 block">
                          First Name <span className="text-red-600">*</span>
                        </label>
                        <VoiceInputButton
                          onTranscript={(t) => setComplainantFirstName(t)}
                          currentValue={complainantFirstName}
                          fieldLabel="Complainant First Name"
                          iconOnly={true}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Complainant First Name"
                        value={complainantFirstName}
                        onChange={(e) => setComplainantFirstName(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 font-semibold"
                        required
                      />
                      {errors.complainant && (
                        <p className="text-red-600 text-[10px] mt-0.5">{errors.complainant}</p>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700 block">Middle Name</label>
                        <VoiceInputButton
                          onTranscript={(t) => setComplainantMiddleName(t)}
                          currentValue={complainantMiddleName}
                          fieldLabel="Complainant Middle Name"
                          iconOnly={true}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Middle Name"
                        value={complainantMiddleName}
                        onChange={(e) => setComplainantMiddleName(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700 block">Last Name</label>
                        <VoiceInputButton
                          onTranscript={(t) => setComplainantLastName(t)}
                          currentValue={complainantLastName}
                          fieldLabel="Complainant Last Name"
                          iconOnly={true}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={complainantLastName}
                        onChange={(e) => setComplainantLastName(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Gender <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={complainantGender}
                        onChange={(e) => setComplainantGender(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
                      >
                        {GENDER_OPTIONS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Marital Status</label>
                      <select
                        value={complainantMaritalStatus}
                        onChange={(e) => setComplainantMaritalStatus(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300"
                      >
                        {MARITAL_STATUS_OPTIONS.map((ms) => (
                          <option key={ms} value={ms}>
                            {ms}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Category</label>
                      <select
                        value={complainantCategory}
                        onChange={(e) => setComplainantCategory(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 font-medium"
                      >
                        {casteCategoryList.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Mobile Number (+91) <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        value={complainantMobile}
                        onChange={(e) => setComplainantMobile(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                        required
                      />
                      {errors.complainantMobile && (
                        <p className="text-red-600 text-[10px] mt-0.5">{errors.complainantMobile}</p>
                      )}
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Relation Type</label>
                      <select
                        value={complainantRelationType}
                        onChange={(e) => setComplainantRelationType(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300"
                      >
                        {RELATION_TYPE_OPTIONS.map((rt) => (
                          <option key={rt} value={rt}>
                            {rt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700 block">Relative Name</label>
                        <VoiceInputButton
                          onTranscript={(t) => setComplainantRelativeName(t)}
                          currentValue={complainantRelativeName}
                          fieldLabel="Relative Name"
                          iconOnly={true}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Father's or Husband's Full Name"
                        value={complainantRelativeName}
                        onChange={(e) => setComplainantRelativeName(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>

                  {/* Comprehensive Age Panel with Reset */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 uppercase text-[11px] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        Age &amp; Date of Birth Particulars
                      </span>
                      <button
                        type="button"
                        onClick={handleResetAge}
                        className="text-[11px] font-bold text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset Age
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      <div>
                        <span className="text-[11px] text-slate-500 block">Date of Birth (DOB)</span>
                        <div className="mt-1">
                          <DatePickerDDMMYYYY
                            value={complainantDob}
                            onChange={(e) => {
                              setComplainantDob(e.target.value);
                              if (e.target.value) {
                                const birthYear = new Date(e.target.value).getFullYear();
                                setComplainantYearOfBirth(String(birthYear));
                                const currentYear = new Date().getFullYear();
                                const calcAge = Math.max(0, currentYear - birthYear);
                                setComplainantAge(String(calcAge));
                                if (calcAge < 18) setComplainantAgeRange("Under 18 (Minor / Child)");
                                else if (calcAge <= 30) setComplainantAgeRange("18 - 30 Years (Young Adult)");
                                else if (calcAge <= 50) setComplainantAgeRange("31 - 50 Years (Middle Age)");
                                else if (calcAge <= 60) setComplainantAgeRange("51 - 60 Years (Senior)");
                                else setComplainantAgeRange("Above 60 Years (Elderly / Senior Citizen)");
                              }
                            }}
                            placeholder="DD/MM/YYYY"
                            size="sm"
                          />
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block">Year of Birth</span>
                        <input
                          type="number"
                          placeholder="YYYY"
                          value={complainantYearOfBirth}
                          onChange={(e) => {
                            setComplainantYearOfBirth(e.target.value);
                            if (e.target.value.length === 4) {
                              const calcAge = Math.max(0, new Date().getFullYear() - Number(e.target.value));
                              setComplainantAge(String(calcAge));
                            }
                          }}
                          className="w-full mt-1 p-2 rounded border border-slate-300 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block">Age in Years</span>
                        <input
                          type="number"
                          placeholder="e.g. 35"
                          value={complainantAge}
                          onChange={(e) => setComplainantAge(e.target.value)}
                          className="w-full mt-1 p-2 rounded border border-slate-300 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block">Age in Months</span>
                        <input
                          type="number"
                          placeholder="e.g. 6"
                          value={complainantAgeMonths}
                          onChange={(e) => setComplainantAgeMonths(e.target.value)}
                          className="w-full mt-1 p-2 rounded border border-slate-300 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block">Age Range</span>
                        <select
                          value={complainantAgeRange}
                          onChange={(e) => setComplainantAgeRange(e.target.value)}
                          className="w-full mt-1 p-2 rounded border border-slate-300 text-xs font-medium"
                        >
                          <option value="Not Specified">Not Specified</option>
                          <option value="Under 18 (Minor / Child)">Under 18 (Minor / Child)</option>
                          <option value="18 - 30 Years (Young Adult)">18 - 30 Years (Young Adult)</option>
                          <option value="31 - 50 Years (Middle Age)">31 - 50 Years (Middle Age)</option>
                          <option value="51 - 60 Years (Senior)">51 - 60 Years (Senior)</option>
                          <option value="Above 60 Years (Elderly / Senior Citizen)">
                            Above 60 Years (Elderly)
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Aliases Table */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 uppercase text-[11px]">
                        Aliases / Nicknames (उपनाम)
                      </span>
                      <VoiceInputButton
                        onTranscript={(t) => setTempAlias(t)}
                        currentValue={tempAlias}
                        fieldLabel="Alias / Nickname"
                        iconOnly={true}
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Alias / Nickname"
                        value={tempAlias}
                        onChange={(e) => setTempAlias(e.target.value)}
                        className="flex-1 p-2 rounded border border-slate-300 text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddAlias}
                        className="text-xs bg-slate-700 text-white"
                      >
                        Add Alias
                      </Button>
                    </div>
                    {complainantAliases.length > 0 && (
                      <div className="overflow-x-auto border border-slate-200 rounded">
                        <table className="w-full text-left text-xs bg-white">
                          <thead className="bg-slate-100 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-2 w-12">S.No.</th>
                              <th className="p-2">Alias Name</th>
                              <th className="p-2 w-16 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {complainantAliases.map((a, idx) => (
                              <tr key={a.id}>
                                <td className="p-2 font-bold text-slate-500">{idx + 1}</td>
                                <td className="p-2 font-semibold text-slate-800">{a.aliasName}</td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setComplainantAliases(complainantAliases.filter((_, i) => i !== idx))
                                    }
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 pt-1">
                    <input
                      type="checkbox"
                      checked={complainantSameAsVictim}
                      onChange={(e) => setComplainantSameAsVictim(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Complainant is also the Victim in this offence</span>
                  </label>
                </CardContent>
              </Card>
            )}

            {/* Subtab 3.2: Address */}
            {complainantSubtab === "address" && (
              <Card className="border-slate-200">
                <CardContent className="p-4 space-y-4 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase text-[11px] mb-2 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      Permanent Address (स्थाई पता)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-700 block">House / Flat No.</label>
                          <VoiceInputButton
                            onTranscript={(t) => setPermHouseNo(t)}
                            currentValue={permHouseNo}
                            fieldLabel="House No"
                            iconOnly={true}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="House No."
                          value={permHouseNo}
                          onChange={(e) => setPermHouseNo(e.target.value)}
                          className="w-full p-2 rounded border border-slate-300"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-700 block">Street / Gali</label>
                          <VoiceInputButton
                            onTranscript={(t) => setPermStreet(t)}
                            currentValue={permStreet}
                            fieldLabel="Street"
                            iconOnly={true}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Street Name"
                          value={permStreet}
                          onChange={(e) => setPermStreet(e.target.value)}
                          className="w-full p-2 rounded border border-slate-300"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-700 block">Colony / Area</label>
                          <VoiceInputButton
                            onTranscript={(t) => setPermColony(t)}
                            currentValue={permColony}
                            fieldLabel="Colony / Sector"
                            iconOnly={true}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Colony / Sector"
                          value={permColony}
                          onChange={(e) => setPermColony(e.target.value)}
                          className="w-full p-2 rounded border border-slate-300"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-700 block">Village / City *</label>
                          <VoiceInputButton
                            onTranscript={(t) => setPermCity(t)}
                            currentValue={permCity}
                            fieldLabel="Village / City"
                            iconOnly={true}
                          />
                        </div>
                        <input
                          type="text"
                          value={permCity}
                          onChange={(e) => setPermCity(e.target.value)}
                          className="w-full p-2 rounded border border-slate-300"
                          required
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-700 block">Tehsil / Sub-Division</label>
                          <VoiceInputButton
                            onTranscript={(t) => setPermTehsil(t)}
                            currentValue={permTehsil}
                            fieldLabel="Tehsil"
                            iconOnly={true}
                          />
                        </div>
                        <input
                          type="text"
                          value={permTehsil}
                          onChange={(e) => setPermTehsil(e.target.value)}
                          className="w-full p-2 rounded border border-slate-300"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-700 block">Police Station</label>
                          <VoiceInputButton
                            onTranscript={(t) => setPermPs(t)}
                            currentValue={permPs}
                            fieldLabel="Police Station"
                            iconOnly={true}
                          />
                        </div>
                        <input
                          type="text"
                          value={permPs}
                          onChange={(e) => setPermPs(e.target.value)}
                          className="w-full p-2 rounded border border-slate-300"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-700 block">District</label>
                          <VoiceInputButton
                            onTranscript={(t) => setPermDistrict(t)}
                            currentValue={permDistrict}
                            fieldLabel="District"
                            iconOnly={true}
                          />
                        </div>
                        <input
                          type="text"
                          value={permDistrict}
                          onChange={(e) => setPermDistrict(e.target.value)}
                          className="w-full p-2 rounded border border-slate-300"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-700 block">State</label>
                          <VoiceInputButton
                            onTranscript={(t) => setPermState(t)}
                            currentValue={permState}
                            fieldLabel="State"
                            iconOnly={true}
                          />
                        </div>
                        <input
                          type="text"
                          value={permState}
                          onChange={(e) => setPermState(e.target.value)}
                          className="w-full p-2 rounded border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Pincode</label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="6-digit pincode"
                          value={permPincode}
                          onChange={(e) => setPermPincode(e.target.value)}
                          className="w-full p-2 rounded border border-slate-300 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                      <input
                        type="checkbox"
                        checked={presentSameAsPerm}
                        onChange={(e) => setPresentSameAsPerm(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Present Address is same as Permanent Address</span>
                    </label>

                    {!presentSameAsPerm && (
                      <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                        <h5 className="font-bold text-slate-700 uppercase text-[10px]">Present Address Details</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px] text-slate-500 block">House / Flat</span>
                              <VoiceInputButton
                                onTranscript={(t) => setPresHouseNo(t)}
                                currentValue={presHouseNo}
                                fieldLabel="Present House No"
                                iconOnly={true}
                              />
                            </div>
                            <input
                              type="text"
                              value={presHouseNo}
                              onChange={(e) => setPresHouseNo(e.target.value)}
                              className="w-full p-1.5 rounded border border-slate-300 bg-white"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px] text-slate-500 block">Street</span>
                              <VoiceInputButton
                                onTranscript={(t) => setPresStreet(t)}
                                currentValue={presStreet}
                                fieldLabel="Present Street"
                                iconOnly={true}
                              />
                            </div>
                            <input
                              type="text"
                              value={presStreet}
                              onChange={(e) => setPresStreet(e.target.value)}
                              className="w-full p-1.5 rounded border border-slate-300 bg-white"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px] text-slate-500 block">City / Town</span>
                              <VoiceInputButton
                                onTranscript={(t) => setPresCity(t)}
                                currentValue={presCity}
                                fieldLabel="Present City"
                                iconOnly={true}
                              />
                            </div>
                            <input
                              type="text"
                              value={presCity}
                              onChange={(e) => setPresCity(e.target.value)}
                              className="w-full p-1.5 rounded border border-slate-300 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Subtab 3.3: Other Information & IDs */}
            {complainantSubtab === "other" && (
              <Card className="border-slate-200">
                <CardContent className="p-4 space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Occupation</label>
                      <select
                        value={complainantOccupation}
                        onChange={(e) => setComplainantOccupation(e.target.value)}
                        className="w-full p-2 rounded border border-slate-300"
                      >
                        <option value="Private Service">Private Service</option>
                        <option value="Government Employee">Government Employee</option>
                        <option value="Business / Trader">Business / Trader</option>
                        <option value="Farmer / Agriculture">Farmer / Agriculture</option>
                        <option value="Student">Student</option>
                        <option value="Homemaker">Homemaker</option>
                        <option value="Advocate / Legal">Advocate / Legal</option>
                        <option value="Doctor / Healthcare">Doctor / Healthcare</option>
                        <option value="Daily Wage / Worker">Daily Wage / Worker</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700 block">Nationality</label>
                        <VoiceInputButton
                          onTranscript={(t) => setComplainantNationality(t)}
                          currentValue={complainantNationality}
                          fieldLabel="Nationality"
                          iconOnly={true}
                        />
                      </div>
                      <input
                        type="text"
                        value={complainantNationality}
                        onChange={(e) => setComplainantNationality(e.target.value)}
                        className="w-full p-2 rounded border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Aadhaar (UID) Number</label>
                      <input
                        type="text"
                        maxLength={12}
                        placeholder="12-digit Aadhaar Number"
                        value={complainantUid}
                        onChange={(e) => setComplainantUid(e.target.value)}
                        className="w-full p-2 rounded border border-slate-300 font-mono"
                      />
                    </div>
                  </div>

                  {/* Passport Details */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800 uppercase text-[11px] block mb-2">
                      Passport Details (if applicable)
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] text-slate-500 block">Passport Number</span>
                          <VoiceInputButton
                            onTranscript={(t) => setPassportNumber(t)}
                            currentValue={passportNumber}
                            fieldLabel="Passport Number"
                            iconOnly={true}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. Z1234567"
                          value={passportNumber}
                          onChange={(e) => setPassportNumber(e.target.value)}
                          className="w-full p-1.5 rounded border border-slate-300 bg-white font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">Date of Issue</span>
                        <DatePickerDDMMYYYY
                          value={passportIssueDate}
                          onChange={(e) => setPassportIssueDate(e.target.value)}
                          placeholder="DD/MM/YYYY"
                          size="sm"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] text-slate-500 block">Place of Issue</span>
                          <VoiceInputButton
                            onTranscript={(t) => setPassportIssuePlace(t)}
                            currentValue={passportIssuePlace}
                            fieldLabel="Place of Issue"
                            iconOnly={true}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. Delhi"
                          value={passportIssuePlace}
                          onChange={(e) => setPassportIssuePlace(e.target.value)}
                          className="w-full p-1.5 rounded border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Identification Documents Repeatable Table */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                    <label className="font-bold text-slate-800 block text-[11px] uppercase">
                      Identification Documents
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                      <div className="md:col-span-5">
                        <span className="text-[10px] text-slate-500 block mb-0.5">ID Type</span>
                        <select
                          value={tempIdType}
                          onChange={(e) => setTempIdType(e.target.value)}
                          className="w-full p-1.5 rounded border border-slate-300 bg-white"
                        >
                          {IDENTIFICATION_TYPE_OPTIONS.map((idType) => (
                            <option key={idType} value={idType}>
                              {idType}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-5">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] text-slate-500 block">ID Number</span>
                          <VoiceInputButton
                            onTranscript={(t) => setTempIdNumber(t)}
                            currentValue={tempIdNumber}
                            fieldLabel="ID Number"
                            iconOnly={true}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. DL-04201100234"
                          value={tempIdNumber}
                          onChange={(e) => setTempIdNumber(e.target.value)}
                          className="w-full p-1.5 rounded border border-slate-300 bg-white font-mono"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddIdentification}
                          className="w-full text-xs bg-slate-800 text-white"
                        >
                          Add ID
                        </Button>
                      </div>
                    </div>

                    {identificationsList.length > 0 && (
                      <div className="overflow-x-auto border border-slate-200 rounded">
                        <table className="w-full text-left text-xs bg-white">
                          <thead className="bg-slate-100 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-2 w-12">S.No.</th>
                              <th className="p-2">ID Type</th>
                              <th className="p-2">ID Number</th>
                              <th className="p-2 w-16 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {identificationsList.map((idItem, idx) => (
                              <tr key={idItem.id}>
                                <td className="p-2 font-bold text-slate-500">{idx + 1}</td>
                                <td className="p-2 font-semibold">{idItem.idType}</td>
                                <td className="p-2 font-mono">{idItem.idNumber}</td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setIdentificationsList(identificationsList.filter((_, i) => i !== idx))
                                    }
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: FIR CONTENT (10,000 CHAR LIMIT & COUNTER - NO VOICE BUTTONS) */}
        {/* ========================================================================= */}
        {activeTab === "fir_content" && (
          <div className="space-y-4 animate-in fade-in-30">
            <Card className="border-slate-200">
              <CardHeader className="py-2.5 px-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  FIR Contents / Tehreer (तहरीर) <span className="text-red-600">*</span>
                </CardTitle>
                <div className="flex items-center gap-3">
                  <VoiceInputButton
                    onTranscript={(t) =>
                      setFirContentText((prev) => (prev ? prev + " " + t : t))
                    }
                    currentValue={firContentText}
                    fieldLabel="FIR Contents / Tehreer"
                  />
                  <span
                    className={`text-[11px] font-mono font-bold ${
                      firContentText.length > 9500 ? "text-red-600" : "text-slate-500"
                    }`}
                  >
                    {firContentText.length} / 10,000 characters
                  </span>
                  {firContentText.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFirContentText("")}
                      className="text-[11px] text-red-600 hover:underline font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                <div>
                  <textarea
                    rows={12}
                    maxLength={10000}
                    placeholder="Enter verbatim complaint statement / written complaint contents as received from complainant. FIR content is statutory and mandatory u/s 173 BNSS."
                    value={firContentText}
                    onChange={(e) => setFirContentText(e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-300 font-serif leading-relaxed text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {errors.fir_content && (
                    <p className="text-red-600 text-[11px] font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.fir_content}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 block">
                      Brief Facts / Case Summary (For Police Records)
                    </label>
                    <div className="flex items-center gap-2">
                      <VoiceInputButton
                        onTranscript={(t) =>
                          setBriefFacts((prev) => (prev ? prev + " " + t : t))
                        }
                        currentValue={briefFacts}
                        fieldLabel="Brief Facts"
                        iconOnly={true}
                      />
                      <span className="text-[10px] font-mono text-slate-400">
                        {briefFacts.length} chars
                      </span>
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Short summary of facts for investigation assignment and monitoring"
                    value={briefFacts}
                    onChange={(e) => setBriefFacts(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 block">
                      Reasons for Delay in reporting by Complainant / Informant (Printed Section 8)
                    </label>
                    <VoiceInputButton
                      onTranscript={(t) =>
                        setReasonsForDelay((prev) => (prev ? prev + " " + t : t))
                      }
                      currentValue={reasonsForDelay}
                      fieldLabel="Reasons for Delay"
                      iconOnly={true}
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="If any delay occurred in reporting, record the specific reason here (e.g. hospitalization, medical examination, threat by accused, delay in discovering theft)"
                    value={reasonsForDelay}
                    onChange={(e) => setReasonsForDelay(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: ACTION TAKEN */}
        {/* ========================================================================= */}
        {activeTab === "action_taken" && (
          <div className="space-y-4 animate-in fade-in-30">
            <Card className="border-slate-200">
              <CardHeader className="py-2.5 px-4 bg-slate-50 border-b border-slate-200">
                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  Statutory Action Taken u/s 173 BNSS
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                {/* Secret / Invisible FIR Toggle */}
                <div className="flex items-center justify-between p-3 bg-purple-50/70 border border-purple-200 rounded-lg">
                  <div>
                    <span className="font-bold text-purple-900 block">Do you need to keep FIR Secret / Invisible?</span>
                    <span className="text-[11px] text-purple-700">
                      For POCSO, sexual offences, national security, or sensitive organized crime
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="secretFir"
                        checked={isSecretFir}
                        onChange={() => setIsSecretFir(true)}
                        className="text-purple-600"
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="secretFir"
                        checked={!isSecretFir}
                        onChange={() => setIsSecretFir(false)}
                        className="text-purple-600"
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                {/* Action Taken Options */}
                <div>
                  <label className="font-bold text-slate-700 block mb-2">
                    Action Taken by Station House Officer (SHO)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {actionTakenList.map((opt) => (
                      <label
                        key={opt}
                        className={`flex items-center gap-2.5 cursor-pointer p-3 rounded-lg border transition-all ${
                          actionType === opt
                            ? "border-blue-500 bg-blue-50/50 text-blue-950 font-bold shadow-xs"
                            : "border-slate-200 hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <input
                          type="radio"
                          name="actionType"
                          value={opt}
                          checked={actionType === opt}
                          onChange={() => setActionType(opt)}
                          className="text-blue-600"
                        />
                        <span className="text-xs">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* IO Assignment Box */}
                {actionType === "Investigation/Assign IO" && (
                  <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-200 space-y-3 animate-in fade-in-30">
                    <label className="font-bold text-blue-900 block text-xs">
                      Select Investigating Officer (IO)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <select
                          value={assignedIoId}
                          onChange={(e) => setAssignedIoId(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-blue-300 bg-white font-semibold text-xs"
                        >
                          {MOCK_ENQUIRY_OFFICERS.map((eo) => (
                            <option key={eo.id} value={eo.id}>
                              {eo.name} ({eo.rank}) - PNO: {eo.pno} [{eo.activeCases} Active Cases]
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-slate-600 font-medium">Directions / Guidelines to IO</span>
                          <VoiceInputButton
                            onTranscript={(t) => setAssignedDirections((prev) => (prev ? prev + " " + t : t))}
                            currentValue={assignedDirections}
                            fieldLabel="Directions to IO"
                            iconOnly={true}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Directions / Guidelines to IO"
                          value={assignedDirections}
                          onChange={(e) => setAssignedDirections(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-blue-300 bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Refused Reason Box */}
                {actionType === "Refused" && (
                  <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 space-y-2 animate-in fade-in-30">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-amber-900 block text-xs">
                        Reason for Refusal of Investigation u/s 173(1) BNSS
                      </label>
                      <VoiceInputButton
                        onTranscript={(t) => setRefusedReason((prev) => (prev ? prev + " " + t : t))}
                        currentValue={refusedReason}
                        fieldLabel="Reason for Refusal"
                        iconOnly={true}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Offence purely of non-cognizable civil dispute / No sufficient ground..."
                      value={refusedReason}
                      onChange={(e) => setRefusedReason(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-amber-300 bg-white text-xs"
                    />
                  </div>
                )}

                {/* Transferred PS Details Box */}
                {actionType === "Transferred" && (
                  <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 space-y-2 animate-in fade-in-30">
                    <label className="font-bold text-amber-900 block text-xs">
                      Transferred Police Station &amp; District (Zero FIR)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-500">Transferred Police Station</span>
                          <VoiceInputButton
                            onTranscript={(t) => setTransferredPs(t)}
                            currentValue={transferredPs}
                            fieldLabel="Transferred Police Station"
                            iconOnly={true}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Transferred Police Station Name"
                          value={transferredPs}
                          onChange={(e) => setTransferredPs(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-amber-300 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-500">Transferred District</span>
                          <VoiceInputButton
                            onTranscript={(t) => setTransferredDistrict(t)}
                            currentValue={transferredDistrict}
                            fieldLabel="Transferred District"
                            iconOnly={true}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Transferred District"
                          value={transferredDistrict}
                          onChange={(e) => setTransferredDistrict(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-amber-300 bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Department Notification Table (Printed Section 13) */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                  <span className="font-bold text-slate-800 uppercase text-[11px] block">
                    Department / Agency Dispatch Notification (Printed Section 13)
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                    <div className="md:col-span-6">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] text-slate-500 block">Department / Authority Name</span>
                        <VoiceInputButton
                          onTranscript={(t) => setTempDeptName(t)}
                          currentValue={tempDeptName}
                          fieldLabel="Department Name"
                          iconOnly={true}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. District Magistrate / Chief Medical Officer"
                        value={tempDeptName}
                        onChange={(e) => setTempDeptName(e.target.value)}
                        className="w-full p-1.5 rounded border border-slate-300 bg-white text-xs"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <span className="text-[10px] text-slate-500 block mb-0.5">Email Address</span>
                      <input
                        type="email"
                        placeholder="e.g. dm.gurugram@hry.gov.in"
                        value={tempDeptEmail}
                        onChange={(e) => setTempDeptEmail(e.target.value)}
                        className="w-full p-1.5 rounded border border-slate-300 bg-white text-xs"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddDepartment}
                        className="w-full bg-[#0b192c] text-white text-xs h-[30px]"
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {departmentList.length > 0 && (
                    <div className="overflow-x-auto border border-slate-200 rounded">
                      <table className="w-full text-left text-xs bg-white">
                        <thead className="bg-slate-100 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2 w-12">S.No.</th>
                            <th className="p-2">Department Name</th>
                            <th className="p-2">Official Email</th>
                            <th className="p-2 w-16 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {departmentList.map((dept, idx) => (
                            <tr key={dept.id}>
                              <td className="p-2 font-bold text-slate-500">{idx + 1}</td>
                              <td className="p-2 font-semibold text-slate-800">{dept.departmentName}</td>
                              <td className="p-2 font-mono text-slate-600">{dept.departmentEmail || "—"}</td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => setDepartmentList(departmentList.filter((_, i) => i !== idx))}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Inquest, Court Dispatch & Statutory Checks */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Inquest Report / U.D. Case No. (if any)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. INQ/2026/001"
                      value={inquestReportNo}
                      onChange={(e) => setInquestReportNo(e.target.value)}
                      className="w-full p-2 rounded border border-slate-300 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Court Dispatch Date &amp; Time
                    </label>
                    <input
                      type="datetime-local"
                      value={courtDispatchDateTime}
                      onChange={(e) => setCourtDispatchDateTime(e.target.value)}
                      className="w-full p-2 rounded border border-slate-300 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5 pt-4">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={roacConfirmed}
                        onChange={(e) => setRoacConfirmed(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Read Over and Admitted Correct (R.O.A.C.)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={freeCopyGiven}
                        onChange={(e) => setFreeCopyGiven(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Free Copy given to Complainant u/s 173(2) BNSS</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: VICTIM INFORMATION (DIRECT INLINE ENTRY & RECORDED LIST) */}
        {/* ========================================================================= */}
        {activeTab === "victim_info" && (
          <div className="space-y-4 animate-in fade-in-30">
            <InlineVictimSection
              victimsList={victimsList}
              onAddVictim={handleAddVictim}
              onUpdateVictim={handleUpdateVictim}
              onDeleteVictim={handleDeleteVictim}
              onLinkComplainantAsVictim={handleLinkComplainantAsVictim}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: ACCUSED (DIRECT INLINE ENTRY & RECORDED LIST) */}
        {/* ========================================================================= */}
        {activeTab === "accused" && (
          <div className="space-y-4 animate-in fade-in-30">
            <InlineAccusedSection
              accusedList={accusedList}
              isAccusedKnown={isAccusedKnown}
              setIsAccusedKnown={setIsAccusedKnown}
              accusedMoreThan={accusedMoreThan}
              setAccusedMoreThan={setAccusedMoreThan}
              onAddAccused={handleAddAccused}
              onUpdateAccused={handleUpdateAccused}
              onDeleteAccused={handleDeleteAccused}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: PROPERTY OF INTEREST (EXCLUDES NATURE OF PROPERTY) */}
        {/* ========================================================================= */}
        {activeTab === "property" && (
          <div className="space-y-4 animate-in fade-in-30">
            <Card className="border-slate-200">
              <CardHeader className="py-2.5 px-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-600" />
                  Particulars of Properties of Interest (Printed Sections 9 &amp; 10)
                </CardTitle>
                <div className="font-mono text-xs font-bold text-red-900 bg-red-50 border border-red-200 px-2.5 py-1 rounded">
                  Total Value: ₹{propertiesList.reduce((acc, p) => acc + (Number(p.estimatedValue) || 0), 0).toLocaleString("en-IN")}/-
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                {/* Properties Table - Without Nature of Property Column */}
                {propertiesList.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 w-12">S.No.</th>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5">Description</th>
                          <th className="p-2.5 text-right">Est. Value (₹)</th>
                          <th className="p-2.5 w-16 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {propertiesList.map((prop, idx) => (
                          <tr key={prop.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-500">{prop.srNo || idx + 1}</td>
                            <td className="p-2.5 font-semibold text-slate-900">{prop.propertyCategory}</td>
                            <td className="p-2.5 font-medium text-slate-700">{prop.propertyType}</td>
                            <td className="p-2.5 text-slate-700">{prop.description}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-red-900">
                              ₹{Number(prop.estimatedValue || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => setPropertiesList(propertiesList.filter((_, i) => i !== idx))}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400 bg-slate-50/50 rounded border border-dashed border-slate-200">
                    No property added. If any property was involved, stolen, or recovered, add particulars below.
                  </div>
                )}

                {/* Add Property Form - Dependent Type Mapping, No Nature of Property */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                  <span className="font-bold text-slate-800 block text-[11px] uppercase">
                    Add Property Particulars
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">Property Category</span>
                      <select
                        value={tempPropCategory}
                        onChange={(e) => setTempPropCategory(e.target.value)}
                        className="w-full p-2 rounded border border-slate-300 bg-white font-medium text-xs"
                      >
                        {PROPERTY_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">Property Type</span>
                      <select
                        value={tempPropType}
                        onChange={(e) => setTempPropType(e.target.value)}
                        className="w-full p-2 rounded border border-slate-300 bg-white font-medium text-xs"
                      >
                        {(PROPERTY_TYPES_BY_CATEGORY[tempPropCategory] || []).map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">Estimated Value (₹)</span>
                      <input
                        type="number"
                        placeholder="e.g. 45000"
                        value={tempPropValue}
                        onChange={(e) => setTempPropValue(e.target.value)}
                        className="w-full p-2 rounded border border-slate-300 bg-white font-mono text-xs"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] text-slate-500 block">
                          Description (Make, Model, Serial, Specs, Registration)
                        </span>
                        <VoiceInputButton
                          onTranscript={(t) => setTempPropDescription((prev) => (prev ? prev + " " + t : t))}
                          currentValue={tempPropDescription}
                          fieldLabel="Property Description"
                          iconOnly={true}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Samsung Galaxy S23 Ultra, IMEI 3589410291..., Black Color"
                        value={tempPropDescription}
                        onChange={(e) => setTempPropDescription(e.target.value)}
                        className="w-full p-2 rounded border border-slate-300 bg-white text-xs"
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddProperty}
                        className="w-full bg-[#0b192c] hover:bg-slate-800 text-white text-xs h-[38px]"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Property
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 9: HURT CASE DETAIL (NON-NEGATIVE INTEGERS VALIDATION) */}
        {/* ========================================================================= */}
        {activeTab === "hurt_detail" && (
          <div className="space-y-4 animate-in fade-in-30">
            <Card className="border-slate-200">
              <CardHeader className="py-2.5 px-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-600" />
                  Hurt &amp; Injury Details
                </CardTitle>
                <button
                  type="button"
                  onClick={() => {
                    setCountDeceased("0");
                    setCountSeriouslyHurt("0");
                    setCountSimpleHurt("0");
                    setCountNonInjured("0");
                    setInjuryDescription("");
                  }}
                  className="text-[11px] text-red-600 hover:underline font-semibold"
                >
                  Clear Hurt Details
                </button>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                {/* Counts - Validated non-negative integers */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="text-[11px] font-bold text-red-900 block">Deceased Count</label>
                    <input
                      type="number"
                      min={0}
                      value={countDeceased}
                      onChange={(e) => handleHurtCountChange(setCountDeceased, e.target.value)}
                      className="w-full mt-1 p-2 rounded border border-slate-300 font-mono text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-amber-900 block">Seriously Hurt</label>
                    <input
                      type="number"
                      min={0}
                      value={countSeriouslyHurt}
                      onChange={(e) => handleHurtCountChange(setCountSeriouslyHurt, e.target.value)}
                      className="w-full mt-1 p-2 rounded border border-slate-300 font-mono text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-blue-900 block">Simple Hurt</label>
                    <input
                      type="number"
                      min={0}
                      value={countSimpleHurt}
                      onChange={(e) => handleHurtCountChange(setCountSimpleHurt, e.target.value)}
                      className="w-full mt-1 p-2 rounded border border-slate-300 font-mono text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block">Non-Injured</label>
                    <input
                      type="number"
                      min={0}
                      value={countNonInjured}
                      onChange={(e) => handleHurtCountChange(setCountNonInjured, e.target.value)}
                      className="w-full mt-1 p-2 rounded border border-slate-300 font-mono text-center font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 block">Injury Description</label>
                      <VoiceInputButton
                        onTranscript={(t) => setInjuryDescription((prev) => (prev ? prev + " " + t : t))}
                        currentValue={injuryDescription}
                        fieldLabel="Injury Description"
                        iconOnly={true}
                      />
                    </div>
                    <textarea
                      rows={4}
                      placeholder="Details of physical injuries, wounds, fractures, MLR number, Hospital admitted"
                      value={injuryDescription}
                      onChange={(e) => setInjuryDescription(e.target.value)}
                      className="w-full p-2.5 rounded border border-slate-300 text-xs"
                    />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Means / Weapon of Causing Injury
                      </label>
                      <select
                        value={weaponUsed}
                        onChange={(e) => setWeaponUsed(e.target.value)}
                        className="w-full p-2.5 rounded border border-slate-300 text-xs mb-3"
                      >
                        <option value="Physical assault / Blunt">Physical assault / Blunt object</option>
                        <option value="Sharp weapon / Knife / Dagger">Sharp weapon / Knife / Dagger</option>
                        <option value="Firearm / Gun">Firearm / Gun</option>
                        <option value="Vehicular impact / Accident">Vehicular impact / Accident</option>
                        <option value="Poison / Chemical">Poison / Chemical</option>
                        <option value="Fire / Burns">Fire / Burns</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                      <span className="font-bold text-slate-800">Whether CCTV / Video Footage Available?</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 cursor-pointer font-bold">
                          <input
                            type="radio"
                            name="footage"
                            checked={videoFootageAvailable}
                            onChange={() => setVideoFootageAvailable(true)}
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer font-bold">
                          <input
                            type="radio"
                            name="footage"
                            checked={!videoFootageAvailable}
                            onChange={() => setVideoFootageAvailable(false)}
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 10: SIGNATURE (CANVAS + HARDWARE STATUS - EXCLUDES EXTRA PDF FIELDS) */}
        {/* ========================================================================= */}
        {activeTab === "signature" && (
          <div className="space-y-4 animate-in fade-in-30">
            <Card className="border-slate-200">
              <CardHeader className="py-2.5 px-4 bg-slate-50 border-b border-slate-200">
                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-blue-600" />
                  Signature &amp; Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Complainant Signature Note */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <span className="font-bold text-slate-800 block text-xs uppercase">
                      Informant / Complainant Verification
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Physical signature / thumb impression captured and verified on original Tehreer sheet.
                    </p>
                    <div className="h-36 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center bg-white p-2">
                      <CheckCircle2 className="w-7 h-7 text-emerald-600 mb-1" />
                      <span className="text-xs font-semibold text-slate-700">
                        {complainantFirstName} {complainantLastName || ""}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Verified via Grievance Portal / Written Complaint Endorsement
                      </span>
                    </div>
                  </div>

                  {/* Officer Signature Canvas & Details */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 block text-xs uppercase">
                        Station House Officer (SHO) Digital Signature Pad
                      </span>
                      <button
                        type="button"
                        onClick={handleClearSignature}
                        className="text-[11px] text-red-600 hover:underline font-semibold"
                      >
                        Clear Canvas
                      </button>
                    </div>

                    {/* Hardware Offline Indicator */}
                    <div className="flex items-center justify-between p-2 rounded bg-amber-50 border border-amber-200 text-[11px]">
                      <div className="flex items-center gap-1.5 text-amber-900 font-medium">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <span>Hardware Digitizer Pad: <strong>OFFLINE</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHardwareOfflineNotice(!hardwareOfflineNotice)}
                        className="text-[10px] text-amber-800 underline font-semibold"
                      >
                        Connect / Retry
                      </button>
                    </div>

                    {hardwareOfflineNotice && (
                      <div className="text-[10px] text-amber-800 bg-amber-100/60 p-2 rounded border border-amber-200">
                        External USB signature pad device not detected on COM port. Please use on-screen canvas pad below or touchscreen stylus.
                      </div>
                    )}

                    {/* Canvas Signature Pad */}
                    <div className="border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                      <canvas
                        ref={canvasRef}
                        width={460}
                        height={120}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-28 cursor-crosshair block bg-white"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 text-center">
                      Draw signature above using mouse, touchpad, or touchscreen stylus
                    </p>

                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Officer Name</span>
                        <input
                          type="text"
                          value={officerName}
                          onChange={(e) => setOfficerName(e.target.value)}
                          className="w-full p-2 rounded border border-slate-300 bg-white font-semibold text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Rank</span>
                          <input
                            type="text"
                            value={officerRank}
                            onChange={(e) => setOfficerRank(e.target.value)}
                            className="w-full p-2 rounded border border-slate-300 bg-white text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Belt / PNO No.</span>
                          <input
                            type="text"
                            value={officerNumber}
                            onChange={(e) => setOfficerNumber(e.target.value)}
                            className="w-full p-2 rounded border border-slate-300 bg-white font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* BOTTOM NAVIGATION FOOTER */}
        <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-xs border-t border-slate-200 p-3.5 rounded-xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentTabIndex === 0}
              onClick={handlePrevTab}
              className="text-xs flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Previous Tab
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentTabIndex === TAB_CONFIG.length - 1}
              onClick={handleNextTab}
              className="text-xs flex items-center gap-1"
            >
              Next Tab
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[11px] font-semibold text-slate-400 ml-2">
              Step {currentTabIndex + 1} of {TAB_CONFIG.length}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              className="text-xs text-slate-700 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-blue-600" />
              Save Draft
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setRegisteredFir(buildCurrentFirItem());
                setShowReceiptModal(true);
              }}
              className="text-xs text-slate-700 flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-purple-600" />
              Preview (IIF-I)
            </Button>

            <Button
              type="submit"
              disabled={submitting}
              className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md px-4"
            >
              <Scale className="w-3.5 h-3.5" />
              {submitting ? "Registering..." : "Register FIR"}
            </Button>
          </div>
        </div>
      </form>

      {/* ========================================================================= */}
      {/* DIALOG COMPONENTS */}
      {/* ========================================================================= */}

      {/* 1. GD Lookup Dialog */}
      <GDLookupDialog
        isOpen={showGDLookupDialog}
        onClose={() => setShowGDLookupDialog(false)}
        onSelectEntry={(entry: GDLookupResult) => {
          setGdEntryNumber(entry.diaryNumber);
          setGdDate(entry.entryDate);
          setGdTime(entry.entryTime);
          if (entry.subject) {
            setActRemarks((prev) =>
              prev ? `${prev}; GD Ref: ${entry.subject}` : `GD Ref: ${entry.subject}`
            );
          }
        }}
      />


      {/* 6. Action Confirmation Dialog (Clear All, Discard/Close, Register FIR) */}
      <ConfirmActionDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmLabel={confirmConfig.confirmLabel}
        cancelLabel={confirmConfig.cancelLabel}
        variant={confirmConfig.variant}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Official IIF-I Modal */}
      {showReceiptModal && (
        <FIRReceiptModal
          fir={registeredFir}
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            if (registeredFir && registeredFir.id && !registeredFir.id.startsWith("fir-temp-")) {
              router.push("/fir");
            }
          }}
        />
      )}
    </div>
  );
}

export default function RegisterFIRPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto p-12 text-center text-slate-400 text-sm">
          Loading FIR Registration Form...
        </div>
      }
    >
      <RegisterFIRForm />
    </Suspense>
  );
}
