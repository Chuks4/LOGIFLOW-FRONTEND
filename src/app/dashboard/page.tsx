"use client";

import CustomerDashboard from "@/components/CustomerDashboard";
import DriverDashboard from "@/components/DriverDashboard";
import { readSession } from "@/lib/session";

export default function DashboardPage() {
  const role = readSession()?.userType;

  if (role === "driver") {
    return <DriverDashboard />;
  }

  return <CustomerDashboard />;
}
