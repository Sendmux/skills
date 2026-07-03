import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  isNewSkillRateLimitError,
  parseRateLimitResetSeconds,
  planRateLimitRetry,
} from "./publish-openclaw-bundle.mjs";

test("detects ClawHub new-skill rate-limit failures", () => {
  const stderr = [
    "Error: Rate limit: max 5 new skills per hour. Please wait before publishing more.",
    "    at enforceNewSkillRateLimit (../../convex/skills.ts:1505:6) (reset in 57s)",
  ].join("\n");

  assert.equal(isNewSkillRateLimitError(stderr), true);
  assert.equal(parseRateLimitResetSeconds(stderr), 57);
});

test("does not retry unrelated ClawHub failures", () => {
  const stderr = "Error: missing metadata.openclaw";

  assert.equal(isNewSkillRateLimitError(stderr), false);
  assert.equal(parseRateLimitResetSeconds(stderr), null);
});

test("adds a small buffer to rate-limit retry waits", () => {
  const retry = planRateLimitRetry({
    output: "Rate limit: max 5 new skills per hour (reset in 57s)",
    bufferSeconds: 5,
    maxWaitSeconds: 120,
  });

  assert.deepEqual(retry, { shouldRetry: true, waitSeconds: 62 });
});

test("refuses rate-limit waits beyond the configured ceiling", () => {
  const retry = planRateLimitRetry({
    output: "Rate limit: max 5 new skills per hour (reset in 3600s)",
    bufferSeconds: 5,
    maxWaitSeconds: 120,
  });

  assert.deepEqual(retry, { shouldRetry: false, waitSeconds: 3605 });
});

test("workflow publishes through the rate-limit-aware wrapper", () => {
  const workflow = readFileSync(".github/workflows/openclaw-clawhub.yml", "utf8");

  assert.match(workflow, /node scripts\/publish-openclaw-bundle\.mjs --dry-run/);
  assert.match(workflow, /node scripts\/publish-openclaw-bundle\.mjs/);
  assert.doesNotMatch(workflow, /for skill_path in dist\/clawhub\/skills\/\*/);
});

test("workflow auto-publishes ClawHub skills on main pushes", () => {
  const workflow = readFileSync(".github/workflows/openclaw-clawhub.yml", "utf8");

  assert.match(workflow, /if:\s*\$\{\{\s*github\.event_name == 'push'/);
  assert.match(workflow, /^\s+environment:\s+clawhub$/m);
});
