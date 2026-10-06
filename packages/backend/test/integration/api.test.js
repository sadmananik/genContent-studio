const assert = require("node:assert/strict");
const { before, after, beforeEach, test, mock } = require("node:test");
const { once } = require("node:events");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { MongoMemoryServer } = require("mongodb-memory-server");

// Never load .env files or connect to a supplied MongoDB URI.
process.env.NODE_ENV = "test";
process.env.AUTH_TOKEN_SECRET = "integration-test-secret-not-for-deployment";
const emails = [];
const email = require("../../src/utils/email");
for (const name of [
  "sendEmailVerificationEmail",
  "sendPasswordResetEmail",
  "sendPasswordChangeEmail",
  "sendExistingUserProjectInviteEmail",
  "sendNewUserProjectInviteEmail"
]) {
  mock.method(email, name, async (message) => emails.push(message));
}
const ai = require("../../src/services/openaiService");
const generateText = mock.method(ai, "generateText", async () => ({
  text: "Test draft",
  model: "mock"
}));
mock.method(ai, "generateImage", async () => ({ imageUrl: "data:image/png;base64,dGVzdA==" }));
const createApp = require("../../src/app");
const User = require("../../src/models/User");
const Project = require("../../src/models/Project");
const TextContent = require("../../src/models/TextContent");
const Template = require("../../src/models/Template");
const TemplatePreference = require("../../src/models/TemplatePreference");
const TemplateVote = require("../../src/models/TemplateVote");
const ProjectInvite = require("../../src/models/ProjectInvite");
const { signAuthToken } = require("../../src/utils/token");
let mongo, server, baseUrl;
let owner, outsider;

before(
  async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: "backend_integration" });
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
    server = createApp().listen(0, "127.0.0.1");
    await once(server, "listening");
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  },
  { timeout: 600000 }
);

after(async () => {
  if (server)
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
  mock.restoreAll();
});

beforeEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({}))
  );
  emails.length = 0;
  generateText.mock.resetCalls();
  [owner, outsider] = await User.create([
    { name: "Owner", email: "owner@example.test", passwordHash: "unused" },
    { name: "Outsider", email: "outsider@example.test", passwordHash: "unused" }
  ]);
});

