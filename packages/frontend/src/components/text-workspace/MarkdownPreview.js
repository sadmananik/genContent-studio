import { Fragment } from "react";

function inline(value) {
  return value.split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("__") && part.endsWith("__")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code className="rounded bg-slate-100 px-1" key={index}>
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    // A shortened preview can end in the middle of a formatting delimiter.
    return <Fragment key={index}>{part.replace(/\*\*|__/g, "")}</Fragment>;
  });
}

export default function MarkdownPreview({ content }) {
  const lines = String(content || "").split(/\r?\n/);
  const blocks = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;
    if (/^([-*_])\1{2,}$/.test(line)) {
      blocks.push(<hr className="border-slate-200" key={index} />);
      continue;
    }
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      blocks.push(
        <p className="font-bold text-slate-900" key={index}>
          {inline(heading[1])}
        </p>
      );
      continue;
    }
    const list = line.match(/^(?:[-*+]\s+|\d+[.)]\s+)(.+)$/);
    if (list) {
      const ordered = /^\d/.test(line);
      const items = [list[1]];
      const pattern = ordered ? /^\d+[.)]\s+(.+)$/ : /^[-*+]\s+(.+)$/;
      while (index + 1 < lines.length) {
        const next = lines[index + 1].trim().match(pattern);
        if (!next) break;
        items.push(next[1]);
        index += 1;
      }
      const Tag = ordered ? "ol" : "ul";
      blocks.push(
        <Tag className={`${ordered ? "list-decimal" : "list-disc"} space-y-1 pl-5`} key={index}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{inline(item)}</li>
          ))}
        </Tag>
      );
      continue;
    }
    blocks.push(<p key={index}>{inline(line)}</p>);
  }
  // React escapes AI-generated text; no raw HTML is injected.
  return <div className="space-y-2 break-words text-sm leading-6 text-slate-700">{blocks}</div>;
}
