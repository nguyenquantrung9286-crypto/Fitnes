import { supabase } from "@/lib/supabase";
import { Message } from "@/types";

export interface SendMessageResult {
  userMessage: Message;
  trainerMessage: Message | null;
}

function getAiServiceMessage(rawMessage?: string) {
  if (!rawMessage) {
    return "ИИ-тренер сейчас недоступен.";
  }

  const message = rawMessage.toLowerCase();

  if (message.includes("ai key not configured")) {
    return "ИИ-тренер не настроен: отсутствует API-ключ Polza.ai.";
  }

  if (message.includes("supabase service role is not configured")) {
    return "ИИ-тренер не настроен: отсутствует service role ключ Supabase.";
  }

  return rawMessage;
}

async function getFunctionAuthHeaders() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error("Сессия истекла. Войдите в аккаунт заново.");
  }

  return { Authorization: `Bearer ${accessToken}` };
}

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

  const headers = await getFunctionAuthHeaders();

  const { data: functionData, error: invokeError } = await supabase.functions.invoke("chat-trainer", {
    body: {
      user_id: userId,
      message: content,
    },
    headers,
  });

  const functionMessage =
    (typeof functionData === "object" &&
    functionData &&
    "error" in functionData &&
    typeof functionData.error === "string"
      ? functionData.error
      : undefined) ?? invokeError?.message;

  if (invokeError || functionMessage) {
    throw new Error(getAiServiceMessage(functionMessage));
  }

  const trainerMessage =
    typeof functionData === "object" &&
    functionData &&
    "message" in functionData &&
    functionData.message &&
    typeof functionData.message === "object"
      ? (functionData.message as Message)
      : null;

  return {
    userMessage: data as Message,
    trainerMessage,
  } as SendMessageResult;
}

export function subscribeToMessages(userId: string, onMessage: (message: Message) => void) {
  // Уникальное имя канала предотвращает ошибку
  // "cannot add postgres_changes callbacks after subscribe()"
  // которая возникает когда канал с тем же именем уже подписан
  // (например при быстром монтировании/демонтировании вкладки)
  const channelName = `messages-${userId}-${Date.now()}`;

  return supabase
    .channel(channelName)
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
