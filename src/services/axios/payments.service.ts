import { axiosClient } from "./client";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export type Payment = {
  id: string;
  reference: string;
  amount: number | string;
  status: PaymentStatus;
  timestamp: string;
  paymentMethod: string;
  shipment: string;
};

type PaymentsResponse = {
  status: boolean;
  data: {
    totalItems: number;
    totalPages: number;
    data: Payment[];
  };
};

type PaymentResponse = {
  status: boolean;
  data: Payment;
};

export async function getUserPayments(params: {
  page: number;
  limit: number;
  keyword?: string;
  status?: PaymentStatus;
}) {
  const response = await axiosClient.get<PaymentsResponse>("/payments/user", {
    params,
  });
  return response.data.data;
}

export async function getUserPayment(id: string) {
  const response = await axiosClient.get<PaymentResponse>(
    `/payments/user/${id}`,
  );
  return response.data.data;
}
