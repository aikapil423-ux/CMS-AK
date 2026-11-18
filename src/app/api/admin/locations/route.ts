import { z } from 'zod';
import { apiAccess, forbidden } from '@/lib/apiSecurity';
import {
  getAllStates,
  createState,
  updateState,
  getAllRanges,
  createRange,
  updateRange,
  getAllDistricts,
  createDistrict,
  updateDistrict,
  getAllOffices,
  createOffice,
  updateOffice,
  getAllPoliceStations,
  createPoliceStation,
  updatePoliceStation,
  getAllSpecializedUnits,
  createSpecializedUnit,
  updateSpecializedUnit,
  setEntityStatus,
  deleteRange,
  deleteDistrict,
  deleteOffice,
  deletePoliceStation,
  deleteSpecializedUnit,
  deleteState,
  getOrganizationHierarchy,
  getLocationStatistics,
} from '@/services/locationMasterService';
import { getAccountDistributionStats } from '@/services/accountMasterService';

export const runtime = 'nodejs';

function isDeveloperAdmin(user: any): boolean {
  return user.id === 'cms_developer_admin' || user.role === 'SUPER_ADMIN';
}

export async function GET(req: Request) {
  const actor = await apiAccess(req);
  if (actor instanceof Response) return actor;
  if (!isDeveloperAdmin(actor)) return forbidden('Developer Administrator access required for Location Master.');

  try {
    const url = new URL(req.url);
    const view = url.searchParams.get('view');

    if (view === 'hierarchy') {
      const hierarchy = await getOrganizationHierarchy();
      return Response.json({ hierarchy });
    }

    const [states, ranges, districts, offices, policeStations, specializedUnits, hierarchy, accountStats] =
      await Promise.all([
        getAllStates(),
        getAllRanges(),
        getAllDistricts(),
        getAllOffices(),
        getAllPoliceStations(),
        getAllSpecializedUnits(),
        getOrganizationHierarchy(),
        getAccountDistributionStats().catch(() => ({ byStation: {}, byDistrict: {}, totalAccounts: 0 })),
      ]);

    const stats = await getLocationStatistics({
      perStation: accountStats.byStation,
      perDistrict: accountStats.byDistrict,
      totalAccounts: accountStats.totalAccounts,
    });

    return Response.json({
      states,
      ranges,
      districts,
      offices,
      policeStations,
      specializedUnits,
      hierarchy,
      stats,
    });
  } catch (err: any) {
    return Response.json({ error: err.message || 'Failed to fetch location master data.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const actor = await apiAccess(req);
  if (actor instanceof Response) return actor;
  if (!isDeveloperAdmin(actor)) return forbidden('Developer Administrator access required.');

  try {
    const body = await req.json();
    const { entityType, data } = body;

    if (!entityType || !data) {
      return Response.json({ error: 'entityType and data are required.' }, { status: 400 });
    }

    let created: any;
    if (entityType === 'state') {
      created = await createState(data);
    } else if (entityType === 'range') {
      created = await createRange(data);
    } else if (entityType === 'district') {
      created = await createDistrict(data);
    } else if (entityType === 'office') {
      created = await createOffice(data);
    } else if (entityType === 'station') {
      created = await createPoliceStation(data);
    } else if (entityType === 'unit') {
      created = await createSpecializedUnit(data);
    } else {
      return Response.json({ error: `Unknown entityType '${entityType}'.` }, { status: 400 });
    }

    return Response.json({ success: true, created });
  } catch (err: any) {
    return Response.json({ error: err.message || 'Failed to create location entity.' }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  const actor = await apiAccess(req);
  if (actor instanceof Response) return actor;
  if (!isDeveloperAdmin(actor)) return forbidden('Developer Administrator access required.');

  try {
    const body = await req.json();
    const { entityType, id, updates, action, status } = body;

    if (!entityType || !id) {
      return Response.json({ error: 'entityType and id are required.' }, { status: 400 });
    }

    if (action === 'toggle-status' && status) {
      const ok = await setEntityStatus(entityType, id, status);
      return Response.json({ success: ok, status });
    }

    let updated: any;
    if (entityType === 'state') {
      updated = await updateState(id, updates);
    } else if (entityType === 'range') {
      updated = await updateRange(id, updates);
    } else if (entityType === 'district') {
      updated = await updateDistrict(id, updates);
    } else if (entityType === 'office') {
      updated = await updateOffice(id, updates);
    } else if (entityType === 'station') {
      updated = await updatePoliceStation(id, updates);
    } else if (entityType === 'unit') {
      updated = await updateSpecializedUnit(id, updates);
    } else {
      return Response.json({ error: `Unknown entityType '${entityType}'.` }, { status: 400 });
    }

    return Response.json({ success: true, updated });
  } catch (err: any) {
    return Response.json({ error: err.message || 'Failed to update location entity.' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const actor = await apiAccess(req);
  if (actor instanceof Response) return actor;
  if (!isDeveloperAdmin(actor)) return forbidden('Developer Administrator access required.');

  try {
    const url = new URL(req.url);
    const entityType = url.searchParams.get('entityType');
    const id = url.searchParams.get('id');

    if (!entityType || !id) {
      return Response.json({ error: 'entityType and id query parameters are required.' }, { status: 400 });
    }

    let deleted = false;
    if (entityType === 'range') {
      deleted = await deleteRange(id);
    } else if (entityType === 'district') {
      deleted = await deleteDistrict(id);
    } else if (entityType === 'office') {
      deleted = await deleteOffice(id);
    } else if (entityType === 'station') {
      deleted = await deletePoliceStation(id);
    } else if (entityType === 'unit') {
      deleted = await deleteSpecializedUnit(id);
    } else if (entityType === 'state') {
      deleted = await deleteState(id);
    } else {
      return Response.json({ error: `Unknown entityType '${entityType}'.` }, { status: 400 });
    }

    return Response.json({ success: true, deleted, id });
  } catch (err: any) {
    return Response.json({ error: err.message || 'Failed to delete entity.' }, { status: 400 });
  }
}
