"use client";

import { useEffect, useState } from "react";
import Button from "../common/Button";
import ToastNotification, { TOAST_TYPES } from "../common/ToastNotification";
import { getInitials } from "../common/UserProfileMenu";
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
      setFormError("Name must be at least 2 characters.");
      showNotification(
        "Profile not saved",
        "Name must be at least 2 characters.",
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
      showNotification("Profile updated", "Your profile changes were saved.", TOAST_TYPES.SUCCESS);
    } catch (error) {
      showNotification(
        "Update failed",
        error.message || "Profile could not be updated.",
        TOAST_TYPES.ERROR
      );
    }
  }

  function showNotification(title, message, type = TOAST_TYPES.INFO, duration = 5000) {
    setNotification({ duration, id: Date.now(), message, title, type });
  }

  return (
    <main className="grid min-h-[calc(100vh-3.5rem)] min-w-0 place-items-center p-5 md:p-7">
      <section className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_22px_rgba(16,24,40,0.04)]">
        <header className="mb-6 text-center">
          <h1 className="m-0 text-2xl font-bold text-slate-950">Profile</h1>
          <p className="mt-1.5 text-sm text-slate-500">View and update your account details.</p>
        </header>

        <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 pb-5">
          {imageUrl ? (
            <img alt="" className="h-16 w-16 rounded-full object-cover" src={imageUrl} />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-emerald-900 to-violet-600 text-lg font-extrabold text-white">
              {getInitials(formValues.name)}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-slate-950">{user?.name || "User"}</h2>
            <p className="truncate text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Name
            <input
              className="min-h-11 rounded-md border border-slate-200 px-3 text-sm font-medium outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              name="name"
              onChange={handleChange}
              value={formValues.name}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Email
            <input
              className="min-h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-500"
              disabled
              value={user?.email || ""}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Avatar image URL
            <input
              className="min-h-11 rounded-md border border-slate-200 px-3 text-sm font-medium outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              name="avatarUrl"
              onChange={handleChange}
              placeholder="https://example.com/avatar.jpg"
              value={formValues.avatarUrl}
            />
          </label>

          {formError && <p className="text-sm font-bold text-red-600">{formError}</p>}
          {userState.error && <p className="text-sm font-bold text-red-600">{userState.error}</p>}

          <div className="flex justify-end">
            <Button disabled={userState.loading} type="submit">
              {userState.loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
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
