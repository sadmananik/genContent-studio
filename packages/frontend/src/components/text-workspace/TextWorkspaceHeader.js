"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Save, Share2, ShieldCheck, Users } from "lucide-react";
import AppModal from "../common/AppModal";
import Button from "../common/Button";
import { TOAST_TYPES } from "../common/ToastNotification";
import { UserAvatar, UserAvatarStack } from "../common/UserAvatar";
import { ACCESS_LEVEL_LABELS, ACCESS_LEVELS } from "../../constants/content";
import { ROUTES } from "../../constants/navigation";
import { SHARE_POPOVER_TEXT } from "../../constants/notifications";
import { useAppStore } from "../../store";
import WorkspaceExportMenu from "./WorkspaceExportMenu";
import WorkspaceSharePopover from "./WorkspaceSharePopover";

export default function TextWorkspaceHeader({
  canEdit = true,
  canManageSharing = true,
  exportOptions,
  invitedUsers = [],
  onBackToProjects,
  onExport,
  onInviteUser,
  onNotify,
  onProjectUpdated,
  isSaving,
  onSave,
  project,
  statusLabel
}) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteAccessLevel, setInviteAccessLevel] = useState(ACCESS_LEVELS.EDITOR);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [permissionDrafts, setPermissionDrafts] = useState({});
  const [isShareOpen, setIsShareOpen] = useState(false);
  const auth = useAppStore((state) => state.auth);
  const listUsers = useAppStore((state) => state.listUsers);
  const projectState = useAppStore((state) => state.projectState);
  const updateProject = useAppStore((state) => state.updateProject);
  const userState = useAppStore((state) => state.userState);
  const owner = project.owner || auth.user;
  const collaboratorAccess = buildCollaboratorAccessMap(project);

  useEffect(() => {
    if (isShareOpen && userState.users.length === 0 && !userState.loading) {
      listUsers().catch(() => {});
    }
  }, [isShareOpen, listUsers, userState.loading, userState.users.length]);

  async function handleInviteSubmit(event, emailOverride) {
    event.preventDefault();
    const invited = await onInviteUser?.(emailOverride || inviteEmail, inviteAccessLevel);

    if (invited) {
      setInviteEmail("");
    }
  }

  function openPermissionsModal() {
    setPermissionDrafts(
      invitedUsers.reduce((drafts, user) => {
        drafts[getUserId(user)] = user.accessLevel || ACCESS_LEVELS.EDITOR;
        return drafts;
      }, {})
    );
    setIsPermissionsOpen(true);
    setIsShareOpen(false);
    setIsExportOpen(false);
  }

  function handlePermissionChange(userId, accessLevel) {
    setPermissionDrafts((currentDrafts) => {
      if (currentDrafts[userId] === accessLevel) {
        return currentDrafts;
      }

      onNotify?.(
        SHARE_POPOVER_TEXT.PERMISSION_CHANGED_TITLE,
        SHARE_POPOVER_TEXT.PERMISSION_CHANGED_MESSAGE,
        TOAST_TYPES.INFO,
        3000
      );

      return { ...currentDrafts, [userId]: accessLevel };
    });
  }

  function handleRemovePermission(userId) {
    setPermissionDrafts((currentDrafts) => {
      if (!currentDrafts[userId]) {
        return currentDrafts;
      }

      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[userId];
      onNotify?.(
        SHARE_POPOVER_TEXT.PERMISSION_REMOVED_TITLE,
        SHARE_POPOVER_TEXT.PERMISSION_REMOVED_MESSAGE,
        TOAST_TYPES.WARNING,
        3000
      );
      return nextDrafts;
    });
  }

  async function handleSavePermissions() {
    try {
      const collaboratorIds = invitedUsers
        .map(getUserId)
        .filter((userId) => permissionDrafts[userId]);
      const collaboratorPermissions = collaboratorIds.map((userId) => ({
        accessLevel: permissionDrafts[userId],
        user: userId
      }));
      const updatedProject = await updateProject(project.id || project._id, {
        collaborators: collaboratorIds,
        collaboratorPermissions
      });
      onProjectUpdated?.(updatedProject);
      setIsPermissionsOpen(false);
      onNotify?.(
        SHARE_POPOVER_TEXT.PERMISSIONS_UPDATED_TITLE,
        SHARE_POPOVER_TEXT.PERMISSIONS_UPDATED_MESSAGE,
        TOAST_TYPES.SUCCESS
      );
    } catch (error) {
      onNotify?.(
        SHARE_POPOVER_TEXT.PERMISSIONS_UPDATE_FAILED_TITLE,
        error.message || SHARE_POPOVER_TEXT.PERMISSIONS_UPDATE_FAILED_MESSAGE,
        TOAST_TYPES.ERROR
      );
    }
  }

  return (
    <header className="relative flex flex-wrap items-center gap-4 border-b border-slate-200 bg-white px-5 py-4 lg:px-7">
      {onBackToProjects ? (
        <button
          className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          onClick={onBackToProjects}
          type="button"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Projects
        </button>
      ) : (
        <Link
          className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          href={ROUTES.PROJECTS}
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Projects
        </Link>
      )}

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
        <div className="flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2">
          <Users aria-hidden="true" className="mr-2 text-slate-500" size={17} />
          <UserAvatarStack users={invitedUsers} />
          {canManageSharing && (
            <button
              className="rounded-md px-2 py-1 text-sm font-bold text-slate-600 hover:bg-white hover:text-violet-700"
              onClick={openPermissionsModal}
              type="button"
            >
              {SHARE_POPOVER_TEXT.MANAGE_PERMISSIONS_BUTTON}
            </button>
          )}
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
                inviteAccessLevel={inviteAccessLevel}
                inviteEmail={inviteEmail}
                invitedUsers={invitedUsers}
                isLoadingUsers={userState.loading}
                onInviteAccessLevelChange={setInviteAccessLevel}
                onInviteEmailChange={setInviteEmail}
                onInviteSubmit={handleInviteSubmit}
                owner={owner}
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
      {isPermissionsOpen && (
        <AppModal
          action={SHARE_POPOVER_TEXT.SAVE_PERMISSIONS}
          description={SHARE_POPOVER_TEXT.MANAGE_PERMISSIONS_DESCRIPTION}
          isWorking={projectState.loading}
          onAction={handleSavePermissions}
          onClose={() => setIsPermissionsOpen(false)}
          title={SHARE_POPOVER_TEXT.MANAGE_PERMISSIONS_TITLE}
          workingLabel={SHARE_POPOVER_TEXT.SAVING_PERMISSIONS}
        >
          <div className="grid gap-3">
            <PermissionRow owner role={SHARE_POPOVER_TEXT.OWNER_ROLE} user={owner} />
            {invitedUsers.map((user) => {
              const userId = getUserId(user);
              const selectedAccessLevel =
                permissionDrafts[userId] || collaboratorAccess[userId] || ACCESS_LEVELS.EDITOR;

              if (!permissionDrafts[userId]) {
                return null;
              }

              return (
                <PermissionRow
                  accessLevel={selectedAccessLevel}
                  key={userId}
                  onAccessLevelChange={(accessLevel) => handlePermissionChange(userId, accessLevel)}
                  onRemove={() => handleRemovePermission(userId)}
                  user={user}
                />
              );
            })}
          </div>
        </AppModal>
      )}
    </header>
  );
}

