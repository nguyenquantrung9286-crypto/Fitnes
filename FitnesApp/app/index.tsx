import { useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";
import { useColorScheme } from "nativewind";

const ONBOARDING_KEY = "fitnes_onboarding_completed";

export default function RedirectScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    async function checkAndRedirect() {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (completed === "true") {
        router.replace("/(tabs)");
      } else {
        router.replace("/welcome");
      }
    }
    // Tiny delay to ensure router stability
    setTimeout(() => checkAndRedirect(), 150);
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-dark-950">
      <ActivityIndicator size="large" color="#7C3AED" />
    </View>
  );
}
