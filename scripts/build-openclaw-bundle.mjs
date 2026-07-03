#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const configPath = path.join(repoRoot, "openclaw.skills.json");
const sourceRoot = path.join(repoRoot, "skills");

const config = JSON.parse(readFileSync(configPath, "utf8"));
const outputRoot = path.resolve(repoRoot, config.outputRoot);

function assertSafeOutputRoot() {
  const relative = path.relative(repoRoot, outputRoot);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside repository: ${outputRoot}`);
  }
  if (!relative.startsWith("dist/clawhub/skills")) {
    throw new Error(`Refusing to clean unexpected output root: ${relative}`);
  }
}

function listSkillSlugs(root) {
  return readdirSync(root)
    .filter((entry) => {
      const entryPath = path.join(root, entry);
      return statSync(entryPath).isDirectory();
    })
    .filter((entry) => existsSync(path.join(root, entry, "SKILL.md")))
    .sort();
}

function parseSourceSkill(slug) {
  const filePath = path.join(sourceRoot, slug, "SKILL.md");
  const text = readFileSync(filePath, "utf8");
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    throw new Error(`${slug}: missing source frontmatter`);
  }

  const frontmatter = match[1];
  const body = match[2].replace(/^\n+/, "");
  const name = readYamlScalar(frontmatter, "name");
  const description = readYamlScalar(frontmatter, "description");

  if (name !== slug) {
    throw new Error(`${slug}: source name ${name} does not match folder name`);
  }

  return { body, description, name };
}

function readYamlScalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  if (!match) return null;

  const raw = match[1].trim();
  if (raw.startsWith('"') && raw.endsWith('"')) {
    return JSON.parse(raw);
  }
  if (raw.startsWith("'") && raw.endsWith("'")) {
    return raw.slice(1, -1).replace(/''/g, "'");
  }
  return raw;
}

function referencedSendmuxEnvVars(text) {
  return [...new Set(text.match(/\bSENDMUX_[A-Z0-9_]+\b/g) ?? [])].sort();
}

function openclawNote() {
  return [
    "## ClawHub account note",
    "",
    "This ClawHub skill connects OpenClaw agents to Sendmux. Some workflows require a Sendmux account and an appropriate Sendmux API key or agent token. Sendmux account usage is external to ClawHub; do not ask users to paste secrets into chat.",
  ].join("\n");
}

function addOpenclawNote(body) {
  const trimmed = body.replace(/^\n+/, "");
  const lines = trimmed.split("\n");

  if (lines[0]?.startsWith("# ")) {
    const rest = lines.slice(1).join("\n").replace(/^\n+/, "");
    return `${lines[0]}\n\n${openclawNote()}\n\n${rest}`.replace(/\n+$/, "\n");
  }

  return `${openclawNote()}\n\n${trimmed}`.replace(/\n+$/, "\n");
}

function yamlScalar(value) {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (value === null) return "null";
  throw new Error(`Unsupported YAML scalar: ${value}`);
}

function isScalar(value) {
  return value === null || ["string", "number", "boolean"].includes(typeof value);
}

function toYaml(value, indent = 0) {
  const pad = " ".repeat(indent);

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (isScalar(item)) return `${pad}- ${yamlScalar(item)}`;

        const entries = Object.entries(item);
        if (entries.length === 0) return `${pad}- {}`;

        const [firstKey, firstValue] = entries[0];
        const firstLine = isScalar(firstValue)
          ? `${pad}- ${firstKey}: ${yamlScalar(firstValue)}`
          : `${pad}- ${firstKey}:\n${toYaml(firstValue, indent + 2)}`;
        const rest = entries
          .slice(1)
          .map(([key, nestedValue]) =>
            isScalar(nestedValue)
              ? `${" ".repeat(indent + 2)}${key}: ${yamlScalar(nestedValue)}`
              : `${" ".repeat(indent + 2)}${key}:\n${toYaml(nestedValue, indent + 4)}`,
          );

        return [firstLine, ...rest].join("\n");
      })
      .join("\n");
  }

  if (typeof value === "object" && value !== null) {
    return Object.entries(value)
      .map(([key, nestedValue]) =>
        isScalar(nestedValue)
          ? `${pad}${key}: ${yamlScalar(nestedValue)}`
          : `${pad}${key}:\n${toYaml(nestedValue, indent + 2)}`,
      )
      .join("\n");
  }

  return `${pad}${yamlScalar(value)}`;
}

function buildFrontmatter(slug, source) {
  const skillConfig = config.skills[slug];
  const bodyEnvVars = referencedSendmuxEnvVars(source.body);
  const envVars = bodyEnvVars.map((name) => {
    const description = config.envVars[name];
    if (!description) {
      throw new Error(`${slug}: missing description for ${name} in openclaw.skills.json`);
    }
    return { name, required: false, description };
  });

  const openclaw = {
    skillKey: slug,
    homepage: config.homepage,
  };

  if (bodyEnvVars.includes("SENDMUX_API_KEY")) {
    openclaw.primaryEnv = "SENDMUX_API_KEY";
  }
  if (envVars.length > 0) {
    openclaw.envVars = envVars;
  }
  if (skillConfig.install) {
    openclaw.install = skillConfig.install;
  }

  return {
    name: slug,
    description: skillConfig.description ?? source.description,
    version: config.version,
    metadata: {
      openclaw,
    },
  };
}

function verifyConfigCoverage(sourceSlugs) {
  const configSlugs = Object.keys(config.skills).sort();
  const missing = sourceSlugs.filter((slug) => !configSlugs.includes(slug));
  const extra = configSlugs.filter((slug) => !sourceSlugs.includes(slug));

  if (missing.length > 0) {
    throw new Error(`Missing OpenClaw config for: ${missing.join(", ")}`);
  }
  if (extra.length > 0) {
    throw new Error(`OpenClaw config references unknown skills: ${extra.join(", ")}`);
  }
}

assertSafeOutputRoot();

const sourceSlugs = listSkillSlugs(sourceRoot);
verifyConfigCoverage(sourceSlugs);

rmSync(outputRoot, { recursive: true, force: true });
mkdirSync(outputRoot, { recursive: true });

for (const slug of sourceSlugs) {
  const source = parseSourceSkill(slug);
  const frontmatter = buildFrontmatter(slug, source);
  const skillDir = path.join(outputRoot, slug);
  const outputPath = path.join(skillDir, "SKILL.md");
  const output = `---\n${toYaml(frontmatter)}\n---\n\n${addOpenclawNote(source.body)}`;

  mkdirSync(skillDir, { recursive: true });
  writeFileSync(outputPath, output, "utf8");
}

console.log(`Generated ${sourceSlugs.length} OpenClaw skills in ${path.relative(repoRoot, outputRoot)}.`);
