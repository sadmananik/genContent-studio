"use client";

import { io } from "socket.io-client";
import * as Y from "yjs";
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate } from "y-protocols/awareness";
import { API_BASE_URL } from "./apiClient";

export function createCollaborationProvider({ projectId, token, user, onEvent }) {
  const doc = new Y.Doc();
  const awareness = new Awareness(doc);
  const socket = io(API_BASE_URL, { auth: { token }, autoConnect: false });
  let applyingRemoteUpdate = false;

  awareness.setLocalStateField("user", {
    color: getUserColor(user?.id),
    id: user?.id,
    name: user?.name || user?.email || "Collaborator"
  });

  const emitDocumentUpdate = (update, origin) => {
    if (!applyingRemoteUpdate && origin !== "initial-content") {
      socket.emit("yjs:update", { projectId, update: Array.from(update) });
    }
  };
  const emitAwarenessUpdate = ({ added, updated, removed }) => {
    socket.emit("yjs:awareness-update", {
      projectId,
      update: Array.from(encodeAwarenessUpdate(awareness, added.concat(updated).concat(removed)))
    });
  };

  doc.on("update", emitDocumentUpdate);
  awareness.on("update", emitAwarenessUpdate);
  socket.on("connect", () => socket.emit("project:join", { projectId }));
  socket.on("project:joined", ({ yjsUpdate, ...event }) => {
    applyUpdate(yjsUpdate);
    emitLocalAwareness();
    onEvent?.("project:joined", event);
  });
  socket.on("yjs:sync", ({ update }) => applyUpdate(update));
  socket.on("yjs:update", ({ update }) => applyUpdate(update));
  socket.on("yjs:awareness-update", ({ update }) => {
    applyAwarenessUpdate(awareness, Uint8Array.from(update || []), "remote");
  });
  socket.on("connect_error", (error) => onEvent?.("connection-error", error));
  socket.onAny((event, payload) => {
    if (event !== "yjs:update" && event !== "yjs:sync") {
      onEvent?.(event, payload);
    }
  });

  return {
    awareness,
    connect() {
      socket.connect();
    },
    emitCanvasUpdate(canvasState) {
      socket.emit("canvas:update", { canvasState, projectId });
    },
    emitCanvasPointer(pointer) {
      socket.emit("canvas:pointer", { pointer, projectId });
    },
    destroy() {
      awareness.setLocalState(null);
      socket.emit("project:leave");
      socket.disconnect();
      doc.off("update", emitDocumentUpdate);
      awareness.off("update", emitAwarenessUpdate);
      awareness.destroy();
      doc.destroy();
    },
    doc,
    socket
  };

  function applyUpdate(update) {
    if (!update?.length) {
      return;
    }

    applyingRemoteUpdate = true;
    Y.applyUpdate(doc, Uint8Array.from(update), "remote");
    applyingRemoteUpdate = false;
  }

  function emitLocalAwareness() {
    const clientIds = [awareness.clientID];
    socket.emit("yjs:awareness-update", {
      projectId,
      update: Array.from(encodeAwarenessUpdate(awareness, clientIds))
    });
  }
}

function getUserColor(id = "") {
  const colors = ["#7c3aed", "#0891b2", "#db2777", "#ca8a04", "#059669"];
  return colors[hashString(id) % colors.length];
}

function hashString(value) {
  return (
    [...String(value)].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) | 0, 0) >>>
    0
  );
}
