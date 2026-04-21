import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Exercise, NutritionLog, PointsLog, ProgressEntry, Workout, WorkoutLog, WeightLog } from "@/types";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { Platform } from "react-native";

function getAiServiceMessage(rawMessage?: string) {
  if (!rawMessage) {
    return "Сервис ИИ сейчас недоступен.";
  }

  const message = rawMessage.toLowerCase();

  if (message.includes("ai key not configured")) {
    return "ИИ не настроен: отсутствует API-ключ Polza.ai.";
  }

  if (message.includes("supabase service role is not configured")) {
    return "ИИ не настроен: отсутствует service role ключ Supabase.";
  }

  return rawMessage;
}

async function getFunctionAuthHeaders() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }

  const accessToken = data.session?.access_token;
  return accessToken
    ? ({ Authorization: `Bearer ${accessToken}` } satisfies Record<string, string>)
    : undefined;
}

async function readImageForUpload(uri: string) {
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error("Не удалось прочитать изображение в браузере.");
    }

    const blob = await response.blob();
    return {
      body: await blob.arrayBuffer(),
      contentType: blob.type || "image/jpeg",
    };
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: "base64",
  });

  return {
    body: decode(base64),
    contentType: "image/jpeg",
  };
}

async function getExercisesForWorkout(workoutId: string) {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("workout_id", workoutId)
    .order("order_index", { ascending: true });

  if (error) throw error;
  return data as Exercise[];
}

// ============================================================
// WORKOUTS
// ============================================================
export function useWorkouts() {
  return useQuery({
    queryKey: ["workouts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as Workout[];

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: workout, error } = await supabase
        .from("workouts")
        .select("*")
        .gte("scheduled_at", today.toISOString())
        .lt("scheduled_at", tomorrow.toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!workout) return null;

      const exercises = await getExercisesForWorkout(workout.id);
      return { ...workout, exercises } as Workout & { exercises: Exercise[] };
    },
  });
}

export function useWorkoutDetail(id: string) {
  return useQuery({
    queryKey: ["workouts", id],
    queryFn: async () => {
      const { data: workout, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      const exercises = await getExercisesForWorkout(workout.id);
      return { ...workout, exercises } as Workout & { exercises: Exercise[] };
    },
    enabled: !!id,
  });
}

export function useCompleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("workouts")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      const { error: logError } = await supabase.from("workout_logs").insert({
        user_id: user.id,
        workout_id: id,
        difficulty_level: data.difficulty_level ?? null,
        completed_at: data.completed_at,
      });
      if (logError) throw logError;

      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["workouts", id] });
      queryClient.invalidateQueries({ queryKey: ["workouts", "today"] });
      queryClient.invalidateQueries({ queryKey: ["points"] });
      queryClient.invalidateQueries({ queryKey: ["workout-logs"] });
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as NutritionLog[];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from("nutrition_log")
        .select("*")
        .gte("logged_at", today.toISOString())
        .lt("logged_at", tomorrow.toISOString())
        .order("logged_at", { ascending: true });

      if (error) throw error;
      return data as NutritionLog[];
    },
  });
}

export function useNutritionRealtimeInvalidation() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("home-nutrition-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "nutrition_log" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["nutrition", "today"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
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

// ============================================================
// POINTS
// ============================================================
export function usePointsBalance() {
  return useQuery({
    queryKey: ["points", "balance"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase
        .from("points_log")
        .select("amount")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []).reduce((sum, row) => sum + row.amount, 0);
    },
  });
}

export function usePointsHistory() {
  return useQuery({
    queryKey: ["points", "history"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as PointsLog[];

      const { data, error } = await supabase
        .from("points_log")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as PointsLog[];
    },
  });
}

// ============================================================
// WORKOUT LOGS
// ============================================================
export function useWorkoutLogsLast7Days() {
  return useQuery({
    queryKey: ["workout-logs", "7days"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as WorkoutLog[];

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("completed_at", sevenDaysAgo.toISOString())
        .order("completed_at", { ascending: true });
      if (error) throw error;
      return data as WorkoutLog[];
    },
  });
}

// ============================================================
// WEIGHT LOG
// ============================================================
export function useWeightLogs() {
  return useQuery({
    queryKey: ["weight-logs"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as WeightLog[];

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data, error } = await supabase
        .from("weight_log")
        .select("*")
        .eq("user_id", user.id)
        .gte("measured_at", ninetyDaysAgo.toISOString())
        .order("measured_at", { ascending: true });
      if (error) throw error;
      return data as WeightLog[];
    },
  });
}

export function useAddWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (value_kg: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("weight_log")
        .insert({ user_id: user.id, value_kg })
        .select()
        .single();
      if (error) throw error;
      return data as WeightLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight-logs"] });
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
      
      const uploadPayload = await readImageForUpload(uri);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("food-scans")
        .upload(filename, uploadPayload.body, { 
          contentType: uploadPayload.contentType,
          upsert: false 
        });

      if (uploadError) throw uploadError;

      // 2. Get signed URL (Edge Function needs access)
      const { data: signedData, error: signedError } = await supabase.storage
        .from("food-scans")
        .createSignedUrl(uploadData.path, 3600);

      if (signedError) throw signedError;
      const imageUrl = signedData.signedUrl;

      // 3. Call Edge Function (no manual auth needed — verify_jwt disabled, security via signed URL)
      const { data, error } = await supabase.functions.invoke("analyze-food-vision", {
        body: { image_url: imageUrl },
      });

      const aiErrorMessage =
        (typeof data === "object" && data && "error" in data && typeof data.error === "string"
          ? data.error
          : undefined) ?? error?.message;

      if (error || aiErrorMessage) {
        // Cleanup on function error
        await supabase.storage.from("food-scans").remove([uploadPath]);
        throw new Error(getAiServiceMessage(aiErrorMessage));
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as ProgressEntry[];

      const { data, error } = await supabase
        .from("progress_entries")
        .select("*")
        .order("recorded_at", { ascending: true })
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

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
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
