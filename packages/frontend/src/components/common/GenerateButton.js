import { Loader2 } from "lucide-react";
import Button from "./Button";

export default function GenerateButton({
  children = "Generate",
  disabled = false,
  isGenerating = false,
  loadingLabel = "Generating...",
  ...props
}) {
  return (
    <Button
      className={`min-h-11 min-w-[8.75rem] px-5 ${isGenerating ? "ai-generate-button" : ""}`}
      disabled={disabled || isGenerating}
      {...props}
    >
      {isGenerating && <Loader2 aria-hidden="true" className="ai-generate-icon" size={18} />}
      {isGenerating ? loadingLabel : children}
    </Button>
  );
}
