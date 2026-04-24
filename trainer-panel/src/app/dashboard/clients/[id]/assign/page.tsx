import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { AssignScreen } from "@/components/clients/AssignScreen";

export default async function AssignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  // Get trainer's workout templates (workouts without specific user or with trainer's user_id)
  const { data: workouts } = await supabase
    .from("workouts")
    .select("*")
    .order("name");

  return (
    <AssignScreen
      clientId={id}
      clientName={profile.full_name ?? "Клиент"}
      trainerId={user.id}
      workouts={workouts ?? []}
    />
  );
}
