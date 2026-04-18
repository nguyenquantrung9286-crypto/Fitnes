import { useState } from "react";
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { signUpWithEmail } from "@/services/auth";
import { useOnboarding } from "@/lib/onboarding-context";
import { CustomButton, CustomInput, Card } from "@/components/atoms";
import { Lock, Mail } from "lucide-react-native";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { settings } = useOnboarding();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Ошибка", "Заполните все поля");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Ошибка", "Пароли не совпадают");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Ошибка", "Пароль должен содержать минимум 6 символов");
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail({
        email,
        password,
        settings,
      });
      Alert.alert(
        "Проверьте почту",
        "Мы отправили письмо для подтверждения. После подтверждения войдите в аккаунт.",
        [{ text: "Ок", onPress: () => router.replace("/auth/login") }]
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Ошибка регистрации";
      Alert.alert("Ошибка регистрации", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50 dark:bg-dark-950"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1 px-6 pt-16"
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-50">
          Регистрация
        </Text>
        <Text className="mb-8 text-base text-gray-500 dark:text-gray-400">
          Создайте аккаунт для сохранения прогресса
        </Text>

        {/* Form */}
        <Card variant="elevated" padding="lg">
          <View className="gap-4">
            <CustomInput
              label="Email"
              placeholder="example@mail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              icon={<Mail size={20} color="#6B7280" />}
            />

            <CustomInput
              label="Пароль"
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              icon={<Lock size={20} color="#6B7280" />}
            />

            <CustomInput
              label="Подтвердите пароль"
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              icon={<Lock size={20} color="#6B7280" />}
            />
          </View>
        </Card>

        {/* Submit */}
        <View className="mt-8 gap-3">
          <CustomButton
            title="Создать аккаунт"
            onPress={handleRegister}
            variant="primary"
            size="lg"
            isLoading={loading}
          />

          <CustomButton
            title="Уже есть аккаунт? Войти"
            onPress={() => router.push("/auth/login")}
            variant="ghost"
            size="lg"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
