import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { BarChart, LineChart } from "react-native-chart-kit";
import { LogIn, LogOut, Mail, Monitor, Moon, Plus, Settings, Sun, TrendingUp, User } from "lucide-react-native";

import { Card, CustomButton, CustomInput } from "@/components/atoms";
import { useAppTheme } from "@/context/theme-context";
import { useAuth } from "@/hooks/useAuth";
import {
  useCreateProgressEntry,
  useLatestProgress,
  useProgressEntries,
  useUserSettings,
  useWorkouts,
} from "@/services/api";
import { FORCE_ONBOARDING_STORAGE_KEY, signOut } from "@/services/auth";

function formatGoal(goal: string | null | undefined) {
  if (goal === "weight_loss") return "Похудение";
  if (goal === "muscle_gain") return "Масса";
  if (goal === "maintain") return "Форма";
  return "Не указана";
}

function formatActivity(activity: string | null | undefined) {
  if (activity === "sedentary") return "Сидячий";
  if (activity === "light") return "Лёгкий";
  if (activity === "moderate") return "Умеренный";
  if (activity === "active") return "Активный";
  if (activity === "very_active") return "Очень активный";
  return "Не указан";
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="elevated" padding="md" className="flex-1">
      <Text className="text-xs uppercase tracking-[1.6px] text-dark-400 dark:text-dark-300">{label}</Text>
      <Text
        className="mt-2 text-xl text-surface-900 dark:text-white"
        style={{ fontFamily: "Manrope-ExtraBold" }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.65}
      >
        {value}
      </Text>
    </Card>
  );
}

function buildWorkoutMinutes(workouts: ReturnType<typeof useWorkouts>["data"]) {
  const labels: string[] = [];
  const minutes: number[] = [];
  const today = new Date();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = date.toISOString().slice(0, 10);

    labels.push(
      date
        .toLocaleDateString("ru-RU", { weekday: "short" })
        .replace(".", "")
        .slice(0, 2)
        .toUpperCase()
    );

    const totalMinutes = (workouts ?? [])
      .filter((workout) => workout.completed_at?.slice(0, 10) === key)
      .reduce((sum, workout) => sum + (workout.duration_min ?? 0), 0);

    minutes.push(totalMinutes);
  }

  return { labels, minutes };
}

