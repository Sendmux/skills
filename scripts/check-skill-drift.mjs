#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const skillsRoot = process.env.SENDMUX_SKILLS_ROOT || repoRoot;
const docsRoot =
  process.env.SENDMUX_DOCS || "/Users/rj/Desktop/GIT-REPOS/sendmux-docs";
const sdkRoot =
  process.env.SENDMUX_SDK || "/Users/rj/Desktop/GIT-REPOS/sendmux-sdk";
const appOpenApi =
  process.env.SENDMUX_APP_OPENAPI || path.join(docsRoot, "openapi-app.json");
const sendingOpenApi =
  process.env.SENDMUX_SENDING_OPENAPI ||
  path.join(docsRoot, "openapi-sending.json");

const expectedSkills = [
  "sendmux-cli",
  "sendmux-attachments",
  "sendmux-email-for-agents",
  "sendmux-getting-started",
  "sendmux-mailbox-agent",
  "sendmux-management",
  "sendmux-mcp-setup",
  "sendmux-send-email",
  "sendmux-token-efficient-usage",
];

const requiredSendingPaths = [
  ["post", "/emails/attachment-uploads"],
  ["put", "/emails/attachment-uploads/{upload_id}"],
  ["post", "/emails/attachments"],
  ["get", "/emails/attachments/{attachment_id}"],
  ["post", "/emails/send"],
  ["post", "/emails/send/batch"],
];

const requiredMailboxPaths = [
  ["post", "/mailbox/attachments:upload"],
  ["get", "/mailbox/messages/{message_id}/attachments/{attachment_id}"],
  ["post", "/mailbox/attachment-uploads"],
  ["post", "/mailbox/messages:batch-get"],
  ["post", "/mailbox/messages:batch-update"],
  ["post", "/mailbox/messages:batch-delete"],
  ["get", "/mailbox/messages/count"],
  ["get", "/mailbox/messages/query-changes"],
  ["get", "/mailbox/messages/search-snippets"],
  ["get", "/mailbox/changes"],
  ["get", "/mailbox/events"],
  ["get", "/mailbox/folders/changes"],
  ["get", "/mailbox/folders/query-changes"],
];

const requiredMcpTools = [
  "mailbox_count_messages",
  "mailbox_search_message_snippets",
  "mailbox_batch_get_messages",
  "mailbox_get_changes",
  "mailbox_send_message",
  "mailbox_get_attachment",
  "mailbox_read_attachment",
  "mailbox_upload_attachment",
  "mailbox_wait_for_message",
  "management_create_domain",
  "management_create_mailbox",
  "management_create_mailbox_key",
  "management_get_spend_summary",
  "management_create_webhook",
  "sending_create_attachment_upload",
  "sending_get_attachment",
  "sending_send_email",
  "sending_send_email_batch",
  "sending_upload_attachment",
];

const requiredMcpEnv = [
  "SENDMUX_API_KEY",
  "SENDMUX_MCP_SURFACES",
  "SENDMUX_MCP_TRANSPORT",
  "SENDMUX_MCP_HTTP_BEARER_TOKEN",
];

const allowedSkillOnlyEnv = new Set(["SENDMUX_ROOT_KEY", "SENDMUX_MBX_KEY"]);
const allowedUnderscoreIdentifiers = new Set(["mailbox_id"]);

const tsPackages = {
  "packages/ts/sdk/package.json": "@sendmux/sdk",
  "packages/ts/sending/package.json": "@sendmux/sending",
  "packages/ts/mailbox/package.json": "@sendmux/mailbox",
  "packages/ts/management/package.json": "@sendmux/management",
  "packages/ts/cli/package.json": "@sendmux/cli",
};

const phpPackages = {
  "packages/php/sdk/composer.json": "sendmux/sdk",
  "packages/php/sending/composer.json": "sendmux/sending",
  "packages/php/mailbox/composer.json": "sendmux/mailbox",
  "packages/php/management/composer.json": "sendmux/management",
};

