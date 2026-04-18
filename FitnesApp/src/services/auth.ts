import { supabase } from "@/lib/supabase";
import { UserSettings } from "@/types";

export type SignUpData = {
  email: string;
  password: string;
  settings: Partial<UserSettings>;
};

export async function signUpWithEmail({
  email,
  password,
  settings,
}: SignUpData) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error("Не удалось создать пользователя");

  // Save onboarding settings to profiles.onboarding_data
  if (settings) {
    const { error: settingsError } = await supabase
      .from("profiles")
      .upsert(
        { id: data.user.id, onboarding_data: settings },
        { onConflict: "id" }
      );

    if (settingsError) {
      throw settingsError;
    }
  }

  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function getProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return null;
  return data;
}

export async function getUserSettings() {
  const profile = await getProfile();
  if (!profile) return null;

  return profile.onboarding_data || null;
}
