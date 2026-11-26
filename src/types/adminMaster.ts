export type MasterEntityStatus = 'ACTIVE' | 'INACTIVE' | 'DECOMMISSIONED';

export interface MasterState {
  id: string;
  name: string;
  code: string;
  stateHeadquarters: string;
  phqName: string;
  phqAddress: string;
  dgpOffice: string;
  status: MasterEntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MasterRange {
  id: string;
  name: string;
  code: string;
  stateId: string;
  stateName: string;
  rangeHeadquarters: string;
  igOffice: string;
  digOffice?: string;
  address: string;
  status: MasterEntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MasterDistrict {
  id: string;
  name: string;
  code: string;
  stateId: string;
  stateName: string;
  rangeId: string;
  rangeName: string;
  districtHeadquarters: string;
  spOffice: string;
  spOfficeAddress: string;
  contactPhone: string;
  email: string;
  status: MasterEntityStatus;
  createdAt: string;
  updatedAt: string;
}

export type OfficeType =
  | 'PHQ'
  | 'IG_OFFICE'
  | 'DIG_OFFICE'
  | 'SP_OFFICE'
  | 'ASP_OFFICE'
  | 'DSP_OFFICE'
  | 'CRIME_BRANCH'
  | 'COMMISSIONERATE_HQ'
  | 'TRAFFIC_HQ'
  | 'ADMINISTRATIVE_OFFICE';

export interface MasterOffice {
  id: string;
  name: string;
  code: string;
  officeType: OfficeType;
  parentOfficeId?: string;
  parentOfficeName?: string;
  stateId: string;
  stateName: string;
  rangeId?: string;
  rangeName?: string;
  districtId?: string;
  districtName?: string;
  physicalAddress: string;
  officeHead: string;
  contactPhone?: string;
  status: MasterEntityStatus;
  createdAt: string;
  updatedAt: string;
}

export type StationType =
  | 'URBAN'
  | 'RURAL'
  | 'SEMI_URBAN'
  | 'HIGHWAY'
  | 'INDUSTRIAL'
  | 'WOMEN'
  | 'CYBER'
  | 'TRAFFIC'
  | 'RAILWAY';

export interface MasterPoliceStation {
  id: string;
  name: string;
  code: string;
  stateId: string;
  stateName: string;
  rangeId: string;
  rangeName: string;
  districtId: string;
  districtName: string;
  subDivision?: string;
  stationType: StationType;
  address: string;
  shoOfficeDetails: string;
  contactPhone: string;
  email?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
  status: MasterEntityStatus;
  createdAt: string;
  updatedAt: string;
}

export type UnitType =
  | 'CIA'
  | 'CID'
  | 'CRIME_BRANCH'
  | 'CYBER_CELL'
  | 'TRAFFIC'
  | 'SPECIAL_INVESTIGATION_UNIT'
  | 'ECONOMIC_OFFENCES_WING'
  | 'WOMEN_CELL'
  | 'SPECIAL_BRANCH'
  | 'MHC_STORE'
  | 'ABVT'
  | 'ANC'
  | 'AVT'
  | 'MISSING_PERSON_CELL'
  | 'Missing Person Cell'
  | 'PO_STAFF'
  | 'PO Staff'
  | 'DOG_SQUAD'
  | 'BOMB_DETECTION'
  | 'FORENSIC_MOBILE_UNIT'
  | 'OTHER_UNIT'
  | 'OTHER';

export interface MasterSpecializedUnit {
  id: string;
  name: string;
  code: string;
  unitType: UnitType;
  parentOfficeId?: string;
  parentOfficeName?: string;
  stateId: string;
  stateName: string;
  rangeId?: string;
  rangeName?: string;
  districtId?: string;
  districtName?: string;
  associatedPoliceStationId?: string;
  associatedPoliceStationName?: string;
  physicalLocation: string;
  unitHead: string;
  contactPhone?: string;
  status: MasterEntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface HierarchyTreeNode {
  id: string;
  name: string;
  code: string;
  type:
    | 'STATE'
    | 'RANGE'
    | 'DISTRICT'
    | 'OFFICE'
    | 'POLICE_STATION'
    | 'UNIT'
    | 'COMMISSIONERATE'
    | 'ZONE'
    | 'BATTALION'
    | 'WING';
  status: MasterEntityStatus;
  details?: string;
  badge?: string; // e.g. "CORE"
  isOffice?: boolean; // shows "Office" tag
  category?: string;
  children?: HierarchyTreeNode[];
}

export interface LocationStatistics {
  totalStates: number;
  totalRanges: number;
  totalDistricts: number;
  totalOffices: number;
  totalPoliceStations: number;
  totalSpecializedUnits: number;
  totalActiveAccounts: number;
  districtsUnderRange: Record<string, number>;
  stationsUnderDistrict: Record<string, number>;
  officesUnderDistrict: Record<string, number>;
  unitsUnderDistrict: Record<string, number>;
  accountsPerStation: Record<string, number>;
  accountsPerDistrict: Record<string, number>;
}

/* =========================================================================
   ACCOUNT MANAGEMENT TYPES
   ========================================================================= */

export type AccountRole =
  | 'DGP'
  | 'ADGP'
  | 'IG'
  | 'DIG'
  | 'CP'
  | 'JOINT_CP'
  | 'DCP'
  | 'ADDL_DCP'
  | 'ACP'
  | 'COMMISSIONERATE_SHO'
  | 'COMMISSIONERATE_SI'
  | 'COMMISSIONERATE_ASI'
  | 'COMMISSIONERATE_HC'
  | 'COMMISSIONERATE_CONSTABLE'
  | 'COMMISSIONERATE_MHC'
  | 'COMMISSIONERATE_STAFF'
  | 'COMMISSIONERATE_AUDITOR'
  | 'COMMANDANT_ARMED'
  | 'ADDL_COMMANDANT'
  | 'ASST_COMMANDANT'
  | 'ARMED_INSPECTOR'
  | 'ARMED_SI'
  | 'ARMED_ASI'
  | 'ARMED_MHC'
  | 'ARMED_HC'
  | 'ARMED_CONSTABLE'
  | 'TRAINING_DIRECTOR'
  | 'TRAINING_PRINCIPAL'
  | 'TRAINING_INSTRUCTOR'
  | 'TRAINING_MHC'
  | 'TRAINING_HC'
  | 'TRAINING_CONSTABLE'
  | 'SPECIAL_UNIT_SP'
  | 'SPECIAL_UNIT_DSP'
  | 'SPECIAL_UNIT_INSPECTOR'
  | 'SPECIAL_UNIT_SI'
  | 'SPECIAL_UNIT_ASI'
  | 'SPECIAL_UNIT_IO'
  | 'SPECIAL_UNIT_MHC'
  | 'SPECIAL_UNIT_HC'
  | 'SPECIAL_UNIT_CONSTABLE'
  | 'SPECIAL_UNIT_STAFF'
  | 'SPECIAL_UNIT_AUDITOR'
  | 'SP_DISTRICT'
  | 'ASP'
  | 'DSP_SUBDIV'
  | 'INSPECTOR'
  | 'SHO'
  | 'SI'
  | 'ASI'
  | 'ENQUIRY_OFFICER'
  | 'MHC_GD_INCHARGE'
  | 'MM'
  | 'HEAD_CONSTABLE'
  | 'CONSTABLE'
  | 'STATION_STAFF'
  | 'VIEWER_AUDITOR'
  | 'SUPER_ADMIN';

export type JurisdictionType =
  | 'STATE_WIDE'
  | 'RANGE_WIDE'
  | 'DISTRICT_WIDE'
  | 'COMMISSIONERATE_WIDE'
  | 'ZONE_WIDE'
  | 'SUBDIVISION_MULTI_STATION'
  | 'SINGLE_STATION'
  | 'SPECIAL_MULTI_STATION'
  | 'BATTALION_WIDE'
  | 'TRAINING_CAMPUS_WIDE'
  | 'OFFICE_BOUND'
  | 'UNIT_BOUND';

export interface SpecialStationAllocation {
  id: string;
  districtId: string;
  districtName: string;
  policeStationIds: string[];
  policeStationNames: string[];
  assignmentReason: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  grantedByPno: string;
  createdAt: string;
}

export type AssignedUnitType =
  | 'PHQ'
  | 'RANGE_OFFICE'
  | 'DISTRICT_OFFICE'
  | 'POLICE_STATION'
  | 'INVESTIGATION_UNIT'
  | 'MHC_STORE'
  | 'COMMISSIONERATE_HQ'
  | 'ARMED_BATTALION'
  | 'GRP_STATION'
  | 'TRAINING_CENTRE'
  | 'FORENSIC_LAB'
  | 'SPECIALIZED_UNIT'
  | 'DEPUTATION_UNIT'
  | 'OTHER';

export interface MasterAccount {
  id: string;
  username: string; // PNO / Login ID
  pno: string;
  beltNumber?: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  designation: string;
  rank: string;
  rankDisplay: string;
  role: AccountRole;
  roleDisplay: string;
  assignedUnitType: AssignedUnitType;
  assignedUnitId: string;
  assignedUnitName: string;
  state: string;
  range: string;
  district: string;
  zone?: string;
  authorizedDistricts?: string[];
  policeStation: string;
  authorizedPoliceStations?: string[];
  jurisdictionType: JurisdictionType;
  specialAllocations?: SpecialStationAllocation[];
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  passwordHash?: string;
  plainPinSample?: string; // Only stored in demo/dev mode for quick 1-click test
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountAuditLog {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DEACTIVATE' | 'ACTIVATE' | 'RESET_PASSWORD' | 'SPECIAL_ALLOCATION' | 'PERMISSION_CHANGE' | 'DELETE';
  performedByPno: string;
  performedByName: string;
  targetAccountId: string;
  targetUsername: string;
  details: string;
  previousSnapshot?: Partial<MasterAccount>;
  newSnapshot?: Partial<MasterAccount>;
}
