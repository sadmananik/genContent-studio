import { act } from "@testing-library/react";
import { useAppStore } from "../src/store";

export const user = {
  id: "507f1f77bcf86cd799439011",
  name: "Test Creator",
  email: "creator@example.test",
  profile: {}
};
export const project = {
  _id: "507f1f77bcf86cd799439012",
  title: "Integration draft",
  type: "text",
  category: "Blog Post",
  owner: user,
  collaborators: [],
  collaboratorPermissions: [],
  canEdit: true,
  canDelete: true,
  canManageSharing: true,
  currentUserRole: "owner",
  accessLevel: "editor",
  updatedAt: "2026-01-01T00:00:00Z"
};
export const template = {
  id: "507f1f77bcf86cd799439013",
  title: "Blog starter",
  projectType: "text",
  category: "Blog",
  visibility: "public",
  creator: user,
  canManage: true,
  tags: [],
  starterContent: "Reusable draft",
  upvoteCount: 0,
  downvoteCount: 0,
  currentUserVote: null,
  isFavorite: false
};
const initialState = useAppStore.getState();
let unexpectedRequests = [];
beforeEach(() => {
  unexpectedRequests = [];
});
afterEach(() => {
  expect(unexpectedRequests).toEqual([]);
});

export function resetStore(authenticated = true) {
  act(() =>
    useAppStore.setState(
      {
        ...initialState,
        auth: {
          ...initialState.auth,
          user: authenticated ? user : null,
          token: authenticated ? "test-token" : null,
          isAuthenticated: authenticated,
          loading: false,
          error: null
        }
      },
      true
    )
  );
  if (authenticated)
    window.sessionStorage.setItem(
      "gencontent-auth",
      JSON.stringify({ user, token: "test-token", rememberMe: false })
    );
}

// Keep the real API client and Zustand actions; mock only the network boundary.
export function mockApi(routes = {}) {
  global.fetch = jest.fn(async (url, options = {}) => {
    const parsed = new URL(url, "http://localhost:4000");
    const key = `${options.method || "GET"} ${parsed.pathname}`;
    if (!(key in routes)) {
      unexpectedRequests.push(key);
      throw new Error(`Unmocked API request: ${key}`);
    }
    const handler = routes[key];
    const result = typeof handler === "function" ? await handler(options, parsed) : handler;
    return {
      ok: (result.status || 200) < 400,
      status: result.status || 200,
      json: async () => result.body
    };
  });
  return global.fetch;
}

export function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
