const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { SYSTEM_TEMPLATES, TEMPLATE_VISIBILITY } = require("../src/constants/templates");
const Template = require("../src/models/Template");

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured in packages/backend/.env");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const result = await Template.bulkWrite(
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

  console.log(
    `Default templates seed complete: ${result.upsertedCount || 0} inserted, ${
      result.matchedCount || 0
    } already existed.`
  );
}

main()
  .catch((error) => {
    console.error("Failed to seed default templates:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
