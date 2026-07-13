#!/usr/bin/env node

import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRepoRoot = path.resolve(__dirname, "..");

const PLUGIN_NAME = "sendmux";
const DISPLAY_NAME = "Sendmux";
const DESCRIPTION =
  "Official Sendmux Agent Skills for email, mailbox, MCP, CLI, and SDK workflows.";
const LONG_DESCRIPTION =
  "Official Sendmux Agent Skills teach Codex how to send email, read mailboxes, manage team resources, and choose efficient Sendmux API, CLI, MCP, or SDK workflows.";
const CURSOR_LOGO = "assets/sendmux-mark.svg";
const MCP_SERVER_URL = "https://mcp.sendmux.ai/mcp";
const RUNTIME_SKILL_ENTRIES = ["SKILL.md", "references", "scripts", "assets", "agents"];
const GENERATED_OUTPUTS = [
  ".claude-plugin",
  ".agents/plugins",
  ".cursor-plugin",
  ".mcp.json",
  "mcp.json",
  "plugins/sendmux",
];

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJson(filePath, payload) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function listSkillSlugs(repoRoot) {
  const sourceRoot = path.join(repoRoot, "skills");
  if (!existsSync(sourceRoot)) {
    throw new Error("skills/ must contain at least one skill with SKILL.md");
  }
  const slugs = readdirSync(sourceRoot)
    .filter((entry) => {
      const entryPath = path.join(sourceRoot, entry);
      return statSync(entryPath).isDirectory();
    })
    .filter((entry) => existsSync(path.join(sourceRoot, entry, "SKILL.md")))
    .sort();
  if (slugs.length === 0) {
    throw new Error("skills/ must contain at least one skill with SKILL.md");
  }
  return slugs;
}

