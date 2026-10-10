"use client";

import { useCallback, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { FiBell, FiCheck, FiX } from "react-icons/fi";

import { getValidAccessToken } from "@/services/axios/auth.service";
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type UserNotification,
} from "@/services/axios/notifications.service";

import styles from "./Notifications.module.css";

type IncomingNotification = UserNotification & {
  count?: number;
};

function socketUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:5000";
  return new URL(apiUrl).origin;
}

function formatNotificationDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const result = await getUserNotifications();
      setNotifications(result);
      setUnreadCount(result.filter((notification) => !notification.isRead).length);
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadNotifications]);

  useEffect(() => {
    let socket: Socket | null = null;
    let cancelled = false;

    void getValidAccessToken()
      .then((token) => {
        if (cancelled) return;

        socket = io(socketUrl(), { auth: { token } });
        socket.on("notification:new", (incoming: IncomingNotification) => {
          setNotifications((current) => {
            if (current.some((notification) => notification.id === incoming.id))
              return current;
            return [incoming, ...current];
          });
          setUnreadCount(
            typeof incoming.count === "number"
              ? incoming.count
              : (count) => count + (incoming.isRead ? 0 : 1),
          );
        });
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, []);

  async function markAsRead(notification: UserNotification) {
    if (notification.isRead || isUpdating) return;

    setIsUpdating(true);
    try {
      const updatedNotification = await markNotificationAsRead(notification.id);
      setNotifications((current) =>
        current.map((item) =>
          item.id === updatedNotification.id ? updatedNotification : item,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsUpdating(false);
    }
  }

  async function markAllAsRead() {
    if (unreadCount === 0 || isUpdating) return;

    setIsUpdating(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, isRead: true })),
      );
      setUnreadCount(0);
    } catch {
      // The Axios interceptor displays the API error toast.
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className={styles.root}>
      <button
        aria-expanded={isOpen}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        className={styles.bellButton}
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <FiBell aria-hidden="true" />
        {unreadCount > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          aria-label="Notifications"
          className={styles.popover}
          aria-live="polite"
        >
          <header className={styles.popoverHeader}>
            <div>
              <h2>Notifications</h2>
              <p>
                {unreadCount === 0
                  ? "You are all caught up."
                  : `${unreadCount} unread`}
              </p>
            </div>
            <div className={styles.headerActions}>
              <button
                aria-label="Mark all notifications as read"
                className={styles.markAllButton}
                disabled={unreadCount === 0 || isUpdating}
                onClick={() => void markAllAsRead()}
                type="button"
              >
                <FiCheck aria-hidden="true" />
                Mark all read
              </button>
              <button
                aria-label="Close notifications"
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className={styles.list}>
            {isLoading ? (
              <p className={styles.empty}>Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className={styles.empty}>You have no notifications yet.</p>
            ) : (
              notifications.map((notification) => (
                <article
                  className={`${styles.notification} ${notification.isRead ? "" : styles.unread}`}
                  key={notification.id}
                >
                  <div className={styles.notificationHeading}>
                    <h3>{notification.title}</h3>
                    {!notification.isRead && (
                      <span className={styles.unreadDot} aria-label="Unread" />
                    )}
                  </div>
                  <p className={styles.message}>{notification.message}</p>
                  <div className={styles.notificationFooter}>
                    <span>{formatNotificationDate(notification.createdAt)}</span>
                    {!notification.isRead && (
                      <button
                        className={styles.markReadButton}
                        disabled={isUpdating}
                        onClick={() => void markAsRead(notification)}
                        type="button"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
