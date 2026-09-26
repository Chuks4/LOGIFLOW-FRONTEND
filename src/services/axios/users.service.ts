import { axiosClient } from "./client";

export type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  gender?: string;
  dob?: string;
  phoneNumber?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  role?: { name: string };
};

type UserResponse = {
  status: boolean;
  data: UserProfile;
};

export async function getCurrentUser() {
  const response = await axiosClient.get<UserResponse>("/users/me");
  return response.data.data;
}

export async function updateCurrentUser(data: Record<string, string>) {
  const response = await axiosClient.put<UserResponse>("/users/me", data);
  return response.data.data;
}

export async function changeCurrentUserPassword(data: {
  oldPassword: string;
  newPassword: string;
}) {
  const response = await axiosClient.patch<UserResponse>(
    "/users/change-password",
    data,
  );
  return response.data.data;
}
