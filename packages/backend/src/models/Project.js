const mongoose = require("mongoose");
const {
  ACCESS_LEVEL_VALUES,
  ACCESS_LEVELS,
  PROJECT_TYPE_VALUES
} = require("../constants/projects");

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: PROJECT_TYPE_VALUES,
      required: true
    },
    category: {
      type: String,
      required: true,
      trim: true,
      default: "Other"
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    collaboratorPermissions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        accessLevel: {
          type: String,
          enum: ACCESS_LEVEL_VALUES,
          default: ACCESS_LEVELS.EDITOR
        }
      }
    ],
    sourceTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
      default: null
    },
    starterPrompt: {
      type: String,
      trim: true,
      default: ""
    },
    tone: {
      type: String,
      trim: true,
      default: ""
    },
    style: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

projectSchema.index({ owner: 1, updatedAt: -1 });
projectSchema.index({ collaborators: 1 });
projectSchema.index({ "collaboratorPermissions.user": 1 });

module.exports = mongoose.model("Project", projectSchema);
