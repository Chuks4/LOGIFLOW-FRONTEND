import { axiosClient } from "./client";

export type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId?: string;
  status?: "active" | "pending" | "suspended";
  emailVerified?: boolean;
  createdAt?: string;
  gender?: string;
  dob?: string;
  phoneNumber?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  role?: { id?: string; name: string };
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

export type UserInput = {
  email?: string;
  password?: string;
  firstName: string;
  lastName: string;
  roleId: string;
  gender: string;
  dob: string;
  phoneNumber: string;
  country?: string;
  state?: string;
  city?: string;
  address: string;
};

type UsersResponse = {
  status: boolean;
  data: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    data: UserProfile[];
  };
};

type UserStatus = NonNullable<UserProfile["status"]>;

export async function getDrivers() {
  const response = await axiosClient.get<DriversResponse>("/users", {
    params: { filterByRoles: "driver", page: 1, limit: 100 },
  });
  return response.data.data.data;
}

export async function getUsers(params: {
  page: number;
  limit: number;
  keyword?: string;
  filterByRoles?: string;
}) {
  const response = await axiosClient.get<UsersResponse>("/users", { params });
  return response.data.data;
}

export async function getUserById(id: string) {
  const response = await axiosClient.get<UserResponse>(`/users/${id}`);
  return response.data.data;
}

export async function createUser(data: UserInput & { password: string }) {
  const response = await axiosClient.post<UserResponse>("/users", data);
  return response.data.data;
}

export async function updateUser(id: string, data: UserInput) {
  const response = await axiosClient.put<UserResponse>(`/users/${id}`, data);
  return response.data.data;
}

export async function updateUserStatus(id: string, status: UserStatus) {
  const response = await axiosClient.patch<UserResponse>(
    `/users/${id}/status`,
    { status },
  );
  return response.data.data;
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
