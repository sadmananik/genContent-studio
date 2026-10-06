const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  normalizeString,
  requireTrimmedString,
  normalizeObjectIdList
} = require("../../src/utils/validation");
const { signAuthToken, verifyAuthToken } = require("../../src/utils/token");
const { requireProjectEditAccess } = require("../../src/controllers/projectController");

const owner = "507f1f77bcf86cd799439011";
const editor = "507f1f77bcf86cd799439012";
const viewer = "507f1f77bcf86cd799439013";

process.env.AUTH_TOKEN_SECRET = "unit-test-secret-not-for-deployment";

test("strings are trimmed and nonstrings use the fallback", () => {
  assert.equal(normalizeString("  title  "), "title");
  for (const value of [null, undefined, 12, {}]) {
    assert.equal(normalizeString(value, "fallback"), "fallback");
    assert.throws(() => requireTrimmedString(value, "Title"), { statusCode: 400 });
  }
  assert.throws(() => requireTrimmedString("  ", "Title"), { statusCode: 400 });
  assert.equal(requireTrimmedString(" valid ", "Title"), "valid");
});

test("collaborator IDs are validated, trimmed, and deduplicated", () => {
  assert.equal(normalizeObjectIdList(undefined, "Users"), undefined);
  assert.deepEqual(normalizeObjectIdList([], "Users"), []);
  assert.deepEqual(normalizeObjectIdList([owner, ` ${owner} `, editor], "Users"), [owner, editor]);
  for (const input of [null, "invalid", ["invalid"], [null]]) {
    assert.throws(() => normalizeObjectIdList(input, "Users"), { statusCode: 400 });
  }
});

test("authentication tokens round-trip and reject tampering and malformed tokens", () => {
  const token = signAuthToken({ _id: owner });
  const payload = verifyAuthToken(token);
  assert.equal(payload.sub, owner);
  assert.ok(payload.exp > payload.iat);
  const parts = token.split(".");
  parts[1] = Buffer.from(JSON.stringify({ ...payload, sub: editor })).toString("base64url");
  for (const invalid of [parts.join("."), "bad", "a.b.c", undefined]) {
    assert.throws(() => verifyAuthToken(invalid), { statusCode: 401 });
  }
});

test("expired tokens are rejected", (t) => {
  const token = signAuthToken({ _id: owner });
  const { exp } = verifyAuthToken(token);
  t.mock.method(Date, "now", () => (exp + 1) * 1000);
  assert.throws(() => verifyAuthToken(token), { statusCode: 401 });
});

test("only owners and editors can edit project content", () => {
  const project = {
    owner,
    collaborators: [editor, viewer],
    collaboratorPermissions: [
      { user: editor, accessLevel: "editor" },
      { user: viewer, accessLevel: "viewer" }
    ]
  };
  assert.doesNotThrow(() => requireProjectEditAccess(project, owner));
  assert.doesNotThrow(() => requireProjectEditAccess(project, editor));
  assert.throws(() => requireProjectEditAccess(project, viewer), { statusCode: 403 });
  assert.throws(() => requireProjectEditAccess(project, "507f1f77bcf86cd799439014"), {
    statusCode: 403
  });
});
