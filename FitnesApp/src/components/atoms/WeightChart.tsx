import { Text, useWindowDimensions, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { WeightLog } from "@/types";

type Props = { logs: WeightLog[] };

export default function WeightChart({ logs }: Props) {
  const { width } = useWindowDimensions();
  const chartWidth = width - 64;

  if (logs.length < 2) {
    return (
      <View className="items-center py-6">
        <Text className="text-sm text-dark-400 dark:text-dark-300">
          Нужно минимум 2 записи, чтобы отобразить динамику
        </Text>
      </View>
    );
  }

  const rawLabels = logs.map((l) => {
    const d = new Date(l.measured_at);
    return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const step = Math.ceil(rawLabels.length / 10);
  const labels = rawLabels.map((l, i) => (i % step === 0 ? l : ""));

  return (
    // @ts-ignore
    <LineChart
      data={{
        labels,
        datasets: [{ data: logs.map((l) => l.value_kg) }],
      }}
      width={chartWidth}
      height={160}
      yAxisSuffix=" кг"
      chartConfig={{
        backgroundGradientFrom: "transparent",
        backgroundGradientTo: "transparent",
        backgroundGradientFromOpacity: 0,
        backgroundGradientToOpacity: 0,
        color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
        labelColor: () => "#9090B0",
        propsForDots: { r: "4", strokeWidth: "2", stroke: "#7C3AED" },
        decimalPlaces: 1,
      }}
      bezier
      style={{ borderRadius: 12, marginLeft: -16 }}
    />
  );
}
