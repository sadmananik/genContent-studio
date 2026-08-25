const mongoose = require("mongoose");
const { ACCESS_LEVEL_VALUES, ACCESS_LEVELS } = require("../constants/projects");

const projectInviteSchema = new mongoose.Schema(
  {
    accessLevel: {
      type: String,
      enum: ACCESS_LEVEL_VALUES,
      default: ACCESS_LEVELS.EDITOR
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    }
  },
  { timestamps: true }
);

projectInviteSchema.index({ email: 1, project: 1 }, { unique: true });
projectInviteSchema.index({ email: 1 });

module.exports = mongoose.model("ProjectInvite", projectInviteSchema);
