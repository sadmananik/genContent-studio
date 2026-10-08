function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function textToHtml(value) {
  const lines = String(value || "")
    .replace(/\r\n?/g, "\n")
    .split("\n");
  const blocks = [];
  let paragraphLines = [];
  let listItems = [];
  let listType = null;

  function flushParagraph() {
    if (paragraphLines.length === 0) {
      return;
    }

    blocks.push(`<p>${formatInlineMarkdown(paragraphLines.join("<br>"))}</p>`);
    paragraphLines = [];
  }

  function flushList() {
    if (listItems.length === 0) {
      return;
    }

    blocks.push(
      `<${listType}>${listItems.map((item) => `<li>${item}</li>`).join("")}</${listType}>`
    );
    listItems = [];
    listType = null;
  }

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    const headingMatch = trimmedLine.match(/^(#{1,3})\s+(.+)$/);
    const unorderedListMatch = trimmedLine.match(/^[-*]\s+(.+)$/);
    const orderedListMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);

    if (!trimmedLine) {
      flushParagraph();
      flushList();
      return;
    }

    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push(
        `<h${headingMatch[1].length}>${formatInlineMarkdown(headingMatch[2])}</h${headingMatch[1].length}>`
      );
      return;
    }

    if (unorderedListMatch || orderedListMatch) {
      flushParagraph();

      const nextListType = unorderedListMatch ? "ul" : "ol";

      if (listType && listType !== nextListType) {
        flushList();
      }

      listType = nextListType;
      listItems.push(formatInlineMarkdown((unorderedListMatch || orderedListMatch)[1]));
      return;
    }

    flushList();
    paragraphLines.push(trimmedLine);
  });

  flushParagraph();
  flushList();

  if (blocks.length === 0) {
    return "";
  }

  return blocks.join("");
}

function formatInlineMarkdown(value) {
  const tokens = [];
  const escapedValue = escapeHtml(value).replace(
    /`([^`]+)`/g,
    (_, code) => `@@CODE${tokens.push(`<code>${code}</code>`) - 1}@@`
  );

  return escapedValue
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/@@CODE(\d+)@@/g, (_, index) => tokens[Number(index)] || "");
}
