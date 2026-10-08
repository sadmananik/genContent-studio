import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import QuickCreateProject from "../src/components/dashboard/QuickCreateProject";
import { useAppStore } from "../src/store";
import { resetStore, project } from "./helpers";
import { mockRouter } from "./setup";

beforeEach(() => {
  resetStore();
  mockRouter.push.mockClear();
});
function prepare(overrides = {}) {
  const actions = {
    createProject: jest.fn().mockResolvedValue(project),
    generateTextFromPrompt: jest.fn().mockResolvedValue({ text: "# Hello\n\n**World**" }),
    generateImageFromPrompt: jest
      .fn()
      .mockResolvedValue({ imageUrl: "https://example.test/image.png" }),
    sendTextGenerationRequest: jest.fn().mockResolvedValue({}),
    saveAiResponse: jest.fn().mockResolvedValue({}),
    ...overrides
  };
  useAppStore.setState(actions);
  render(<QuickCreateProject />);
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "New draft" } });
  fireEvent.change(screen.getByLabelText("Prompt"), { target: { value: "Create something" } });
  return actions;
}
test("creates and saves formatted text before navigating", async () => {
  const actions = prepare();
  fireEvent.click(screen.getByRole("button", { name: "Generate" }));
  expect(screen.getByText("Preparing and generating your workspace")).toBeInTheDocument();
  await waitFor(() =>
    expect(mockRouter.push).toHaveBeenCalledWith(`/editor?projectId=${project._id}&type=text`)
  );
  expect(actions.sendTextGenerationRequest).toHaveBeenCalledWith({
    project: project._id,
    content: "<h1>Hello</h1><p><strong>World</strong></p>"
  });
  expect(actions.saveAiResponse).toHaveBeenCalledWith(
    expect.objectContaining({ contentType: "text", prompt: "Create something" })
  );
});
test("stores generated image in history and opens image workspace", async () => {
  const actions = prepare();
  fireEvent.click(screen.getByRole("radio", { name: "Image" }));
  fireEvent.click(screen.getByRole("button", { name: "Generate" }));
  await waitFor(() =>
    expect(mockRouter.push).toHaveBeenCalledWith(`/editor?projectId=${project._id}&type=image`)
  );
  expect(actions.createProject).toHaveBeenCalledWith(expect.objectContaining({ type: "image" }));
  expect(actions.saveAiResponse).toHaveBeenCalledWith(
    expect.objectContaining({ contentType: "image", imageUrl: "https://example.test/image.png" })
  );
  expect(actions.sendTextGenerationRequest).not.toHaveBeenCalled();
});
test("generation retry reuses the created project", async () => {
  const generate = jest
    .fn()
    .mockRejectedValueOnce(new Error("Try later"))
    .mockResolvedValue({ text: "Hello" });
  const actions = prepare({ generateTextFromPrompt: generate });
  fireEvent.click(screen.getByRole("button", { name: "Generate" }));
  await screen.findByRole("alert");
  expect(mockRouter.push).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Generate" }));
  await waitFor(() => expect(mockRouter.push).toHaveBeenCalled());
  expect(actions.createProject).toHaveBeenCalledTimes(1);
});
