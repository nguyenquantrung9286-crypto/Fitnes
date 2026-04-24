import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UserAvatar } from "@/components/layout/Avatar";
import { WeightChart } from "@/components/charts/WeightChart";
import { WorkoutActivityChart } from "@/components/charts/WorkoutActivityChart";
import { ProgressPhotoGallery } from "@/components/photos/ProgressPhotoGallery";
import { format, differenceInDays } from "date-fns";
import { ru } from "date-fns/locale";

function daysSince(iso: string | null): string {
  if (!iso) return "—";
  const d = differenceInDays(new Date(), new Date(iso));
  if (d === 0) return "сегодня";
  if (d === 1) return "вчера";
  return `${d} дн. назад`;
}

function bmi(w: number | null, h: number | null): string {
  if (!w || !h) return "—";
  return (w / (h / 100) ** 2).toFixed(1);
}

function levelColor(level: string | null) {
  if (level === "Продвинутый") return { bg: "rgba(124,58,237,0.15)", text: "#A78BFA" };
  if (level === "Средний") return { bg: "rgba(61,216,122,0.1)", text: "#3DD87A" };
  return { bg: "rgba(107,114,128,0.15)", text: "#9CA3AF" };
}

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [profileRes, settingsRes, weightRes, logsRes, photosRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase.from("user_settings").select("*").eq("user_id", id).single(),
    supabase
      .from("weight_log")
      .select("*")
      .eq("user_id", id)
      .order("measured_at", { ascending: true })
      .limit(90),
    supabase
      .from("workout_logs")
      .select("*, workout:workouts(name,duration_min)")
      .eq("user_id", id)
      .order("completed_at", { ascending: false })
      .limit(20),
    supabase
      .from("progress_photos")
      .select("*")
      .eq("user_id", id)
      .order("taken_at", { ascending: false })
      .limit(12),
  ]);

  if (!profileRes.data) notFound();

  const profile = profileRes.data;
  const settings = settingsRes.data;
  const weightData = (weightRes.data ?? []).map((e: { measured_at: string; value_kg: number }) => ({
    date: format(new Date(e.measured_at), "d MMM", { locale: ru }),
    weight: Number(e.value_kg),
  }));

  // Activity: group workout_logs by day of week for last 7 days
  const today = new Date();
  const dayLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const activityData = dayLabels.map((day, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1) + i);
    const dStr = d.toISOString().slice(0, 10);
    const count = (logsRes.data ?? []).filter((l: { completed_at: string }) =>
      l.completed_at.startsWith(dStr)
    ).length;
    return { date: day, count };
  });

  const totalWorkouts = (logsRes.data ?? []).length;
  const lastWorkout = (logsRes.data ?? [])[0]?.completed_at ?? null;

  // Signed URLs for photos
  const photos = await Promise.all(
    (photosRes.data ?? []).map(async (p: { id: string; user_id: string; photo_path: string; taken_at: string; note: string | null }) => {
      const { data } = await supabase.storage
        .from("progress-photos")
        .createSignedUrl(p.photo_path, 3600);
      return { ...p, signedUrl: data?.signedUrl };
    })
  );

  const paramTiles = [
    { label: "Пол", value: settings?.gender ?? "—" },
    { label: "Возраст", value: settings?.age ? `${settings.age} лет` : "—" },
    { label: "Рост", value: settings?.height_cm ? `${settings.height_cm} см` : "—" },
    { label: "Вес", value: settings?.weight_kg ? `${settings.weight_kg} кг` : "—" },
    { label: "ИМТ", value: bmi(settings?.weight_kg, settings?.height_cm) },
  ];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          background: "#18181B",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20,
          padding: 24,
          marginBottom: 16,
        }}
      >
        {/* Avatar + name row, buttons below on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <UserAvatar name={profile.full_name ?? "?"} size={72} />
            <div className="flex-1 min-w-0">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>
                  {profile.full_name}
                </div>
                <span
                  style={{
                    background: "rgba(124,58,237,0.2)",
                    color: "#A78BFA",
                    fontSize: 12,
                    fontWeight: 700,
                    borderRadius: 99,
                    padding: "3px 12px",
                    border: "1px solid rgba(124,58,237,0.3)",
                    flexShrink: 0,
                  }}
                >
                  PRO
                </span>
              </div>
              <div style={{ fontSize: 14, color: "#6B7280" }}>{profile.email}</div>
              {profile.created_at && (
                <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
                  Зарегистрирован:{" "}
                  {format(new Date(profile.created_at), "d MMMM yyyy", { locale: ru })}
                </div>
              )}
            </div>
          </div>
          {/* Action buttons — full-width row on mobile, inline on desktop */}
          <div className="flex gap-2.5 sm:flex-shrink-0">
            <Link href={`/dashboard/clients/${id}/chat`} className="flex-1 sm:flex-none">
              <button
                style={{
                  width: "100%",
                  padding: "10px 18px",
                  borderRadius: 12,
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
            <Link href={`/dashboard/clients/${id}/assign`} className="flex-1 sm:flex-none">
              <button
                style={{
                  width: "100%",
                  padding: "10px 18px",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "transparent",
                  color: "#e5e7eb",
                }}
              >
                Назначить
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Parameters */}
      <div
        style={{
          background: "#18181B",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20,
          padding: 24,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 18 }}>
          Параметры
        </div>
        {/* Param tiles — 2 cols on mobile, 3 on sm, 5 on lg */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-[18px]">
          {paramTiles.map((p) => (
            <div
              key={p.label}
              style={{
                background: "#0C0C16",
                borderRadius: 12,
                padding: "12px 14px",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>
                {p.label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{p.value}</div>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px 24px",
            fontSize: 14,
          }}
        >
          {[
            ["Цель", settings?.goal],
            ["Уровень", settings?.fitness_level],
            ["Активность", settings?.activity],
            ["Оборудование", settings?.equipment],
            ["Диета", settings?.diet],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                padding: "8px 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span style={{ color: "#6B7280" }}>{k}: </span>
              <span style={{ color: "#e5e7eb", fontWeight: 500 }}>{v ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts — stacked on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 mb-4">
        <div
          style={{
            background: "#18181B",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            padding: 24,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
            Динамика веса
          </div>
          <WeightChart data={weightData} />
        </div>
        <div
          style={{
            background: "#18181B",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            padding: 24,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
            Активность (неделя)
          </div>
          <WorkoutActivityChart data={activityData} />
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 12 }}>
            Всего тренировок:{" "}
            <span style={{ color: "#fff", fontWeight: 600 }}>{totalWorkouts}</span>
          </div>
          <div style={{ fontSize: 13, color: "#6B7280" }}>
            Последняя:{" "}
            <span style={{ color: "#fff", fontWeight: 600 }}>
              {daysSince(lastWorkout)}
            </span>
          </div>
        </div>
      </div>

      {/* Workout log */}
      <div
        style={{
          background: "#18181B",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20,
          padding: 24,
          marginBottom: 16,
          overflowX: "auto",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 18 }}>
          Последние тренировки
        </div>
        {(logsRes.data ?? []).length === 0 ? (
          <div style={{ color: "#6B7280", fontSize: 13 }}>Тренировок нет</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 360 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {["Дата", "Тренировка", "Сложность"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px 12px 0",
                      fontSize: 12,
                      color: "#6B7280",
                      fontWeight: 500,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(logsRes.data ?? []).slice(0, 10).map((l: { id: string; completed_at: string; difficulty_level: string | null; workout?: { name: string } | null }) => {
                const lc = levelColor(l.difficulty_level);
                return (
                  <tr key={l.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td
                      style={{
                        padding: "12px 12px 12px 0",
                        fontSize: 13,
                        color: "#9CA3AF",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {format(new Date(l.completed_at), "d MMM yyyy", { locale: ru })}
                    </td>
                    <td
                      style={{
                        padding: "12px 12px 12px 0",
                        fontSize: 14,
                        color: "#fff",
                        fontWeight: 500,
                      }}
                    >
                      {l.workout?.name ?? "—"}
                    </td>
                    <td style={{ padding: "12px 0" }}>
                      <span
                        style={{
                          fontSize: 12,
                          borderRadius: 6,
                          padding: "3px 10px",
                          background: lc.bg,
                          color: lc.text,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {l.difficulty_level ?? "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Photos */}
      <div
        style={{
          background: "#18181B",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20,
          padding: 24,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 18 }}>
          Фото прогресса
        </div>
        <ProgressPhotoGallery photos={photos} />
      </div>
    </div>
  );
}
