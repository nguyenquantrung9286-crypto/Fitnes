CREATE TABLE IF NOT EXISTS public.weight_log (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    value_kg    NUMERIC(5,2) NOT NULL CHECK (value_kg > 0),
    measured_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

ALTER TABLE public.weight_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weight log"
    ON public.weight_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight log"
    ON public.weight_log FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_weight_log_user_id     ON public.weight_log(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_log_measured_at ON public.weight_log(measured_at);
