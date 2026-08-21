"use client";

import { DEV_AUTH_SESSION } from "./devAuth";

const STORAGE_KEY = "gencontent-local-projects";

/**
 * Local-only project repository for UI demos when auth bypass is on.
 * Shape mirrors the Mongo/API Project documents so switching later is mostly:
 *   DEV_AUTH_BYPASS=false + real login → projectReducer uses apiRequest again.
 */
function readProjects() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeProjects(projects) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function createLocalId() {
  // Not a Mongo ObjectId on purpose — editors already treat non-ObjectId ids as local drafts.
  return `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function getOwnerSnapshot() {
  const user = DEV_AUTH_SESSION.user;
  return {
    _id: user._id || user.id,
    name: user.name,
    email: user.email
  };
}

function normalizeProject(project) {
  return {
    ...project,
    id: project._id,
    owner: project.owner || getOwnerSnapshot(),
    collaborators: Array.isArray(project.collaborators) ? project.collaborators : []
  };
}

export function listLocalProjects() {
  return readProjects()
    .map(normalizeProject)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getLocalProjectById(projectId) {
  const project = readProjects().find((item) => item._id === projectId || item.id === projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  return normalizeProject(project);
}

export function createLocalProject(payload = {}) {
  const { title, type, category = "Other", description = "", collaborators = [] } = payload;

  if (!title || !type) {
    throw new Error("Project title and type are required");
  }

  if (!["text", "image"].includes(type)) {
    throw new Error("Project type must be text or image");
  }

  const now = new Date().toISOString();
  const project = normalizeProject({
    _id: createLocalId(),
    title: String(title).trim(),
    type,
    category: String(category || "Other").trim() || "Other",
    description: String(description || "").trim(),
    owner: getOwnerSnapshot(),
    collaborators,
    createdAt: now,
    updatedAt: now,
    __localOnly: true
  });

  writeProjects([project, ...readProjects()]);
  return project;
}

export function updateLocalProject(projectId, updates = {}) {
  const projects = readProjects();
  const index = projects.findIndex((item) => item._id === projectId || item.id === projectId);

  if (index < 0) {
    throw new Error("Project not found");
  }

  const allowed = ["title", "type", "category", "description", "collaborators"];
  const next = { ...projects[index] };

  if (updates.type !== undefined && !["text", "image"].includes(updates.type)) {
    throw new Error("Project type must be text or image");
  }

  allowed.forEach((field) => {
    if (updates[field] !== undefined) {
      next[field] = typeof updates[field] === "string" ? updates[field].trim() : updates[field];
    }
  });

  next.updatedAt = new Date().toISOString();
  projects[index] = next;
  writeProjects(projects);
  return normalizeProject(next);
}

export function inviteLocalProjectCollaborator(projectId, email) {
  if (!email || !String(email).trim()) {
    throw new Error("Invite email is required");
  }

  const project = getLocalProjectById(projectId);
  const collaborator = {
    _id: `local_user_${String(email).trim().toLowerCase()}`,
    name: String(email).trim().split("@")[0],
    email: String(email).trim().toLowerCase()
  };

  const exists = (project.collaborators || []).some(
    (item) => item.email === collaborator.email || item._id === collaborator._id
  );

  if (exists) {
    return project;
  }

  return updateLocalProject(projectId, {
    collaborators: [...(project.collaborators || []), collaborator]
  });
}

export function deleteLocalProject(projectId) {
  const projects = readProjects();
  const next = projects.filter((item) => item._id !== projectId && item.id !== projectId);

  if (next.length === projects.length) {
    throw new Error("Project not found");
  }

  writeProjects(next);
}

export function clearLocalProjects() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
