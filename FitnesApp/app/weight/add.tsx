import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Scale } from "lucide-react-native";
import { Card, CustomButton, CustomInput } from "@/components/atoms";
import { useAddWeight } from "@/services/api";

export default function AddWeightScreen() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const { mutate: addWeight, isPending } = useAddWeight();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)");
  };

  const handleSave = () => {
    const kg = parseFloat(value.replace(",", "."));
    if (isNaN(kg) || kg <= 0 || kg > 400) return;

    addWeight(kg, {
      onSuccess: () => handleBack(),
    });
  };

  const isValid = (() => {
    const kg = parseFloat(value.replace(",", "."));
    return !isNaN(kg) && kg > 0 && kg <= 400;
  })();

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-dark-950">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1 px-4 pb-10 pt-2">
          <View className="flex-row items-center justify-between pb-4">
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.8}
              className="h-11 w-11 items-center justify-center rounded-2xl bg-primary-600/12"
            >
              <ArrowLeft size={22} color="#7C3AED" />
            </TouchableOpacity>
            <Text
              className="text-lg text-surface-900 dark:text-white"
              style={{ fontFamily: "Manrope-Bold" }}
            >
              Записать вес
            </Text>
            <View className="w-11" />
          </View>

          <Card variant="elevated" padding="lg" className="mt-6 gap-5">
            <View className="h-14 w-14 items-center justify-center rounded-[18px] bg-primary-600/12">
              <Scale size={26} color="#7C3AED" />
            </View>
            <Text
              className="text-[26px] leading-8 text-surface-900 dark:text-white"
              style={{ fontFamily: "Manrope-ExtraBold" }}
            >
              Сколько весите сегодня?
            </Text>
            <CustomInput
              label="Вес, кг"
              placeholder="70.5"
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
            />
            <CustomButton
              title="Сохранить"
              onPress={handleSave}
              variant="primary"
              size="lg"
              isLoading={isPending}
              disabled={!isValid || isPending}
              className="w-full"
            />
          </Card>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