async function request(path, { method = "GET", body, user, token } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (user || token) headers.Authorization = `Bearer ${token || signAuthToken(user)}`;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

async function createProject() {
  const response = await request("/api/projects", {
    method: "POST",
    user: owner,
    body: { title: " Draft ", type: "text" }
  });
  assert.equal(response.status, 201);
  return response.body;
}

test("health, unknown routes, and test-only routes have the expected status", async () => {
  assert.deepEqual(await request("/health"), {
    status: 200,
    body: { status: "ok", service: "gencontent-backend" }
  });
  assert.equal((await request("/missing")).status, 404);
  assert.equal((await request("/api/test/mailbox")).status, 404);
});

test("protected APIs reject missing and invalid credentials", async () => {
  for (const path of [
    "/api/projects",
    "/api/users",
    "/api/text-content/507f1f77bcf86cd799439011"
  ]) {
    assert.equal((await request(path)).status, 401);
    assert.equal((await request(path, { token: "invalid" })).status, 401);
  }
  assert.equal((await request("/api/projects/not-an-id", { user: owner })).status, 400);
});

test("registration, verification, login, and single-use password reset work together", async () => {
  const credentials = { email: "new@example.test", password: "StrongPassword123!" };
  const registered = await request("/api/auth/register", {
    method: "POST",
    body: { ...credentials, name: " New User ", email: " NEW@example.test " }
  });
  assert.equal(registered.status, 201);
  assert.equal(registered.body.user.name, "New User");
  assert.equal(registered.body.user.email, credentials.email);
  assert.equal(registered.body.user.passwordHash, undefined);
  const stored = await User.findOne({ email: credentials.email });
  assert.notEqual(stored.passwordHash, credentials.password);
  assert.equal(await bcrypt.compare(credentials.password, stored.passwordHash), true);
  assert.equal(
    (await request("/api/auth/login", { method: "POST", body: credentials })).status,
    403
  );
  assert.equal(
    (
      await request("/api/auth/register", {
        method: "POST",
        body: { ...credentials, name: "Duplicate" }
      })
    ).status,
    409
  );
  const token = new URL(emails[0].verificationUrl).searchParams.get("token");
  assert.equal(
    (await request("/api/auth/verify-email", { method: "POST", body: { token } })).status,
    200
  );
  assert.equal(
    (await request("/api/auth/verify-email", { method: "POST", body: { token } })).status,
    400
  );
  assert.equal((await User.findById(stored._id)).emailVerified, true);
  const loggedIn = await request("/api/auth/login", { method: "POST", body: credentials });
  assert.equal(loggedIn.status, 200);
  assert.equal((await request("/api/projects", { token: loggedIn.body.token })).status, 200);
  assert.equal(
    (
      await request("/api/auth/login", {
        method: "POST",
        body: { ...credentials, password: "wrong" }
      })
    ).status,
    401
  );
  const known = await request("/api/auth/forgot-password", {
    method: "POST",
    body: { email: credentials.email }
  });
  const unknown = await request("/api/auth/forgot-password", {
    method: "POST",
    body: { email: "missing@example.test" }
  });
  assert.deepEqual(known, unknown);
  const resetToken = new URL(emails.at(-1).resetUrl).searchParams.get("token");
  const reset = { token: resetToken, password: "ChangedPassword123!" };
  assert.equal(
    (await request("/api/auth/reset-password", { method: "POST", body: reset })).status,
    200
  );
  assert.equal(
    (await request("/api/auth/reset-password", { method: "POST", body: reset })).status,
    400
  );
  assert.equal(
    (await request("/api/auth/login", { method: "POST", body: credentials })).status,
    401
  );
  assert.equal(
    (
      await request("/api/auth/login", {
        method: "POST",
        body: { ...credentials, password: reset.password }
      })
    ).status,
    200
  );
});

test("invalid registration and project input do not create records", async () => {
  for (const body of [{}, { name: "Name", email: "a@example.test", password: "short" }]) {
    assert.equal((await request("/api/auth/register", { method: "POST", body })).status, 400);
  }
  for (const body of [
    { title: " ", type: "text" },
    { title: "Title", type: "invalid" },
    { title: "Title", type: "text", collaborators: ["invalid"] }
  ]) {
    assert.equal(
      (await request("/api/projects", { method: "POST", user: owner, body })).status,
      400
    );
  }
  assert.equal(await User.countDocuments(), 2);
  assert.equal(await Project.countDocuments(), 0);
});

test("project CRUD persists changes, isolates owners, and deletes associated content", async () => {
  const project = await createProject();
  const path = `/api/projects/${project._id}`;
  assert.equal(project.title, "Draft");
  assert.equal(project.canDelete, true);
  assert.equal((await Project.findById(project._id)).title, "Draft");
  assert.equal((await request("/api/projects", { user: owner })).body.length, 1);
  assert.deepEqual((await request("/api/projects", { user: outsider })).body, []);
  for (const method of ["GET", "PUT", "DELETE"]) {
    assert.equal(
      (
        await request(path, {
          method,
          user: outsider,
          body: method === "PUT" ? { title: "stolen" } : undefined
        })
      ).status,
      404
    );
  }
  assert.equal(
    (
      await request(path, {
        method: "PUT",
        user: owner,
        body: { title: " Updated ", owner: outsider.id }
      })
    ).status,
    200
  );
  const updated = await Project.findById(project._id);
  assert.equal(updated.title, "Updated");
  assert.equal(String(updated.owner), owner.id);
  for (const content of ["First draft", "Revised draft"]) {
    assert.equal(
      (
        await request("/api/text-content", {
          method: "PUT",
          user: owner,
          body: { project: project._id, content }
        })
      ).status,
      200
    );
  }
  assert.equal(await TextContent.countDocuments(), 1);
  assert.equal(
    (await request(`/api/text-content/${project._id}`, { user: owner })).body.content,
    "Revised draft"
  );
  assert.equal((await request(path, { user: owner })).body.starterContent, "Revised draft");
  assert.equal((await request(path, { method: "DELETE", user: owner })).status, 204);
  assert.equal(await Project.countDocuments(), 0);
  assert.equal(await TextContent.countDocuments(), 0);
  assert.equal((await request(path, { user: owner })).status, 404);
});

test("viewers can read content but cannot save or invoke AI; editors can save", async () => {
  const project = await createProject();
  await request("/api/text-content", {
    method: "PUT",
    user: owner,
    body: { project: project._id, content: "Original" }
  });
  await Project.findByIdAndUpdate(project._id, {
    collaborators: [outsider._id],
    collaboratorPermissions: [{ user: outsider._id, accessLevel: "viewer" }]
  });
  assert.equal((await request(`/api/text-content/${project._id}`, { user: outsider })).status, 200);
  assert.equal(
    (
      await request("/api/text-content", {
        method: "PUT",
        user: outsider,
        body: { project: project._id, content: "Unauthorized" }
      })
    ).status,
    403
  );
  assert.equal(
    (
      await request("/api/ai/generate-text", {
        method: "POST",
        user: outsider,
        body: { project: project._id, prompt: "Draft" }
      })
    ).status,
    403
  );
  assert.equal(generateText.mock.callCount(), 0);
  assert.equal((await TextContent.findOne({ project: project._id })).content, "Original");
  await Project.findByIdAndUpdate(project._id, {
    collaboratorPermissions: [{ user: outsider._id, accessLevel: "editor" }]
  });
  assert.equal(
    (
      await request("/api/text-content", {
        method: "PUT",
        user: outsider,
        body: { project: project._id, content: "Allowed" }
      })
    ).status,
    200
  );
  assert.equal((await TextContent.findOne({ project: project._id })).content, "Allowed");
  const generated = await request("/api/ai/generate-text", {
    method: "POST",
    user: outsider,
    body: { project: project._id, prompt: "Draft" }
  });
  assert.equal(generated.status, 200);
  assert.equal(generated.body.text, "Test draft");
  assert.equal(generateText.mock.callCount(), 1);
});

test("expired verification and reset links cannot modify an account", async () => {
  const crypto = require("node:crypto");
  const token = "expired-test-link";
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  await User.findByIdAndUpdate(owner._id, {
    emailVerified: false,
    emailVerificationTokenHash: hash,
    emailVerificationExpiresAt: new Date(0),
    passwordResetTokenHash: hash,
    passwordResetExpiresAt: new Date(0)
  });
  assert.equal(
    (await request("/api/auth/verify-email", { method: "POST", body: { token } })).status,
    400
  );
  assert.equal(
    (
      await request("/api/auth/reset-password", {
        method: "POST",
        body: { token, password: "Replacement123!" }
      })
    ).status,
    400
  );
  const unchanged = await User.findById(owner._id);
  assert.equal(unchanged.emailVerified, false);
  assert.equal(unchanged.passwordHash, "unused");
});

test("outsiders cannot read or write content and image projects reject text content", async () => {
  const project = await createProject();
  assert.equal((await request(`/api/text-content/${project._id}`, { user: outsider })).status, 404);
  assert.equal(
    (
      await request("/api/text-content", {
        method: "PUT",
        user: outsider,
        body: { project: project._id, content: "Forbidden" }
      })
    ).status,
    404
  );
  assert.equal(await TextContent.countDocuments(), 0);
  await Project.findByIdAndUpdate(project._id, { type: "image" });
  assert.equal(
    (
      await request("/api/text-content", {
        method: "PUT",
        user: owner,
        body: { project: project._id, content: "Wrong type" }
      })
    ).status,
    400
  );
  assert.equal((await request(`/api/text-content/${project._id}`, { user: owner })).status, 400);
  assert.equal(await TextContent.countDocuments(), 0);
});

test("AI service failures pass through the API error handler", async () => {
  const project = await createProject();
  generateText.mock.mockImplementationOnce(async () => {
    throw Object.assign(new Error("AI provider unavailable"), { statusCode: 502 });
  });
  const response = await request("/api/ai/generate-text", {
    method: "POST",
    user: owner,
    body: { project: project._id, prompt: "Draft" }
  });
  assert.deepEqual(response, { status: 502, body: { message: "AI provider unavailable" } });
});

async function publishTemplate(visibility = "public") {
  const project = await createProject();
  const saved = await request("/api/text-content", {
    method: "PUT",
    user: owner,
    body: { project: project._id, content: "Reusable draft" }
  });
  assert.equal(saved.status, 200);
  const published = await request(`/api/templates/projects/${project._id}`, {
    method: "POST",
    user: owner,
    body: { title: " Published draft ", visibility }
  });
  assert.equal(published.status, 201);
  return { project, template: published.body };
}

test("publishing preserves content and only the project owner can publish", async () => {
  const { project, template } = await publishTemplate();
  assert.equal(template.title, "Published draft");
  assert.equal(template.starterContent, "Reusable draft");
  assert.equal(template.creator.id, owner.id);
  assert.equal(template.canManage, true);
  const stored = await Template.findById(template.id);
  assert.equal(String(stored.sourceProject), project._id);
  assert.equal(stored.visibility, "public");
  assert.equal((await request("/api/templates", { user: outsider })).body[0].id, template.id);
  assert.equal((await request("/api/templates/mine", { user: owner })).body.length, 1);
  assert.deepEqual((await request("/api/templates/mine", { user: outsider })).body, []);
  // Even an editor cannot publish another user's project.
  await Project.findByIdAndUpdate(project._id, {
    collaborators: [outsider._id],
    collaboratorPermissions: [{ user: outsider._id, accessLevel: "editor" }]
  });
  assert.equal(
    (
      await request(`/api/templates/projects/${project._id}`, {
        method: "POST",
        user: outsider,
        body: { title: "Stolen", visibility: "public" }
      })
    ).status,
    404
  );
  for (const body of [{ title: " " }, { title: "Invalid", visibility: "invalid" }]) {
    assert.equal(
      (
        await request(`/api/templates/projects/${project._id}`, {
          method: "POST",
          user: owner,
          body
        })
      ).status,
      400
    );
  }
  assert.equal(await Template.countDocuments(), 1);
});

test("private templates enforce visibility and only the creator can manage them", async () => {
  const { template } = await publishTemplate("private");
  const path = `/api/templates/${template.id}`;
  assert.deepEqual((await request("/api/templates", { user: outsider })).body, []);
  assert.equal((await request(path, { user: owner })).status, 200);
  for (const [suffix, method, body] of [
    ["", "GET"],
    ["/favorite", "PUT"],
    ["/use", "POST", {}],
    ["/vote", "POST", { voteType: "up" }],
    ["/visibility", "PATCH", { visibility: "public" }],
    ["", "PUT", { title: "Stolen" }],
    ["", "DELETE"]
  ]) {
    assert.equal((await request(path + suffix, { method, user: outsider, body })).status, 404);
  }
  assert.equal(
    (
      await request(path + "/visibility", {
        method: "PATCH",
        user: owner,
        body: { visibility: "invalid" }
      })
    ).status,
    400
  );
  assert.equal(
    (
      await request(path + "/visibility", {
        method: "PATCH",
        user: owner,
        body: { visibility: "public" }
      })
    ).status,
    200
  );
  assert.equal((await request(path, { user: outsider })).status, 200);
  assert.equal((await Template.findById(template.id)).visibility, "public");
  assert.equal(await TemplateVote.countDocuments(), 0);
  assert.equal(await TemplatePreference.countDocuments(), 0);
});

test("favourites are idempotent, scoped to each user, and hide newly private templates", async () => {
  const { template } = await publishTemplate();
  const path = `/api/templates/${template.id}`;
  for (let i = 0; i < 2; i++) {
    const response = await request(path + "/favorite", { method: "PUT", user: outsider });
    assert.equal(response.status, 200);
    assert.equal(response.body.isFavorite, true);
  }
  assert.equal((await TemplatePreference.findOne({ user: outsider._id })).favorites.length, 1);
  assert.equal((await request(path, { user: outsider })).body.isFavorite, true);
  assert.equal(
    (await request("/api/templates/favorites", { user: outsider })).body[0].id,
    template.id
  );
  assert.deepEqual((await request("/api/templates/favorites", { user: owner })).body, []);
  for (let i = 0; i < 2; i++) {
    const response = await request(path + "/favorite", { method: "DELETE", user: outsider });
    assert.equal(response.status, 200);
    assert.equal(response.body.isFavorite, false);
  }
  assert.equal((await TemplatePreference.findOne({ user: outsider._id })).favorites.length, 0);
  assert.deepEqual((await request("/api/templates/favorites", { user: outsider })).body, []);
  await request(path + "/favorite", { method: "PUT", user: outsider });
  await request(path + "/visibility", {
    method: "PATCH",
    user: owner,
    body: { visibility: "private" }
  });
  assert.deepEqual((await request("/api/templates/favorites", { user: outsider })).body, []);
});

test("votes toggle off, switch direction, and aggregate independently for each user", async () => {
  const { template } = await publishTemplate();
  const path = `/api/templates/${template.id}`;
  async function vote(user, voteType, expected) {
    const response = await request(path + "/vote", { method: "POST", user, body: { voteType } });
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, expected);
  }
  await vote(outsider, "up", { upvoteCount: 1, downvoteCount: 0, currentUserVote: "up" });
  await vote(outsider, "up", { upvoteCount: 0, downvoteCount: 0, currentUserVote: null });
  await vote(outsider, "down", { upvoteCount: 0, downvoteCount: 1, currentUserVote: "down" });
  await vote(outsider, "down", { upvoteCount: 0, downvoteCount: 0, currentUserVote: null });
  await vote(outsider, "up", { upvoteCount: 1, downvoteCount: 0, currentUserVote: "up" });
  await vote(outsider, "down", { upvoteCount: 0, downvoteCount: 1, currentUserVote: "down" });
  await vote(owner, "up", { upvoteCount: 1, downvoteCount: 1, currentUserVote: "up" });
  assert.equal(await TemplateVote.countDocuments({ template: template.id }), 2);
  assert.equal(
    (await TemplateVote.findOne({ template: template.id, user: outsider._id })).voteType,
    "down"
  );
  assert.equal((await request(path, { user: outsider })).body.currentUserVote, "down");
  assert.equal((await request(path, { user: owner })).body.currentUserVote, "up");
  assert.equal(
    (await request(path + "/vote", { method: "POST", user: owner, body: { voteType: "invalid" } }))
      .status,
    400
  );
  assert.equal(await TemplateVote.countDocuments(), 2);
});

