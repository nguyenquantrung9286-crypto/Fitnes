// FitnesApp/src/hooks/useSubscription.ts
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchSubscription, Plan } from "@/services/subscriptions";

export type SubscriptionFeature =
  | "history_full"       // полная история (Standard+)
  | "ai_scanner"         // AI-сканер еды (Standard+)
  | "progress_photos"    // фото прогресса (Standard+)
  | "live_trainer"       // живой тренер (Pro only)
  | "personalized_menu"; // персональное меню (Pro only)

const FEATURE_MIN_PLAN: Record<SubscriptionFeature, "standard" | "pro"> = {
  history_full:      "standard",
  ai_scanner:        "standard",
  progress_photos:   "standard",
  live_trainer:      "pro",
  personalized_menu: "pro",
};

const PLAN_RANK: Record<Plan, number> = {
  free:     0,
  standard: 1,
  pro:      2,
};

export function useSubscription() {
  const { user } = useAuth();

  const { data: plan = "free", isLoading } = useQuery<Plan>({
    queryKey: ["subscription", user?.id],
    queryFn: () => fetchSubscription(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  const canAccess = (feature: SubscriptionFeature): boolean => {
    const minPlan = FEATURE_MIN_PLAN[feature];
    return PLAN_RANK[plan] >= PLAN_RANK[minPlan];
  };

  return {
    plan,
    isLoading,
    isFree:     plan === "free",
    isStandard: plan === "standard",
    isPro:      plan === "pro",
    isPaid:     plan !== "free",
    canAccess,
  };
}
