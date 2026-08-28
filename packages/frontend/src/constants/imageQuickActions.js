export const IMAGE_STYLE_OPTIONS = [
  "Minimalist",
  "Modern",
  "Professional",
  "Futuristic",
  "Illustration",
  "Photorealistic",
  "Corporate",
  "Creative",
  "Cinematic"
];

const ACTION_LABELS = [
  "Regenerate Image",
  "Improve Image",
  "Create Variation",
  "Make More Professional",
  "Change Style",
  "Adjust Layout",
  "Add More Detail",
  "Simplify Design"
];

/**
 * Keep the user's written description as the primary concept.
 * Strips previous quick-action history prefixes like "Improve Image — ...".
 */
export function resolveMainImagePrompt(rawPrompt = "") {
  let concept = String(rawPrompt || "").trim();

  if (!concept) {
    return "";
  }

  for (let pass = 0; pass < 3; pass += 1) {
    const matchedLabel = ACTION_LABELS.find((label) => concept.startsWith(`${label}`));

    if (!matchedLabel) {
      break;
    }

    let remainder = concept.slice(matchedLabel.length).trim();

    if (remainder.startsWith("·")) {
      const afterStyle = remainder.indexOf("—");
      remainder = afterStyle >= 0 ? remainder.slice(afterStyle + 1).trim() : "";
    } else if (
      remainder.startsWith("—") ||
      remainder.startsWith("-") ||
      remainder.startsWith(":")
    ) {
      remainder = remainder.replace(/^[—\-:]\s*/, "").trim();
    }

    concept = remainder || concept;
  }

  return concept.trim();
}

function buildEmphasizedPrompt({ basePrompt, emphasis }) {
  const mainConcept = resolveMainImagePrompt(basePrompt);

  if (!mainConcept) {
    return [
      "Create an image from the current visual reference.",
      `Emphasis: ${emphasis}`,
      "Keep the result coherent and usable as a design asset."
    ].join("\n");
  }

  return [
    `Primary image request (must remain the main focus): ${mainConcept}`,
    `Emphasis to apply on top of that request: ${emphasis}`,
    "Do not replace the primary request with the emphasis alone.",
    "The final image must clearly express the primary request, with the emphasis guiding quality, style, composition or refinement."
  ].join("\n");
}

export const IMAGE_QUICK_ACTIONS = [
  {
    id: "regenerate",
    label: "Regenerate Image",
    usesImageInput: true,
    inputFidelity: "low",
    buildPrompt: ({ basePrompt }) =>
      buildEmphasizedPrompt({
        basePrompt,
        emphasis:
          "Generate another distinct version of the same primary request. Keep the core subject and purpose, but produce a clearly different composition or treatment."
      })
  },
  {
    id: "improve",
    label: "Improve Image",
    usesImageInput: true,
    inputFidelity: "high",
    buildPrompt: ({ basePrompt }) =>
      buildEmphasizedPrompt({
        basePrompt,
        emphasis:
          "Improve visual quality, clarity, composition, balance, lighting and overall presentation while preserving the primary request."
      })
  },
  {
    id: "variation",
    label: "Create Variation",
    usesImageInput: true,
    inputFidelity: "low",
    buildPrompt: ({ basePrompt }) =>
      buildEmphasizedPrompt({
        basePrompt,
        emphasis:
          "Create a related variation of the same primary request. Keep the concept, but change layout, colour treatment or visual details enough to look distinct."
      })
  },
  {
    id: "professional",
    label: "Make More Professional",
    usesImageInput: true,
    inputFidelity: "high",
    buildPrompt: ({ basePrompt }) =>
      buildEmphasizedPrompt({
        basePrompt,
        emphasis:
          "Make the result more polished and professional. Improve hierarchy, spacing, consistency and presentation while keeping the primary request."
      })
  },
  {
    id: "change-style",
    label: "Change Style",
    usesImageInput: true,
    inputFidelity: "low",
    styles: IMAGE_STYLE_OPTIONS,
    buildPrompt: ({ basePrompt, style }) =>
      buildEmphasizedPrompt({
        basePrompt,
        emphasis: `Redraw using a clearly ${style || "modern"} visual style while still expressing the same primary request.`
      })
  },
  {
    id: "adjust-layout",
    label: "Adjust Layout",
    usesImageInput: true,
    inputFidelity: "high",
    buildPrompt: ({ basePrompt }) =>
      buildEmphasizedPrompt({
        basePrompt,
        emphasis:
          "Improve composition, alignment, spacing and visual hierarchy for the same primary request. Keep the subject, but make layout improvements clearly visible."
      })
  },
  {
    id: "add-detail",
    label: "Add More Detail",
    usesImageInput: true,
    inputFidelity: "high",
    buildPrompt: ({ basePrompt }) =>
      buildEmphasizedPrompt({
        basePrompt,
        emphasis:
          "Enrich the same primary request with more useful visual detail and texture, without changing the core subject or purpose."
      })
  },
  {
    id: "simplify",
    label: "Simplify Design",
    usesImageInput: true,
    inputFidelity: "high",
    buildPrompt: ({ basePrompt }) =>
      buildEmphasizedPrompt({
        basePrompt,
        emphasis:
          "Simplify the same primary request. Reduce clutter, strengthen whitespace and clarify hierarchy while keeping the main subject."
      })
  }
];

export function getImageQuickAction(actionId) {
  return IMAGE_QUICK_ACTIONS.find((action) => action.id === actionId) || null;
}

export function buildImageActionPrompt(actionId, context = {}) {
  const action = getImageQuickAction(actionId);

  if (!action) {
    return resolveMainImagePrompt(context.basePrompt);
  }

  return action.buildPrompt({
    ...context,
    basePrompt: resolveMainImagePrompt(context.basePrompt)
  });
}

export function buildImageHistoryPrompt(actionId, { basePrompt = "", style } = {}) {
  const action = getImageQuickAction(actionId);
  const label = action?.label || actionId;
  const styleSuffix = style ? ` · ${style}` : "";
  const concept = resolveMainImagePrompt(basePrompt);

  if (!concept) {
    return `${label}${styleSuffix}`.slice(0, 1200);
  }

  return `${label}${styleSuffix} — ${concept}`.slice(0, 1200);
}
