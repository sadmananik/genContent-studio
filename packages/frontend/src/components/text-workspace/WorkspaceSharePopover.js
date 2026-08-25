import { MailPlus, UserPlus } from "lucide-react";
import Button from "../common/Button";
import { UserAvatar } from "../common/UserAvatar";
import { SHARE_POPOVER_TEXT } from "../../constants/notifications";

export default function WorkspaceSharePopover({
  excludedEmails = [],
  inviteEmail,
  invitedUsers = [],
  isLoadingUsers = false,
  onInviteEmailChange,
  onInviteSubmit,
  users = []
}) {
  const hasInvitedUsers = invitedUsers.length > 0;
  const trimmedEmail = inviteEmail.trim().toLowerCase();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const invitedEmails = new Set(
    invitedUsers.map((user) => user.email?.toLowerCase()).filter(Boolean)
  );
  const hiddenEmails = new Set(excludedEmails.map((email) => email?.toLowerCase()).filter(Boolean));
  const matchingUsers = users
    .filter((user) => {
      const email = user.email?.toLowerCase() || "";

      return isValidEmail && !hiddenEmails.has(email) && email === trimmedEmail;
    })
    .slice(0, 3);
  const hasMatchingUsers = matchingUsers.length > 0;

  function submitInvite(email) {
    return (event) => {
      event.preventDefault();
      onInviteEmailChange(email);
      onInviteSubmit?.(event, email);
    };
  }

  return (
    <div className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white p-4 shadow-[0_18px_42px_rgba(15,23,42,0.16)]">
      <form className="grid gap-3" onSubmit={onInviteSubmit}>
        <label className="text-xs font-bold uppercase text-slate-500" htmlFor="invite-email">
          {SHARE_POPOVER_TEXT.INVITE_EMAIL_LABEL}
        </label>
        <input
          className="min-h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          id="invite-email"
          onChange={(event) => onInviteEmailChange(event.target.value)}
          placeholder={SHARE_POPOVER_TEXT.EMAIL_PLACEHOLDER}
          type="email"
          value={inviteEmail}
        />
      </form>
      {isLoadingUsers && (
        <p className="mt-3 text-xs font-medium text-slate-500">
          {SHARE_POPOVER_TEXT.SEARCHING_USERS}
        </p>
      )}
      {hasMatchingUsers && (
        <div className="mt-4 grid gap-2">
          <p className="text-xs font-bold uppercase text-slate-500">
            {SHARE_POPOVER_TEXT.MATCHING_ACCOUNT_LABEL}
          </p>
          {matchingUsers.map((user) => {
            const isInvited = invitedEmails.has(user.email?.toLowerCase());

            return (
              <div
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                key={user._id || user.id || user.email}
              >
                <UserAvatar className="h-9 w-9" user={user} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {user.name || user.email}
                  </p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
                <Button
                  className="px-2.5"
                  disabled={isInvited}
                  onClick={submitInvite(user.email)}
                  type="button"
                >
                  <UserPlus aria-hidden="true" size={16} />
                  {SHARE_POPOVER_TEXT.INVITE_BUTTON}
                </Button>
              </div>
            );
          })}
        </div>
      )}
      {isValidEmail && !hasMatchingUsers && (
        <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
            <UserAvatar className="h-9 w-9" user={{ email: trimmedEmail }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">{trimmedEmail}</p>
              <p className="text-xs text-slate-500">{SHARE_POPOVER_TEXT.CREATE_ACCOUNT_HINT}</p>
            </div>
          </div>
          <Button className="mt-3 w-full" onClick={submitInvite(trimmedEmail)} type="button">
            <MailPlus aria-hidden="true" size={17} />
            {SHARE_POPOVER_TEXT.INVITE_TYPED_EMAIL_LABEL}
          </Button>
        </div>
      )}
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
