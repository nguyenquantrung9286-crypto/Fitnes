import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ChatIndexPage() {
  const supabase = await createClient();

  // Get all pro clients
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("plan", "pro")
    .eq("status", "active");

  const userIds = subscriptions?.map((s: { user_id: string }) => s.user_id) ?? [];

  if (userIds.length === 0) {
    redirect("/dashboard/clients");
  }

  // Find first client with unread messages
  const { data: unread } = await supabase
    .from("trainer_messages")
    .select("user_id")
    .in("user_id", userIds)
    .eq("is_from_user", true)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (unread && unread.length > 0) {
    redirect(`/dashboard/clients/${unread[0].user_id}/chat`);
  }

  // Fallback: first client with any message
  const { data: anyMsg } = await supabase
    .from("trainer_messages")
    .select("user_id")
    .in("user_id", userIds)
    .order("created_at", { ascending: false })
    .limit(1);

  if (anyMsg && anyMsg.length > 0) {
    redirect(`/dashboard/clients/${anyMsg[0].user_id}/chat`);
  }

  // Fallback: first pro client
  redirect(`/dashboard/clients/${userIds[0]}/chat`);
}
