"use client";

import { useEffect, useState } from "react";
import AppModal from "../common/AppModal";
import Button from "../common/Button";
import TagSuggestionDropdown from "./TagSuggestionDropdown";
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_FORM_FIELDS,
  TEMPLATE_TEXT,
  TEMPLATE_VISIBILITY
} from "../../constants/templates";
import { useAppStore } from "../../store";

const fieldClassName =
  "min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100";

export default function TemplateFormModal({
  error,
  initialValues,
  isSubmitting,
  mode = "publish",
  onClose,
  onSubmit
}) {
  const fetchTemplateTagSuggestions = useAppStore((state) => state.fetchTemplateTagSuggestions);
  const [values, setValues] = useState(() => getInitialValues(initialValues));
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [isTagInputFocused, setIsTagInputFocused] = useState(false);
  const isEditing = mode === "edit";
  const activeTagQuery = getActiveTagQuery(values.tags);
  const visibleTagSuggestions = tagSuggestions.filter(
    (tag) => !getSelectedTags(values.tags).includes(tag.toLowerCase())
  );

  useEffect(() => {
    if (!isTagInputFocused || !activeTagQuery) {
      setTagSuggestions([]);
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      fetchTemplateTagSuggestions(activeTagQuery)
        .then(setTagSuggestions)
        .catch(() => setTagSuggestions([]));
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [activeTagQuery, fetchTemplateTagSuggestions, isTagInputFocused]);

  function updateValue(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit() {
    const payload = {
      ...values,
      tags: values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    };

    if (payload.projectType === "image" || (!isEditing && !payload.starterContent.trim())) {
      delete payload.starterContent;
    }

    onSubmit(payload);
  }

  return (
    <AppModal
      description={
        isEditing ? TEMPLATE_TEXT.EDIT_MODAL_DESCRIPTION : TEMPLATE_TEXT.PUBLISH_MODAL_DESCRIPTION
      }
      onClose={onClose}
      title={isEditing ? TEMPLATE_TEXT.EDIT_MODAL_TITLE : TEMPLATE_TEXT.PUBLISH_MODAL_TITLE}
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <TemplateField label={TEMPLATE_FORM_FIELDS.TITLE}>
          <input
            autoFocus
            className={fieldClassName}
            maxLength={120}
            onChange={(event) => updateValue("title", event.target.value)}
            required
            value={values.title}
          />
        </TemplateField>

        <TemplateField label={TEMPLATE_FORM_FIELDS.DESCRIPTION}>
          <textarea
            className={`${fieldClassName} min-h-24 resize-y py-2.5 leading-6`}
            maxLength={600}
            onChange={(event) => updateValue("description", event.target.value)}
            value={values.description}
          />
        </TemplateField>

        <div className="grid gap-4 sm:grid-cols-2">
          <TemplateField label={TEMPLATE_FORM_FIELDS.CATEGORY}>
            <select
              className={fieldClassName}
              onChange={(event) => updateValue("category", event.target.value)}
              value={values.category}
            >
              {TEMPLATE_CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </TemplateField>
          <TemplateField label={TEMPLATE_FORM_FIELDS.PROJECT_TYPE}>
            <input
              className={`${fieldClassName} cursor-not-allowed bg-slate-50 capitalize`}
              disabled
              value={values.projectType}
            />
          </TemplateField>
        </div>

        <TemplateField label={TEMPLATE_FORM_FIELDS.TAGS}>
          <span className="relative block">
            <input
              className={fieldClassName}
              maxLength={400}
              onBlur={() => window.setTimeout(() => setIsTagInputFocused(false), 120)}
              onChange={(event) => updateValue("tags", event.target.value)}
              onFocus={() => setIsTagInputFocused(true)}
              placeholder="marketing, blog, campaign"
              value={values.tags}
            />
            {isTagInputFocused && visibleTagSuggestions.length > 0 && (
              <TagSuggestionDropdown
                label={TEMPLATE_TEXT.TAG_SUGGESTIONS}
                onSelect={(tag) => updateValue("tags", applyTagSuggestion(values.tags, tag))}
                suggestions={visibleTagSuggestions}
              />
            )}
          </span>
        </TemplateField>

        <TemplateField label={TEMPLATE_FORM_FIELDS.STARTER_PROMPT}>
          <textarea
            className={`${fieldClassName} min-h-24 resize-y py-2.5 leading-6`}
            maxLength={4000}
            onChange={(event) => updateValue("starterPrompt", event.target.value)}
            value={values.starterPrompt}
          />
        </TemplateField>

        {values.projectType === "text" && (
          <TemplateField label={TEMPLATE_FORM_FIELDS.STARTER_CONTENT}>
            <textarea
              className={`${fieldClassName} min-h-28 resize-y py-2.5 font-mono text-xs leading-6`}
              onChange={(event) => updateValue("starterContent", event.target.value)}
              value={values.starterContent}
            />
          </TemplateField>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <TemplateField label={TEMPLATE_FORM_FIELDS.TONE}>
            <input
              className={fieldClassName}
              maxLength={80}
              onChange={(event) => updateValue("tone", event.target.value)}
              value={values.tone}
            />
          </TemplateField>
          <TemplateField label={TEMPLATE_FORM_FIELDS.STYLE}>
            <input
              className={fieldClassName}
              maxLength={80}
              onChange={(event) => updateValue("style", event.target.value)}
              value={values.style}
            />
          </TemplateField>
        </div>

        <fieldset>
          <legend className="mb-2 text-xs font-bold uppercase text-slate-500">
            {TEMPLATE_FORM_FIELDS.VISIBILITY}
          </legend>
          <div className="grid grid-cols-2 overflow-hidden rounded-md border border-slate-200">
            {[TEMPLATE_VISIBILITY.PUBLIC, TEMPLATE_VISIBILITY.PRIVATE].map((visibility) => (
              <label
                className={`cursor-pointer px-4 py-2.5 text-center text-sm font-bold transition ${
                  values.visibility === visibility
                    ? "bg-violet-600 text-white"
                    : "bg-white text-slate-700 hover:bg-violet-50 hover:text-violet-700"
                }`}
                key={visibility}
              >
                <input
                  checked={values.visibility === visibility}
                  className="sr-only"
                  name="template-visibility"
                  onChange={() => updateValue("visibility", visibility)}
                  type="radio"
                />
                {visibility === TEMPLATE_VISIBILITY.PUBLIC
                  ? TEMPLATE_TEXT.PUBLIC_VISIBILITY
                  : TEMPLATE_TEXT.PRIVATE_VISIBILITY}
              </label>
            ))}
          </div>
        </fieldset>

        {error && (
          <p
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
          <Button disabled={isSubmitting} onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
          <Button disabled={isSubmitting || !values.title.trim()} type="submit">
            {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Publish Template"}
          </Button>
        </div>
      </form>
    </AppModal>
  );
}

function TemplateField({ children, label }) {
  return (
    <label className="grid gap-2 text-xs font-bold uppercase text-slate-500">
      {label}
      {children}
    </label>
  );
}

function getInitialValues(values = {}) {
  return {
    title: values.title || "",
    description: values.description || "",
    category: TEMPLATE_CATEGORIES.includes(values.category) ? values.category : "Other",
    projectType: values.projectType || values.type || "text",
    tags: Array.isArray(values.tags) ? values.tags.join(", ") : values.tags || "",
    starterPrompt: values.starterPrompt || "",
    starterContent: typeof values.starterContent === "string" ? values.starterContent : "",
    tone: values.tone || "",
    style: values.style || "",
    visibility: values.visibility || TEMPLATE_VISIBILITY.PUBLIC
  };
}

function getActiveTagQuery(value) {
  const segments = String(value || "").split(",");
  return segments[segments.length - 1].trim().toLowerCase();
}

function getSelectedTags(value) {
  const segments = String(value || "").split(",");
  return segments
    .slice(0, -1)
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function applyTagSuggestion(value, selectedTag) {
  const segments = String(value || "").split(",");
  segments[segments.length - 1] = ` ${selectedTag}`;

  return segments
    .map((tag, index) => (index === 0 ? tag.trim() : tag.trim()))
    .filter(Boolean)
    .join(", ")
    .concat(", ");
}
