import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Workout, Exercise, NutritionLog, ProgressEntry } from "@/types";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";

// ============================================================
// WORKOUTS
// ============================================================
export function useWorkouts() {
  return useQuery({
    queryKey: ["workouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data as Workout[];
    },
  });
}

export function useTodayWorkout() {
  return useQuery({
    queryKey: ["workouts", "today"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from("workouts")
        .select("*, exercises(*)")
        .gte("scheduled_at", today.toISOString())
        .lt("scheduled_at", tomorrow.toISOString())
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as (Workout & { exercises: Exercise[] }) | null;
    },
  });
}

export function useWorkoutDetail(id: string) {
  return useQuery({
    queryKey: ["workouts", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select("*, exercises(*)")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Workout & { exercises: Exercise[] };
    },
    enabled: !!id,
  });
}

export function useCompleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("workouts")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["workouts", id] });
      queryClient.invalidateQueries({ queryKey: ["workouts", "today"] });
    },
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workout: Omit<Workout, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("workouts")
        .insert(workout)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

// ============================================================
// NUTRITION LOG
// ============================================================
export function useTodayNutrition() {
  return useQuery({
    queryKey: ["nutrition", "today"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("nutrition_log")
        .select("*")
        .gte("logged_at", today.toISOString())
        .order("logged_at", { ascending: true });

      if (error) throw error;
      return data as NutritionLog[];
    },
  });
}

export function useCreateNutritionLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: Omit<NutritionLog, "id" | "created_at" | "logged_at" | "user_id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("nutrition_log")
        .insert({ ...log, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nutrition", "today"] });
    },
  });
}

export function useAnalyzeFood() {
  return useMutation({
    mutationFn: async (uri: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Upload photo to storage
      const filename = `${user.id}/${Date.now()}.jpg`;
      const uploadPath = filename; // Store path for cleanup
      
      // Convert URI to ArrayBuffer for reliability on mobile
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const arrayBuffer = decode(base64);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("food-scans")
        .upload(filename, arrayBuffer, { 
          contentType: 'image/jpeg',
          upsert: false 
        });

      if (uploadError) throw uploadError;

      // 2. Get signed URL (Edge Function needs access)
      const { data: signedData, error: signedError } = await supabase.storage
        .from("food-scans")
        .createSignedUrl(uploadData.path, 3600);

      if (signedError) throw signedError;
      const imageUrl = signedData.signedUrl;

      // 3. Call Edge Function
      const { data, error } = await supabase.functions.invoke("analyze-food-vision", {
        body: { image_url: imageUrl },
      });

      if (error) {
        // Cleanup on function error
        await supabase.storage.from("food-scans").remove([uploadPath]);
        throw error;
      }

      return {
        ...data,
        photo_url: imageUrl,
        storage_path: uploadPath
      };
    },
  });
}

// ============================================================
// PROGRESS
// ============================================================
export function useProgressEntries() {
  return useQuery({
    queryKey: ["progress"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progress_entries")
        .select("*")
        .order("recorded_at", { ascending: true }) // Changed to ascending for easier chart data mapping
        .limit(30);
      if (error) throw error;
      return data as ProgressEntry[];
    },
  });
}

export function useCreateProgressEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Omit<ProgressEntry, "id" | "created_at" | "user_id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("progress_entries")
        .insert({ ...entry, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["progress", "latest"] });
    },
  });
}

export function useLatestProgress() {
  return useQuery({
    queryKey: ["progress", "latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progress_entries")
        .select("*")
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as ProgressEntry | null;
    },
  });
}

// ============================================================
// PROFILE / SETTINGS
// ============================================================
export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUserSettings() {
  return useQuery({
    queryKey: ["user-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}
