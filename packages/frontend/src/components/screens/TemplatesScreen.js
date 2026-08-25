"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Search, Send, Trash2 } from "lucide-react";
import Button from "../common/Button";
import ConfirmDialog from "../common/ConfirmDialog";
import { EmptyState, SectionHeader } from "../common/Cards";
import ToastNotification, { TOAST_TYPES } from "../common/ToastNotification";
import TemplateCard from "../templates/TemplateCard";
import TemplateFormModal from "../templates/TemplateFormModal";
import TemplatePreviewModal from "../templates/TemplatePreviewModal";
import TagSuggestionDropdown from "../templates/TagSuggestionDropdown";
import { API_PROJECT_TYPES } from "../../constants/content";
import { ROUTES } from "../../constants/navigation";
import {
  TEMPLATE_FILTER_OPTIONS,
  TEMPLATE_TABS,
  TEMPLATE_TEXT,
  TEMPLATE_TYPES,
  TEMPLATE_VISIBILITY
} from "../../constants/templates";
import { useAppStore } from "../../store";

export default function TemplatesScreen() {
  const router = useRouter();
  const auth = useAppStore((state) => state.auth);
  const templateState = useAppStore((state) => state.templateState);
  const deleteTemplate = useAppStore((state) => state.deleteTemplate);
  const fetchFavoriteTemplates = useAppStore((state) => state.fetchFavoriteTemplates);
  const fetchMyTemplates = useAppStore((state) => state.fetchMyTemplates);
  const fetchRecentTemplates = useAppStore((state) => state.fetchRecentTemplates);
  const fetchTemplateTagSuggestions = useAppStore((state) => state.fetchTemplateTagSuggestions);
  const fetchTemplates = useAppStore((state) => state.fetchTemplates);
  const toggleTemplateFavorite = useAppStore((state) => state.toggleTemplateFavorite);
  const updateTemplate = useAppStore((state) => state.updateTemplate);
  const updateTemplateVisibility = useAppStore((state) => state.updateTemplateVisibility);
  const useTemplate = useAppStore((state) => state.useTemplate);
  const [activeTab, setActiveTab] = useState(TEMPLATE_TABS.BROWSE);
  const [category, setCategory] = useState("all");
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [favoritePendingId, setFavoritePendingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [search, setSearch] = useState("");
  const [searchTagSuggestions, setSearchTagSuggestions] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [type, setType] = useState(TEMPLATE_TYPES.ALL);
  const [usingTemplateId, setUsingTemplateId] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!auth.token || activeTab !== TEMPLATE_TABS.BROWSE) return undefined;

    const timeout = window.setTimeout(() => {
      fetchTemplates({ category, search: search.trim(), type }).catch(() => {});
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [activeTab, auth.token, category, fetchTemplates, search, type]);

  useEffect(() => {
    if (!auth.token) return;

    fetchRecentTemplates().catch(() => {});
  }, [auth.token, fetchRecentTemplates]);

  useEffect(() => {
    if (auth.token && activeTab === TEMPLATE_TABS.MINE) {
      fetchMyTemplates().catch(() => {});
    }
  }, [activeTab, auth.token, fetchMyTemplates]);

  useEffect(() => {
    if (auth.token && activeTab === TEMPLATE_TABS.FAVORITES) {
      fetchFavoriteTemplates().catch(() => {});
    }
  }, [activeTab, auth.token, fetchFavoriteTemplates]);

  useEffect(() => {
    if (!auth.token || activeTab !== TEMPLATE_TABS.BROWSE || !isSearchFocused || !search.trim()) {
      setSearchTagSuggestions([]);
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      fetchTemplateTagSuggestions(search.trim())
        .then(setSearchTagSuggestions)
        .catch(() => setSearchTagSuggestions([]));
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [activeTab, auth.token, fetchTemplateTagSuggestions, isSearchFocused, search]);

  const isFiltered = Boolean(search.trim()) || type !== "all" || category !== "all";
  const visibleTemplates =
    activeTab === TEMPLATE_TABS.BROWSE
      ? templateState.templates
      : activeTab === TEMPLATE_TABS.FAVORITES
        ? templateState.favoriteTemplates
        : templateState.myTemplates;
  const loading =
    activeTab === TEMPLATE_TABS.BROWSE
      ? templateState.loading
      : activeTab === TEMPLATE_TABS.FAVORITES
        ? templateState.favoriteLoading
        : templateState.myLoading;
  async function handleFavorite(template) {
    setFavoritePendingId(template.id);

    try {
      await toggleTemplateFavorite(template.id, !template.isFavorite);
      showNotification(
        template.isFavorite ? TEMPLATE_TEXT.UNFAVORITED_TITLE : TEMPLATE_TEXT.FAVORITED_TITLE,
        template.isFavorite ? TEMPLATE_TEXT.UNFAVORITED_MESSAGE : TEMPLATE_TEXT.FAVORITED_MESSAGE,
        TOAST_TYPES.SUCCESS,
        3000
      );
    } catch (error) {
      showNotification(
        TEMPLATE_TEXT.FAVORITE_FAILED_TITLE,
        error.message || TEMPLATE_TEXT.FAVORITE_FAILED_MESSAGE,
        TOAST_TYPES.ERROR
      );
    } finally {
      setFavoritePendingId(null);
    }
  }

  async function handleUse(template) {
    setUsingTemplateId(template.id);

    try {
      const result = await useTemplate(template.id);
      window.sessionStorage.setItem(
        "gencontent-pending-toast",
        JSON.stringify({
          message: `Created from "${template.title}".`,
          title: "Template applied",
          type: TOAST_TYPES.SUCCESS
        })
      );
      router.push(getWorkspaceHref(result.project));
    } catch (error) {
      showNotification(
        TEMPLATE_TEXT.USE_FAILED_TITLE,
        error.message || TEMPLATE_TEXT.USE_FAILED_MESSAGE,
        TOAST_TYPES.ERROR
      );
    } finally {
      setUsingTemplateId(null);
    }
  }

  async function handleUpdate(values) {
    if (!editingTemplate) return;
    setIsSaving(true);

    try {
      const updated = await updateTemplate(editingTemplate.id, values);
      setEditingTemplate(null);
      setPreviewTemplate((current) => (current?.id === updated.id ? updated : current));
      showNotification(
        TEMPLATE_TEXT.UPDATED_TITLE,
        TEMPLATE_TEXT.UPDATED_MESSAGE,
        TOAST_TYPES.SUCCESS
      );
    } catch (error) {
      showNotification(
        TEMPLATE_TEXT.UPDATE_FAILED_TITLE,
        error.message || TEMPLATE_TEXT.UPDATE_FAILED_MESSAGE,
        TOAST_TYPES.ERROR
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleVisibilityChange(template, visibility) {
    setIsSaving(true);

    try {
      const updated = await updateTemplateVisibility(template.id, visibility);
      setPendingAction(null);
      setPreviewTemplate((current) => (current?.id === updated.id ? updated : current));
      showNotification(
        visibility === TEMPLATE_VISIBILITY.PUBLIC
          ? TEMPLATE_TEXT.PUBLISHED_TITLE
          : TEMPLATE_TEXT.HIDDEN_TITLE,
        visibility === TEMPLATE_VISIBILITY.PUBLIC
          ? TEMPLATE_TEXT.PUBLISHED_MESSAGE
          : TEMPLATE_TEXT.HIDDEN_MESSAGE,
        TOAST_TYPES.SUCCESS
      );
    } catch (error) {
      showNotification(
        visibility === TEMPLATE_VISIBILITY.PUBLIC
          ? TEMPLATE_TEXT.REPUBLISH_FAILED_TITLE
          : TEMPLATE_TEXT.HIDE_FAILED_TITLE,
        error.message ||
          (visibility === TEMPLATE_VISIBILITY.PUBLIC
            ? TEMPLATE_TEXT.REPUBLISH_FAILED_MESSAGE
            : TEMPLATE_TEXT.HIDE_FAILED_MESSAGE),
        TOAST_TYPES.ERROR
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmAction() {
    if (!pendingAction) return;

    if (pendingAction.type === "hide") {
      await handleVisibilityChange(pendingAction.template, TEMPLATE_VISIBILITY.PRIVATE);
      return;
    }

    setIsSaving(true);
    try {
      await deleteTemplate(pendingAction.template.id);
      setPreviewTemplate((current) => (current?.id === pendingAction.template.id ? null : current));
      setPendingAction(null);
      showNotification(
        TEMPLATE_TEXT.DELETED_TITLE,
        TEMPLATE_TEXT.DELETED_MESSAGE,
        TOAST_TYPES.SUCCESS
      );
    } catch (error) {
      showNotification(
        TEMPLATE_TEXT.DELETE_FAILED_TITLE,
        error.message || TEMPLATE_TEXT.DELETE_FAILED_MESSAGE,
        TOAST_TYPES.ERROR
      );
    } finally {
      setIsSaving(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setType("all");
    setCategory("all");
  }

  function showNotification(title, message, notificationType, duration = 5000) {
    setNotification({ duration, id: Date.now(), message, title, type: notificationType });
  }

  return (
    <main className="min-w-0 p-5 md:p-7">
      <header className="-m-5 mb-6 border-b border-slate-200 p-5 md:-m-7 md:mb-7 md:p-7">
        <h1 className="m-0 text-2xl font-bold text-slate-950">{TEMPLATE_TEXT.PAGE_TITLE}</h1>
        <p className="mt-1.5 text-sm text-slate-500">{TEMPLATE_TEXT.PAGE_DESCRIPTION}</p>
      </header>

      <div className="mb-6 flex w-full max-w-md rounded-md border border-slate-200 bg-white p-1">
        {[
          [TEMPLATE_TABS.BROWSE, TEMPLATE_TEXT.BROWSE_TAB],
          [TEMPLATE_TABS.FAVORITES, TEMPLATE_TEXT.FAVORITES_TAB],
          [TEMPLATE_TABS.MINE, TEMPLATE_TEXT.MY_TAB]
        ].map(([tab, label]) => (
          <button
            className={`min-h-9 min-w-0 flex-1 rounded px-3 text-sm font-bold transition ${
              activeTab === tab
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-violet-50 hover:text-violet-700"
            }`}
            key={tab}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === TEMPLATE_TABS.BROWSE && (
        <>
          <section className="mb-7 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[minmax(14rem,1fr)_11rem_12rem_auto] md:items-end">
            <label className="grid min-w-0 gap-2 text-xs font-bold uppercase text-slate-500">
              {TEMPLATE_TEXT.SEARCH_LABEL}
              <span className="relative block">
                <Search
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={17}
                />
                <input
                  className="min-h-10 w-full rounded-md border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 120)}
                  onChange={(event) => setSearch(event.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder={TEMPLATE_TEXT.SEARCH_PLACEHOLDER}
                  value={search}
                />
                {isSearchFocused && searchTagSuggestions.length > 0 && (
                  <TagSuggestionDropdown
                    label={TEMPLATE_TEXT.SEARCH_TAG_SUGGESTIONS}
                    onSelect={(tag) => setSearch(tag)}
                    suggestions={searchTagSuggestions}
                  />
                )}
              </span>
            </label>
            <FilterSelect
              label={TEMPLATE_TEXT.TYPE_FILTER_LABEL}
              onChange={setType}
              options={TEMPLATE_FILTER_OPTIONS.TYPES}
              value={type}
            />
            <FilterSelect
              label={TEMPLATE_TEXT.CATEGORY_FILTER_LABEL}
              onChange={setCategory}
              options={TEMPLATE_FILTER_OPTIONS.CATEGORIES}
              value={category}
            />
            <Button disabled={!isFiltered} onClick={clearFilters} type="button" variant="secondary">
              {TEMPLATE_TEXT.CLEAR_FILTERS}
            </Button>
          </section>

          {!isFiltered && templateState.recentTemplates.length > 0 && (
            <TemplateSection
              favoritePendingId={favoritePendingId}
              isUsingId={usingTemplateId}
              onFavorite={handleFavorite}
              onPreview={setPreviewTemplate}
              onUse={handleUse}
              templates={templateState.recentTemplates}
              title={TEMPLATE_TEXT.RECENT_SECTION_TITLE}
            />
          )}
        </>
      )}

      <SectionHeader title={getTemplateTabLabel(activeTab)} />

      {loading && visibleTemplates.length === 0 ? (
        <EmptyState
          description={TEMPLATE_TEXT.LOAD_FAILED_DESCRIPTION}
          title={
            activeTab === TEMPLATE_TABS.BROWSE
              ? TEMPLATE_TEXT.LOADING_BROWSE
              : activeTab === TEMPLATE_TABS.FAVORITES
                ? TEMPLATE_TEXT.LOADING_FAVORITES
                : TEMPLATE_TEXT.LOADING_MINE
          }
        />
      ) : templateState.error && visibleTemplates.length === 0 ? (
        <EmptyState
          action={
            <Button
              onClick={() =>
                activeTab === TEMPLATE_TABS.BROWSE
                  ? fetchTemplates({ category, search, type })
                  : activeTab === TEMPLATE_TABS.FAVORITES
                    ? fetchFavoriteTemplates()
                    : fetchMyTemplates()
              }
              type="button"
              variant="secondary"
            >
              Try Again
            </Button>
          }
          description={templateState.error || TEMPLATE_TEXT.LOAD_FAILED_DESCRIPTION}
          title={TEMPLATE_TEXT.LOAD_FAILED_TITLE}
        />
      ) : visibleTemplates.length === 0 ? (
        <EmptyState
          action={
            activeTab === TEMPLATE_TABS.MINE ? (
              <Button onClick={() => router.push(ROUTES.PROJECTS)} type="button">
                {TEMPLATE_TEXT.VIEW_PROJECTS}
              </Button>
            ) : activeTab === TEMPLATE_TABS.BROWSE && isFiltered ? (
              <Button onClick={clearFilters} type="button" variant="secondary">
                {TEMPLATE_TEXT.CLEAR_FILTERS}
              </Button>
            ) : null
          }
          description={
            activeTab === TEMPLATE_TABS.BROWSE
              ? TEMPLATE_TEXT.EMPTY_BROWSE_DESCRIPTION
              : activeTab === TEMPLATE_TABS.FAVORITES
                ? TEMPLATE_TEXT.EMPTY_FAVORITES_DESCRIPTION
                : TEMPLATE_TEXT.EMPTY_MINE_DESCRIPTION
          }
          title={
            activeTab === TEMPLATE_TABS.BROWSE
              ? TEMPLATE_TEXT.EMPTY_BROWSE_TITLE
              : activeTab === TEMPLATE_TABS.FAVORITES
                ? TEMPLATE_TEXT.EMPTY_FAVORITES_TITLE
                : TEMPLATE_TEXT.EMPTY_MINE_TITLE
          }
        />
      ) : activeTab === TEMPLATE_TABS.BROWSE || activeTab === TEMPLATE_TABS.FAVORITES ? (
        <TemplateGrid
          favoritePendingId={favoritePendingId}
          isUsingId={usingTemplateId}
          onFavorite={handleFavorite}
          onPreview={setPreviewTemplate}
          onUse={handleUse}
          templates={visibleTemplates}
        />
      ) : (
        <TemplateGrid
          isUsingId={usingTemplateId}
          onPreview={setPreviewTemplate}
          onUse={handleUse}
          renderActions={(template) => (
            <ManageTemplateActions
              isSaving={isSaving}
              isUsing={usingTemplateId === template.id}
              onDelete={(item) => setPendingAction({ type: "delete", template: item })}
              onEdit={setEditingTemplate}
              onHide={(item) => setPendingAction({ type: "hide", template: item })}
              onPreview={setPreviewTemplate}
              onPublish={(item) => handleVisibilityChange(item, TEMPLATE_VISIBILITY.PUBLIC)}
              onUse={handleUse}
              template={template}
            />
          )}
          showFavorite={false}
          showManagementMeta
          templates={visibleTemplates}
        />
      )}

      <TemplatePreviewModal
        isUsing={usingTemplateId === previewTemplate?.id}
        onClose={() => setPreviewTemplate(null)}
        onUse={handleUse}
        template={previewTemplate}
      />

      {editingTemplate && (
        <TemplateFormModal
          error={null}
          initialValues={editingTemplate}
          isSubmitting={isSaving}
          mode="edit"
          onClose={() => setEditingTemplate(null)}
          onSubmit={handleUpdate}
        />
      )}

      {pendingAction && (
        <ConfirmDialog
          cancelLabel="Cancel"
          confirmLabel={
            pendingAction.type === "hide"
              ? TEMPLATE_TEXT.HIDE_CONFIRM_LABEL
              : TEMPLATE_TEXT.DELETE_CONFIRM_LABEL
          }
          description={
            pendingAction.type === "hide"
              ? TEMPLATE_TEXT.hideDescription(pendingAction.template.title)
              : TEMPLATE_TEXT.deleteDescription(pendingAction.template.title)
          }
          isConfirming={isSaving}
          onCancel={() => setPendingAction(null)}
          onConfirm={handleConfirmAction}
          title={
            pendingAction.type === "hide"
              ? TEMPLATE_TEXT.HIDE_CONFIRM_TITLE
              : TEMPLATE_TEXT.DELETE_CONFIRM_TITLE
          }
        />
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

function TemplateSection(props) {
  return (
    <section>
      <SectionHeader title={props.title} />
      <TemplateGrid {...props} />
    </section>
  );
}

function getTemplateTabLabel(tab) {
  return tab === TEMPLATE_TABS.BROWSE
    ? TEMPLATE_TEXT.BROWSE_TAB
    : tab === TEMPLATE_TABS.FAVORITES
      ? TEMPLATE_TEXT.FAVORITES_TAB
      : TEMPLATE_TEXT.MY_TAB;
}

function TemplateGrid({
  favoritePendingId,
  isUsingId,
  onFavorite,
  onPreview,
  onUse,
  renderActions,
  showFavorite = true,
  showManagementMeta = false,
  templates
}) {
  return (
    <section className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => (
        <TemplateCard
          actions={renderActions?.(template)}
          isFavoritePending={favoritePendingId === template.id}
          isUsing={isUsingId === template.id}
          key={template.id}
          onFavorite={onFavorite}
          onPreview={onPreview}
          onUse={onUse}
          showFavorite={showFavorite}
          showManagementMeta={showManagementMeta}
          template={template}
        />
      ))}
    </section>
  );
}

function ManageTemplateActions({
  isSaving,
  isUsing,
  onDelete,
  onEdit,
  onHide,
  onPreview,
  onPublish,
  onUse,
  template
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button onClick={() => onPreview(template)} type="button" variant="secondary">
        <Eye aria-hidden="true" size={16} />
        {TEMPLATE_TEXT.PREVIEW_ACTION}
      </Button>
      <Button onClick={() => onEdit(template)} type="button" variant="secondary">
        <Pencil aria-hidden="true" size={16} />
        {TEMPLATE_TEXT.EDIT_ACTION}
      </Button>
      {template.visibility === TEMPLATE_VISIBILITY.PUBLIC ? (
        <Button
          disabled={isSaving}
          onClick={() => onHide(template)}
          type="button"
          variant="secondary"
        >
          <EyeOff aria-hidden="true" size={16} />
          {TEMPLATE_TEXT.HIDE_ACTION}
        </Button>
      ) : (
        <Button
          disabled={isSaving}
          onClick={() => onPublish(template)}
          type="button"
          variant="secondary"
        >
          <Send aria-hidden="true" size={16} />
          {TEMPLATE_TEXT.PUBLISH_ACTION}
        </Button>
      )}
      <Button onClick={() => onDelete(template)} type="button" variant="secondary">
        <Trash2 aria-hidden="true" size={16} />
        {TEMPLATE_TEXT.DELETE_ACTION}
      </Button>
      <Button disabled={isUsing} onClick={() => onUse(template)} type="button">
        {isUsing ? TEMPLATE_TEXT.USING_ACTION : TEMPLATE_TEXT.USE_ACTION}
      </Button>
    </div>
  );
}

function FilterSelect({ label, onChange, options, value }) {
  return (
    <label className="grid gap-2 text-xs font-bold uppercase text-slate-500">
      {label}
      <select
        className="min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm capitalize text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "all"
              ? `All${label === TEMPLATE_TEXT.CATEGORY_FILTER_LABEL ? " Categories" : ""}`
              : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function getWorkspaceHref(project) {
  const params = new URLSearchParams({ projectId: project._id || project.id });

  if (project.type === API_PROJECT_TYPES.IMAGE) {
    params.set("type", API_PROJECT_TYPES.IMAGE);
  }

  return `${ROUTES.EDITOR}?${params.toString()}`;
}
