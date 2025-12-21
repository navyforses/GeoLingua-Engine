import { useState, useEffect, useRef, useCallback } from "react";
import * as Notifications from "expo-notifications";
import {
  registerForPushNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  NotificationTypes,
} from "@/lib/notifications";

interface UseNotificationsReturn {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isLoading: boolean;
  error: string | null;
  requestPermissions: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null,
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const requestPermissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await registerForPushNotificationsAsync();
      setExpoPushToken(token);

      if (!token) {
        setError("Could not get push notification token");
      }
    } catch (err) {
      setError("Failed to register for push notifications");
      console.error("Push notification error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Register for push notifications on mount
    requestPermissions();

    // Set up notification listeners
    notificationListener.current = addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
        setNotification(notification);

        // Handle different notification types
        const data = notification.request.content.data;
        if (data?.type === NotificationTypes.INCOMING_CALL) {
          // Handle incoming call notification
          console.log("Incoming call from:", data.callerName);
        }
      },
    );

    responseListener.current = addNotificationResponseReceivedListener(
      (response) => {
        console.log("Notification response:", response);

        // Handle notification tap
        const data = response.notification.request.content.data;
        if (data?.type === NotificationTypes.INCOMING_CALL) {
          // Navigate to call screen or handle call
          console.log("User tapped incoming call notification");
        }
      },
    );

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [requestPermissions]);

  return {
    expoPushToken,
    notification,
    isLoading,
    error,
    requestPermissions,
  };
}

export default useNotifications;
