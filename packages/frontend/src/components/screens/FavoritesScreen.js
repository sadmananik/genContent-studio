"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, FileText, ImageIcon, StarOff } from "lucide-react";
import Button from "../common/Button";
import { EmptyState, SectionHeader } from "../common/Cards";
import ProjectListCard from "../common/ProjectListCard";
import ToastNotification, { TOAST_TYPES } from "../common/ToastNotification";
import { AI_CONTENT_TYPES, API_PROJECT_TYPES, PROJECT_TYPES } from "../../constants/content";
import { ROUTES } from "../../constants/navigation";
import { COMMON_UI_TEXT, FAVOURITES_ALERTS } from "../../constants/notifications";
import { useAppStore } from "../../store";

export default function FavoritesScreen() {
  const router = useRouter();
  const auth = useAppStore((state) => state.auth);
  const aiState = useAppStore((state) => state.aiState);
  const fetchFavouriteResponses = useAppStore((state) => state.fetchFavouriteResponses);
  const toggleAiResponseFavourite = useAppStore((state) => state.toggleAiResponseFavourite);
  const [copiedResponseId, setCopiedResponseId] = useState(null);
  const [notification, setNotification] = useState(null);
  const favourites = useMemo(
    () => aiState.favouriteResponses.map(formatFavouriteResponse),
    [aiState.favouriteResponses]
  );

  useEffect(() => {
    if (auth.token) {
      fetchFavouriteResponses().catch(() => {});
    }
  }, [auth.token, fetchFavouriteResponses]);

  function showNotification(title, message, type = TOAST_TYPES.INFO, duration = 5000) {
    setNotification({ duration, id: Date.now(), message, title, type });
  }

  async function handleCopyFavourite(favourite) {
    await copyText(favourite.response);
    setCopiedResponseId(favourite.id);
    showNotification(
      FAVOURITES_ALERTS.COPIED_TITLE,
      FAVOURITES_ALERTS.COPIED_MESSAGE,
      TOAST_TYPES.SUCCESS,
      3000
    );
    window.setTimeout(() => setCopiedResponseId(null), 1400);
  }

  async function handleRemoveFavourite(favourite) {
    try {
      await toggleAiResponseFavourite(favourite.id, false);
      showNotification(
        FAVOURITES_ALERTS.REMOVED_TITLE,
        FAVOURITES_ALERTS.REMOVED_MESSAGE,
        TOAST_TYPES.SUCCESS,
        3000
      );
    } catch (error) {
      showNotification(
        FAVOURITES_ALERTS.REMOVE_FAILED_TITLE,
        error.message || FAVOURITES_ALERTS.REMOVE_FAILED_MESSAGE,
        TOAST_TYPES.ERROR
      );
    }
  }

  return (
    <main className="min-w-0 p-5 md:p-7">
      <header className="-m-5 mb-6 flex flex-wrap items-center gap-4 border-b border-slate-200 p-5 md:-m-7 md:mb-7 md:p-7">
        <div>
          <h1 className="m-0 text-2xl font-bold text-slate-950">{FAVOURITES_ALERTS.PAGE_TITLE}</h1>
          <p className="mt-1.5 text-sm text-slate-500">{FAVOURITES_ALERTS.PAGE_DESCRIPTION}</p>
        </div>
      </header>

      <SectionHeader
        title={`${FAVOURITES_ALERTS.RESPONSE_SECTION_TITLE}${
          favourites.length ? ` (${favourites.length})` : ""
        }`}
      />

      {aiState.loading && favourites.length === 0 ? (
        <EmptyState
          title={FAVOURITES_ALERTS.LOADING_TITLE}
          description={FAVOURITES_ALERTS.LOADING_DESCRIPTION}
        />
      ) : aiState.error && favourites.length === 0 ? (
        <EmptyState
          title={FAVOURITES_ALERTS.LOAD_FAILED_TITLE}
          description={aiState.error}
          action={
            <Button
              onClick={() => fetchFavouriteResponses().catch(() => {})}
              type="button"
              variant="secondary"
            >
              {COMMON_UI_TEXT.TRY_AGAIN}
            </Button>
          }
        />
      ) : favourites.length === 0 ? (
        <EmptyState
          title={FAVOURITES_ALERTS.EMPTY_TITLE}
          description={FAVOURITES_ALERTS.EMPTY_DESCRIPTION}
          action={<Button onClick={() => router.push(ROUTES.PROJECTS)}>View Projects</Button>}
        />
      ) : (
        <section className="grid gap-4">
          {favourites.map((favourite) => (
            <ProjectListCard
              actions={
                <>
                  <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">
                    {favourite.typeLabel}
                  </span>
                  <Button
                    className="border-violet-100 bg-violet-50 px-3 text-violet-700 shadow-sm hover:border-violet-300 hover:bg-violet-100 hover:text-violet-800"
                    onClick={(event) => {
                      event.stopPropagation();
                      router.push(getProjectWorkspaceHref(favourite));
                    }}
                    type="button"
                    variant="secondary"
                  >
                    <ExternalLink aria-hidden="true" size={17} />
                    Open Project
                  </Button>
                  <Button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCopyFavourite(favourite);
                    }}
                    type="button"
                    variant="secondary"
                  >
                    <Copy aria-hidden="true" size={17} />
                    {copiedResponseId === favourite.id ? "Copied" : "Copy"}
                  </Button>
                  <Button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemoveFavourite(favourite);
                    }}
                    type="button"
                    variant="secondary"
                  >
                    <StarOff aria-hidden="true" size={17} />
                    Remove
                  </Button>
                </>
              }
              icon={
                favourite.contentType === AI_CONTENT_TYPES.IMAGE ? (
                  <ImageIcon aria-hidden="true" size={19} />
                ) : (
                  <FileText aria-hidden="true" size={19} />
                )
              }
              key={favourite.id}
              onOpen={() => router.push(getProjectWorkspaceHref(favourite))}
              title={favourite.projectTitle}
              tone={favourite.tone}
            >
              <p className="mt-1 text-xs text-slate-500">
                {favourite.projectCategory} • {favourite.updated}
              </p>
              <p className="mt-3 line-clamp-2 text-sm font-semibold text-slate-700">
                {favourite.promptPreview}
              </p>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                {favourite.responsePreview}
              </p>
            </ProjectListCard>
          ))}
        </section>
      )}

      <ToastNotification
        duration={notification?.duration}
        key={notification?.id}
        message={notification?.message}
        onClose={() => setNotification(null)}
        title={notification?.title}
        type={notification?.type}
      />
    </main>
  );
}

