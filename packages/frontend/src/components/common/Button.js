import { cn } from "../../lib/styles";

const variants = {
  primary:
    "app-button-primary border-transparent bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-[0_10px_24px_rgba(101,69,246,0.24)] hover:from-violet-600 hover:to-indigo-700",
  secondary:
    "app-button-secondary border-slate-200 bg-white text-slate-900 shadow-none hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700",
  ghost:
    "app-button-ghost border-transparent bg-transparent text-slate-900 shadow-none hover:bg-violet-50 hover:text-violet-700",
  icon: "app-button-icon h-9 w-9 border-slate-200 bg-white p-0 text-slate-900 shadow-none hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
};

export default function Button({ children, variant = "primary", className = "", ...props }) {
  return (
    <button
      className={cn(
        "app-button inline-flex min-h-9 items-center justify-center gap-2 rounded-md border px-4 text-sm font-bold transition-colors disabled:pointer-events-none disabled:opacity-60",
        variants[variant] || variants.primary,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
