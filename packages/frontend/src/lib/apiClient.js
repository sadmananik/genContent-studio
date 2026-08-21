"use client";

import { clearAuthSession, getAuthSession } from "./auth";
import { DEV_AUTH_BYPASS_ENABLED } from "./devAuth";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

export async function apiRequest(path, options = {}) {
  const session = getAuthSession();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT_MS);
  const headers = {
    "Content-Type": "application/json",
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401) {
        if (DEV_AUTH_BYPASS_ENABLED) {
          throw new Error(
            "Dev login bypass cannot call protected APIs. Whitelist your IP in MongoDB Atlas, restart the backend, then register/login with a real account."
          );
        }

        clearAuthSession();
      }

      throw new Error(data?.message || "API request failed");
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("API request timed out. Please check that the backend is running.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function getErrorMessage(error, fallback = "Something went wrong") {
  return error instanceof Error ? error.message : fallback;
}
