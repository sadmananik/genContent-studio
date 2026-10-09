"use client";

import PageTitleIcon from "../common/PageTitleIcon";
import { UserRound } from "lucide-react";

import { useEffect, useState } from "react";
import Button from "../common/Button";
import ToastNotification, { TOAST_TYPES } from "../common/ToastNotification";
import { UserAvatar } from "../common/UserAvatar";
import { PROFILE_ALERTS } from "../../constants/notifications";
import { useAppStore } from "../../store";

export default function ProfileScreen() {
  const auth = useAppStore((state) => state.auth);
  const userState = useAppStore((state) => state.userState);
  const getUserProfile = useAppStore((state) => state.getUserProfile);
  const updateUserProfile = useAppStore((state) => state.updateUserProfile);
  const [formValues, setFormValues] = useState({ avatarUrl: "", name: "" });
  const [formError, setFormError] = useState("");
  const [notification, setNotification] = useState(null);
  const user = userState.profile || auth.user;
  const imageUrl =
    formValues.avatarUrl || user?.profile?.avatarUrl || user?.profile?.imageUrl || "";

  useEffect(() => {
    if (auth.token) {
      getUserProfile().catch(() => {});
    }
  }, [auth.token, getUserProfile]);

  useEffect(() => {
    setFormValues({
      avatarUrl: user?.profile?.avatarUrl || user?.profile?.imageUrl || "",
      name: user?.name || ""
    });
  }, [user?.name, user?.profile?.avatarUrl, user?.profile?.imageUrl]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({ ...currentValues, [name]: value }));
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const name = formValues.name.trim();
    const avatarUrl = formValues.avatarUrl.trim();

    if (name.length < 2) {
      setFormError(PROFILE_ALERTS.NAME_TOO_SHORT_MESSAGE);
      showNotification(
        PROFILE_ALERTS.NOT_SAVED_TITLE,
        PROFILE_ALERTS.NAME_TOO_SHORT_MESSAGE,
        TOAST_TYPES.WARNING
      );
      return;
    }

    try {
      await updateUserProfile({
        name,
        profile: {
          ...(user?.profile || {}),
          avatarUrl
        }
      });
      showNotification(
        PROFILE_ALERTS.UPDATED_TITLE,
        PROFILE_ALERTS.UPDATED_MESSAGE,
        TOAST_TYPES.SUCCESS
      );
    } catch (error) {
      showNotification(
        PROFILE_ALERTS.UPDATE_FAILED_TITLE,
        error.message || PROFILE_ALERTS.UPDATE_FAILED_MESSAGE,
        TOAST_TYPES.ERROR
      );
    }
  }

  function showNotification(title, message, type = TOAST_TYPES.INFO, duration = 5000) {
    setNotification({ duration, id: Date.now(), message, title, type });
  }

  return (
    <main className="min-w-0 p-5 md:p-7">
      <section className="mx-auto w-full max-w-5xl">
        <header className="mb-7 flex items-center gap-4">
          <PageTitleIcon icon={UserRound} />
          <div className="min-w-0">
            <h1 className="m-0 text-2xl font-bold text-slate-950">Profile</h1>
            <p className="mt-1.5 text-sm text-slate-500">View and update your account details.</p>
          </div>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div
              aria-hidden="true"
              className="h-24 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-400"
            />
            <div className="px-6 pb-6">
              <div className="-mt-10 mb-4 w-fit rounded-2xl bg-white p-1.5 shadow-sm">
                <UserAvatar
                  className="h-20 w-20 rounded-xl text-2xl"
                  user={{
                    ...user,
                    name: formValues.name || user?.name,
                    profile: { avatarUrl: imageUrl }
                  }}
                />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-slate-950">
                  {user?.name || "User"}
                </h2>
                <p className="mt-1 break-all text-sm text-slate-500">{user?.email}</p>
              </div>

              <p className="mt-5 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-500">
                Your profile appears in shared projects and team workspaces.
              </p>
            </div>
          </aside>

          <form
            className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7"
            onSubmit={handleSubmit}
          >
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-950">Personal details</h2>
              <p className="mt-1 text-sm text-slate-500">
                Make your profile recognisable to your collaborators.
              </p>
            </div>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Name
              <input
                className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                name="name"
                onChange={handleChange}
                value={formValues.name}
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Email
              <input
                className="min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-500"
                disabled
                value={user?.email || ""}
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Avatar image URL
              <input
                className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                name="avatarUrl"
                onChange={handleChange}
                placeholder="https://example.com/avatar.jpg"
                value={formValues.avatarUrl}
              />
            </label>

            {formError && <p className="text-sm font-bold text-red-600">{formError}</p>}
            {userState.error && <p className="text-sm font-bold text-red-600">{userState.error}</p>}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <p className="text-xs text-slate-500">Your changes apply across GenContent Studio.</p>
              <Button disabled={userState.loading} type="submit">
                {userState.loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </section>

      <ToastNotification
        duration={notification?.duration}
        key={notification?.id}
        message={notification?.message}
        onClose={() => setNotification(null)}
        title={notification?.title}
        type={notification?.type}
      />
    </main>
  );
}
