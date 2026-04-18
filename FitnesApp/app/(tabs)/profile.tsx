import { View, Text, ScrollView, Alert, Dimensions, TextInput, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/services/auth";
import { Card, CustomButton } from "@/components/atoms";
import { User, Settings, Mail, LogOut, LogIn, TrendingUp, Plus, Sun, Moon, Monitor } from "lucide-react-native";
import { ActivityIndicator } from "react-native";
import { useProgressEntries, useCreateProgressEntry, useLatestProgress } from "@/services/api";
import { LineChart } from "react-native-chart-kit";
import { useState } from "react";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";

export default function ProfileScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAddingWeight, setIsAddingWeight] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const { colorScheme, setColorScheme } = useNativeWindColorScheme();
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>(
    () => (colorScheme as 'light' | 'dark') ?? 'system'
  );

  const { data: progressEntries, isLoading: isLoadingProgress } = useProgressEntries();
  const { data: latestProgress } = useLatestProgress();
  const { mutate: addProgress, isPending: isAdding } = useCreateProgressEntry();

  const handleSignOut = async () => {
    Alert.alert("Выход", "Вы уверены, что хотите выйти?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Выйти",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/auth/login");
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Ошибка выхода";
            Alert.alert("Ошибка", message);
          }
        },
      },
    ]);
  };

  const handleAddWeight = () => {
    const weight = parseFloat(newWeight.replace(",", "."));
    if (isNaN(weight) || weight <= 0) {
      Alert.alert("Ошибка", "Введите корректный вес");
      return;
    }

    addProgress(
      { weight_kg: weight, recorded_at: new Date().toISOString() },
      {
        onSuccess: () => {
          setIsAddingWeight(false);
          setNewWeight("");
        },
      }
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-dark-900">
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  // Prepare chart data
  const chartData = {
    labels: (progressEntries || [])
      .slice(-6)
      .map((e) => new Date(e.recorded_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })),
    datasets: [
      {
        data: (progressEntries || []).slice(-6).map((e) => e.weight_kg || 0),
        color: (opacity = 1) => colorScheme === 'dark' ? `rgba(167, 139, 250, ${opacity})` : `rgba(124, 58, 237, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: colorScheme === 'dark' ? "#1F2937" : "#ffffff",
    backgroundGradientFrom: colorScheme === 'dark' ? "#1F2937" : "#ffffff",
    backgroundGradientTo: colorScheme === 'dark' ? "#1F2937" : "#ffffff",
    decimalPlaces: 1,
    color: (opacity = 1) => colorScheme === 'dark' ? `rgba(167, 139, 250, ${opacity})` : `rgba(124, 58, 237, ${opacity})`,
    labelColor: (opacity = 1) => colorScheme === 'dark' ? `rgba(156, 163, 175, ${opacity})` : `rgba(107, 114, 128, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: "4", strokeWidth: "2", stroke: "#7C3AED" },
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-dark-950">
      {/* Header */}
      <View className="items-center bg-white dark:bg-dark-900 px-6 pt-16 pb-8 shadow-sm">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
          <User size={40} color="#7C3AED" />
        </View>
        <Text className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-50">
          {user ? user.email : "Гость"}
        </Text>
        <Text className="text-base text-gray-500 dark:text-gray-400">
          {user ? "Аккаунт активен" : "Войдите для персонализации"}
        </Text>
      </View>

      {user && (
        <View className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3 px-2">
            <Text className="text-xl font-semibold text-gray-900 dark:text-gray-50">Ваш прогресс</Text>
            <TouchableOpacity 
              onPress={() => setIsAddingWeight(!isAddingWeight)}
              className="bg-primary-50 dark:bg-primary-900/20 rounded-full p-2"
            >
              <Plus size={20} color="#7C3AED" />
            </TouchableOpacity>
          </View>

          {isAddingWeight && (
            <Card variant="elevated" padding="md" style={{ marginBottom: 16 }}>
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Новая запись веса (кг)</Text>
              <View className="flex-row gap-2">
                <TextInput
                  value={newWeight}
                  onChangeText={setNewWeight}
                  keyboardType="numeric"
                  placeholder="Пример: 75.5"
                  placeholderTextColor={colorScheme === 'dark' ? '#6B7280' : '#A1A1AA'}
                  className="flex-1 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 text-gray-900 dark:text-gray-50 rounded-xl px-4 py-2"
                />
                <CustomButton
                  title="Ок"
                  onPress={handleAddWeight}
                  variant="primary"
                  size="sm"
                  isLoading={isAdding}
                />
              </View>
            </Card>
          )}

          <Card variant="elevated" padding="none" style={{ overflow: "hidden" }}>
            <View className="p-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <TrendingUp size={20} color="#7C3AED" />
                <Text className="font-semibold text-gray-700 dark:text-gray-300">Динамика веса</Text>
              </View>
              {latestProgress && (
                <Text className="text-lg font-bold text-primary-600 dark:text-primary-400">{latestProgress.weight_kg} кг</Text>
              )}
            </View>
            
            {(progressEntries?.length || 0) > 1 ? (
              <LineChart
                data={chartData}
                width={Dimensions.get("window").width - 32}
                height={180}
                chartConfig={chartConfig}
                bezier
                style={{ marginVertical: 8, borderRadius: 16 }}
                withInnerLines={false}
                withOuterLines={false}
              />
            ) : (
              <View className="py-10 items-center justify-center">
                <Text className="text-gray-400">Добавьте хотя бы 2 записи веса,</Text>
                <Text className="text-gray-400">чтобы увидеть график</Text>
              </View>
            )}
          </Card>
        </View>
      )}

      {/* Settings */}
      <View className="px-4 pb-10">
        <Text className="mb-3 mt-6 text-xl font-semibold text-gray-900 dark:text-gray-50">
          Настройки
        </Text>

        <Card variant="elevated" padding="none">
          <View className="border-b border-gray-100 dark:border-dark-800 px-4 py-4">
            <View className="flex-row items-center gap-3">
              <Settings size={20} color="#6B7280" />
              <Text className="flex-1 text-base text-gray-700 dark:text-gray-300">
                Настройки приложения
              </Text>
            </View>
          </View>
          
          {/* Theme Switcher */}
          <View className="border-b border-gray-100 dark:border-dark-800 px-4 py-4">
            <Text className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">Тема оформления</Text>
            <View className="flex-row bg-gray-50 dark:bg-dark-950 p-1 rounded-xl">
              <TouchableOpacity 
                onPress={() => {
                  setColorScheme('light');
                  setSelectedTheme('light');
                }}
                className={`flex-1 flex-row items-center justify-center py-2 px-3 rounded-lg ${selectedTheme === 'light' ? 'bg-white shadow-sm' : ''}`}
              >
                <Sun size={16} color={selectedTheme === 'light' ? "#7C3AED" : "#9CA3AF"} />
                <Text className={`ml-2 text-sm font-medium ${selectedTheme === 'light' ? 'text-primary-600' : 'text-gray-500'}`}>Светлая</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  setColorScheme('dark');
                  setSelectedTheme('dark');
                }}
                className={`flex-1 flex-row items-center justify-center py-2 px-3 rounded-lg ${selectedTheme === 'dark' ? 'bg-dark-800 shadow-sm' : ''}`}
              >
                <Moon size={16} color={selectedTheme === 'dark' ? "#A78BFA" : "#9CA3AF"} />
                <Text className={`ml-2 text-sm font-medium ${selectedTheme === 'dark' ? 'text-primary-400' : 'text-gray-500'}`}>Темная</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  setColorScheme('system');
                  setSelectedTheme('system');
                }}
                className={`flex-1 flex-row items-center justify-center py-2 px-3 rounded-lg ${selectedTheme === 'system' ? 'bg-white dark:bg-dark-800 shadow-sm' : ''}`}
              >
                <Monitor size={16} color={selectedTheme === 'system' ? "#7C3AED" : "#9CA3AF"} />
                <Text className={`ml-2 text-sm font-medium ${selectedTheme === 'system' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'}`}>Система</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity className="px-4 py-4">
            <View className="flex-row items-center gap-3">
              <Mail size={20} color="#6B7280" />
              <Text className="flex-1 text-base text-gray-700 dark:text-gray-300">
                Связаться с поддержкой
              </Text>
            </View>
          </TouchableOpacity>
        </Card>

        <View className="mt-8">
          {user ? (
            <>
              <CustomButton
                title="Пройти онбординг заново"
                onPress={() => router.push("/onboarding")}
                variant="outline"
                size="lg"
              />
              <CustomButton
                title="Выйти из аккаунта"
                onPress={handleSignOut}
                variant="ghost"
                size="lg"
                className="mt-3"
                textClassName="text-red-500 dark:text-red-400"
                icon={<LogOut size={20} color="#EF4444" />}
              />
            </>
          ) : (
            <>
              <CustomButton
                title="Войти"
                onPress={() => router.push("/auth/login")}
                variant="primary"
                size="lg"
                icon={<LogIn size={20} color="#FFFFFF" />}
              />
              <CustomButton
                title="Регистрация"
                onPress={() => router.push("/auth/register")}
                variant="outline"
                size="lg"
                className="mt-3"
              />
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
