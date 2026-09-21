import { axiosClient } from "./client";

export type OverviewMetrics = {
  totalShipments: number;
  activeShipments: number;
  inTransit: number;
  deliveredThisMonth: number;
};

export type OverviewResponse = {
  metrics: OverviewMetrics;
};

export async function getOverviewAnalytics() {
  const response = await axiosClient.get<{
    status: boolean;
    data: OverviewResponse;
  }>("/analytics/overview");

  return response.data.data;
}
