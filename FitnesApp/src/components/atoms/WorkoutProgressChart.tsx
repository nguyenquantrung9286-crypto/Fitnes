import { Text, useWindowDimensions, View } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { WorkoutLog } from "@/types";

function getLast7DaysLabels(): string[] {
  const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(dayNames[d.getDay()]);
  }
  return labels;
}

function countPerDay(logs: WorkoutLog[]): number[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const counts: number[] = Array(7).fill(0);
  for (const log of logs) {
    const logDate = new Date(log.completed_at);
    logDate.setHours(0, 0, 0, 0);
    const diffMs = today.getTime() - logDate.getTime();
    const diffDays = Math.round(diffMs / 86400000);
    const idx = 6 - diffDays;
    if (idx >= 0 && idx < 7) counts[idx]++;
  }
  return counts;
}

type Props = { logs: WorkoutLog[] };

export default function WorkoutProgressChart({ logs }: Props) {
  const { width } = useWindowDimensions();
  const chartWidth = width - 32 - 32;
  const labels = getLast7DaysLabels();
  const data = countPerDay(logs);
  const hasData = data.some((v) => v > 0);

  if (!hasData) {
    return (
      <View className="items-center py-6">
        <Text className="text-sm text-dark-400 dark:text-dark-300">
          Завершите первую тренировку, чтобы увидеть график
        </Text>
      </View>
    );
  }

  return (
    // @ts-ignore
    <BarChart
      data={{ labels, datasets: [{ data }] }}
      width={chartWidth}
      height={160}
      yAxisLabel=""
      yAxisSuffix=""
      fromZero
      showValuesOnTopOfBars
      chartConfig={{
        backgroundGradientFrom: "transparent",
        backgroundGradientTo: "transparent",
        backgroundGradientFromOpacity: 0,
        backgroundGradientToOpacity: 0,
        color: (opacity = 1) => `rgba(43, 142, 240, ${opacity})`,
        labelColor: () => "#9090B0",
        barPercentage: 0.6,
        decimalPlaces: 0,
      }}
      style={{ borderRadius: 12, marginLeft: -16 }}
    />
  );
}
