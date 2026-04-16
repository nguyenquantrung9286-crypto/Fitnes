import { useState, useRef } from "react";
import {
  View,
  Text,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { CustomButton } from "@/components/atoms";
import { Dumbbell, Apple, TrendingUp } from "lucide-react-native";

const { width } = Dimensions.get("window");

interface SlideData {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string[];
}

const slides: SlideData[] = [
  {
    id: "1",
    title: "Умные тренировки",
    description:
      "ИИ создаёт персональные программы тренировок дома, на улице или в зале",
    icon: <Dumbbell size={80} color="#FFFFFF" />,
    gradient: ["#7C3AED", "#6D28D9"],
  },
  {
    id: "2",
    title: "Сканер питания",
    description:
      "Сфотографируйте блюдо — нейросеть мгновенно рассчитает КБЖУ",
    icon: <Apple size={80} color="#FFFFFF" />,
    gradient: ["#EC4899", "#DB2777"],
  },
  {
    id: "3",
    title: "Отслеживание прогресса",
    description:
      "Графики веса, фотодневник и интеграция с HealthKit/Google Fit",
    icon: <TrendingUp size={80} color="#FFFFFF" />,
    gradient: ["#8B5CF6", "#7C3AED"],
  },
];

function PaginationDot({
  index,
  activeIndex,
}: {
  index: number;
  activeIndex: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const width = interpolate(
      activeIndex - index,
      [-1, 0, 1],
      [8, 24, 8],
      Extrapolation.CLAMP
    );
    return {
      width: withTiming(width, { duration: 300 }),
    };
  });

  return (
    <Animated.View
      style={[
        {
          height: 8,
          borderRadius: 4,
          backgroundColor: activeIndex === index ? "#7C3AED" : "#D1D5DB",
          marginHorizontal: 4,
        },
        animatedStyle,
      ]}
    />
  );
}

function SlideItem({
  item,
  onSkip,
}: {
  item: SlideData;
  onSkip: () => void;
}) {
  return (
    <View style={{ width }} className="flex-1">
      <View
        className="flex-1 items-center justify-center px-8"
        style={{
          backgroundColor: item.gradient[0],
        }}
      >
        <View className="mb-8 h-40 w-40 items-center justify-center rounded-full bg-white/30 backdrop-blur-md">
          {item.icon}
        </View>
        <Text className="mb-4 text-center text-4xl font-bold text-white tracking-tight">
          {item.title}
        </Text>
        <Text className="text-center text-xl leading-8 text-white/90 font-medium">
          {item.description}
        </Text>
      </View>
    </View>
  );
}

export default function WelcomeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setActiveIndex(index);
  };

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    } else {
      router.replace("/auth/login");
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem("fitnes_onboarding_completed", "true");
    router.replace("/(tabs)");
  };

  return (
    <View className="flex-1 bg-white dark:bg-dark-950">
      {/* Skip button */}
      <View className="absolute right-4 top-14 z-10">
        <TouchableOpacity
          onPress={handleSkip}
          className="bg-black/20 px-4 py-2 rounded-full backdrop-blur-md"
        >
          <Text className="text-white font-bold text-xs uppercase tracking-widest">Пропустить</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={({ item }) => <SlideItem item={item} onSkip={handleSkip} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        keyExtractor={(item) => item.id}
        scrollEventThrottle={16}
      />

      {/* Bottom section */}
      <View className="bg-white dark:bg-dark-900 px-6 py-10 shadow-2xl">
        {/* Pagination dots */}
        <View className="mb-8 flex-row items-center justify-center">
          {slides.map((_, index) => (
            <PaginationDot
              key={index}
              index={index}
              activeIndex={activeIndex}
            />
          ))}
        </View>

        {/* Next / Get Started button */}
        <CustomButton
          title={activeIndex === slides.length - 1 ? "Войти в аккаунт" : "Продолжить"}
          onPress={handleNext}
          variant="primary"
          size="lg"
          className="shadow-lg shadow-primary-500/30"
        />
        
        {activeIndex === slides.length - 1 && (
          <TouchableOpacity 
            onPress={() => router.push("/auth/register")}
            className="mt-4 items-center"
          >
            <Text className="text-gray-500 dark:text-gray-400 font-medium">Нет аккаунта? <Text className="text-primary-600 dark:text-primary-400 font-bold">Создать</Text></Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
