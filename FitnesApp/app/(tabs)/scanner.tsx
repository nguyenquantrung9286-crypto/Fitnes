import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useState, useRef } from "react";
import { X, RefreshCcw, Check, Sparkles } from "lucide-react-native";
import { CustomButton, Card } from "@/components/atoms";
import { useAnalyzeFood, useCreateNutritionLog } from "@/services/api";
import { useRouter } from "expo-router";

import { FoodAnalysisResult } from "@/types";

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const { mutate: analyzeFood, isPending: isAnalyzing } = useAnalyzeFood();
  const { mutate: createLog, isPending: isSaving } = useCreateNutritionLog();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-dark-950 px-6">
        <View className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-full mb-8">
          <Sparkles size={48} color="#7C3AED" />
        </View>
        <Text className="text-center text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">
          Нужен доступ к камере
        </Text>
        <Text className="text-center text-base text-gray-500 dark:text-gray-400 mb-8">
          Для работы умного сканера еды ИИ необходим доступ к камере вашего устройства.
        </Text>
        <CustomButton
          title="Разрешить доступ"
          onPress={requestPermission}
          variant="primary"
          size="lg"
          className="w-full"
        />
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: false,
        });
        if (photo) {
          setPhoto(photo.uri);
          handleAnalysis(photo.uri);
        }
      } catch (error) {
        Alert.alert("Ошибка", "Не удалось сделать снимок");
      }
    }
  };

  const handleAnalysis = (uri: string) => {
    analyzeFood(uri, {
      onSuccess: (data) => {
        setAnalysisResult(data);
      },
      onError: (error) => {
        Alert.alert("Ошибка анализа", "ИИ не смог распознать еду. Попробуйте еще раз.");
        setPhoto(null);
      }
    });
  };

  const handleSave = () => {
    if (!analysisResult) return;

    createLog({
      food_name: analysisResult.food_name,
      calories: analysisResult.calories,
      protein_g: analysisResult.protein_g,
      fat_g: analysisResult.fat_g,
      carbs_g: analysisResult.carbs_g,
      portion_size: analysisResult.portion_size,
      photo_url: analysisResult.photo_url || null,
      meal_type: getMealType(),
    }, {
      onSuccess: () => {
        Alert.alert("Успешно", "Прием пищи добавлен в дневник");
        router.replace("/(tabs)");
      }
    });
  };

  const getMealType = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "breakfast";
    if (hour < 16) return "lunch";
    if (hour < 20) return "dinner";
    return "snack";
  };

  if (photo) {
    return (
      <View className="flex-1 bg-black">
        {/* Full screen photo preview */}
        <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        
        <View className="flex-1 bg-black/40 justify-end p-6">
          {isAnalyzing ? (
            <Card variant="elevated" padding="lg" className="mb-10 items-center">
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text className="mt-4 text-xl font-bold text-gray-900 dark:text-gray-50">Анализ блюда...</Text>
              <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">Наш ИИ определяет состав и калории</Text>
            </Card>
          ) : analysisResult ? (
            <Card variant="elevated" padding="lg" className="mb-10">
              <View className="flex-row items-center gap-3 mb-5">
                <View className="bg-primary-100 dark:bg-primary-900/40 p-2 rounded-lg">
                  <Sparkles size={20} color="#7C3AED" fill="#7C3AED" />
                </View>
                <Text className="text-2xl font-bold text-gray-900 dark:text-gray-50 flex-1">{analysisResult.food_name}</Text>
              </View>
              
              <View className="flex-row justify-between mb-6 bg-gray-50 dark:bg-dark-800 p-4 rounded-2xl">
                <View className="items-center">
                  <Text className="text-xl font-black text-primary-600 dark:text-primary-400">{analysisResult.calories}</Text>
                  <Text className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Ккал</Text>
                </View>
                <View className="items-center">
                  <Text className="text-xl font-bold text-gray-900 dark:text-gray-50">{analysisResult.protein_g}г</Text>
                  <Text className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Белки</Text>
                </View>
                <View className="items-center">
                  <Text className="text-xl font-bold text-gray-900 dark:text-gray-50">{analysisResult.fat_g}г</Text>
                  <Text className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Жиры</Text>
                </View>
                <View className="items-center">
                  <Text className="text-xl font-bold text-gray-900 dark:text-gray-50">{analysisResult.carbs_g}г</Text>
                  <Text className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Углеводы</Text>
                </View>
              </View>

              <Text className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-6">Оценка порции: {analysisResult.portion_size}</Text>

              <View className="flex-row gap-3">
                <CustomButton
                  title="Отмена"
                  onPress={() => {
                    setPhoto(null);
                    setAnalysisResult(null);
                  }}
                  variant="outline"
                  className="flex-1"
                />
                <CustomButton
                  title="Сохранить"
                  onPress={handleSave}
                  variant="primary"
                  isLoading={isSaving}
                  className="flex-[1.5] shadow-lg shadow-primary-500/30"
                />
              </View>
            </Card>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={StyleSheet.absoluteFill}
        ref={cameraRef}
        facing="back"
      >
        <View className="flex-1 justify-between p-6">
          <View className="flex-row justify-between pt-10">
            <View className="rounded-full bg-black/40 px-4 py-2">
              <Text className="text-white font-medium">Сканирование еды</Text>
            </View>
            <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-black/40">
              <X size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View className="items-center">
            <View className="h-64 w-64 border-2 border-white/50 border-dashed rounded-3xl" />
            <Text className="mt-4 text-white text-center bg-black/40 px-4 py-2 rounded-full">
              Поместите блюдо в центр
            </Text>
          </View>

          <View className="flex-row items-center justify-center pb-10">
            <TouchableOpacity
              onPress={takePicture}
              className="h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/20"
            >
              <View className="h-16 w-16 rounded-full bg-white" />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}
