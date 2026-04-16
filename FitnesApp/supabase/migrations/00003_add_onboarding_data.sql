-- 00003_add_onboarding_data.sql
-- Add onboarding_data column to the profiles table to store user settings from onboarding.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_data JSONB;

-- Update the get_profile function if it exists and needs explicit column listing, 
-- but usually RLS and simple SELECT * handle this automatically.
