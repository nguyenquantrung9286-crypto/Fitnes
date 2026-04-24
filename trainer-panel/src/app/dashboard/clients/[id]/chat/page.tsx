import { createClient } from "@/lib/supabase/server";
import { ChatWindow } from "@/components/chat/ChatWindow";
import type { ClientSummary } from "@/lib/types";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get all pro clients with messages
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("plan", "pro")
    .eq("status", "active");

  const userIds = subscriptions?.map((s: { user_id: string }) => s.user_id) ?? [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  const { data: unreadRows } = await supabase
    .from("trainer_messages")
    .select("user_id")
    .in("user_id", userIds)
    .eq("is_from_user", true)
    .is("read_at", null);

  const unreadMap: Record<string, number> = {};
  for (const r of unreadRows ?? []) {
    unreadMap[r.user_id] = (unreadMap[r.user_id] ?? 0) + 1;
  }

  const { data: lastMsgs } = await supabase
    .from("trainer_messages")
    .select("user_id, content, created_at, is_from_user")
    .in("user_id", userIds)
    .order("created_at", { ascending: false });

  const seenUsers = new Set<string>();
  const lastMsgMap: Record<string, { content: string; created_at: string }> = {};
  for (const m of lastMsgs ?? []) {
    if (!seenUsers.has(m.user_id)) {
      seenUsers.add(m.user_id);
      lastMsgMap[m.user_id] = m;
    }
  }

  const clients: ClientSummary[] = (profiles ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    full_name: p.full_name,
    username: null,
    avatar_url: null,
    plan: "pro" as const,
    goal: null,
    weight_kg: null,
    height_cm: null,
    fitness_level: null,
    activity: null,
    equipment: null,
    diet: null,
    gender: null,
    age: null,
    last_workout_at: null,
    total_workouts: 0,
    unread_messages: unreadMap[p.id] ?? 0,
    registered_at: null,
  }));

  // Sort by unread then by last message
  clients.sort((a, b) => {
    if (b.unread_messages !== a.unread_messages)
      return b.unread_messages - a.unread_messages;
    const ta = lastMsgMap[a.id]?.created_at ?? "";
    const tb = lastMsgMap[b.id]?.created_at ?? "";
    return tb.localeCompare(ta);
  });

  return (
    <ChatWindow
      activeClientId={id}
      clients={clients}
      lastMsgMap={lastMsgMap}
      trainerId={user.id}
    />
  );
}
