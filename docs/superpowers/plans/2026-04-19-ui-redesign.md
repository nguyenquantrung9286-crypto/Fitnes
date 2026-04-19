# UI Redesign v2.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Полностью обновить визуал приложения Fitnes по дизайн-системе v2.0 — шрифт Manrope, синяя палитра, новые компоненты — не трогая рабочий функционал.

**Architecture:** Подход A — сначала дизайн-система (токены, шрифт, атомарные компоненты), затем каждый экран по очереди. Цвета обновляются через tailwind.config.js, шрифт через @expo-google-fonts/manrope. Градиент на кнопках через expo-linear-gradient.

**Tech Stack:** React Native 0.81, Expo 54, NativeWind v4, expo-linear-gradient, react-native-svg, react-native-reanimated v4, react-native-chart-kit, @expo-google-fonts/manrope

**Spec:** `docs/superpowers/specs/2026-04-19-ui-redesign-design.md`

---

## Файловая карта

| Файл | Действие | Задача |
|---|---|---|
| `FitnesApp/package.json` | modify | T1 |
| `FitnesApp/tailwind.config.js` | modify | T1 |
| `FitnesApp/global.css` | modify | T1 |
| `FitnesApp/app/_layout.tsx` | modify | T1 |
| `FitnesApp/app/(tabs)/_layout.tsx` | modify | T1 |
| `FitnesApp/src/components/atoms/Card.tsx` | modify | T2 |
| `FitnesApp/src/components/atoms/CustomInput.tsx` | modify | T2 |
| `FitnesApp/src/components/atoms/CustomButton.tsx` | modify | T3 |
| `FitnesApp/src/components/atoms/Icons.tsx` | create | T4 |
| `FitnesApp/src/components/atoms/MetricTile.tsx` | create | T4 |
| `FitnesApp/src/components/atoms/DifficultyBadge.tsx` | create | T4 |
| `FitnesApp/app/(tabs)/index.tsx` | modify | T5 |
| `FitnesApp/app/(tabs)/workouts.tsx` | modify | T6 |
| `FitnesApp/app/(tabs)/profile.tsx` | modify | T7 |
| `FitnesApp/app/(tabs)/chat.tsx` | modify | T8 |
| `FitnesApp/app/(tabs)/scanner.tsx` | modify | T9 |
| `FitnesApp/app/welcome.tsx` | modify | T10 |
| `FitnesApp/app/auth/login.tsx` | modify | T11 |
| `FitnesApp/app/auth/register.tsx` | modify | T11 |
| `FitnesApp/app/onboarding/index.tsx` | modify | T12 |
| `FitnesApp/app/workouts/[id].tsx` | modify | T13 |

---

## Task 1: Дизайн-токены, шрифт Manrope, Tab Bar

**Files:**
- Modify: `FitnesApp/tailwind.config.js`
- Modify: `FitnesApp/global.css`
- Modify: `FitnesApp/app/_layout.tsx`
- Modify: `FitnesApp/app/(tabs)/_layout.tsx`

- [ ] **Шаг 1.1: Установить Manrope**

```bash
cd FitnesApp
npx expo install @expo-google-fonts/manrope
```

Ожидаемый результат: пакет добавлен в `node_modules` и `package.json`.

- [ ] **Шаг 1.2: Обновить tailwind.config.js**

Заменить файл полностью:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Акцентный синий (основной)
        primary: {
          DEFAULT: "#2B8EF0",
          50:  "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#5BAAFF",
          500: "#3B9EF5",
          600: "#2B8EF0",
          700: "#1A7AD4",
          800: "#1566B8",
          900: "#0E4F96",
        },
        // Семантические
        success: "#3DD87A",
        error:   "#FF5656",
        warning: "#FF8C42",
        yellow:  "#FFCB47",
        // Тёмная палитра
        dark: {
          DEFAULT: "#161625",
          50:  "#E5E5EA",
          100: "#C8C8D1",
          200: "#A1A1AA",
          300: "#9090B0",
          400: "#7070A0",
          500: "#44445A",
          600: "#2A2A40",
          700: "#1E1E30",
          800: "#161625",
          900: "#101018",
          950: "#0C0C16",
        },
        // Светлая палитра
        surface: {
          DEFAULT: "#FFFFFF",
          50:  "#F4F4F8",
          100: "#EBEBF0",
          200: "#D8D8E8",
          300: "#3A3A5C",
          400: "#9090B0",
          900: "#0C0C16",
        },
      },
      fontFamily: {
        sans:      ["Manrope-Regular",   "System"],
        medium:    ["Manrope-Medium",    "System"],
        semibold:  ["Manrope-SemiBold",  "System"],
        bold:      ["Manrope-Bold",      "System"],
        extrabold: ["Manrope-ExtraBold", "System"],
        black:     ["Manrope-Black",     "System"],
      },
      height: {
        button: "52",
      },
      minHeight: {
        button: "52",
      },
    },
  },
  plugins: [],
};
```

- [ ] **Шаг 1.3: Обновить global.css**

```css
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body, #root {
    min-height: 100%;
  }

  html, body {
    font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background-color: #F4F4F8;
  }

  html.dark, html.dark body {
    background-color: #0C0C16;
  }
}
```

- [ ] **Шаг 1.4: Обновить app/_layout.tsx — загрузить Manrope**

Найти блок `useFonts` и заменить его (только эту часть):

```typescript
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  Manrope_900Black,
} from "@expo-google-fonts/manrope";

// Внутри RootLayout:
const [fontsLoaded] = useFonts({
  "Manrope-Regular":   Manrope_400Regular,
  "Manrope-Medium":    Manrope_500Medium,
  "Manrope-SemiBold":  Manrope_600SemiBold,
  "Manrope-Bold":      Manrope_700Bold,
  "Manrope-ExtraBold": Manrope_800ExtraBold,
  "Manrope-Black":     Manrope_900Black,
});
```

Удалить старый импорт `useFonts` из `expo-font` и удалить блок загрузки Inter шрифтов.

- [ ] **Шаг 1.5: Обновить app/(tabs)/_layout.tsx — Tab Bar цвета**

Заменить файл полностью:

```typescript
import { Tabs } from "expo-router";
import { Home, Dumbbell, Camera, User, MessageSquare } from "lucide-react-native";
import { useAppTheme } from "@/context/theme-context";