test("using and deleting a published template preserves projects and cleans related preferences and votes", async () => {
  const { template } = await publishTemplate();
  const path = `/api/templates/${template.id}`;
  const used = await request(path + "/use", {
    method: "POST",
    user: outsider,
    body: { title: "My copy" }
  });
  assert.equal(used.status, 201);
  const copy = used.body.project;
  assert.equal(copy.owner, outsider.id);
  assert.equal(copy.title, "My copy");
  assert.equal((await TextContent.findOne({ project: copy._id })).content, "Reusable draft");
  assert.equal((await Template.findById(template.id)).useCount, 1);
  assert.equal(
    (await request("/api/templates/recent", { user: outsider })).body[0].id,
    template.id
  );
  await request(path + "/favorite", { method: "PUT", user: outsider });
  await request(path + "/vote", { method: "POST", user: outsider, body: { voteType: "up" } });
  assert.equal((await request(path, { method: "DELETE", user: owner })).status, 200);
  assert.equal(await Template.findById(template.id), null);
  assert.equal(await TemplateVote.countDocuments(), 0);
  const preference = await TemplatePreference.findOne({ user: outsider._id });
  assert.equal(preference.favorites.length, 0);
  assert.equal(preference.recentlyUsed.length, 0);
  assert.equal((await Project.findById(copy._id)).sourceTemplate, null);
  assert.equal((await TextContent.findOne({ project: copy._id })).content, "Reusable draft");
});

