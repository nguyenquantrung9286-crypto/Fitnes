-- workout_logs: история завершений тренировок
CREATE TABLE IF NOT EXISTS public.workout_logs (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workout_id     UUID        NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    difficulty_level TEXT,
    completed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout logs"
    ON public.workout_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout logs"
    ON public.workout_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id     ON public.workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_completed_at ON public.workout_logs(completed_at);

-- points_log: история начислений баллов
CREATE TABLE IF NOT EXISTS public.points_log (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount          INTEGER     NOT NULL CHECK (amount > 0),
    reason          TEXT        NOT NULL,
    workout_log_id  UUID        REFERENCES public.workout_logs(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.points_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points"
    ON public.points_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_points_log_user_id ON public.points_log(user_id);

-- Функция-триггер: начисляет баллы при записи завершённой тренировки
CREATE OR REPLACE FUNCTION public.award_points_on_workout()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_points INTEGER;
    v_reason TEXT;
BEGIN
    v_points := CASE NEW.difficulty_level
        WHEN 'beginner'     THEN 10
        WHEN 'easy'         THEN 10
        WHEN 'medium'       THEN 20
        WHEN 'intermediate' THEN 20
        WHEN 'hard'         THEN 30
        WHEN 'advanced'     THEN 30
        ELSE 15
    END;

    v_reason := 'Тренировка завершена (' || COALESCE(NEW.difficulty_level, 'без уровня') || ')';

    INSERT INTO public.points_log (user_id, amount, reason, workout_log_id)
    VALUES (NEW.user_id, v_points, v_reason, NEW.id);

    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.award_points_on_workout() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_award_points_on_workout
    AFTER INSERT ON public.workout_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.award_points_on_workout();
