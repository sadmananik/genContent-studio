"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "../common/Button";
import { UserAvatar, getInitials } from "../common/UserProfileMenu";
import { useAppStore } from "../../store";

const initialFormValues = {
  name: "",
  avatarUrl: "",
  role: "",
  bio: ""
};

export default function ProfileScreen() {
  const auth = useAppStore((state) => state.auth);
  const userState = useAppStore((state) => state.userState);
  const getUserProfile = useAppStore((state) => state.getUserProfile);
  const updateUserProfile = useAppStore((state) => state.updateUserProfile);
  const user = userState.profile || auth.user;
  const [formValues, setFormValues] = useState(initialFormValues);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (auth.token) {
      getUserProfile().catch(() => {});
    }
  }, [auth.token, getUserProfile]);

  useEffect(() => {
    if (user) {
      setFormValues({
        name: user.name || "",
        avatarUrl: user.profile?.avatarUrl || "",
        role: user.profile?.role || "",
        bio: user.profile?.bio || ""
      });
    }
  }, [user]);

  const initials = useMemo(
    () => getInitials(formValues.name || user?.name),
    [formValues.name, user]
  );
  const isLoading = userState.loading && !user;
  const isSaving = userState.loading && Boolean(user);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({ ...currentValues, [name]: value }));
    setFormError("");
    setSuccessMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const name = formValues.name.trim();

    if (name.length < 2) {
      setFormError("Name must be at least 2 characters.");
      return;
    }

    try {
      await updateUserProfile({
        name,
        profile: {
          avatarUrl: formValues.avatarUrl,
          role: formValues.role,
          bio: formValues.bio
        }
      });
      setSuccessMessage("Profile updated successfully.");
    } catch (error) {
      setFormError(error.message || "Profile could not be updated.");
    }
  }

  return (
    <main className="min-w-0 p-5 md:p-7">
      <header className="-m-5 mb-6 border-b border-slate-200 p-5 md:-m-7 md:mb-7 md:p-7">
        <h1 className="m-0 text-2xl font-bold text-slate-950">Profile</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          View and update your basic account information.
        </p>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(260px,0.7fr)_minmax(360px,1.3fr)]">
        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_22px_rgba(16,24,40,0.04)]">
          {isLoading ? (
            <div className="grid gap-3">
              <div className="h-16 w-16 rounded-full bg-slate-100" />
              <div className="h-5 w-36 rounded bg-slate-100" />
              <div className="h-4 w-48 rounded bg-slate-100" />
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="flex items-center gap-4">
                <UserAvatar imageUrl={formValues.avatarUrl} name={formValues.name} />
                <div className="min-w-0">
                  <strong className="block truncate text-lg text-slate-950">
                    {formValues.name || "User"}
                  </strong>
                  <span className="text-sm text-slate-500">{user?.email || "No email"}</span>
                </div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <span className="text-xs font-bold uppercase text-slate-500">Initials</span>
                <strong className="mt-1 block text-2xl text-slate-950">{initials}</strong>
              </div>
              {formValues.role && (
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <span className="text-xs font-bold uppercase text-slate-500">Role</span>
                  <strong className="mt-1 block text-sm text-slate-950">{formValues.role}</strong>
                </div>
              )}
            </div>
          )}
        </aside>

        <form
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_10px_22px_rgba(16,24,40,0.04)]"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="text-sm font-bold text-slate-800" htmlFor="profile-name">
              Full name
            </label>
            <input
              className="mt-2 min-h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              id="profile-name"
              maxLength={80}
              name="name"
              onChange={handleChange}
              required
              value={formValues.name}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-800" htmlFor="profile-email">
              Email address
            </label>
            <input
              className="mt-2 min-h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
              disabled
              id="profile-email"
              value={user?.email || ""}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-800" htmlFor="profile-avatar">
              Avatar URL
            </label>
            <input
              className="mt-2 min-h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              id="profile-avatar"
              maxLength={300}
              name="avatarUrl"
              onChange={handleChange}
              placeholder="https://example.com/avatar.png"
              value={formValues.avatarUrl}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-800" htmlFor="profile-role">
              Role
            </label>
            <input
              className="mt-2 min-h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              id="profile-role"
              maxLength={80}
              name="role"
              onChange={handleChange}
              placeholder="Content Strategist"
              value={formValues.role}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-800" htmlFor="profile-bio">
              Bio
            </label>
            <textarea
              className="mt-2 min-h-28 w-full resize-y rounded-md border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              id="profile-bio"
              maxLength={240}
              name="bio"
              onChange={handleChange}
              placeholder="A short profile note."
              value={formValues.bio}
            />
          </div>

          {(formError || userState.error) && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError || userState.error}
            </p>
          )}
          {successMessage && (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {successMessage}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <Button disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
