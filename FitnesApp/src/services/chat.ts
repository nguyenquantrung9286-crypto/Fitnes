import { supabase } from "@/lib/supabase";
import { Message } from "@/types";

export async function getMessages(userId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Message[];
}

export async function sendMessage(userId: string, content: string) {
  const { data, error } = await supabase
    .from("messages")
    .insert([
      {
        user_id: userId,
        content: content,
        is_from_user: true,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Message;
}

export function subscribeToMessages(userId: string, onMessage: (message: Message) => void) {
  return supabase
    .channel(`public:messages:user_id=eq.${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onMessage(payload.new as Message);
      }
    )
    .subscribe();
}
