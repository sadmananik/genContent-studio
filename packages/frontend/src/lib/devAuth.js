"use client";

import { saveAuthSession } from "./auth";

export const DEV_AUTH_BYPASS_ENABLED =
  process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";

export const DEV_AUTH_SESSION = {
  token: "dev-bypass-token",
  rememberMe: true,
  user: {
    _id: "dev-user",
    id: "dev-user",
    name: "Dev Preview",
    email: "dev@gencontent.local",
    role: "user"
  }
};

export function ensureDevAuthSession() {
  if (!DEV_AUTH_BYPASS_ENABLED || typeof window === "undefined") {
    return null;
  }

  saveAuthSession(DEV_AUTH_SESSION, true);
  return DEV_AUTH_SESSION;
}
