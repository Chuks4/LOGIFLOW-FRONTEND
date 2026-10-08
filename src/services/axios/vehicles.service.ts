import { axiosClient } from "./client";

export type VehicleStatus =
  | "Available"
  | "On Trip"
  | "Under Maintenance"
  | "Out of Service";

export type Vehicle = {
  id: string;
  plateNumber: string;
  type: string;
  capacity: number;
  status: VehicleStatus;
  year: number;
  model: string;
  driverId?: string | null;
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type VehicleInput = {
  plateNumber: string;
  type: string;
  capacity: number;
  status?: VehicleStatus;
  year: number;
  model: string;
};

type VehicleListResponse = {
  status: boolean;
  data: {
    totalItems: number;
    totalPages: number;
    data: Vehicle[];
  };
};

type VehicleResponse = {
  status: boolean;
  data: Vehicle;
};

export async function getVehicles(params: {
  page: number;
  limit: number;
  keyword?: string;
  status?: VehicleStatus;
}) {
  const response = await axiosClient.get<VehicleListResponse>("/vehicles", {
    params,
  });
  return response.data.data;
}

export async function getVehicle(id: string) {
  const response = await axiosClient.get<VehicleResponse>(`/vehicles/${id}`);
  return response.data.data;
}

export async function createVehicle(data: VehicleInput) {
  const response = await axiosClient.post<VehicleResponse>("/vehicles", data);
  return response.data.data;
}

export async function updateVehicle(id: string, data: VehicleInput) {
  const response = await axiosClient.put<VehicleResponse>(
    `/vehicles/${id}`,
    data,
  );
  return response.data.data;
}

export async function assignVehicleDriver(id: string, driverId: string) {
  const response = await axiosClient.patch<VehicleResponse>(
    `/vehicles/${id}/driver`,
    { driverId },
  );
  return response.data.data;
}

export async function deleteVehicle(id: string) {
  const response = await axiosClient.delete<{ status: boolean; data: string }>(
    `/vehicles/${id}`,
  );
  return response.data.data;
}
