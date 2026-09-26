import { axiosClient } from "./client";

export type ShipmentStatus =
  | "Pending"
  | "Assigned"
  | "Picked Up"
  | "In Transit"
  | "Delivered"
  | "Returned"
  | "Cancelled"
  | "Confirmed";

export type ShipmentItem = {
  id?: string;
  itemName: string;
  quantity: number;
  weight?: number;
  category?: string;
  isFragile?: boolean;
};

export type ShipmentHistory = {
  id: string;
  status: ShipmentStatus;
  event: string;
  notes?: string;
  createdAt: string;
};

export type Shipment = {
  id: string;
  trackingNumber: string;
  status: ShipmentStatus;
  shipmentType: string;
  pickupAddress: string;
  deliveryAddress: string;
  recipientName: string;
  recipientPhone: string;
  estimatedCost: number | string;
  weight?: number | string;
  dimensions?: string;
  note?: string;
  createdAt: string;
  items?: ShipmentItem[];
  shipmentStatusHistory?: ShipmentHistory[];
};

type ShipmentsResponse = {
  status: boolean;
  data: {
    totalItems: number;
    totalPages: number;
    data: Shipment[];
  };
};

type ShipmentResponse = {
  status: boolean;
  data: Shipment;
};

export type ShipmentCostRequest = {
  shipmentType: string;
  vehicleType: string;
  deliveryLat: number;
  deliveryLng: number;
  pickupLat: number;
  pickupLng: number;
};

export type ShipmentCostResponse = {
  estimatedCost: number | string;
  distanceInKm: number;
  pricePerKm: number;
  vehicleFee: number;
  shipmentTypePricing: number;
};

export type AddressSearchResponse = {
  address: string;
  latitude: number;
  longitude: number;
};

export async function getShipments(params: {
  page: number;
  limit: number;
  keyword?: string;
  customerId?: string;
  driverId?: string;
}) {
  const response = await axiosClient.get<ShipmentsResponse>("/shipments", {
    params,
  });
  return response.data.data;
}

export async function getShipment(id: string) {
  const response = await axiosClient.get<ShipmentResponse>(`/shipments/${id}`);
  return response.data.data;
}

export async function createShipment(data: Record<string, unknown>) {
  const response = await axiosClient.post<ShipmentResponse>("/shipments", data);
  return response.data.data;
}

export type PaymentInitialization = {
  status: boolean;
  message: string;
  url: string;
  access_code: string;
};

export async function updateShipmentStatus(
  id: string,
  status: "In Transit" | "Delivered" | "Picked Up",
) {
  const response = await axiosClient.put<ShipmentResponse>(`/shipments/${id}`, {
    status,
  });
  return response.data.data;
}

export async function initializeShipmentPayment(
  shipmentId: string,
  amount: number,
) {
  const response = await axiosClient.post<{
    status: boolean;
    data: PaymentInitialization;
  }>("/payments/initialize", { amount, shipmentId });
  return response.data.data;
}

export async function calculateShipmentCost(data: ShipmentCostRequest) {
  const response = await axiosClient.post<{
    status: boolean;
    data: ShipmentCostResponse;
  }>("/geoapify", data);
  return response.data.data;
}

export async function searchShipmentAddress(address: string) {
  const response = await axiosClient.post<{
    status: boolean;
    data: AddressSearchResponse;
  }>("/geoapify/search", { address });
  return response.data.data;
}