export default function TabsLayout() {
  const { resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2B8EF0",
        tabBarInactiveTintColor: isDark ? "#44445A" : "#9090B0",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          backgroundColor: isDark ? "#101018" : "#FFFFFF",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Manrope-SemiBold",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Главная",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: "Тренировки",
          tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: "Сканер",
          tabBarIcon: ({ color, size }) => <Camera color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Тренер",
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профиль",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Шаг 1.6: Запустить и проверить в симуляторе**

```bash
cd FitnesApp && npx expo start -c
```

Нажать `i` для iOS. Проверить: шрифт Manrope применился, таб-бар синий, фон тёмный.

- [ ] **Шаг 1.7: Коммит**

```bash
git add FitnesApp/tailwind.config.js FitnesApp/global.css FitnesApp/app/_layout.tsx FitnesApp/app/(tabs)/_layout.tsx FitnesApp/package.json
git commit -m "feat(design): add Manrope font, update color tokens and tab bar"
```

---

## Task 2: Card + CustomInput компоненты

**Files:**
- Modify: `FitnesApp/src/components/atoms/Card.tsx`
- Modify: `FitnesApp/src/components/atoms/CustomInput.tsx`

- [ ] **Шаг 2.1: Обновить Card.tsx**

```typescript
import React from "react";
import { View, ViewStyle } from "react-native";

type CardProps = {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
  style?: ViewStyle;
  className?: string;
};

export default function Card({
  children,
  variant = "elevated",
  padding = "md",
  style,
  className = "",
}: CardProps) {
  const getVariantClass = () => {
    switch (variant) {
      case "elevated":
        return "bg-white dark:bg-dark-800 shadow-lg shadow-black/20 dark:shadow-black/50";
      case "outlined":
        return "bg-transparent border border-primary-600/20 dark:border-primary-400/20";
      default:
        return "bg-white dark:bg-dark-800";
    }
  };

  const getPaddingClass = () => {
    switch (padding) {
      case "sm": return "p-3";
      case "md": return "p-4";
      case "lg": return "p-6";
      default:   return "p-0";
    }
  };

  return (
    <View
      className={`rounded-[20px] overflow-hidden ${getVariantClass()} ${getPaddingClass()} ${className}`}
      style={style}
    >
      {children}
    </View>
  );
}
```

- [ ] **Шаг 2.2: Обновить CustomInput.tsx**

```typescript
import React from "react";
import { TextInput, View, Text, TextInputProps, ViewStyle } from "react-native";
import { useColorScheme } from "nativewind";

type CustomInputProps = TextInputProps & {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  icon?: React.ReactNode;
};

export default function CustomInput({
  label,
  error,
  containerStyle,
  style,
  icon,
  ...textInputProps
}: CustomInputProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={[{ width: "100%" }, containerStyle]}>
      {label && (
        <Text className="mb-2 text-sm font-bold text-dark-500 dark:text-dark-300 font-semibold">
          {label}
        </Text>
      )}
      <View className="relative flex-row items-center">
        {icon && (
          <View className="absolute left-4 z-10">{icon}</View>
        )}
        <TextInput
          className={`flex-1 rounded-[14px] border bg-surface-50 dark:bg-dark-800 py-3 text-base text-dark-950 dark:text-white font-sans ${
            icon ? "pl-12 pr-4" : "px-4"
          } ${
            error
              ? "border-error"
              : "border-dark-200/30 dark:border-white/8"
          }`}
          placeholderTextColor={isDark ? "#44445A" : "#9090B0"}
          {...textInputProps}
          style={[{ minHeight: 52, fontFamily: "Manrope-Regular" }, style]}
        />
      </View>
      {error && (
        <Text className="mt-1 text-xs font-medium text-error">{error}</Text>
      )}
    </View>
  );
}
```

- [ ] **Шаг 2.3: Проверить в симуляторе**

Открыть Login экран (выйти из аккаунта). Проверить: карточки с закруглением 20px, поля ввода с тёмным фоном.

- [ ] **Шаг 2.4: Коммит**

```bash
git add FitnesApp/src/components/atoms/Card.tsx FitnesApp/src/components/atoms/CustomInput.tsx
git commit -m "feat(design): update Card and CustomInput to v2 design system"
```

---

## Task 3: CustomButton с градиентом

**Files:**
- Modify: `FitnesApp/src/components/atoms/CustomButton.tsx`

- [ ] **Шаг 3.1: Обновить CustomButton.tsx с LinearGradient**

```typescript
import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type CustomButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  textClassName?: string;
  style?: ViewStyle;
};

export default function CustomButton({
  title,
  onPress,
  variant = "primary",
  size = "lg",
  isLoading = false,
  disabled = false,
  icon,
  className = "",
  textClassName = "",
  style,
}: CustomButtonProps) {
  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case "sm": return { paddingVertical: 8,  paddingHorizontal: 16, minHeight: 38, borderRadius: 10 };
      case "md": return { paddingVertical: 12, paddingHorizontal: 24, minHeight: 44, borderRadius: 12 };
      case "lg": return { paddingVertical: 14, paddingHorizontal: 32, minHeight: 52, borderRadius: 14 };
      default:   return { paddingVertical: 14, paddingHorizontal: 32, minHeight: 52, borderRadius: 14 };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "sm": return 13;
      case "md": return 15;
      case "lg": return 16;
      default:   return 16;
    }
  };

  const sizeStyle = getSizeStyle();
  const isDisabled = disabled || isLoading;

  const innerContent = (
    <>
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" || variant === "ghost" ? "#2B8EF0" : "#FFFFFF"}
        />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {icon}
          <Text
            style={{
              fontSize: getTextSize(),
              fontFamily: "Manrope-Bold",
              color: variant === "outline" || variant === "ghost" ? "#2B8EF0" : "#FFFFFF",
            }}
          >
            {title}
          </Text>
        </View>
      )}
    </>
  );

  if (variant === "primary") {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[{ opacity: isDisabled ? 0.5 : 1, borderRadius: sizeStyle.borderRadius }, style]}
      >
        <LinearGradient
          colors={["#2B8EF0", "#5BAAFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            ...sizeStyle,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {innerContent}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === "secondary") {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[{ opacity: isDisabled ? 0.5 : 1, borderRadius: sizeStyle.borderRadius }, style]}
      >
        <LinearGradient
          colors={["#3DD87A", "#5BFFAA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            ...sizeStyle,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {innerContent}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // outline + ghost
  const outlineStyle: ViewStyle =
    variant === "outline"
      ? {
          borderWidth: 1.5,
          borderColor: "rgba(43,142,240,0.4)",
          backgroundColor: "transparent",
        }
      : { backgroundColor: "transparent" };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        {
          ...sizeStyle,
          ...outlineStyle,
          alignItems: "center",
          justifyContent: "center",
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {innerContent}
    </TouchableOpacity>
  );
}
```

- [ ] **Шаг 3.2: Проверить в симуляторе**

Открыть Welcome или Login. Кнопка "Продолжить" / "Войти" должна иметь синий градиент слева направо.

- [ ] **Шаг 3.3: Коммит**

```bash
git add FitnesApp/src/components/atoms/CustomButton.tsx
git commit -m "feat(design): update CustomButton with gradient and Manrope font"
```

---

## Task 4: Новые атомарные компоненты

**Files:**
- Create: `FitnesApp/src/components/atoms/Icons.tsx`
- Create: `FitnesApp/src/components/atoms/MetricTile.tsx`
- Create: `FitnesApp/src/components/atoms/DifficultyBadge.tsx`

- [ ] **Шаг 4.1: Создать Icons.tsx — SVG иконки воды и кроссовка**

```typescript
import React from "react";
import Svg, { Path, Rect, Circle, Ellipse } from "react-native-svg";

// Капля воды — синяя с бликом
export function WaterDropIcon({ size = 24, color = "#2B8EF0" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C12 2 5 10.5 5 15C5 18.866 8.134 22 12 22C15.866 22 19 18.866 19 15C19 10.5 12 2Z"
        fill={color}
      />
      <Path
        d="M9 16C9 17.657 10.343 19 12 19"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Кроссовок Nike-style (вариант B)
export function SneakerIcon({ size = 24, color = "#3DD87A" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Path
        d="M5 26C5 26 6 21 10 20C13 18.5 16 19 19 18L27 14C28.5 13.3 30 13.5 31 14.5L35 18C35.8 18.8 35.5 20.2 34.5 20.7L20 27H6C5.4 27 5 26.6 5 26Z"
        fill={color}
      />
      <Rect x="4" y="26" width="32" height="4" rx="2" fill={color} opacity={0.7} />
      <Path
        d="M12 22C15 20.5 20 19 25 16.5"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Огонь — калории
export function FlameIcon({ size = 24, color = "#FF8C42" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C12 2 8 7 8 12C8 14.5 9.5 16 11 16C9 13 11 10 12 10C13 10 15 13 13 16C14.5 16 16 14.5 16 12C16 7 12 2 12 2Z"
        fill={color}
      />
      <Path
        d="M12 22C9.791 22 8 20.209 8 18C8 15.5 12 10 12 10C12 10 16 15.5 16 18C16 20.209 14.209 22 12 22Z"
        fill={color}
      />
    </Svg>
  );
}
```

- [ ] **Шаг 4.2: Создать MetricTile.tsx**

```typescript
import React from "react";
import { View, Text } from "react-native";
import { useColorScheme } from "nativewind";

type MetricTileProps = {
  value: string | number;
  label: string;
  color: string; // hex color для значения
};

export default function MetricTile({ value, label, color }: MetricTileProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? "#161625" : "#FFFFFF",
        borderRadius: 14,
        padding: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontFamily: "Manrope-ExtraBold",
          color,
          letterSpacing: -0.5,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 10,
          fontFamily: "Manrope-SemiBold",
          color: "#7070A0",
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
```

- [ ] **Шаг 4.3: Создать DifficultyBadge.tsx**

```typescript
import React from "react";
import { View, Text } from "react-native";

type Difficulty = "Beginner" | "Intermediate" | "Advanced" | "Начинающий" | "Средний" | "Продвинутый";

const BADGE_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  Beginner:    { bg: "rgba(61,216,122,0.15)",  text: "#3DD87A", label: "Начинающий" },
  Начинающий:  { bg: "rgba(61,216,122,0.15)",  text: "#3DD87A", label: "Начинающий" },
  easy:        { bg: "rgba(61,216,122,0.15)",  text: "#3DD87A", label: "Лёгкий" },
  Intermediate:{ bg: "rgba(255,140,66,0.15)",  text: "#FF8C42", label: "Средний" },
  Средний:     { bg: "rgba(255,140,66,0.15)",  text: "#FF8C42", label: "Средний" },
  medium:      { bg: "rgba(255,140,66,0.15)",  text: "#FF8C42", label: "Средний" },
  Advanced:    { bg: "rgba(255,86,86,0.15)",   text: "#FF5656", label: "Продвинутый" },
  Продвинутый: { bg: "rgba(255,86,86,0.15)",   text: "#FF5656", label: "Продвинутый" },
  hard:        { bg: "rgba(255,86,86,0.15)",   text: "#FF5656", label: "Продвинутый" },
};

export default function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const cfg = BADGE_CONFIG[difficulty] ?? { bg: "rgba(112,112,160,0.15)", text: "#7070A0", label: difficulty };

  return (
    <View
      style={{
        backgroundColor: cfg.bg,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ fontSize: 11, fontFamily: "Manrope-Bold", color: cfg.text }}>
        {cfg.label}
      </Text>
    </View>
  );
}
```

- [ ] **Шаг 4.4: Коммит**

```bash
git add FitnesApp/src/components/atoms/Icons.tsx FitnesApp/src/components/atoms/MetricTile.tsx FitnesApp/src/components/atoms/DifficultyBadge.tsx
git commit -m "feat(design): add Icons, MetricTile, DifficultyBadge components"
```

---

## Task 5: Home экран

**Files:**
- Modify: `FitnesApp/app/(tabs)/index.tsx`

- [ ] **Шаг 5.1: Прочитать текущий файл**

```bash
cat FitnesApp/app/(tabs)/index.tsx
```

- [ ] **Шаг 5.2: Обновить Home экран**

Сохранить ВСЮ бизнес-логику (хуки данных, обработчики), заменить только JSX и стили. Полная новая структура:

```typescript
import React, { useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue, useAnimatedStyle,
  withDelay, withTiming, withSequence,
} from "react-native-reanimated";
import { useColorScheme } from "nativewind";
import MetricTile from "@/components/atoms/MetricTile";
import { WaterDropIcon, SneakerIcon } from "@/components/atoms/Icons";
// СОХРАНИТЬ все существующие импорты хуков/сервисов

export default function HomeScreen() {
  // ── СОХРАНИТЬ всю существующую логику хуков ──
  // const { data: profile } = useProfile();
  // const { data: todayWorkout } = useTodayWorkout();
  // const { water, steps } = useHealthData();
  // const { data: nutrition } = useTodayNutrition();
  // ...

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // Анимация приветствия
  const welcomeOpacity = useSharedValue(1);
  const welcomeTranslate = useSharedValue(0);
  const nameOpacity = useSharedValue(0);
  const nameTranslate = useSharedValue(8);

  useEffect(() => {
    // Через 1.5с: "С возвращением" уходит вверх
    welcomeOpacity.value  = withDelay(1500, withTiming(0, { duration: 700 }));
    welcomeTranslate.value = withDelay(1500, withTiming(-10, { duration: 700 }));
    // Через 2.2с: имя появляется снизу
    nameOpacity.value    = withDelay(2200, withTiming(1, { duration: 700 }));
    nameTranslate.value  = withDelay(2200, withTiming(0, { duration: 700 }));
  }, []);

  const welcomeStyle = useAnimatedStyle(() => ({
    opacity: welcomeOpacity.value,
    transform: [{ translateY: welcomeTranslate.value }],
    position: "absolute",
  }));

  const nameStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateY: nameTranslate.value }],
  }));

  const bg = isDark ? "#0C0C16" : "#F4F4F8";
  const cardBg = isDark ? "#161625" : "#FFFFFF";
  const cardBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const textPrimary = isDark ? "#F2F2FA" : "#0C0C16";
  const textSecondary = isDark ? "#7070A0" : "#9090B0";

  // Имя из профиля — заменить на реальные данные
  const userName = ""; // profile?.full_name?.split(" ")[0] ?? ""

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Хедер с анимированным приветствием */}
        <LinearGradient
          colors={isDark ? ["#0E1A2E", "#0C0C16"] : ["#EBF4FF", "#F4F4F8"]}
          style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ height: 52, justifyContent: "center" }}>
              <Animated.View style={welcomeStyle}>
                <Text style={{ fontSize: 22, fontFamily: "Manrope-ExtraBold", color: textPrimary, letterSpacing: -0.6 }}>
                  С возвращением 👋
                </Text>
              </Animated.View>
              <Animated.View style={nameStyle}>
                <Text style={{ fontSize: 22, fontFamily: "Manrope-ExtraBold", color: textPrimary, letterSpacing: -0.6 }}>
                  {userName ? `Привет, ${userName}! 👋` : "С возвращением 👋"}
                </Text>
                <Text style={{ fontSize: 13, fontFamily: "Manrope-Medium", color: textSecondary, marginTop: 2 }}>
                  {new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
                </Text>
              </Animated.View>
            </View>
            {/* Аватар — сохранить существующую логику */}
            <View style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: "#2B8EF0", alignItems: "center", justifyContent: "center",
            }}>
              <Text style={{ fontSize: 16, fontFamily: "Manrope-Bold", color: "white" }}>
                {userName ? userName[0].toUpperCase() : "👤"}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* 3 метрики-плитки */}
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingTop: 14 }}>
          {/* Значения заменить на реальные данные из хуков */}
          <MetricTile value="1 840" label="Ккал"  color="#FF8C42" />
          <MetricTile value="6 240" label="Шаги"  color="#3DD87A" />
          <MetricTile value="3"     label="Трен."  color="#2B8EF0" />
        </View>

        {/* Hero карточка тренировки */}
        <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
          <LinearGradient
            colors={["#1a4a6e", "#2B8EF0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, overflow: "hidden", height: 160 }}
          >
            {/* Фото упражнения — заменить на Image когда будут файлы */}
            {/* <Image source={require("@/assets/workouts/cardio.jpg")} style={StyleSheet.absoluteFillObject} resizeMode="cover" /> */}
            <View style={{ position: "absolute", right: 16, bottom: 0, width: 90, height: 130,
              backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 42 }}>🏃</Text>
            </View>
            <View style={{ padding: 18, flex: 1, justifyContent: "space-between" }}>
              <View style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20,
                paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start" }}>
                <Text style={{ fontSize: 11, fontFamily: "Manrope-Bold", color: "white" }}>Сегодня</Text>
              </View>
              <View>
                {/* Заменить на данные из todayWorkout */}
                <Text style={{ fontSize: 18, fontFamily: "Manrope-ExtraBold", color: "white", letterSpacing: -0.4 }}>
                  Кардио #1
                </Text>
                <Text style={{ fontSize: 12, fontFamily: "Manrope-Medium", color: "rgba(255,255,255,0.7)" }}>
                  45 мин · Средний
                </Text>
                <TouchableOpacity style={{
                  marginTop: 8, backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
                  alignSelf: "flex-start", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
                }}>
                  <Text style={{ fontSize: 12, fontFamily: "Manrope-Bold", color: "white" }}>▶ Начать</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Вода + Шаги */}
        <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 14 }}>
          {/* Вода */}
          <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 16,
            padding: 14, borderWidth: 1, borderColor: cardBorder }}>
            <WaterDropIcon size={24} color="#2B8EF0" />
            <Text style={{ fontSize: 16, fontFamily: "Manrope-ExtraBold", color: textPrimary, marginTop: 6 }}>
              1 250 мл {/* заменить на реальное значение */}
            </Text>
            <Text style={{ fontSize: 10, fontFamily: "Manrope-SemiBold", color: textSecondary }}>
              из 1 800 мл
            </Text>
            <View style={{ height: 4, backgroundColor: "rgba(43,142,240,0.15)", borderRadius: 2, marginTop: 8 }}>
              <View style={{ height: "100%", width: "65%", backgroundColor: "#2B8EF0", borderRadius: 2 }} />
            </View>
          </View>
          {/* Шаги */}
          <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 16,
            padding: 14, borderWidth: 1, borderColor: cardBorder }}>
            <SneakerIcon size={24} color="#3DD87A" />
            <Text style={{ fontSize: 16, fontFamily: "Manrope-ExtraBold", color: textPrimary, marginTop: 6 }}>
              6 240 {/* заменить на реальное значение */}
            </Text>
            <Text style={{ fontSize: 10, fontFamily: "Manrope-SemiBold", color: textSecondary }}>
              из 10 000
            </Text>
            <View style={{ height: 4, backgroundColor: "rgba(61,216,122,0.15)", borderRadius: 2, marginTop: 8 }}>
              <View style={{ height: "100%", width: "40%", backgroundColor: "#3DD87A", borderRadius: 2 }} />
            </View>
          </View>
        </View>

        {/* КБЖУ сегодня */}
        <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24 }}>
          <View style={{ backgroundColor: cardBg, borderRadius: 20, padding: 16,
            borderWidth: 1, borderColor: cardBorder }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 14, fontFamily: "Manrope-Bold", color: textPrimary }}>КБЖУ сегодня</Text>
              <Text style={{ fontSize: 22, fontFamily: "Manrope-Black", color: "#2B8EF0", letterSpacing: -0.5 }}>
                1 840 {/* заменить на реальное значение */}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[
                { label: "Белки",    value: "142г", color: "#2B8EF0", bg: "rgba(43,142,240,0.15)",   w: "70%" },
                { label: "Жиры",     value: "58г",  color: "#FFCB47", bg: "rgba(255,203,71,0.15)",   w: "45%" },
                { label: "Углеводы", value: "210г", color: "#FF8C42", bg: "rgba(255,140,66,0.15)",   w: "55%" },
              ].map((item) => (
                <View key={item.label} style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ fontSize: 16, fontFamily: "Manrope-ExtraBold", color: item.color }}>{item.value}</Text>
                  <Text style={{ fontSize: 10, fontFamily: "Manrope-SemiBold", color: textSecondary }}>{item.label}</Text>
                  <View style={{ height: 3, width: "100%", backgroundColor: item.bg, borderRadius: 2, marginTop: 6 }}>
                    <View style={{ height: "100%", width: item.w, backgroundColor: item.color, borderRadius: 2 }} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
```

> **Важно:** При замене файла сохранить все существующие `useQuery` / `useMutation` хуки и передать их данные в UI вместо хардкод-значений.

- [ ] **Шаг 5.3: Подключить реальные данные**

Найти в старом файле все хуки (useWater, useSteps, useTodayWorkout, useNutrition и т.д.) и передать их значения в соответствующие места нового UI вместо хардкод-плейсхолдеров.

- [ ] **Шаг 5.4: Проверить в симуляторе**

Запустить приложение. Проверить:
- Анимация приветствия через 1.5с
- 3 плитки с реальными данными
- Hero-карточка с градиентом
- Иконки воды (капля) и шагов (кроссовок)
- Заголовок "КБЖУ сегодня"

- [ ] **Шаг 5.5: Коммит**

```bash
git add FitnesApp/app/(tabs)/index.tsx
git commit -m "feat(design): redesign Home screen - metrics tiles, hero card, animated greeting"
```

---

## Task 6: Workouts экран

**Files:**
- Modify: `FitnesApp/app/(tabs)/workouts.tsx`

- [ ] **Шаг 6.1: Прочитать текущий файл**

```bash
cat FitnesApp/app/(tabs)/workouts.tsx
```

- [ ] **Шаг 6.2: Обновить Workouts экран**

Сохранить всю логику FlashList, данных и навигации. Обновить UI:

```typescript
// В renderItem карточки тренировки заменить на:
const GRADIENT_COLORS: [string, string][] = [
  ["#1a3a6e", "#2B8EF0"], // синий
  ["#3a1a6e", "#8B5CF6"], // фиолетовый
  ["#0a3d3a", "#0EA5A0"], // бирюзовый
  ["#3d1a1a", "#E05252"], // красный
  ["#1a3d1a", "#3DD87A"], // зелёный
];

// Компонент карточки тренировки:
function WorkoutCard({ workout, index, onPress }: { workout: Workout; index: number; onPress: () => void }) {
  const isDark = useColorScheme().colorScheme === "dark";
  const colors = GRADIENT_COLORS[index % GRADIENT_COLORS.length];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={{ marginHorizontal: 20, marginBottom: 12 }}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, overflow: "hidden", height: 130 }}
      >
        {/* Фото-плейсхолдер справа */}
        <View style={{ position: "absolute", right: 0, bottom: 0, width: 100, height: 120,
          backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 50, opacity: 0.3 }}>🏋️</Text>
        </View>
        <View style={{ padding: 16, flex: 1, justifyContent: "space-between" }}>
          <Text style={{ fontSize: 10, fontFamily: "Manrope-Bold", color: "rgba(255,255,255,0.6)",
            textTransform: "uppercase", letterSpacing: 0.8 }}>
            {workout.category ?? "Тренировка"}
          </Text>
          <View>
            <Text style={{ fontSize: 17, fontFamily: "Manrope-ExtraBold", color: "white", letterSpacing: -0.4 }}>
              {workout.name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
              <Text style={{ fontSize: 11, fontFamily: "Manrope-SemiBold", color: "rgba(255,255,255,0.7)" }}>
                ⏱ {workout.duration} мин
              </Text>
              <DifficultyBadge difficulty={workout.difficulty} />
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
```

Добавить в начало файла:
```typescript
import { LinearGradient } from "expo-linear-gradient";
import DifficultyBadge from "@/components/atoms/DifficultyBadge";
```

**Недельный стрип** — добавить компонент над списком:

```typescript
function WeekStrip({ workoutDates }: { workoutDates: string[] }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i + 1);
    return d;
  });
  const dayNames = ["ПН","ВТ","СР","ЧТ","ПТ","СБ","ВС"];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 6 }}
      style={{ marginBottom: 14 }}>
      {days.map((d, i) => {
        const isToday = d.toDateString() === today.toDateString();
        const dateStr = d.toISOString().split("T")[0];
        const hasWorkout = workoutDates.includes(dateStr);
        return (
          <View key={i} style={{
            alignItems: "center", paddingHorizontal: 10, paddingVertical: 8,
            borderRadius: 14, minWidth: 40,
            backgroundColor: isToday ? "#2B8EF0" : "transparent",
          }}>
            <Text style={{ fontSize: 10, fontFamily: "Manrope-Bold",
              color: isToday ? "white" : "#44445A", textTransform: "uppercase" }}>
              {dayNames[i]}
            </Text>
            <Text style={{ fontSize: 15, fontFamily: "Manrope-Bold",
              color: isToday ? "white" : "#7070A0" }}>
              {d.getDate()}
            </Text>
            {hasWorkout && !isToday && (
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#3DD87A", marginTop: 2 }} />
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
```

- [ ] **Шаг 6.3: Проверить в симуляторе**

Перейти на вкладку Тренировки. Проверить: градиентные карточки, недельный стрип, зелёные точки.

- [ ] **Шаг 6.4: Коммит**

```bash
git add FitnesApp/app/(tabs)/workouts.tsx
git commit -m "feat(design): redesign Workouts screen - gradient cards and week strip"
```

---

## Task 7: Profile экран

**Files:**
- Modify: `FitnesApp/app/(tabs)/profile.tsx`

- [ ] **Шаг 7.1: Прочитать текущий файл**

```bash
cat FitnesApp/app/(tabs)/profile.tsx
```

- [ ] **Шаг 7.2: Добавить бар-чарт активности**

Перед существующим LineChart добавить запрос данных активности:

```typescript
// Хук для данных активности по дням недели (из существующих workouts данных)
const { data: weeklyActivity } = useQuery({
  queryKey: ["weekly-activity"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("workouts")
      .select("completed_at, duration")
      .not("completed_at", "is", null)
      .gte("completed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    if (error) return [0, 0, 0, 0, 0, 0, 0];
    // Группировать по дням недели (0=Пн, 6=Вс)
    const result = [0, 0, 0, 0, 0, 0, 0];
    data?.forEach((w) => {
      const day = new Date(w.completed_at).getDay();
      const idx = day === 0 ? 6 : day - 1;
      result[idx] += w.duration ?? 0;
    });
    return result;
  },
});
```

- [ ] **Шаг 7.3: Добавить плитки статистики и бар-чарт в JSX**

Найти секцию профиля с высотой/весом/целью и заменить на:

```typescript
{/* Плитки статистики */}
<View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
  {[
    { label: "Рост",  value: profile?.height ? `${profile.height} см` : "—", color: "#2B8EF0" },
    { label: "Вес",   value: profile?.weight ? `${profile.weight} кг` : "—", color: "#3DD87A" },
    { label: "Цель",  value: profile?.goal ?? "—",                            color: "#FF8C42" },
  ].map((s) => (
    <View key={s.label} style={{ flex: 1, backgroundColor: cardBg, borderRadius: 14,
      padding: 12, alignItems: "center", borderWidth: 1, borderColor: cardBorder }}>
      <Text style={{ fontSize: 15, fontFamily: "Manrope-ExtraBold", color: s.color }}>{s.value}</Text>
      <Text style={{ fontSize: 10, fontFamily: "Manrope-SemiBold", color: "#7070A0", marginTop: 2 }}>{s.label}</Text>
    </View>
  ))}
</View>

{/* Бар-чарт активности */}
<View style={{ backgroundColor: cardBg, borderRadius: 20, padding: 16,
  borderWidth: 1, borderColor: cardBorder, marginBottom: 16 }}>
  <Text style={{ fontSize: 14, fontFamily: "Manrope-Bold", color: textPrimary, marginBottom: 12 }}>
    Активность за неделю
  </Text>
  <BarChart
    data={{
      labels: ["ПН","ВТ","СР","ЧТ","ПТ","СБ","ВС"],
      datasets: [{ data: weeklyActivity ?? [0,0,0,0,0,0,0] }],
    }}
    width={Dimensions.get("window").width - 72}
    height={120}
    chartConfig={{
      backgroundColor: "transparent",
      backgroundGradientFrom: cardBg,
      backgroundGradientTo: cardBg,
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(43,142,240,${opacity})`,
      labelColor: () => "#7070A0",
      style: { borderRadius: 12 },
      propsForLabels: { fontFamily: "Manrope-SemiBold", fontSize: 10 },
    }}
    style={{ marginLeft: -16 }}
    showValuesOnTopOfBars={false}
    withInnerLines={false}
    flatColor
  />
