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
    assert.match(evals, /at least 5 GiB/, `${slug} evals must require the owner-approved storage floor`);
  }
});
