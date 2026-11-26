CREATE FUNCTION sync_cms_location_masters() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "LocationState" (id, code, name, status, details)
  SELECT r->>'id', r->>'code', r->>'name', r->>'status', r
  FROM jsonb_array_elements(NEW.payload->'states') r
  ON CONFLICT (id) DO UPDATE SET code=EXCLUDED.code, name=EXCLUDED.name, status=EXCLUDED.status, details=EXCLUDED.details;

  INSERT INTO "LocationRange" (id, code, name, status, "stateId", details)
  SELECT r->>'id', r->>'code', r->>'name', r->>'status', r->>'stateId', r
  FROM jsonb_array_elements(NEW.payload->'ranges') r
  ON CONFLICT (id) DO UPDATE SET code=EXCLUDED.code, name=EXCLUDED.name, status=EXCLUDED.status, "stateId"=EXCLUDED."stateId", details=EXCLUDED.details;

  INSERT INTO "District" (id, code, name, status, "rangeId", details)
  SELECT r->>'id', r->>'code', r->>'name', r->>'status', r->>'rangeId', r
  FROM jsonb_array_elements(NEW.payload->'districts') r
  ON CONFLICT (id) DO UPDATE SET code=EXCLUDED.code, name=EXCLUDED.name, status=EXCLUDED.status, "rangeId"=EXCLUDED."rangeId", details=EXCLUDED.details;

  INSERT INTO "LocationPoliceStation" (id, code, name, status, "districtId", details)
  SELECT r->>'id', r->>'code', r->>'name', r->>'status', r->>'districtId', r
  FROM jsonb_array_elements(NEW.payload->'policeStations') r
  ON CONFLICT (id) DO UPDATE SET code=EXCLUDED.code, name=EXCLUDED.name, status=EXCLUDED.status, "districtId"=EXCLUDED."districtId", details=EXCLUDED.details;

  DELETE FROM "LocationPoliceStation" s WHERE NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(NEW.payload->'policeStations') r WHERE r->>'id' = s.id
  );
  DELETE FROM "District" d WHERE NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(NEW.payload->'districts') r WHERE r->>'id' = d.id
  );
  DELETE FROM "LocationRange" g WHERE NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(NEW.payload->'ranges') r WHERE r->>'id' = g.id
  );
  DELETE FROM "LocationState" s WHERE NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(NEW.payload->'states') r WHERE r->>'id' = s.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_cms_location_masters
AFTER INSERT OR UPDATE OF payload ON "ImportedJsonDocument"
FOR EACH ROW WHEN (NEW.path = 'locations-master-store.json')
EXECUTE FUNCTION sync_cms_location_masters();
