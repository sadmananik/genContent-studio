const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

const AIChat = require("../src/models/AIChat");
const AuditLog = require("../src/models/AuditLog");
const ImageContent = require("../src/models/ImageContent");
const Project = require("../src/models/Project");
const ProjectInvite = require("../src/models/ProjectInvite");
const Template = require("../src/models/Template");
const TemplatePreference = require("../src/models/TemplatePreference");
const TextContent = require("../src/models/TextContent");
const User = require("../src/models/User");

async function cleanupE2EData(runId) {
  const normalizedRunId = String(runId || "").trim();

  if (!/^e2e_[a-z0-9_-]+$/i.test(normalizedRunId)) {
    throw new Error("A valid E2E run ID is required for cleanup.");
  }

  const mongoUri = process.env.MONGODB_URI_TEST;
  if (!mongoUri) {
    throw new Error("MONGODB_URI_TEST is required for E2E cleanup.");
  }

  await mongoose.connect(mongoUri);
  const users = await User.find({
    email: new RegExp(`^${escapeRegex(normalizedRunId)}_`, "i")
  }).select("_id");
  const userIds = users.map((user) => user._id);
  const projects = await Project.find({
    title: new RegExp(`^${escapeRegex(normalizedRunId)}_`, "i")
  }).select("_id");
  const projectIds = projects.map((project) => project._id);

  const filters = [
    [AIChat, { $or: [{ project: { $in: projectIds } }, { user: { $in: userIds } }] }],
    [AuditLog, { $or: [{ project: { $in: projectIds } }, { actor: { $in: userIds } }] }],
    [ImageContent, { project: { $in: projectIds } }],
    [ProjectInvite, { $or: [{ project: { $in: projectIds } }, { invitedBy: { $in: userIds } }] }],
    [TemplatePreference, { user: { $in: userIds } }],
    [
      Template,
      {
        $or: [
          { creator: { $in: userIds } },
          { title: new RegExp(`^${escapeRegex(normalizedRunId)}_`, "i") }
        ]
      }
    ],
    [TextContent, { project: { $in: projectIds } }],
    [Project, { _id: { $in: projectIds } }],
    [User, { _id: { $in: userIds } }]
  ];
  const results = [];

  for (const [model, filter] of filters) {
    results.push({
      collection: model.collection.name,
      deletedCount: (await model.deleteMany(filter)).deletedCount
    });
  }

  const remaining = await Promise.all(
    filters.map(async ([model, filter]) => ({
      collection: model.collection.name,
      count: await model.countDocuments(filter)
    }))
  );
  const leftovers = remaining.filter((item) => item.count > 0);

  results.forEach((result) =>
    console.log(`E2E cleanup ${result.collection}: ${result.deletedCount}`)
  );
  if (leftovers.length) {
    throw new Error(`E2E cleanup left records: ${JSON.stringify(leftovers)}`);
  }

  return results;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

if (require.main === module) {
  cleanupE2EData(process.argv[2])
    .catch((error) => {
      console.error("E2E cleanup failed:", error.message);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}

module.exports = cleanupE2EData;
