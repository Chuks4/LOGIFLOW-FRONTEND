import { axiosClient } from "./client";

export type UserNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

type NotificationsResponse = {
  status: boolean;
  data: UserNotification[];
};

type NotificationResponse = {
  status: boolean;
  data: UserNotification;
};

export async function getUserNotifications() {
  const response =
    await axiosClient.get<NotificationsResponse>("/notifications");
  return response.data.data;
}

export async function markNotificationAsRead(id: string) {
  const response = await axiosClient.patch<NotificationResponse>(
    `/notifications/read/${id}`,
  );
  return response.data.data;
}

export async function markAllNotificationsAsRead() {
  await axiosClient.patch("/notifications/readAll");
}
