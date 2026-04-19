import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  Manrope_900Black,
} from "@expo-google-fonts/manrope";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import { QueryProvider } from "@/lib/query";
import { registerForPushNotificationsAsync, scheduleDailyReminders } from "@/services/notifications";
import { OnboardingProvider } from "@/lib/onboarding-context";
import { useAuth } from "@/hooks/useAuth";
import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider, useAppTheme } from "@/context/theme-context";
import { isOnboardingCompleted } from "@/services/auth";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Manrope-Regular":   Manrope_400Regular,
    "Manrope-Medium":    Manrope_500Medium,
    "Manrope-SemiBold":  Manrope_600SemiBold,
    "Manrope-Bold":      Manrope_700Bold,
    "Manrope-ExtraBold": Manrope_800ExtraBold,
    "Manrope-Black":     Manrope_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

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

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <ThemeProvider>
          <AuthProvider>
            <OnboardingProvider>
              <AuthGuard>
                <ThemedRoot />
              </AuthGuard>
            </OnboardingProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}

function ThemedRoot() {
  const { resolvedTheme } = useAppTheme();

  return (
    <>
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
      <StackScreen />
    </>
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
  const [routeLoading, setRouteLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const rootSegment = segments[0];

    if (loading) {
      setRouteLoading(true);
      return () => {
        isMounted = false;
      };
    }

    (async () => {
      const inAuthGroup = rootSegment === "auth";
      const inTabs = rootSegment === "(tabs)";
      const inOnboarding = rootSegment === "onboarding";
      const inWelcome = rootSegment === "welcome";
      const isRoot = !rootSegment || rootSegment === "index";

      if (!user) {
        if (!isMounted) return;
        setRouteLoading(false);

        if (inTabs || inOnboarding) {
          router.replace("/auth/login");
        }
        return;
      }

      let completed = false;
      try {
        completed = await isOnboardingCompleted();
      } catch (error) {
        console.warn("Failed to load onboarding state:", error);
      }

      if (!isMounted) return;

      if (
        inAuthGroup ||
        inWelcome ||
        isRoot ||
        (inTabs && !completed) ||
        (inOnboarding && completed)
      ) {
        router.replace(completed ? "/(tabs)" : "/onboarding");
        return;
      }

      setRouteLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [loading, router, segments, user]);

  if (loading || routeLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0C0C16" }}>
        <ActivityIndicator size="large" color="#2B8EF0" />
      </View>
    );
  }

  return <>{children}</>;
}
