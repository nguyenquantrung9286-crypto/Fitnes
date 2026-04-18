import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import { QueryProvider } from "@/lib/query";
import { registerForPushNotificationsAsync, scheduleDailyReminders } from "@/services/notifications";
import { OnboardingProvider } from "@/lib/onboarding-context";
import { useAuth } from "@/hooks/useAuth";
import { AuthProvider } from "@/context/auth-context";

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
        <AuthProvider>
          <OnboardingProvider>
            <AuthGuard>
              <StatusBar style="auto" />
              <StackScreen />
            </AuthGuard>
          </OnboardingProvider>
        </AuthProvider>
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
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "auth";
    const inTabs = segments[0] === "(tabs)";
    const inOnboarding = segments[0] === "onboarding";
    const isRoot = !segments[0] || segments[0] === "index";

    if (!user && inTabs) {
      // If user is not logged in and tries to access tabs, redirect to login
      router.replace("/auth/login");
    } else if (user && (inAuthGroup || isRoot)) {
      // If user is logged in and is on login/register, redirect to tabs
      // But we might want to check onboarding completion first
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
        <ActivityIndicator size="large" color="#4ADE80" />
      </View>
    );
  }

  return <>{children}</>;
}
