"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import AppModal from "./AppModal";
import { apiRequest } from "../../lib/apiClient";

const actionLabels = {
  ai_content_inserted: "Inserted AI-generated content",
  ai_content_saved: "Saved AI-generated content",
  ai_prompt_deleted: "Deleted an AI prompt",
  ai_prompt_submitted: "Submitted an AI prompt",
  ai_prompt_updated: "Updated an AI prompt",
  ai_response_deleted: "Deleted an AI response",
  ai_response_generated: "Generated an AI response",
  ai_response_updated: "Updated an AI response"
};

export default function AuditHistoryModal({ onClose, projectId }) {
  const [expandedId, setExpandedId] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiRequest(`/api/projects/${projectId}/audit-history`)
      .then(setAuditLogs)
      .catch((requestError) =>
        setError(requestError.message || "Audit history could not be loaded.")
      )
      .finally(() => setIsLoading(false));
  }, [projectId]);

  return (
    <AppModal
      description="AI activity recorded for this project."
      onClose={onClose}
      title="Audit history"
    >
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading audit history...</p>
      ) : error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : auditLogs.length === 0 ? (
        <p className="text-sm text-slate-500">No audit activity recorded yet.</p>
      ) : (
        <div className="grid gap-2">
          {auditLogs.map((entry) => {
            const isExpanded = expandedId === entry._id;
            const actor = entry.actor || {};
            const metadata = entry.metadata || {};

            return (
              <article className="rounded-md border border-slate-200 bg-white" key={entry._id}>
                <button
                  className="flex w-full items-start gap-3 p-4 text-left hover:bg-slate-50"
                  onClick={() => setExpandedId(isExpanded ? null : entry._id)}
                  type="button"
                >
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <span className="min-w-0 flex-1">
                    <strong className="block text-sm text-slate-900">
                      {actor.name || "Unknown user"}
                    </strong>
                    <span className="mt-1 block text-sm font-semibold text-slate-700">
                      {actionLabels[entry.actionType] || entry.actionType}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {entry.workspace === "image" ? "Image Workspace" : "Text Workspace"} ·{" "}
                      {formatDate(entry.createdAt)}
                    </span>
                  </span>
                </button>
                {isExpanded && <AuditDetails metadata={metadata} />}
              </article>
            );
          })}
        </div>
      )}
    </AppModal>
  );
}

function AuditDetails({ metadata }) {
  const fields = [
    ["Prompt", metadata.prompt],
    ["Previous Prompt", metadata.previousPrompt],
    ["New Prompt", metadata.newPrompt],
    ["Deleted Prompt", metadata.deletedPrompt],
    ["Previous Response", metadata.previousResponsePreview],
    ["Updated Response", metadata.newResponsePreview],
    ["Deleted Response", metadata.deletedResponsePreview]
  ].filter(([, value]) => value);

  return (
    <div className="grid gap-3 border-t border-slate-200 bg-slate-50 p-4">
      {fields.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
            {value}
          </dd>
        </div>
      ))}
    </div>
  );
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "Unknown date";
}
