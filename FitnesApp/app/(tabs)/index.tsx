import { View, Text, ScrollView, TouchableOpacity, AppState } from "react-native";
import { useRouter } from "expo-router";
import { Card, CustomButton } from "@/components/atoms";
import { useTodayWorkout, useTodayNutrition, useUserSettings } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Droplets, Footprints, Dumbbell, Apple, ChevronRight } from "lucide-react-native";
import { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { initHealthKit, getStepsToday } from "@/services/health";

// Mock data (will move to settings later)
const WATER_GOAL_ML = 2000;
const STEP_GOAL = 10000;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: todayWorkout } = useTodayWorkout();
  const { data: nutritionLogs } = useTodayNutrition();
  const { data: settings } = useUserSettings();
  const [steps, setSteps] = useState(0);
  const [waterMl, setWaterMl] = useState(0);

  useEffect(() => {
    // Initial fetch
    const fetchSteps = async () => {
      try {
        await initHealthKit();
        const count = await getStepsToday();
        setSteps(count);
      } catch (e) {
        console.log("HealthKit not enabled or available");
      }
    };

    fetchSteps();

    // Refresh when app comes back to foreground
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        fetchSteps();
      }
    });

    return () => subscription.remove();
  }, []);

  // Calculate nutrition totals
  const totalCalories = nutritionLogs?.reduce((sum, log) => sum + (log.calories ?? 0), 0) ?? 0;
  const totalProtein = nutritionLogs?.reduce((sum, log) => sum + (log.protein_g ?? 0), 0) ?? 0;
  const totalFat = nutritionLogs?.reduce((sum, log) => sum + (log.fat_g ?? 0), 0) ?? 0;
  const totalCarbs = nutritionLogs?.reduce((sum, log) => sum + (log.carbs_g ?? 0), 0) ?? 0;

  const dailyCaloriesGoal = settings?.daily_calories ?? 2000;
  const waterGoal = settings?.water_intake_goal_ml ?? WATER_GOAL_ML;

  // Get time-based greeting
  const hour = new Date().getHours();
  let greeting = "Добрый день";
  if (hour < 12) greeting = "Доброе утро";
  else if (hour > 18) greeting = "Добрый вечер";

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-dark-950">
      {/* Header */}
      <LinearGradient
        colors={["#7C3AED", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="px-6 pt-16 pb-10"
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white/80 text-lg font-medium">С возвращением,</Text>
            <Text className="text-white text-3xl font-bold">{user?.email?.split('@')[0] || 'Атлет'}</Text>
          </View>
          <View className="h-12 w-12 rounded-full bg-white/20 items-center justify-center border border-white/30">
            <Text className="text-2xl">⚡</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <View className="-mt-5 px-4 pb-10">
        {/* Quick Actions */}
        <Text className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-50">
          Сегодня
        </Text>
        <View className="flex-row gap-4">
          <Card variant="elevated" padding="md" className="flex-1">
            <TouchableOpacity onPress={() => setWaterMl(prev => Math.min(prev + 250, waterGoal + 1000))}>
              <View className="bg-blue-50 dark:bg-blue-900/20 self-start p-2 rounded-xl mb-2">
                <Droplets size={24} color="#3B82F6" />
              </View>
              <Text className="text-base font-bold text-gray-900 dark:text-gray-50">
                Вода
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium">{waterMl} / {waterGoal} мл</Text>
              <View className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-dark-700">
                <View 
                  className="h-full rounded-full bg-blue-500" 
                  style={{ width: `${Math.min((waterMl / waterGoal) * 100, 100)}%` }}
                />
              </View>
              <Text className="text-[10px] text-blue-500 dark:text-blue-400 mt-1 font-bold">+250 мл</Text>
            </TouchableOpacity>
          </Card>

          {/* Steps */}
          <Card variant="elevated" padding="md" className="flex-1">
            <View className="bg-green-50 dark:bg-green-900/20 self-start p-2 rounded-xl mb-2">
              <Footprints size={24} color="#10B981" />
            </View>
            <Text className="text-base font-bold text-gray-900 dark:text-gray-50">
              Шаги
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium">{steps.toLocaleString()} / {STEP_GOAL.toLocaleString()}</Text>
            <View className="h-3 w-full bg-gray-100 dark:bg-dark-800 rounded-full overflow-hidden mt-3">
              <LinearGradient
                colors={["#7C3AED", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-full rounded-full"
                style={{ width: `${Math.min((steps / STEP_GOAL) * 100, 100)}%` }}
              />
            </View>
          </Card>
        </View>

        {/* Next Workout */}
        <Text className="mb-4 mt-8 text-xl font-bold text-gray-900 dark:text-gray-50">
          Тренировка
        </Text>
        <Card variant="elevated" padding="lg">
          {todayWorkout ? (
            <>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <Text className="text-lg font-bold text-gray-900 dark:text-gray-50">
                    {todayWorkout.name}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Text className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {todayWorkout.duration_min ?? 30} мин •{" "}
                    </Text>
                    <View className={`px-2 py-0.5 rounded-md ${
                      todayWorkout.difficulty_level === 'easy' ? 'bg-green-100 dark:bg-green-900/30' :
                      todayWorkout.difficulty_level === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      <Text className={`text-xs font-bold ${
                        todayWorkout.difficulty_level === 'easy' ? 'text-green-700 dark:text-green-400' :
                        todayWorkout.difficulty_level === 'medium' ? 'text-yellow-700 dark:text-yellow-400' :
                        'text-red-700 dark:text-red-400'
                      }`}>
                        {todayWorkout.difficulty_level === "easy" ? "Легкая" : 
                         todayWorkout.difficulty_level === "medium" ? "Средняя" : "Сложная"}
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="bg-primary-50 dark:bg-primary-900/20 p-2 rounded-full">
                  <ChevronRight size={24} color="#7C3AED" />
                </View>
              </View>
              <CustomButton
                title="Начать тренировку"
                onPress={() => router.push("/workouts/" + todayWorkout.id)}
                variant="primary"
                size="md"
                className="mt-5 shadow-md shadow-primary-500/20"
              />
            </>
          ) : (
            <>
              <View className="flex-row items-center gap-4">
                <View className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-2xl">
                  <Dumbbell size={28} color="#7C3AED" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-900 dark:text-gray-50">
                    План не составлен
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    ИИ составит расписание после онбординга
                  </Text>
                </View>
              </View>
              <CustomButton
                title="Настроить программу"
                onPress={() => router.push("/(tabs)/workouts")}
                variant="outline"
                size="md"
                className="mt-5"
              />
            </>
          )}
        </Card>

        {/* Today's Nutrition */}
        <Text className="mb-4 mt-8 text-xl font-bold text-gray-900 dark:text-gray-50">
          Питание сегодня
        </Text>
        <Card variant="elevated" padding="lg">
          <View className="flex-row items-center gap-3 mb-6">
            <View className="bg-accent-100 dark:bg-accent-900/30 p-2 rounded-xl">
              <Apple size={24} color="#EC4899" />
            </View>
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-50">
              Баланс КБЖУ
            </Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <View className="items-center flex-1">
              <Text className="text-2xl font-black text-primary-600 dark:text-primary-400">
                {totalCalories}
              </Text>
              <Text className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Ккал</Text>
              <Text className="text-[10px] text-gray-400">из {dailyCaloriesGoal}</Text>
            </View>
            <View className="w-[1px] h-10 bg-gray-100 dark:bg-dark-700 self-center" />
            <View className="items-center flex-1">
              <Text className="text-xl font-bold text-accent-500">
                {totalProtein.toFixed(0)}г
              </Text>
              <Text className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Белки</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xl font-bold text-yellow-500">
                {totalFat.toFixed(0)}г
              </Text>
              <Text className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Жиры</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xl font-bold text-green-500">
                {totalCarbs.toFixed(0)}г
              </Text>
              <Text className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Углеводы</Text>
            </View>
          </View>

          {/* Calorie bar */}
          <View className="mt-4 h-3 w-full bg-gray-100 dark:bg-dark-800 rounded-full overflow-hidden">
            <LinearGradient
              colors={["#7C3AED", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="h-full rounded-full"
              style={{
                width: `${Math.min((totalCalories / dailyCaloriesGoal) * 100, 100)}%`,
              }}
            />
          </View>

          <CustomButton
            title="Добавить еду"
            onPress={() => router.push("/scanner")}
            variant="outline"
            size="md"
            className="mt-6"
          />
        </Card>
      </View>
    </ScrollView>
  );
}
