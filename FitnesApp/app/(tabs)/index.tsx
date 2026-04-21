import { useEffect, useState } from "react";
import { AppState, ImageBackground, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Dumbbell } from "lucide-react-native";

import {
  Card,
  CustomButton,
  DifficultyBadge,
  FlameIcon,
  HomeProgressCharts,
  HomeProgressSection,
  MetricTile,
  PointsWidget,
  SneakerIcon,
} from "@/components/atoms";
import { useAuth } from "@/hooks/useAuth";
import { initHealthKit, getStepsToday } from "@/services/health";
import { useTodayNutrition, useTodayWorkout, useUserSettings } from "@/services/api";

const STEP_GOAL = 10000;
const HERO_WORKOUT_IMAGE_FEMALE = require("../../src/assets/home/hero-workout-female.png");
const HERO_WORKOUT_IMAGE_MALE = require("../../src/assets/home/hero-workout-male.png");

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: todayWorkout } = useTodayWorkout();
  const { data: nutritionLogs } = useTodayNutrition();
  const { data: settings } = useUserSettings();
  const [steps, setSteps] = useState(0);
  const [showPersonalGreeting, setShowPersonalGreeting] = useState(false);

  useEffect(() => {
    const fetchSteps = async () => {
      const isHealthKitEnabled = await initHealthKit();

      if (!isHealthKitEnabled) {
        console.log("HealthKit not enabled or available");
        setSteps(0);
        return;
      }

      const count = await getStepsToday();
      setSteps(count);
    };

    const greetingTimer = setTimeout(() => setShowPersonalGreeting(true), 1500);

    fetchSteps();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        fetchSteps();
      }
    });

    return () => {
      clearTimeout(greetingTimer);
      subscription.remove();
    };
  }, []);

  const totalCalories = nutritionLogs?.reduce((sum, log) => sum + (log.calories ?? 0), 0) ?? 0;

  const dailyCaloriesGoal = settings?.daily_calories ?? 2000;
  const stepsProgress = Math.min((steps / STEP_GOAL) * 100, 100);

  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Атлет";
  const heroWorkoutImage = settings?.gender === "male" ? HERO_WORKOUT_IMAGE_MALE : HERO_WORKOUT_IMAGE_FEMALE;

  return (
    <ScrollView className="flex-1 bg-surface-50 dark:bg-dark-950" contentContainerClassName="px-4 pb-10 pt-14">
      <View className="mb-7 px-2">
        {!showPersonalGreeting ? (
          <Animated.View entering={FadeIn.duration(450)} exiting={FadeOut.duration(800)}>
            <Text className="text-sm uppercase tracking-[2px] text-dark-400 dark:text-dark-300">Главная</Text>
            <Text className="mt-2 text-[32px] leading-9 text-surface-900 dark:text-white" style={{ fontFamily: "Manrope-ExtraBold" }}>
              С возвращением 👋
            </Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(800)} exiting={FadeOut.duration(350)}>
            <Text className="text-sm uppercase tracking-[2px] text-dark-400 dark:text-dark-300">Сегодняшний фокус</Text>
            <Text className="mt-2 text-[32px] leading-9 text-surface-900 dark:text-white" style={{ fontFamily: "Manrope-ExtraBold" }}>
              Привет, {userName}! 👋
            </Text>
          </Animated.View>
        )}
      </View>

      <View className="mb-6 gap-3">
        <View className="flex-row gap-3">
          <MetricTile
            label="Ккал"
            value={String(totalCalories)}
            caption={`из ${dailyCaloriesGoal}`}
            accentColor="#FF8C42"
            icon={<FlameIcon size={20} />}
            className="flex-1"
          />
          <MetricTile
            label="Шаги"
            value={steps.toLocaleString("ru-RU")}
            caption={`цель ${STEP_GOAL.toLocaleString("ru-RU")}`}
            accentColor="#3DD87A"
            icon={<SneakerIcon size={20} />}
            className="flex-1"
          />
        </View>
        <MetricTile
          label="Тренировки"
          value={todayWorkout ? "1" : "0"}
          caption={todayWorkout ? "запланирована сегодня" : "план появится после подбора"}
          accentColor="#2B8EF0"
          icon={<Dumbbell size={20} color="#1566B8" strokeWidth={2.4} />}
          className="w-full"
        />
      </View>

      <View style={{ marginBottom: 24, borderRadius: 28, overflow: "hidden" }}>
        <ImageBackground
          source={heroWorkoutImage}
          resizeMode="cover"
          style={{ borderRadius: 28, overflow: "hidden" }}
        >
          <LinearGradient
            colors={["rgba(16,40,68,0.88)", "rgba(43,142,240,0.78)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ minHeight: 270, paddingHorizontal: 20, paddingVertical: 20 }}
          >
            <View style={{ maxWidth: "68%" }}>
              <Text style={{ fontSize: 11, letterSpacing: 2, color: "rgba(255,255,255,0.7)", textTransform: "uppercase" }}>
                Тренировка дня
              </Text>
              <Text style={{ marginTop: 8, fontSize: 28, lineHeight: 36, color: "#FFFFFF", fontFamily: "Manrope-ExtraBold" }}>
                {todayWorkout?.name ?? "Соберём персональный план"}
              </Text>
              <Text style={{ marginTop: 12, fontSize: 14, lineHeight: 20, color: "#FFFFFF" }}>
                {todayWorkout?.description ??
                  "Начните с плана на неделю, и приложение подстроит нагрузку под ваш текущий уровень."}
              </Text>
              <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 8 }}>
                {todayWorkout?.difficulty_level ? <DifficultyBadge level={todayWorkout.difficulty_level} /> : null}
                {todayWorkout?.duration_min ? (
                  <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.82)" }}>{todayWorkout.duration_min} мин</Text>
                ) : null}
              </View>
              <CustomButton
                title={todayWorkout ? "Начать" : "Открыть план"}
                onPress={() =>
                  router.push(todayWorkout ? `/workouts/${todayWorkout.id}` : "/(tabs)/workouts")
                }
                variant="outline"
                size="md"
                style={{ marginTop: 20, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.1)" }}
                textClassName="text-white"
              />
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>

      <View className="mb-6 gap-4">
        <Card variant="elevated" padding="lg">
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <View className="mb-4 flex-row items-center gap-3">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-success/15">
                  <SneakerIcon size={24} />
                </View>
                <View>
                  <Text className="text-xl text-surface-900 dark:text-white" style={{ fontFamily: "Manrope-Bold" }}>
                    Активность
                  </Text>
                  <Text className="text-sm text-dark-400 dark:text-dark-300">
                    {steps.toLocaleString("ru-RU")} из {STEP_GOAL.toLocaleString("ru-RU")} шагов
                  </Text>
                </View>
              </View>
              <View className="h-3 overflow-hidden rounded-full bg-surface-100 dark:bg-dark-700">
                <View className="h-full rounded-full bg-success" style={{ width: `${stepsProgress}%` }} />
              </View>
            </View>
          </View>
        </Card>
      </View>

      <HomeProgressSection />

      <View className="mt-6">
        <PointsWidget />
      </View>

      <View className="mt-6">
        <HomeProgressCharts />
      </View>
    </ScrollView>
  );
}
