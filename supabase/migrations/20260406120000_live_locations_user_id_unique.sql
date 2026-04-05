-- Upserts from the app use ON CONFLICT (user_id). Postgres requires a UNIQUE constraint on user_id.
-- If this migration was never applied (or duplicates accumulated), upsert fails with:
-- "there is no unique or exclusion constraint matching the ON CONFLICT specification"

-- Remove duplicate user_id rows so UNIQUE(user_id) can be added (keep latest fix per user).
DELETE FROM public.live_locations
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id
        ORDER BY timestamp DESC NULLS LAST, created_at DESC NULLS LAST
      ) AS rn
    FROM public.live_locations
  ) ranked
  WHERE ranked.rn > 1
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.live_locations'::regclass
      AND conname = 'live_locations_user_id_unique'
  ) THEN
    ALTER TABLE public.live_locations
      ADD CONSTRAINT live_locations_user_id_unique UNIQUE (user_id);
  END IF;
END $$;
