import { cn } from "../../lib/styles";

export function UserAvatar({ className = "", user }) {
  const label = user?.email || user?.name || "User";

  return (
    <span
      aria-label={label}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full bg-violet-100 text-xs font-extrabold text-violet-700",
        className
      )}
      title={label}
    >
      {getInitials(user?.name || user?.email)}
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
        <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-slate-200 text-xs font-extrabold text-slate-700">
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
