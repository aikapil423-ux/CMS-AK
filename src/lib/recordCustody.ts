export type CustodyUnit = { id: string; name: string; district: string };

export type RecordTransfer = {
  id: string;
  from: CustodyUnit;
  to: CustodyUnit;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decidedBy?: string;
  decidedAt?: string;
  decisionNote?: string;
};

export interface TransferableRecord {
  custodyUnit?: CustodyUnit;
  recordTransfers?: RecordTransfer[];
}

export function currentJurisdiction(record: TransferableRecord & { policeStation?: string; district?: string }) {
  return record.custodyUnit
    ? { policeStation: record.custodyUnit.name, district: record.custodyUnit.district }
    : record;
}
