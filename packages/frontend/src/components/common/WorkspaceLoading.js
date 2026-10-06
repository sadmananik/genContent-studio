import { LoaderCircle } from "lucide-react";

export default function WorkspaceLoading({ type, error, isSaving = false }) {
  return (
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
            : `${isSaving ? "Saving" : "Loading"} ${type} workspace`}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {error ||
            (isSaving
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
    </div>
  );
}
