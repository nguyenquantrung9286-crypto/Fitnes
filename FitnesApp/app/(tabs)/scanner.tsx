import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useIsFocused } from "@react-navigation/native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { RefreshCcw, Sparkles, X } from "lucide-react-native";
import { useRouter } from "expo-router";

import { Card, CustomButton, CustomInput } from "@/components/atoms";
import { useAnalyzeFood, useCreateNutritionLog } from "@/services/api";
import { FoodAnalysisResult } from "@/types";

type NutritionField = "calories" | "protein" | "fat" | "carbs";

function formatNutritionValue(value: number) {
  const roundedValue = Math.round(value * 10) / 10;
  return Number.isInteger(roundedValue) ? String(roundedValue) : roundedValue.toFixed(1);
}

function parseNutritionValue(value: string) {
  const normalizedValue = value.replace(",", ".").trim();
  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : NaN;
}

export default function ScannerScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedWeight, setSelectedWeight] = useState("100");
  const [editableCalories, setEditableCalories] = useState("");
  const [editableProtein, setEditableProtein] = useState("");
  const [editableFat, setEditableFat] = useState("");
  const [editableCarbs, setEditableCarbs] = useState("");
  const [editingField, setEditingField] = useState<NutritionField | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const scanProgress = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.25);

  const { mutate: analyzeFood, isPending: isAnalyzing } = useAnalyzeFood();
  const { mutate: createLog, isPending: isSaving } = useCreateNutritionLog();

  useEffect(() => {
    if (!photo && isFocused) {
      scanProgress.value = 0;
      scanProgress.value = withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(1.18, { duration: 1200, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withSequence(withTiming(0.38, { duration: 0 }), withTiming(0.08, { duration: 1200 })),
        -1,
        false
      );
    }
  }, [isFocused, photo, pulseOpacity, pulseScale, scanProgress]);

  const scanningLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanProgress.value * 224 }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const updateNutritionForWeight = (baseResult: FoodAnalysisResult, weightValue: string) => {
    const parsedWeight = parseNutritionValue(weightValue);
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      return;
    }

    const weightFactor = parsedWeight / 100;
    setEditableCalories(formatNutritionValue(baseResult.calories * weightFactor));
    setEditableProtein(formatNutritionValue(baseResult.protein_g * weightFactor));
    setEditableFat(formatNutritionValue(baseResult.fat_g * weightFactor));
    setEditableCarbs(formatNutritionValue(baseResult.carbs_g * weightFactor));
  };

  useEffect(() => {
    if (!isFocused) {
      cameraRef.current = null;
      setPhoto(null);
      setAnalysisResult(null);
      setAnalysisError(null);
      setSelectedWeight("100");
      setEditableCalories("");
      setEditableProtein("");
      setEditableFat("");
      setEditableCarbs("");
      setEditingField(null);
    }
  }, [isFocused]);

  const resetScan = () => {
    setPhoto(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setSelectedWeight("100");
    setEditableCalories("");
    setEditableProtein("");
    setEditableFat("");
    setEditableCarbs("");
    setEditingField(null);
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-50 px-6 dark:bg-dark-950">
        <View className="mb-8 rounded-[28px] bg-primary-600/10 p-6">
          <Sparkles size={48} color="#2B8EF0" />
        </View>
        <Text className="mb-2 text-center text-xl text-surface-900 dark:text-white" style={{ fontFamily: "Manrope-Bold" }}>
          Нужен доступ к камере
        </Text>
        <Text className="mb-8 text-center text-base text-dark-400 dark:text-dark-300">
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
    if (!cameraRef.current) {
      return;
    }

    try {
      const capturedPhoto = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });
      if (capturedPhoto) {
        setPhoto(capturedPhoto.uri);
        setAnalysisResult(null);
        setAnalysisError(null);
        handleAnalysis(capturedPhoto.uri);
      }
    } catch {
      Alert.alert("Ошибка", "Не удалось сделать снимок");
    }
  };

  const handleAnalysis = (uri: string) => {
    analyzeFood(uri, {
      onSuccess: (data) => {
        setAnalysisResult(data);
        setAnalysisError(null);
        setSelectedWeight("100");
        setEditableCalories(formatNutritionValue(data.calories));
        setEditableProtein(formatNutritionValue(data.protein_g));
        setEditableFat(formatNutritionValue(data.fat_g));
        setEditableCarbs(formatNutritionValue(data.carbs_g));
        setEditingField(null);
      },
      onError: (error) => {
        setAnalysisResult(null);
        const message =
          error instanceof Error
            ? error.message
            : "Не удалось распознать блюдо. Попробуйте сделать снимок ещё раз.";
        setAnalysisError(message);
      },
    });
  };

  const handleSave = () => {
    if (!analysisResult) {
      return;
    }

    const parsedWeight = parseNutritionValue(selectedWeight);
    const parsedCalories = parseNutritionValue(editableCalories);
    const parsedProtein = parseNutritionValue(editableProtein);
    const parsedFat = parseNutritionValue(editableFat);
    const parsedCarbs = parseNutritionValue(editableCarbs);

    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      Alert.alert("Проверьте вес", "Укажите корректную граммовку блюда.");
      return;
    }

    if (
      [parsedCalories, parsedProtein, parsedFat, parsedCarbs].some(
        (value) => !Number.isFinite(value) || value < 0
      )
    ) {
      Alert.alert("Проверьте КБЖУ", "Заполните корректные значения калорий, белков, жиров и углеводов.");
      return;
    }

    createLog(
      {
        food_name: analysisResult.food_name,
        calories: parsedCalories,
        protein_g: parsedProtein,
        fat_g: parsedFat,
        carbs_g: parsedCarbs,
        portion_size: `${formatNutritionValue(parsedWeight)} г`,
        photo_url: analysisResult.photo_url || null,
        meal_type: getMealType(),
      },
      {
        onSuccess: () => {
          Alert.alert("Успешно", "Прием пищи добавлен в дневник");
          router.replace("/(tabs)");
        },
      }
    );
  };

  const getMealType = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "breakfast";
    if (hour < 16) return "lunch";
    if (hour < 20) return "dinner";
    return "snack";
  };

  const renderNutritionEditor = () => {
    if (!editingField) {
      return null;
    }

    const fieldConfig = {
      calories: { label: "Калории", value: editableCalories, setter: setEditableCalories, suffix: "ккал" },
      protein: { label: "Белки", value: editableProtein, setter: setEditableProtein, suffix: "г" },
      fat: { label: "Жиры", value: editableFat, setter: setEditableFat, suffix: "г" },
      carbs: { label: "Углеводы", value: editableCarbs, setter: setEditableCarbs, suffix: "г" },
    }[editingField];

    return (
      <View className="mb-6 rounded-[20px] bg-surface-50 p-4 dark:bg-dark-800">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-sm text-surface-900 dark:text-white" style={{ fontFamily: "Manrope-Bold" }}>
            Изменить: {fieldConfig.label}
          </Text>
          <TouchableOpacity onPress={() => setEditingField(null)}>
            <Text className="text-sm text-primary-600" style={{ fontFamily: "Manrope-Bold" }}>
              Готово
            </Text>
          </TouchableOpacity>
        </View>
        <CustomInput
          value={fieldConfig.value}
          onChangeText={(value) => fieldConfig.setter(value.replace(/[^0-9.,]/g, ""))}
          keyboardType="decimal-pad"
          placeholder={`Введите ${fieldConfig.label.toLowerCase()}`}
        />
        <Text className="mt-2 text-xs text-dark-400 dark:text-dark-300">
          Значение для выбранной порции, единица: {fieldConfig.suffix}
        </Text>
      </View>
    );
  };

  if (photo) {
    return (
      <View className="flex-1 bg-black">
        <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 bg-black/45"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end", padding: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            {isAnalyzing ? (
              <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)}>
                <Card variant="elevated" padding="lg" className="mb-10 items-center">
                  <ActivityIndicator size="large" color="#2B8EF0" />
                  <Text className="mt-4 text-xl text-surface-900 dark:text-white" style={{ fontFamily: "Manrope-Bold" }}>
                    Анализ блюда...
                  </Text>
                  <Text className="mt-1 text-sm text-dark-400 dark:text-dark-300">
                    Наш ИИ определяет состав и калории
                  </Text>
                </Card>
              </Animated.View>
            ) : analysisResult ? (
              <Card variant="elevated" padding="lg" className="mb-10">
                <View className="mb-5 flex-row items-center gap-3">
                  <View className="rounded-[14px] bg-primary-600/12 p-2.5">
                    <Sparkles size={20} color="#2B8EF0" />
                  </View>
                  <Text className="flex-1 text-2xl text-surface-900 dark:text-white" style={{ fontFamily: "Manrope-ExtraBold" }}>
                    {analysisResult.food_name}
                  </Text>
                </View>

                <View className="mb-4 flex-row items-center justify-between rounded-[20px] bg-surface-50 px-4 py-3 dark:bg-dark-800">
                  <Text className="mr-3 flex-1 text-sm text-dark-400 dark:text-dark-300">
                    Пищевая ценность указана приблизительно на
                  </Text>
                  <View className="flex-row items-center rounded-[14px] bg-white px-3 py-2 dark:bg-dark-900">
                    <TextInput
                      value={selectedWeight}
                      onChangeText={(value) => {
                        const normalizedValue = value.replace(/[^0-9.,]/g, "");
                        setSelectedWeight(normalizedValue);
                        if (analysisResult) {
                          updateNutritionForWeight(analysisResult, normalizedValue);
                        }
                      }}
                      keyboardType="decimal-pad"
                      className="min-w-[36px] text-right text-sm text-surface-900 dark:text-white"
                      style={{ minHeight: 20, paddingVertical: 0, paddingHorizontal: 0, fontFamily: "Manrope-Bold" }}
                    />
                    <Text className="ml-2 text-sm text-surface-900 dark:text-white" style={{ fontFamily: "Manrope-Bold" }}>
                      г
                    </Text>
                  </View>
                </View>

                <Text className="mb-3 text-sm text-dark-400 dark:text-dark-300">
                  КБЖУ ниже пересчитаны под выбранную граммовку. Нажмите на показатель, если хотите его уточнить вручную.
                </Text>

                <View className="mb-4 flex-row justify-between rounded-[20px] bg-surface-50 p-4 dark:bg-dark-800">
                  {[
                    { key: "calories" as const, label: "Ккал", value: editableCalories || "0", color: "#2B8EF0" },
                    { key: "protein" as const, label: "Белки", value: `${editableProtein || "0"}г`, color: "#3DD87A" },
                    { key: "fat" as const, label: "Жиры", value: `${editableFat || "0"}г`, color: "#FF8C42" },
                    { key: "carbs" as const, label: "Углеводы", value: `${editableCarbs || "0"}г`, color: "#FFCB47" },
                  ].map((item) => (
                    <TouchableOpacity key={item.key} className="items-center" onPress={() => setEditingField(item.key)}>
                      <Text style={{ color: item.color, fontFamily: "Manrope-ExtraBold", fontSize: 20 }}>
                        ~{item.value}
                      </Text>
                      <Text className="text-[10px] uppercase tracking-[1px] text-dark-400 dark:text-dark-300">
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {renderNutritionEditor()}

                <View className="flex-row gap-3">
                  <CustomButton title="Отмена" onPress={resetScan} variant="outline" className="flex-1" />
                  <CustomButton
                    title="Сохранить"
                    onPress={handleSave}
                    variant="primary"
                    isLoading={isSaving}
                    className="flex-[1.5]"
                  />
                </View>
              </Card>
            ) : analysisError ? (
              <Card variant="elevated" padding="lg" className="mb-10">
                <View className="mb-4 flex-row items-center gap-3">
                  <View className="rounded-[14px] bg-error/12 p-2.5">
                    <X size={18} color="#FF5656" />
                  </View>
                  <Text className="flex-1 text-xl text-surface-900 dark:text-white" style={{ fontFamily: "Manrope-Bold" }}>
                    Анализ не завершён
                  </Text>
                </View>
                <Text className="mb-6 text-sm text-dark-400 dark:text-dark-300">{analysisError}</Text>
                <View className="flex-row gap-3">
                  <CustomButton title="Сделать заново" onPress={resetScan} variant="outline" className="flex-1" />
                  <CustomButton
                    title="Повторить анализ"
                    onPress={() => handleAnalysis(photo)}
                    variant="primary"
                    className="flex-[1.5]"
                    icon={<RefreshCcw size={18} color="#FFFFFF" />}
                  />
                </View>
              </Card>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  if (!isFocused) {
    return <View className="flex-1 bg-black" />;
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} facing="back" />
      <View className="flex-1 justify-between p-6">
        <View className="flex-row justify-between pt-10">
          <View className="rounded-full bg-black/40 px-4 py-2">
            <Text className="text-white" style={{ fontFamily: "Manrope-Bold" }}>
              Сканирование еды
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            className="h-10 w-10 items-center justify-center rounded-full bg-black/40"
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View className="items-center">
          <View className="relative h-64 w-64">
            <View className="absolute left-0 top-0 h-12 w-12 rounded-tl-[26px] border-l-[3px] border-t-[3px] border-primary-600" />
            <View className="absolute right-0 top-0 h-12 w-12 rounded-tr-[26px] border-r-[3px] border-t-[3px] border-primary-600" />
            <View className="absolute bottom-0 left-0 h-12 w-12 rounded-bl-[26px] border-b-[3px] border-l-[3px] border-primary-600" />
            <View className="absolute bottom-0 right-0 h-12 w-12 rounded-br-[26px] border-b-[3px] border-r-[3px] border-primary-600" />

            <Animated.View
              style={[scanningLineStyle]}
              className="absolute left-4 right-4 top-4 h-[2px] rounded-full bg-primary-400"
            />
          </View>

          <Text className="mt-4 rounded-full bg-black/40 px-4 py-2 text-center text-white">
            Поместите блюдо в центр
          </Text>
        </View>

        <View className="flex-row items-center justify-center pb-10">
          <View className="items-center justify-center">
            <Animated.View
              style={pulseStyle}
              className="absolute h-24 w-24 rounded-full bg-primary-500"
            />
            <TouchableOpacity onPress={takePicture} activeOpacity={0.9} className="overflow-hidden rounded-full">
              <LinearGradient
                colors={["#2B8EF0", "#5BAAFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="h-20 w-20 items-center justify-center rounded-full"
              >
                <View className="h-14 w-14 rounded-full border-2 border-white/40 bg-white/95" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
