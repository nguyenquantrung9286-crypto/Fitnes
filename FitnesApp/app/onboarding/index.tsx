import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useOnboarding } from "@/lib/onboarding-context";
import { CustomButton, CustomInput, Card } from "@/components/atoms";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

// ============================================================
// Step 0: Basic Info (Пол, Вес, Рост)
// ============================================================
function StepBasicInfo() {
  const { settings, setSetting } = useOnboarding();

  return (
    <View className="gap-5">
      <View>
        <Text className="text-center text-3xl font-bold text-gray-900 dark:text-gray-50">
          Основные данные
        </Text>
        <Text className="text-center text-base text-gray-500 dark:text-gray-400 mt-1">
          Расскажите немного о себе
        </Text>
      </View>

      {/* Gender */}
      <View>
        <Text className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-50">Пол</Text>
        <View className="flex-row gap-4">
          <TouchableOpacity
            onPress={() => setSetting("gender", "male")}
            className={`flex-1 rounded-2xl border-2 p-4 ${settings.gender === "male"
              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10"
              : "border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-900"
              }`}
          >
            <Text
              className={`text-center text-lg ${settings.gender === "male"
                ? "text-primary-600 dark:text-primary-400 font-bold"
                : "text-gray-600 dark:text-gray-400"
                }`}
            >
              Мужской
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSetting("gender", "female")}
            className={`flex-1 rounded-2xl border-2 p-4 ${settings.gender === "female"
              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10"
              : "border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-900"
              }`}
          >
            <Text
              className={`text-center text-lg ${settings.gender === "female"
                ? "text-primary-600 dark:text-primary-400 font-bold"
                : "text-gray-600 dark:text-gray-400"
                }`}
            >
              Женский
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Height & Weight */}
      <View className="gap-4">
        <CustomInput
          label="Рост (см)"
          placeholder="175"
          keyboardType="number-pad"
          value={settings.height_cm?.toString() ?? ""}
          onChangeText={(v) => setSetting("height_cm", parseInt(v) || 0)}
        />

        <CustomInput
          label="Вес (кг)"
          placeholder="70"
          keyboardType="decimal-pad"
          value={settings.weight_kg?.toString() ?? ""}
          onChangeText={(v) => setSetting("weight_kg", parseFloat(v) || 0)}
        />
      </View>
    </View>
  );
}

