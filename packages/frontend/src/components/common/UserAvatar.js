import { cn } from "../../lib/styles";

export function UserAvatar({ className = "", user }) {
  const label = user?.name || user?.email || "User";
  const tooltipLabel = user?.tooltipLabel || label;
  const imageUrl = user?.profile?.avatarUrl || user?.profile?.imageUrl || user?.avatarUrl || "";

  if (imageUrl) {
    return (
      <span className="group/avatar relative inline-flex hover:z-20">
        <img
          alt={label}
          className={cn(
            "grid h-8 w-8 place-items-center rounded-full bg-violet-100 object-cover text-xs font-extrabold text-violet-700 transition hover:z-10 hover:ring-2 hover:ring-violet-300",
            className
          )}
          src={imageUrl}
        />
        <AvatarTooltip label={tooltipLabel} />
      </span>
    );
  }

  return (
    <span className="group/avatar relative inline-flex hover:z-20">
      <span
        aria-label={label}
        className={cn(
          "grid h-8 w-8 place-items-center rounded-full bg-violet-100 text-xs font-extrabold text-violet-700 transition hover:z-10 hover:ring-2 hover:ring-violet-300",
          className
        )}
      >
        {getInitials(user?.name || user?.email)}
      </span>
      <AvatarTooltip label={tooltipLabel} />
    </span>
  );
}

function AvatarTooltip({ label }) {
  return (
    <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover/avatar:opacity-100">
      {label}
    </span>
  );
}

export function UserAvatarStack({ max = 4, users = [] }) {
  const visibleUsers = users.slice(0, max);
  const remainingUsers = users.length - visibleUsers.length;

  return (
    <div className="flex -space-x-2">
      {visibleUsers.map((user) => (
        <UserAvatar className="border-2 border-white" key={user.email || user.name} user={user} />
      ))}
      {remainingUsers > 0 && (
        <span
          className="grid h-8 w-8 cursor-help place-items-center rounded-full border-2 border-white bg-slate-200 text-xs font-extrabold text-slate-700 transition hover:z-10 hover:bg-violet-100 hover:text-violet-700 hover:ring-2 hover:ring-violet-300"
          title={`${remainingUsers} more active collaborator${remainingUsers === 1 ? "" : "s"}`}
        >
          +{remainingUsers}
        </span>
      )}
    </div>
  );
}

export function getInitials(value = "") {
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
