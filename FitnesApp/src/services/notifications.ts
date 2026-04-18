import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Configure how notifications should be handled when the app is running
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    // console.log("Must use physical device for Push Notifications");
    // return; // For locally scheduled notifications, it works on simulators too
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get push token for push notification!");
    return false;
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#7C3AED",
    });
  }

  return true;
}

export async function scheduleWorkoutReminder(workoutName: string, date: Date) {
  // Schedule a notification 30 minutes before the workout
  const trigger = new Date(date.getTime() - 30 * 60000);
  
  if (trigger < new Date()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Пора тренироваться! 🏋️",
      body: `Твоя тренировка "${workoutName}" начнется через 30 минут. Готов?`,
      data: { screen: "/(tabs)/workouts" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: trigger,
    },
  });
}

export async function scheduleDailyReminders() {
  // Clear existing to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  // 1. Morning Reminder (9:00 AM)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Доброе утро! ☀️",
      body: "Не забудь сегодня выпить достаточно воды и проверить план тренировок.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  });

  // 2. Evening Reminder (9:00 PM)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Как прошел день? 🌙",
      body: "Запиши свой вес и питание, чтобы ИИ мог точнее рассчитать твой прогресс.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 21,
      minute: 0,
    },
  });

  // 3. Water Reminder (every 3 hours during day)
  const waterHours = [12, 15, 18];
  for (const hour of waterHours) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Пора пить воду 💧",
        body: "Поддержание водного баланса важно для метаболизма. Выпей стакан воды!",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
      },
    });
  }
}
