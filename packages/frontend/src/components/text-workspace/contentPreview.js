export function contentPreview(value, maxLength, { preserveWhitespace = false } = {}) {
  const source = String(value || "");
  const text = (preserveWhitespace ? source : source.replace(/\s+/g, " ")).trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}