export default function ProfileScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAddingWeight, setIsAddingWeight] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const { resolvedTheme, setThemePreference, themePreference } = useAppTheme();
  const isDark = resolvedTheme === "dark";

  const { data: progressEntries } = useProgressEntries();
  const { data: latestProgress } = useLatestProgress();
  const { data: settings, isLoading: isLoadingSettings } = useUserSettings();
  const { data: workouts } = useWorkouts();
  const { mutate: addProgress, isPending: isAdding } = useCreateProgressEntry();

  const handleSignOut = async () => {
    Alert.alert("Выход", "Вы уверены, что хотите выйти?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Выйти",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/auth/login");
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Ошибка выхода";
            Alert.alert("Ошибка", message);
          }
        },
      },
    ]);
  };

  const handleAddWeight = () => {
    const weight = parseFloat(newWeight.replace(",", "."));
    if (Number.isNaN(weight) || weight <= 0) {
      Alert.alert("Ошибка", "Введите корректный вес");
      return;
    }

    addProgress(
      { weight_kg: weight, recorded_at: new Date().toISOString() },
      {
        onSuccess: () => {
          setIsAddingWeight(false);
          setNewWeight("");
        },
      }
    );
  };

  const handleRestartOnboarding = async () => {
    try {
      await AsyncStorage.setItem(FORCE_ONBOARDING_STORAGE_KEY, "true");
    } catch (error) {
      console.warn("Failed to set onboarding reset flag:", error);
    }

    router.push("/onboarding");
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-50 dark:bg-dark-950">
        <ActivityIndicator size="large" color="#2B8EF0" />
      </View>
    );
  }

  const chartWidth = Dimensions.get("window").width - 48;
  const weightChartData = {
    labels: (progressEntries || [])
      .slice(-6)
      .map((entry) =>
        new Date(entry.recorded_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
      ),
    datasets: [
      {
        data: (progressEntries || []).slice(-6).map((entry) => entry.weight_kg || 0),
        color: (opacity = 1) => `rgba(43, 142, 240, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const weeklyActivity = buildWorkoutMinutes(workouts);

  return (
    <ScrollView className="flex-1 bg-surface-50 dark:bg-dark-950" contentContainerClassName="px-4 pb-10 pt-14">
      <View className="mb-6 items-center">
        <View className="h-24 w-24 items-center justify-center rounded-[30px] bg-primary-600/12">
          <User size={38} color="#2B8EF0" />
        </View>
        <Text className="mt-4 text-[28px] leading-8 text-surface-900 dark:text-white" style={{ fontFamily: "Manrope-ExtraBold" }}>
          {user ? user.email : "Гость"}
        </Text>
        <Text className="mt-2 text-sm text-dark-400 dark:text-dark-300">
          {user ? "Профиль активен и синхронизирован" : "Войдите для персонализации"}
        </Text>
      </View>

      {user ? (
        <View className="gap-4">
          <View className="px-1">
            <Text className="text-sm uppercase tracking-[2px] text-dark-400 dark:text-dark-300">Основные показатели</Text>
          </View>

          {isLoadingSettings ? (
            <Card variant="elevated" padding="lg">
              <View className="items-center py-6">
                <ActivityIndicator size="small" color="#2B8EF0" />
              </View>
            </Card>
          ) : settings ? (
            <>
              <View className="flex-row gap-3">
                <StatTile label="Рост" value={settings.height_cm ? `${settings.height_cm} см` : "—"} />
                <StatTile label="Вес" value={settings.weight_kg ? `${settings.weight_kg} кг` : "—"} />
                <StatTile label="Цель" value={formatGoal(settings.goal)} />
              </View>

              <Card variant="elevated" padding="lg">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-xl text-surface-900 dark:text-white" style={{ fontFamily: "Manrope-Bold" }}>
                      Профиль здоровья
                    </Text>
                    <Text className="mt-1 text-sm text-dark-400 dark:text-dark-300">
                      Активность: {formatActivity(settings.activity_level)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleRestartOnboarding} activeOpacity={0.85}>
                    <Text className="text-sm text-primary-600" style={{ fontFamily: "Manrope-Bold" }}>
                      Обновить
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="mt-5 gap-3 rounded-[20px] bg-surface-50 p-4 dark:bg-dark-900">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-dark-400 dark:text-dark-300">Дневные калории</Text>
                    <Text className="text-base text-surface-900 dark:text-white" style={{ fontFamily: "Manrope-Bold" }}>
                      {settings.daily_calories ?? "—"} ккал
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-dark-400 dark:text-dark-300">Вода</Text>
                    <Text className="text-base text-surface-900 dark:text-white" style={{ fontFamily: "Manrope-Bold" }}>
                      {settings.water_intake_goal_ml ?? "—"} мл
                    </Text>
                  </View>
                </View>
              </Card>
            </>
          ) : (
            <Card variant="elevated" padding="lg">
              <Text className="text-base text-dark-400 dark:text-dark-300">
                Данные онбординга пока не заполнены или не сохранились.
              </Text>
              <CustomButton
                title="Заполнить профиль"
                onPress={handleRestartOnboarding}
                variant="outline"
                size="md"
                className="mt-4"
              />
            </Card>
          )}

          <View className="flex-row items-center justify-between px-1">
            <Text className="text-sm uppercase tracking-[2px] text-dark-400 dark:text-dark-300">Прогресс и активность</Text>
            <TouchableOpacity
              onPress={() => setIsAddingWeight((prev) => !prev)}
              activeOpacity={0.85}
              className="h-10 w-10 items-center justify-center rounded-2xl bg-primary-600/12"
            >
              <Plus size={18} color="#2B8EF0" />
            </TouchableOpacity>
          </View>

          {isAddingWeight ? (
            <Card variant="elevated" padding="lg">
              <Text className="mb-3 text-sm text-surface-900 dark:text-white" style={{ fontFamily: "Manrope-Bold" }}>
                Новая запись веса
              </Text>
              <View className="flex-row items-center gap-3">
                <CustomInput
                  value={newWeight}
                  onChangeText={setNewWeight}
                  keyboardType="numeric"
                  placeholder="Например, 75.5"
                  containerStyle={{ flex: 1 }}
                />
                <CustomButton
                  title="Сохранить"
                  onPress={handleAddWeight}
                  variant="primary"
                  size="sm"
                  isLoading={isAdding}
                />
              </View>
            </Card>
          ) : null}

          <Card variant="elevated" padding="lg">
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <TrendingUp size={20} color="#2B8EF0" />
                <Text className="text-xl text-surface-900 dark:text-white" style={{ fontFamily: "Manrope-Bold" }}>
                  Активность за неделю
                </Text>
              </View>
              <Text className="text-sm text-dark-400 dark:text-dark-300">минуты тренировок</Text>
            </View>

            <BarChart
              data={{
                labels: weeklyActivity.labels,
                datasets: [{ data: weeklyActivity.minutes.length ? weeklyActivity.minutes : [0, 0, 0, 0, 0, 0, 0] }],
              }}
              width={chartWidth}
              height={220}
              yAxisLabel=""
              yAxisSuffix="м"
              fromZero
              showValuesOnTopOfBars
              flatColor
              withInnerLines={false}
              withHorizontalLabels
              chartConfig={{
                backgroundColor: isDark ? "#161625" : "#FFFFFF",
                backgroundGradientFrom: isDark ? "#161625" : "#FFFFFF",
                backgroundGradientTo: isDark ? "#161625" : "#FFFFFF",
                decimalPlaces: 0,
                barPercentage: 0.55,
                color: () => "#2B8EF0",
                labelColor: () => (isDark ? "#9090B0" : "#7070A0"),
                fillShadowGradientFrom: "#2B8EF0",
                fillShadowGradientTo: "#2B8EF0",
                propsForBackgroundLines: { stroke: "transparent" },
              }}
              style={{ borderRadius: 20 }}
            />
          </Card>

          <Card variant="elevated" padding="none" style={{ overflow: "hidden" }}>
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center gap-2">
                <TrendingUp size={20} color="#2B8EF0" />
                <Text className="text-base text-surface-900 dark:text-white" style={{ fontFamily: "Manrope-Bold" }}>
                  Динамика веса
                </Text>
              </View>
              {latestProgress ? (
                <Text className="text-lg text-primary-600" style={{ fontFamily: "Manrope-ExtraBold" }}>
                  {latestProgress.weight_kg} кг
                </Text>
              ) : null}
            </View>

            {(progressEntries?.length || 0) > 1 ? (
              <LineChart
                data={weightChartData}
                width={Dimensions.get("window").width - 32}
                height={190}
                bezier
                withInnerLines={false}
                withOuterLines={false}
                chartConfig={{
                  backgroundColor: isDark ? "#161625" : "#FFFFFF",
                  backgroundGradientFrom: isDark ? "#161625" : "#FFFFFF",
                  backgroundGradientTo: isDark ? "#161625" : "#FFFFFF",
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(43, 142, 240, ${opacity})`,
                  labelColor: (opacity = 1) =>
                    isDark ? `rgba(144, 144, 176, ${opacity})` : `rgba(112, 112, 160, ${opacity})`,
                  propsForDots: { r: "4", strokeWidth: "2", stroke: "#2B8EF0" },
                }}
                style={{ marginVertical: 8, borderRadius: 20 }}
              />
            ) : (
              <View className="items-center justify-center py-10">
                <Text className="text-dark-400 dark:text-dark-300">Добавьте хотя бы 2 записи веса,</Text>
                <Text className="text-dark-400 dark:text-dark-300">чтобы увидеть график</Text>
              </View>
            )}
          </Card>
        </View>
      ) : null}

      <View className="mt-8 gap-4">
        <View className="px-1">
          <Text className="text-sm uppercase tracking-[2px] text-dark-400 dark:text-dark-300">Настройки</Text>
        </View>

        <Card variant="elevated" padding="none">
          <View className="border-b border-black/5 px-4 py-4 dark:border-white/8">
            <View className="flex-row items-center gap-3">
              <Settings size={20} color="#7070A0" />
              <Text className="flex-1 text-base text-surface-900 dark:text-white" style={{ fontFamily: "Manrope-Bold" }}>
                Настройки приложения
              </Text>
            </View>
          </View>

          <View className="border-b border-black/5 px-4 py-4 dark:border-white/8">
            <Text className="mb-3 text-xs uppercase tracking-[1.6px] text-dark-400 dark:text-dark-300">
              Тема оформления
            </Text>
            <View className="flex-row rounded-[18px] bg-surface-50 p-1.5 dark:bg-dark-950">
              {[
                { key: "light", label: "Светлая", icon: <Sun size={16} color={themePreference === "light" ? "#2B8EF0" : "#9090B0"} /> },
                { key: "dark", label: "Тёмная", icon: <Moon size={16} color={themePreference === "dark" ? "#2B8EF0" : "#9090B0"} /> },
                { key: "system", label: "Система", icon: <Monitor size={16} color={themePreference === "system" ? "#2B8EF0" : "#9090B0"} /> },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => setThemePreference(option.key as "light" | "dark" | "system")}
                  className={`flex-1 flex-row items-center justify-center rounded-[14px] px-3 py-3 ${
                    themePreference === option.key ? "bg-primary-600/12" : ""
                  }`}
                >
                  {option.icon}
                  <Text
                    className={`ml-2 text-sm ${themePreference === option.key ? "text-primary-600" : "text-dark-400 dark:text-dark-300"}`}
                    style={{ fontFamily: "Manrope-Bold" }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity className="px-4 py-4">
            <View className="flex-row items-center gap-3">
              <Mail size={20} color="#7070A0" />
              <Text className="flex-1 text-base text-surface-900 dark:text-white">Связаться с поддержкой</Text>
            </View>
          </TouchableOpacity>
        </Card>

        {user ? (
          <>
            <CustomButton
              title="Пройти онбординг заново"
              onPress={handleRestartOnboarding}
              variant="outline"
              size="lg"
            />
            <CustomButton
              title="Выйти из аккаунта"
              onPress={handleSignOut}
              variant="ghost"
              size="lg"
              textClassName="text-error"
              icon={<LogOut size={18} color="#FF5656" />}
            />
          </>
        ) : (
          <>
            <CustomButton
              title="Войти"
              onPress={() => router.push("/auth/login")}
              variant="primary"
              size="lg"
              icon={<LogIn size={18} color="#FFFFFF" />}
            />
            <CustomButton
              title="Регистрация"
              onPress={() => router.push("/auth/register")}
              variant="outline"
              size="lg"
            />
          </>
        )}
      </View>
    </ScrollView>
  );
}
