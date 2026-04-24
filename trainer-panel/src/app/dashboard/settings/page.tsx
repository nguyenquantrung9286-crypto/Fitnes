import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: trainerStatus } = await supabase
    .from("trainer_status")
    .select("is_online")
    .eq("trainer_id", user.id)
    .single();

  return (
    <SettingsForm
      userId={user.id}
      initialName={profile?.full_name ?? ""}
      email={user.email ?? ""}
      initialOnline={trainerStatus?.is_online ?? false}
    />
  );
}
