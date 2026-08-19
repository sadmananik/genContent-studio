"use client";

const AUTH_KEY = "gencontent-auth";

export function saveAuthSession(session, rememberMe = true) {
  if (typeof window !== "undefined") {
    clearAuthSession();
    const storage = rememberMe ? window.localStorage : window.sessionStorage;
    storage.setItem(AUTH_KEY, JSON.stringify({ ...session, rememberMe }));
  }
}

export function getAuthSession() {
  if (typeof window === "undefined") {
    return null;
  }

  for (const storage of [window.sessionStorage, window.localStorage]) {
    const rawSession = storage.getItem(AUTH_KEY);

    if (rawSession) {
      try {
        const parsedSession = JSON.parse(rawSession);
        return parsedSession?.token ? parsedSession : null;
      } catch (error) {
        storage.removeItem(AUTH_KEY);
      }
    }
  }

  return null;
}

export function clearAuthSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_KEY);
    window.sessionStorage.removeItem(AUTH_KEY);
  }
}

export function clearAuthState() {
  clearAuthSession();
}

export function getDisplayUser(fallbackName = "Sadman Anik") {
  return getAuthSession()?.user || { name: fallbackName };
}
