import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
}

// Get Expo push token
export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  let token: string | null = null;

  // Check if it's a physical device
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get push notification permissions");
    return null;
  }

  // Get the Expo push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    const pushTokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    token = pushTokenData.data;
    console.log("Expo Push Token:", token);
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }

  // Android-specific channel setup
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4F46E5",
    });

    await Notifications.setNotificationChannelAsync("calls", {
      name: "Incoming Calls",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: "#22C55E",
      sound: "default",
    });
  }

  return token;
}

// Schedule a local notification
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  channelId?: string,
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      ...(channelId && Platform.OS === "android" ? { channelId } : {}),
    },
    trigger: null, // Immediate
  });

  return id;
}

// Cancel a scheduled notification
export async function cancelNotification(
  notificationId: string,
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// Cancel all notifications
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Set badge count
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

// Get badge count
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

// Dismiss all notifications
export async function dismissAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

// Add notification received listener
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

// Add notification response listener (when user taps notification)
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// Notification types for the app
export const NotificationTypes = {
  INCOMING_CALL: "incoming_call",
  CALL_ACCEPTED: "call_accepted",
  CALL_MISSED: "call_missed",
  CALL_ENDED: "call_ended",
  NEW_MESSAGE: "new_message",
  PAYMENT_SUCCESS: "payment_success",
  LOW_BALANCE: "low_balance",
} as const;

export type NotificationType =
  (typeof NotificationTypes)[keyof typeof NotificationTypes];

// Helper to show incoming call notification
export async function showIncomingCallNotification(
  callerName: string,
  roomId: string,
): Promise<string> {
  return scheduleLocalNotification(
    "Incoming Call",
    `${callerName} is calling...`,
    {
      type: NotificationTypes.INCOMING_CALL,
      roomId,
      callerName,
    },
    "calls",
  );
}

// Helper to show call missed notification
export async function showMissedCallNotification(
  callerName: string,
): Promise<string> {
  return scheduleLocalNotification(
    "Missed Call",
    `You missed a call from ${callerName}`,
    {
      type: NotificationTypes.CALL_MISSED,
      callerName,
    },
  );
}
