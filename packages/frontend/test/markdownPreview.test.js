import { render, screen } from "@testing-library/react";
import MarkdownPreview from "../src/components/text-workspace/MarkdownPreview";
import { contentPreview } from "../src/components/text-workspace/contentPreview";

test("AI response previews display Markdown emphasis and lists without literal markers", () => {
  const { container } = render(
    <MarkdownPreview
      content={
        "**SEO Keywords:**\n- QR Codes\n- QR Code Applications\n\n---\n### Title Ideas\n**Incomplete…"
      }
    />
  );
  expect(container.querySelector("strong")).toHaveTextContent("SEO Keywords:");
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(screen.getByText("Title Ideas")).toBeInTheDocument();
  expect(container.textContent).not.toContain("**");
});

test("previews keep Markdown line breaks and do not interpret raw HTML", () => {
  expect(
    contentPreview("**Title**\n- First\n- Second", 320, { preserveWhitespace: true })
  ).toContain("\n- First");
  const { container } = render(<MarkdownPreview content={"<img src=x onerror=alert(1)>"} />);
  expect(container.querySelector("img")).toBeNull();
});
