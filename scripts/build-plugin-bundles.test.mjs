import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildPluginBundles, collectPluginBundleDrift } from "./build-plugin-bundles.mjs";

function makeRepo() {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "sendmux-plugin-bundles-"));
  mkdirSync(path.join(repoRoot, "skills", "sendmux-test", "references"), { recursive: true });
  mkdirSync(path.join(repoRoot, "skills", "sendmux-test", "agents"), { recursive: true });
  mkdirSync(path.join(repoRoot, "skills", "sendmux-test", "evals"), { recursive: true });
  writeFileSync(
    path.join(repoRoot, "openclaw.skills.json"),
    `${JSON.stringify(
      {
        homepage: "https://github.com/Sendmux/skills",
        version: "1.2.3",
        skills: {
          "sendmux-test": {
            displayName: "Sendmux Test",
            description: "Test Sendmux workflow.",
          },
        },
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    path.join(repoRoot, "skills", "sendmux-test", "SKILL.md"),
    [
      "---",
      "name: sendmux-test",
      "description: Test Sendmux workflow.",
      "---",
      "",
      "# Sendmux test",
      "",
      "Use this test skill.",
      "",
    ].join("\n"),
  );
  writeFileSync(
    path.join(repoRoot, "skills", "sendmux-test", "references", "notes.md"),
    "reference\n",
  );
  writeFileSync(
    path.join(repoRoot, "skills", "sendmux-test", "agents", "openai.yaml"),
    "interface:\n  display_name: Sendmux Test\n  short_description: Test\n",
  );
  writeFileSync(path.join(repoRoot, "skills", "sendmux-test", "evals", "evals.json"), "[]\n");
  return repoRoot;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

test("builds marketplace plugin bundles from canonical skills", () => {
  const repoRoot = makeRepo();
  try {
    buildPluginBundles(repoRoot);

    const claudeMarketplace = readJson(
      path.join(repoRoot, ".claude-plugin", "marketplace.json"),
    );
    assert.equal(claudeMarketplace.name, "sendmux");
    assert.equal(claudeMarketplace.owner.name, "Sendmux");
    assert.equal(claudeMarketplace.plugins[0].name, "sendmux");
    assert.equal(claudeMarketplace.plugins[0].source, "./plugins/sendmux");
    assert.equal(claudeMarketplace.plugins[0].version, "1.2.3");

    const codexMarketplace = readJson(
      path.join(repoRoot, ".agents", "plugins", "marketplace.json"),
    );
    assert.equal(codexMarketplace.name, "sendmux");
    assert.equal(codexMarketplace.interface.displayName, "Sendmux");
    assert.equal(codexMarketplace.plugins[0].source.path, "./plugins/sendmux");
    assert.equal(codexMarketplace.plugins[0].policy.installation, "AVAILABLE");

    const codexManifest = readJson(
      path.join(repoRoot, "plugins", "sendmux", ".codex-plugin", "plugin.json"),
    );
    assert.equal(codexManifest.name, "sendmux");
    assert.equal(codexManifest.version, "1.2.3");
    assert.equal(codexManifest.skills, "./skills/");
    assert.equal(codexManifest.interface.displayName, "Sendmux");

    assert.equal(
      existsSync(path.join(repoRoot, "plugins", "sendmux", "skills", "sendmux-test", "SKILL.md")),
      true,
    );
    assert.equal(
      existsSync(
        path.join(repoRoot, "plugins", "sendmux", "skills", "sendmux-test", "references", "notes.md"),
      ),
      true,
    );
    assert.equal(
      existsSync(
        path.join(repoRoot, "plugins", "sendmux", "skills", "sendmux-test", "agents", "openai.yaml"),
      ),
      true,
    );
    assert.equal(
      existsSync(path.join(repoRoot, "plugins", "sendmux", "skills", "sendmux-test", "evals")),
      false,
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("detects stale committed plugin bundles", () => {
  const repoRoot = makeRepo();
  try {
    buildPluginBundles(repoRoot);
    assert.deepEqual(collectPluginBundleDrift(repoRoot), []);

    writeFileSync(
      path.join(repoRoot, "plugins", "sendmux", "skills", "sendmux-test", "SKILL.md"),
      "stale\n",
    );

    assert.match(collectPluginBundleDrift(repoRoot).join("\n"), /plugins\/sendmux\/skills\/sendmux-test\/SKILL\.md/);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("workflow checks plugin bundle drift", () => {
  const workflow = readFileSync(".github/workflows/plugin-bundles.yml", "utf8");

  assert.match(workflow, /node --test scripts\/build-plugin-bundles\.test\.mjs/);
  assert.match(workflow, /node scripts\/check-plugin-bundles\.mjs/);
  assert.equal(workflow.match(/"skills\/\*\*"/g)?.length, 2);
  assert.equal(workflow.match(/"openclaw\.skills\.json"/g)?.length, 2);
});
