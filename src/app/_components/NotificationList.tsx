"use client";

import type { Notification } from "~/hooks/useNotifications";

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const getNotificationStyles = () => {
    switch (notification.type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-700";
      case "error":
        return "bg-red-50 border-red-200 text-red-700";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-700";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return (
          <svg
            className="h-4 w-4 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            className="h-4 w-4 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            className="h-4 w-4 text-yellow-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        );
      case "info":
        return (
          <svg
            className="h-4 w-4 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`rounded-md border p-3 shadow-sm ${getNotificationStyles()}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="min-w-0 flex-1">
            {notification.title && (
              <h4 className="text-sm font-medium">{notification.title}</h4>
            )}
            <p className={`text-xs ${notification.title ? "mt-1" : ""}`}>
              {notification.message}
            </p>
          </div>
        </div>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={() => onDismiss(notification.id)}
          className="ml-3 flex-shrink-0 rounded-md p-1 hover:bg-black/5 focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:outline-none"
          title="Dismiss notification"
        >
          <svg
            className="h-4 w-4 opacity-60 hover:opacity-100"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface NotificationListProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "inline";
  maxNotifications?: number;
}

export default function NotificationList({
  notifications,
  onDismiss,
  position = "inline",
  maxNotifications = 5,
}: NotificationListProps) {
  // Show only the most recent notifications
  const displayNotifications = notifications.slice(-maxNotifications);

  if (displayNotifications.length === 0) {
    return null;
  }

  const getPositionClasses = () => {
    if (position === "inline") return "";

    const baseClasses = "fixed z-50 pointer-events-none";
    switch (position) {
      case "top-right":
        return `${baseClasses} top-4 right-4`;
      case "top-left":
        return `${baseClasses} top-4 left-4`;
      case "bottom-right":
        return `${baseClasses} bottom-4 right-4`;
      case "bottom-left":
        return `${baseClasses} bottom-4 left-4`;
      default:
        return "";
    }
  };

  return (
    <div className={getPositionClasses()}>
      <div
        className={`space-y-2 ${position !== "inline" ? "pointer-events-auto w-80" : ""}`}
      >
        {displayNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  );
}
