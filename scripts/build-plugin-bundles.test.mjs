import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
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
  mkdirSync(path.join(repoRoot, "assets"), { recursive: true });
  writeFileSync(
    path.join(repoRoot, "assets", "sendmux-mark.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>\n',
  );
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

    const cursorManifest = readJson(
      path.join(repoRoot, ".cursor-plugin", "plugin.json"),
    );
    assert.deepEqual(cursorManifest, {
      name: "sendmux",
      displayName: "Sendmux",
      version: "1.2.3",
      description:
        "Official Sendmux Agent Skills for email, mailbox, MCP, CLI, and SDK workflows.",
      author: { name: "Sendmux" },
      homepage: "https://docs.sendmux.ai/guides/agent-skills",
      repository: "https://github.com/Sendmux/skills",
      license: "Apache-2.0",
      logo: "assets/sendmux-mark.svg",
      keywords: ["sendmux", "email", "agent-skills", "mcp", "cli"],
      category: "communication",
      skills: "./skills/",
      mcpServers: "./mcp.json",
    });

    const cursorMcp = readFileSync(path.join(repoRoot, "mcp.json"), "utf8");
    const openPluginMcp = readFileSync(path.join(repoRoot, ".mcp.json"), "utf8");
    assert.equal(cursorMcp, openPluginMcp);
    assert.deepEqual(JSON.parse(cursorMcp), {
      mcpServers: {
        sendmux: {
          type: "http",
          url: "https://mcp.sendmux.ai/mcp",
        },
      },
    });

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

test("detects stale Cursor manifest and MCP outputs", () => {
  const repoRoot = makeRepo();
  try {
    for (const relativePath of [
      ".cursor-plugin/plugin.json",
      "mcp.json",
      ".mcp.json",
    ]) {
      buildPluginBundles(repoRoot);
      writeFileSync(path.join(repoRoot, relativePath), "stale\n");
      assert.match(
        collectPluginBundleDrift(repoRoot).join("\n"),
        new RegExp(relativePath.replaceAll(".", "\\.")),
      );
    }
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("fails clearly when the Cursor logo is missing", () => {
  const repoRoot = makeRepo();
  try {
    rmSync(path.join(repoRoot, "assets", "sendmux-mark.svg"));
    assert.throws(
      () => buildPluginBundles(repoRoot),
      /assets\/sendmux-mark\.svg must exist for the Cursor plugin bundle/,
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("fails clearly when canonical skills are missing", () => {
  const repoRoot = makeRepo();
  try {
    rmSync(path.join(repoRoot, "skills"), { recursive: true, force: true });
    assert.throws(
      () => buildPluginBundles(repoRoot),
      /skills\/ must contain at least one skill with SKILL\.md/,
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("workflow checks plugin bundle drift", () => {
  const workflow = readFileSync(".github/workflows/plugin-bundles.yml", "utf8");

  assert.match(workflow, /node --test scripts\/build-plugin-bundles\.test\.mjs/);
  assert.match(workflow, /node scripts\/check-plugin-bundles\.mjs/);
  for (const filteredPath of [
    "skills/\\*\\*",
    "openclaw\\.skills\\.json",
    "assets/\\*\\*",
    "\\.cursor-plugin/\\*\\*",
    "mcp\\.json",
    "\\.mcp\\.json",
  ]) {
    assert.equal(
      workflow.match(new RegExp(`"${filteredPath}"`, "g"))?.length,
      2,
      `${filteredPath} must appear in pull_request and push filters`,
    );
  }
});

test("Cursor discovers every declared canonical skill", () => {
  const manifest = readJson(".cursor-plugin/plugin.json");
  const config = readJson("openclaw.skills.json");
  const skillRoot = path.resolve(manifest.skills);
  const discoverable = readdirSync(skillRoot)
    .filter((slug) => existsSync(path.join(skillRoot, slug, "SKILL.md")))
    .sort();
  assert.deepEqual(discoverable, Object.keys(config.skills).sort());
});
