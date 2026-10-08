export type RoleName = "super_admin" | "dispatcher" | "driver" | "customer";

export type Permission = `${string}:${string}`;

export type NavigationItem = {
  label: string;
  href: string;
  resource: string;
  action: string;
};

export const roleLabels: Record<RoleName, string> = {
  super_admin: "Administrator",
  dispatcher: "Dispatcher",
  driver: "Driver",
  customer: "Customer",
};

export const navigation: NavigationItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    resource: "dashboard",
    action: "read",
  },
  {
    label: "Shipments",
    href: "/dashboard/shipments",
    resource: "shipments",
    action: "read",
  },
  {
    label: "Drivers",
    href: "/dashboard/drivers",
    resource: "drivers",
    action: "read",
  },
  {
    label: "Vehicles",
    href: "/dashboard/vehicles",
    resource: "vehicles",
    action: "read",
  },
  {
    label: "Payments",
    href: "/dashboard/payments",
    resource: "payments",
    action: "read",
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    resource: "dashboard",
    action: "read",
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    resource: "reports",
    action: "read",
  },
  {
    label: "Users",
    href: "/dashboard/users",
    resource: "users",
    action: "read",
  },
  {
    label: "Roles & permissions",
    href: "/dashboard/access",
    resource: "roles",
    action: "read",
  },
  {
    label: "Permissions",
    href: "/dashboard/permissions",
    resource: "permissions",
    action: "read",
  },
];

export function can(
  permissionSet: Permission[],
  resource: string,
  action: string,
) {
  return permissionSet.includes(`${resource}:${action}`);
}

export function visibleNavigation(permissionSet: Permission[]) {
  return navigation.filter((item) =>
    can(permissionSet, item.resource, item.action),
  );
}

export function normalizeRole(role: unknown): RoleName | null {
  if (typeof role !== "string") return null;
  const normalized = role.toLowerCase();
  if (normalized === "super_admin") return "super_admin";
  return normalized in roleLabels ? (normalized as RoleName) : null;
}
