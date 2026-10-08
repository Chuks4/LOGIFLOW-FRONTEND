import { axiosClient } from "./client";

export type AccessRole = {
  id: string;
  name: string;
  desc?: string | null;
  isActive: boolean;
  createdAt?: string;
};

export type AccessPermission = {
  id: string;
  name: string;
  desc?: string | null;
  resource: string;
  action: string;
  isActive: boolean;
};

export type RoleInput = {
  name: string;
  desc: string;
  isActive?: boolean;
};

export type PermissionInput = {
  resource: string;
  action: string;
  desc: string;
  isActive?: boolean;
};

type PaginatedResponse<T> = {
  status: boolean;
  data: {
    totalItems: number;
    totalPages: number;
    data: T[];
  };
};

type ItemResponse<T> = {
  status: boolean;
  data: T;
};

type RolePermissionsResponse = {
  status: boolean;
  data: string[];
};

export async function getRolesPage(params: {
  page: number;
  limit: number;
  keyword?: string;
}) {
  const response = await axiosClient.get<PaginatedResponse<AccessRole>>(
    "/roles",
    { params },
  );
  return response.data.data;
}

export async function getRole(id: string) {
  const response = await axiosClient.get<ItemResponse<AccessRole>>(
    `/roles/${id}`,
  );
  return response.data.data;
}

export async function createRole(data: RoleInput) {
  const response = await axiosClient.post<ItemResponse<AccessRole>>(
    "/roles",
    data,
  );
  return response.data.data;
}

export async function updateRole(id: string, data: RoleInput) {
  const response = await axiosClient.put<ItemResponse<AccessRole>>(
    `/roles/${id}`,
    data,
  );
  return response.data.data;
}

export async function deleteRole(id: string) {
  await axiosClient.delete(`/roles/${id}`);
}

export async function getPermissionsPage(params: {
  page: number;
  limit: number;
  keyword?: string;
  status?: string;
}) {
  const response = await axiosClient.get<PaginatedResponse<AccessPermission>>(
    "/permissions",
    { params },
  );
  return response.data.data;
}

export async function createPermission(data: PermissionInput) {
  const response = await axiosClient.post<ItemResponse<AccessPermission>>(
    "/permissions",
    data,
  );
  return response.data.data;
}

export async function updatePermission(
  id: string,
  data: PermissionInput,
) {
  const response = await axiosClient.put<ItemResponse<AccessPermission>>(
    `/permissions/${id}`,
    data,
  );
  return response.data.data;
}

export async function deletePermission(id: string) {
  await axiosClient.delete(`/permissions/${id}`);
}

export async function getAllPermissions() {
  const firstPage = await getPermissionsPage({ page: 1, limit: 100 });
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, firstPage.totalPages - 1) }, (_, index) =>
      getPermissionsPage({ page: index + 2, limit: 100 }),
    ),
  );

  return [
    ...firstPage.data,
    ...remainingPages.flatMap((result) => result.data),
  ];
}

export async function getRolePermissionNames(roleId: string) {
  const response = await axiosClient.get<RolePermissionsResponse>(
    `/permissions/role/${roleId}`,
  );
  return response.data.data;
}

export async function assignRolePermissions(
  roleId: string,
  permissionIds: string[],
) {
  await axiosClient.post(`/roles/${roleId}/assign-permissions`, {
    permissionIds,
  });
}

export async function removeRolePermissions(
  roleId: string,
  permissionIds: string[],
) {
  await axiosClient.delete(`/roles/${roleId}/remove-permissions`, {
    data: { permissionIds },
  });
}
