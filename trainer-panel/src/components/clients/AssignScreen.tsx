"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import type { Workout } from "@/lib/types";

const TYPE_COLORS: Record<string, string> = {
  Силовая: "#A78BFA",
  Кардио: "#3DD87A",
  Гибкость: "#60A5FA",
  Функциональная: "#FBBF24",
};

interface Props {
  clientId: string;
  clientName: string;
  trainerId: string;
  workouts: Workout[];
}

export function AssignScreen({ clientId, clientName, trainerId, workouts }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const assign = async () => {
    if (!selected) return;
    setLoading(true);
    const supabase = createClient();
    const template = workouts.find((w) => w.id === selected);
    if (!template) return;

    const { data: newWorkout, error } = await supabase
      .from("workouts")
      .insert({
        user_id: clientId,
        name: template.name,
        description: template.description,
        workout_type: template.workout_type,
        duration_min: template.duration_min,
        difficulty_level: template.difficulty_level,
        scheduled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !newWorkout) {
      setLoading(false);
      alert("Ошибка при назначении тренировки");
      return;
    }

    await supabase.from("assigned_workouts").insert({
      user_id: clientId,
      trainer_id: trainerId,
      workout_id: newWorkout.id,
      note: note || null,
    });

    setLoading(false);
    setSuccess(true);
    setTimeout(() => {
      router.push(`/dashboard/clients/${clientId}`);
    }, 1500);
  };

  if (success) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
            Тренировка назначена!
          </div>
          <div style={{ fontSize: 14, color: "#6B7280" }}>
            Переходим к профилю клиента…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
        Назначить тренировку
      </div>
      <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
        Клиент: <span style={{ color: "#A78BFA" }}>{clientName}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {workouts.map((w) => {
          const typeColor = TYPE_COLORS[w.workout_type ?? ""] ?? "#6B7280";
          const isSelected = selected === w.id;
          return (
            <div
              key={w.id}
              onClick={() => setSelected(w.id)}
              style={{
                background: "#18181B",
                borderRadius: 14,
                padding: "16px 20px",
                cursor: "pointer",
                border: isSelected
                  ? "1px solid #7C3AED"
                  : "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isSelected
                    ? "rgba(124,58,237,0.2)"
                    : "rgba(255,255,255,0.04)",
                  border: isSelected
                    ? "1px solid rgba(124,58,237,0.3)"
                    : "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isSelected ? "#A78BFA" : "#6B7280"}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M6 4v16M18 4v16M6 12h12M3 8h3M18 8h3M3 16h3M18 16h3" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{w.name}</div>
                {w.description && (
                  <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
                    {w.description}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {w.workout_type && (
                  <span
                    style={{
                      fontSize: 12,
                      borderRadius: 99,
                      padding: "3px 10px",
                      background: `${typeColor}20`,
                      color: typeColor,
                      border: `1px solid ${typeColor}40`,
                    }}
                  >
                    {w.workout_type}
                  </span>
                )}
                {w.duration_min && (
                  <span style={{ fontSize: 12, color: "#6B7280" }}>
                    {w.duration_min} мин
                  </span>
                )}
                {w.difficulty_level && (
                  <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                    {w.difficulty_level}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              fontSize: 13,
              color: "#9CA3AF",
              display: "block",
              marginBottom: 8,
            }}
          >
            Заметка для клиента (необязательно)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Например: выполни в среду, следи за техникой приседаний…"
            rows={3}
            style={{
              width: "100%",
              background: "#18181B",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "#fff",
              fontSize: 14,
              padding: "12px 14px",
              outline: "none",
              resize: "none",
              fontFamily: "Inter, sans-serif",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => router.push(`/dashboard/clients/${clientId}`)}
          style={{
            padding: "12px 24px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent",
            color: "#9CA3AF",
          }}
        >
          Отмена
        </button>
        <button
          onClick={assign}
          disabled={!selected || loading}
          style={{
            padding: "12px 32px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            cursor: selected && !loading ? "pointer" : "not-allowed",
            border: "none",
            background:
              selected && !loading
                ? "linear-gradient(to right, #5434B3, #7C3AED)"
                : "rgba(255,255,255,0.08)",
            color: selected && !loading ? "#fff" : "#6B7280",
          }}
        >
          {loading ? "Назначаю…" : "Назначить тренировку"}
        </button>
      </div>
    </div>
  );
}