// ============================================================
// Step 1: Goal (Цель, Уровень активности)
// ============================================================
function StepGoal() {
  const { settings, setSetting } = useOnboarding();

  const goals = [
    { value: "weight_loss", label: "Похудение", emoji: "🔥" },
    { value: "muscle_gain", label: "Набор массы", emoji: "💪" },
    { value: "maintain", label: "Поддержание формы", emoji: "✨" },
  ];

  const activityLevels = [
    { value: "sedentary", label: "Сидячий" },
    { value: "light", label: "Лёгкий" },
    { value: "moderate", label: "Умеренный" },
    { value: "active", label: "Активный" },
    { value: "very_active", label: "Очень активный" },
  ];

  return (
    <View className="gap-6">
      <View>
        <Text className="text-center text-3xl font-bold text-gray-900 dark:text-gray-50">
          Ваша цель
        </Text>
        <Text className="text-center text-base text-gray-500 dark:text-gray-400 mt-1">
          Чего вы хотите достичь?
        </Text>
      </View>

      {/* Goals */}
      <View>
        <Text className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-50">Цель</Text>
        <View className="gap-3">
          {goals.map((g) => (
            <TouchableOpacity
              key={g.value}
              onPress={() => setSetting("goal", g.value)}
              className={`rounded-2xl border-2 p-4 flex-row items-center ${settings.goal === g.value
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10"
                : "border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-900"
                }`}
            >
              <Text className="text-2xl mr-3">{g.emoji}</Text>
              <Text
                className={`text-lg flex-1 ${settings.goal === g.value
                  ? "font-bold text-primary-600 dark:text-primary-400"
                  : "text-gray-700 dark:text-gray-300"
                  }`}
              >
                {g.label}
              </Text>
              {settings.goal === g.value && (
                <View className="h-6 w-6 rounded-full bg-primary-500 items-center justify-center">
                  <ChevronRight size={16} color="white" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Activity level */}
      <View>
        <Text className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-50">
          Уровень активности
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {activityLevels.map((al) => (
            <TouchableOpacity
              key={al.value}
              onPress={() => setSetting("activity_level", al.value)}
              className={`rounded-full px-5 py-2.5 ${settings.activity_level === al.value
                ? "bg-primary-500 shadow-md shadow-primary-500/20"
                : "bg-gray-100 dark:bg-dark-800"
                }`}
            >
              <Text
                className={
                  settings.activity_level === al.value
                    ? "font-bold text-white"
                    : "text-gray-700 dark:text-gray-400"
                }
              >
                {al.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

// ============================================================
// Step 2: Fitness Level & Preferences
// ============================================================
function StepFitness() {
  const { settings, setSetting } = useOnboarding();

  const fitnessLevels = [
    { value: "beginner", label: "Новичок", desc: "Только начинаю" },
    {
      value: "intermediate",
      label: "Средний",
      desc: "Занимаюсь регулярно",
    },
    { value: "advanced", label: "Продвинутый", desc: "Опыт более 2 лет" },
  ];

  const workoutPrefs = [
    { value: "home", label: "Дома", emoji: "🏠" },
    { value: "outdoor", label: "На улице", emoji: "🌳" },
    { value: "gym", label: "В зале", emoji: "🏋️" },
    { value: "mixed", label: "Смешанные", emoji: "🔄" },
  ];

  return (
    <View className="gap-5">
      <View>
        <Text className="text-center text-3xl font-bold text-gray-900 dark:text-gray-50">
          Фитнес уровень
        </Text>
      </View>

      {/* Fitness level */}
      <View className="gap-3">
        {fitnessLevels.map((fl) => (
          <TouchableOpacity
            key={fl.value}
            onPress={() => setSetting("fitness_level", fl.value)}
            className={`rounded-2xl border-2 p-4 ${settings.fitness_level === fl.value
              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10"
              : "border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-900"
              }`}
          >
            <Text
              className={`text-lg ${settings.fitness_level === fl.value
                ? "font-bold text-primary-600 dark:text-primary-400"
                : "text-gray-700 dark:text-gray-300"
                }`}
            >
              {fl.label}
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">{fl.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Workout preference */}
      <View>
        <Text className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-50">
          Где будете тренироваться?
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {workoutPrefs.map((wp) => (
            <TouchableOpacity
              key={wp.value}
              onPress={() => setSetting("workout_preference", wp.value)}
              className={`rounded-xl px-4 py-3 ${settings.workout_preference === wp.value
                ? "bg-primary-500 shadow-md shadow-primary-500/20"
                : "bg-gray-100 dark:bg-dark-800"
                }`}
            >
              <Text
                className={
                  settings.workout_preference === wp.value
                    ? "font-bold text-white"
                    : "text-gray-700 dark:text-gray-400"
                }
              >
                {wp.emoji} {wp.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Inputs */}
      <View className="gap-4">
        <CustomInput
          label="Тренировок в неделю"
          placeholder="3"
          keyboardType="number-pad"
          value={settings.workouts_per_week?.toString() ?? ""}
          onChangeText={(v) =>
            setSetting("workouts_per_week", parseInt(v) || 3)
          }
        />

        <CustomInput
          label="Длительность (мин)"
          placeholder="45"
          keyboardType="number-pad"
          value={settings.workout_duration_min?.toString() ?? ""}
          onChangeText={(v) =>
            setSetting("workout_duration_min", parseInt(v) || 45)
          }
        />
      </View>
    </View>
  );
}

// ============================================================
// Step 3: Health
// ============================================================
function StepHealth() {
  const { settings, setSetting } = useOnboarding();

  const sleepOptions = [
    { value: "poor", label: "Плохой" },
    { value: "fair", label: "Средний" },
    { value: "good", label: "Хороший" },
    { value: "excellent", label: "Отличный" },
  ];

  const stressOptions = [
    { value: "low", label: "Низкий" },
    { value: "moderate", label: "Средний" },
    { value: "high", label: "Высокий" },
  ];

  return (
    <View className="gap-6">
      <View>
        <Text className="text-center text-3xl font-bold text-gray-900 dark:text-gray-50">
          Здоровье
        </Text>
      </View>

      {/* Sleep quality */}
      <View>
        <Text className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-50">
          Качество сна
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {sleepOptions.map((s) => (
            <TouchableOpacity
              key={s.value}
              onPress={() => setSetting("sleep_quality", s.value)}
              className={`rounded-full px-5 py-2.5 ${settings.sleep_quality === s.value
                ? "bg-primary-500 shadow-md shadow-primary-500/20"
                : "bg-gray-100 dark:bg-dark-800"
                }`}
            >
              <Text
                className={
                  settings.sleep_quality === s.value
                    ? "text-white font-bold"
                    : "text-gray-700 dark:text-gray-400"
                }
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stress level */}
      <View>
        <Text className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-50">
          Уровень стресса
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {stressOptions.map((s) => (
            <TouchableOpacity
              key={s.value}
              onPress={() => setSetting("stress_level", s.value)}
              className={`rounded-full px-5 py-2.5 ${settings.stress_level === s.value
                ? "bg-primary-500 shadow-md shadow-primary-500/20"
                : "bg-gray-100 dark:bg-dark-800"
                }`}
            >
              <Text
                className={
                  settings.stress_level === s.value
                    ? "text-white font-bold"
                    : "text-gray-700 dark:text-gray-400"
                }
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Health restrictions */}
      <CustomInput
        label="Медицинские ограничения"
        placeholder="Грыжа, астма или нет"
        value={(settings.health_restrictions ?? []).join(", ")}
        onChangeText={(v) =>
          setSetting(
            "health_restrictions",
            v.split(",").map((s) => s.trim()).filter(Boolean)
          )
        }
      />
    </View>
  );
}

// ============================================================
// Step 4: Nutrition
// ============================================================
function StepNutrition() {
  const { settings, setSetting } = useOnboarding();

  return (
    <View className="gap-6">
      <View>
        <Text className="text-center text-3xl font-bold text-gray-900 dark:text-gray-50">
          Питание
        </Text>
      </View>

      <View className="gap-4">
        {/* Meals per day */}
        <CustomInput
          label="Приёмов пищи в день"
          placeholder="3"
          keyboardType="number-pad"
          value={settings.meals_per_day?.toString() ?? ""}
          onChangeText={(v) => setSetting("meals_per_day", parseInt(v) || 3)}
        />

        {/* Water intake goal */}
        <CustomInput
          label="Цель по воде (мл в день)"
          placeholder="2000"
          keyboardType="number-pad"
          value={settings.water_intake_goal_ml?.toString() ?? ""}
          onChangeText={(v) =>
            setSetting("water_intake_goal_ml", parseInt(v) || 2000)
          }
        />
      </View>

      {/* Dietary preferences */}
      <View>
        <Text className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-50">
          Принципы питания
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {[
            "standard",
            "vegetarian",
            "vegan",
            "keto",
            "paleo",
            "mediterranean",
          ].map((pref) => {
            const labels: Record<string, string> = {
              standard: "Обычное",
              vegetarian: "Вегетарианство",
              vegan: "Веганство",
              keto: "Кето",
              paleo: "Палео",
              mediterranean: "Средиземноморское",
            };
            const isSelected = (settings.dietary_preferences ?? []).includes(
              pref
            );
            return (
              <TouchableOpacity
                key={pref}
                onPress={() => {
                  const current = settings.dietary_preferences ?? [];
                  const updated = isSelected
                    ? current.filter((p) => p !== pref)
                    : [...current, pref];
                  setSetting("dietary_preferences", updated);
                }}
                className={`rounded-full px-5 py-2.5 ${isSelected ? "bg-accent-500 shadow-md shadow-accent-500/20" : "bg-gray-100 dark:bg-dark-800"
                  }`}
              >
                <Text
                  className={
                    isSelected ? "text-white font-bold" : "text-gray-700 dark:text-gray-400"
                  }
                >
                  {labels[pref]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Allergies */}
      <CustomInput
        label="Аллергии"
        placeholder="Орехи, молоко или нет"
        value={(settings.allergies ?? []).join(", ")}
        onChangeText={(v) =>
          setSetting(
            "allergies",
            v.split(",").map((s) => s.trim()).filter(Boolean)
          )
        }
      />
    </View>
  );
}

// ============================================================
// Step 5: Summary & Confirm
// ============================================================
function StepSummary() {
  const { settings, calculateBMI, calculateDailyCalories } = useOnboarding();

  // Auto-calculate on mount
  useEffect(() => {
    calculateBMI();
    calculateDailyCalories();
  }, []);

  return (
    <View className="gap-6">
      <View>
        <Text className="text-center text-3xl font-bold text-gray-900 dark:text-gray-50">
          Ваш профиль готов! 🎉
        </Text>
        <Text className="text-center text-base text-gray-500 dark:text-gray-400 mt-1">
          Проверьте данные и подтвердите
        </Text>
      </View>

      <Card variant="elevated" padding="md">
        <View className="gap-3">
          <SummaryRow
            label="Ваш ИМТ"
            value={settings.bmi?.toFixed(1) ?? "—"}
          />
          <SummaryRow
            label="Дневная норма калорий"
            value={`${settings.daily_calories?.toString() ?? "—"} ккал`}
            highlight
          />
          <View className="flex-row gap-3 mt-1">
            <View className="flex-1 bg-gray-50 dark:bg-dark-800 p-3 rounded-xl items-center border border-gray-100 dark:border-dark-700">
              <Text className="text-[10px] uppercase font-bold text-gray-400 mb-1">Белки</Text>
              <Text className="font-bold text-gray-900 dark:text-gray-50">{settings.daily_protein_g}г</Text>
            </View>
            <View className="flex-1 bg-gray-50 dark:bg-dark-800 p-3 rounded-xl items-center border border-gray-100 dark:border-dark-700">
              <Text className="text-[10px] uppercase font-bold text-gray-400 mb-1">Жиры</Text>
              <Text className="font-bold text-gray-900 dark:text-gray-50">{settings.daily_fat_g}г</Text>
            </View>
            <View className="flex-1 bg-gray-50 dark:bg-dark-800 p-3 rounded-xl items-center border border-gray-100 dark:border-dark-700">
              <Text className="text-[10px] uppercase font-bold text-gray-400 mb-1">Углеводы</Text>
              <Text className="font-bold text-gray-900 dark:text-gray-50">{settings.daily_carbs_g}г</Text>
            </View>
          </View>
        </View>
      </Card>

      <Card variant="outlined" padding="md" className="border-gray-100 dark:border-dark-800">
        <Text className="mb-4 text-sm font-bold text-gray-900 dark:text-gray-50 uppercase tracking-widest">
          Сводка данных
        </Text>
        <View className="gap-2">
          <SummaryText
            label="Пол"
            value={settings.gender === "male" ? "Мужской" : "Женский"}
          />
          <SummaryText label="Рост / Вес" value={`${settings.height_cm} см / ${settings.weight_kg} кг`} />
          <SummaryText
            label="Цель"
            value={
              settings.goal === "weight_loss"
                ? "Похудение"
                : settings.goal === "muscle_gain"
                  ? "Набор массы"
                  : "Поддержание"
            }
          />
          <SummaryText
            label="Уровень"
            value={
              settings.fitness_level === "beginner"
                ? "Новичок"
                : settings.fitness_level === "intermediate"
                  ? "Средний"
                  : "Продвинутый"
            }
          />
        </View>
      </Card>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View className="flex-row justify-between border-b border-gray-100 dark:border-dark-800 py-3 last:border-0 text-gray-900 dark:text-gray-50">
      <Text className="text-gray-500 dark:text-gray-400 font-medium">{label}</Text>
      <Text className={`font-bold ${highlight ? 'text-primary-600 dark:text-primary-400 text-lg' : 'text-gray-900 dark:text-gray-50'}`}>{value}</Text>
    </View>
  );
}

function SummaryText({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Text className="text-sm text-gray-600 dark:text-gray-400">
      <Text className="font-bold text-gray-900 dark:text-gray-300">{label}:</Text> {value}
    </Text>
  );
}

// ============================================================
// Main Onboarding Screen with Steps Navigation
// ============================================================
const stepComponents = [
  StepBasicInfo,
  StepGoal,
  StepFitness,
  StepHealth,
  StepNutrition,
  StepSummary,
];

export default function OnboardingScreen() {
  const { currentStep, totalSteps, nextStep, prevStep } =
    useOnboarding();
  const router = useRouter();
  const StepComponent = stepComponents[currentStep];

  const handleNext = async () => {
    if (currentStep === totalSteps - 1) {
      // Final step — complete onboarding
      await AsyncStorage.setItem("fitnes_onboarding_completed", "true");
      router.replace("/(tabs)");
    } else {
      nextStep();
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-dark-950">
      <ScrollView className="flex-1 px-6 pt-16">
        {/* Progress bar */}
        <View className="mb-8 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-dark-800">
          <View
            className="h-full rounded-full bg-primary-500"
            style={{
              width: `${((currentStep + 1) / totalSteps) * 100}%`,
            }}
          />
        </View>

        {/* Step indicator */}
        <Text className="mb-6 text-center text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest">
          Шаг {currentStep + 1} из {totalSteps}
        </Text>

        {/* Step content */}
        <StepComponent />

        {/* Navigation buttons */}
        <View className="mb-12 mt-10 gap-3">
          <CustomButton
            title={currentStep === totalSteps - 1 ? "Готово" : "Продолжить"}
            onPress={handleNext}
            variant="primary"
            size="lg"
            className="shadow-lg shadow-primary-500/20"
            icon={<ChevronRight size={20} color="#FFFFFF" />}
          />
          {currentStep > 0 && (
            <CustomButton
              title="Вернуться назад"
              onPress={prevStep}
              variant="ghost"
              size="lg"
              icon={<ChevronLeft size={20} color="#7C3AED" />}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
