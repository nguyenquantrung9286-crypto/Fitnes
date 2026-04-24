"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { UserAvatar } from "@/components/layout/Avatar";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ClientSummary } from "@/lib/types";

interface Props {
  activeClientId: string;
  clients: ClientSummary[];
  lastMsgMap: Record<string, { content: string; created_at: string }>;
  trainerId: string;
}

function MessageList({
  userId,
  trainerId,
}: {
  userId: string;
  trainerId: string;
}) {
  const { messages, sendMessage } = useChat(userId);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    await sendMessage(text, trainerId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  let lastDate = "";

  return (
    <>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {messages.map((msg) => {
          const dateStr = format(new Date(msg.created_at), "d MMMM", { locale: ru });
          const showDate = dateStr !== lastDate;
          lastDate = dateStr;
          const isTrainer = !msg.is_from_user;

          return (
            <div key={msg.id}>
              {showDate && (
                <div
                  style={{
                    textAlign: "center",
                    margin: "12px 0 8px",
                    fontSize: 12,
                    color: "#6B7280",
                  }}
                >
                  {dateStr}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: isTrainer ? "flex-end" : "flex-start",
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    maxWidth: "75%",
                    padding: "10px 14px",
                    borderRadius: isTrainer
                      ? "18px 18px 4px 18px"
                      : "18px 18px 18px 4px",
                    background: isTrainer
                      ? "linear-gradient(135deg, #5434B3, #7C3AED)"
                      : "#1E1E2E",
                    color: "#fff",
                    fontSize: 14,
                    lineHeight: 1.5,
                    border: isTrainer ? "none" : "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {msg.content}
                  <div
                    style={{
                      fontSize: 11,
                      color: isTrainer ? "rgba(255,255,255,0.55)" : "#6B7280",
                      marginTop: 4,
                      textAlign: "right",
                    }}
                  >
                    {format(new Date(msg.created_at), "HH:mm")}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "#18181B",
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
          flexShrink: 0,
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Напиши ответ... (Enter — отправить)"
          rows={1}
          style={{
            flex: 1,
            background: "#0C0C16",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            color: "#fff",
            fontSize: 14,
            padding: "10px 14px",
            outline: "none",
            resize: "none",
            fontFamily: "Inter, sans-serif",
            lineHeight: 1.5,
            maxHeight: 120,
            overflowY: "auto",
          }}
        />
        <button
          onClick={handleSend}
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            background: input.trim()
              ? "linear-gradient(to right, #5434B3, #7C3AED)"
              : "rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={input.trim() ? "#fff" : "#6B7280"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </>
  );
}

export function ChatWindow({
  activeClientId,
  clients,
  lastMsgMap,
  trainerId,
}: Props) {
  const activeClient = clients.find((c) => c.id === activeClientId);

  return (
    <div
      className="flex"
      style={{
        height: "calc(100vh - 60px - 48px)",
        minHeight: 400,
      }}
    >
      {/* Conversation list — hidden on mobile, always shown on desktop */}
      <div
        className="hidden lg:flex flex-col flex-shrink-0"
        style={{
          width: 280,
          background: "#18181B",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px 0 0 16px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 16px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Диалоги</div>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {clients.map((c) => {
            const lastMsg = lastMsgMap[c.id];
            const unread = c.unread_messages;
            const isActive = c.id === activeClientId;
            return (
              <Link
                key={c.id}
                href={`/dashboard/clients/${c.id}/chat`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    cursor: "pointer",
                    borderLeft: isActive
                      ? "3px solid #7C3AED"
                      : "3px solid transparent",
                    background: isActive ? "rgba(84,52,179,0.15)" : "transparent",
                  }}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <UserAvatar name={c.full_name ?? "?"} size={40} />
                    {unread > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: -3,
                          right: -3,
                          background: "#7C3AED",
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 700,
                          borderRadius: 99,
                          padding: "1px 5px",
                          minWidth: 16,
                          textAlign: "center",
                        }}
                      >
                        {unread}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#fff",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 130,
                        }}
                      >
                        {c.full_name}
                      </div>
                      {lastMsg && (
                        <div style={{ fontSize: 11, color: "#6B7280", flexShrink: 0 }}>
                          {format(new Date(lastMsg.created_at), "HH:mm")}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6B7280",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 170,
                      }}
                    >
                      {lastMsg?.content ?? "Нет сообщений"}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Chat panel — full width on mobile */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{
          background: "#111116",
          borderRadius: "16px",
          // on desktop: left corners are square because list panel is adjacent
          // handled via CSS below
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Header */}
        {activeClient && (
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#18181B",
              flexShrink: 0,
              borderRadius: "16px 16px 0 0",
            }}
          >
            {/* Back button — mobile only */}
            <Link
              href="/dashboard/chat"
              className="lg:hidden p-1.5 text-[#9CA3AF] hover:text-white transition-colors rounded-lg hover:bg-white/[0.06] flex-shrink-0"
              aria-label="Назад к диалогам"
            >
              <ArrowLeft size={20} />
            </Link>
            <UserAvatar name={activeClient.full_name ?? "?"} size={38} />
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                {activeClient.full_name}
              </div>
              <div style={{ fontSize: 12, color: "#A78BFA" }}>Клиент на тарифе PRO</div>
            </div>
            <Link href={`/dashboard/clients/${activeClientId}`} className="flex-shrink-0">
              <button
                style={{
                  padding: "7px 14px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent",
                  color: "#9CA3AF",
                  whiteSpace: "nowrap",
                }}
              >
                Профиль
              </button>
            </Link>
          </div>
        )}

        <MessageList userId={activeClientId} trainerId={trainerId} />
      </div>
    </div>
  );
}
