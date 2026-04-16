// User profile from auth
export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// 23-parameter onboarding questionnaire
export interface UserSettings {
  id: string;
  user_id: string;
  // Physical
  gender: string | null;
  birth_date: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  body_type: string | null;
  // Goals
  goal: string | null;
  target_weight_kg: number | null;
  activity_level: string | null;
  // Health
  health_restrictions: string[] | null;
  injuries: string[] | null;
  sleep_quality: string | null;
  stress_level: string | null;
  // Fitness
  fitness_level: string | null;
  workout_preference: string | null;
  available_equipment: string[] | null;
  workouts_per_week: number | null;
  workout_duration_min: number | null;
  // Nutrition
  dietary_preferences: string[] | null;
  allergies: string[] | null;
  meals_per_day: number | null;
  water_intake_goal_ml: number | null;
  // Calculated
  bmi: number | null;
  daily_calories: number | null;
  daily_protein_g: number | null;
  daily_carbs_g: number | null;
  daily_fat_g: number | null;
  // Onboarding
  onboarding_completed: boolean;
  onboarding_step: number;
  created_at: string;
  updated_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  workout_type: string | null;
  duration_min: number | null;
  difficulty_level: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  workout_id: string;
  name: string;
  description: string | null;
  video_url: string | null;
  sets: number | null;
  reps: number | null;
  duration_sec: number | null;
  rest_sec: number | null;
  weight_kg: number | null;
  order_index: number;
  created_at: string;
}

export interface NutritionLog {
  id: string;
  user_id: string;
  food_name: string;
  photo_url?: string | null;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  portion_size?: string | null;
  meal_type?: string | null;
  logged_at: string;
  created_at: string;
}

export interface ProgressEntry {
  id: string;
  user_id: string;
  weight_kg?: number | null;
  body_fat_pct?: number | null;
  muscle_kg?: number | null;
  photo_before_url?: string | null;
  photo_after_url?: string | null;
  notes?: string | null;
  recorded_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  user_id: string;
  trainer_id: string | null;
  content: string;
  is_from_user: boolean;
  read_at: string | null;
  created_at: string;
}

export interface FoodAnalysisResult {
  food_name: string;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  portion_size: string;
  photo_url?: string;
}
