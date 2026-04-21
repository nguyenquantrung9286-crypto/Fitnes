import { Text, View } from "react-native";
import ProgressStatusBadge from "./ProgressStatusBadge";

export default function NutritionChartPlaceholder() {
  return (
    <View className="items-center gap-3 py-6">
      <ProgressStatusBadge />
      <Text className="text-center text-sm leading-6 text-dark-400 dark:text-dark-300">
        График питания по дням появится в Блоке 2, когда заработает трекер еды.
      </Text>
    </View>
  );
}
