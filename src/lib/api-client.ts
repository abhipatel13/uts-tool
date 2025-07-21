// Unified API client for consistent HTTP requests across the application

import { logout } from "@/utils/auth";

// Get auth token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

// API client configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";



// API error class
export class ApiError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

// Request options interface
interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  requireAuth?: boolean;
}

/**
 * Unified API client function
 * Handles authentication, error handling, and response parsing consistently
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, requireAuth = true, headers = {}, ...fetchOptions } = options;

  // Build URL
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  // Prepare headers
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  // Add auth token if required
  if (requireAuth) {
    const token = getAuthToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  // Prepare request options
  const requestOptions: RequestInit = {
    ...fetchOptions,
    headers: requestHeaders,
  };

  // Handle body serialization
  if (body !== undefined) {
    if (body instanceof FormData) {
      // Remove Content-Type for FormData to let browser set boundary
      delete requestHeaders["Content-Type"];
      requestOptions.body = body;
    } else {
      requestOptions.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(url, requestOptions);

    // Handle different response types
    let data;
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle HTTP errors
    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401 || data?.code === "INVALID_TOKEN") {
        await logout();
        throw new ApiError(
          "Authentication expired. Please login again.",
          401,
          "AUTH_EXPIRED"
        );
      }

      // Handle other errors
      const errorMessage =
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`;
      throw new ApiError(errorMessage, response.status, data?.code);
    }

    return data;
  } catch (error) {
    // Re-throw ApiError instances
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ApiError(
        "Network error. Please check your connection.",
        0,
        "NETWORK_ERROR"
      );
    }

    // Handle other errors
    throw new ApiError(
      error instanceof Error ? error.message : "An unexpected error occurred",
      0,
      "UNKNOWN_ERROR"
    );
  }
}

// Convenience methods for common HTTP verbs
export const api = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, "method">) =>
    apiClient<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">
  ) => apiClient<T>(endpoint, { ...options, method: "POST", body }),

  put: <T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">
  ) => apiClient<T>(endpoint, { ...options, method: "PUT", body }),

  patch: <T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">
  ) => apiClient<T>(endpoint, { ...options, method: "PATCH", body }),

  delete: <T>(endpoint: string, options?: Omit<RequestOptions, "method">) =>
    apiClient<T>(endpoint, { ...options, method: "DELETE" }),
};

export default api;
