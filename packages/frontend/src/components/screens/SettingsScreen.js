"use client";

import { Monitor, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../common/Button";
import ConfirmDialog from "../common/ConfirmDialog";
import { IconBadge } from "../common/Cards";
import ToastNotification, { TOAST_TYPES } from "../common/ToastNotification";
import { UserAvatar } from "../common/UserAvatar";
import { ROUTES } from "../../constants/navigation";
import { SETTINGS_TEXT } from "../../constants/notifications";
import {
  applyThemePreference,
  getStoredThemePreference,
  saveThemePreference,
  watchSystemThemePreference
} from "../../lib/themePreference";
import { useAppStore } from "../../store";

const THEME_OPTIONS = [
  { label: SETTINGS_TEXT.THEME_OPTIONS.SYSTEM, value: "system" },
  { label: SETTINGS_TEXT.THEME_OPTIONS.LIGHT, value: "light" },
  { label: SETTINGS_TEXT.THEME_OPTIONS.DARK, value: "dark" }
];

export default function SettingsScreen() {
  const router = useRouter();
  const auth = useAppStore((state) => state.auth);
  const userState = useAppStore((state) => state.userState);
  const getUserProfile = useAppStore((state) => state.getUserProfile);
  const requestPasswordChange = useAppStore((state) => state.requestPasswordChange);
  const clearAuthError = useAppStore((state) => state.clearAuthError);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [theme, setTheme] = useState("system");
  const user = userState.profile || auth.user;

  useEffect(() => {
    if (auth.token) {
      getUserProfile().catch(() => {});
    }
  }, [auth.token, getUserProfile]);

  useEffect(() => {
    const storedTheme = getStoredThemePreference();

    setTheme(storedTheme);
    applyThemePreference(storedTheme);
  }, []);

  useEffect(() => watchSystemThemePreference(theme), [theme]);

  function showNotification(title, message, type = TOAST_TYPES.INFO, duration = 5000) {
    setNotification({ duration, id: Date.now(), message, title, type });
  }

  function handleThemeChange(event) {
    const nextTheme = event.target.value;

    setTheme(nextTheme);
    saveThemePreference(nextTheme);
    showNotification(
      SETTINGS_TEXT.THEME_UPDATED_TITLE,
      SETTINGS_TEXT.THEME_UPDATED_MESSAGE,
      TOAST_TYPES.SUCCESS,
      3000
    );
  }

  async function handleRequestPasswordChange() {
    try {
      clearAuthError();
      await requestPasswordChange();

      setIsPasswordDialogOpen(false);
      showNotification(
        SETTINGS_TEXT.CHANGE_PASSWORD_SUCCESS_TITLE,
        SETTINGS_TEXT.CHANGE_PASSWORD_SUCCESS_DESCRIPTION(user?.email || ""),
        TOAST_TYPES.SUCCESS
      );
    } catch (error) {
      showNotification(
        SETTINGS_TEXT.CHANGE_PASSWORD_FAILED_TITLE,
        error.message || SETTINGS_TEXT.CHANGE_PASSWORD_FAILED_MESSAGE,
        TOAST_TYPES.ERROR
      );
    }
  }

  return (
    <main className="min-w-0 p-5 md:p-7">
      <header className="-m-5 mb-6 border-b border-slate-200 p-5 md:-m-7 md:mb-7 md:p-7">
        <h1 className="m-0 text-2xl font-bold text-slate-950">{SETTINGS_TEXT.PAGE_TITLE}</h1>
        <p className="mt-1.5 text-sm text-slate-500">{SETTINGS_TEXT.PAGE_DESCRIPTION}</p>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_22px_rgba(16,24,40,0.04)]">
          <div className="mb-5 flex items-center gap-3">
            <IconBadge>
              <UserRound aria-hidden="true" size={19} />
            </IconBadge>
            <div>
              <h2 className="text-lg font-bold text-slate-950">{SETTINGS_TEXT.ACCOUNT_TITLE}</h2>
              <p className="mt-1 text-sm text-slate-500">{SETTINGS_TEXT.ACCOUNT_DESCRIPTION}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar className="h-12 w-12 text-base" user={user} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950">{user?.name || "User"}</p>
                <p className="truncate text-sm text-slate-500">{user?.email}</p>
              </div>
            </div>
            <Button onClick={() => router.push(ROUTES.PROFILE)} type="button" variant="secondary">
              {SETTINGS_TEXT.EDIT_PROFILE_BUTTON}
            </Button>
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_22px_rgba(16,24,40,0.04)]">
          <div className="mb-5 flex items-center gap-3">
            <IconBadge tone="mint">
              <Monitor aria-hidden="true" size={19} />
            </IconBadge>
            <div>
              <h2 className="text-lg font-bold text-slate-950">{SETTINGS_TEXT.APPEARANCE_TITLE}</h2>
              <p className="mt-1 text-sm text-slate-500">{SETTINGS_TEXT.APPEARANCE_DESCRIPTION}</p>
            </div>
          </div>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            {SETTINGS_TEXT.THEME_LABEL}
            <select
              className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              onChange={handleThemeChange}
              value={theme}
            >
              {THEME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_22px_rgba(16,24,40,0.04)] xl:col-span-2">
          <div className="mb-5 flex items-center gap-3">
            <IconBadge>
              <ShieldCheck aria-hidden="true" size={19} />
            </IconBadge>
            <div>
              <h2 className="text-lg font-bold text-slate-950">{SETTINGS_TEXT.SECURITY_TITLE}</h2>
              <p className="mt-1 text-sm text-slate-500">{SETTINGS_TEXT.SECURITY_DESCRIPTION}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-sm font-bold text-slate-950">{SETTINGS_TEXT.SECURITY_LABEL}</p>
              <p className="mt-1 text-sm text-slate-500">{SETTINGS_TEXT.SECURITY_DESCRIPTION}</p>
            </div>
            <Button onClick={() => setIsPasswordDialogOpen(true)} type="button">
              {SETTINGS_TEXT.CHANGE_PASSWORD_BUTTON}
            </Button>
          </div>
        </article>
      </section>

      {isPasswordDialogOpen && (
        <ConfirmDialog
          cancelLabel="Cancel"
          confirmLabel={
            auth.loading ? SETTINGS_TEXT.SENDING_EMAIL_BUTTON : SETTINGS_TEXT.SEND_EMAIL_BUTTON
          }
          description={SETTINGS_TEXT.CHANGE_PASSWORD_CONFIRM_DESCRIPTION(user?.email || "")}
          isConfirming={auth.loading}
          onCancel={() => setIsPasswordDialogOpen(false)}
          onConfirm={handleRequestPasswordChange}
          title={SETTINGS_TEXT.CHANGE_PASSWORD_CONFIRM_TITLE}
        />
      )}

      <ToastNotification
        duration={notification?.duration}
        key={notification?.id}
        message={notification?.message}
        onClose={() => setNotification(null)}
        title={notification?.title}
        type={notification?.type}
      />
    </main>
  );
}
