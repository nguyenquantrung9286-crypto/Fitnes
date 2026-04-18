import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Card, CustomButton } from "@/components/atoms";
import { ChevronLeft, RotateCcw, Check } from "lucide-react-native";
import { useState, useEffect } from "react";
import { useWorkoutDetail, useCompleteWorkout } from "@/services/api";
import { useVideoPlayer, VideoView } from "expo-video";

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);

  const { data: workout, isLoading, error } = useWorkoutDetail(id as string);
  const { mutate: completeWorkout, isPending: isCompleting } = useCompleteWorkout();

  const exercises = workout?.exercises || [];
  const exercise = exercises[currentExerciseIdx];

  const videoSource = exercise?.video_url || null;
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    if (videoSource) {
      player.play();
    }
  });

  useEffect(() => {
    if (videoSource) {
      player.replace(videoSource);
      player.play();
    }
  }, [videoSource]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-dark-950">
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (error || !workout) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-dark-950 px-6">
        <Text className="text-center text-lg text-red-500">Ошибка загрузки тренировки</Text>
        <CustomButton
          title="Вернуться назад"
          onPress={() => router.back()}
          variant="outline"
          style={{ marginTop: 20 }}
        />
      </View>
    );
  }

  const handleNext = () => {
    if (currentExerciseIdx < exercises.length - 1) {
      setCurrentExerciseIdx(currentExerciseIdx + 1);
    } else {
      completeWorkout(workout.id, {
        onSuccess: () => {
          router.replace("/(tabs)/workouts");
        },
      });
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-dark-950">
      {/* Header */}
      <View className="flex-row items-center bg-white dark:bg-dark-900 px-4 pt-14 pb-4 shadow-sm">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 rounded-full bg-gray-100 dark:bg-dark-800 p-2"
        >
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900 dark:text-gray-50" numberOfLines={1}>
            {workout.name}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            Упражнение {currentExerciseIdx + 1} из {exercises.length}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pb-4">
        {/* Video Player */}
        <Card variant="outlined" padding="none" style={{ marginTop: 12, overflow: "hidden" }}>
          <View className="aspect-video bg-black">
            {exercise?.video_url ? (
              <VideoView
                style={{ width: "100%", height: "100%" }}
                player={player}
                allowsFullscreen
                allowsPictureInPicture
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-white/70">Видео обучения отсутствует</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Exercise info */}
        {exercise && (
          <Card variant="elevated" padding="lg" style={{ marginTop: 12 }}>
            <Text className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              {exercise.name}
            </Text>
            {exercise.description && (
              <Text className="mt-3 text-base text-gray-600 dark:text-gray-400">
                {exercise.description}
              </Text>
            )}

            <View className="mt-4 flex-row gap-4">
              <StatBox label="Подходы" value={exercise.sets?.toString() ?? "—"} />
              {exercise.reps && <StatBox label="Повторы" value={exercise.reps.toString()} />}
              {exercise.duration_sec && (
                <StatBox label="Время" value={`${exercise.duration_sec}с`} />
              )}
              {exercise.rest_sec && <StatBox label="Отдых" value={`${exercise.rest_sec}с`} />}
            </View>
          </Card>
        )}

        {/* Navigation */}
        <View className="mt-6 flex-row gap-3">
          <CustomButton
            title="Назад"
            onPress={() => {
              if (currentExerciseIdx > 0) {
                setCurrentExerciseIdx(currentExerciseIdx - 1);
              }
            }}
            variant="outline"
            size="lg"
            style={{ flex: 1 }}
            icon={<RotateCcw size={20} color="#7C3AED" />}
            disabled={currentExerciseIdx === 0}
          />
          <CustomButton
            title={currentExerciseIdx === exercises.length - 1 ? "Завершить" : "Далее"}
            onPress={handleNext}
            variant="primary"
            size="lg"
            isLoading={isCompleting}
            style={{ flex: 2 }}
            icon={
              currentExerciseIdx === exercises.length - 1 ? (
                <Check size={20} color="#FFFFFF" />
              ) : undefined
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center rounded-xl bg-gray-50 dark:bg-dark-800 p-3">
      <Text className="text-xl font-bold text-primary-600">{value}</Text>
      <Text className="mt-1 text-xs text-gray-500 dark:text-gray-400">{label}</Text>
    </View>
  );
}
