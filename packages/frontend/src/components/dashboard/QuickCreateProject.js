"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, FileText, ArrowRight, Lightbulb } from "lucide-react";
import { useAppStore } from "../../store";
import { ROUTES } from "../../constants/navigation";
import WorkspaceLoading from "../common/WorkspaceLoading";
import { textToHtml } from "../text-workspace/textToHtml";

export default function QuickCreateProject() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState("text");
  const [contentType, setContentType] = useState("Blog Post");
  const [tone, setTone] = useState("Professional");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const projectRef = useRef(null);
  const submitting = useRef(false);
  const createProject = useAppStore((s) => s.createProject);
  const generateText = useAppStore((s) => s.generateTextFromPrompt);
  const generateImage = useAppStore((s) => s.generateImageFromPrompt);
  const saveText = useAppStore((s) => s.sendTextGenerationRequest);
  const saveResponse = useAppStore((s) => s.saveAiResponse);
  const openWorkspace = () =>
    router.push(
      `${ROUTES.EDITOR}?projectId=${encodeURIComponent(projectRef.current._id || projectRef.current.id)}&type=${type}`
    );

  async function handleGenerate(event) {
    event.preventDefault();
    if (submitting.current || !title.trim() || !prompt.trim()) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      if (!projectRef.current)
        projectRef.current = await createProject({
          title: title.trim(),
          description: description.trim(),
          type,
          category: type === "text" ? contentType : "Other"
        });
      const project = projectRef.current._id || projectRef.current.id;
      if (!project) throw new Error("The project could not be opened. Please try again.");
      if (type === "text") {
        const result = await generateText({
          project,
          prompt: `${prompt.trim()}\n\nContent type: ${contentType}. Tone: ${tone}.`
        });
        if (!result.text?.trim()) throw new Error("AI returned no content. Please try again.");
        await saveResponse({
          project,
          prompt: prompt.trim(),
          response: result.text,
          contentType: "text"
        });
        await saveText({ project, content: textToHtml(result.text) });
      } else {
        const result = await generateImage({
          project,
          action: "generate",
          prompt: `${prompt.trim()}\n\nTone: ${tone}.`
        });
        if (!result.imageUrl) throw new Error("AI returned no image. Please try again.");
        await saveResponse({
          project,
          prompt: prompt.trim(),
          response: result.revisedPrompt || `Generated image for "${prompt.trim()}".`,
          contentType: "image",
          imageUrl: result.imageUrl
        });
      }
      openWorkspace();
    } catch (failure) {
      setError(failure.message || "Generation failed. Please try again.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";
  return (
    <>
      <form
        onSubmit={handleGenerate}
        aria-label="Create a project with AI"
        className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50/80 via-white to-indigo-50/70 p-4 shadow-sm md:p-5"
      >
        <fieldset disabled={busy} className="min-w-0 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-violet-600" aria-hidden="true" />
            <h2 className="text-lg font-bold text-slate-950">What will you create today?</h2>
            <button
              type="button"
              className="ml-auto inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-indigo-600"
              onClick={() =>
                setPrompt(
                  type === "image"
                    ? "Create a clean product photograph of a reusable coffee cup, with soft morning light and space for a headline."
                    : "Write a blog post about five practical ways small businesses can create better content with AI."
                )
              }
            >
              <Lightbulb size={16} aria-hidden="true" />
              Try an example
            </button>
          </div>
          <fieldset
            disabled={Boolean(projectRef.current)}
            className="flex gap-2"
            aria-label="Project type"
          >
            {["text", "image"].map((value) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${type === value ? "border-violet-600 bg-violet-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-violet-100"}`}
              >
                <input
                  type="radio"
                  name="quick-project-type"
                  checked={type === value}
                  onChange={() => setType(value)}
                  className="accent-violet-600"
                />
                {value === "text" ? "Text" : "Image"}
              </label>
            ))}
          </fieldset>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1.5 text-sm font-semibold text-slate-700">
              Title
              <input
                required
                disabled={Boolean(projectRef.current)}
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your project a title"
              />
            </label>
            <label className="space-y-1.5 text-sm font-semibold text-slate-700">
              Description (optional)
              <input
                disabled={Boolean(projectRef.current)}
                className={inputClass}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this project for?"
              />
            </label>
          </div>
          <label className="block space-y-1.5 text-sm font-semibold text-slate-700">
            Prompt
            <textarea
              required
              rows={3}
              className={`${inputClass} resize-y`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                type === "image"
                  ? "Describe the image you want to create…"
                  : "Describe the content you want to create…"
              }
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {type === "text" && (
                <label className="quick-create-chip">
                  <FileText size={15} aria-hidden="true" />
                  <select
                    aria-label="Content type"
                    disabled={Boolean(projectRef.current)}
                    value={contentType}
                    onChange={(event) => setContentType(event.target.value)}
                  >
                    {["Blog Post", "Social Post", "Article", "Product Description"].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="quick-create-chip">
                <Sparkles size={15} aria-hidden="true" />
                <span className="text-xs font-bold">Tone:</span>
                <select
                  aria-label="Tone"
                  value={tone}
                  onChange={(event) => setTone(event.target.value)}
                >
                  {["Professional", "Friendly", "Persuasive", "Casual"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="submit"
              disabled={!title.trim() || !prompt.trim()}
              className="quick-generate-button"
            >
              <Sparkles size={16} aria-hidden="true" />
              Generate <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </fieldset>
        {error && (
          <div role="alert" className="mt-3 text-sm text-red-700">
            <p>{error}</p>
            {projectRef.current && (
              <p className="mt-1">
                Your project is saved. Try Generate again, or{" "}
                <button type="button" className="underline" onClick={openWorkspace}>
                  open your workspace
                </button>
                .
              </p>
            )}
          </div>
        )}
      </form>
      {busy && (
        <WorkspaceLoading
          type={type}
          isGenerating
          title="Preparing and generating your workspace"
          message="We’re creating your project and generating your content. This may take a moment."
        />
      )}
    </>
  );
}
