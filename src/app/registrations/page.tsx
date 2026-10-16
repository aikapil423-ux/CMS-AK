"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ClipboardList,
  Search,
  Plus,
  Eye,
  Printer,
  Trash2,
  Edit2,
  Edit3,
  ChevronDown,
  Check,
  X,
  MapPin,
  Calendar,
  Phone,
  User,
  Shield,
  Tag,
  CheckCircle2,
  Clock,
  Sparkles,
  Camera,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  RegistrationEntry,
  RegistrationType,
  RegistrationStatus,
} from "@/types/registrations";
import {
  RegistrationService,
  hydrateFromIndexedDB,
  sortEntriesNewestFirst,
} from "@/services/registrationService";
import { UidbRegistrationModal } from "@/components/registrations/UidbRegistrationModal";
import { UidbPdfPreviewModal } from "@/components/registrations/UidbPdfPreviewModal";
import { UidbFormData, DEFAULT_UIDB_FORM, SAMPLE_UIDB_RECORD } from "@/types/uidb";
import { RegisterLostPropertyModal } from "@/components/lost-property/RegisterLostPropertyModal";
import { LostPropertyPreviewModal } from "@/components/lost-property/LostPropertyPreviewModal";
import { lostPropertyService } from "@/services/lostPropertyService";
import { LostPropertyRecord } from "@/types/lostProperty";
import { RegisterMissingPersonModal } from "@/components/missing-person/RegisterMissingPersonModal";
import { MissingPersonPreviewModal } from "@/components/missing-person/MissingPersonPreviewModal";
import { missingPersonService } from "@/services/missingPersonService";
import { MissingPersonRecord } from "@/types/missingPerson";

const STATUS_OPTIONS_BY_TYPE: Record<RegistrationType, RegistrationStatus[]> = {
  UIDB: ["OPEN", "TRACED", "CLOSED"],
  MISSING_PERSON: ["OPEN", "TRACED", "CLOSED"],
  LOST_PROPERTY: ["OPEN", "TRACED", "CLOSED"],
  MISSING_CATTLE: ["OPEN", "RESTORED", "CLOSED"],
};

function RegistrationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const { t, isHindi } = useLanguage();

  const [activeTab, setActiveTab] = useState<RegistrationType>("UIDB");
  const [entries, setEntries] = useState<RegistrationEntry[]>(() => {
    if (typeof window !== "undefined") {
      try {
        return RegistrationService.getEntries();
      } catch {
        return [];
      }
    }
    return [];
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [recentlySavedId, setRecentlySavedId] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<{
    regNumber: string;
    type: RegistrationType;
    message: string;
    entry: RegistrationEntry;
  } | null>(null);

  // Status update interactive menu state & feedback banner
  const [activeStatusMenuId, setActiveStatusMenuId] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<{
    regNumber: string;
    type: RegistrationType;
    oldStatus: RegistrationStatus;
    newStatus: RegistrationStatus;
  } | null>(null);

  // Comprehensive UIDB CCTNS Form and PDF states
  const [isUidbModalOpen, setIsUidbModalOpen] = useState(false);
  const [uidbEditData, setUidbEditData] = useState<Partial<UidbFormData> | null>(null);
  const [isUidbPdfOpen, setIsUidbPdfOpen] = useState(false);
  const [uidbPdfData, setUidbPdfData] = useState<UidbFormData | null>(null);
  const [isPendingFinalSubmit, setIsPendingFinalSubmit] = useState(false);

  // Comprehensive Lost Property CCTNS Form and PDF states
  const [isLostPropertyModalOpen, setIsLostPropertyModalOpen] = useState(false);
  const [lostPropertyEditRecord, setLostPropertyEditRecord] = useState<LostPropertyRecord | null>(null);
  const [isLostPropertyPdfOpen, setIsLostPropertyPdfOpen] = useState(false);
  const [lostPropertyPdfData, setLostPropertyPdfData] = useState<Partial<LostPropertyRecord> | null>(null);

  // Comprehensive Missing Person CCTNS Form and PDF states
  const [isMissingPersonModalOpen, setIsMissingPersonModalOpen] = useState(false);
  const [missingPersonEditRecord, setMissingPersonEditRecord] = useState<MissingPersonRecord | null>(null);
  const [isMissingPersonPdfOpen, setIsMissingPersonPdfOpen] = useState(false);
  const [missingPersonPdfData, setMissingPersonPdfData] = useState<Partial<MissingPersonRecord> | null>(null);

  // Other categories modals state (null if none)
  const [activeModalType, setActiveModalType] = useState<RegistrationType | null>(null);
  const [editingEntry, setEditingEntry] = useState<RegistrationEntry | null>(null);
  const [viewSlipEntry, setViewSlipEntry] = useState<RegistrationEntry | null>(null);

  // Form input state
  const [formData, setFormData] = useState<Partial<RegistrationEntry>>({});

  // Sync tab from URL query param if present
  useEffect(() => {
    const tabParam = searchParams.get("tab")?.toUpperCase();
    if (tabParam === "UIDB") setActiveTab("UIDB");
    else if (tabParam === "MISSING_PERSON" || tabParam === "MISSING-PERSON")
      setActiveTab("MISSING_PERSON");
    else if (tabParam === "MISSING_CATTLE" || tabParam === "MISSING-CATTLE")
      setActiveTab("MISSING_CATTLE");
    else if (tabParam === "LOST_PROPERTY" || tabParam === "LOST-PROPERTY")
      setActiveTab("LOST_PROPERTY");
  }, [searchParams]);

  // Load entries from service & IndexedDB, merging and sorting newest first so refreshed records NEVER disappear
  const loadData = async () => {
    const localData = RegistrationService.getEntries();
    setEntries(sortEntriesNewestFirst(localData));
    try {
      const idbList = await hydrateFromIndexedDB();
      if (idbList && idbList.length > 0) {
        const map = new Map<string, RegistrationEntry>();
        for (const item of idbList) {
          if (item.id) map.set(item.id, item);
        }
        for (const item of localData) {
          const existing = map.get(item.id);
          if (existing && existing.photoUrl && existing.photoUrl.length > (item.photoUrl?.length || 0)) {
            map.set(item.id, { ...item, photoUrl: existing.photoUrl, photos: existing.photos || item.photos });
          } else {
            map.set(item.id, { ...existing, ...item });
          }
        }
        const merged = sortEntriesNewestFirst(Array.from(map.values()));
        setEntries(merged);
        RegistrationService.setAllEntries(merged);
      }
    } catch (err) {
      console.warn("Hydration from IndexedDB failed, using memory/localStorage entries", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter entries for active tab + search query + status
  const currentTabEntries = useMemo(() => {
    return entries.filter((e) => e.type === activeTab);
  }, [entries, activeTab]);

  const filteredEntries = useMemo(() => {
    return currentTabEntries.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchText = [
        item.regNumber,
        item.personName,
        item.ownerName,
        item.contactPerson,
        item.foundLocation,
        item.missingFrom,
        item.lostLocation,
        item.identifyingMarks,
        item.clothingDetails,
        item.propertyType,
        item.cattleType,
        item.brandOrMake,
        item.officerName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchText.includes(q);
    });
  }, [currentTabEntries, statusFilter, searchQuery]);

  // Counts for each tab badge
  const counts = useMemo(() => {
    return {
      UIDB: entries.filter((e) => e.type === "UIDB").length,
      MISSING_PERSON: entries.filter((e) => e.type === "MISSING_PERSON").length,
      MISSING_CATTLE: entries.filter((e) => e.type === "MISSING_CATTLE").length,
      LOST_PROPERTY: entries.filter((e) => e.type === "LOST_PROPERTY").length,
    };
  }, [entries]);

  // Switch tab handler
  const handleTabChange = (type: RegistrationType) => {
    setActiveTab(type);
    setSearchQuery("");
    setStatusFilter("ALL");
  };

  // Convert RegistrationEntry to UidbFormData for modal and PDF
  const convertEntryToUidbForm = (entry: RegistrationEntry): UidbFormData => {
    if (entry.fullUidbData) {
      return {
        ...entry.fullUidbData,
        photoUrl: entry.photoUrl || entry.fullUidbData.photoUrl,
      };
    }

    const photosList = entry.photos && entry.photos.length > 0
      ? entry.photos
      : entry.photoUrl
      ? [
          {
            id: `ph_${entry.id}`,
            fileName: "Deceased_Front.jpg",
            fileType: "Photograph",
            fileSubType: "Front View" as const,
            fileDescription: "Front face photograph for inquest circular",
            dataUrl: entry.photoUrl,
            uploadedAt: entry.date,
          },
        ]
      : SAMPLE_UIDB_RECORD.photos;

    return {
      ...SAMPLE_UIDB_RECORD,
      id: entry.id,
      regNumber: entry.regNumber || "0003/2019",
      date: entry.date || "2019-04-22",
      time: entry.time || "15:19",
      year: entry.date ? entry.date.split("-")[0] : "2019",
      state: "HARYANA",
      district: entry.district || "PANCHKULA",
      stationName: entry.stationName || "PANCHKULA SECTOR-5",
      inquestReportPreparedBy: entry.officerName || "Lalit Kumar",
      officerName: entry.officerName || "Lalit Kumar (I (Inspector))-53175",
      gender: entry.gender || "Male",
      placeWhereFound: entry.foundLocation || "Near Bridge Culvert, NH-22, Panchkula",
      marksTattooMarks: entry.identifyingMarks || "OM tattoo on right forearm",
      clothesOuterTop: entry.clothingDetails || "Dark Blue Full Sleeve Shirt",
      inquestNumber: entry.inquestNumber || "UD/174-BNSS/09",
      status: entry.status || "OPEN",
      photoUrl: entry.photoUrl,
      photos: photosList,
      createdAt: entry.createdAt || new Date().toISOString(),
    };
  };

  // Convert RegistrationEntry to LostPropertyRecord for statutory modal and preview
  const convertEntryToLostPropertyRecord = (
    entry: RegistrationEntry
  ): LostPropertyRecord => {
    const existing =
      lostPropertyService.getRecordByRegNumber(entry.regNumber) ||
      lostPropertyService.getRecordById(entry.id);
    if (existing) return existing;

    const parts = entry.ownerName
      ? entry.ownerName.trim().split(" ")
      : ["raju", "Singh"];
    const firstName = parts[0] || "raju";
    const lastName = parts.slice(1).join(" ") || "Singh";

    return {
      id: entry.id,
      registrationNumber: entry.regNumber || "0002/2019",
      registrationYear: entry.regNumber?.includes("/")
        ? entry.regNumber.split("/")[1]
        : "2019",
      createdAt: entry.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "UNDER_ENQUIRY",
      gdNumber: "003",
      gdDateTime: `${entry.date || "22/04/2019"}, ${entry.time || "11:33"}`,
      dateOfPropertyMissing: entry.date || "2019-04-22",
      timeOfPropertyMissing: entry.time || "11:30",
      district: entry.district || "PANCHKULA",
      year: "2019",
      placeFromWhereMissing: entry.lostLocation || "Bus stand PKL",
      policeStation: entry.stationName || "PANCHKULA SECTOR-5",
      properties: [
        {
          id: `prop_${entry.id}`,
          category: "ELECTRICAL AND ELECTRONIC GOODS",
          subType: entry.propertyType || "MOBILE PHONE",
          estimatedValue: parseInt(
            entry.approxValue?.replace(/[^\d]/g, "") || "12000",
            10
          ),
          idType: "IMEI NO.",
          identificationNumbers: entry.identifyingNumber
            ? [
                entry.identifyingNumber.replace(
                  /^(IMEI|ID|IMEI NO\.)[:\s]*/i,
                  ""
                ),
              ]
            : ["864920048192031"],
          quantity: 1,
          makeManufacturer: entry.brandOrMake || "Samsung",
          remarks:
            entry.remarks ||
            "Samsung Galaxy Smartphone Black colour with Jio SIM inserted.",
        },
      ],
      uid: "8910-2391-4491",
      firstName,
      middleName: "",
      lastName,
      gender: (entry.gender as any) || "Male",
      occupation: "Private Service",
      relationType: "Father",
      relativeName: entry.fatherOrHusbandName || "Shyam Singh",
      mobileNumbers: entry.ownerPhone
        ? [entry.ownerPhone]
        : ["+91 9812033441"],
      dob: "1994-08-15",
      yearOfBirth: "1994",
      ageYears: "24",
      ageMonths: "8",
      ageRangeFrom: "",
      ageRangeTo: "",
      presentAddress: {
        houseNo: "Flat 402, Tower B",
        streetName: "Old Ropar Road",
        colony: "Sector 14",
        villageTownCity: "PKL",
        tehsil: "Panchkula",
        country: "INDIA",
        state: "HARYANA",
        district: entry.district || "PANCHKULA",
        policeStation: entry.stationName || "PANCHKULA SECTOR-5",
        pincode: "134112",
      },
      sameAsPresent: true,
      permanentAddress: {
        houseNo: "Flat 402, Tower B",
        streetName: "Old Ropar Road",
        colony: "Sector 14",
        villageTownCity: "PKL",
        tehsil: "Panchkula",
        country: "INDIA",
        state: "HARYANA",
        district: entry.district || "PANCHKULA",
        policeStation: entry.stationName || "PANCHKULA SECTOR-5",
        pincode: "134112",
      },
      nameOfEo: entry.officerName || "Lalit Kumar (I (Inspector))-53175",
      eoRank: entry.officerRank || "I (Inspector)",
      eoNumber: "53175",
      remarks:
        entry.remarks ||
        "Enquiry entrusted to Inspector Lalit Kumar. CDR/Tower dump verification & CEIR portal blocking initiated.",
      expectedDateToComplete: "2019-04-24",
      registeredBy: entry.officerName || "Inspector Lalit Kumar",
    };
  };

  // Convert RegistrationEntry to MissingPersonRecord for statutory modal and preview
  const convertEntryToMissingPersonRecord = (
    entry: RegistrationEntry
  ): MissingPersonRecord => {
    const existing =
      missingPersonService.getRecordByRegNumber(entry.regNumber) ||
      missingPersonService.getRecordById(entry.id);
    if (existing) return existing;

    const parts = entry.personName
      ? entry.personName.trim().split(" ")
      : ["Monu", "Kumar"];
    const firstName = parts[0] || "Monu";
    const lastName = parts.slice(1).join(" ") || "Kumar";

    return {
      id: entry.id,
      registrationNumber: entry.regNumber || "0002/2019",
      registrationYear: entry.regNumber?.includes("/")
        ? entry.regNumber.split("/")[1]
        : "2019",
      createdAt: entry.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: (entry.status as any) || "OPEN",
      registrationDateTime: `${entry.date || "19/04/2019"} ${entry.time || "15:19"}`,
      gdNumber: "002",
      gdDateTime: `${entry.date || "19/04/2019"}, ${entry.time || "10:45"}`,
      briefOfIncident: entry.remarks || "Missing Person",
      dateTimeSinceMissing: `${entry.date || "19/04/2019"} 11:00`,
      dateSinceMissing: entry.date || "2019-04-19",
      timeSinceMissing: "11:00",
      firNumber: "0042",
      firYear: "2019",
      placeOfMissing: entry.missingFrom || "Panchkula bus stand",
      actsSections: [
        { id: "act_1", act: "Police Act 1861", section: "Section 34" },
      ],
      complainantUid: "4829-1092-3849",
      complainantFirstName: entry.contactPerson?.split(" ")[0] || "RAVI",
      complainantMiddleName: "",
      complainantLastName:
        entry.contactPerson?.split(" ").slice(1).join(" ") || "Kumar",
      complainantRelationType: "Father",
      complainantRelativeName: entry.fatherOrHusbandName || "Shyam",
      complainantMobile: entry.contactNumber || "+91 9812033441",
      complainantLandline: "",
      complainantEmail: "",
      complainantGender: "Male",
      complainantPresentAddress: {
        houseNo: "Plot 12",
        streetName: "Bus Stand Road",
        colony: "Sector 5",
        villageTownCity: "pkl",
        tehsil: "Panchkula",
        country: "INDIA",
        state: "HARYANA",
        district: entry.district || "PANCHKULA",
        policeStation: entry.stationName || "PANCHKULA SECTOR-5",
        pincode: "134109",
      },
      complainantSameAsPresent: true,
      complainantPermanentAddress: {
        houseNo: "Plot 12",
        streetName: "Bus Stand Road",
        colony: "Sector 5",
        villageTownCity: "pkl",
        tehsil: "Panchkula",
        country: "INDIA",
        state: "HARYANA",
        district: entry.district || "PANCHKULA",
        policeStation: entry.stationName || "PANCHKULA SECTOR-5",
        pincode: "134109",
      },
      complainantNationality: "INDIA",
      complainantIdList: [
        { id: "cid_1", idType: "Ration Card", idNumber: "RC-HR-PKL-99201" },
      ],
      uid: "7719-2810-4412",
      firstName,
      middleName: "",
      lastName,
      alias: "Chhotu",
      relationType: "Father",
      relativeName: entry.fatherOrHusbandName || "Shyam",
      photoUrl: entry.photoUrl,
      gender: (entry.gender as any) || "Male",
      majorMinor: "Major",
      mobileNo: entry.contactNumber || "+91 9416088219",
      landlineNo: "",
      emailId: "",
      dob: "1990-12-02",
      yearOfBirth: "1990",
      ageYears: entry.approxAge?.replace(/\D/g, "") || "28",
      ageMonths: "4",
      ageRangeFrom: "",
      ageRangeTo: "",
      sameAsComplainantAddress: true,
      presentAddress: {
        houseNo: "Plot 12",
        streetName: "Bus Stand Road",
        colony: "Sector 5",
        villageTownCity: "pkl",
        tehsil: "Panchkula",
        country: "INDIA",
        state: "HARYANA",
        district: entry.district || "PANCHKULA",
        policeStation: entry.stationName || "PANCHKULA SECTOR-5",
        pincode: "134109",
      },
      sameAsPresentAddress: true,
      permanentAddress: {
        houseNo: "Plot 12",
        streetName: "Bus Stand Road",
        colony: "Sector 5",
        villageTownCity: "pkl",
        tehsil: "Panchkula",
        country: "INDIA",
        state: "HARYANA",
        district: entry.district || "PANCHKULA",
        policeStation: entry.stationName || "PANCHKULA SECTOR-5",
        pincode: "134109",
      },
      nationality: "INDIA",
      occupation: "Student / Shop Helper",
      idList: [
        { id: "mpid_1", idType: "Aadhar Card", idNumber: "7719 2810 4412" },
      ],
      heightFeet: "5",
      heightInches: "7",
      complexion: "Wheatish",
      build: "Medium",
      faceType: "Round",
      hairColor: "Black",
      eyeColor: "Dark Brown",
      languagesKnown: "Hindi, Punjabi",
      identifyingMarks:
        entry.identifyingMarks ||
        "Mole on right cheek, small burn scar on left forearm",
      clothingDetails:
        entry.clothingDetails || "Blue checked shirt, dark jeans, white sneakers",
      habitsEccentricities: "Polite demeanor, no mental disability reported",
      nameOfEo: entry.officerName || "ASI Sandeep Singh - 49102",
      eoRank: entry.officerRank || "Assistant Sub Inspector",
      eoNumber: "49102",
      policeStation: entry.stationName || "PANCHKULA SECTOR-5",
      district: entry.district || "PANCHKULA",
      expectedDateToComplete: "2019-04-26",
      remarks:
        entry.remarks ||
        "WT message flashed to all police stations in Haryana and Chandigarh.",
    };
  };

  // Helper to map UidbFormData to RegistrationEntry
  const mapUidbFormToEntry = (formData: UidbFormData): RegistrationEntry => {
    const photoUrl =
      formData.photos?.find((p) => p.fileSubType === "Front View" && p.dataUrl)?.dataUrl ||
      formData.photos?.find((p) => Boolean(p.dataUrl))?.dataUrl ||
      (formData as any).photoUrl ||
      "";

    const nextReg =
      formData.regNumber?.trim() ||
      RegistrationService.generateNextRegNumber("UIDB");

    return {
      id: formData.id || `uidb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: "UIDB",
      regNumber: nextReg,
      date: formData.date || new Date().toISOString().split("T")[0],
      time: formData.time || new Date().toTimeString().slice(0, 5),
      stationName: formData.stationName || "PANCHKULA SECTOR-5",
      district: formData.district || "PANCHKULA",
      status: formData.status || "OPEN",
      officerName: formData.inquestReportPreparedBy || formData.officerName || "Lalit Kumar",
      officerRank: "Inspector",
      gender: formData.gender || "Unidentified",
      approxAge: formData.ageYears
        ? `${formData.ageYears} Years`
        : formData.ageRangeFrom
        ? `${formData.ageRangeFrom}-${formData.ageRangeTo} Yrs`
        : "Unknown",
      foundLocation: formData.placeWhereFound || "Recovery Spot",
      identifyingMarks:
        [
          formData.marksTattooMarks,
          formData.marksScarMarks,
          formData.marksMoles,
          formData.marksOthers,
        ]
          .filter(Boolean)
          .join(", ") || "No visible marks",
      clothingDetails:
        [
          formData.clothesOuterTop,
          formData.clothesOuterBottom,
          formData.clothesFootwear,
        ]
          .filter(Boolean)
          .join(", ") || "Apparel found",
      inquestNumber: formData.gdNumber
        ? `UD/194-BNSS/${formData.gdNumber}`
        : formData.inquestNumber || "UD/194-BNSS",
      mortuaryName: "LNJP Civil Hospital Mortuary",
      remarks: formData.briefOfIncident || "Inquest recorded.",
      createdAt: formData.createdAt || new Date().toISOString(),
      photoUrl: photoUrl,
      photos: formData.photos || [],
      fullUidbData: formData,
    };
  };

  // Form submit handler: Saves record IMMEDIATELY so it never disappears on refresh, then transitions to Preview
  const handleSaveUidb = (savedData: UidbFormData) => {
    setIsUidbModalOpen(false);

    const newOrUpdatedEntry = mapUidbFormToEntry(savedData);
    const existing = entries.find(
      (e) => e.id === newOrUpdatedEntry.id || (newOrUpdatedEntry.regNumber && e.regNumber === newOrUpdatedEntry.regNumber)
    );

    let savedEntry: RegistrationEntry;
    if (existing) {
      savedEntry =
        RegistrationService.updateEntry(existing.id, newOrUpdatedEntry) ||
        newOrUpdatedEntry;
    } else {
      savedEntry = RegistrationService.addEntry(newOrUpdatedEntry);
    }

    setEntries((prev) => sortEntriesNewestFirst([savedEntry, ...prev.filter((e) => e.id !== savedEntry.id)]));
    setRecentlySavedId(savedEntry.id);
    setActiveTab("UIDB");

    setUidbPdfData({
      ...savedData,
      id: savedEntry.id,
      regNumber: savedEntry.regNumber,
      photoUrl: savedEntry.photoUrl,
    });
    setIsPendingFinalSubmit(true);
    setIsUidbPdfOpen(true);
  };

  // Final Submit handler: Called from I.I.F.-X Preview Modal to confirm and display success banner
  const handleFinalSubmitUidb = (finalData: UidbFormData) => {
    const newOrUpdatedEntry = mapUidbFormToEntry(finalData);
    const existing = entries.find(
      (e) => e.id === newOrUpdatedEntry.id || (newOrUpdatedEntry.regNumber && e.regNumber === newOrUpdatedEntry.regNumber)
    );

    let savedEntry: RegistrationEntry;
    if (existing) {
      savedEntry =
        RegistrationService.updateEntry(existing.id, newOrUpdatedEntry) ||
        newOrUpdatedEntry;
    } else {
      savedEntry = RegistrationService.addEntry(newOrUpdatedEntry);
    }

    // Immediately guarantee the entry is in the local React state and active tab
    setEntries((prev) => sortEntriesNewestFirst([savedEntry, ...prev.filter((e) => e.id !== savedEntry.id)]));
    setActiveTab("UIDB");
    setSearchQuery("");
    setStatusFilter("ALL");
    setRecentlySavedId(savedEntry.id);
    setSuccessBanner({
      regNumber: savedEntry.regNumber,
      type: "UIDB",
      message: `अज्ञात शव पंजीकरण (UIDB/UD) संख्या ${savedEntry.regNumber} पोर्टल डेटाबेस में सफलतापूर्वक दर्ज हो गई है। यह अब नीचे दी गई तालिका में सबसे ऊपर उपलब्ध है।`,
      entry: savedEntry,
    });

    setIsPendingFinalSubmit(false);
    setIsUidbPdfOpen(false);

    // Scroll to the registrations table area smoothly
    setTimeout(() => {
      window.scrollTo({ top: 100, behavior: "smooth" });
    }, 150);
  };

  // Back to edit from preview modal
  const handleBackToEditUidb = () => {
    setIsUidbPdfOpen(false);
    setIsPendingFinalSubmit(false);
    setUidbEditData(uidbPdfData);
    setIsUidbModalOpen(true);
  };

  // Open Form Modal for a specific registration category
  const handleOpenAddModal = (type: RegistrationType) => {
    setEditingEntry(null);
    const today = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toTimeString().slice(0, 5);
    const nextReg = RegistrationService.generateNextRegNumber(type);

    setFormData({
      type: type,
      regNumber: nextReg,
      date: today,
      time: nowTime,
      stationName: currentUser.stationName || "Thanesar City",
      district: "Kurukshetra",
      status: "OPEN",
      officerName: currentUser.name || "Station Officer",
      officerRank: currentUser.rank || "Sub Inspector",
      remarks: "",
      gender: "Male",
      cattleType: type === "MISSING_CATTLE" ? "Cow" : undefined,
      propertyType: type === "LOST_PROPERTY" ? "Mobile Phone" : undefined,
    });
    setActiveModalType(type);
  };

  // Open Form Modal for Edit
  const handleOpenEditModal = (entry: RegistrationEntry) => {
    setEditingEntry(entry);
    setFormData({ ...entry });
    setActiveModalType(entry.type);
  };

  // Close active modal
  const handleCloseModal = () => {
    setActiveModalType(null);
    setEditingEntry(null);
    setFormData({});
  };

  // Handle Save Form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    let saved: RegistrationEntry;
    if (editingEntry) {
      saved =
        RegistrationService.updateEntry(editingEntry.id, formData) ||
        ({ ...editingEntry, ...formData } as RegistrationEntry);
    } else {
      saved = RegistrationService.addEntry(formData as any);
    }
    setEntries((prev) => [saved, ...prev.filter((e) => e.id !== saved.id)]);
    setRecentlySavedId(saved.id);
    setSuccessBanner({
      regNumber: saved.regNumber,
      type: saved.type,
      message: `पंजीकरण संख्या ${saved.regNumber} सफलतापूर्वक दर्ज हो गया है। यह अब सूची में सबसे ऊपर उपलब्ध है।`,
      entry: saved,
    });
    handleCloseModal();
  };

  // Handle Delete Entry
  const handleDeleteEntry = (id: string, regNum: string) => {
    if (confirm(`Are you sure you want to delete ${regNum}?`)) {
      RegistrationService.deleteEntry(id);
      loadData();
    }
  };

  // Status badge style helper
  const getStatusBadge = (status: RegistrationStatus) => {
    switch (status) {
      case "OPEN":
        return "bg-amber-50 text-amber-800 border-amber-200/80";
      case "TRACED":
      case "RESTORED":
        return "bg-emerald-50 text-emerald-800 border-emerald-200/80";
      case "CLOSED":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Status dot style helper
  const getStatusDot = (status: RegistrationStatus) => {
    switch (status) {
      case "OPEN":
        return "bg-amber-500";
      case "TRACED":
      case "RESTORED":
        return "bg-emerald-500";
      case "CLOSED":
        return "bg-slate-400";
      default:
        return "bg-slate-400";
    }
  };

  // Close status dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveStatusMenuId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Quick Status Update Handler
  const handleQuickStatusUpdate = (entry: RegistrationEntry, newStatus: RegistrationStatus) => {
    if (entry.status === newStatus) {
      return;
    }

    const oldStatus = entry.status;

    // 1. Update in RegistrationService
    RegistrationService.updateEntry(entry.id, { status: newStatus });
    if (entry.regNumber) {
      RegistrationService.updateEntry(entry.regNumber, { status: newStatus });
    }

    // 2. Sync to domain-specific services
    if (entry.type === "MISSING_PERSON") {
      missingPersonService.updateStatus(entry.id, newStatus as any);
      missingPersonService.updateStatus(entry.regNumber, newStatus as any);
    } else if (entry.type === "LOST_PROPERTY") {
      lostPropertyService.updateStatus(entry.id, newStatus as any);
      lostPropertyService.updateStatus(entry.regNumber, newStatus as any);
    }

    // 3. Update local table entries state
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entry.id || (e.regNumber && e.regNumber === entry.regNumber)
          ? { ...e, status: newStatus }
          : e
      )
    );

    // 4. Show toast notification banner
    setStatusFeedback({
      regNumber: entry.regNumber,
      type: entry.type,
      oldStatus,
      newStatus,
    });

    setTimeout(() => {
      setStatusFeedback(null);
    }, 4500);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Header (Minimalist & Clean) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Registrations
            </h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-mono shadow-2xs">
              {currentTabEntries.length} {activeTab === "UIDB" ? "UIDB / UD" : activeTab === "MISSING_PERSON" ? "Missing Person" : activeTab === "MISSING_CATTLE" ? "Missing Cattle" : "Lost Property"} Records
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono border border-slate-200">
              Total {entries.length} in Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Police Station Statutory Registers (UIDB/UD, Missing Person, Missing Cattle, Lost Property)
          </p>
        </div>
      </div>

      {/* Success Notification Banner when an entry is submitted */}
      {successBanner && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in-50">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs sm:text-sm text-emerald-950">
                  सफल पंजीकरण (Successfully Saved)
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded font-mono text-[11px] font-bold border border-emerald-300">
                  {successBanner.regNumber}
                </span>
                <span className="text-[10px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                  {successBanner.type === "UIDB" ? "लावारिस शव (UIDB/UD)" : successBanner.type}
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                {successBanner.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {successBanner.type === "UIDB" && (
              <button
                type="button"
                onClick={() => {
                  setUidbPdfData(convertEntryToUidbForm(successBanner.entry));
                  setIsPendingFinalSubmit(false);
                  setIsUidbPdfOpen(true);
                }}
                className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>I.I.F.-X पर्ची देखें</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSuccessBanner(null)}
              className="text-emerald-700 hover:text-emerald-950 p-1.5 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
              title="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Status Update Notification */}
      {statusFeedback && (
        <div className="bg-sky-50 border border-sky-300 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3 shadow-xs animate-in fade-in-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs sm:text-sm text-sky-950">
                  स्थिति अपडेट की गई (Status Updated)
                </span>
                <span className="px-2 py-0.5 bg-sky-100 text-sky-900 rounded font-mono text-[11px] font-bold border border-sky-300">
                  {statusFeedback.regNumber}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {statusFeedback.oldStatus} ➔
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(
                    statusFeedback.newStatus
                  )}`}
                >
                  {statusFeedback.newStatus}
                </span>
              </div>
              <p className="text-xs text-sky-800 mt-0.5">
                पंजीकरण संख्या {statusFeedback.regNumber} का स्टेटस सफलतापूर्वक &quot;{statusFeedback.newStatus}&quot; में बदल दिया गया है।
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFeedback(null)}
            className="text-sky-700 hover:text-sky-950 p-1.5 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Four Main Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-2.5">
        {[
          { key: "UIDB", label: "UIDB / UD", hi: "लावारिस शव", count: counts.UIDB },
          { key: "MISSING_PERSON", label: "Missing Person", hi: "गुमशुदा व्यक्ति", count: counts.MISSING_PERSON },
          { key: "MISSING_CATTLE", label: "Missing Cattle", hi: "गुमशुदा पशु", count: counts.MISSING_CATTLE },
          { key: "LOST_PROPERTY", label: "Lost Property", hi: "खोई संपत्ति", count: counts.LOST_PROPERTY },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key as RegistrationType)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-75 font-normal hidden sm:inline">
                ({tab.hi})
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? "bg-slate-800 text-slate-200" : "bg-white text-slate-700 border border-slate-200/60"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Specific Action & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/70">
        {/* Left: Search & Filter */}
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${
                activeTab === "UIDB"
                  ? "UIDB / UD by Reg No, Location, Marks..."
                  : activeTab === "MISSING_PERSON"
                  ? "Missing Person by Name, Guardian, Area..."
                  : activeTab === "MISSING_CATTLE"
                  ? "Missing Cattle by Owner, Breed, Tag..."
                  : "Lost Property by Item, IMEI, Owner..."
              }`}
              className="w-full text-xs rounded-lg border border-slate-200 pl-8 pr-7 py-1.5 text-slate-800 bg-white focus:outline-none focus:border-slate-400 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                &times;
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-700 bg-white focus:outline-none focus:border-slate-400 cursor-pointer shrink-0"
          >
            <option value="ALL">Status: All</option>
            <option value="OPEN">Open / Active</option>
            <option value="TRACED">Traced / Recovered</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Right: Distinct & Specific Register Button for this active tab */}
        <div className="shrink-0 flex items-center">
          {activeTab === "UIDB" && (
            <button
              type="button"
              onClick={() => {
                setUidbEditData(null);
                setIsUidbModalOpen(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register UIDB / UD</span>
            </button>
          )}

          {activeTab === "MISSING_PERSON" && (
            <button
              type="button"
              onClick={() => {
                setMissingPersonEditRecord(null);
                setIsMissingPersonModalOpen(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-800 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Missing Person</span>
            </button>
          )}

          {activeTab === "MISSING_CATTLE" && (
            <button
              type="button"
              onClick={() => handleOpenAddModal("MISSING_CATTLE")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Missing Cattle</span>
            </button>
          )}

          {activeTab === "LOST_PROPERTY" && (
            <button
              type="button"
              onClick={() => {
                setLostPropertyEditRecord(null);
                setIsLostPropertyModalOpen(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-900 hover:bg-amber-800 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Lost Property</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Table View */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ClipboardList className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-sm text-slate-800">
            {activeTab === "UIDB"
              ? "No UIDB / UD records found"
              : activeTab === "MISSING_PERSON"
              ? "No Missing Person records found"
              : activeTab === "MISSING_CATTLE"
              ? "No Missing Cattle records found"
              : "No Lost Property records found"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? "No entries match your search query."
              : `Click the register button to add a new ${
                  activeTab === "UIDB"
                    ? "UIDB / UD"
                    : activeTab === "MISSING_PERSON"
                    ? "Missing Person"
                    : activeTab === "MISSING_CATTLE"
                    ? "Missing Cattle"
                    : "Lost Property"
                } entry.`}
          </p>
          <button
            type="button"
            onClick={() => {
              if (activeTab === "UIDB") {
                setUidbEditData(null);
                setIsUidbModalOpen(true);
              } else {
                handleOpenAddModal(activeTab);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              {activeTab === "UIDB"
                ? "+ Register UIDB / UD"
                : activeTab === "MISSING_PERSON"
                ? "+ Register Missing Person"
                : activeTab === "MISSING_CATTLE"
                ? "+ Register Missing Cattle"
                : "+ Register Lost Property"}
            </span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200/80 rounded-xl bg-white shadow-2xs min-h-[320px] pb-8">
          <table className="w-full text-xs text-left border-collapse min-w-[850px]">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 text-center w-10 text-slate-400 font-normal">#</th>
                <th className="py-2.5 px-4 w-36">Reg. No. / Date</th>
                {activeTab === "UIDB" && (
                  <>
                    <th className="py-2.5 px-3 w-16 text-center">Photo</th>
                    <th className="py-2.5 px-4 min-w-[160px]">Gender &amp; Approx Age</th>
                    <th className="py-2.5 px-4 min-w-[190px]">Recovery Location</th>
                    <th className="py-2.5 px-4 min-w-[200px]">Marks &amp; Clothing</th>
                  </>
                )}
                {activeTab === "MISSING_PERSON" && (
                  <>
                    <th className="py-2.5 px-4 min-w-[170px]">Missing Person Name</th>
                    <th className="py-2.5 px-4 min-w-[200px]">Missing From</th>
                    <th className="py-2.5 px-4 min-w-[200px]">Informant Contact</th>
                  </>
                )}
                {activeTab === "MISSING_CATTLE" && (
                  <>
                    <th className="py-2.5 px-4 min-w-[170px]">Cattle &amp; Breed</th>
                    <th className="py-2.5 px-4 min-w-[200px]">Owner &amp; Village</th>
                    <th className="py-2.5 px-4 min-w-[200px]">Ear Tag &amp; Marks</th>
                  </>
                )}
                {activeTab === "LOST_PROPERTY" && (
                  <>
                    <th className="py-2.5 px-4 min-w-[170px]">Property Type &amp; Make</th>
                    <th className="py-2.5 px-4 min-w-[200px]">Lost Location</th>
                    <th className="py-2.5 px-4 min-w-[200px]">Owner Details</th>
                  </>
                )}
                <th className="py-2.5 px-3 w-36 text-center">Status / स्थिति</th>
                <th className="py-2.5 px-4 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.map((row, idx) => {
                const isJustSaved = row.id === recentlySavedId;
                return (
                <tr
                  key={row.id}
                  className={`transition-all ${
                    isJustSaved
                      ? "bg-emerald-50/90 ring-2 ring-emerald-500/60 font-medium shadow-2xs"
                      : "hover:bg-slate-50/60"
                  }`}
                >
                  <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px] align-top">
                    {idx + 1}
                  </td>

                  {/* Reg Number & Date */}
                  <td className="py-3 px-4 align-top space-y-0.5 font-mono">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-slate-800 text-xs block">
                        {row.regNumber}
                      </span>
                      {isJustSaved && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-600 text-white animate-pulse">
                          <Sparkles className="w-2.5 h-2.5 inline" /> NEW / अभी दर्ज
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      {row.date} • {row.time}
                    </span>
                  </td>

                  {/* Tab specific columns */}
                  {activeTab === "UIDB" && (
                    <>
                      <td className="py-2.5 px-3 align-top text-center">
                        {row.photoUrl ? (
                          <div
                            onClick={() => {
                              setUidbPdfData(convertEntryToUidbForm(row));
                              setIsPendingFinalSubmit(false);
                              setIsUidbPdfOpen(true);
                            }}
                            className="w-12 h-14 rounded-md border border-slate-300 overflow-hidden bg-slate-100 mx-auto shadow-2xs group relative cursor-pointer hover:border-slate-400 hover:shadow-xs transition-all"
                            title="Click to view full photo / IIF-X"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={row.photoUrl}
                              alt="UIDB Photo"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                              <Eye className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-14 rounded-md border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 mx-auto">
                            <Camera className="w-4 h-4 text-slate-400" />
                            <span className="text-[9px] text-slate-400 font-medium mt-0.5">No Photo</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 align-top space-y-0.5">
                        <span className="font-semibold text-slate-900 block text-xs">
                          {row.gender}, ~{row.approxAge}
                        </span>
                        {row.inquestNumber && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Inquest: {row.inquestNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 align-top text-slate-700">
                        <div className="flex items-start gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                          <span>{row.foundLocation}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top text-slate-600 space-y-0.5">
                        <div className="text-[11px] line-clamp-1">{row.identifyingMarks || "—"}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{row.clothingDetails || "—"}</div>
                      </td>
                    </>
                  )}

                  {activeTab === "MISSING_PERSON" && (
                    <>
                      <td className="py-3 px-4 align-top space-y-0.5">
                        <span className="font-semibold text-slate-900 block text-xs">
                          {row.personName} ({row.approxAge})
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          s/o / w/o: {row.fatherOrHusbandName || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-top text-slate-700">
                        <div className="flex items-start gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                          <span>{row.missingFrom}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top text-slate-600 space-y-0.5">
                        <div className="text-[11px] font-medium text-slate-700">{row.contactPerson || "—"}</div>
                        {row.contactNumber && (
                          <div className="text-[10px] text-slate-400 font-mono">Ph: {row.contactNumber}</div>
                        )}
                      </td>
                    </>
                  )}

                  {activeTab === "MISSING_CATTLE" && (
                    <>
                      <td className="py-3 px-4 align-top space-y-0.5">
                        <span className="font-semibold text-slate-900 block text-xs">
                          {row.cattleType} ({row.breed || "Local"})
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Color: {row.color || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-top text-slate-700 space-y-0.5">
                        <span className="font-medium block text-slate-800">{row.ownerName}</span>
                        <span className="text-[10px] text-slate-400 block">{row.ownerVillage}</span>
                      </td>
                      <td className="py-3 px-4 align-top text-slate-600 space-y-0.5">
                        <div className="text-[11px] font-mono text-slate-800">
                          {row.earTagNumber ? `Tag: ${row.earTagNumber}` : "No Tag"}
                        </div>
                        {row.approxValue && (
                          <div className="text-[10px] text-slate-400">Val: {row.approxValue}</div>
                        )}
                      </td>
                    </>
                  )}

                  {activeTab === "LOST_PROPERTY" && (
                    <>
                      <td className="py-3 px-4 align-top space-y-0.5">
                        <span className="font-semibold text-slate-900 block text-xs">
                          {row.propertyType}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">
                          {row.brandOrMake || row.identifyingNumber || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-top text-slate-700">
                        <div className="flex items-start gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                          <span>{row.lostLocation}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top text-slate-600 space-y-0.5">
                        <div className="text-[11px] font-medium text-slate-800">{row.ownerName || "—"}</div>
                        {row.ownerPhone && (
                          <div className="text-[10px] text-slate-400 font-mono">Ph: {row.ownerPhone}</div>
                        )}
                      </td>
                    </>
                  )}

                  {/* Status */}
                  <td className="py-3 px-3 text-center align-top">
                    <div className="inline-flex items-center justify-center relative">
                      <select
                        value={row.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleQuickStatusUpdate(row, e.target.value as RegistrationStatus);
                        }}
                        className={`appearance-none pl-5 pr-6 py-0.5 rounded-full text-[10px] font-bold uppercase border cursor-pointer outline-none transition-all shadow-2xs hover:shadow-xs focus:ring-2 focus:ring-slate-400/20 ${getStatusBadge(
                          row.status
                        )}`}
                        title="Click to change status / स्थिति बदलें"
                      >
                        {(STATUS_OPTIONS_BY_TYPE[row.type] || ["OPEN", "TRACED", "CLOSED"]).map((statusName) => (
                          <option
                            key={statusName}
                            value={statusName}
                            className="bg-white text-slate-900 text-xs font-semibold py-1.5"
                          >
                            {statusName}
                          </option>
                        ))}
                      </select>
                      {/* Status indicator dot */}
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${getStatusDot(row.status)} absolute left-2 pointer-events-none`}
                      />
                      {/* Dropdown Chevron */}
                      <ChevronDown className="w-3 h-3 opacity-60 absolute right-1.5 pointer-events-none" />
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right align-top">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (row.type === "UIDB") {
                            setUidbPdfData(convertEntryToUidbForm(row));
                            setIsPendingFinalSubmit(false);
                            setIsUidbPdfOpen(true);
                          } else if (row.type === "MISSING_PERSON") {
                            setMissingPersonPdfData(
                              convertEntryToMissingPersonRecord(row)
                            );
                            setIsMissingPersonPdfOpen(true);
                          } else if (row.type === "LOST_PROPERTY") {
                            setLostPropertyPdfData(
                              convertEntryToLostPropertyRecord(row)
                            );
                            setIsLostPropertyPdfOpen(true);
                          } else {
                            setViewSlipEntry(row);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        title={
                          row.type === "UIDB"
                            ? "View & Print I.I.F.-X Slip"
                            : row.type === "MISSING_PERSON"
                            ? "View & Print Missing Person Intimation Slip"
                            : row.type === "LOST_PROPERTY"
                            ? "View & Print Lost Property Intimation Slip"
                            : "View & Print Slip"
                        }
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (row.type === "UIDB") {
                            setUidbEditData(convertEntryToUidbForm(row));
                            setIsUidbModalOpen(true);
                          } else if (row.type === "MISSING_PERSON") {
                            setMissingPersonEditRecord(
                              convertEntryToMissingPersonRecord(row)
                            );
                            setIsMissingPersonModalOpen(true);
                          } else if (row.type === "LOST_PROPERTY") {
                            setLostPropertyEditRecord(
                              convertEntryToLostPropertyRecord(row)
                            );
                            setIsLostPropertyModalOpen(true);
                          } else {
                            handleOpenEditModal(row);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        title="Edit Entry"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(row.id, row.regNumber)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5A. COMPREHENSIVE CCTNS 6-TAB UIDB / UD REGISTRATION MODAL                */}
      {/* ========================================================================= */}
      <UidbRegistrationModal
        isOpen={isUidbModalOpen}
        onClose={() => setIsUidbModalOpen(false)}
        initialData={uidbEditData}
        onSave={handleSaveUidb}
      />

      {/* ========================================================================= */}
      {/* 5A-2. OFFICIAL CCTNS I.I.F.-X PRINTABLE PDF PREVIEW MODAL                 */}
      {/* ========================================================================= */}
      {uidbPdfData && (
        <UidbPdfPreviewModal
          isOpen={isUidbPdfOpen}
          onClose={() => {
            setIsUidbPdfOpen(false);
            setIsPendingFinalSubmit(false);
          }}
          data={uidbPdfData}
          onFinalSubmit={handleFinalSubmitUidb}
          isPendingFinalSubmit={isPendingFinalSubmit}
          onBackToEdit={handleBackToEditUidb}
        />
      )}

      {/* ========================================================================= */}
      {/* 5B. STATUTORY HARYANA POLICE CCTNS REGISTER MISSING PERSON MODAL          */}
      {/* ========================================================================= */}
      <RegisterMissingPersonModal
        isOpen={isMissingPersonModalOpen}
        onClose={() => {
          setIsMissingPersonModalOpen(false);
          setMissingPersonEditRecord(null);
        }}
        initialRecord={missingPersonEditRecord}
        onSuccess={(savedRecord) => {
          RegistrationService.addEntry({
            id: savedRecord.id,
            type: "MISSING_PERSON",
            regNumber: savedRecord.registrationNumber,
            date: savedRecord.dateSinceMissing,
            time: savedRecord.timeSinceMissing,
            stationName: savedRecord.policeStation,
            district: savedRecord.district,
            status: savedRecord.status,
            personName: `${savedRecord.firstName} ${savedRecord.lastName}`.trim(),
            fatherOrHusbandName: `${savedRecord.relationType}: ${savedRecord.relativeName}`,
            gender: savedRecord.gender || "Male",
            approxAge: `${savedRecord.ageYears || "28"} Years`,
            missingFrom: savedRecord.placeOfMissing,
            contactPerson: `${savedRecord.complainantFirstName} ${savedRecord.complainantLastName} (${savedRecord.complainantRelationType || "Father"})`.trim(),
            contactNumber: savedRecord.complainantMobile || "",
            address: `${savedRecord.presentAddress?.villageTownCity}, ${savedRecord.presentAddress?.district}`,
            identifyingMarks: savedRecord.identifyingMarks,
            clothingDetails: savedRecord.clothingDetails,
            officerName: savedRecord.nameOfEo,
            officerRank: savedRecord.eoRank,
            remarks: savedRecord.remarks,
            photoUrl: savedRecord.photoUrl,
            createdAt: savedRecord.createdAt,
          });
          loadData();
          setIsMissingPersonModalOpen(false);
          setMissingPersonEditRecord(null);
        }}
      />

      {/* ========================================================================= */}
      {/* 5B-1. STATUTORY MISSING PERSON CCTNS PREVIEW / PRINT SLIP MODAL           */}
      {/* ========================================================================= */}
      {isMissingPersonPdfOpen && missingPersonPdfData && (
        <MissingPersonPreviewModal
          isOpen={isMissingPersonPdfOpen}
          onClose={() => {
            setIsMissingPersonPdfOpen(false);
            setMissingPersonPdfData(null);
          }}
          record={missingPersonPdfData}
          isNewRecord={false}
          isPendingFinalSubmit={false}
        />
      )}

      {/* ========================================================================= */}
      {/* 5C. DEDICATED MISSING CATTLE FORM MODAL                                   */}
      {/* ========================================================================= */}
      {activeModalType === "MISSING_CATTLE" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50">
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-emerald-900 text-white">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-300" />
                <h3 className="font-semibold text-xs sm:text-sm">
                  {editingEntry ? "Edit Missing Cattle Entry" : "Register Missing Cattle (गुमशुदा पशु पंजीकरण)"}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-emerald-200 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Reg. Number (पंजीकरण सं.)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.regNumber || ""}
                    onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Date &amp; Time (दिनांक व समय)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="date"
                      required
                      value={formData.date || ""}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="time"
                      required
                      value={formData.time || ""}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Cattle Type, Breed & Color */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Cattle Type (पशु प्रकार) *</label>
                  <select
                    value={formData.cattleType || "Cow"}
                    onChange={(e) => setFormData({ ...formData, cattleType: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="Cow">Cow (गाय)</option>
                    <option value="Buffalo">Buffalo (भैंस)</option>
                    <option value="Bull">Bull (बैल / सांड)</option>
                    <option value="Calf">Calf (बछड़ा / बछड़ी)</option>
                    <option value="Goat">Goat (बकरी)</option>
                    <option value="Other">Other (अन्य)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Breed (नस्ल)</label>
                  <input
                    type="text"
                    placeholder="e.g. Murrah / Sahiwal"
                    value={formData.breed || ""}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Color (रंग)</label>
                  <input
                    type="text"
                    placeholder="e.g. Black / White"
                    value={formData.color || ""}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Ear Tag & Approx Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Ear Tag Number / RFID (कान का टैग नंबर)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HR-KKR-49102"
                    value={formData.earTagNumber || ""}
                    onChange={(e) => setFormData({ ...formData, earTagNumber: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Approx Value in ₹ (अनुमानित मूल्य)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹ 75,000"
                    value={formData.approxValue || ""}
                    onChange={(e) => setFormData({ ...formData, approxValue: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Horns & Marks */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Horns, Tail &amp; Identification Marks (सींग, पूंछ व पहचान चिन्ह)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Curved horns, white star on forehead, switch of tail white..."
                  value={formData.identifyingMarks || ""}
                  onChange={(e) => setFormData({ ...formData, identifyingMarks: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              {/* Owner Details */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Owner Name (मालिक का नाम) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Owner full name"
                    value={formData.ownerName || ""}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Mobile No (फ़ोन)</label>
                  <input
                    type="text"
                    placeholder="Mobile number"
                    value={formData.ownerPhone || ""}
                    onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Village / Address (गाँव)</label>
                  <input
                    type="text"
                    placeholder="e.g. Vill. Umri"
                    value={formData.ownerVillage || ""}
                    onChange={(e) => setFormData({ ...formData, ownerVillage: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Status & Officer */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Status (स्थिति)</label>
                  <select
                    value={formData.status || "OPEN"}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="OPEN">Open (खोज जारी / Searching)</option>
                    <option value="RESTORED">Restored / Handed Over (बरामद / सुपुर्द)</option>
                    <option value="CLOSED">Closed (समाप्त)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Investigating Officer (IO)</label>
                  <input
                    type="text"
                    value={formData.officerName || ""}
                    onChange={(e) => setFormData({ ...formData, officerName: e.target.value })}
                    placeholder="Officer Name"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Remarks (टिप्पणी / गौशाला सूचना)</label>
                <input
                  type="text"
                  placeholder="e.g. Flashed to local gaushalas and cattle markets..."
                  value={formData.remarks || ""}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white font-medium"
                >
                  {editingEntry ? "Update Missing Cattle" : "Save Missing Cattle Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5D. STATUTORY HARYANA POLICE CCTNS REGISTER LOST PROPERTY MODAL          */}
      {/* ========================================================================= */}
      <RegisterLostPropertyModal
        isOpen={isLostPropertyModalOpen}
        onClose={() => {
          setIsLostPropertyModalOpen(false);
          setLostPropertyEditRecord(null);
        }}
        initialRecord={lostPropertyEditRecord}
        onSuccess={(savedRecord) => {
          RegistrationService.addEntry({
            id: savedRecord.id,
            type: "LOST_PROPERTY",
            regNumber: savedRecord.registrationNumber,
            date: savedRecord.dateOfPropertyMissing,
            time: savedRecord.timeOfPropertyMissing,
            stationName: savedRecord.policeStation,
            district: savedRecord.district,
            status: "OPEN",
            propertyType: savedRecord.properties[0]?.subType || "MOBILE PHONE",
            brandOrMake: savedRecord.properties[0]?.makeManufacturer || "Samsung",
            identifyingNumber: savedRecord.properties[0]?.identificationNumbers?.[0]
              ? `${savedRecord.properties[0].idType || "IMEI"}: ${savedRecord.properties[0].identificationNumbers.join(", ")}`
              : undefined,
            lostLocation: savedRecord.placeFromWhereMissing,
            ownerName: `${savedRecord.firstName} ${savedRecord.lastName}`.trim(),
            ownerPhone: savedRecord.mobileNumbers?.[0] || "",
            address: `${savedRecord.presentAddress?.villageTownCity}, ${savedRecord.presentAddress?.district}`,
            approxValue: `₹ ${savedRecord.properties.reduce((s, p) => s + (p.estimatedValue || 0), 0).toLocaleString("en-IN")}`,
            officerName: savedRecord.nameOfEo,
            officerRank: savedRecord.eoRank,
            remarks: savedRecord.remarks,
            createdAt: savedRecord.createdAt,
          });
          loadData();
          setIsLostPropertyModalOpen(false);
          setLostPropertyEditRecord(null);
        }}
      />

      {/* ========================================================================= */}
      {/* 5E. STATUTORY LOST PROPERTY CCTNS PREVIEW / PRINT SLIP MODAL              */}
      {/* ========================================================================= */}
      {isLostPropertyPdfOpen && lostPropertyPdfData && (
        <LostPropertyPreviewModal
          isOpen={isLostPropertyPdfOpen}
          onClose={() => {
            setIsLostPropertyPdfOpen(false);
            setLostPropertyPdfData(null);
          }}
          record={lostPropertyPdfData}
          isNewRecord={false}
          isPendingFinalSubmit={false}
        />
      )}

      {/* ========================================================================= */}
      {/* 6. VIEW & PRINT SLIP MODAL                                                */}
      {/* ========================================================================= */}
      {viewSlipEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50">
            {/* Header */}
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <span className="font-semibold text-xs text-slate-800">
                Official Police Registration Slip (आधिकारिक पंजीकरण रसीद)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-xs font-medium text-slate-700 shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewSlipEntry(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Slip Printable Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans">
              <div className="text-center pb-3 border-b border-slate-200 space-y-1">
                <div className="font-bold text-sm tracking-tight text-slate-900 uppercase">
                  Haryana Police Department
                </div>
                <div className="text-[11px] text-slate-600">
                  Police Station: {viewSlipEntry.stationName || "Thanesar City"} • Distt: Kurukshetra
                </div>
                <div className="text-[10px] text-slate-500 font-mono font-semibold">
                  {viewSlipEntry.type === "UIDB"
                    ? "UIDB / UNNATURAL DEATH REGISTER SLIP (धारा 194 BNSS)"
                    : viewSlipEntry.type === "MISSING_PERSON"
                    ? "MISSING PERSON REPORT ACKNOWLEDGMENT (गुमशुदा व्यक्ति रसीद)"
                    : viewSlipEntry.type === "MISSING_CATTLE"
                    ? "MISSING CATTLE REGISTER ENTRY (पशु गुमशुदगी रसीद)"
                    : "LOST PROPERTY REPORT ACKNOWLEDGMENT (खोया सामान पावती)"}
                </div>
              </div>

              {/* Slip details grid */}
              <div className="space-y-2 py-1">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Registration Number:</span>
                  <span className="font-mono font-bold text-slate-900">{viewSlipEntry.regNumber}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Date &amp; Time of Entry:</span>
                  <span className="font-mono text-slate-800">{viewSlipEntry.date} at {viewSlipEntry.time}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-slate-800">{viewSlipEntry.status}</span>
                </div>

                {/* Specifics */}
                {viewSlipEntry.type === "UIDB" && (
                  <>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Gender &amp; Approx Age:</span>
                      <span className="text-slate-800">{viewSlipEntry.gender}, ~{viewSlipEntry.approxAge}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Recovery Location:</span>
                      <span className="text-slate-800">{viewSlipEntry.foundLocation}</span>
                    </div>
                    {viewSlipEntry.mortuaryName && (
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500">Preserved At:</span>
                        <span className="text-slate-800">{viewSlipEntry.mortuaryName}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Identifying Marks:</span>
                      <span className="text-slate-800">{viewSlipEntry.identifyingMarks || "None reported"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Clothing Details:</span>
                      <span className="text-slate-800">{viewSlipEntry.clothingDetails || "None recorded"}</span>
                    </div>
                  </>
                )}

                {viewSlipEntry.type === "MISSING_PERSON" && (
                  <>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Missing Person Name:</span>
                      <span className="font-semibold text-slate-900">{viewSlipEntry.personName}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Age &amp; Gender:</span>
                      <span className="text-slate-800">{viewSlipEntry.approxAge}, {viewSlipEntry.gender}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Missing From:</span>
                      <span className="text-slate-800">{viewSlipEntry.missingFrom}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Informant / Contact:</span>
                      <span className="text-slate-800">{viewSlipEntry.contactPerson} ({viewSlipEntry.contactNumber})</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Clothing Worn:</span>
                      <span className="text-slate-800">{viewSlipEntry.clothingDetails || "—"}</span>
                    </div>
                  </>
                )}

                {viewSlipEntry.type === "MISSING_CATTLE" && (
                  <>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Cattle Description:</span>
                      <span className="font-semibold text-slate-900">{viewSlipEntry.cattleType} ({viewSlipEntry.breed || "Local"})</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Color &amp; Ear Tag:</span>
                      <span className="text-slate-800">{viewSlipEntry.color || "—"} • Tag: {viewSlipEntry.earTagNumber || "N/A"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Owner Name:</span>
                      <span className="text-slate-800">{viewSlipEntry.ownerName} ({viewSlipEntry.ownerVillage})</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Owner Phone:</span>
                      <span className="font-mono text-slate-800">{viewSlipEntry.ownerPhone || "—"}</span>
                    </div>
                  </>
                )}

                {viewSlipEntry.type === "LOST_PROPERTY" && (
                  <>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Lost Item:</span>
                      <span className="font-semibold text-slate-900">{viewSlipEntry.propertyType}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Brand / Model:</span>
                      <span className="text-slate-800">{viewSlipEntry.brandOrMake || "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Serial / IMEI:</span>
                      <span className="font-mono text-slate-800">{viewSlipEntry.identifyingNumber || "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Lost Location:</span>
                      <span className="text-slate-800">{viewSlipEntry.lostLocation}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Owner Name &amp; Phone:</span>
                      <span className="text-slate-800">{viewSlipEntry.ownerName} ({viewSlipEntry.ownerPhone})</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Recording Officer:</span>
                  <span className="text-slate-800 font-medium">{viewSlipEntry.officerName} ({viewSlipEntry.officerRank})</span>
                </div>
              </div>

              {/* Bottom Police Notice */}
              <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 space-y-1">
                <p>
                  * This slip is generated by the Police Station Computerized System as statutory record.
                </p>
                <div className="pt-4 flex justify-between items-end text-slate-600">
                  <div>Date: {viewSlipEntry.date}</div>
                  <div className="text-right">
                    <div className="h-6"></div>
                    <div className="border-t border-slate-400 pt-1 text-[10px] font-semibold">
                      Signature / Stamp of Officer
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegistrationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 text-xs">
          Loading Registrations Module...
        </div>
      }
    >
      <RegistrationsContent />
    </Suspense>
  );
}