const pythonPackages = {
  "packages/python/sdk/pyproject.toml": "sendmux-sdk",
  "packages/python/sending/pyproject.toml": "sendmux-sending",
  "packages/python/mailbox/pyproject.toml": "sendmux-mailbox",
  "packages/python/management/pyproject.toml": "sendmux-management",
  "packages/python/mcp/pyproject.toml": "sendmux-mcp",
};

const rubyPackages = {
  "packages/ruby/sdk/sendmux-sdk.gemspec": "sendmux-sdk",
  "packages/ruby/sending/sendmux-sending.gemspec": "sendmux-sending",
  "packages/ruby/mailbox/sendmux-mailbox.gemspec": "sendmux-mailbox",
  "packages/ruby/management/sendmux-management.gemspec": "sendmux-management",
};

const requiredCorpusTokens = [
  ["root key prefix", /smx_root_/],
  ["mailbox key prefix", /smx_mbx_/],
  ["idempotency header", /Idempotency-Key/],
  ["If-Match header", /If-Match/],
  ["If-None-Match header", /If-None-Match/],
  ["ETag header", /ETag/],
  ["cursor pagination", /pagination\.next_cursor|cursor pagination|next_cursor/],
  ["CLI package", /@sendmux\/cli/],
  ["CLI binary", /\bsendmux\b/],
  ["Sending TS package", /@sendmux\/sending/],
  ["Mailbox TS package", /@sendmux\/mailbox/],
  ["Management TS package", /@sendmux\/management/],
  ["MCP package", /sendmux-mcp/],
  ["mailbox MCP server", /sendmux-mcp-mailbox/],
  ["management MCP server", /sendmux-mcp-management/],
  ["sending MCP server", /sendmux-mcp-sending/],
  ["MCP HTTP bearer token env", /SENDMUX_MCP_HTTP_BEARER_TOKEN/],
  ["batch send MCP tool", /sending_send_email_batch/],
  ["mailbox count MCP tool", /mailbox_count_messages/],
  ["mailbox snippets MCP tool", /mailbox_search_message_snippets/],
  ["mailbox batch-get MCP tool", /mailbox_batch_get_messages/],
  ["mailbox changes MCP tool", /mailbox_get_changes/],
  ["attachment skill", /sendmux-attachments/],
  ["mailbox upload attachment MCP tool", /mailbox_upload_attachment/],
  ["mailbox attachment metadata MCP tool", /mailbox_get_attachment/],
  ["mailbox read attachment MCP tool", /mailbox_read_attachment/],
  ["management create domain MCP tool", /management_create_domain/],
  ["management create mailbox MCP tool", /management_create_mailbox/],
  ["management create mailbox key MCP tool", /management_create_mailbox_key/],
  ["sending upload attachment MCP tool", /sending_upload_attachment/],
  ["sending create attachment upload MCP tool", /sending_create_attachment_upload/],
  ["sending get attachment MCP tool", /sending_get_attachment/],
  ["sending attachment upload endpoint", /\/emails\/attachments/],
  ["sending delegated upload endpoint", /\/emails\/attachment-uploads/],
];

const failures = [];

function fail(message) {
  failures.push(message);
}

function fullPath(root, relativePath) {
  return path.join(root, relativePath);
}

function readText(filePath) {
  if (!existsSync(filePath)) {
    fail(`Missing file: ${filePath}`);
    return "";
  }
  return readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  const text = readText(filePath);
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`Invalid JSON in ${filePath}: ${error.message}`);
    return null;
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compareSets(label, actual, expected) {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const missing = expected.filter((item) => !actualSet.has(item));
  const extra = actual.filter((item) => !expectedSet.has(item));

  if (missing.length > 0) {
    fail(`${label} missing: ${missing.join(", ")}`);
  }
  if (extra.length > 0) {
    fail(`${label} has unexpected entries: ${extra.join(", ")}`);
  }
}

function assertOpenApiPaths(label, specPath, requiredPaths) {
  const spec = readJson(specPath);
  if (!spec?.paths) return;

  for (const [method, route] of requiredPaths) {
    if (!spec.paths[route]?.[method]) {
      fail(`${label} missing ${method.toUpperCase()} ${route} in ${specPath}`);
    }
  }
}

