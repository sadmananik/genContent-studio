const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const AIChat = require("../src/models/AIChat");
const ImageContent = require("../src/models/ImageContent");
const Project = require("../src/models/Project");
const ProjectInvite = require("../src/models/ProjectInvite");
const TextContent = require("../src/models/TextContent");
const Template = require("../src/models/Template");
const TemplatePreference = require("../src/models/TemplatePreference");
const User = require("../src/models/User");

const CONFIRM_FLAG = "--confirm-clear";

async function main() {
  if (!process.argv.includes(CONFIRM_FLAG)) {
    console.error(`Refusing to clear data without ${CONFIRM_FLAG}.`);
    console.error(`Run: node scripts/clearMongoCollections.js ${CONFIRM_FLAG}`);
    process.exitCode = 1;
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured in packages/backend/.env");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const models = [
    AIChat,
    ImageContent,
    TextContent,
    TemplatePreference,
    Template,
    Project,
    ProjectInvite,
    User
  ];
  const results = await Promise.all(
    models.map(async (model) => ({
      collection: model.collection.name,
      deletedCount: (await model.deleteMany({})).deletedCount
    }))
  );

  results.forEach((result) => {
    console.log(`Cleared ${result.collection}: ${result.deletedCount} document(s) deleted`);
  });
}

main()
  .catch((error) => {
    console.error("Failed to clear MongoDB collections:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
