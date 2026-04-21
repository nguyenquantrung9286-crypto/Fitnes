// FitnesApp/src/services/subscriptions.ts
import { supabase } from "@/lib/supabase";

export type Plan = "free" | "standard" | "pro";

export async function fetchSubscription(userId: string): Promise<Plan> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.status === "cancelled") return "free";
  return data.plan as Plan;
}