function assertPackageNames(root, packages, readName) {
  for (const [relativePath, expectedName] of Object.entries(packages)) {
    const filePath = fullPath(root, relativePath);
    const actualName = readName(filePath);
    if (!actualName) continue;
    if (actualName !== expectedName) {
      fail(`${relativePath} expected name ${expectedName}, found ${actualName}`);
    }
  }
}

function jsonPackageName(filePath) {
  return readJson(filePath)?.name;
}

function tomlProjectName(filePath) {
  const match = readText(filePath).match(/^name\s*=\s*["']([^"']+)["']/m);
  if (!match) {
    fail(`Missing project name in ${filePath}`);
    return null;
  }
  return match[1];
}

function rubyGemspecName(filePath) {
  const match = readText(filePath).match(/spec\.name\s*=\s*["']([^"']+)["']/);
  if (!match) {
    fail(`Missing gemspec name in ${filePath}`);
    return null;
  }
  return match[1];
}

function walkCorpusFiles(dir) {
  if (!existsSync(dir)) return [];

  const files = [];
  for (const entry of readdirSync(dir)) {
    const entryPath = path.join(dir, entry);
    const stat = statSync(entryPath);
    if (stat.isDirectory()) {
      files.push(...walkCorpusFiles(entryPath));
    } else if (/\.(md|yaml|json)$/.test(entryPath)) {
      files.push(entryPath);
    }
  }
  return files;
}

