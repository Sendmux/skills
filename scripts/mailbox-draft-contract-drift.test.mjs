import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseInputs = JSON.parse(
  readFileSync(path.join(repoRoot, "skill-compatibility.json"), "utf8"),
).releaseInputs;
const sdkRoot = process.env.SENDMUX_SDK || path.join(repoRoot, "_sdk");
assert.ok(
  existsSync(sdkRoot),
  `Missing SDK fixture at ${sdkRoot}; set SENDMUX_SDK or check out the pinned SDK to _sdk`,
);
const appOpenApi =
  process.env.SENDMUX_APP_OPENAPI || path.join(repoRoot, releaseInputs.app.openapi);
const sendingOpenApi =
  process.env.SENDMUX_SENDING_OPENAPI ||
  path.join(repoRoot, releaseInputs.sending.openapi);
const artifactsRoot = path.join(repoRoot, ".claude/artifacts/monid-readiness-skills");
const operations = [
  ["get", "/mailbox/drafts"],
  ["post", "/mailbox/drafts"],
  ["get", "/mailbox/drafts/{draftId}"],
  ["patch", "/mailbox/drafts/{draftId}"],
  ["delete", "/mailbox/drafts/{draftId}"],
  ["post", "/mailbox/drafts/{draftId}/send"],
  ["patch", "/mailbox/drafts/{draftId}/schedule"],
  ["post", "/mailbox/messages/{message_id}/attachments/{attachment_id}/text"],
  ["get", "/mailbox/messages/{message_id}/attachments/{attachment_id}/text"],
];

// A generated spec dropping one public operation must fail before its skill ships.
for (const [method, route] of operations) {
  test(`rejects a missing ${method.toUpperCase()} ${route} contract`, (t) => {
    mkdirSync(artifactsRoot, { recursive: true });
    const fixtureRoot = mkdtempSync(path.join(artifactsRoot, "drift-"));
    t.after(() => rmSync(fixtureRoot, { recursive: true, force: true }));
    const spec = JSON.parse(readFileSync(appOpenApi, "utf8"));
    assert.ok(
      spec.paths[route]?.[method],
      "verified candidate operation must exist before mutation",
    );
    delete spec.paths[route][method];
    const specPath = path.join(fixtureRoot, "openapi-app.json");
    writeFileSync(specPath, JSON.stringify(spec));
    const result = spawnSync(
      process.execPath,
      [path.join(repoRoot, "scripts/check-skill-drift.mjs")],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          SENDMUX_SDK: sdkRoot,
          SENDMUX_APP_OPENAPI: specPath,
          SENDMUX_SENDING_OPENAPI: sendingOpenApi,
        },
      },
    );
    assert.equal(result.status, 1);
    assert.ok(
      result.stderr.includes(`missing ${method.toUpperCase()} ${route} in ${specPath}`),
      result.stderr,
    );
  });
}
