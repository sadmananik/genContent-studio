"use client";

import { X } from "lucide-react";
import Button from "./Button";

export default function AppModal({
  action,
  children,
  description,
  isActionDisabled = false,
  isWorking = false,
  onAction,
  onClose,
  title,
  workingLabel = "Working..."
}) {
  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-slate-950/40 p-5"
      role="presentation"
    >
      <section
        aria-modal="true"
        className="grid max-h-[88vh] w-full max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_45px_rgba(31,41,55,0.08)]"
        role="dialog"
      >
        <header className="flex items-start gap-4 border-b border-slate-200 p-5">
          <div className="min-w-0 flex-1">
            <h3 className="m-0 text-xl font-bold text-slate-950">{title}</h3>
            {description && <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>}
          </div>
          <button
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={17} />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto p-5">{children}</div>
        {action && (
          <footer className="flex justify-end border-t border-slate-200 p-4">
            <Button disabled={isActionDisabled || isWorking} onClick={onAction} type="button">
              {isWorking ? workingLabel : action}
            </Button>
          </footer>
        )}
      </section>
    </div>
  );
}
