import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  ViewStyle,
} from "react-native";
type CustomButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean; // Changed loading to isLoading to avoid collision
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
  
  const getVariantClass = () => {
    switch (variant) {
      case "primary":
        return "bg-primary-600 dark:bg-primary-500";
      case "secondary":
        return "bg-accent-500 dark:bg-accent-600";
      case "outline":
        return "bg-transparent border-2 border-primary-600 dark:border-primary-400";
      case "ghost":
        return "bg-transparent";
      default:
        return "bg-primary-600";
    }
  };

  const getTextVariantClass = () => {
    switch (variant) {
      case "primary":
      case "secondary":
        return "text-white";
      case "outline":
      case "ghost":
        return "text-primary-600 dark:text-primary-400";
      default:
        return "text-white";
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case "sm": return "py-2 px-4 min-h-[36px]";
      case "md": return "py-3 px-6 min-h-[44px]";
      case "lg": return "py-4 px-8 min-h-[52px]";
      default: return "py-4 px-8";
    }
  };

  const getTextSizeClass = () => {
    switch (size) {
      case "sm": return "text-sm";
      case "md": return "text-base";
      case "lg": return "text-lg font-semibold";
      default: return "text-lg";
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      className={`flex-row items-center justify-center rounded-xl gap-2 ${getVariantClass()} ${getSizeClass()} ${disabled ? 'opacity-50' : 'opacity-100'} ${className}`}
      style={style}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" || variant === "ghost" ? "#7C3AED" : "#FFFFFF"}
        />
      ) : (
        <>
          {icon}
          <Text className={`${getTextVariantClass()} ${getTextSizeClass()} ${textClassName}`}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