function assertSafeGeneratedPath(repoRoot, outputPath) {
  const relative = path.relative(repoRoot, outputPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside repository: ${outputPath}`);
  }
  if (
    !GENERATED_OUTPUTS.some(
      (output) => relative === output || relative.startsWith(`${output}/`),
    )
  ) {
    throw new Error(`Refusing to write unexpected generated path: ${relative}`);
  }
}

function readPluginMetadata(repoRoot) {
  const config = readJson(path.join(repoRoot, "openclaw.skills.json"));
  if (!config.version) {
    throw new Error("openclaw.skills.json must define version for plugin bundles");
  }
  if (!config.homepage) {
    throw new Error("openclaw.skills.json must define homepage for plugin bundles");
  }
  return {
    homepage: "https://docs.sendmux.ai/guides/agent-skills",
    repository: config.homepage,
    version: config.version,
  };
}

function claudePluginManifest(metadata) {
  return {
    name: PLUGIN_NAME,
    displayName: DISPLAY_NAME,
    version: metadata.version,
    description: DESCRIPTION,
    author: {
      name: "Sendmux",
      url: "https://sendmux.ai",
    },
    homepage: metadata.homepage,
    repository: metadata.repository,
    license: "Apache-2.0",
    keywords: ["sendmux", "email", "agent-skills", "mcp", "cli"],
    skills: "./skills/",
  };
}

function codexPluginManifest(metadata) {
  return {
    name: PLUGIN_NAME,
    version: metadata.version,
    description: DESCRIPTION,
    author: {
      name: "Sendmux",
      url: "https://sendmux.ai",
    },
    homepage: metadata.homepage,
    repository: metadata.repository,
    license: "Apache-2.0",
    keywords: ["sendmux", "email", "agent-skills", "mcp", "cli"],
    skills: "./skills/",
    interface: {
      displayName: DISPLAY_NAME,
      shortDescription: "Use Sendmux email, mailbox, MCP, CLI, and SDK workflows.",
      longDescription: LONG_DESCRIPTION,
      developerName: "Sendmux",
      category: "Communication",
      capabilities: ["Instructions", "Automation"],
      brandColor: "#4F46E5",
      defaultPrompt: [
        "Use Sendmux to set up an agent inbox.",
        "Send a Sendmux email with the right credential.",
        "Connect Sendmux MCP to this agent.",
      ],
    },
  };
}

function cursorPluginManifest(metadata) {
  return {
    name: PLUGIN_NAME,
    displayName: DISPLAY_NAME,
    version: metadata.version,
    description: DESCRIPTION,
    author: { name: "Sendmux" },
    homepage: metadata.homepage,
    repository: metadata.repository,
    license: "Apache-2.0",
    logo: CURSOR_LOGO,
    keywords: ["sendmux", "email", "agent-skills", "mcp", "cli"],
    category: "communication",
    skills: "./skills/",
    mcpServers: "./mcp.json",
  };
}

function mcpConfiguration() {
  return {
    mcpServers: {
      sendmux: {
        type: "http",
        url: MCP_SERVER_URL,
      },
    },
  };
}

function claudeMarketplace(metadata) {
  return {
    $schema: "https://anthropic.com/claude-code/marketplace.schema.json",
    name: "sendmux",
    description: DESCRIPTION,
    owner: {
      name: "Sendmux",
      url: "https://sendmux.ai",
    },
    plugins: [
      {
        name: PLUGIN_NAME,
        source: "./plugins/sendmux",
        description: DESCRIPTION,
        version: metadata.version,
        author: {
          name: "Sendmux",
        },
        category: "communication",
        homepage: metadata.homepage,
      },
    ],
  };
}

function codexMarketplace() {
  return {
    name: "sendmux",
    interface: {
      displayName: "Sendmux",
    },
    plugins: [
      {
        name: PLUGIN_NAME,
        source: {
          source: "local",
          path: "./plugins/sendmux",
        },
        policy: {
          installation: "AVAILABLE",
          authentication: "ON_INSTALL",
        },
        category: "Communication",
      },
    ],
  };
}

function copySkillRuntimeFiles(repoRoot, pluginSkillsRoot, slug) {
  const sourceSkillRoot = path.join(repoRoot, "skills", slug);
  const outputSkillRoot = path.join(pluginSkillsRoot, slug);
  mkdirSync(outputSkillRoot, { recursive: true });

  for (const entry of RUNTIME_SKILL_ENTRIES) {
    const sourcePath = path.join(sourceSkillRoot, entry);
    if (!existsSync(sourcePath)) continue;
    cpSync(sourcePath, path.join(outputSkillRoot, entry), { recursive: true });
  }
}

export function buildPluginBundles(repoRoot = defaultRepoRoot) {
  const metadata = readPluginMetadata(repoRoot);
  const logoPath = path.join(repoRoot, CURSOR_LOGO);
  if (!existsSync(logoPath)) {
    throw new Error(`${CURSOR_LOGO} must exist for the Cursor plugin bundle`);
  }
  const pluginRoot = path.join(repoRoot, "plugins", PLUGIN_NAME);
  assertSafeGeneratedPath(repoRoot, pluginRoot);

  rmSync(pluginRoot, { recursive: true, force: true });
  mkdirSync(path.join(pluginRoot, "skills"), { recursive: true });

  for (const slug of listSkillSlugs(repoRoot)) {
    copySkillRuntimeFiles(repoRoot, path.join(pluginRoot, "skills"), slug);
  }

  writeJson(
    path.join(repoRoot, ".claude-plugin", "marketplace.json"),
    claudeMarketplace(metadata),
  );
  writeJson(
    path.join(repoRoot, ".agents", "plugins", "marketplace.json"),
    codexMarketplace(metadata),
  );
  writeJson(
    path.join(repoRoot, ".cursor-plugin", "plugin.json"),
    cursorPluginManifest(metadata),
  );
  for (const relativePath of ["mcp.json", ".mcp.json"]) {
    const outputPath = path.join(repoRoot, relativePath);
    assertSafeGeneratedPath(repoRoot, outputPath);
    writeJson(outputPath, mcpConfiguration());
  }
  writeJson(
    path.join(pluginRoot, ".claude-plugin", "plugin.json"),
    claudePluginManifest(metadata),
  );
  writeJson(
    path.join(pluginRoot, ".codex-plugin", "plugin.json"),
    codexPluginManifest(metadata),
  );

  return {
    pluginRoot,
    skills: listSkillSlugs(repoRoot),
  };
}

function walkFiles(root) {
  if (!existsSync(root)) return [];
  if (!statSync(root).isDirectory()) return [root];
  const files = [];
  for (const entry of readdirSync(root)) {
    const entryPath = path.join(root, entry);
    const stat = statSync(entryPath);
    if (stat.isDirectory()) {
      files.push(...walkFiles(entryPath));
    } else {
      files.push(entryPath);
    }
  }
  return files.sort();
}

function generatedFiles(repoRoot) {
  return GENERATED_OUTPUTS.flatMap((output) =>
    walkFiles(path.join(repoRoot, output)).map((filePath) => path.relative(repoRoot, filePath)),
  ).sort();
}

function makeExpectedRepo(repoRoot) {
  const expectedRoot = mkdtempSync(path.join(os.tmpdir(), "sendmux-plugin-bundles-expected-"));
  cpSync(path.join(repoRoot, "openclaw.skills.json"), path.join(expectedRoot, "openclaw.skills.json"));
  cpSync(path.join(repoRoot, "skills"), path.join(expectedRoot, "skills"), { recursive: true });
  cpSync(path.join(repoRoot, "assets"), path.join(expectedRoot, "assets"), { recursive: true });
  buildPluginBundles(expectedRoot);
  return expectedRoot;
}

export function collectPluginBundleDrift(repoRoot = defaultRepoRoot) {
  const expectedRoot = makeExpectedRepo(repoRoot);
  try {
    const actualFiles = generatedFiles(repoRoot);
    const expectedFiles = generatedFiles(expectedRoot);
    const allFiles = [...new Set([...actualFiles, ...expectedFiles])].sort();
    const failures = [];

    for (const relativePath of allFiles) {
      const actualPath = path.join(repoRoot, relativePath);
      const expectedPath = path.join(expectedRoot, relativePath);
      const hasActual = existsSync(actualPath);
      const hasExpected = existsSync(expectedPath);

      if (!hasActual) {
        failures.push(`Missing generated file ${relativePath}`);
        continue;
      }
      if (!hasExpected) {
        failures.push(`Unexpected generated file ${relativePath}`);
        continue;
      }
      if (readFileSync(actualPath, "utf8") !== readFileSync(expectedPath, "utf8")) {
        failures.push(`Stale generated file ${relativePath}`);
      }
    }

    return failures;
  } finally {
    rmSync(expectedRoot, { recursive: true, force: true });
  }
}

if (process.argv[1] === __filename) {
  const result = buildPluginBundles(defaultRepoRoot);
  console.log(
    `Generated ${result.skills.length} skills in ${path.relative(defaultRepoRoot, result.pluginRoot)}.`,
  );
}