function assertSkillsCatalogue() {
  const skillsDir = fullPath(skillsRoot, "skills");
  if (!existsSync(skillsDir)) {
    fail(`Missing skills directory: ${skillsDir}`);
    return;
  }

  const actualSkills = readdirSync(skillsDir)
    .filter((entry) => statSync(path.join(skillsDir, entry)).isDirectory())
    .sort();
  compareSets("Skill directories", actualSkills, expectedSkills);

  const readmeText = readText(fullPath(skillsRoot, "README.md"));
  const skillsJsonText = readText(fullPath(skillsRoot, "skills.sh.json"));

  for (const skillName of expectedSkills) {
    if (!readmeText.includes(skillName)) {
      fail(`README.md missing skill ${skillName}`);
    }
    if (!skillsJsonText.includes(skillName)) {
      fail(`skills.sh.json missing skill ${skillName}`);
    }

    const skillText = readText(path.join(skillsDir, skillName, "SKILL.md"));
    if (!/^metadata:\n\s+author:\s*sendmux\n\s+version:\s*["']1\.0["']/m.test(skillText)) {
      fail(`${skillName} missing metadata.author sendmux and metadata.version "1.0"`);
    }
  }
}

function assertSkillCorpusTokens() {
  const corpusFiles = [
    fullPath(skillsRoot, "README.md"),
    fullPath(skillsRoot, "skills.sh.json"),
    ...walkCorpusFiles(fullPath(skillsRoot, "skills")),
  ];
  const corpusText = corpusFiles.map((filePath) => readText(filePath)).join("\n");

  for (const [label, pattern] of requiredCorpusTokens) {
    if (!pattern.test(corpusText)) {
      fail(`Skill corpus missing ${label} (${pattern})`);
    }
  }
}

function assertCliPackage() {
  const cliPackagePath = fullPath(sdkRoot, "packages/ts/cli/package.json");
  const cliPackage = readJson(cliPackagePath);
  if (!cliPackage) return;

  if (cliPackage.name !== "@sendmux/cli") {
    fail(`CLI package expected @sendmux/cli, found ${cliPackage.name}`);
  }
  if (!cliPackage.bin?.sendmux) {
    fail(`CLI package missing bin.sendmux in ${cliPackagePath}`);
  }

  const topics = Object.keys(cliPackage.oclif?.topics || {}).sort();
  compareSets("CLI topics", topics, [
    "mailbox",
    "management",
    "profiles",
    "sending",
  ]);
}

function assertMcpSources() {
  const curationPath = fullPath(
    sdkRoot,
    "packages/python/mcp/sendmux_mcp/curation.py",
  );
  const configPath = fullPath(
    sdkRoot,
    "packages/python/mcp/sendmux_mcp/config.py",
  );
  const curation = readText(curationPath);
  const config = readText(configPath);

  for (const toolName of requiredMcpTools) {
    const pattern = new RegExp(`name\\s*=\\s*["']${escapeRegExp(toolName)}["']`);
    if (!pattern.test(curation)) {
      fail(`MCP curation missing tool ${toolName} in ${curationPath}`);
    }
  }

  for (const envName of requiredMcpEnv) {
    if (!config.includes(envName)) {
      fail(`MCP config missing env ${envName} in ${configPath}`);
    }
  }
}

function allMcpToolNames() {
  const curationPath = fullPath(
    sdkRoot,
    "packages/python/mcp/sendmux_mcp/curation.py",
  );
  const curation = readText(curationPath);
  return new Set(
    [...curation.matchAll(/name\s*=\s*["']([a-z]+_[a-z_]+)["']/g)].map(
      (match) => match[1],
    ),
  );
}

function assertClaimedMcpToolsExist() {
  const toolNames = allMcpToolNames();
  const corpusFiles = walkCorpusFiles(fullPath(skillsRoot, "skills"));

  for (const filePath of corpusFiles) {
    const text = readText(filePath);
    for (const match of text.matchAll(/`((?:mailbox|management|sending)_[a-z_]+)`/g)) {
      const name = match[1];
      if (allowedUnderscoreIdentifiers.has(name)) continue;
      if (!toolNames.has(name)) {
        fail(`${path.relative(skillsRoot, filePath)} claims missing MCP tool ${name}`);
      }
    }
  }
}

function assertOfficialSendmuxEnvOnly() {
  const sourceText = [
    readText(fullPath(sdkRoot, "packages/python/mcp/sendmux_mcp/config.py")),
    readText(fullPath(sdkRoot, "packages/python/mcp/sendmux_mcp/hosted.py")),
    readText(fullPath(sdkRoot, "packages/python/mcp/README.md")),
    readText(fullPath(sdkRoot, "packages/ts/cli/src/base-command.ts")),
    readText(fullPath(sdkRoot, "packages/ts/cli/src/profiles.ts")),
    readText(fullPath(sdkRoot, "packages/ts/cli/README.md")),
  ].join("\n");
  const corpusFiles = walkCorpusFiles(fullPath(skillsRoot, "skills"));

  for (const filePath of corpusFiles) {
    const text = readText(filePath);
    for (const match of text.matchAll(/\bSENDMUX_[A-Z0-9_]+\b/g)) {
      const envName = match[0];
      if (allowedSkillOnlyEnv.has(envName)) continue;
      if (!sourceText.includes(envName)) {
        fail(`${path.relative(skillsRoot, filePath)} uses undocumented env var ${envName}`);
      }
    }
  }
}

function assertSdkPackages() {
  assertPackageNames(sdkRoot, tsPackages, jsonPackageName);
  assertPackageNames(sdkRoot, phpPackages, jsonPackageName);
  assertPackageNames(sdkRoot, pythonPackages, tomlProjectName);
  assertPackageNames(sdkRoot, rubyPackages, rubyGemspecName);

  const goModPath = fullPath(sdkRoot, "go/go.mod");
  const goModule = readText(goModPath).match(/^module\s+(\S+)/m)?.[1];
  if (!goModule) {
    fail(`Missing Go module declaration in ${goModPath}`);
  } else if (goModule !== "sendmux.ai/go") {
    fail(`Go module expected sendmux.ai/go, found ${goModule}`);
  }
}

assertOpenApiPaths("Sending OpenAPI", sendingOpenApi, requiredSendingPaths);
assertOpenApiPaths("App OpenAPI mailbox surface", appOpenApi, requiredMailboxPaths);
assertCliPackage();
assertMcpSources();
assertClaimedMcpToolsExist();
assertOfficialSendmuxEnvOnly();
assertSdkPackages();
assertSkillsCatalogue();
assertSkillCorpusTokens();

if (failures.length > 0) {
  console.error("Sendmux skill drift check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Sendmux skill drift check passed.");
console.log(`Skills root: ${skillsRoot}`);
console.log(`Docs root: ${docsRoot}`);
console.log(`SDK root: ${sdkRoot}`);
