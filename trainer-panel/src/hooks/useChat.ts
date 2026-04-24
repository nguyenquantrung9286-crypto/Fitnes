"use client";

import { createClient } from "@/lib/supabase/browser";
import { useEffect, useState, useCallback } from "react";
import type { TrainerMessage } from "@/lib/types";

export function useChat(userId: string) {
  const [messages, setMessages] = useState<TrainerMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("trainer_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMessages(data ?? []);
        setLoading(false);
      });

    const channel = supabase
      .channel(`trainer_chat_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trainer_messages",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as TrainerMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const sendMessage = useCallback(
    async (content: string, trainerId: string) => {
      const supabase = createClient();

      await supabase.from("trainer_messages").insert({
        user_id: userId,
        trainer_id: trainerId,
        content,
        is_from_user: false,
      });

      // Mark user's unread messages as read
      await supabase
        .from("trainer_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("is_from_user", true)
        .is("read_at", null);

      // Send push notification to user (fire-and-forget)
      supabase.functions
        .invoke("notify-trainer-reply", { body: { user_id: userId, message_content: content } })
        .catch(() => {});
    },
    [userId]
  );

  return { messages, sendMessage, loading };
}
