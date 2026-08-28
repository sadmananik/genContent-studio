"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import GenerateButton from "../common/GenerateButton";

function normalizeAction(action) {
  if (typeof action === "string") {
    return { id: action, label: action };
  }

  return {
    id: action.id,
    label: action.label || action.id,
    styles: Array.isArray(action.styles) ? action.styles : undefined
  };
}

export default function AIPromptPanel({
  actions,
  disabled = false,
  error,
  isGenerating,
  onGenerate,
  onPromptFocus,
  onPromptChange,
  onQuickAction,
  placeholder = "Write a blog introduction about AI tools for small businesses...",
  prompt,
  title = "Ask AI to create or improve content"
}) {
  const [openStyleActionId, setOpenStyleActionId] = useState(null);
  const styleMenuRef = useRef(null);
  const styleMenuId = useId();
  const normalizedActions = (actions || []).map(normalizeAction);

  useEffect(() => {
    if (!openStyleActionId) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!styleMenuRef.current?.contains(event.target)) {
        setOpenStyleActionId(null);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpenStyleActionId(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openStyleActionId]);

  function handleActionClick(action) {
    if (action.styles?.length) {
      setOpenStyleActionId((current) => (current === action.id ? null : action.id));
      return;
    }

    setOpenStyleActionId(null);
    onQuickAction?.(action.id);
  }

  function handleStyleSelect(action, style) {
    setOpenStyleActionId(null);
    onQuickAction?.(action.id, { style });
  }

  return (
    <section className="overflow-visible rounded-lg border border-slate-200 bg-white p-4 shadow-[0_10px_22px_rgba(16,24,40,0.04)]">
      <div className="mb-3 flex min-w-0 items-center gap-2">
        <Sparkles aria-hidden="true" className="shrink-0 text-violet-600" size={18} />
        <h2 className="min-w-0 text-base font-bold leading-snug text-slate-950">{title}</h2>
      </div>

      <textarea
        className="min-h-32 w-full resize-y rounded-lg border border-slate-200 p-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
        disabled={isGenerating || disabled}
        maxLength={1200}
        onChange={(event) => onPromptChange(event.target.value)}
        onFocus={onPromptFocus}
        placeholder={placeholder}
        value={prompt}
      />

      {error ? (
        <p
          className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-3 flex min-w-0 flex-col gap-3">
        <div className="flex min-w-0 flex-wrap gap-2">
          {normalizedActions.map((action) => (
            <div
              className="relative"
              key={action.id}
              ref={openStyleActionId === action.id ? styleMenuRef : null}
            >
              <button
                aria-controls={action.styles?.length ? styleMenuId : undefined}
                aria-expanded={action.styles?.length ? openStyleActionId === action.id : undefined}
                aria-haspopup={action.styles?.length ? "menu" : undefined}
                className="min-h-8 whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 hover:shadow-[0_6px_14px_rgba(101,69,246,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-slate-200 disabled:hover:bg-slate-50 disabled:hover:text-slate-700 disabled:hover:shadow-none"
                disabled={isGenerating || disabled}
                onClick={() => handleActionClick(action)}
                type="button"
              >
                {action.label}
              </button>

              {action.styles?.length && openStyleActionId === action.id ? (
                <div
                  className="absolute left-0 z-30 mt-2 w-48 max-w-[min(12rem,calc(100vw-2rem))] rounded-md border border-slate-200 bg-white p-2 shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
                  id={styleMenuId}
                  role="menu"
                >
                  <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Select Style
                  </p>
                  <div className="grid max-h-56 gap-1 overflow-y-auto">
                    {action.styles.map((style) => (
                      <button
                        className="rounded px-2 py-1.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
                        key={style}
                        onClick={() => handleStyleSelect(action, style)}
                        role="menuitem"
                        type="button"
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <GenerateButton
            disabled={disabled || !String(prompt || "").trim()}
            isGenerating={isGenerating}
            onClick={() => onGenerate()}
            type="button"
          />
        </div>
      </div>
    </section>
  );
}
