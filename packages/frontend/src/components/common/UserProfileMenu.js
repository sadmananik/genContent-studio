"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";
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
        className={`flex min-h-10 w-full items-center justify-between gap-2 rounded-md border bg-white py-1 pl-1 pr-2 font-bold text-slate-950 shadow-sm transition hover:border-violet-300 hover:bg-violet-50/70 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-100 sm:w-auto sm:justify-start ${
          isOpen ? "border-violet-300 bg-violet-50/70 text-violet-700" : "border-slate-200"
        }`}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {renderAvatar(displayName, imageUrl, initials)}
        <span className="max-w-36 truncate">{displayName}</span>
        <ChevronDown
          aria-hidden="true"
          className={`text-slate-400 transition ${isOpen ? "rotate-180 text-violet-600" : ""}`}
          size={16}
        />
      </button>
      {isOpen && (
        <div
          className="absolute right-0 top-[calc(100%+0.625rem)] z-20 w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5 shadow-[0_18px_42px_rgba(15,23,42,0.16)] sm:w-[220px]"
          role="menu"
        >
          <div className="mb-1 flex items-center gap-2.5 border-b border-slate-100 px-2 py-2.5">
            {renderAvatar(displayName, imageUrl, initials)}
            <strong className="min-w-0 truncate text-sm text-slate-950">{displayName}</strong>
          </div>
          <button
            className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-100"
            type="button"
            role="menuitem"
            onClick={handleProfile}
          >
            <User aria-hidden="true" size={16} />
            Profile
          </button>
          <button
            className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-100"
            type="button"
            role="menuitem"
            onClick={onLogout}
          >
            <LogOut aria-hidden="true" size={16} />
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