</View>
```

Добавить в импорты:
```typescript
import { BarChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
```

- [ ] **Шаг 7.4: Обновить переключатель тем**

Найти текущий блок переключателя тем и заменить на:

```typescript
<View style={{ flexDirection: "row", gap: 6 }}>
  {(["light","dark","system"] as const).map((t) => {
    const icons = { light: "☀️", dark: "🌙", system: "⚙️" };
    const isActive = theme === t;
    return (
      <TouchableOpacity
        key={t}
        onPress={() => setTheme(t)}
        style={{
          paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
          backgroundColor: isActive ? "#2B8EF0" : "rgba(43,142,240,0.08)",
        }}
      >
        <Text style={{ fontSize: 13, fontFamily: "Manrope-Bold",
          color: isActive ? "white" : "#7070A0" }}>
          {icons[t]}
        </Text>
      </TouchableOpacity>
    );
  })}
</View>
```

- [ ] **Шаг 7.5: Проверить в симуляторе**

Перейти на вкладку Профиль. Проверить: плитки рост/вес/цель, бар-чарт (или нули если нет данных), переключатель тем.

- [ ] **Шаг 7.6: Коммит**

```bash
git add FitnesApp/app/(tabs)/profile.tsx
git commit -m "feat(design): redesign Profile - stats tiles, activity bar chart, theme switcher"
```

---

## Task 8: Chat экран

**Files:**
- Modify: `FitnesApp/app/(tabs)/chat.tsx`

- [ ] **Шаг 8.1: Прочитать текущий файл**

```bash
cat FitnesApp/app/(tabs)/chat.tsx
```

- [ ] **Шаг 8.2: Обновить стили пузырей и заголовка**

Сохранить всю логику сообщений/subscriptions/typing. Обновить только визуал:

**Заголовок** — найти View с "ИИ-Тренер" и заменить:
```typescript
<View style={{ flexDirection: "row", alignItems: "center", gap: 10,
  paddingHorizontal: 20, paddingVertical: 14,
  borderBottomWidth: 1, borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
  <LinearGradient colors={["#2B8EF0","#5BAAFF"]} style={{ width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center" }}>
    <Text style={{ fontSize: 16 }}>🤖</Text>
  </LinearGradient>
  <View>
    <Text style={{ fontSize: 16, fontFamily: "Manrope-ExtraBold", color: textPrimary }}>ИИ-Тренер</Text>
    <Text style={{ fontSize: 11, fontFamily: "Manrope-SemiBold", color: "#3DD87A" }}>● онлайн</Text>
  </View>
</View>
```

**Пузырь пользователя** — найти View стиля сообщения user и заменить фон:
```typescript
// Обернуть фон пользовательского пузыря в LinearGradient:
<LinearGradient
  colors={["#2B8EF0","#5BAAFF"]}
  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
  style={{ borderRadius: 16, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10, maxWidth: "75%" }}
>
  <Text style={{ color: "white", fontFamily: "Manrope-Medium", fontSize: 14 }}>{message.text}</Text>
</LinearGradient>
```

**Пузырь бота** — найти и заменить фон:
```typescript
<View style={{
  backgroundColor: isDark ? "#161625" : "#FFFFFF",
  borderWidth: 1, borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
  borderRadius: 16, borderBottomLeftRadius: 4,
  paddingHorizontal: 14, paddingVertical: 10, maxWidth: "75%",
}}>
  <Text style={{ color: textPrimary, fontFamily: "Manrope-Medium", fontSize: 14 }}>{message.text}</Text>
</View>
```

**Кнопка отправки** — заменить фон с primary-600 на:
```typescript
<LinearGradient colors={["#2B8EF0","#5BAAFF"]}
  style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }}>
  <Send color="white" size={18} />
</LinearGradient>
```

Добавить в импорты: `import { LinearGradient } from "expo-linear-gradient";`

- [ ] **Шаг 8.3: Проверить в симуляторе**

Перейти на вкладку Тренер. Отправить тестовое сообщение. Проверить синие пузыри, тёмные карточки бота.

- [ ] **Шаг 8.4: Коммит**

```bash
git add FitnesApp/app/(tabs)/chat.tsx
git commit -m "feat(design): redesign Chat - gradient bubbles, bot cards, online status"
```

---

## Task 9: Scanner экран

**Files:**
- Modify: `FitnesApp/app/(tabs)/scanner.tsx`

- [ ] **Шаг 9.1: Прочитать текущий файл**

```bash
cat FitnesApp/app/(tabs)/scanner.tsx
```

- [ ] **Шаг 9.2: Обновить цвета рамки, линии и кнопки**

Найти стили рамки сканера (уголки) и заменить цвет:
```typescript
// Было: borderColor: "#fff" или borderColor: "#ccc"
// Стало:
borderColor: "#2B8EF0"
```

Найти анимированную линию сканирования и заменить цвет:
```typescript
// Было: backgroundColor: "rgba(255,255,255,0.8)"
// Стало:
backgroundColor: "#2B8EF0"
// Или если LinearGradient:
colors={["transparent", "#2B8EF0", "transparent"]}
```

Найти кнопку камеры и заменить фон на LinearGradient:
```typescript
// Обернуть кнопку в:
<LinearGradient
  colors={["#2B8EF0","#5BAAFF"]}
  style={{ width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" }}
>
  {/* существующая иконка камеры */}
</LinearGradient>
```

Добавить пульсирующее свечение вокруг кнопки (Reanimated):
```typescript
const pulse = useSharedValue(1);
useEffect(() => {
  pulse.value = withRepeat(
    withSequence(withTiming(1.15, { duration: 800 }), withTiming(1, { duration: 800 })),
    -1
  );
}, []);
const pulseStyle = useAnimatedStyle(() => ({
  transform: [{ scale: pulse.value }],
  opacity: 2 - pulse.value,
}));

// Обернуть кнопку:
<Animated.View style={[pulseStyle, {
  position: "absolute", width: 90, height: 90, borderRadius: 45,
  backgroundColor: "rgba(43,142,240,0.2)",
}]} />
```

Добавить в импорты:
```typescript
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from "react-native-reanimated";
```

- [ ] **Шаг 9.3: Проверить на реальном устройстве**

Scanner требует камеры — проверить на физическом устройстве. Убедиться что рамка синяя и анимация работает.

- [ ] **Шаг 9.4: Коммит**

```bash
git add FitnesApp/app/(tabs)/scanner.tsx
git commit -m "feat(design): update Scanner - blue frame, gradient camera button, pulse animation"
```

---

## Task 10: Welcome экран

**Files:**
- Modify: `FitnesApp/app/welcome.tsx`

- [ ] **Шаг 10.1: Прочитать текущий файл**

```bash
cat FitnesApp/app/welcome.tsx
```

- [ ] **Шаг 10.2: Обновить Welcome экран**

Сохранить логику слайдов и навигации. Обновить:

**Фон слайда:**
```typescript
// Каждый слайд — LinearGradient фон
<LinearGradient
  colors={isDark ? ["#0E1A2E", "#0C0C16"] : ["#EBF4FF", "#F4F4F8"]}
  style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}
>
  {/* Иконка — квадратная карточка с синей подсветкой */}
  <View style={{
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: "rgba(43,142,240,0.12)",
    borderWidth: 1, borderColor: "rgba(43,142,240,0.25)",
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  }}>
    {slide.icon} {/* существующая иконка */}
  </View>
  <Text style={{ fontSize: 24, fontFamily: "Manrope-Black", color: textPrimary,
    letterSpacing: -0.6, textAlign: "center", marginBottom: 12 }}>
    {slide.title}
  </Text>
  <Text style={{ fontSize: 15, fontFamily: "Manrope-Medium", color: textSecondary,
    textAlign: "center", lineHeight: 22 }}>
    {slide.description}
  </Text>
</LinearGradient>
```

**Точки пагинации** — найти и заменить стиль активной точки:
```typescript
style={{
  width: isActive ? 20 : 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: isActive ? "#2B8EF0" : "rgba(255,255,255,0.2)",
  marginHorizontal: 3,
}}
```

**Кнопка** — автоматически наследует новый CustomButton с градиентом.

- [ ] **Шаг 10.3: Проверить в симуляторе**

Разлогиниться, открыть приложение. Проверить: квадратные иконки с синей подсветкой, синяя активная точка, градиентная кнопка.

- [ ] **Шаг 10.4: Коммит**

```bash
git add FitnesApp/app/welcome.tsx
git commit -m "feat(design): redesign Welcome screen - square icon cards, blue pagination"
```

---

## Task 11: Auth экраны (Login + Register)

**Files:**
- Modify: `FitnesApp/app/auth/login.tsx`
- Modify: `FitnesApp/app/auth/register.tsx`

- [ ] **Шаг 11.1: Прочитать текущие файлы**

```bash
cat FitnesApp/app/auth/login.tsx
cat FitnesApp/app/auth/register.tsx
```

- [ ] **Шаг 11.2: Обновить Login экран**

Сохранить всю логику авторизации. Обновить верхнюю часть:

```typescript
{/* Логотип */}
<LinearGradient
  colors={["#2B8EF0","#5BAAFF"]}
  style={{ width: 52, height: 52, borderRadius: 16,
    alignItems: "center", justifyContent: "center", marginBottom: 24 }}
>
  <Text style={{ fontSize: 24 }}>💪</Text>
</LinearGradient>

<Text style={{ fontSize: 26, fontFamily: "Manrope-Black", color: textPrimary,
  letterSpacing: -0.8, marginBottom: 6 }}>
  Добро пожаловать
</Text>
<Text style={{ fontSize: 14, fontFamily: "Manrope-Medium", color: textSecondary, marginBottom: 28 }}>
  Войди в свой аккаунт
</Text>
```

**Фон экрана** — обновить SafeAreaView backgroundColor:
```typescript
<SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#0C0C16" : "#F4F4F8" }}>
```

- [ ] **Шаг 11.3: Обновить Register экран**

Аналогично Login — та же структура логотипа и фона.

- [ ] **Шаг 11.4: Проверить в симуляторе**

Разлогиниться. Проверить Login: синий логотип, тёмный фон, новые поля ввода.

- [ ] **Шаг 11.5: Коммит**

```bash
git add FitnesApp/app/auth/login.tsx FitnesApp/app/auth/register.tsx
git commit -m "feat(design): redesign Auth screens - gradient logo, dark background"
```

---

## Task 12: Onboarding экран

**Files:**
- Modify: `FitnesApp/app/onboarding/index.tsx`

- [ ] **Шаг 12.1: Прочитать текущий файл**

```bash
cat FitnesApp/app/onboarding/index.tsx
```

- [ ] **Шаг 12.2: Обновить прогресс-бар**

Найти прогресс-бар и заменить:

```typescript
{/* Тонкий синий прогресс-бар сверху */}
<View style={{ height: 3, backgroundColor: "rgba(43,142,240,0.12)", borderRadius: 2, marginBottom: 24 }}>
  <Animated.View style={[{
    height: "100%",
    backgroundColor: "#2B8EF0",
    borderRadius: 2,
  }, progressBarStyle]} />
</View>
```

progressBarStyle с анимацией:
```typescript
const progressWidth = useSharedValue((currentStep / totalSteps) * 100);
useEffect(() => {
  progressWidth.value = withTiming((currentStep / totalSteps) * 100, { duration: 300 });
}, [currentStep]);
const progressBarStyle = useAnimatedStyle(() => ({
  width: `${progressWidth.value}%`,
}));
```

- [ ] **Шаг 12.3: Обновить карточки выбора**

Найти карточки выбора (цель, уровень, место тренировки) и заменить стиль:

```typescript
// Обычная карточка
<TouchableOpacity
  onPress={() => setSelected(item.value)}
  style={{
    backgroundColor: isDark ? "#161625" : "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: selected === item.value
      ? "#2B8EF0"
      : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
    backgroundColor: selected === item.value
      ? "rgba(43,142,240,0.08)"
      : isDark ? "#161625" : "#FFFFFF",
  }}
>
  <Text style={{ fontSize: 20, marginBottom: 4 }}>{item.emoji}</Text>
  <Text style={{
    fontSize: 14, fontFamily: "Manrope-Bold",
    color: selected === item.value ? "#2B8EF0" : textPrimary,
  }}>
    {item.label}
  </Text>
</TouchableOpacity>
```

- [ ] **Шаг 12.4: Проверить в симуляторе**

Разлогиниться, пройти заново онбординг. Проверить: прогресс-бар синий, карточки с синей рамкой при выборе.

- [ ] **Шаг 12.5: Коммит**

```bash
git add FitnesApp/app/onboarding/index.tsx
git commit -m "feat(design): redesign Onboarding - animated progress bar, selection cards"
```

---

## Task 13: Workout Detail экран

**Files:**
- Modify: `FitnesApp/app/workouts/[id].tsx`

- [ ] **Шаг 13.1: Прочитать текущий файл**

```bash
cat "FitnesApp/app/workouts/[id].tsx"
```

- [ ] **Шаг 13.2: Обновить цвета и шрифты**

Применить новую дизайн-систему:

```typescript
// Фон
backgroundColor: isDark ? "#0C0C16" : "#F4F4F8"

// Хедер с градиентом вместо solid purple
<LinearGradient colors={["#1a4a6e","#2B8EF0"]} style={{ ... }}>

// Все тексты — fontFamily: "Manrope-*"
// Основной: Manrope-ExtraBold
// Вторичный: Manrope-Medium
// Метки: Manrope-SemiBold

// Кнопка "Завершить тренировку" — автоматически наследует новый CustomButton

// Элементы списка упражнений
backgroundColor: isDark ? "#161625" : "#FFFFFF"
borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"
borderRadius: 16 (было 12)
```

- [ ] **Шаг 13.3: Проверить в симуляторе**

Открыть любую тренировку → перейти на детальный экран. Проверить: градиентный хедер, Manrope шрифты, новые карточки упражнений.

- [ ] **Шаг 13.4: Финальный коммит**

```bash
git add "FitnesApp/app/workouts/[id].tsx"
git commit -m "feat(design): redesign Workout Detail screen"
```

- [ ] **Шаг 13.5: Полная проверка приложения**

```bash
cd FitnesApp && npx expo start -c
```

Пройти весь флоу:
1. ✅ Welcome — квадратные иконки, синяя кнопка
2. ✅ Login — тёмный фон, синий логотип
3. ✅ Onboarding — синий прогресс-бар
4. ✅ Home — анимация, плитки, Hero-карточка, иконки
5. ✅ Workouts — градиентные карточки, стрип дней
6. ✅ Scanner — синяя рамка (на устройстве)
7. ✅ Chat — синие пузыри
8. ✅ Profile — плитки, бар-чарт, переключатель тем
9. ✅ Workout Detail — градиент, Manrope

- [ ] **Шаг 13.6: Финальный коммит всего редизайна**

```bash
git add -A
git commit -m "feat(design): complete UI redesign v2.0 - Manrope, blue palette, all screens"
```

---

## Примечания для фото тренировок

После получения сгенерированных фото:
1. Разместить в `FitnesApp/src/assets/workouts/`
2. Раскомментировать `<Image>` в Hero-карточке (Home) и workout cards (Workouts)
3. Убрать эмодзи-плейсхолдеры

Промпты для генерации — в спеке `docs/superpowers/specs/2026-04-19-ui-redesign-design.md`, раздел 3.2.
