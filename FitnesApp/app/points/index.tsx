import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Star } from "lucide-react-native";
import { usePointsBalance, usePointsHistory } from "@/services/api";
import { PointsLog } from "@/types";
import { Card } from "@/components/atoms";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PointsItem({ item }: { item: PointsLog }) {
  return (
    <View className="flex-row items-center gap-3 border-b border-black/5 py-3 dark:border-white/8">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary-600/10">
        <Star size={16} color="#7C3AED" />
      </View>
      <View className="flex-1">
        <Text
          className="text-sm text-surface-900 dark:text-white"
          style={{ fontFamily: "Manrope-SemiBold" }}
        >
          {item.reason}
        </Text>
        <Text className="text-xs text-dark-400 dark:text-dark-300">{formatDate(item.created_at)}</Text>
      </View>
      <Text
        className="text-base text-primary-600 dark:text-primary-400"
        style={{ fontFamily: "Manrope-Bold" }}
      >
        +{item.amount}
      </Text>
    </View>
  );
}

export default function PointsHistoryScreen() {
  const router = useRouter();
  const { data: balance = 0 } = usePointsBalance();
  const { data: history = [] } = usePointsHistory();

  return (
    <SafeAreaView className="flex-1 bg-surface-50 dark:bg-dark-950">
      <View className="flex-1 px-4 pb-10 pt-2">
        <View className="flex-row items-center justify-between pb-4">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
            activeOpacity={0.8}
            className="h-11 w-11 items-center justify-center rounded-2xl bg-primary-600/12"
          >
            <ArrowLeft size={22} color="#7C3AED" />
          </TouchableOpacity>
          <Text
            className="text-lg text-surface-900 dark:text-white"
            style={{ fontFamily: "Manrope-Bold" }}
          >
            Мои баллы
          </Text>
          <View className="w-11" />
        </View>

        <Card variant="elevated" padding="lg" className="mb-6">
          <View className="items-center gap-1">
            <Text className="text-sm text-dark-400 dark:text-dark-300">Общий баланс</Text>
            <Text
              className="text-5xl text-surface-900 dark:text-white"
              style={{ fontFamily: "Manrope-ExtraBold" }}
            >
              {balance.toLocaleString("ru-RU")}
            </Text>
            <Text className="text-sm text-dark-400 dark:text-dark-300">баллов</Text>
          </View>
        </Card>

        {history.length === 0 ? (
          <Text className="mt-10 text-center text-sm text-dark-400 dark:text-dark-300">
            Пока нет начислений. Завершите первую тренировку!
          </Text>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PointsItem item={item} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
