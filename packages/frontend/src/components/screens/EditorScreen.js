"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Button from "../common/Button";
import EditorChrome from "../common/EditorChrome";
import { PROJECT_TYPES } from "../../constants/content";
import { useAppStore } from "../../store";

export default function EditorScreen() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const projectType = searchParams.get("type");
  const currentProject = useAppStore((state) => state.projectState.currentProject);
  const projectError = useAppStore((state) => state.projectState.error);
  const projectLoading = useAppStore((state) => state.projectState.loading);
  const fetchProjectById = useAppStore((state) => state.fetchProjectById);

  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId).catch(() => {});
    }
  }, [fetchProjectById, projectId]);

  const displayProject =
    currentProject?._id === projectId || currentProject?.id === projectId ? currentProject : null;
  const title = displayProject?.title || "Untitled Project";
  const typeLabel =
    displayProject?.type === "image" || projectType === "image"
      ? PROJECT_TYPES.IMAGE
      : PROJECT_TYPES.TEXT;

  return (
    <section className="screen">
      <EditorChrome title={title} aside={<AssistantPanel />}>
        <article className="document-card">
          {projectLoading && projectId ? (
            <>
              <h2>Loading project...</h2>
              <p>Your workspace is opening.</p>
            </>
          ) : projectError && projectId ? (
            <>
              <h2>Project could not be opened</h2>
              <p>{projectError}</p>
            </>
          ) : (
            <>
              <h2>{title}</h2>
              <p>
                {displayProject?.category || "Content"} • {typeLabel} Project
              </p>
              <p>
                {displayProject?.description ||
                  "Start typing or use AI Assistant to generate content for this project."}
              </p>
            </>
          )}
        </article>
        <footer className="editor-status">
          <span>{typeLabel} Workspace</span>
          <span>{displayProject?.category || "No category"}</span>
          <span>100%</span>
          <input type="range" defaultValue="55" />
          <span>↔</span>
        </footer>
      </EditorChrome>
    </section>
  );
}

function AssistantPanel() {
  return (
    <aside className="assistant-panel">
      <h4>AI Assistant</h4>
      <textarea defaultValue="Improve this content" />
      <Button className="full-width">✦ Generate</Button>
      <h4>Suggestions</h4>
      {[
        "Improve clarity",
        "Make it more engaging",
        "Shorten this paragraph",
        "Expand this paragraph"
      ].map((item) => (
        <button className="suggestion" key={item}>
          ✧ {item}
        </button>
      ))}
    </aside>
  );
}
