"use client";

const AUTH_KEY = "gencontent-auth";
const DEMO_AUTH_KEY = "gencontent-demo-auth";

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
    const parsedSession = JSON.parse(rawSession);
    return parsedSession?.token ? parsedSession : null;
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

export function setDemoLogin() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DEMO_AUTH_KEY, "true");
  }
}

export function hasDemoLogin() {
  return typeof window !== "undefined" && window.localStorage.getItem(DEMO_AUTH_KEY) === "true";
}

export function clearDemoLogin() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(DEMO_AUTH_KEY);
  }
}

export function clearAuthState() {
  clearAuthSession();
  clearDemoLogin();
}

export function getDisplayUser(fallbackName = "Sadman Anik") {
  return getAuthSession()?.user || { name: fallbackName };
}
