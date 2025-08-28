import { useState, useCallback } from "react";

export interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title?: string;
  message: string;
  duration?: number; // Auto-dismiss after milliseconds, 0 = no auto-dismiss
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  }, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const newNotification: Notification = {
        ...notification,
        id,
        duration: notification.duration ?? 5000, // Default 5 second auto-dismiss
      };

      setNotifications((prev) => [...prev, newNotification]);

      // Auto-dismiss if duration is set and > 0
      if (newNotification.duration && newNotification.duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, newNotification.duration);
      }

      return id;
    },
    [removeNotification],
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  };
}

// Utility functions for common notification types
export const createNotification = {
  success: (
    message: string,
    options?: Partial<Omit<Notification, "id" | "type" | "message">>,
  ): Omit<Notification, "id"> => ({
    type: "success",
    message,
    duration: 5000,
    ...options,
  }),

  error: (
    message: string,
    options?: Partial<Omit<Notification, "id" | "type" | "message">>,
  ): Omit<Notification, "id"> => ({
    type: "error",
    message,
    duration: 0, // Errors don't auto-dismiss by default
    ...options,
  }),

  info: (
    message: string,
    options?: Partial<Omit<Notification, "id" | "type" | "message">>,
  ): Omit<Notification, "id"> => ({
    type: "info",
    message,
    duration: 5000,
    ...options,
  }),

  warning: (
    message: string,
    options?: Partial<Omit<Notification, "id" | "type" | "message">>,
  ): Omit<Notification, "id"> => ({
    type: "warning",
    message,
    duration: 5000,
    ...options,
  }),
};
