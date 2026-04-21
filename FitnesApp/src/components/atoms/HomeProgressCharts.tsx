import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Apple, Dumbbell, Scale } from "lucide-react-native";
import { useWeightLogs, useWorkoutLogsLast7Days } from "@/services/api";
import Card from "./Card";
import CustomButton from "./CustomButton";
import NutritionChartPlaceholder from "./NutritionChartPlaceholder";
import WeightChart from "./WeightChart";
import WorkoutProgressChart from "./WorkoutProgressChart";

export default function HomeProgressCharts() {
  const router = useRouter();
  const { data: workoutLogs = [] } = useWorkoutLogsLast7Days();
  const { data: weightLogs = [] } = useWeightLogs();

  return (
    <View className="gap-4">
      <Card variant="elevated" padding="lg">
        <View className="mb-4 flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-[14px] bg-primary-600/12">
            <Dumbbell size={22} color="#2B8EF0" />
          </View>
          <View>
            <Text
              className="text-xl text-surface-900 dark:text-white"
              style={{ fontFamily: "Manrope-Bold" }}
            >
              Тренировки
            </Text>
            <Text className="text-sm text-dark-400 dark:text-dark-300">За последние 7 дней</Text>
          </View>
        </View>
        <WorkoutProgressChart logs={workoutLogs} />
      </Card>

      <Card variant="elevated" padding="lg">
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-[14px] bg-primary-600/12">
              <Scale size={22} color="#7C3AED" />
            </View>
            <View>
              <Text
                className="text-xl text-surface-900 dark:text-white"
                style={{ fontFamily: "Manrope-Bold" }}
              >
                Вес
              </Text>
              <Text className="text-sm text-dark-400 dark:text-dark-300">Динамика за 3 месяца</Text>
            </View>
          </View>
          <CustomButton
            title="+ Записать"
            onPress={() => router.push("/weight/add")}
            variant="outline"
            size="md"
          />
        </View>
        <WeightChart logs={weightLogs} />
      </Card>

      <Card variant="elevated" padding="lg">
        <View className="mb-2 flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-[14px] bg-warning/15">
            <Apple size={22} color="#FF8C42" />
          </View>
          <Text
            className="text-xl text-surface-900 dark:text-white"
            style={{ fontFamily: "Manrope-Bold" }}
          >
            КБЖУ по дням
          </Text>
        </View>
        <NutritionChartPlaceholder />
      </Card>
    </View>
  );
}
