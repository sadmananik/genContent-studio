const mongoose = require("mongoose");
const { Server } = require("socket.io");
const Y = require("yjs");
const Project = require("../models/Project");
const User = require("../models/User");
const { verifyAuthToken } = require("../utils/token");
const { ACCESS_LEVELS } = require("../constants/projects");
const { QUICK_REACTION_BY_ID } = require("../constants/quickReactions");

const projectDocuments = new Map();
const projectCanvasStates = new Map();
const projectAwareness = new Map();
let collaborationIo = null;

function attachCollaborationServer(httpServer, frontendOrigin) {
  const io = new Server(httpServer, {
    cors: { origin: frontendOrigin }
  });
  collaborationIo = io;

  io.use(async (socket, next) => {
    const token =
      socket.handshake.auth?.token || getBearerToken(socket.handshake.headers.authorization);

    try {
      const payload = verifyAuthToken(token);
      const user = await User.findById(payload.sub).select("name email");

      if (!user) {
        return next(new Error("Authentication user not found"));
      }

      socket.user = user;
      return next();
    } catch (error) {
      return next(new Error(error.message || "Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    socket.data.projectId = null;
    socket.data.accessLevel = null;
    socket.data.lastQuickReactionAt = 0;

    socket.on("project:join", async ({ projectId } = {}) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
          socket.emit("project:join-denied", { message: "Invalid project." });
          return;
        }

        const project = await Project.findOne({
          _id: projectId,
          $or: [{ owner: socket.user._id }, { collaborators: socket.user._id }]
        })
          .populate("owner", "name email")
          .populate("collaborators", "name email");

        if (!project) {
          socket.emit("project:join-denied", {
            projectId,
            message: "You no longer have access to this project."
          });
          return;
        }

        leaveProjectRoom(io, socket, "switching-project");
        const room = getProjectRoom(projectId);
        const accessLevel = getAccessLevel(project, socket.user._id);
        await socket.join(room);
        socket.data.projectId = String(projectId);
        socket.data.accessLevel = accessLevel;

        socket.emit("project:joined", {
          accessLevel,
          collaborators: getRoomUsers(io, room),
          canvasState: projectCanvasStates.get(String(projectId)) || null,
          projectId: String(projectId),
          yjsUpdate: encodeDocument(projectId)
        });
        const awareness = projectAwareness.get(String(projectId));
        for (const socketId of awareness?.keys() || []) {
          if (!io.sockets.sockets.has(socketId)) {
            awareness.delete(socketId);
          }
        }
        for (const update of awareness?.values() || []) {
          socket.emit("yjs:awareness-update", { projectId: String(projectId), update });
        }
        socket.to(room).emit("project:user-joined", {
          projectId: String(projectId),
          user: serializeUser(socket.user)
        });
        broadcastPresence(io, room, projectId);
      } catch (error) {
        socket.emit("project:join-denied", {
          projectId,
          message: error.message || "Unable to join this project."
        });
      }
    });

    socket.on("project:leave", () => leaveProjectRoom(io, socket, "left-project"));

    socket.on("project:quick-reaction", ({ projectId, reactionId } = {}) => {
      if (!isCurrentProject(socket, projectId) || !QUICK_REACTION_BY_ID.has(reactionId)) {
        return;
      }

      const now = Date.now();
      if (now - socket.data.lastQuickReactionAt < 1000) {
        socket.emit("project:quick-reaction-error", {
          message: "Please wait before sending another reaction."
        });
        return;
      }

      socket.data.lastQuickReactionAt = now;
      io.to(getProjectRoom(projectId)).emit("project:quick-reaction", {
        projectId: String(projectId),
        reaction: QUICK_REACTION_BY_ID.get(reactionId),
        sender: serializeUser(socket.user),
        sentAt: new Date(now).toISOString()
      });
    });

    socket.on("yjs:update", ({ projectId, update } = {}) => {
      if (
        !isCurrentProject(socket, projectId) ||
        socket.data.accessLevel !== ACCESS_LEVELS.EDITOR
      ) {
        return;
      }

      const document = getDocument(projectId);
      const binaryUpdate = Uint8Array.from(update || []);
      Y.applyUpdate(document, binaryUpdate);
      socket.to(getProjectRoom(projectId)).emit("yjs:update", {
        projectId: String(projectId),
        update: Array.from(binaryUpdate)
      });
    });

    socket.on("yjs:sync-request", ({ projectId } = {}) => {
      if (isCurrentProject(socket, projectId)) {
        socket.emit("yjs:sync", {
          projectId: String(projectId),
          update: encodeDocument(projectId)
        });
      }
    });

    socket.on("canvas:update", ({ projectId, canvasState } = {}) => {
      if (
        !isCurrentProject(socket, projectId) ||
        socket.data.accessLevel !== ACCESS_LEVELS.EDITOR ||
        !canvasState
      ) {
        return;
      }

      projectCanvasStates.set(String(projectId), canvasState);
      socket.to(getProjectRoom(projectId)).emit("canvas:update", {
        canvasState,
        projectId: String(projectId)
      });
    });

    socket.on("canvas:pointer", ({ projectId, pointer } = {}) => {
      if (!isCurrentProject(socket, projectId) || !pointer) {
        return;
      }

      socket.to(getProjectRoom(projectId)).emit("canvas:pointer", {
        pointer,
        projectId: String(projectId),
        user: serializeUser(socket.user)
      });
    });

    socket.on("yjs:awareness-update", ({ projectId, update } = {}) => {
      if (isCurrentProject(socket, projectId)) {
        if (!projectAwareness.has(String(projectId))) {
          projectAwareness.set(String(projectId), new Map());
        }
        projectAwareness.get(String(projectId)).set(socket.id, update || []);
        socket.to(getProjectRoom(projectId)).emit("yjs:awareness-update", {
          projectId: String(projectId),
          update: Array.from(Uint8Array.from(update || []))
        });
      }
    });

    socket.on("project:event", ({ event, payload } = {}) => {
      if (isCurrentProject(socket, payload?.projectId) && isProjectEvent(event)) {
        socket.to(getProjectRoom(payload.projectId)).emit(event, payload);
      }
    });

    socket.on("disconnect", () => {
      const projectId = socket.data.projectId;
      const room = projectId && getProjectRoom(projectId);

      if (room) {
        projectAwareness.get(String(projectId))?.delete(socket.id);
        socket.to(room).emit("project:user-left", {
          projectId,
          user: serializeUser(socket.user),
          userId: String(socket.user._id)
        });
        setTimeout(() => broadcastPresence(io, room, projectId), 0);
      }
    });
  });

  return io;
}

