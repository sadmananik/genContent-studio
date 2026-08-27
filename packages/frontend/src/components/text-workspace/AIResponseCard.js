import { Check, Copy, Edit3, Save, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import Button from "../common/Button";

export default function AIResponseCard({
  canEdit = true,
  copied,
  onCopy,
  onDelete,
  onFavourite,
  onUpdate,
  response,
  responseLabel = "AI Response",
  selected
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftResponse, setDraftResponse] = useState(response.response);

  function handleSaveEdit() {
    if (!canEdit) {
      return;
    }

    onUpdate(response.id, draftResponse);
    setIsEditing(false);
  }

  return (
    <article
      className={`rounded-lg border bg-white p-4 shadow-[0_10px_22px_rgba(16,24,40,0.04)] ${
        selected ? "border-violet-300 ring-4 ring-violet-100" : "border-slate-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-slate-500">Prompt</p>
          <h3 className="mt-1 text-sm font-bold text-slate-950">{response.prompt}</h3>
        </div>
        <span className="text-xs text-slate-500">{response.timestamp}</span>
      </div>

      <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
        <p className="text-xs font-bold uppercase text-slate-500">{responseLabel}</p>
        {isEditing ? (
          <textarea
            className="mt-2 min-h-32 w-full resize-y rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            onChange={(event) => setDraftResponse(event.target.value)}
            value={draftResponse}
          />
        ) : (
          <p className="mt-2 text-sm leading-6 text-slate-700">{response.response}</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          className="group hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
          disabled={!canEdit}
          onClick={() => onFavourite(response.id)}
          variant="secondary"
          type="button"
        >
          <Star
            aria-hidden="true"
            className={
              response.favourite
                ? "fill-amber-400 text-amber-500"
                : "text-slate-500 group-hover:fill-amber-400 group-hover:text-amber-500"
            }
            size={16}
          />
          Favourite
        </Button>
        <Button
          className="hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
          onClick={() => onCopy(response)}
          variant="secondary"
          type="button"
        >
          {copied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
          {copied ? "Copied" : "Copy"}
        </Button>
        {isEditing ? (
          <Button
            className="hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            disabled={!canEdit}
            onClick={handleSaveEdit}
            variant="secondary"
            type="button"
          >
            <Save aria-hidden="true" size={16} />
            Save Edit
          </Button>
        ) : (
          <Button
            className="hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
            disabled={!canEdit}
            onClick={() => setIsEditing(true)}
            variant="secondary"
            type="button"
          >
            <Edit3 aria-hidden="true" size={16} />
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            className="hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            disabled={!canEdit}
            onClick={() => onDelete(response.id)}
            variant="ghost"
            type="button"
          >
            <Trash2 aria-hidden="true" size={16} />
            Delete
          </Button>
        )}
      </div>
    </article>
  );
}
