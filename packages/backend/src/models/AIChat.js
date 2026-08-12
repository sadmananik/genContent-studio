const mongoose = require("mongoose");

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
    contentType: {
      type: String,
      enum: ["text", "image", "other"],
      default: "text"
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

module.exports = mongoose.model("AIChat", aiChatSchema);
