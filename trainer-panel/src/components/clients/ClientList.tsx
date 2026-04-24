"use client";

import { useState } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/layout/Avatar";
import { differenceInDays } from "date-fns";
import type { ClientSummary } from "@/lib/types";

function daysSince(iso: string | null): string {
  if (!iso) return "—";
  const d = differenceInDays(new Date(), new Date(iso));
  if (d === 0) return "сегодня";
  if (d === 1) return "вчера";
  return `${d} дн. назад`;
}

function ClientCard({ client }: { client: ClientSummary }) {
  return (
    <div
      style={{
        background: "#18181B",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20,
        padding: 20,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <UserAvatar name={client.full_name ?? "?"} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {client.full_name}
            </div>
            <span
              style={{
                background: "rgba(124,58,237,0.2)",
                color: "#A78BFA",
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 99,
                padding: "3px 10px",
                border: "1px solid rgba(124,58,237,0.3)",
                flexShrink: 0,
                marginLeft: 6,
              }}
            >
              PRO
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {client.email}
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingTop: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px 0",
            fontSize: 13,
          }}
        >
          <div>
            <span style={{ color: "#6B7280" }}>Цель: </span>
            <span style={{ color: "#e5e7eb" }}>{client.goal ?? "—"}</span>
          </div>
          <div>
            <span style={{ color: "#6B7280" }}>Уровень: </span>
            <span style={{ color: "#e5e7eb" }}>{client.fitness_level ?? "—"}</span>
          </div>
          <div>
            <span style={{ color: "#6B7280" }}>Вес: </span>
            <span style={{ color: "#e5e7eb" }}>
              {client.weight_kg ? `${client.weight_kg} кг` : "—"}
            </span>
          </div>
          <div>
            <span style={{ color: "#6B7280" }}>Рост: </span>
            <span style={{ color: "#e5e7eb" }}>
              {client.height_cm ? `${client.height_cm} см` : "—"}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingTop: 12,
          marginBottom: 14,
          fontSize: 13,
        }}
      >
        <div style={{ color: "#9CA3AF" }}>
          Последняя тренировка:{" "}
          <span style={{ color: client.last_workout_at ? "#e5e7eb" : "#FF5656" }}>
            {daysSince(client.last_workout_at)}
          </span>
        </div>
        <div style={{ color: "#9CA3AF", marginTop: 4 }}>
          Тренировок всего:{" "}
          <span style={{ color: "#e5e7eb" }}>{client.total_workouts}</span>
          {client.unread_messages > 0 && (
            <span
              style={{
                marginLeft: 10,
                background: "#7C3AED",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 99,
                padding: "1px 8px",
              }}
            >
              {client.unread_messages} непрочитанных
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Link href={`/dashboard/clients/${client.id}`} style={{ flex: 1 }}>
          <button
            style={{
              width: "100%",
              padding: "9px 0",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent",
              color: "#e5e7eb",
            }}
          >
            Профиль
          </button>
        </Link>
        <Link href={`/dashboard/clients/${client.id}/chat`} style={{ flex: 1 }}>
          <button
            style={{
              width: "100%",
              padding: "9px 0",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              background: "linear-gradient(to right, #5434B3, #7C3AED)",
              color: "#fff",
            }}
          >
            Написать
          </button>
        </Link>
      </div>
    </div>
  );
}

export function ClientList({ clients }: { clients: ClientSummary[] }) {
  const [search, setSearch] = useState("");
  const filtered = clients.filter(
    (c) =>
      (c.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header — stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#fff" }}>Клиенты</div>
          <span
            style={{
              background: "rgba(124,58,237,0.2)",
              color: "#A78BFA",
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 99,
              padding: "4px 12px",
              border: "1px solid rgba(124,58,237,0.3)",
            }}
          >
            {clients.length} PRO
          </span>
        </div>
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#6B7280",
              pointerEvents: "none",
            }}
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени или email..."
            style={{
              background: "#18181B",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "#fff",
              fontSize: 14,
              padding: "10px 14px 10px 36px",
              outline: "none",
              width: "100%",
            }}
          />
        </div>
      </div>

      {/* Cards grid — 1 col mobile, 2 col tablet, 3 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <ClientCard key={c.id} client={c} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: "#6B7280",
            fontSize: 14,
          }}
        >
          Клиенты не найдены
        </div>
      )}
    </div>
  );
}