async function invite(projectId, emailAddress, accessLevel = "viewer", user = owner) {
  return request(`/api/projects/${projectId}/invite`, {
    method: "PATCH",
    user,
    body: { email: emailAddress, accessLevel }
  });
}

test("sharing with an existing user supports permission changes, removal, and leaving", async () => {
  const project = await createProject();
  const path = `/api/projects/${project._id}`;
  for (let i = 0; i < 2; i++) {
    assert.equal((await invite(project._id, " OUTSIDER@example.test ")).status, 200);
  }
  let stored = await Project.findById(project._id);
  assert.equal(stored.collaborators.length, 1);
  assert.equal(stored.collaboratorPermissions.length, 1);
  assert.equal(emails.length, 2);
  assert.equal(emails[0].email, outsider.email);
  const shared = await request("/api/projects/shared", { user: outsider });
  assert.equal(shared.body[0]._id, project._id);
  assert.equal(shared.body[0].canEdit, false);
  assert.equal(shared.body[0].canManageSharing, false);
  assert.equal(shared.body[0].canDelete, false);
  assert.equal((await invite(project._id, outsider.email, "editor")).status, 200);
  assert.equal((await request(path, { user: outsider })).body.canEdit, true);
  assert.equal(
    (
      await request("/api/text-content", {
        method: "PUT",
        user: outsider,
        body: { project: project._id, content: "Shared draft" }
      })
    ).status,
    200
  );
  assert.equal((await invite(project._id, outsider.email, "viewer")).status, 200);
  assert.equal(
    (
      await request("/api/text-content", {
        method: "PUT",
        user: outsider,
        body: { project: project._id, content: "Blocked" }
      })
    ).status,
    403
  );
  assert.equal(
    (await request(path, { method: "PUT", user: owner, body: { collaborators: [] } })).status,
    200
  );
  assert.equal((await request(path, { user: outsider })).status, 404);
  assert.deepEqual((await request("/api/projects/shared", { user: outsider })).body, []);
  await invite(project._id, outsider.email);
  assert.equal(
    (await request(path + "/collaborators/me", { method: "DELETE", user: outsider })).status,
    200
  );
  stored = await Project.findById(project._id);
  assert.equal(stored.collaborators.length, 0);
  assert.equal(stored.collaboratorPermissions.length, 0);
  assert.equal((await request(path, { user: outsider })).status, 404);
  assert.equal(
    (await request(path + "/collaborators/me", { method: "DELETE", user: owner })).status,
    404
  );
});

