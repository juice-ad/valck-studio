-- Add AI summary columns to discovery_briefs
ALTER TABLE public.discovery_briefs
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_summary_generated_at TIMESTAMPTZ;
