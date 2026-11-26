UPDATE "User"
SET "role" = 'ENQUIRY_OFFICER'
WHERE "role" IN ('DUTY_OFFICER', 'SPECIAL_UNIT_DUTY_OFFICER');

UPDATE "ImportedJsonDocument" AS document
SET payload = jsonb_set(document.payload, '{accounts}', (
  SELECT jsonb_agg(
    CASE WHEN account->>'role' IN ('DUTY_OFFICER', 'SPECIAL_UNIT_DUTY_OFFICER') THEN
      account || jsonb_build_object(
        'role', 'ENQUIRY_OFFICER',
        'designation', 'Investigating Officer (IO)',
        'roleDisplay', 'Investigating Officer (IO)',
        'rankDisplay', COALESCE(NULLIF(regexp_replace(account->>'rankDisplay', '\s*\(Duty Officer[^)]*\)', '', 'i'), ''), account->>'rank')
      )
    ELSE account END ORDER BY position
  )
  FROM jsonb_array_elements(document.payload->'accounts') WITH ORDINALITY AS entry(account, position)
))
WHERE document.path = 'accounts-master-store.json'
  AND (document.payload->'accounts') @? '$[*] ? (@.role == "DUTY_OFFICER" || @.role == "SPECIAL_UNIT_DUTY_OFFICER")';
