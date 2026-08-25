const ImageContent = require("../models/ImageContent");
const Project = require("../models/Project");
const Template = require("../models/Template");
const TemplatePreference = require("../models/TemplatePreference");
const TextContent = require("../models/TextContent");
const { PROJECT_TYPE_VALUES, PROJECT_TYPES } = require("../constants/projects");
const {
  SYSTEM_TEMPLATES,
  TEMPLATE_MESSAGES,
  TEMPLATE_VISIBILITY,
  TEMPLATE_VISIBILITY_VALUES
} = require("../constants/templates");
const asyncHandler = require("../middleware/asyncHandler");
const httpError = require("../utils/httpError");
const { normalizeString, requireTrimmedString } = require("../utils/validation");

const RECENT_TEMPLATE_LIMIT = 6;
const TEMPLATE_UPDATE_FIELDS = [
  "title",
  "description",
  "category",
  "starterPrompt",
  "starterContent",
  "tone",
  "style",
  "tags",
  "visibility"
];

const listTemplates = asyncHandler(async (req, res) => {
  await ensureSystemTemplates();

  const query = { visibility: TEMPLATE_VISIBILITY.PUBLIC };
  const type = normalizeString(req.query.type).toLowerCase();
  const category = normalizeString(req.query.category);
  const search = normalizeString(req.query.search).slice(0, 100);

  if (type && type !== "all") {
    if (!PROJECT_TYPE_VALUES.includes(type)) {
      throw httpError(400, TEMPLATE_MESSAGES.TYPE_INVALID);
    }
    query.projectType = type;
  }

  if (category && category.toLowerCase() !== "all") {
    query.category = category;
  }

  if (search) {
    const searchPattern = new RegExp(escapeRegExp(search), "i");
    query.$or = [
      { title: searchPattern },
      { description: searchPattern },
      { tags: searchPattern },
      { category: searchPattern }
    ];
  }

  const [templates, preference] = await Promise.all([
    Template.find(query).populate("creator", "name").sort({ isSystem: -1, updatedAt: -1 }),
    TemplatePreference.findOne({ user: req.user.id }).select("favorites")
  ]);
  const favoriteIds = new Set((preference?.favorites || []).map(String));

  res.json(templates.map((template) => serializeTemplate(template, favoriteIds, req.user.id)));
});

const listMyTemplates = asyncHandler(async (req, res) => {
  const [templates, preference] = await Promise.all([
    Template.find({ creator: req.user.id }).populate("creator", "name").sort({ updatedAt: -1 }),
    TemplatePreference.findOne({ user: req.user.id }).select("favorites")
  ]);
  const favoriteIds = new Set((preference?.favorites || []).map(String));

  res.json(templates.map((template) => serializeTemplate(template, favoriteIds, req.user.id)));
});

const listRecentTemplates = asyncHandler(async (req, res) => {
  const preference = await TemplatePreference.findOne({ user: req.user.id })
    .populate({ path: "recentlyUsed.template", populate: { path: "creator", select: "name" } })
    .select("favorites recentlyUsed");
  const favoriteIds = new Set((preference?.favorites || []).map(String));
  const templates = (preference?.recentlyUsed || [])
    .filter(
      (entry) =>
        entry.template &&
        (entry.template.visibility === TEMPLATE_VISIBILITY.PUBLIC ||
          String(entry.template.creator?._id || entry.template.creator || "") ===
            String(req.user.id))
    )
    .slice(0, RECENT_TEMPLATE_LIMIT)
    .map((entry) => ({
      ...serializeTemplate(entry.template, favoriteIds, req.user.id),
      lastUsedAt: entry.usedAt
    }));

  res.json(templates);
});

const getTemplateById = asyncHandler(async (req, res) => {
  const [template, preference] = await Promise.all([
    findAccessibleTemplate(req.params.id, req.user.id),
    TemplatePreference.findOne({ user: req.user.id }).select("favorites")
  ]);
  const favoriteIds = new Set((preference?.favorites || []).map(String));

  res.json(serializeTemplate(template, favoriteIds, req.user.id));
});

const publishProjectTemplate = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.projectId, owner: req.user.id });

  if (!project) {
    throw httpError(404, TEMPLATE_MESSAGES.PROJECT_OWNER_ONLY);
  }

  const reusableContent = await getReusableProjectContent(project);
  const payload = normalizeTemplatePayload(
    {
      ...req.body,
      category: req.body.category ?? project.category,
      description: req.body.description ?? project.description,
      projectType: project.type,
      starterContent: req.body.starterContent ?? reusableContent.starterContent,
      starterPrompt: req.body.starterPrompt ?? reusableContent.starterPrompt,
      style: req.body.style ?? project.style,
      tone: req.body.tone ?? project.tone
    },
    { requireTitle: true }
  );

  const template = await Template.create({
    ...payload,
    creator: req.user.id,
    sourceProject: project._id,
    isSystem: false
  });
  await template.populate("creator", "name");

  res.status(201).json(serializeTemplate(template, new Set(), req.user.id));
});

