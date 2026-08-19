"use client";

import Button from "./Button";

export default function ConfirmDialog({
  cancelLabel = "No",
  confirmLabel = "Yes",
  description,
  isConfirming = false,
  onCancel,
  onConfirm,
  title
}) {
  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-slate-950/40 p-5"
      role="presentation"
    >
      <section
        aria-modal="true"
        className="grid w-full max-w-md gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(31,41,55,0.08)]"
        role="dialog"
      >
        <div>
          <h3 className="m-0 text-xl font-bold text-slate-950">{title}</h3>
          {description && <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button disabled={isConfirming} onClick={onCancel} type="button" variant="secondary">
            {cancelLabel}
          </Button>
          <Button disabled={isConfirming} onClick={onConfirm} type="button">
            {isConfirming ? "Working..." : confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
