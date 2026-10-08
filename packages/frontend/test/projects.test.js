import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectsScreen from "../src/components/screens/ProjectsScreen";
import DashboardScreen from "../src/components/screens/DashboardScreen";
import { useAppStore } from "../src/store";
import { resetStore, mockApi, project } from "./helpers";
import { mockRouter } from "./setup";

beforeEach(() => resetStore());
function setup(extra = {}) {
  const fetch = mockApi({ "GET /api/projects": { body: [project] }, ...extra });
  render(<ProjectsScreen />);
  return fetch;
}
async function actions(ui) {
  await ui.click(await screen.findByRole("button", { name: `${project.title} actions` }));
}

test("create modal opens and cancel closes it without posting", async () => {
  const ui = userEvent.setup();
  const fetch = setup();
  await ui.click(screen.getByRole("button", { name: /create.*project/i }));
  expect(screen.getByRole("textbox", { name: /project title/i })).toBeVisible();
  await ui.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("textbox", { name: /project title/i })).not.toBeInTheDocument();
  expect(fetch.mock.calls.some(([, options]) => options.method === "POST")).toBe(false);
});

test("validates an empty title then creates a project and updates state", async () => {
  const ui = userEvent.setup();
  const fetch = setup({
    "POST /api/projects": {
      status: 201,
      body: { ...project, _id: "new-project-id", title: "New draft" }
    }
  });
  await ui.click(screen.getByRole("button", { name: /create.*project/i }));
  const title = screen.getByRole("textbox", { name: /project title/i });
  const form = title.closest("form");
  await ui.click(within(form).getByRole("button", { name: /create.*project/i }));
  expect(await screen.findByText(/title is required/i)).toBeVisible();
  expect(fetch.mock.calls.some(([, options]) => options.method === "POST")).toBe(false);
  await ui.type(title, "New draft");
  await ui.click(within(form).getByRole("button", { name: /create.*project/i }));
  await waitFor(() =>
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining("new-project-id"))
  );
  expect(useAppStore.getState().projectState.projects[0].title).toBe("New draft");
});

test("edit modal starts with project data and saves the new title", async () => {
  const ui = userEvent.setup();
  setup({ [`PUT /api/projects/${project._id}`]: { body: { ...project, title: "Renamed draft" } } });
  await actions(ui);
  await ui.click(screen.getByRole("menuitem", { name: "Edit" }));
  const input = screen.getByRole("textbox", { name: /project title/i });
  expect(input).toHaveValue(project.title);
  await ui.clear(input);
  await ui.type(input, "Renamed draft");
  await ui.click(within(input.closest("form")).getByRole("button", { name: /save/i }));
  expect(await screen.findByRole("button", { name: "Renamed draft actions" })).toBeVisible();
});

test("cancel delete preserves the project and makes no mutation request", async () => {
  const ui = userEvent.setup();
  const fetch = setup();
  await actions(ui);
  await ui.click(screen.getByRole("menuitem", { name: "Delete" }));
  await ui.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(fetch.mock.calls.some(([, options]) => options.method === "DELETE")).toBe(false);
});

test("confirmed deletion removes the project", async () => {
  const ui = userEvent.setup();
  setup({ [`DELETE /api/projects/${project._id}`]: { status: 204, body: null } });
  await actions(ui);
  await ui.click(screen.getByRole("menuitem", { name: "Delete" }));
  await ui.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "Delete Project" })
  );
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: `${project.title} actions` })
    ).not.toBeInTheDocument()
  );
  expect(useAppStore.getState().projectState.projects).toEqual([]);
});

test("failed deletion keeps the project and shows the server error", async () => {
  const ui = userEvent.setup();
  setup({
    [`DELETE /api/projects/${project._id}`]: {
      status: 500,
      body: { message: "Delete unavailable" }
    }
  });
  await actions(ui);
  await ui.click(screen.getByRole("menuitem", { name: "Delete" }));
  await ui.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "Delete Project" })
  );
  expect(await screen.findByText("Delete unavailable")).toBeVisible();
  expect(useAppStore.getState().projectState.projects).toHaveLength(1);
});

test("dashboard renders API projects", async () => {
  mockApi({ "GET /api/projects": { body: [project] } });
  render(<DashboardScreen />);
  expect((await screen.findAllByText(project.title))[0]).toBeVisible();
});

test("publish modal can be closed without publishing", async () => {
  const ui = userEvent.setup();
  const fetch = setup({ [`GET /api/projects/${project._id}/chats`]: { body: [] } });
  await actions(ui);
  await ui.click(screen.getByRole("menuitem", { name: "Publish as Template" }));
  const dialog = await screen.findByRole("dialog");
  await ui.click(within(dialog).getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(fetch.mock.calls.some(([, options]) => options.method === "POST")).toBe(false);
});

test("publish submits selected visibility and closes after success", async () => {
  const ui = userEvent.setup();
  const fetch = setup({
    [`GET /api/projects/${project._id}/chats`]: { body: [] },
    [`POST /api/templates/projects/${project._id}`]: {
      status: 201,
      body: { id: "new-template", title: project.title, visibility: "public" }
    }
  });
  await actions(ui);
  await ui.click(screen.getByRole("menuitem", { name: "Publish as Template" }));
  const dialog = await screen.findByRole("dialog");
  await ui.click(within(dialog).getByRole("radio", { name: "Public" }));
  await ui.click(within(dialog).getByRole("button", { name: "Publish Template" }));
  expect(await screen.findByText("Template published")).toBeVisible();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  const call = fetch.mock.calls.find(([, options]) => options.method === "POST");
  expect(JSON.parse(call[1].body)).toMatchObject({
    title: `${project.title} Template`,
    visibility: "public"
  });
});

test("recent projects are ordered by activity and search filters both project sections", async () => {
  const ui = userEvent.setup();
  const newest = {
    ...project,
    _id: "newest",
    title: "Visual campaign",
    type: "image",
    updatedAt: "2026-09-01T00:00:00Z"
  };
  setup({ "GET /api/projects": { body: [project, newest] } });
  const recent = await screen.findByRole("region", { name: "Recent projects" });
  expect(within(recent).getAllByRole("link")[0]).toHaveTextContent("Visual campaign");
  await ui.type(screen.getByRole("searchbox", { name: "Search Projects" }), "visual");
  expect(screen.queryByText(project.title)).not.toBeInTheDocument();
  expect(screen.getAllByText("Visual campaign")).toHaveLength(2);
  await ui.clear(screen.getByRole("searchbox"));
  await ui.type(screen.getByRole("searchbox"), "no-match");
  expect(screen.getByText("No matching projects")).toBeVisible();
});

test("starring a project updates both recent and all cards", async () => {
  const ui = userEvent.setup();
  setup({
    [`PATCH /api/projects/${project._id}/favorite`]: { body: { ...project, isFavorite: true } }
  });
  const buttons = await screen.findAllByRole("button", {
    name: `Add ${project.title} to favorites`
  });
  await ui.click(buttons[0]);
  await waitFor(() =>
    expect(
      screen.getAllByRole("button", { name: `Remove ${project.title} from favorites` })
    ).toHaveLength(2)
  );
  expect(useAppStore.getState().projectState.favoriteProjects).toHaveLength(1);
});
