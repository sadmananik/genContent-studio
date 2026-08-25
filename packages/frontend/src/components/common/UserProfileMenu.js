"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { UserAvatar as SharedUserAvatar, getInitials } from "./UserAvatar";

export function UserAvatar({ name = "", imageUrl }) {
  return (
    <SharedUserAvatar
      className="h-[34px] w-[34px]"
      user={{ name, profile: { avatarUrl: imageUrl } }}
    />
  );
}

export default function UserProfileMenu({ user, onLogout, onProfile }) {
  const profileRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const displayName = user?.name || "User";
  const imageUrl = user?.profile?.avatarUrl || user?.profile?.imageUrl;
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleProfile() {
    setIsOpen(false);
    onProfile?.();
  }

  return (
    <div className="relative w-full sm:w-auto" ref={profileRef}>
      <button
        className="flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white py-1 pl-1 pr-2 font-bold text-slate-950 sm:w-auto sm:justify-start"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {renderAvatar(displayName, imageUrl, initials)}
        <span className="max-w-36 truncate">{displayName}</span>
      </button>
      {isOpen && (
        <div
          className="absolute right-0 top-[calc(100%+0.625rem)] z-20 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_45px_rgba(31,41,55,0.08)] sm:w-[220px]"
          role="menu"
        >
          <div className="flex items-center gap-2.5 border-b border-slate-200 p-3.5">
            {renderAvatar(displayName, imageUrl, initials)}
            <strong>{displayName}</strong>
          </div>
          <button
            className="block w-full bg-white px-3.5 py-3 text-left text-sm text-slate-950 hover:bg-slate-50"
            type="button"
            role="menuitem"
            onClick={handleProfile}
          >
            Profile
          </button>
          <button
            className="block w-full bg-white px-3.5 py-3 text-left text-sm text-slate-950 hover:bg-slate-50"
            type="button"
            role="menuitem"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

function renderAvatar(displayName, imageUrl, initials) {
  return (
    <SharedUserAvatar
      className="h-[34px] w-[34px]"
      user={{ name: displayName || initials, profile: { avatarUrl: imageUrl } }}
    />
  );
}