function PermissionRow({ accessLevel, onAccessLevelChange, onRemove, owner = false, role, user }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <UserAvatar className="h-10 w-10" user={user} />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-900">{user?.name || user?.email}</p>
        <p className="truncate text-xs text-slate-500">{user?.email}</p>
      </div>
      {owner ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">
          <ShieldCheck aria-hidden="true" size={14} />
          {role}
        </span>
      ) : (
        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm font-bold text-slate-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            onChange={(event) => onAccessLevelChange(event.target.value)}
            value={accessLevel}
          >
            <option value={ACCESS_LEVELS.EDITOR}>{SHARE_POPOVER_TEXT.PROJECT_ROLE_EDITOR}</option>
            <option value={ACCESS_LEVELS.VIEWER}>{SHARE_POPOVER_TEXT.PROJECT_ROLE_VIEWER}</option>
          </select>
          <Button onClick={onRemove} type="button" variant="secondary">
            {SHARE_POPOVER_TEXT.REMOVE_USER}
          </Button>
        </div>
      )}
    </div>
  );
}

function buildCollaboratorAccessMap(project) {
  return (project.collaboratorPermissions || []).reduce((accessMap, permission) => {
    accessMap[String(permission.user?._id || permission.user)] = permission.accessLevel;
    return accessMap;
  }, {});
}

function getUserId(user) {
  return String(user?._id || user?.id || user?.email || "");
}
