-- FitnesApp/supabase/migrations/00006_subscriptions.sql

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan        text        NOT NULL DEFAULT 'free'
                          CHECK (plan IN ('free', 'standard', 'pro')),
  status      text        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'cancelled')),
  expires_at  timestamptz NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Индекс для быстрого поиска по user_id
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions (user_id);

-- Автообновление updated_at
CREATE OR REPLACE FUNCTION public.update_subscriptions_updated_at()
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

REVOKE EXECUTE ON FUNCTION public.update_subscriptions_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_subscriptions_updated_at();

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Пользователь читает только свою строку
CREATE POLICY "subscriptions: user can read own"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Запись только через service_role (ручное управление администратором)
-- INSERT/UPDATE/DELETE не открываются для authenticated/anon
