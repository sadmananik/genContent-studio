"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LoaderCircle } from "lucide-react";

export default function WorkspaceLoading({
  type,
  error,
  isSaving = false,
  isGenerating = false,
  title,
  message
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-900/15 p-6 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        {!error && (
          <LoaderCircle
            aria-hidden="true"
            className="mx-auto mb-4 animate-spin text-violet-600"
            size={28}
          />
        )}
        <h2 className="text-lg font-bold text-slate-950">
          {error
            ? "Workspace could not load"
            : title ||
              (isGenerating
                ? `Generating ${type === "image" ? "your image" : "your content"}`
                : `${isSaving ? "Saving" : "Loading"} ${type} workspace`)}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {error ||
            message ||
            (isGenerating
              ? type === "image"
                ? "AI is creating your image. This may take a moment."
                : "AI is preparing your response. This may take a moment."
              : isSaving
                ? "Please wait while we save your changes."
                : "Please wait while we restore your content and AI history.")}
        </p>
        {error && (
          <button
            className="mt-4 rounded-md bg-violet-600 px-4 py-2 font-semibold text-white"
            onClick={() => window.location.reload()}
            type="button"
          >
            Try again
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
