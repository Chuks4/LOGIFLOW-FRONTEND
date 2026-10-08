"use client";

"use client";

import AdminDashboard from "@/components/AdminDashboard";
import CustomerDashboard from "@/components/CustomerDashboard";
import DispatcherDashboard from "@/components/DispatcherDashboard";
import DriverDashboard from "@/components/DriverDashboard";
import { readSession } from "@/lib/session";

export default function DashboardPage() {
  const role = readSession()?.userType;

  if (!role) return null;

  switch (role) {
    case "super_admin":
      return <AdminDashboard />;

    case "driver":
      return <DriverDashboard />;

    case "dispatcher":
      return <DispatcherDashboard />;

    default:
      return <CustomerDashboard />;
  }
}
