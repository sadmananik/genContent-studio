import { render, screen } from "@testing-library/react";
import WorkspaceLoading from "../src/components/common/WorkspaceLoading";

test("renders the loading overlay outside containers that can clip fixed elements", () => {
  const { container, unmount } = render(
    <div style={{ transform: "translateY(0)", overflow: "hidden", height: 200 }}>
      <WorkspaceLoading type="text" isGenerating />
    </div>
  );
  const overlay = screen.getByRole("status");
  expect(overlay.parentElement).toBe(document.body);
  expect(container).not.toContainElement(overlay);
  expect(overlay).toHaveClass("fixed", "inset-0");
  unmount();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
