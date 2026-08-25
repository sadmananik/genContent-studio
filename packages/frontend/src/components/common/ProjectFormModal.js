"use client";

import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import Button from "./Button";
import {
  CONTENT_CATEGORIES,
  CONTENT_CATEGORY_OPTIONS,
  PROJECT_TYPE_OPTIONS
} from "../../constants/content";
import { DASHBOARD_TEXT, PROJECT_FORM_TEXT } from "../../constants/dashboard";

export default function ProjectFormModal({
  error,
  initialValues,
  isSubmitting: isSaving = false,
  onClose,
  onSubmit,
  submitLabel = DASHBOARD_TEXT.CREATE_PROJECT,
  title = DASHBOARD_TEXT.CREATE_PROJECT
}) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset
  } = useForm({
    defaultValues: {
      title: initialValues?.title || "",
      description: initialValues?.description || "",
      category: initialValues?.category || CONTENT_CATEGORIES.BLOG_POST,
      projectType: initialValues?.type || PROJECT_TYPE_OPTIONS[0]
    }
  });

  async function submitProject(values) {
    await onSubmit?.({
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category,
      type: values.projectType
    });
    reset();
  }

  const isBusy = isSubmitting || isSaving;

  return (
    <div
      className="fixed inset-0 z-30 grid place-items-center bg-slate-950/40 p-5"
      role="presentation"
    >
      <form
        className="grid w-full max-w-xl gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(31,41,55,0.08)] sm:p-6"
        onSubmit={handleSubmit(submitProject)}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="m-0 text-2xl font-bold text-slate-950">{title}</h3>
            <p className="mt-1.5 text-slate-500">{DASHBOARD_TEXT.PROJECT_INFORMATION}</p>
          </div>
          <button
            className="app-close-button grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-700"
            type="button"
            onClick={onClose}
            aria-label={PROJECT_FORM_TEXT.CLOSE}
          >
            <X aria-hidden="true" size={17} />
          </button>
        </div>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          {PROJECT_FORM_TEXT.TITLE_LABEL}
          <input
            className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            placeholder={PROJECT_FORM_TEXT.TITLE_PLACEHOLDER}
            aria-invalid={Boolean(errors.title)}
            {...register("title", {
              required: PROJECT_FORM_TEXT.TITLE_REQUIRED,
              setValueAs: (value) => value.trim()
            })}
          />
          {errors.title && (
            <span className="text-xs font-bold text-red-600">{errors.title.message}</span>
          )}
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          {PROJECT_FORM_TEXT.CATEGORY_LABEL}
          <select
            className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            {...register("category")}
          >
            {CONTENT_CATEGORY_OPTIONS.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          {PROJECT_FORM_TEXT.DESCRIPTION_LABEL}
          <textarea
            className="min-h-24 resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            placeholder={PROJECT_FORM_TEXT.DESCRIPTION_PLACEHOLDER}
            {...register("description")}
          />
        </label>
        <fieldset className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 p-3 text-sm font-bold text-slate-700">
          <legend className="px-1">{PROJECT_FORM_TEXT.TYPE_LEGEND}</legend>
          {PROJECT_TYPE_OPTIONS.map((projectType) => (
            <label
              className="flex min-h-10 items-center gap-2 rounded-md bg-slate-50 px-3"
              key={projectType}
            >
              <input type="radio" value={projectType} {...register("projectType")} />
              {projectType}
            </label>
          ))}
        </fieldset>
        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
            {error}
          </p>
        )}
        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" type="button" onClick={onClose} disabled={isBusy}>
            {PROJECT_FORM_TEXT.CANCEL}
          </Button>
          <Button type="submit" disabled={isBusy}>
            {isBusy ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