test("only owners can invite and invalid invitations leave sharing unchanged", async () => {
  const project = await createProject();
  assert.equal((await invite(project._id, "new@example.test", "editor", outsider)).status, 404);
  assert.equal((await invite(project._id, " ")).status, 400);
  assert.equal((await invite(project._id, owner.email)).status, 400);
  await invite(project._id, outsider.email, "editor");
  assert.equal((await invite(project._id, "new@example.test", "editor", outsider)).status, 404);
  assert.equal(
    (
      await request(`/api/projects/${project._id}`, {
        method: "PUT",
        user: outsider,
        body: { collaborators: [] }
      })
    ).status,
    404
  );
  const stored = await Project.findById(project._id);
  assert.equal(stored.collaborators.length, 1);
  assert.equal(await ProjectInvite.countDocuments(), 0);
  assert.equal(emails.length, 1);
});

test("pending invitations are deduplicated and applied when a new user verifies their email", async () => {
  const project = await createProject();
  const emailAddress = "invitee@example.test";
  assert.equal((await invite(project._id, emailAddress, "editor")).status, 200);
  assert.equal((await invite(project._id, emailAddress, "viewer")).status, 200);
  assert.equal(await ProjectInvite.countDocuments(), 1);
  assert.equal((await ProjectInvite.findOne()).accessLevel, "viewer");
  assert.equal((await Project.findById(project._id)).collaborators.length, 0);
  assert.equal(new URL(emails[0].registerUrl).searchParams.get("email"), emailAddress);
  const credentials = { email: emailAddress, password: "InviteePassword123!" };
  assert.equal(
    (
      await request("/api/auth/register", {
        method: "POST",
        body: { ...credentials, name: "Invitee" }
      })
    ).status,
    201
  );
  assert.equal(await ProjectInvite.countDocuments(), 1);
  const token = new URL(emails.at(-1).verificationUrl).searchParams.get("token");
  assert.equal(
    (await request("/api/auth/verify-email", { method: "POST", body: { token } })).status,
    200
  );
  const invitee = await User.findOne({ email: emailAddress });
  const stored = await Project.findById(project._id);
  assert.deepEqual(stored.collaborators.map(String), [invitee.id]);
  assert.equal(stored.collaboratorPermissions[0].accessLevel, "viewer");
  assert.equal(await ProjectInvite.countDocuments(), 0);
  assert.equal((await request("/api/projects/shared", { user: invitee })).body[0]._id, project._id);
  assert.equal(
    (await request("/api/auth/login", { method: "POST", body: credentials })).status,
    200
  );
  assert.equal((await Project.findById(project._id)).collaborators.length, 1);
});
