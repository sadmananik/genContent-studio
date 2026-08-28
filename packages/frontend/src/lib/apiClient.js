"use client";

import { clearAuthSession, getAuthSession } from "./auth";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

export async function apiRequest(path, options = {}) {
  const { timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS, ...requestOptions } = options;
  const session = getAuthSession();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const headers = {
    "Content-Type": "application/json",
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      headers,
      signal: controller.signal
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthSession();
      }

      const requestError = new Error(data?.message || "API request failed");
      requestError.status = response.status;
      throw requestError;
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error(
        "API request timed out. Please check that the backend is running."
      );
      timeoutError.code = "TIMEOUT";
      throw timeoutError;
    }

    if (error instanceof TypeError || error?.message === "Failed to fetch") {
      const networkError = new Error(
        "Unable to reach the API. Check your connection and that the backend is running."
      );
      networkError.code = "NETWORK";
      throw networkError;
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function getErrorMessage(error, fallback = "Something went wrong") {
  return error instanceof Error ? error.message : fallback;
}
