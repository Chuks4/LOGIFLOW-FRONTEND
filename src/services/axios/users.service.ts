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

export type DriverOption = Pick<UserProfile, "id" | "firstName" | "lastName">;

type UserResponse = {
  status: boolean;
  data: UserProfile;
};

type DriversResponse = {
  status: boolean;
  data: {
    data: DriverOption[];
  };
};

export async function getDrivers() {
  const response = await axiosClient.get<DriversResponse>("/users", {
    params: { filterByRoles: "driver", page: 1, limit: 100 },
  });
  return response.data.data.data;
}

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
