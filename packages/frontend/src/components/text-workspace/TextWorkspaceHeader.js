import Link from "next/link";
import { ArrowLeft, Link2, Save, Share2, Users } from "lucide-react";
import Button from "../common/Button";
import { ROUTES } from "../../constants/navigation";

export default function TextWorkspaceHeader({
  invitedUsers = [],
  isSaving,
  onGenerateLink,
  onSave,
  onShare,
  project,
  shareLink,
  statusLabel
}) {
  return (
    <header className="flex flex-wrap items-center gap-4 border-b border-slate-200 bg-white px-5 py-4 lg:px-7">
      <Link
        className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        href={ROUTES.DASHBOARD}
      >
        <ArrowLeft aria-hidden="true" size={17} />
        Dashboard
      </Link>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-bold text-slate-950 md:text-2xl">{project.title}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span>{project.category}</span>
          <span aria-hidden="true">•</span>
          <span>{project.type}</span>
          <span aria-hidden="true">•</span>
          <span>{statusLabel || project.lastUpdated}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700">
          <Users aria-hidden="true" size={17} />
          {invitedUsers.length ? `${invitedUsers.length} invited` : "No invited users"}
        </div>
        {shareLink && (
          <span className="hidden max-w-56 truncate rounded-md border border-violet-100 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 md:inline">
            {shareLink}
          </span>
        )}
        <Button onClick={onGenerateLink} variant="secondary" type="button">
          <Link2 aria-hidden="true" size={17} />
          Link
        </Button>
        <Button onClick={onShare} variant="secondary" type="button">
          <Share2 aria-hidden="true" size={17} />
          Share
        </Button>
        <Button disabled={isSaving} onClick={onSave} type="button">
          <Save aria-hidden="true" size={17} />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </header>
  );
}
