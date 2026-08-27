const mongoose = require("mongoose");
const { AI_CONTENT_TYPE_VALUES, AI_CONTENT_TYPES } = require("../constants/projects");

const aiChatSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    prompt: {
      type: String,
      required: true,
      trim: true
    },
    response: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String,
      trim: true
    },
    contentType: {
      type: String,
      enum: AI_CONTENT_TYPE_VALUES,
      default: AI_CONTENT_TYPES.TEXT
    },
    isFavourite: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

aiChatSchema.index({ project: 1, createdAt: -1 });
aiChatSchema.index({ user: 1, createdAt: -1 });
aiChatSchema.index({ isFavourite: 1, updatedAt: -1 });

module.exports = mongoose.model("AIChat", aiChatSchema);
