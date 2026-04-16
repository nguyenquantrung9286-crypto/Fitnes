import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { useWorkouts } from "@/services/api";
import { Card } from "@/components/atoms";
import { Dumbbell, Play, Calendar, Clock } from "lucide-react-native";
import { Workout } from "@/types";
import { ActivityIndicator } from "react-native";

function WorkoutItem({ item }: { item: Workout }) {
  const router = useRouter();

  const difficultyLabels: Record<string, string> = {
    easy: "Лёгкая",
    medium: "Средняя",
    hard: "Сложная",
  };

  const difficultyClasses: Record<string, string> = {
    easy: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    medium: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    hard: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  };

  const dateStr = item.scheduled_at
    ? new Date(item.scheduled_at).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    })
    : "Не запланирована";

  return (
    <TouchableOpacity
      onPress={() => router.push(`/workouts/${item.id}`)}
      activeOpacity={0.7}
    >
      <Card variant="elevated" padding="md" className="mb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-50">
              {item.name}
            </Text>
            {item.description && (
              <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400" numberOfLines={1}>
                {item.description}
              </Text>
            )}
            <View className="mt-3 flex-row items-center gap-4">
              <View className="flex-row items-center gap-1.5">
                <Calendar size={14} color="#9CA3AF" />
                <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium">{dateStr}</Text>
              </View>
              {item.duration_min && (
                <View className="flex-row items-center gap-1.5">
                  <Clock size={14} color="#9CA3AF" />
                  <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {item.duration_min} мин
                  </Text>
                </View>
              )}
              {item.difficulty_level && (
                <View className={`rounded-full px-2 py-0.5 ${difficultyClasses[item.difficulty_level] ?? 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400'}`}>
                  <Text className="text-[10px] font-bold uppercase tracking-wider">
                    {difficultyLabels[item.difficulty_level] ?? item.difficulty_level}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/40">
            <Play size={20} color="#7C3AED" fill="#7C3AED" />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function WorkoutsScreen() {
  const { data: workouts, isLoading, error } = useWorkouts();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-dark-950">
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-dark-950 px-6">
        <Text className="text-center text-lg font-bold text-red-500">
          Ошибка загрузки
        </Text>
        <Text className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          {error.message}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-dark-950">
      {/* Header */}
      <View className="bg-white dark:bg-dark-900 px-6 pt-16 pb-6 shadow-sm">
        <Text className="text-3xl font-bold text-gray-900 dark:text-gray-50">Тренировки</Text>
        <Text className="mt-1 text-base text-gray-500 dark:text-gray-400 font-medium">
          {workouts?.length ?? 0} занятий запланировано
        </Text>
      </View>

      {/* List */}
      <FlashList
        data={workouts ?? []}
        renderItem={({ item }) => <WorkoutItem item={item} />}
        estimatedItemSize={120}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 py-4"
        ListEmptyComponent={
          <View className="items-center justify-center px-10 py-20 opacity-60">
            <Dumbbell size={80} color="#9CA3AF" />
            <Text className="mt-5 text-center text-xl font-bold text-gray-900 dark:text-gray-50">
              Пока пусто
            </Text>
            <Text className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              Пройдите онбординг, чтобы ИИ составил персональный план тренировок для вас
            </Text>
          </View>
        }
      />
    </View>
  );
}
