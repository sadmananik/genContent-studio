const mongoose = require("mongoose");
const { PROJECT_TYPE_VALUES } = require("../constants/projects");
const { TEMPLATE_VISIBILITY, TEMPLATE_VISIBILITY_VALUES } = require("../constants/templates");

const templateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, default: "", maxlength: 600 },
    category: { type: String, trim: true, default: "Other", maxlength: 60 },
    projectType: { type: String, enum: PROJECT_TYPE_VALUES, required: true },
    starterPrompt: { type: String, trim: true, default: "", maxlength: 4000 },
    starterContent: { type: mongoose.Schema.Types.Mixed, default: "" },
    tone: { type: String, trim: true, default: "", maxlength: 80 },
    style: { type: String, trim: true, default: "", maxlength: 80 },
    tags: [{ type: String, trim: true, maxlength: 40 }],
    visibility: {
      type: String,
      enum: TEMPLATE_VISIBILITY_VALUES,
      default: TEMPLATE_VISIBILITY.PRIVATE
    },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    sourceProject: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
    isSystem: { type: Boolean, default: false },
    systemKey: { type: String, trim: true, sparse: true, unique: true },
    useCount: { type: Number, min: 0, default: 0 }
  },
  { timestamps: true }
);

templateSchema.index({ visibility: 1, updatedAt: -1 });
templateSchema.index({ creator: 1, updatedAt: -1 });
templateSchema.index({ projectType: 1, category: 1 });
templateSchema.index({ title: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Template", templateSchema);
