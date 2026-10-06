import { render, screen, within, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TemplatesScreen from "../src/components/screens/TemplatesScreen";
import { useAppStore } from "../src/store";
import { resetStore, mockApi, template, project, deferred } from "./helpers";
import { mockRouter } from "./setup";

beforeEach(() => resetStore());
function setup(extra = {}) {
  const fetch = mockApi({
    "GET /api/templates": { body: [template] },
    "GET /api/templates/recent": { body: [] },
    "GET /api/templates/mine": { body: [template] },
    "GET /api/templates/favorites": { body: [] },
    ...extra
  });
  render(<TemplatesScreen />);
  return fetch;
}

async function loaded() {
  await screen.findByRole("heading", { name: template.title });
}

test("preview opens and closes without creating a project", async () => {
  const ui = userEvent.setup();
  const fetch = setup();
  await loaded();
  await ui.click(screen.getByRole("button", { name: "Preview" }));
  expect(within(screen.getByRole("dialog")).getByText("Reusable draft")).toBeVisible();
  await ui.click(within(screen.getByRole("dialog")).getAllByRole("button", { name: "Close" })[0]);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(fetch.mock.calls.some(([url]) => url.endsWith("/use"))).toBe(false);
});

test("upvote increases count, toggles off, then switches to downvote", async () => {
  const ui = userEvent.setup();
  let vote = null;
  setup({
    [`POST /api/templates/${template.id}/vote`]: (options) => {
      const requested = JSON.parse(options.body).voteType;
      vote = vote === requested ? null : requested;
      return {
        body: {
          upvoteCount: vote === "up" ? 1 : 0,
          downvoteCount: vote === "down" ? 1 : 0,
          currentUserVote: vote
        }
      };
    }
  });
  await loaded();
  const up = screen.getByRole("button", { name: `Upvote ${template.title}` });
  const down = screen.getByRole("button", { name: `Downvote ${template.title}` });
  await ui.click(up);
  await waitFor(() => expect(up).toHaveTextContent("1"));
  expect(up).toHaveAttribute("aria-pressed", "true");
  expect(useAppStore.getState().templateState.templates[0].currentUserVote).toBe("up");
  await ui.click(up);
  await waitFor(() => expect(up).toHaveTextContent("0"));
  expect(up).toHaveAttribute("aria-pressed", "false");
  await ui.click(up);
  await ui.click(down);
  await waitFor(() => expect(down).toHaveTextContent("1"));
  expect(up).toHaveTextContent("0");
  expect(down).toHaveAttribute("aria-pressed", "true");
});

test("vote button disables while pending and failed votes preserve counts", async () => {
  const ui = userEvent.setup();
  const pending = deferred();
  setup({ [`POST /api/templates/${template.id}/vote`]: () => pending.promise });
  await loaded();
  const up = screen.getByRole("button", { name: `Upvote ${template.title}` });
  await ui.click(up);
  expect(up).toBeDisabled();
  await act(async () => pending.resolve({ status: 500, body: { message: "Voting unavailable" } }));
  expect(await screen.findByText("Voting unavailable")).toBeVisible();
  expect(up).toBeEnabled();
  expect(up).toHaveTextContent("0");
  expect(up).toHaveAttribute("aria-pressed", "false");
});

test("favourite and unfavourite update the card and real store", async () => {
  const ui = userEvent.setup();
  setup({
    [`PUT /api/templates/${template.id}/favorite`]: { body: { isFavorite: true } },
    [`DELETE /api/templates/${template.id}/favorite`]: { body: { isFavorite: false } }
  });
  await loaded();
  await ui.click(screen.getByRole("button", { name: `Add ${template.title} to favorites` }));
  await ui.click(
    await screen.findByRole("button", { name: `Remove ${template.title} from favorites` })
  );
  expect(
    await screen.findByRole("button", { name: `Add ${template.title} to favorites` })
  ).toBeEnabled();
  expect(useAppStore.getState().templateState.templates[0].isFavorite).toBe(false);
});

test("cancel delete closes confirmation without a delete request", async () => {
  const ui = userEvent.setup();
  const fetch = setup();
  await ui.click(screen.getByRole("button", { name: "My Published Templates" }));
  await loaded();
  await ui.click(screen.getByRole("button", { name: "Delete", exact: true }));
  await ui.click(within(screen.getByRole("dialog")).getByRole("button", { name: /cancel|no/i }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(fetch.mock.calls.some(([, options]) => options.method === "DELETE")).toBe(false);
  expect(screen.getByRole("heading", { name: template.title })).toBeVisible();
});

test("confirmed deletion removes the template from the page", async () => {
  const ui = userEvent.setup();
  setup({ [`DELETE /api/templates/${template.id}`]: { body: { message: "Deleted" } } });
  await ui.click(screen.getByRole("button", { name: "My Published Templates" }));
  await loaded();
  await ui.click(screen.getByRole("button", { name: "Delete", exact: true }));
  await ui.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "Delete Template" })
  );
  await waitFor(() =>
    expect(screen.queryByRole("heading", { name: template.title })).not.toBeInTheDocument()
  );
  expect(useAppStore.getState().templateState.myTemplates).toEqual([]);
});

test("using a preview creates a project and navigates to the editor", async () => {
  const ui = userEvent.setup();
  setup({
    [`POST /api/templates/${template.id}/use`]: {
      body: { project, template: { id: template.id, useCount: 1 } }
    }
  });
  await loaded();
  await ui.click(screen.getByRole("button", { name: "Preview" }));
  await ui.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Use Template" }));
  await waitFor(() =>
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining(project._id))
  );
});
