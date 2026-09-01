import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const skillSlugs = [
  "sendmux-cli",
  "sendmux-email-for-agents",
  "sendmux-getting-started",
  "sendmux-mailbox-agent",
  "sendmux-send-email",
  "sendmux-token-efficient-usage",
];

test("agent skills and evals describe 5 GiB as the owner-approved storage floor", async () => {
  for (const slug of skillSlugs) {
    const skill = await readFile(new URL(`../skills/${slug}/SKILL.md`, import.meta.url), "utf8");
    const evals = await readFile(new URL(`../skills/${slug}/evals/evals.json`, import.meta.url), "utf8");

    assert.match(skill, /at least 5 GiB/, `${slug} skill must state the owner-approved storage floor`);
    assert.match(
      skill,
      /Revoking sending does not itself change the current inbox storage allocation\./,
      `${slug} skill must describe the direct effect of sending revocation without promising a permanent storage floor`,
    );
    assert.match(evals, /at least 5 GiB/, `${slug} evals must require the owner-approved storage floor`);
  }

  const mailboxAgentEvals = await readFile(
    new URL("../skills/sendmux-mailbox-agent/evals/evals.json", import.meta.url),
    "utf8",
  );
  assert.match(mailboxAgentEvals, /revocation itself does not change the current storage allocation/i);
});
