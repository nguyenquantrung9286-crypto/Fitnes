import { createClient } from "@/lib/supabase/server";
import { ClientList } from "@/components/clients/ClientList";
import type { ClientSummary } from "@/lib/types";

export default async function ClientsPage() {
  const supabase = await createClient();

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("plan", "pro")
    .eq("status", "active");

  const userIds = subscriptions?.map((s: { user_id: string }) => s.user_id) ?? [];

  if (userIds.length === 0) {
    return <ClientList clients={[]} />;
  }

  const [profilesRes, settingsRes, logsRes, unreadRes] = await Promise.all([
    supabase.from("profiles").select("*").in("id", userIds),
    supabase
      .from("user_settings")
      .select("user_id,goal,weight_kg,height_cm,fitness_level,activity,equipment,diet,gender,age")
      .in("user_id", userIds),
    supabase
      .from("workout_logs")
      .select("user_id,completed_at")
      .in("user_id", userIds)
      .order("completed_at", { ascending: false }),
    supabase
      .from("trainer_messages")
      .select("user_id")
      .in("user_id", userIds)
      .eq("is_from_user", true)
      .is("read_at", null),
  ]);

  const profiles = profilesRes.data ?? [];
  const settings = settingsRes.data ?? [];
  const logs = logsRes.data ?? [];
  const unreadRows = unreadRes.data ?? [];

  const settingsMap: Record<string, typeof settings[0]> = {};
  for (const s of settings) settingsMap[s.user_id] = s;

  const lastWorkout: Record<string, string> = {};
  const workoutCount: Record<string, number> = {};
  for (const log of logs) {
    if (!lastWorkout[log.user_id]) lastWorkout[log.user_id] = log.completed_at;
    workoutCount[log.user_id] = (workoutCount[log.user_id] ?? 0) + 1;
  }

  const unreadMap: Record<string, number> = {};
  for (const r of unreadRows) {
    unreadMap[r.user_id] = (unreadMap[r.user_id] ?? 0) + 1;
  }

  const clients: ClientSummary[] = profiles.map((p) => {
    const s = settingsMap[p.id] ?? {};
    return {
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      username: p.username,
      avatar_url: p.avatar_url,
      plan: "pro",
      goal: s.goal ?? null,
      weight_kg: s.weight_kg ?? null,
      height_cm: s.height_cm ?? null,
      fitness_level: s.fitness_level ?? null,
      activity: s.activity ?? null,
      equipment: s.equipment ?? null,
      diet: s.diet ?? null,
      gender: s.gender ?? null,
      age: s.age ?? null,
      last_workout_at: lastWorkout[p.id] ?? null,
      total_workouts: workoutCount[p.id] ?? 0,
      unread_messages: unreadMap[p.id] ?? 0,
      registered_at: p.created_at,
    };
  });

  return <ClientList clients={clients} />;
}
