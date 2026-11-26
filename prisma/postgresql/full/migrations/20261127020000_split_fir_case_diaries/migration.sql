BEGIN;

CREATE TABLE "FirCaseDiary" (
  "firId" TEXT NOT NULL REFERENCES "FirRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "id" TEXT NOT NULL,
  "position" BIGINT NOT NULL,
  "payload" JSONB NOT NULL,
  PRIMARY KEY ("firId", "id")
);

CREATE TABLE "FirCaseDiaryEvent" (
  "id" BIGSERIAL PRIMARY KEY,
  "firId" TEXT NOT NULL REFERENCES "FirRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "diaryId" TEXT NOT NULL,
  "officerId" TEXT,
  "action" TEXT NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "FirCaseDiary" ("firId", "id", "position", "payload")
SELECT fir.id, note->>'id', ordinal, note
FROM "FirRecord" fir
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(fir.payload->'caseDiaries') = 'array' THEN fir.payload->'caseDiaries' ELSE '[]'::jsonb END
) WITH ORDINALITY AS entries(note, ordinal);

UPDATE "FirRecord"
SET payload = jsonb_set(payload, '{caseDiaries}', '[]'::jsonb)
WHERE jsonb_typeof(payload->'caseDiaries') = 'array' AND (payload->'caseDiaries') <> '[]'::jsonb;

COMMIT;
