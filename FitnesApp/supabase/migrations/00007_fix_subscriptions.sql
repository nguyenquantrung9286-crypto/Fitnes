-- Fix 1: Remove redundant index (UNIQUE constraint already creates one)
DROP INDEX IF EXISTS public.subscriptions_user_id_idx;

-- Fix 3 (part a): Drop old trigger first so we can drop its function
DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;

-- Fix 2: Drop old trigger function (used REVOKE EXECUTE instead of REVOKE ALL)
DROP FUNCTION IF EXISTS public.update_subscriptions_updated_at();

-- Fix 3 (part b): Reuse shared handle_updated_at() trigger function
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
