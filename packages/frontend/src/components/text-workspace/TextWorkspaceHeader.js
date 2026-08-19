"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileText, MailPlus, Save, Share2, Users } from "lucide-react";
import Button from "../common/Button";
import { ROUTES } from "../../constants/navigation";

export default function TextWorkspaceHeader({
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
  const visibleUsers = invitedUsers.slice(0, 4);
  const remainingUsers = invitedUsers.length - visibleUsers.length;

  function handleInviteSubmit(event) {
    event.preventDefault();
    const invited = onInviteUser?.(inviteEmail);

    if (invited) {
      setInviteEmail("");
    }
  }

  return (
    <header className="relative flex flex-wrap items-center gap-4 border-b border-slate-200 bg-white px-5 py-4 lg:px-7">
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
        <div className="flex min-h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-2">
          <Users aria-hidden="true" className="mr-2 text-slate-500" size={17} />
          <div className="flex -space-x-2">
            {visibleUsers.map((user) => (
              <span
                aria-label={user.email || user.name}
                className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-violet-100 text-xs font-extrabold text-violet-700"
                key={user.email || user.name}
                title={user.email || user.name}
              >
                {getInitials(user.name || user.email)}
              </span>
            ))}
            {remainingUsers > 0 && (
              <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-slate-200 text-xs font-extrabold text-slate-700">
                +{remainingUsers}
              </span>
            )}
          </div>
        </div>
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
            <div className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white p-4 shadow-[0_18px_42px_rgba(15,23,42,0.16)]">
              <form className="grid gap-3" onSubmit={handleInviteSubmit}>
                <label
                  className="text-xs font-bold uppercase text-slate-500"
                  htmlFor="invite-email"
                >
                  Invite by email
                </label>
                <div className="flex gap-2">
                  <input
                    className="min-h-10 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    id="invite-email"
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="teammate@example.com"
                    type="email"
                    value={inviteEmail}
                  />
                  <Button type="submit">
                    <MailPlus aria-hidden="true" size={17} />
                    Invite
                  </Button>
                </div>
              </form>
              <div className="mt-4 grid gap-2">
                <p className="text-xs font-bold uppercase text-slate-500">Already invited</p>
                {invitedUsers.map((user) => (
                  <div
                    className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2"
                    key={user.email || user.name}
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-violet-100 text-xs font-extrabold text-violet-700">
                      {getInitials(user.name || user.email)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {user.name || user.email}
                      </p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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
            <div className="absolute right-0 z-20 mt-2 grid w-44 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-[0_18px_42px_rgba(15,23,42,0.16)]">
              <button
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  onExport?.("txt");
                  setIsExportOpen(false);
                }}
                type="button"
              >
                <FileText aria-hidden="true" size={17} />
                Text file
              </button>
              <button
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  onExport?.("pdf");
                  setIsExportOpen(false);
                }}
                type="button"
              >
                <FileText aria-hidden="true" size={17} />
                PDF file
              </button>
            </div>
          )}
        </div>
        <Button disabled={isSaving} onClick={onSave} type="button">
          <Save aria-hidden="true" size={17} />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </header>
  );
}

function getInitials(value = "") {
  const parts = value
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