function formatFavouriteResponse(chat) {
  const project = chat.project || {};
  const contentType = chat.contentType || AI_CONTENT_TYPES.TEXT;

  return {
    id: chat._id || chat.id,
    contentType,
    projectCategory: project.category || "Project",
    projectId: project._id || project.id,
    projectTitle: project.title || "Untitled Project",
    promptPreview: getPreview(chat.prompt),
    response: chat.response || "",
    responsePreview: getPreview(chat.response, 220),
    tone: contentType === AI_CONTENT_TYPES.IMAGE ? "lavender" : "mint",
    typeLabel: contentType === AI_CONTENT_TYPES.IMAGE ? PROJECT_TYPES.IMAGE : PROJECT_TYPES.TEXT,
    updated: chat.updatedAt ? `Updated ${new Date(chat.updatedAt).toLocaleString()}` : "Saved"
  };
}

function getProjectWorkspaceHref(favourite) {
  const params = new URLSearchParams({ projectId: favourite.projectId });

  if (favourite.contentType === AI_CONTENT_TYPES.IMAGE) {
    params.set("type", API_PROJECT_TYPES.IMAGE);
  }

  return `${ROUTES.EDITOR}?${params.toString()}`;
}

function getPreview(value, maxLength = 120) {
  const compactValue = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (compactValue.length <= maxLength) {
    return compactValue || "No saved response text.";
  }

  return `${compactValue.slice(0, maxLength - 1).trim()}...`;
}

async function copyText(value) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}
