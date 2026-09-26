import { axiosClient } from "./client";

export type LocationOption = {
  code?: string;
  name: string;
};

type LocationsResponse = {
  status: boolean;
  data: LocationOption[];
};

export async function getCountries() {
  const response = await axiosClient.get<LocationsResponse>("/locations/countries");
  return response.data.data;
}

export async function getStates(countryCode: string) {
  const response = await axiosClient.get<LocationsResponse>(
    `/locations/countries/${countryCode}/states`,
  );
  return response.data.data;
}

export async function getCities(countryCode: string, stateCode: string) {
  const response = await axiosClient.get<LocationsResponse>(
    `/locations/countries/${countryCode}/states/${stateCode}/cities`,
  );
  return response.data.data;
}
