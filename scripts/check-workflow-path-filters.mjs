#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const workflowPathRequirements = new Map([
  [
    ".github/workflows/plugin-bundles.yml",
    [
      { path: "skills/**", reader: "buildPluginBundles listSkillSlugs/copySkillRuntimeFiles" },
      { path: "openclaw.skills.json", reader: "buildPluginBundles readPluginMetadata" },
      { path: "assets/**", reader: "buildPluginBundles Cursor logo/expected-repository inputs" },
      { path: ".claude-plugin/**", reader: "collectPluginBundleDrift generated outputs" },
      { path: ".agents/plugins/**", reader: "collectPluginBundleDrift generated outputs" },
      { path: ".cursor-plugin/**", reader: "collectPluginBundleDrift generated outputs" },
      { path: "mcp.json", reader: "collectPluginBundleDrift generated outputs" },
      { path: ".mcp.json", reader: "collectPluginBundleDrift generated outputs" },
      { path: "README.md", reader: "build-plugin-bundles test documentation assertion" },
      { path: "plugins/sendmux/**", reader: "collectPluginBundleDrift generated outputs" },
      { path: "scripts/build-plugin-bundles.mjs", reader: "plugin bundle generator" },
      { path: "scripts/check-plugin-bundles.mjs", reader: "plugin bundle drift entry point" },
      { path: "scripts/build-plugin-bundles.test.mjs", reader: "plugin bundle/filter tests" },
      { path: "scripts/agent-storage-floor.test.mjs", reader: "plugin workflow storage-floor test" },
      { path: "scripts/publish-openclaw-bundle.mjs", reader: "workflow boundary publisher fixture" },
      { path: "scripts/publish-openclaw-bundle.test.mjs", reader: "plugin workflow publisher tests" },
      { path: "scripts/workflow-boundaries.test.mjs", reader: "credential workflow boundary tests" },
      { path: "scripts/check-workflow-path-filters.mjs", reader: "workflow path-filter validator" },
      { path: ".github/workflows/openclaw-clawhub.yml", reader: "workflow boundary tests" },
      { path: ".github/workflows/notify-site.yml", reader: "workflow boundary tests" },
      { path: ".github/workflows/skill-drift.yml", reader: "workflow path-filter validator" },
      { path: ".github/workflows/plugin-bundles.yml", reader: "plugin bundle workflow" },
    ],
  ],
  [
    ".github/workflows/skill-drift.yml",
    [
      { path: "skills/**", reader: "check-skill-drift publicSkillCorpusFiles/assertSkillsCatalogue" },
      { path: "README.md", reader: "check-skill-drift publicSkillCorpusFiles/assertSkillsCatalogue" },
      { path: "skills.sh.json", reader: "check-skill-drift publicSkillCorpusFiles/assertSkillsCatalogue" },
      { path: "scripts/check-skill-drift.mjs", reader: "skill drift checker" },
      { path: "scripts/check-skill-drift.test.mjs", reader: "skill drift checker tests" },
      { path: ".github/workflows/skill-drift.yml", reader: "skill drift workflow" },
    ],
  ],
]);

function indentation(line) {
  return line.length - line.trimStart().length;
}

function parsePathScalar(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function extractEventPaths(workflowText, eventName) {
  const lines = workflowText.replaceAll("\r\n", "\n").split("\n");
  const eventIndex = lines.findIndex((line) => line === `  ${eventName}:`);
  if (eventIndex === -1) return null;

  let eventEnd = lines.length;
  for (let index = eventIndex + 1; index < lines.length; index += 1) {
    if (lines[index].trim() && indentation(lines[index]) <= 2) {
      eventEnd = index;
      break;
    }
  }

  const pathsIndex = lines.findIndex(
    (line, index) => index > eventIndex && index < eventEnd && line === "    paths:",
  );
  if (pathsIndex === -1) return null;

  const paths = [];
  for (let index = pathsIndex + 1; index < eventEnd; index += 1) {
    const line = lines[index];
    if (line.trim() && indentation(line) <= 4) break;
    const match = line.match(/^\s*-\s+(.+)$/);
    if (match) paths.push(parsePathScalar(match[1]));
  }
  return paths;
}

export function validateWorkflowPathFilters(workflowPath, workflowText, requiredPaths) {
  const failures = [];
  for (const eventName of ["pull_request", "push"]) {
    const eventPaths = extractEventPaths(workflowText, eventName);
    if (!eventPaths) {
      failures.push(`${workflowPath} ${eventName}.paths is missing`);
      continue;
    }
    for (const requirement of requiredPaths) {
      if (!eventPaths.includes(requirement.path)) {
        failures.push(
          `${workflowPath} ${eventName}.paths missing "${requirement.path}" (reader: ${requirement.reader})`,
        );
      }
    }
  }
  return failures;
}

export function main() {
  const failures = [];
  for (const [workflowPath, requiredPaths] of workflowPathRequirements) {
    const workflowText = readFileSync(workflowPath, "utf8");
    failures.push(...validateWorkflowPathFilters(workflowPath, workflowText, requiredPaths));
  }

  if (failures.length > 0) {
    console.error("Workflow path-filter check failed:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log("Workflow path-filter check passed for pull_request and push.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
