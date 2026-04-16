import { useState } from "react";
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { signInWithEmail } from "@/services/auth";
import { CustomButton, CustomInput, Card } from "@/components/atoms";
import { Lock, Mail } from "lucide-react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Ошибка", "Заполните все поля");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email, password);
      router.replace("/(tabs)");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Ошибка входа";
      Alert.alert("Ошибка входа", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1 px-6 pt-16"
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text className="mb-2 text-3xl font-bold text-gray-900">Вход</Text>
        <Text className="mb-8 text-base text-gray-500">
          Войдите, чтобы продолжить работу с вашим профилем
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
          </View>
        </Card>

        {/* Submit */}
        <View className="mt-8 gap-3">
          <CustomButton
            title="Войти"
            onPress={handleLogin}
            variant="primary"
            size="lg"
            isLoading={loading}
          />

          <CustomButton
            title="Нет аккаунта? Зарегистрироваться"
            onPress={() => router.push("/auth/register")}
            variant="ghost"
            size="lg"
          />

          <CustomButton
            title="Пропустить"
            onPress={() => router.replace("/(tabs)")}
            variant="ghost"
            size="md"
            style={{ marginTop: 8 }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
