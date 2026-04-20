import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

import { useOnboarding } from "@/lib/onboarding-context";
import { Card, CustomButton, CustomInput } from "@/components/atoms";
import { useAppTheme } from "@/context/theme-context";
import { FORCE_ONBOARDING_STORAGE_KEY, saveOnboardingSettings } from "@/services/auth";

function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const { resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <View>
      <Text
        className={`text-center text-[32px] leading-9 ${isDark ? "text-white" : "text-surface-900"}`}
        style={{ fontFamily: "Manrope-ExtraBold" }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text className={`mt-2 text-center text-base ${isDark ? "text-dark-300" : "text-dark-400"}`}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

function OptionCard({
  selected,
  title,
  description,
  emoji,
  onPress,
}: {
  selected: boolean;
  title: string;
  description?: string;
  emoji?: string;
  onPress: () => void;
}) {
  const { resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className={`rounded-[20px] border p-4 ${
        selected
          ? isDark
            ? "border-primary-500 bg-dark-800"
            : "border-primary-500 bg-primary-50"
          : isDark
            ? "border-white/8 bg-dark-900"
            : "border-black/8 bg-white"
      }`}
    >
      <View className="flex-row items-center gap-3">
        {emoji ? (
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary-600/10">
            <Text className="text-2xl">{emoji}</Text>
          </View>
        ) : null}
        <View className="flex-1">
          <Text
            className={`${selected ? "text-primary-500" : isDark ? "text-white" : "text-surface-900"}`}
            style={{ fontFamily: selected ? "Manrope-Bold" : "Manrope-Medium", fontSize: 18 }}
          >
            {title}
          </Text>
          {description ? (
            <Text className={`mt-1 text-sm ${isDark ? "text-dark-300" : "text-dark-400"}`}>{description}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className={`rounded-full border px-5 py-3 ${
        selected
          ? "border-primary-500 bg-primary-600"
          : isDark
            ? "border-white/8 bg-dark-900"
            : "border-black/8 bg-white"
      }`}
    >
      <Text
        className={selected ? "text-white" : isDark ? "text-dark-300" : "text-dark-400"}
        style={{ fontFamily: "Manrope-Bold" }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function StepBasicInfo() {
  const { settings, setSetting } = useOnboarding();
  const [yearText, setYearText] = useState(
    settings.birth_date ? new Date(settings.birth_date).getFullYear().toString() : ""
  );

  const handleYearChange = (value: string) => {
    const next = value.replace(/[^0-9]/g, "");
    setYearText(next);

    if (!next) {
      setSetting("birth_date", null);
      return;
    }

    if (next.length === 4) {
      const year = parseInt(next, 10);
      if (year > 1900 && year <= new Date().getFullYear()) {
        const date = new Date();
        date.setFullYear(year, 0, 1);
        setSetting("birth_date", date.toISOString());
      } else {
        setSetting("birth_date", null);
      }
    }
  };

  return (
    <View className="gap-6">
      <StepTitle title="Основные данные" subtitle="Расскажите немного о себе." />

      <View className="gap-3">
        <OptionCard
          selected={settings.gender === "male"}
          title="Мужской"
          emoji="🧍"
          onPress={() => setSetting("gender", "male")}
        />
        <OptionCard
          selected={settings.gender === "female"}
          title="Женский"
          emoji="🧍‍♀️"
          onPress={() => setSetting("gender", "female")}
        />
      </View>

      <View className="gap-4">
        <CustomInput
          label="Рост (см)"
          placeholder="175"
          keyboardType="number-pad"
          value={settings.height_cm ? String(settings.height_cm) : ""}
          onChangeText={(value) => setSetting("height_cm", parseInt(value, 10) || null)}
        />
        <CustomInput
          label="Вес (кг)"
          placeholder="70"
          keyboardType="decimal-pad"
          value={settings.weight_kg ? String(settings.weight_kg) : ""}
          onChangeText={(value) => setSetting("weight_kg", parseFloat(value.replace(",", ".")) || null)}
        />
        <CustomInput
          label="Год рождения"
          placeholder="1995"
          keyboardType="number-pad"
          value={yearText}
          onChangeText={handleYearChange}
          maxLength={4}
        />
      </View>
    </View>
  );
}

function StepGoal() {
  const { settings, setSetting } = useOnboarding();
  const { resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === "dark";

  const goals = [
    { value: "weight_loss", label: "Похудение", emoji: "🔥" },
    { value: "muscle_gain", label: "Набор массы", emoji: "💪" },
    { value: "maintain", label: "Поддержание формы", emoji: "✨" },
  ] as const;

  const activityLevels = [
    { value: "sedentary", label: "Сидячий" },
    { value: "light", label: "Лёгкий" },
    { value: "moderate", label: "Умеренный" },
    { value: "active", label: "Активный" },
    { value: "very_active", label: "Очень активный" },
  ] as const;

  return (
    <View className="gap-6">
      <StepTitle title="Ваша цель" subtitle="Чего вы хотите достичь?" />

      <View className="gap-3">
        {goals.map((goal) => (
          <OptionCard
            key={goal.value}
            selected={settings.goal === goal.value}
            title={goal.label}
            emoji={goal.emoji}
            onPress={() => setSetting("goal", goal.value)}
          />
        ))}
      </View>

      <View>
        <Text className={`mb-3 text-lg ${isDark ? "text-white" : "text-surface-900"}`} style={{ fontFamily: "Manrope-Bold" }}>
          Уровень активности
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {activityLevels.map((level) => (
            <Chip
              key={level.value}
              label={level.label}
              selected={settings.activity_level === level.value}
              onPress={() => setSetting("activity_level", level.value)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function StepFitness() {
  const { settings, setSetting } = useOnboarding();
  const { resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === "dark";

  const fitnessLevels = [
    { value: "beginner", label: "Новичок", desc: "Только начинаю" },
    { value: "intermediate", label: "Средний", desc: "Занимаюсь регулярно" },
    { value: "advanced", label: "Продвинутый", desc: "Опыт более 2 лет" },
  ] as const;

  const workoutPrefs = [
    { value: "home", label: "Дома", emoji: "🏠" },
    { value: "outdoor", label: "На улице", emoji: "🌳" },
    { value: "gym", label: "В зале", emoji: "🏋️" },
    { value: "mixed", label: "Смешанные", emoji: "🔄" },
  ] as const;

  return (
    <View className="gap-6">
      <StepTitle title="Фитнес уровень" subtitle="Подберём нагрузку под ваш текущий ритм." />

      <View className="gap-3">
        {fitnessLevels.map((level) => (
          <OptionCard
            key={level.value}
            selected={settings.fitness_level === level.value}
            title={level.label}
            description={level.desc}
            onPress={() => setSetting("fitness_level", level.value)}
          />
        ))}
      </View>

      <View>
        <Text className={`mb-3 text-lg ${isDark ? "text-white" : "text-surface-900"}`} style={{ fontFamily: "Manrope-Bold" }}>
          Где будете тренироваться?
        </Text>
        <View className="gap-3">
          {workoutPrefs.map((pref) => (
            <OptionCard
              key={pref.value}
              selected={settings.workout_preference === pref.value}
              title={pref.label}
              emoji={pref.emoji}
              onPress={() => setSetting("workout_preference", pref.value)}
            />
          ))}
        </View>
      </View>

      <View className="gap-4">
        <CustomInput
          label="Тренировок в неделю"
          placeholder="3"
          keyboardType="number-pad"
          value={settings.workouts_per_week ? String(settings.workouts_per_week) : ""}
          onChangeText={(value) => setSetting("workouts_per_week", parseInt(value, 10) || null)}
        />
        <CustomInput
          label="Длительность (мин)"
          placeholder="45"
          keyboardType="number-pad"
          value={settings.workout_duration_min ? String(settings.workout_duration_min) : ""}
          onChangeText={(value) => setSetting("workout_duration_min", parseInt(value, 10) || null)}
        />
      </View>
    </View>
  );
}

function StepHealth() {
  const { settings, setSetting } = useOnboarding();
  const { resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === "dark";

  const sleepOptions = [
    { value: "poor", label: "Плохой" },
    { value: "fair", label: "Средний" },
    { value: "good", label: "Хороший" },
    { value: "excellent", label: "Отличный" },
  ] as const;

  const stressOptions = [
    { value: "low", label: "Низкий" },
    { value: "moderate", label: "Средний" },
    { value: "high", label: "Высокий" },
  ] as const;

  return (
    <View className="gap-6">
      <StepTitle title="Здоровье" subtitle="Учитываем сон, стресс и ограничения." />

      <View>
        <Text className={`mb-3 text-lg ${isDark ? "text-white" : "text-surface-900"}`} style={{ fontFamily: "Manrope-Bold" }}>
          Качество сна
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {sleepOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={settings.sleep_quality === option.value}
              onPress={() => setSetting("sleep_quality", option.value)}
            />
          ))}
        </View>
      </View>

      <View>
        <Text className={`mb-3 text-lg ${isDark ? "text-white" : "text-surface-900"}`} style={{ fontFamily: "Manrope-Bold" }}>
          Уровень стресса
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {stressOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={settings.stress_level === option.value}
              onPress={() => setSetting("stress_level", option.value)}
            />
          ))}
        </View>
      </View>

      <CustomInput
        label="Медицинские ограничения"
        placeholder="Грыжа, астма или нет"
        value={(settings.health_restrictions ?? []).join(", ")}
        onChangeText={(value) =>
          setSetting(
            "health_restrictions",
            value.split(",").map((item) => item.trim()).filter(Boolean)
          )
        }
      />
    </View>
  );
}

function StepNutrition() {
  const { settings, setSetting } = useOnboarding();
  const { resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === "dark";
  const [mealsText, setMealsText] = useState(settings.meals_per_day?.toString() ?? "");
  const [waterGoalText, setWaterGoalText] = useState(settings.water_intake_goal_ml?.toString() ?? "");

  const handleMealsChange = (value: string) => {
    const next = value.replace(/[^0-9]/g, "");
    setMealsText(next);
    setSetting("meals_per_day", next ? parseInt(next, 10) : null);
  };

  const handleWaterGoalChange = (value: string) => {
    const next = value.replace(/[^0-9]/g, "");
    setWaterGoalText(next);
    setSetting("water_intake_goal_ml", next ? parseInt(next, 10) : null);
  };

  const diets = useMemo(
    () => [
      { value: "standard", label: "Обычное" },
      { value: "vegetarian", label: "Вегетарианство" },
      { value: "vegan", label: "Веганство" },
      { value: "keto", label: "Кето" },
      { value: "paleo", label: "Палео" },
      { value: "mediterranean", label: "Средиземноморское" },
    ],
    []
  );

  return (
    <View className="gap-6">
      <StepTitle title="Питание" subtitle="Зададим базовые ориентиры по рациону." />

      <View className="gap-4">
        <CustomInput
          label="Приёмов пищи в день"
          placeholder="3"
          keyboardType="number-pad"
          value={mealsText}
          onChangeText={handleMealsChange}
        />
        <CustomInput
          label="Цель по воде (мл в день)"
          placeholder="2000"
          keyboardType="number-pad"
          value={waterGoalText}
          onChangeText={handleWaterGoalChange}
        />
      </View>

      <View>
        <Text className={`mb-3 text-lg ${isDark ? "text-white" : "text-surface-900"}`} style={{ fontFamily: "Manrope-Bold" }}>
          Принципы питания
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {diets.map((diet) => {
            const selected = (settings.dietary_preferences ?? []).includes(diet.value);
            return (
              <Chip
                key={diet.value}
                label={diet.label}
                selected={selected}
                onPress={() => {
                  const current = settings.dietary_preferences ?? [];
                  const next = selected
                    ? current.filter((item) => item !== diet.value)
                    : [...current, diet.value];
                  setSetting("dietary_preferences", next);
                }}
              />
            );
          })}
        </View>
      </View>

      <CustomInput
        label="Аллергии"
        placeholder="Орехи, молоко или нет"
        value={(settings.allergies ?? []).join(", ")}
        onChangeText={(value) =>
          setSetting("allergies", value.split(",").map((item) => item.trim()).filter(Boolean))
        }
      />
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const { resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <View className={`flex-row items-center justify-between border-b py-3 last:border-b-0 ${isDark ? "border-white/8" : "border-black/6"}`}>
      <Text className={`text-sm ${isDark ? "text-dark-300" : "text-dark-400"}`}>{label}</Text>
      <Text className={`text-sm ${isDark ? "text-white" : "text-surface-900"}`} style={{ fontFamily: "Manrope-Bold" }}>
        {value}
      </Text>
    </View>
  );
}

function StepSummary() {
  const { settings, calculateBMI, calculateDailyCalories } = useOnboarding();
  const { resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    calculateBMI();
    calculateDailyCalories();
  }, [
    calculateBMI,
    calculateDailyCalories,
    settings.activity_level,
    settings.birth_date,
    settings.gender,
    settings.goal,
    settings.height_cm,
    settings.weight_kg,
  ]);

  return (
    <View className="gap-6">
      <StepTitle title="Профиль готов" subtitle="Проверьте данные и подтвердите расчёты." />

      <Card variant="elevated" padding="lg" className={isDark ? "bg-dark-900" : "bg-white"}>
        <View className="gap-2">
          <SummaryRow label="Ваш ИМТ" value={settings.bmi?.toFixed(1) ?? "—"} />
          <SummaryRow
            label="Дневная норма калорий"
            value={`${settings.daily_calories?.toString() ?? "—"} ккал`}
          />
        </View>

        <View className="mt-5 flex-row gap-3">
          <View className={`flex-1 items-center rounded-2xl p-3 ${isDark ? "bg-dark-800" : "bg-surface-50"}`}>
            <Text className={`text-[10px] uppercase tracking-[1px] ${isDark ? "text-dark-300" : "text-dark-400"}`}>Белки</Text>
            <Text className={`mt-1 text-lg ${isDark ? "text-white" : "text-surface-900"}`} style={{ fontFamily: "Manrope-ExtraBold" }}>
              {settings.daily_protein_g ?? "—"}г
            </Text>
          </View>
          <View className={`flex-1 items-center rounded-2xl p-3 ${isDark ? "bg-dark-800" : "bg-surface-50"}`}>
            <Text className={`text-[10px] uppercase tracking-[1px] ${isDark ? "text-dark-300" : "text-dark-400"}`}>Жиры</Text>
            <Text className={`mt-1 text-lg ${isDark ? "text-white" : "text-surface-900"}`} style={{ fontFamily: "Manrope-ExtraBold" }}>
              {settings.daily_fat_g ?? "—"}г
            </Text>
          </View>
          <View className={`flex-1 items-center rounded-2xl p-3 ${isDark ? "bg-dark-800" : "bg-surface-50"}`}>
            <Text className={`text-[10px] uppercase tracking-[1px] ${isDark ? "text-dark-300" : "text-dark-400"}`}>Углеводы</Text>
            <Text className={`mt-1 text-lg ${isDark ? "text-white" : "text-surface-900"}`} style={{ fontFamily: "Manrope-ExtraBold" }}>
              {settings.daily_carbs_g ?? "—"}г
            </Text>
          </View>
        </View>
      </Card>

      <Card variant="outlined" padding="lg">
        <Text className={`mb-4 text-sm uppercase tracking-[2px] ${isDark ? "text-dark-300" : "text-dark-400"}`} style={{ fontFamily: "Manrope-Bold" }}>
          Сводка данных
        </Text>
        <View className="gap-2">
          <SummaryRow
            label="Пол"
            value={settings.gender === "male" ? "Мужской" : settings.gender === "female" ? "Женский" : "—"}
          />
          <SummaryRow
            label="Рост / Вес"
            value={`${settings.height_cm ?? "—"} см / ${settings.weight_kg ?? "—"} кг`}
          />
          <SummaryRow
            label="Цель"
            value={
              settings.goal === "weight_loss"
                ? "Похудение"
                : settings.goal === "muscle_gain"
                  ? "Набор массы"
                  : settings.goal === "maintain"
                    ? "Поддержание"
                    : "—"
            }
          />
          <SummaryRow
            label="Уровень"
            value={
              settings.fitness_level === "beginner"
                ? "Новичок"
                : settings.fitness_level === "intermediate"
                  ? "Средний"
                  : settings.fitness_level === "advanced"
                    ? "Продвинутый"
                    : "—"
            }
          />
        </View>
      </Card>
    </View>
  );
}

const stepComponents = [
  StepBasicInfo,
  StepGoal,
  StepFitness,
  StepHealth,
  StepNutrition,
  StepSummary,
];

export default function OnboardingScreen() {
  const { currentStep, totalSteps, nextStep, prevStep, settings } = useOnboarding();
  const { resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === "dark";
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const StepComponent = stepComponents[currentStep];
  const progress = useSharedValue((currentStep + 1) / totalSteps);

  useEffect(() => {
    progress.value = withTiming((currentStep + 1) / totalSteps, { duration: 350 });
  }, [currentStep, progress, totalSteps]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const handleNext = async () => {
    if (currentStep === totalSteps - 1) {
      setSaving(true);
      try {
        await saveOnboardingSettings({
          ...settings,
          onboarding_step: totalSteps - 1,
        });
        await AsyncStorage.removeItem(FORCE_ONBOARDING_STORAGE_KEY);
        await AsyncStorage.setItem("fitnes_onboarding_completed", "true");
        router.replace("/(tabs)");
      } catch (error) {
        console.warn("Failed to save onboarding settings:", error);
        Alert.alert(
          "Ошибка сохранения",
          "Не удалось сохранить результаты онбординга. Проверьте соединение и попробуйте ещё раз."
        );
      } finally {
        setSaving(false);
      }
      return;
    }

    nextStep();
  };

  return (
    <View className={`flex-1 ${isDark ? "bg-dark-950" : "bg-surface-50"}`}>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerClassName="pb-10"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View className="mb-8">
          <View className={`mb-3 h-[3px] overflow-hidden rounded-full ${isDark ? "bg-dark-800" : "bg-surface-200"}`}>
            <Animated.View className="h-full rounded-full bg-primary-500" style={progressStyle} />
          </View>
          <Text className="text-center text-sm uppercase tracking-[2px] text-primary-400" style={{ fontFamily: "Manrope-Bold" }}>
            Шаг {currentStep + 1} из {totalSteps}
          </Text>
        </View>

        <StepComponent />

        <View className="mt-10 gap-3">
          <CustomButton
            title={currentStep === totalSteps - 1 ? "Готово" : "Продолжить"}
            onPress={handleNext}
            variant="primary"
            size="lg"
            isLoading={saving}
            icon={saving ? undefined : <ChevronRight size={18} color="#FFFFFF" />}
          />
          {currentStep > 0 ? (
            <CustomButton
              title="Вернуться назад"
              onPress={prevStep}
              variant="ghost"
              size="lg"
              icon={<ChevronLeft size={18} color="#2B8EF0" />}
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
