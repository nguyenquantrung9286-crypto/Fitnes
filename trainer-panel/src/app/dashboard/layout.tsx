import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const { data: trainerStatus } = await supabase
    .from("trainer_status")
    .select("is_online")
    .eq("trainer_id", user.id)
    .single();

  const { count: unreadCount } = await supabase
    .from("trainer_messages")
    .select("*", { count: "exact", head: true })
    .eq("is_from_user", true)
    .is("read_at", null);

  const trainerName = profile?.full_name ?? "Тренер";
  const isOnline = trainerStatus?.is_online ?? false;

  return (
    <DashboardShell
      trainerName={trainerName}
      isOnline={isOnline}
      unreadCount={unreadCount ?? 0}
    >
      {children}
    </DashboardShell>
  );
}
