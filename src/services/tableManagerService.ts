// Table Manager Service - Haryana Police CMS
// Manages configurable columns across all primary register tables (FIR, Complaints, General Diary)
// Provides system-default protection (read-only for core columns) and full CRUD for custom user columns.

export type TableIdentifier = "fir" | "complaints" | "general-diary";

export type ColumnDataType = "text" | "number" | "date" | "badge" | "select" | "boolean";

export interface ManagedColumn {
  id: string;
  key: string;
  label: string;
  labelHi?: string;
  dataType: ColumnDataType;
  description?: string;
  isDefault: boolean; // If true: Protected system column (cannot be edited or deleted)
  isActive: boolean;
  width?: string;
  defaultValue?: string;
  options?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ManagedTableConfig {
  id: TableIdentifier;
  name: string;
  nameHi: string;
  module: string;
  description: string;
  routePath: string;
  badge: string;
  defaultColumns: ManagedColumn[];
}

export const MANAGED_TABLES: ManagedTableConfig[] = [
  {
    id: "fir",
    name: "FIR Register",
    nameHi: "प्राथमिकी (FIR) रजिस्टर",
    module: "FIR Module",
    description: "First Information Reports register with investigative statuses, IO assignments, and statutory periods.",
    routePath: "/fir",
    badge: "bg-red-50 text-red-700 border-red-200",
    defaultColumns: [
      {
        id: "firNumber",
        key: "firNumber",
        label: "FIR No. & Reference",
        labelHi: "प्राथमिकी क्रमांक",
        dataType: "text",
        description: "Permanent FIR registration number, CCTNS sync code, and source reference.",
        isDefault: true,
        isActive: true,
        width: "min-w-[170px]",
      },
      {
        id: "dateTime",
        key: "dateTime",
        label: "Date & Time",
        labelHi: "दिनांक एवं समय",
        dataType: "date",
        description: "Official date and hour of registration under Section 173 BNSS.",
        isDefault: true,
        isActive: true,
        width: "min-w-[140px]",
      },
      {
        id: "complainant",
        key: "complainant",
        label: "Complainant / Informant",
        labelHi: "शिकायतकर्ता / मुखबिर",
        dataType: "text",
        description: "Name, contact details, and complainant profile.",
        isDefault: true,
        isActive: true,
        width: "min-w-[170px]",
      },
      {
        id: "actsPlace",
        key: "actsPlace",
        label: "Acts, Sections & Place",
        labelHi: "धाराएँ एवं घटनास्थल",
        dataType: "text",
        description: "Invoked BNS/Special Acts, Sections, and place of occurrence.",
        isDefault: true,
        isActive: true,
        width: "min-w-[180px]",
      },
      {
        id: "status",
        key: "status",
        label: "Status",
        labelHi: "अवस्था",
        dataType: "badge",
        description: "Investigation lifecycle stage (Under Investigation, Chargesheet, Closure).",
        isDefault: true,
        isActive: true,
        width: "min-w-[140px]",
      },
      {
        id: "assignedIo",
        key: "assignedIo",
        label: "Investigating Officer (IO)",
        labelHi: "जांच अधिकारी (IO)",
        dataType: "text",
        description: "Rank, name, and PNO of the assigned Investigating Officer.",
        isDefault: true,
        isActive: true,
        width: "min-w-[160px]",
      },
      {
        id: "daysPending",
        key: "daysPending",
        label: "Days",
        labelHi: "दिन",
        dataType: "number",
        description: "Days elapsed since registration towards statutory 60/90-day charge sheet deadlines.",
        isDefault: true,
        isActive: true,
        width: "min-w-[80px]",
      },
      {
        id: "action",
        key: "action",
        label: "Actions",
        labelHi: "कार्यवाही",
        dataType: "text",
        description: "Action buttons for Case Diary, Workspace, and Print.",
        isDefault: true,
        isActive: true,
        width: "w-28",
      },
    ],
  },
  {
    id: "complaints",
    name: "Complaints Register",
    nameHi: "शिकायत रजिस्टर",
    module: "Complaints Module",
    description: "Citizen and department complaints register with preliminary enquiry tracking and conversion logs.",
    routePath: "/complaints",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    defaultColumns: [
      {
        id: "complaintId",
        key: "complaintId",
        label: "Complaint ID & Priority",
        labelHi: "शिकायत क्रमांक एवं प्राथमिकता",
        dataType: "text",
        description: "Unique complaint tracking number, priority rating, and source channel.",
        isDefault: true,
        isActive: true,
        width: "min-w-[170px]",
      },
      {
        id: "dateTime",
        key: "dateTime",
        label: "Date & Time",
        labelHi: "दिनांक एवं समय",
        dataType: "date",
        description: "Timestamp when complaint was logged at station desk or online portal.",
        isDefault: true,
        isActive: true,
        width: "min-w-[140px]",
      },
      {
        id: "complainant",
        key: "complainant",
        label: "Complainant",
        labelHi: "शिकायतकर्ता",
        dataType: "text",
        description: "Complainant personal details, phone number, and address.",
        isDefault: true,
        isActive: true,
        width: "min-w-[170px]",
      },
      {
        id: "categoryLocation",
        key: "categoryLocation",
        label: "Category & Incident Location",
        labelHi: "श्रेणी एवं घटनास्थल",
        dataType: "text",
        description: "Subject classification (Financial, Cyber, Assault) and location.",
        isDefault: true,
        isActive: true,
        width: "min-w-[180px]",
      },
      {
        id: "status",
        key: "status",
        label: "Enquiry Status",
        labelHi: "जांच स्थिति",
        dataType: "badge",
        description: "Current enquiry stage (Assigned, Pending, Report Submitted, FIR Recommended).",
        isDefault: true,
        isActive: true,
        width: "min-w-[140px]",
      },
      {
        id: "assignedEo",
        key: "assignedEo",
        label: "Enquiry Officer",
        labelHi: "जांच अधिकारी (EO)",
        dataType: "text",
        description: "Name and designation of Enquiry Officer deputed under Rule 24.4.",
        isDefault: true,
        isActive: true,
        width: "min-w-[160px]",
      },
      {
        id: "daysPending",
        key: "daysPending",
        label: "Days Pending",
        labelHi: "लंबित दिन",
        dataType: "number",
        description: "Elapsed days towards statutory 14-day preliminary enquiry limit under BNSS 173(3).",
        isDefault: true,
        isActive: true,
        width: "min-w-[100px]",
      },
      {
        id: "action",
        key: "action",
        label: "Actions",
        labelHi: "कार्यवाही",
        dataType: "text",
        description: "Action buttons for Notice, Enquiry Workspace, and SHO Approval.",
        isDefault: true,
        isActive: true,
        width: "w-28",
      },
    ],
  },
  {
    id: "general-diary",
    name: "General Diary (Roznamcha)",
    nameHi: "रोजनामचा आम (General Diary)",
    module: "General Diary Module",
    description: "Daily chronologically sequenced 24-hour police diary mandated under Punjab Police Rule 22.48.",
    routePath: "/general-diary",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    defaultColumns: [
      {
        id: "gdNumber",
        key: "gdNumber",
        label: "GD No",
        labelHi: "रोजनामचा नंबर",
        dataType: "text",
        description: "Daily sequential entry number and unique station reference.",
        isDefault: true,
        isActive: true,
        width: "w-28",
      },
      {
        id: "officer",
        key: "officer",
        label: "Entry for officer",
        labelHi: "अधिकारी का विवरण",
        dataType: "text",
        description: "Duty officer or official reporting the matter.",
        isDefault: true,
        isActive: true,
        width: "w-44",
      },
      {
        id: "gdType",
        key: "gdType",
        label: "GD Type",
        labelHi: "रोजनामचा प्रकार",
        dataType: "badge",
        description: "Classification (Departure, Arrival, Crime Information, Lockup Inspection).",
        isDefault: true,
        isActive: true,
        width: "w-32",
      },
      {
        id: "subject",
        key: "subject",
        label: "Subject",
        labelHi: "विषय",
        dataType: "text",
        description: "Brief subject heading of the diary entry.",
        isDefault: true,
        isActive: true,
        width: "w-44",
      },
      {
        id: "activityDateTime",
        key: "activityDateTime",
        label: "Date & time",
        labelHi: "दिनांक एवं समय",
        dataType: "date",
        description: "Precise timestamp when occurrence took place.",
        isDefault: true,
        isActive: true,
        width: "w-44",
      },
      {
        id: "narrative",
        key: "narrative",
        label: "Brief description",
        labelHi: "संक्षिप्त विवरण",
        dataType: "text",
        description: "Detailed factual narrative recorded in Roznamcha register.",
        isDefault: true,
        isActive: true,
        width: "min-w-[200px]",
      },
      {
        id: "action",
        key: "action",
        label: "Actions",
        labelHi: "कार्यवाही",
        dataType: "text",
        description: "Inspect details, verify signature, and print extract.",
        isDefault: true,
        isActive: true,
        width: "w-24",
      },
    ],
  },
];

const STORAGE_PREFIX = "cms_custom_table_columns_";

export const TableManagerService = {
  // Get all table configurations
  getTableConfigs(): ManagedTableConfig[] {
    return MANAGED_TABLES;
  },

  // Get table by ID
  getTableConfig(tableId: TableIdentifier): ManagedTableConfig | undefined {
    return MANAGED_TABLES.find((t) => t.id === tableId);
  },

  // Get custom columns added by user from localStorage
  getCustomColumns(tableId: TableIdentifier): ManagedColumn[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${tableId}`);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.map((col: any) => ({
          ...col,
          isDefault: false, // User columns are NEVER system default
        }));
      }
    } catch (e) {
      console.error(`Failed to load custom columns for table ${tableId}:`, e);
    }
    return [];
  },

  // Save custom columns to localStorage
  saveCustomColumns(tableId: TableIdentifier, columns: ManagedColumn[]): void {
    if (typeof window === "undefined") return;
    try {
      // Filter out any columns marked as default to prevent tampering
      const onlyCustom = columns.filter((c) => !c.isDefault);
      localStorage.setItem(`${STORAGE_PREFIX}${tableId}`, JSON.stringify(onlyCustom));
      window.dispatchEvent(
        new CustomEvent("cms_table_columns_changed", {
          detail: { tableId, count: onlyCustom.length },
        })
      );
    } catch (e) {
      console.error(`Failed to save custom columns for table ${tableId}:`, e);
    }
  },

  // Get merged list of columns (System Defaults + User Custom Columns)
  getAllColumns(tableId: TableIdentifier): ManagedColumn[] {
    const table = this.getTableConfig(tableId);
    if (!table) return [];

    const defaultCols = table.defaultColumns.map((c) => ({ ...c, isDefault: true }));
    const customCols = this.getCustomColumns(tableId);

    return [...defaultCols, ...customCols];
  },

  // Add a new custom column
  addCustomColumn(
    tableId: TableIdentifier,
    columnData: {
      label: string;
      labelHi?: string;
      key?: string;
      dataType: ColumnDataType;
      description?: string;
      defaultValue?: string;
      options?: string[];
      width?: string;
    }
  ): { success: boolean; column?: ManagedColumn; error?: string } {
    const table = this.getTableConfig(tableId);
    if (!table) {
      return { success: false, error: "Table not found" };
    }

    if (!columnData.label || !columnData.label.trim()) {
      return { success: false, error: "Column label is required" };
    }

    const cleanLabel = columnData.label.trim();
    // Auto-generate key if not given
    const generatedKey =
      columnData.key?.trim() ||
      `cust_${cleanLabel
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .slice(0, 24)}_${Date.now().toString().slice(-4)}`;

    const existingColumns = this.getAllColumns(tableId);
    const keyExists = existingColumns.some(
      (c) => c.key.toLowerCase() === generatedKey.toLowerCase()
    );

    if (keyExists) {
      return {
        success: false,
        error: `A column with key "${generatedKey}" already exists in this table.`,
      };
    }

    const newColumn: ManagedColumn = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      key: generatedKey,
      label: cleanLabel,
      labelHi: columnData.labelHi?.trim() || cleanLabel,
      dataType: columnData.dataType || "text",
      description: columnData.description?.trim() || "",
      isDefault: false, // Strict: user added
      isActive: true,
      defaultValue: columnData.defaultValue?.trim() || "",
      options: columnData.options || [],
      width: columnData.width || "min-w-[150px]",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const currentCustom = this.getCustomColumns(tableId);
    const updated = [...currentCustom, newColumn];
    this.saveCustomColumns(tableId, updated);

    return { success: true, column: newColumn };
  },

  // Edit an existing custom column (Default columns are BLOCKED)
  updateCustomColumn(
    tableId: TableIdentifier,
    columnId: string,
    updates: {
      label: string;
      labelHi?: string;
      dataType?: ColumnDataType;
      description?: string;
      defaultValue?: string;
      options?: string[];
      width?: string;
      isActive?: boolean;
    }
  ): { success: boolean; column?: ManagedColumn; error?: string } {
    const table = this.getTableConfig(tableId);
    if (!table) return { success: false, error: "Table not found" };

    // Check if column is a protected system column
    const isDefault = table.defaultColumns.some(
      (c) => c.id === columnId || c.key === columnId
    );
    if (isDefault) {
      return {
        success: false,
        error: "Default system columns are protected and cannot be edited.",
      };
    }

    const currentCustom = this.getCustomColumns(tableId);
    const colIndex = currentCustom.findIndex((c) => c.id === columnId);

    if (colIndex === -1) {
      return { success: false, error: "Custom column not found or is a system default." };
    }

    const target = currentCustom[colIndex];
    const updatedCol: ManagedColumn = {
      ...target,
      label: updates.label?.trim() || target.label,
      labelHi: updates.labelHi?.trim() || target.labelHi,
      dataType: updates.dataType || target.dataType,
      description:
        updates.description !== undefined ? updates.description.trim() : target.description,
      defaultValue:
        updates.defaultValue !== undefined
          ? updates.defaultValue.trim()
          : target.defaultValue,
      options: updates.options || target.options,
      width: updates.width || target.width,
      isActive: updates.isActive !== undefined ? updates.isActive : target.isActive,
      isDefault: false, // Ensure it stays custom
      updatedAt: new Date().toISOString(),
    };

    currentCustom[colIndex] = updatedCol;
    this.saveCustomColumns(tableId, currentCustom);

    return { success: true, column: updatedCol };
  },

  // Delete a custom column (Default columns are STRICTLY PROTECTED)
  deleteCustomColumn(
    tableId: TableIdentifier,
    columnId: string
  ): { success: boolean; error?: string } {
    const table = this.getTableConfig(tableId);
    if (!table) return { success: false, error: "Table not found" };

    // Check if system column
    const isDefault = table.defaultColumns.some(
      (c) => c.id === columnId || c.key === columnId
    );
    if (isDefault) {
      return {
        success: false,
        error: "System default columns cannot be deleted.",
      };
    }

    const currentCustom = this.getCustomColumns(tableId);
    const filtered = currentCustom.filter((c) => c.id !== columnId);

    if (filtered.length === currentCustom.length) {
      return { success: false, error: "Custom column not found." };
    }

    this.saveCustomColumns(tableId, filtered);
    return { success: true };
  },

  // Toggle active state of a custom column
  toggleCustomColumnActive(
    tableId: TableIdentifier,
    columnId: string
  ): { success: boolean; error?: string } {
    const table = this.getTableConfig(tableId);
    if (!table) return { success: false, error: "Table not found" };

    const isDefault = table.defaultColumns.some((c) => c.id === columnId);
    if (isDefault) {
      return {
        success: false,
        error: "System default columns cannot be deactivated from Table Manager.",
      };
    }

    const currentCustom = this.getCustomColumns(tableId);
    const col = currentCustom.find((c) => c.id === columnId);
    if (!col) return { success: false, error: "Custom column not found" };

    col.isActive = !col.isActive;
    this.saveCustomColumns(tableId, currentCustom);
    return { success: true };
  },
};
