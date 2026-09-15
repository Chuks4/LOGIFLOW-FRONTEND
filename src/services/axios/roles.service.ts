import { axiosClient } from "./client";

export type Role = {
  name: string;
  id: string;
};

type RoleApiResponse = {
  status: boolean;
  data: {
    data: Role[];
  };
};

export const getRoles = async () => {
  const { data } = await axiosClient.get<RoleApiResponse>("/roles", {
    params: {
      status: true,
    },
  });
  return data;
};
