import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AIPromptPanel from "../src/components/text-workspace/AIPromptPanel";
import UserProfileMenu from "../src/components/common/UserProfileMenu";
import { mockApi, resetStore, user } from "./helpers";
import { useAppStore } from "../src/store";

beforeEach(() => resetStore());

// A small host supplies the panel's controlled props; generation uses the real store/API client.
function PromptHost() {
  const [prompt, setPrompt] = useState("");
  const { loading, error, textResponse } = useAppStore((state) => state.aiState);
  const generate = useAppStore((state) => state.generateTextFromPrompt);
  return (
    <>
      <AIPromptPanel
        prompt={prompt}
        onPromptChange={setPrompt}
        isGenerating={loading}
        error={error}
        onGenerate={() => generate({ prompt }).catch(() => {})}
      />
      {textResponse && <p>{textResponse.text}</p>}
    </>
  );
}

test("prompt panel blocks empty requests and renders a generated response", async () => {
  const ui = userEvent.setup();
  const fetch = mockApi({ "POST /api/ai/generate-text": { body: { text: "Generated draft" } } });
  render(<PromptHost />);
  expect(screen.getByRole("button", { name: /generate/i })).toBeDisabled();
  await ui.type(screen.getByRole("textbox"), "Write a draft");
  await ui.click(screen.getByRole("button", { name: /generate/i }));
  expect(await screen.findByText("Generated draft")).toBeVisible();
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ prompt: "Write a draft" });
});

test("prompt panel displays generation errors and permits retry", async () => {
  const ui = userEvent.setup();
  mockApi({ "POST /api/ai/generate-text": { status: 502, body: { message: "AI unavailable" } } });
  render(<PromptHost />);
  await ui.type(screen.getByRole("textbox"), "Write a draft");
  await ui.click(screen.getByRole("button", { name: /generate/i }));
  expect(await screen.findByText("AI unavailable")).toBeVisible();
  expect(screen.getByRole("button", { name: /generate/i })).toBeEnabled();
});

test("quick-action style menu opens, selects a style, and closes", async () => {
  const ui = userEvent.setup();
  const onQuickAction = jest.fn();
  render(
    <AIPromptPanel
      prompt="Draft"
      actions={[{ id: "tone", label: "Change tone", styles: ["Formal", "Friendly"] }]}
      onQuickAction={onQuickAction}
    />
  );
  await ui.click(screen.getByRole("button", { name: /change tone/i }));
  expect(screen.getByRole("menu")).toBeVisible();
  await ui.click(screen.getByRole("menuitem", { name: "Formal" }));
  expect(onQuickAction).toHaveBeenCalled();
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
});

test("clicking outside the profile menu dismisses it", async () => {
  const ui = userEvent.setup();
  render(
    <>
      <UserProfileMenu user={user} />
      <button>Outside</button>
    </>
  );
  await ui.click(screen.getByRole("button", { name: new RegExp(user.name) }));
  expect(screen.getByRole("menu")).toBeVisible();
  await ui.click(screen.getByRole("button", { name: "Outside" }));
  await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
});
