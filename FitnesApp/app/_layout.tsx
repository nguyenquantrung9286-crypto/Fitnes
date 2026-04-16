import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import { QueryProvider } from "@/lib/query";
import { registerForPushNotificationsAsync, scheduleDailyReminders } from "@/services/notifications";
import { OnboardingProvider } from "@/lib/onboarding-context";

const ONBOARDING_KEY = "fitnes_onboarding_completed";

export default function RootLayout() {
  useEffect(() => {
    async function setupNotifications() {
      try {
        const granted = await registerForPushNotificationsAsync();
        if (granted) {
          await scheduleDailyReminders();
        }
      } catch (e) {
        console.warn("Notification setup failed", e);
      }
    }
    setupNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <OnboardingProvider>
          <StatusBar style="auto" />
          <StackScreen />
        </OnboardingProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}

function StackScreen() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="welcome"
        options={{
          headerShown: false,
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="auth"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="workouts/[id]"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          animation: "fade",
        }}
      />
    </Stack>
  );
}
