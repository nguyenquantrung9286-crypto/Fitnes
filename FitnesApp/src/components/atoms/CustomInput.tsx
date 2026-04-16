import React from "react";
import {
  TextInput,
  View,
  Text,
  TextInputProps,
  ViewStyle,
} from "react-native";
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

  return (
    <View style={[{ width: "100%" }, containerStyle]}>
      {label && (
        <Text className="mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">{label}</Text>
      )}
      <View className="relative flex-row items-center">
        {icon && (
          <View className="absolute left-4 z-10">
            {icon}
          </View>
        )}
        <TextInput
          className={`flex-1 rounded-xl border-2 bg-white dark:bg-dark-900 py-3 text-base text-gray-900 dark:text-gray-50 ${
            icon ? "pl-12 pr-4" : "px-4"
          } ${
            error ? "border-red-400" : "border-gray-100 dark:border-dark-700 focus:border-primary-500"
          }`}
          placeholderTextColor={colorScheme === 'dark' ? '#6B7280' : '#A1A1AA'}
          {...textInputProps}
          style={[{ minHeight: 52 }, style]}
        />
      </View>
      {error && <Text className="mt-1 text-xs font-medium text-red-500">{error}</Text>}
    </View>
  );
}
