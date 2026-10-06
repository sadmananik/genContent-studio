import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileScreen from "../src/components/screens/ProfileScreen";
import SettingsScreen from "../src/components/screens/SettingsScreen";
import SharedWithMeScreen from "../src/components/screens/SharedWithMeScreen";
import FavoritesScreen from "../src/components/screens/FavoritesScreen";
import { useAppStore } from "../src/store";
import { resetStore, mockApi, user, project } from "./helpers";

beforeEach(() => resetStore());

test("profile changes are saved through the API and reflected in state", async () => {
  const ui = userEvent.setup();
  mockApi({
    "GET /api/users/me": { body: user },
    "PUT /api/users/me": { body: { ...user, name: "Updated Creator" } }
  });
  render(<ProfileScreen />);
  const input = await screen.findByDisplayValue(user.name);
  await ui.clear(input);
  await ui.type(input, "Updated Creator");
  await ui.click(screen.getByRole("button", { name: "Save Changes" }));
  expect(await screen.findByRole("heading", { name: "Updated Creator" })).toBeVisible();
  expect(useAppStore.getState().userState.profile.name).toBe("Updated Creator");
});

test("profile errors preserve entered values", async () => {
  const ui = userEvent.setup();
  mockApi({
    "GET /api/users/me": { body: user },
    "PUT /api/users/me": { status: 500, body: { message: "Profile unavailable" } }
  });
  render(<ProfileScreen />);
  const input = await screen.findByDisplayValue(user.name);
  await ui.clear(input);
  await ui.type(input, "Unsaved name");
  await ui.click(screen.getByRole("button", { name: "Save Changes" }));
  expect((await screen.findAllByText("Profile unavailable"))[0]).toBeVisible();
  expect(input).toHaveValue("Unsaved name");
});

test("settings password dialog can be cancelled without sending email", async () => {
  const ui = userEvent.setup();
  const fetch = mockApi({ "GET /api/users/me": { body: user } });
  render(<SettingsScreen />);
  await ui.click(screen.getByRole("button", { name: "Change Password" }));
  await ui.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(fetch.mock.calls.some(([, options]) => options.method === "POST")).toBe(false);
});

test("settings confirmation sends email and closes the dialog", async () => {
  const ui = userEvent.setup();
  mockApi({
    "GET /api/users/me": { body: user },
    "POST /api/auth/request-password-change": { body: { message: "Sent" } }
  });
  render(<SettingsScreen />);
  await ui.click(screen.getByRole("button", { name: "Change Password" }));
  await ui.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Send Email" }));
  expect(await screen.findByText("Password change email sent")).toBeVisible();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("changing theme updates the document", async () => {
  const ui = userEvent.setup();
  mockApi({ "GET /api/users/me": { body: user } });
  render(<SettingsScreen />);
  await ui.selectOptions(screen.getByRole("combobox"), "dark");
  expect(document.documentElement).toHaveAttribute("data-theme", "dark");
});

const shared = {
  ...project,
  owner: { id: "other-owner", name: "Other Owner" },
  isSharedWithCurrentUser: true,
  currentUserRole: "collaborator",
  accessLevel: "viewer",
  canManageSharing: false
};

test("shared-project details modal opens and closes", async () => {
  const ui = userEvent.setup();
  mockApi({ "GET /api/projects/shared": { body: [shared] } });
  render(<SharedWithMeScreen />);
  await ui.click(await screen.findByRole("button", { name: `${project.title} actions` }));
  await ui.click(screen.getByRole("menuitem", { name: "View Details" }));
  expect(
    within(screen.getByRole("dialog")).getByRole("heading", { name: project.title })
  ).toBeVisible();
  await ui.click(within(screen.getByRole("dialog")).getByRole("button", { name: /close/i }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("cancel leaving keeps shared project; confirm removes it", async () => {
  const ui = userEvent.setup();
  const fetch = mockApi({
    "GET /api/projects/shared": { body: [shared] },
    [`DELETE /api/projects/${project._id}/collaborators/me`]: { body: { message: "Left project" } }
  });
  render(<SharedWithMeScreen />);
  const open = async () => {
    await ui.click(await screen.findByRole("button", { name: `${project.title} actions` }));
    await ui.click(screen.getByRole("menuitem", { name: "Leave Project" }));
  };
  await open();
  await ui.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
  expect(fetch.mock.calls.some(([, options]) => options.method === "DELETE")).toBe(false);
  await open();
  await ui.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Leave Project" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: `${project.title} actions` })
    ).not.toBeInTheDocument()
  );
  expect(useAppStore.getState().projectState.sharedProjects).toEqual([]);
});

test("removing an AI favourite removes its card", async () => {
  const ui = userEvent.setup();
  const chat = {
    _id: "chat-1",
    project,
    prompt: "Write draft",
    response: "Favourite response",
    isFavourite: true,
    contentType: "text"
  };
  mockApi({
    "GET /api/templates/favorites": { body: [] },
    "GET /api/chats/favourites": { body: [chat] },
    "PATCH /api/chats/chat-1/favourite": { body: { ...chat, isFavourite: false } }
  });
  render(<FavoritesScreen />);
  await screen.findByText(chat.response);
  await ui.click(screen.getByRole("button", { name: /remove/i }));
  await waitFor(() => expect(screen.queryByText(chat.response)).not.toBeInTheDocument());
  expect(useAppStore.getState().aiState.favouriteResponses).toEqual([]);
});

test("Favorites loads saved templates and removing one clears its star in Browse", async () => {
  const ui = userEvent.setup();
  const template = {
    id: "template-1",
    title: "Saved template",
    projectType: "text",
    isFavorite: true,
    visibility: "public"
  };
  useAppStore.setState((state) => ({
    templateState: { ...state.templateState, templates: [template] }
  }));
  mockApi({
    "GET /api/chats/favourites": { body: [] },
    "GET /api/templates/favorites": { body: [template] },
    "DELETE /api/templates/template-1/favorite": { body: { message: "Removed" } }
  });
  render(<FavoritesScreen />);
  expect(await screen.findByRole("heading", { name: template.title })).toBeVisible();
  await ui.click(screen.getByRole("button", { name: "Remove Saved template from favorites" }));
  await waitFor(() =>
    expect(screen.queryByRole("heading", { name: template.title })).not.toBeInTheDocument()
  );
  expect(useAppStore.getState().templateState.templates[0].isFavorite).toBe(false);
});
