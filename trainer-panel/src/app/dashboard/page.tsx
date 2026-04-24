import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { UserAvatar } from "@/components/layout/Avatar";
import { format, differenceInDays } from "date-fns";
import { ru } from "date-fns/locale";
import type { ClientSummary, TrainerMessage } from "@/lib/types";

function daysSince(iso: string | null): string {
  if (!iso) return "—";
  const d = differenceInDays(new Date(), new Date(iso));
  if (d === 0) return "сегодня";
  if (d === 1) return "вчера";
  return `${d} дн. назад`;
}

function StatTile({
  emoji,
  label,
  value,
  sub,
  accent,
}: {
  emoji: string;
  label: string;
  value: number | string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: "#18181B",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20,
        padding: "18px 20px",
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 8 }}>{emoji}</div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: accent || "#fff",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{sub}</div>
      )}
      <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 8 }}>{label}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // Pro clients
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("plan", "pro")
    .eq("status", "active");

  const proUserIds = subscriptions?.map((s: { user_id: string }) => s.user_id) ?? [];

  // Unread messages
  const { count: unreadCount } = await supabase
    .from("trainer_messages")
    .select("*", { count: "exact", head: true })
    .eq("is_from_user", true)
    .is("read_at", null);

  // Today's workouts
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: todayWorkouts } = await supabase
    .from("workout_logs")
    .select("*", { count: "exact", head: true })
    .in("user_id", proUserIds)
    .gte("completed_at", today.toISOString());

  // Active this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { data: activeThisWeek } = await supabase
    .from("workout_logs")
    .select("user_id")
    .in("user_id", proUserIds)
    .gte("completed_at", weekAgo.toISOString());
  const activeUserIds = new Set(
    activeThisWeek?.map((r: { user_id: string }) => r.user_id) ?? []
  );

  // Recent conversations (latest message per user)
  const { data: recentMsgs } = await supabase
    .from("trainer_messages")
    .select("user_id, content, created_at, is_from_user")
    .in("user_id", proUserIds)
    .order("created_at", { ascending: false });

  const seenUsers = new Set<string>();
  const lastMsgByUser: Record<string, { content: string; created_at: string; is_from_user: boolean }> = {};
  for (const msg of recentMsgs ?? []) {
    if (!seenUsers.has(msg.user_id)) {
      seenUsers.add(msg.user_id);
      lastMsgByUser[msg.user_id] = msg;
    }
  }

  // Unread per user
  const { data: unreadPerUser } = await supabase
    .from("trainer_messages")
    .select("user_id")
    .in("user_id", proUserIds)
    .eq("is_from_user", true)
    .is("read_at", null);

  const unreadByUser: Record<string, number> = {};
  for (const r of unreadPerUser ?? []) {
    unreadByUser[r.user_id] = (unreadByUser[r.user_id] ?? 0) + 1;
  }

  // Profiles for users with messages
  const usersWithMsgs = Array.from(seenUsers).slice(0, 5);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", usersWithMsgs);

  const profileMap: Record<string, string> = {};
  for (const p of profiles ?? []) {
    profileMap[p.id] = p.full_name ?? "Клиент";
  }

  // Inactive clients (no workout in 7+ days)
  const { data: recentWorkouts } = await supabase
    .from("workout_logs")
    .select("user_id, completed_at")
    .in("user_id", proUserIds)
    .gte("completed_at", weekAgo.toISOString());

  const recentSet = new Set(recentWorkouts?.map((r: { user_id: string }) => r.user_id) ?? []);
  const inactiveIds = proUserIds.filter((id) => !recentSet.has(id));

  const { data: inactiveProfiles } = inactiveIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", inactiveIds)
    : { data: [] };

  const { data: lastWorkouts } = inactiveIds.length
    ? await supabase
        .from("workout_logs")
        .select("user_id, completed_at")
        .in("user_id", inactiveIds)
        .order("completed_at", { ascending: false })
    : { data: [] };

  const lastWorkoutMap: Record<string, string> = {};
  for (const lw of lastWorkouts ?? []) {
    if (!lastWorkoutMap[lw.user_id]) lastWorkoutMap[lw.user_id] = lw.completed_at;
  }

  return (
    <div>
      {/* Stats — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-7">
        <StatTile emoji="👥" label="Pro-клиентов" value={proUserIds.length} />
        <StatTile
          emoji="💬"
          label="Непрочитанных"
          value={unreadCount ?? 0}
          accent={(unreadCount ?? 0) > 0 ? "#A78BFA" : undefined}
        />
        <StatTile
          emoji="🏋️"
          label="Тренировок сегодня"
          value={todayWorkouts ?? 0}
          sub="у клиентов"
        />
        <StatTile
          emoji="📊"
          label="Активных за неделю"
          value={activeUserIds.size}
          sub={`из ${proUserIds.length}`}
        />
      </div>

      {/* Two-col section — stacked on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5">
        {/* Recent messages */}
        <div
          style={{
            background: "#18181B",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            padding: 24,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 18 }}>
            Последние сообщения
          </div>
          {usersWithMsgs.length === 0 && (
            <div style={{ color: "#6B7280", fontSize: 13 }}>Нет диалогов</div>
          )}
          {usersWithMsgs.map((uid) => {
            const msg = lastMsgByUser[uid];
            const name = profileMap[uid] ?? "Клиент";
            const unread = unreadByUser[uid] ?? 0;
            return (
              <Link
                key={uid}
                href={`/dashboard/clients/${uid}/chat`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    cursor: "pointer",
                  }}
                >
                  <UserAvatar name={name} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
                        {name}
                      </div>
                      <div style={{ fontSize: 11, color: "#6B7280" }}>
                        {msg?.created_at
                          ? format(new Date(msg.created_at), "HH:mm")
                          : ""}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#6B7280",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {msg?.is_from_user === false ? "Вы: " : ""}
                      {msg?.content || "Нет сообщений"}
                    </div>
                  </div>
                  {unread > 0 && (
                    <span
                      style={{
                        background: "#7C3AED",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 99,
                        padding: "2px 8px",
                        flexShrink: 0,
                      }}
                    >
                      {unread}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Inactive clients */}
        <div
          style={{
            background: "#18181B",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            padding: 24,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
            Нет активности 7+ дн.
          </div>
          <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 18 }}>
            Стоит написать клиентам
          </div>
          {inactiveProfiles?.length === 0 && (
            <div style={{ fontSize: 13, color: "#3DD87A" }}>✓ Все клиенты активны</div>
          )}
          {inactiveProfiles?.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <UserAvatar name={p.full_name ?? "?"} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
                  {p.full_name}
                </div>
                <div style={{ fontSize: 12, color: "#FF5656" }}>
                  {lastWorkoutMap[p.id]
                    ? `Последняя: ${daysSince(lastWorkoutMap[p.id])}`
                    : "Ни одной тренировки"}
                </div>
              </div>
              <Link href={`/dashboard/clients/${p.id}/chat`}>
                <button
                  style={{
                    background: "rgba(124,58,237,0.15)",
                    border: "1px solid rgba(124,58,237,0.3)",
                    borderRadius: 8,
                    padding: "5px 10px",
                    fontSize: 12,
                    color: "#A78BFA",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  Написать
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
