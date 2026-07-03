#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const configPath = path.join(repoRoot, "openclaw.skills.json");
const sourceRoot = path.join(repoRoot, "skills");

const failures = [];

function fail(message) {
  failures.push(message);
}

function readText(filePath) {
  if (!existsSync(filePath)) {
    fail(`Missing file: ${filePath}`);
    return "";
  }
  return readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  try {
    return JSON.parse(readText(filePath));
  } catch (error) {
    fail(`Invalid JSON in ${filePath}: ${error.message}`);
    return null;
  }
}

function listSkillSlugs(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .filter((entry) => {
      const entryPath = path.join(root, entry);
      return statSync(entryPath).isDirectory();
    })
    .filter((entry) => existsSync(path.join(root, entry, "SKILL.md")))
    .sort();
}

function extractFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  return match[1];
}

function declaredEnvVars(frontmatter) {
  const vars = new Set();
  for (const match of frontmatter.matchAll(/(?:^|\n)\s*(?:-\s*)?name:\s*"?([A-Z][A-Z0-9_]+)"?/g)) {
    vars.add(match[1]);
  }
  for (const match of frontmatter.matchAll(/(?:^|\n)\s*primaryEnv:\s*"?([A-Z][A-Z0-9_]+)"?/g)) {
    vars.add(match[1]);
  }
  for (const match of frontmatter.matchAll(/(?:^|\n)\s*-\s*"?([A-Z][A-Z0-9_]+)"?/g)) {
    vars.add(match[1]);
  }
  return vars;
}

function referencedSendmuxEnvVars(text) {
  return [...new Set(text.match(/\bSENDMUX_[A-Z0-9_]+\b/g) ?? [])].sort();
}

function walkFiles(root) {
  if (!existsSync(root)) return [];
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

if (!existsSync(configPath)) {
  fail("Missing openclaw.skills.json");
}

const config = existsSync(configPath) ? readJson(configPath) : null;
const outputRoot = path.resolve(repoRoot, config?.outputRoot ?? "dist/clawhub/skills");
const sourceSlugs = listSkillSlugs(sourceRoot);
const outputSlugs = listSkillSlugs(outputRoot);
const configSlugs = Object.keys(config?.skills ?? {}).sort();

if (sourceSlugs.length === 0) {
  fail("No source skills found under skills/*/SKILL.md");
}

const expectedSkillCount = sourceSlugs.length;
if (outputSlugs.length !== expectedSkillCount) {
  fail(`Generated skill count mismatch: expected ${expectedSkillCount}, found ${outputSlugs.length}`);
}

for (const slug of sourceSlugs) {
  if (!configSlugs.includes(slug)) {
    fail(`Missing OpenClaw config for ${slug}`);
  }
  if (!outputSlugs.includes(slug)) {
    fail(`Missing generated OpenClaw skill for ${slug}`);
  }
}

for (const slug of configSlugs) {
  if (!sourceSlugs.includes(slug)) {
    fail(`OpenClaw config references unknown skill ${slug}`);
  }
}

for (const filePath of walkFiles(outputRoot)) {
  const relativePath = path.relative(outputRoot, filePath);
  if (!/^[^/]+\/SKILL\.md$/.test(relativePath)) {
    fail(`Generated bundle should contain only <skill>/SKILL.md, found ${relativePath}`);
  }
}

for (const slug of outputSlugs) {
  const skillPath = path.join(outputRoot, slug, "SKILL.md");
  const text = readText(skillPath);
  const frontmatter = extractFrontmatter(text);

  if (!frontmatter) {
    fail(`${slug}: missing YAML frontmatter`);
    continue;
  }

  for (const field of ["name", "description", "version"]) {
    if (!new RegExp(`(?:^|\\n)${field}:\\s+`).test(frontmatter)) {
      fail(`${slug}: missing frontmatter field ${field}`);
    }
  }

  if (!/(?:^|\n)metadata:\n\s+openclaw:/.test(frontmatter)) {
    fail(`${slug}: missing metadata.openclaw`);
  }

  if (/(?:^|\n)license:\s*/.test(frontmatter)) {
    fail(`${slug}: generated frontmatter must not include a license field`);
  }

  if (/Apache-2\.0/.test(text)) {
    fail(`${slug}: generated bundle must not contain Apache-2.0`);
  }

  if (!/This ClawHub skill connects OpenClaw agents to Sendmux\./.test(text)) {
    fail(`${slug}: missing ClawHub external account note`);
  }

  const declared = declaredEnvVars(frontmatter);
  for (const envName of referencedSendmuxEnvVars(text)) {
    if (!declared.has(envName)) {
      fail(`${slug}: references ${envName} but does not declare it in metadata.openclaw`);
    }
  }
}

const agentInboxPath = path.join(outputRoot, "sendmux-email-for-agents", "SKILL.md");
if (existsSync(agentInboxPath)) {
  const text = readText(agentInboxPath);
  for (const term of ["inbox", "receive", "send", "route"]) {
    if (!new RegExp(term, "i").test(text)) {
      fail(`sendmux-email-for-agents should frame Sendmux as an agent inbox that can ${term}`);
    }
  }
}

if (!sourceSlugs.includes("sendmux-attachments")) {
  fail("Source skills must include sendmux-attachments before publishing to OpenClaw");
}

if (!outputSlugs.includes("sendmux-attachments")) {
  fail("Generated OpenClaw bundle must include sendmux-attachments");
}

if (failures.length > 0) {
  console.error("OpenClaw bundle check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`OpenClaw bundle check passed for ${outputSlugs.length} skills.`);
