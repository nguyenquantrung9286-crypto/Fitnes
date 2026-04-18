import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useAuth } from "@/context/auth-context";
import {
  getMessages,
  sendMessage,
  subscribeToMessages,
} from "@/services/chat";
import { Message } from "@/types";
import { Send, User as UserIcon, Bot } from "lucide-react-native";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function ChatScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (user) {
      loadMessages();
      const subscription = subscribeToMessages(user.id, (newMessage) => {
        setMessages((prev) => {
          // Avoid duplicates if the message was already added by sendMessage
          if (prev.find((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const loadMessages = async () => {
    try {
      if (user) {
        const data = await getMessages(user.id);
        setMessages(data);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !user || sending) return;

    const text = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      await sendMessage(user.id, text);
      // Real-time subscription will handle adding the message to state
    } catch (error) {
      console.error("Error sending message:", error);
      // Optional: show error to user
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.is_from_user;
    return (
      <View
        className={`mb-4 flex-row ${
          isUser ? "justify-end" : "justify-start"
        } px-4`}
      >
        {!isUser && (
          <View className="mr-2 h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
            <Bot size={16} color="#7C3AED" />
          </View>
        )}
        <View
          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-primary-600 rounded-tr-none"
              : "bg-gray-100 dark:bg-dark-800 rounded-tl-none"
          }`}
        >
          <Text
            className={`text-base ${
              isUser ? "text-white" : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {item.content}
          </Text>
          <Text
            className={`mt-1 text-[10px] ${
              isUser ? "text-primary-100" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {format(new Date(item.created_at), "HH:mm", { locale: ru })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-dark-950">
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-dark-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        className="flex-1"
      >
        {/* Header */}
        <View className="border-b border-gray-200 bg-white px-4 py-3 dark:border-dark-800 dark:bg-dark-900">
          <Text className="text-xl font-bold text-gray-900 dark:text-gray-50">
            ИИ-Тренер
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            Всегда на связи
          </Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={[...messages].reverse()}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={{ paddingVertical: 20 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20 px-10">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                <Bot size={32} color="#7C3AED" />
              </View>
              <Text className="text-center text-lg font-bold text-gray-900 dark:text-gray-50">
                Привет! Я твой ИИ-тренер.
              </Text>
              <Text className="mt-2 text-center text-gray-500 dark:text-gray-400">
                Задай мне любой вопрос о тренировках, питании или твоем прогрессе.
              </Text>
            </View>
          }
        />

        {/* Input Area */}
        <View className="border-t border-gray-200 bg-white p-4 dark:border-dark-800 dark:bg-dark-900">
          <View className="flex-row items-center space-x-2">
            <TextInput
              className="flex-1 rounded-2xl bg-gray-100 px-4 py-3 text-base text-gray-900 dark:bg-dark-800 dark:text-gray-50"
              placeholder="Спроси что-нибудь..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
              className={`h-12 w-12 items-center justify-center rounded-full ${
                !inputText.trim() || sending ? "bg-gray-200 dark:bg-dark-700" : "bg-primary-600"
              }`}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Send size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
