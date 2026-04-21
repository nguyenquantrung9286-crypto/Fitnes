import { Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Star } from "lucide-react-native";
import { usePointsBalance } from "@/services/api";
import Card from "./Card";

export default function PointsWidget() {
  const router = useRouter();
  const { data: balance = 0, isLoading } = usePointsBalance();

  return (
    <TouchableOpacity onPress={() => router.push("/points")} activeOpacity={0.85}>
      <Card variant="elevated" padding="lg">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-[14px] bg-primary-600/12">
            <Star size={22} color="#7C3AED" />
          </View>
          <View className="flex-1">
            <Text className="text-sm text-dark-400 dark:text-dark-300">Баллы активности</Text>
            <Text
              className="text-[26px] leading-8 text-surface-900 dark:text-white"
              style={{ fontFamily: "Manrope-ExtraBold" }}
            >
              {isLoading ? "..." : balance.toLocaleString("ru-RU")}
            </Text>
          </View>
          <Text className="text-sm text-primary-600 dark:text-primary-400">История →</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}
