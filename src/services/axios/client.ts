import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import toast from "react-hot-toast";
import { clearSession, readSession } from "@/lib/session";
import {
  refreshAccessToken,
  tokenExpiresAt,
} from "@/services/axios/auth.service";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const REQUEST_TIMEOUT_MS = 15000;

type ApiError = {
  message?: string;
  error?: string;
};

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
};

export const axiosClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const PUBLIC_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-email",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/refresh-token",
];

function isPublicEndpoint(url?: string) {
  if (!url) return false;

  return PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

axiosClient.interceptors.request.use(async (config) => {
  const isPublic = isPublicEndpoint(config.url);
  const session = readSession();
  const accessToken = session?.accessToken;

  if (accessToken && !isPublic) {
    const tokenIsExpired = tokenExpiresAt(accessToken) * 1000 <= Date.now();

    if (tokenIsExpired) {
      const refreshedAccessToken = await getRefreshAccessToken();

      config.headers.Authorization = `Bearer ${refreshedAccessToken}`;
    } else {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  return config;
});

let refreshRequest: Promise<string> | null = null;

async function getRefreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = refreshAccessToken().finally(() => {
      refreshRequest = null;
    });
  }

  return refreshRequest;
}

axiosClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError<ApiError>) => {
    const requestConfig = error.config as RetryableRequestConfig | undefined;

    const isUnauthorized = error.response?.status === 401;

    const isPublic = isPublicEndpoint(requestConfig?.url);

    if (
      requestConfig &&
      isUnauthorized &&
      !requestConfig._retry &&
      !requestConfig.skipAuthRefresh &&
      !isPublic
    ) {
      requestConfig._retry = true;

      try {
        const accessToken = await getRefreshAccessToken();

        requestConfig.headers.Authorization = `Bearer ${accessToken}`;

        return axiosClient(requestConfig);
      } catch (refreshError) {
        clearSession();

        return Promise.reject(refreshError);
      }
    }

    const message =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      "Something went wrong. Please try again.";

    toast.error(message);

    return Promise.reject(error);
  },
);
