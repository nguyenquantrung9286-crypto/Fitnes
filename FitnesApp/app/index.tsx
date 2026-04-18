import { useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";

const ONBOARDING_KEY = "fitnes_onboarding_completed";

export default function RedirectScreen() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      router.replace(completed === "true" ? "/(tabs)" : "/welcome");
    })();
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-dark-950">
      <ActivityIndicator size="large" color="#7C3AED" />
    </View>
  );
}
