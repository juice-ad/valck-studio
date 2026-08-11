-- ============================================
-- Migration 017: wekelijkse "drop" op project-updates
-- ============================================
-- De wekelijkse "dit is er deze week gebouwd"-drop is de sterkste terugkeer-
-- trigger (Linear-changelog-patroon). We hergebruiken project_updates met een
-- type ('update' | 'drop') en een optionele link (Loom/preview). Additief.

ALTER TABLE public.project_updates
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'update'
    CHECK (kind IN ('update', 'drop')),
  ADD COLUMN IF NOT EXISTS link text;
