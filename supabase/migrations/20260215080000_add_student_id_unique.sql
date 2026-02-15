-- ============================================================
-- Add UNIQUE constraint on profiles.student_id
-- Required for Master List CSV upsert (ON CONFLICT student_id)
-- ============================================================

-- First, clean up any duplicate student_ids (keep the newest row)
DELETE FROM public.profiles a
USING public.profiles b
WHERE a.student_id IS NOT NULL
  AND a.student_id = b.student_id
  AND a.created_at < b.created_at;

-- Now add the unique index (partial — only non-null student_ids)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_student_id_unique
  ON public.profiles (student_id)
  WHERE student_id IS NOT NULL;
