const mongoose = require("mongoose");
const { AUDIT_ACTION_TYPES, AUDIT_WORKSPACES } = require("../constants/projects");

const auditLogSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    actionType: {
      type: String,
      enum: Object.values(AUDIT_ACTION_TYPES),
      required: true,
      index: true
    },
    workspace: {
      type: String,
      enum: Object.values(AUDIT_WORKSPACES),
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

auditLogSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
