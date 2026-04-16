import React from "react";
import { View, ViewStyle } from "react-native";

type CardProps = {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
  style?: ViewStyle;
  className?: string; // Add className prop for flexibility
};

export default function Card({
  children,
  variant = "elevated",
  padding = "md",
  style,
  className = "",
}: CardProps) {
  // Base classes for variant
  const getVariantClass = () => {
    switch (variant) {
      case "elevated":
        return "bg-white dark:bg-dark-800 shadow-sm shadow-black/10 dark:shadow-black/40";
      case "outlined":
        return "bg-transparent border border-gray-100 dark:border-dark-700";
      default:
        return "bg-white dark:bg-dark-800";
    }
  };

  const getPaddingClass = () => {
    switch (padding) {
      case "sm": return "p-3";
      case "md": return "p-4";
      case "lg": return "p-6";
      default: return "p-0";
    }
  };

  return (
    <View
      className={`rounded-2xl overflow-hidden ${getVariantClass()} ${getPaddingClass()} ${className}`}
      style={style}
    >
      {children}
    </View>
  );
}