function leaveProjectRoom(io, socket, reason) {
  const projectId = socket.data.projectId;

  if (!projectId) {
    return;
  }

  const room = getProjectRoom(projectId);
  projectAwareness.get(String(projectId))?.delete(socket.id);
  socket.to(room).emit("project:user-left", {
    projectId,
    reason,
    user: serializeUser(socket.user),
    userId: String(socket.user._id)
  });
  socket.leave(room);
  socket.data.projectId = null;
  socket.data.accessLevel = null;
  broadcastPresence(io, room, projectId);
}

function broadcastPresence(io, room, projectId) {
  io.to(room).emit("project:presence-updated", {
    collaborators: getRoomUsers(io, room),
    projectId: String(projectId)
  });
}

function getRoomUsers(io, room) {
  const users = new Map();

  for (const socket of io.sockets.adapter.rooms.get(room) || []) {
    const participant = io.sockets.sockets.get(socket);

    if (participant?.user) {
      users.set(String(participant.user._id), serializeUser(participant.user));
    }
  }

  return [...users.values()];
}

function getDocument(projectId) {
  if (!projectDocuments.has(String(projectId))) {
    projectDocuments.set(String(projectId), new Y.Doc());
  }

  return projectDocuments.get(String(projectId));
}

function encodeDocument(projectId) {
  return Array.from(Y.encodeStateAsUpdate(getDocument(projectId)));
}

function getProjectRoom(projectId) {
  return `project:${projectId}`;
}

function getAccessLevel(project, userId) {
  if (String(project.owner?._id || project.owner) === String(userId)) {
    return ACCESS_LEVELS.EDITOR;
  }

  return (
    project.collaboratorPermissions?.find(
      (permission) => String(permission.user) === String(userId)
    )?.accessLevel || ACCESS_LEVELS.EDITOR
  );
}

function isCurrentProject(socket, projectId) {
  return Boolean(projectId) && socket.data.projectId === String(projectId);
}

function isProjectEvent(event) {
  return [
    "project:permission-updated",
    "project:access-revoked",
    "project:sharing-updated",
    "ai:generation-started",
    "ai:generation-finished",
    "ai:prompt-created",
    "ai:response-created",
    "ai:response-updated",
    "ai:response-deleted",
    "ai:project-response-saved"
  ].includes(event);
}

function serializeUser(user) {
  return { email: user.email, id: String(user._id), name: user.name };
}

function getBearerToken(header = "") {
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" ? token : null;
}

function emitProjectEvent(projectId, event, payload = {}, options = {}) {
  if (!collaborationIo || !isProjectEvent(event)) {
    return;
  }

  const room = getProjectRoom(projectId);
  const target = options.userId
    ? [...(collaborationIo.sockets.adapter.rooms.get(room) || [])]
        .map((socketId) => collaborationIo.sockets.sockets.get(socketId))
        .filter((socket) => String(socket?.user?._id) === String(options.userId))
    : [];

  if (options.userId) {
    target.forEach((socket) => socket.emit(event, payload));
    return;
  }

  for (const socketId of collaborationIo.sockets.adapter.rooms.get(room) || []) {
    const socket = collaborationIo.sockets.sockets.get(socketId);

    if (socket && String(socket.user?._id) !== String(options.excludeUserId)) {
      if (
        event === "project:permission-updated" &&
        String(socket.user?._id) === String(payload.userId)
      ) {
        socket.data.accessLevel = payload.accessLevel;
      }
      socket.emit(event, payload);
    }
  }
}

module.exports = { attachCollaborationServer, emitProjectEvent };
