"use client";

import { create } from "zustand";
import { createAiReducer } from "./reducers/aiReducer";
import { createAuthReducer } from "./reducers/authReducer";
import { createCollaborationReducer } from "./reducers/collaborationReducer";
import { createProjectReducer } from "./reducers/projectReducer";
import { createTemplateReducer } from "./reducers/templateReducer";
import { createUserReducer } from "./reducers/userReducer";

export const useAppStore = create((set, get) => ({
  ...createAuthReducer(set, get),
  ...createUserReducer(set, get),
  ...createProjectReducer(set, get),
  ...createTemplateReducer(set, get),
  ...createAiReducer(set, get),
  ...createCollaborationReducer(set, get)
}));
