"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Save, Share2, Users } from "lucide-react";
import Button from "../common/Button";
import { UserAvatarStack } from "../common/UserAvatar";
import { ACCESS_LEVEL_LABELS, ACCESS_LEVELS } from "../../constants/content";
import { ROUTES } from "../../constants/navigation";
import { useAppStore } from "../../store";
import WorkspaceExportMenu from "./WorkspaceExportMenu";
import WorkspaceSharePopover from "./WorkspaceSharePopover";

export default function TextWorkspaceHeader({
  canEdit = true,
  canManageSharing = true,
  exportOptions,
  invitedUsers = [],
  onExport,
  onInviteUser,
  isSaving,
  onSave,
  project,
  statusLabel
}) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const auth = useAppStore((state) => state.auth);
  const listUsers = useAppStore((state) => state.listUsers);
  const userState = useAppStore((state) => state.userState);

  useEffect(() => {
    if (isShareOpen && userState.users.length === 0 && !userState.loading) {
      listUsers().catch(() => {});
    }
  }, [isShareOpen, listUsers, userState.loading, userState.users.length]);

  async function handleInviteSubmit(event, emailOverride) {
    event.preventDefault();
    const invited = await onInviteUser?.(emailOverride || inviteEmail);

    if (invited) {
      setInviteEmail("");
    }
  }

  return (
    <header className="relative flex flex-wrap items-center gap-4 border-b border-slate-200 bg-white px-5 py-4 lg:px-7">
      <Link
        className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        href={ROUTES.PROJECTS}
      >
        <ArrowLeft aria-hidden="true" size={17} />
        Projects
      </Link>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-bold text-slate-950 md:text-2xl">{project.title}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span>{project.category}</span>
          <span aria-hidden="true">•</span>
          <span>{project.type}</span>
          <span aria-hidden="true">•</span>
          <span>{statusLabel || project.lastUpdated}</span>
          {!canEdit && (
            <>
              <span aria-hidden="true">•</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                {ACCESS_LEVEL_LABELS[ACCESS_LEVELS.VIEWER]}
              </span>
            </>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex min-h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-2">
          <Users aria-hidden="true" className="mr-2 text-slate-500" size={17} />
          <UserAvatarStack users={invitedUsers} />
        </div>
        {canManageSharing && (
          <div className="relative">
            <Button
              onClick={() => {
                setIsShareOpen((currentValue) => !currentValue);
                setIsExportOpen(false);
              }}
              variant="secondary"
              type="button"
            >
              <Share2 aria-hidden="true" size={17} />
              Share
            </Button>
            {isShareOpen && (
              <WorkspaceSharePopover
                currentUser={auth.user}
                inviteEmail={inviteEmail}
                invitedUsers={invitedUsers}
                isLoadingUsers={userState.loading}
                onInviteEmailChange={setInviteEmail}
                onInviteSubmit={handleInviteSubmit}
                owner={project.owner}
                users={userState.users}
              />
            )}
          </div>
        )}
        <div className="relative">
          <Button
            onClick={() => {
              setIsExportOpen((currentValue) => !currentValue);
              setIsShareOpen(false);
            }}
            variant="secondary"
            type="button"
          >
            <Download aria-hidden="true" size={17} />
            Export
          </Button>
          {isExportOpen && (
            <WorkspaceExportMenu
              onExport={(format) => {
                onExport?.(format);
                setIsExportOpen(false);
              }}
              options={exportOptions}
            />
          )}
        </div>
        <Button disabled={isSaving || !canEdit} onClick={onSave} type="button">
          <Save aria-hidden="true" size={17} />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </header>
  );
}
