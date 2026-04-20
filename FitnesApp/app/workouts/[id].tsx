import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Check, ChevronLeft, RotateCcw } from "lucide-react-native";
import { useVideoPlayer, VideoView } from "expo-video";

import { Card, CustomButton, DifficultyBadge } from "@/components/atoms";
import { useCompleteWorkout, useWorkoutDetail } from "@/services/api";

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center rounded-2xl bg-surface-100 dark:bg-dark-800 p-3">
      <Text className="text-xl text-primary-600 dark:text-primary-400" style={{ fontFamily: "Manrope-ExtraBold" }}>
        {value}
      </Text>
      <Text className="mt-1 text-xs uppercase tracking-[1px] text-dark-400 dark:text-dark-300">{label}</Text>
    </View>
  );
}

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);

  const { data: workout, isLoading, error } = useWorkoutDetail(id as string);
  const { mutate: completeWorkout, isPending: isCompleting } = useCompleteWorkout();

  const exercises = workout?.exercises || [];
  const exercise = exercises[currentExerciseIdx];

  const videoSource = exercise?.video_url || null;
  const player = useVideoPlayer(videoSource, (videoPlayer) => {
    videoPlayer.loop = true;
    if (videoSource) {
      videoPlayer.play();
    }
  });

  useEffect(() => {
    if (videoSource) {
      player.replace(videoSource);
      player.play();
    }
  }, [player, videoSource]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-50 dark:bg-dark-950">
        <ActivityIndicator size="large" color="#2B8EF0" />
      </View>
    );
  }

  if (error || !workout) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-50 dark:bg-dark-950 px-6">
        <Text className="text-center text-lg text-error">Ошибка загрузки тренировки</Text>
        <CustomButton
          title="Вернуться назад"
          onPress={() => router.back()}
          variant="outline"
          className="mt-5"
        />
      </View>
    );
  }

  const handleNext = () => {
    if (currentExerciseIdx < exercises.length - 1) {
      setCurrentExerciseIdx((prev) => prev + 1);
      return;
    }

    completeWorkout(workout.id, {
      onSuccess: () => {
        router.replace("/(tabs)/workouts");
      },
    });
  };

  return (
    <View className="flex-1 bg-surface-50 dark:bg-dark-950">
      <LinearGradient
        colors={["#17466B", "#2B8EF0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-4 pb-6 pt-14"
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 rounded-full bg-white/14 p-2.5"
          >
            <ChevronLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl text-white" style={{ fontFamily: "Manrope-ExtraBold" }} numberOfLines={1}>
              {workout.name}
            </Text>
            <Text className="mt-1 text-sm text-white/75">
              Упражнение {currentExerciseIdx + 1} из {exercises.length}
            </Text>
          </View>
          <DifficultyBadge level={workout.difficulty_level} />
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-8">
        <Card variant="outlined" padding="none" className="-mt-5 overflow-hidden">
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

        {exercise ? (
          <Card variant="elevated" padding="lg" className="mt-4">
            <Text className="text-[30px] leading-8 text-surface-900 dark:text-white" style={{ fontFamily: "Manrope-ExtraBold" }}>
              {exercise.name}
            </Text>
            {exercise.description ? (
              <Text className="mt-3 text-base leading-7 text-dark-500 dark:text-dark-300" style={{ fontFamily: "Manrope-Medium" }}>
                {exercise.description}
              </Text>
            ) : null}

            <View className="mt-5 flex-row gap-3">
              <StatBox label="Подходы" value={exercise.sets?.toString() ?? "—"} />
              {exercise.reps ? <StatBox label="Повторы" value={exercise.reps.toString()} /> : null}
              {exercise.duration_sec ? <StatBox label="Время" value={`${exercise.duration_sec}с`} /> : null}
              {exercise.rest_sec ? <StatBox label="Отдых" value={`${exercise.rest_sec}с`} /> : null}
            </View>
          </Card>
        ) : null}

        <Card variant="elevated" padding="lg" className="mt-4">
          <Text className="text-lg text-surface-900 dark:text-white" style={{ fontFamily: "Manrope-Bold" }}>
            Прогресс тренировки
          </Text>
          <View className="mt-4 h-2 overflow-hidden rounded-full bg-surface-100 dark:bg-dark-700">
            <View
              className="h-full rounded-full bg-primary-500"
              style={{ width: `${((currentExerciseIdx + 1) / Math.max(exercises.length, 1)) * 100}%` }}
            />
          </View>
        </Card>

        <View className="mt-6 flex-row gap-3">
          <CustomButton
            title="Назад"
            onPress={() => {
              if (currentExerciseIdx > 0) {
                setCurrentExerciseIdx((prev) => prev - 1);
              }
            }}
            variant="outline"
            size="lg"
            className="flex-1"
            icon={<RotateCcw size={18} color="#2B8EF0" />}
            disabled={currentExerciseIdx === 0}
          />
          <CustomButton
            title={currentExerciseIdx === exercises.length - 1 ? "Завершить" : "Далее"}
            onPress={handleNext}
            variant="primary"
            size="lg"
            isLoading={isCompleting}
            className="flex-[1.5]"
            icon={currentExerciseIdx === exercises.length - 1 ? <Check size={18} color="#FFFFFF" /> : undefined}
          />
        </View>
      </ScrollView>
    </View>
  );
}
