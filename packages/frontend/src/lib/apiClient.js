"use client";

import { clearAuthSession, getAuthSession } from "./auth";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export async function apiRequest(path, options = {}) {
  const session = getAuthSession();
  const headers = {
    "Content-Type": "application/json",
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession();
    }

    throw new Error(data?.message || "API request failed");
  }

  return data;
}

export function getErrorMessage(error, fallback = "Something went wrong") {
  return error instanceof Error ? error.message : fallback;
}
