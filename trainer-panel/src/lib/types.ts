export type Role = "user" | "trainer" | "admin";
export type Plan = "free" | "standard" | "pro";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface ClientSummary {
  id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  plan: Plan;
  goal: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  fitness_level: string | null;
  activity: string | null;
  equipment: string | null;
  diet: string | null;
  gender: string | null;
  age: number | null;
  last_workout_at: string | null;
  total_workouts: number;
  unread_messages: number;
  registered_at: string | null;
}

export interface TrainerMessage {
  id: string;
  user_id: string;
  trainer_id: string | null;
  content: string;
  is_from_user: boolean;
  read_at: string | null;
  created_at: string;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  workout_id: string;
  difficulty_level: string | null;
  completed_at: string;
  workout?: { name: string; duration_min: number | null };
}

export interface WeightEntry {
  id: string;
  user_id: string;
  value_kg: number;
  measured_at: string;
}

export interface ProgressPhoto {
  id: string;
  user_id: string;
  photo_path: string;
  taken_at: string;
  note: string | null;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  duration_min: number | null;
  difficulty_level: string | null;
  workout_type: string | null;
  scheduled_at: string | null;
}
