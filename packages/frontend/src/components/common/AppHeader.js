"use client";

import { useRouter } from "next/navigation";
import UserProfileMenu from "./UserProfileMenu";
import { ROUTES } from "../../constants/navigation";
import { useAppStore } from "../../store";

export default function AppHeader() {
  const router = useRouter();
  const auth = useAppStore((state) => state.auth);
  const userState = useAppStore((state) => state.userState);
  const logoutUser = useAppStore((state) => state.logoutUser);
  const user = userState.profile || auth.user;

  function handleLogout() {
    logoutUser();
    router.push(ROUTES.LOGIN);
  }

  function handleProfile() {
    router.push(ROUTES.PROFILE);
  }

  function handleSettings() {
    router.push(ROUTES.SETTINGS);
  }

  return (
    <header className="flex min-h-[73px] items-center justify-end border-b border-slate-200 bg-white px-5 py-4 md:px-7">
      <UserProfileMenu
        user={user}
        onLogout={handleLogout}
        onProfile={handleProfile}
        onSettings={handleSettings}
      />
    </header>
  );
}
