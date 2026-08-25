import { MailPlus } from "lucide-react";
import Button from "../common/Button";
import { UserAvatar } from "../common/UserAvatar";
import { SHARE_POPOVER_TEXT } from "../../constants/notifications";

export default function WorkspaceSharePopover({
  inviteEmail,
  invitedUsers = [],
  onInviteEmailChange,
  onInviteSubmit
}) {
  const hasInvitedUsers = invitedUsers.length > 0;

  return (
    <div className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white p-4 shadow-[0_18px_42px_rgba(15,23,42,0.16)]">
      <form className="grid gap-3" onSubmit={onInviteSubmit}>
        <label className="text-xs font-bold uppercase text-slate-500" htmlFor="invite-email">
          {SHARE_POPOVER_TEXT.INVITE_EMAIL_LABEL}
        </label>
        <div className="flex gap-2">
          <input
            className="min-h-10 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            id="invite-email"
            onChange={(event) => onInviteEmailChange(event.target.value)}
            placeholder={SHARE_POPOVER_TEXT.EMAIL_PLACEHOLDER}
            type="email"
            value={inviteEmail}
          />
          <Button type="submit">
            <MailPlus aria-hidden="true" size={17} />
            {SHARE_POPOVER_TEXT.INVITE_BUTTON}
          </Button>
        </div>
      </form>
      {hasInvitedUsers && (
        <div className="mt-4 grid gap-2">
          <p className="text-xs font-bold uppercase text-slate-500">
            {SHARE_POPOVER_TEXT.INVITED_COLLABORATORS_LABEL}
          </p>
          {invitedUsers.map((user) => (
            <div
              className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2"
              key={user.email || user.name}
            >
              <UserAvatar className="h-9 w-9" user={user} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {user.name || user.email}
                </p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
