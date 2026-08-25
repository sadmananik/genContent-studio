const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["text", "image"],
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
          enum: ["viewer", "editor"],
          default: "editor"
        }
      }
    ]
  },
  { timestamps: true }
);

projectSchema.index({ owner: 1, updatedAt: -1 });
projectSchema.index({ collaborators: 1 });
projectSchema.index({ "collaboratorPermissions.user": 1 });

module.exports = mongoose.model("Project", projectSchema);