const updateTemplate = asyncHandler(async (req, res) => {
  const template = await findOwnedTemplate(req.params.id, req.user.id);
  const requestedUpdates = Object.fromEntries(
    TEMPLATE_UPDATE_FIELDS.filter((field) => req.body[field] !== undefined).map((field) => [
      field,
      req.body[field]
    ])
  );
  const updates = normalizeTemplatePayload(
    { ...template.toObject(), ...requestedUpdates, projectType: template.projectType },
    { requireTitle: true }
  );

  TEMPLATE_UPDATE_FIELDS.forEach((field) => {
    template[field] = updates[field];
  });
  await template.save();
  await template.populate("creator", "name");

  res.json(serializeTemplate(template, new Set(), req.user.id));
});

const updateTemplateVisibility = asyncHandler(async (req, res) => {
  const template = await findOwnedTemplate(req.params.id, req.user.id);
  const visibility = normalizeString(req.body.visibility).toLowerCase();

  if (!TEMPLATE_VISIBILITY_VALUES.includes(visibility)) {
    throw httpError(400, TEMPLATE_MESSAGES.VISIBILITY_INVALID);
  }

  template.visibility = visibility;
  await template.save();
  await template.populate("creator", "name");

  res.json(serializeTemplate(template, new Set(), req.user.id));
});

const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await findOwnedTemplate(req.params.id, req.user.id);

  await TemplatePreference.updateMany(
    {},
    {
      $pull: {
        favorites: template._id,
        recentlyUsed: { template: template._id }
      }
    }
  );
  await Project.updateMany({ sourceTemplate: template._id }, { $set: { sourceTemplate: null } });
  await template.deleteOne();

  res.json({ message: TEMPLATE_MESSAGES.DELETE_SUCCESS });
});

const useTemplate = asyncHandler(async (req, res) => {
  const template = await findAccessibleTemplate(req.params.id, req.user.id);
  const projectTitle = normalizeString(req.body.title).slice(0, 120) || `${template.title} Project`;
  let project;

  try {
    project = await Project.create({
      title: projectTitle,
      type: template.projectType,
      category: template.category || "Other",
      description: template.description || "",
      owner: req.user.id,
      collaborators: [],
      collaboratorPermissions: [],
      sourceTemplate: template._id,
      starterPrompt: template.starterPrompt || "",
      tone: template.tone || "",
      style: template.style || ""
    });

    if (template.projectType === PROJECT_TYPES.TEXT) {
      await TextContent.create({
        project: project._id,
        content: typeof template.starterContent === "string" ? template.starterContent : "",
        lastUpdatedBy: req.user.id
      });
    } else {
      await ImageContent.create({
        project: project._id,
        generationPrompt: template.starterPrompt || "",
        canvasState: normalizeCanvasState(template.starterContent),
        lastUpdatedBy: req.user.id
      });
    }
  } catch (error) {
    if (project?._id) {
      await Promise.all([
        TextContent.deleteMany({ project: project._id }),
        ImageContent.deleteMany({ project: project._id }),
        Project.deleteOne({ _id: project._id })
      ]);
    }
    throw error;
  }

  const [updatedTemplate] = await Promise.all([
    Template.findByIdAndUpdate(template._id, { $inc: { useCount: 1 } }, { new: true }).select(
      "useCount"
    ),
    recordRecentTemplate(req.user.id, template._id)
  ]);

  res.status(201).json({
    project: {
      ...project.toObject(),
      currentUserRole: "owner",
      accessLevel: "editor",
      canEdit: true,
      canManageSharing: true,
      canDelete: true,
      isSharedWithCurrentUser: false
    },
    template: { id: String(template._id), useCount: updatedTemplate.useCount }
  });
});

const favoriteTemplate = asyncHandler(async (req, res) => {
  await findAccessibleTemplate(req.params.id, req.user.id);
  await TemplatePreference.findOneAndUpdate(
    { user: req.user.id },
    { $addToSet: { favorites: req.params.id } },
    { upsert: true, setDefaultsOnInsert: true }
  );

  res.json({ isFavorite: true, message: TEMPLATE_MESSAGES.FAVORITE_SUCCESS });
});

const unfavoriteTemplate = asyncHandler(async (req, res) => {
  await findAccessibleTemplate(req.params.id, req.user.id);
  await TemplatePreference.updateOne(
    { user: req.user.id },
    { $pull: { favorites: req.params.id } }
  );

  res.json({ isFavorite: false, message: TEMPLATE_MESSAGES.UNFAVORITE_SUCCESS });
});

