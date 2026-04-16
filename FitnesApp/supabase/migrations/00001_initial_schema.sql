-- Migration 00001: Initial schema for FitnesApp
-- Creates base tables for the health ecosystem platform

-- =====================================================
-- PROFILES TABLE
-- Extended user profile data (linked to auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile (during registration)
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- USER SETTINGS TABLE
-- Stores the 23-parameter onboarding questionnaire
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Physical parameters
    gender TEXT,
    birth_date DATE,
    height_cm INTEGER,
    weight_kg NUMERIC(5, 1),
    body_type TEXT,
    
    -- Goals
    goal TEXT, -- weight_loss, muscle_gain, maintain
    target_weight_kg NUMERIC(5, 1),
    activity_level TEXT, -- sedentary, light, moderate, active, very_active
    
    -- Health
    health_restrictions TEXT[],
    injuries TEXT[],
    sleep_quality TEXT, -- poor, fair, good, excellent
    stress_level TEXT, -- low, moderate, high
    
    -- Fitness
    fitness_level TEXT, -- beginner, intermediate, advanced
    workout_preference TEXT, -- home, outdoor, gym, mixed
    available_equipment TEXT[],
    workouts_per_week INTEGER,
    workout_duration_min INTEGER,
    
    -- Nutrition
    dietary_preferences TEXT[],
    allergies TEXT[],
    meals_per_day INTEGER,
    water_intake_goal_ml INTEGER DEFAULT 2000,
    
    -- Calculated values
    bmi NUMERIC(4, 1),
    daily_calories INTEGER,
    daily_protein_g INTEGER,
    daily_carbs_g INTEGER,
    daily_fat_g INTEGER,
    
    -- Onboarding
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own settings
CREATE POLICY "Users can manage own settings"
    ON public.user_settings FOR ALL
    USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);

-- =====================================================
-- WORKOUTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    workout_type TEXT, -- strength, cardio, flexibility, mixed
    duration_min INTEGER,
    difficulty_level TEXT, -- easy, medium, hard
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workouts"
    ON public.workouts FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX idx_workouts_scheduled ON public.workouts(scheduled_at);

-- =====================================================
-- EXERCISES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    sets INTEGER,
    reps INTEGER,
    duration_sec INTEGER,
    rest_sec INTEGER,
    weight_kg NUMERIC(5, 1),
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage exercises in their workouts"
    ON public.exercises FOR ALL
    USING (
        auth.uid() = (SELECT user_id FROM public.workouts WHERE id = exercises.workout_id)
    );

CREATE INDEX idx_exercises_workout_id ON public.exercises(workout_id);

-- =====================================================
-- NUTRITION LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.nutrition_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    food_name TEXT NOT NULL,
    photo_url TEXT,
    calories INTEGER,
    protein_g NUMERIC(5, 1),
    carbs_g NUMERIC(5, 1),
    fat_g NUMERIC(5, 1),
    portion_size TEXT,
    meal_type TEXT, -- breakfast, lunch, dinner, snack
    logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.nutrition_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own nutrition log"
    ON public.nutrition_log FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX idx_nutrition_log_user_id ON public.nutrition_log(user_id);
CREATE INDEX idx_nutrition_log_date ON public.nutrition_log(logged_at);

-- =====================================================
-- PROGRESS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.progress_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    weight_kg NUMERIC(5, 1),
    body_fat_pct NUMERIC(4, 1),
    muscle_kg NUMERIC(5, 1),
    photo_before_url TEXT,
    photo_after_url TEXT,
    notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.progress_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress"
    ON public.progress_entries FOR ALL
    USING (auth.uid() = user_id);

CREATE INDEX idx_progress_user_id ON public.progress_entries(user_id);
CREATE INDEX idx_progress_date ON public.progress_entries(recorded_at);

-- =====================================================
-- MESSAGES TABLE (user ↔ trainer communication)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    is_from_user BOOLEAN NOT NULL DEFAULT true,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own messages"
    ON public.messages FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = trainer_id);

CREATE POLICY "Users can send messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Trainers can reply"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = trainer_id);

CREATE INDEX idx_messages_user_id ON public.messages(user_id);
CREATE INDEX idx_messages_trainer_id ON public.messages(trainer_id);
CREATE INDEX idx_messages_date ON public.messages(created_at);

-- =====================================================
-- FUNCTION: Auto-create profile on signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Revoke direct execute on trigger function
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;

-- =====================================================
-- FUNCTION: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Apply to profiles
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Apply to user_settings
CREATE TRIGGER set_updated_at_user_settings
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Apply to workouts
CREATE TRIGGER set_updated_at_workouts
    BEFORE UPDATE ON public.workouts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
