const { Client } = require('pg');

const uri = 'postgresql://postgres.asihntqqeipaxsdilkyv:superlomtik31@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

const sql = `
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Onboarding Data (23 params)
    gender TEXT,
    birth_date DATE,
    height NUMERIC,
    weight NUMERIC,
    target_weight NUMERIC,
    activity_level TEXT,
    goal TEXT,
    dietary_preferences TEXT[],
    medical_conditions TEXT[],
    equipment TEXT[],
    sleep_quality TEXT,
    water_intake NUMERIC,
    -- (Other fields can be added via JSONB for flexibility or explicitly later)
    onboarding_data JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;
`;

async function init() {
  const client = new Client({ connectionString: uri });
  try {
    await client.connect();
    console.log('Connected to DB');
    await client.query(sql);
    console.log('Schema initialized successfully!');
  } catch (err) {
    console.error('Error initializing schema:', err);
  } finally {
    await client.end();
  }
}

init();