async function ensureSystemTemplates() {
  await Template.bulkWrite(
    SYSTEM_TEMPLATES.map((template) => ({
      updateOne: {
        filter: { systemKey: template.systemKey },
        update: {
          $setOnInsert: {
            ...template,
            creator: null,
            isSystem: true,
            visibility: TEMPLATE_VISIBILITY.PUBLIC
          }
        },
        upsert: true
      }
    })),
    { ordered: false }
  );
}

async function findAccessibleTemplate(templateId, userId) {
  const template = await Template.findOne({
    _id: templateId,
    $or: [{ visibility: TEMPLATE_VISIBILITY.PUBLIC }, { creator: userId }]
  }).populate("creator", "name");

  if (!template) {
    throw httpError(404, TEMPLATE_MESSAGES.NOT_FOUND);
  }

  return template;
}

async function findOwnedTemplate(templateId, userId) {
  const template = await Template.findOne({ _id: templateId, creator: userId });

  if (!template || template.isSystem) {
    throw httpError(404, TEMPLATE_MESSAGES.UPDATE_FORBIDDEN);
  }

  return template;
}

async function getReusableProjectContent(project) {
  if (project.type === PROJECT_TYPES.TEXT) {
    const content = await TextContent.findOne({ project: project._id }).select("content");
    return {
      starterContent: typeof content?.content === "string" ? content.content : "",
      starterPrompt: project.starterPrompt || ""
    };
  }

  const content = await ImageContent.findOne({ project: project._id }).select(
    "canvasState generationPrompt"
  );
  return {
    starterContent: content?.canvasState || {},
    starterPrompt: content?.generationPrompt || project.starterPrompt || ""
  };
}

async function recordRecentTemplate(userId, templateId) {
  const preference =
    (await TemplatePreference.findOne({ user: userId })) ||
    new TemplatePreference({ user: userId });
  preference.recentlyUsed = [
    { template: templateId, usedAt: new Date() },
    ...preference.recentlyUsed.filter((entry) => String(entry.template) !== String(templateId))
  ].slice(0, RECENT_TEMPLATE_LIMIT);
  await preference.save();
}

function normalizeTemplatePayload(payload, { requireTitle = false } = {}) {
  const title = requireTitle
    ? requireTrimmedString(payload.title, "Template title").slice(0, 120)
    : normalizeString(payload.title).slice(0, 120);
  const projectType = normalizeString(payload.projectType).toLowerCase();
  const visibility = normalizeString(payload.visibility, TEMPLATE_VISIBILITY.PRIVATE).toLowerCase();

  if (!PROJECT_TYPE_VALUES.includes(projectType)) {
    throw httpError(400, TEMPLATE_MESSAGES.TYPE_INVALID);
  }

  if (!TEMPLATE_VISIBILITY_VALUES.includes(visibility)) {
    throw httpError(400, TEMPLATE_MESSAGES.VISIBILITY_INVALID);
  }

  return {
    title,
    description: normalizeString(payload.description).slice(0, 600),
    category: normalizeString(payload.category, "Other").slice(0, 60) || "Other",
    projectType,
    starterPrompt: normalizeString(payload.starterPrompt).slice(0, 4000),
    starterContent: normalizeStarterContent(payload.starterContent, projectType),
    tone: normalizeString(payload.tone).slice(0, 80),
    style: normalizeString(payload.style).slice(0, 80),
    tags: normalizeTags(payload.tags),
    visibility
  };
}

function normalizeStarterContent(value, projectType) {
  if (projectType === PROJECT_TYPES.TEXT) {
    return typeof value === "string" ? value : "";
  }

  return normalizeCanvasState(value);
}

function normalizeCanvasState(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeTags(value) {
  const tags = Array.isArray(value)
    ? value
    : String(value || "")
        .split(",")
        .map((tag) => tag.trim());

  return [...new Set(tags.map((tag) => normalizeString(tag).slice(0, 40)).filter(Boolean))].slice(
    0,
    10
  );
}

function serializeTemplate(template, favoriteIds, userId) {
  const value = template.toObject ? template.toObject() : template;
  const { sourceProject, systemKey, ...publicValue } = value;

  return {
    ...publicValue,
    id: String(value._id),
    creator: value.isSystem
      ? { id: null, name: "GenContent Studio" }
      : value.creator
        ? { id: String(value.creator._id || value.creator), name: value.creator.name || "Creator" }
        : null,
    isFavorite: favoriteIds.has(String(value._id)),
    canManage:
      !value.isSystem && String(value.creator?._id || value.creator || "") === String(userId)
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  deleteTemplate,
  favoriteTemplate,
  getTemplateById,
  listMyTemplates,
  listRecentTemplates,
  listTemplates,
  publishProjectTemplate,
  unfavoriteTemplate,
  updateTemplate,
  updateTemplateVisibility,
  useTemplate
};
