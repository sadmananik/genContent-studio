import { cn } from "../../lib/styles";

const toneClasses = {
  neutral: "text-slate-500",
  success: "text-emerald-700",
  warning: "text-amber-700",
  danger: "text-red-700"
};

const variantClasses = {
  bar: "border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide",
  compact: "text-xs font-semibold uppercase tracking-wide",
  inline: "mt-1 block text-xs font-medium"
};

export default function StatusText({
  children,
  className = "",
  tone = "neutral",
  variant = "inline"
}) {
  if (!children) {
    return null;
  }

  return (
    <span className={cn(variantClasses[variant], toneClasses[tone], className)}>{children}</span>
  );
}
