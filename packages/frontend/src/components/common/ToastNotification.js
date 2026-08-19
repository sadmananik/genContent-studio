"use client";

import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "../../lib/styles";

export const TOAST_TYPES = {
  ERROR: "error",
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning"
};

const toastStyles = {
  [TOAST_TYPES.ERROR]: {
    wrapper: "border-red-200 bg-red-50 text-red-900",
    icon: "text-red-600",
    Icon: XCircle
  },
  [TOAST_TYPES.INFO]: {
    wrapper: "border-sky-200 bg-sky-50 text-sky-900",
    icon: "text-sky-600",
    Icon: Info
  },
  [TOAST_TYPES.SUCCESS]: {
    wrapper: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon: "text-emerald-600",
    Icon: CheckCircle2
  },
  [TOAST_TYPES.WARNING]: {
    wrapper: "border-amber-200 bg-amber-50 text-amber-900",
    icon: "text-amber-600",
    Icon: AlertTriangle
  }
};

export default function ToastNotification({
  duration = 5000,
  message,
  onClose,
  title,
  type = TOAST_TYPES.INFO
}) {
  const style = toastStyles[type] || toastStyles[TOAST_TYPES.INFO];
  const Icon = style.Icon;

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      onClose?.();
    }, duration);

    return () => window.clearTimeout(timeout);
  }, [duration, message, onClose]);

  if (!message) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed right-4 top-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm items-start gap-3 rounded-lg border p-4 shadow-[0_18px_42px_rgba(15,23,42,0.16)]",
        style.wrapper
      )}
      role={type === TOAST_TYPES.ERROR || type === TOAST_TYPES.WARNING ? "alert" : "status"}
    >
      <Icon aria-hidden="true" className={cn("mt-0.5 shrink-0", style.icon)} size={20} />
      <div className="min-w-0 flex-1">
        {title && <p className="text-sm font-extrabold">{title}</p>}
        <p className={cn("text-sm", title ? "mt-1" : "")}>{message}</p>
      </div>
      <button
        aria-label="Close notification"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md hover:bg-white/60"
        onClick={onClose}
        type="button"
      >
        <X aria-hidden="true" size={16} />
      </button>
    </div>
  );
}
