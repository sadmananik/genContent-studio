"use client";

const AUTH_KEY = "gencontent-auth";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export function saveAuthSession(session) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  }
}

export function getAuthSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = window.localStorage.getItem(AUTH_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const session = JSON.parse(rawSession);
    return session?.token ? session : null;
  } catch (error) {
    clearAuthSession();
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_KEY);
  }
}

export async function requestAuth(path, payload) {
  const response = await fetch(`${API_BASE_URL}/api/auth/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Authentication failed");
  }

  saveAuthSession(data);
  return data;
}
