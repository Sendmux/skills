# Sendmux Cursor Plugin Implementation Plan

Last updated: 2026-07-14 09:40

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a native Cursor plugin to `Sendmux/skills` without duplicating skills or authentication configuration.

**Architecture:** Extend the existing Node.js plugin-bundle generator so Cursor, Claude, and Codex metadata share the version and repository source in `openclaw.skills.json`. Cursor reads canonical root `skills/`, while generated `mcp.json` and `.mcp.json` contain one identical hosted OAuth MCP definition. Drift tests and independent CI path-filter assertions prevent the generated surfaces from diverging. [file:docs/superpowers/specs/2026-07-14-cursor-plugin-design.md:33]

**Tech Stack:** Node.js 22 built-ins, `node:test`, JSON manifests, GitHub Actions, Cursor's public plugin schema, and streamable HTTP MCP. [file:.github/workflows/plugin-bundles.yml:45] [research:https://github.com/cursor/plugins/blob/main/schemas/plugin.schema.json]

## Assumptions

1. Implementation and local validation are approved; release and marketplace submission are not. **Confirmed: yes.** [qa-log:2026-07-14 09:40-Q1]
2. Root `skills/` remains canonical and is not copied for Cursor. **Confirmed: yes.** [qa-log:2026-07-14 09:30-Q1]
3. The hosted MCP URL remains `https://mcp.sendmux.ai/mcp` and authentication remains OAuth. **Confirmed: yes.** [research:https://github.com/Sendmux/sendmux-sdk/blob/main/packages/python/mcp/README.md]

## Global Constraints

- Do not change any canonical `SKILL.md` content or create Cursor-specific skill copies. [file:CLAUDE.md:3] [qa-log:2026-07-14 09:30-Q1]
- Generate `.cursor-plugin/plugin.json`, `mcp.json`, and `.mcp.json` from the existing bundle generator. [file:docs/superpowers/specs/2026-07-14-cursor-plugin-design.md:79]
- Keep `mcp.json` and `.mcp.json` byte-identical and free of keys, headers, tokens, and local launch commands. [file:docs/superpowers/specs/2026-07-14-cursor-plugin-design.md:60]
- Use the approved Sendmux mark at `assets/sendmux-mark.svg`; do not create new artwork. [file:docs/superpowers/specs/2026-07-14-cursor-plugin-design.md:40]
- Every generator input must appear twice in `.github/workflows/plugin-bundles.yml`: once under `pull_request.paths` and once under `push.paths`. [file:CLAUDE.md:13]
- Do not add package dependencies, bump `openclaw.skills.json`, publish a release, or submit a marketplace listing. [file:CLAUDE.md:18] [qa-log:2026-07-14 09:30-Q1]

## File Structure

- Create `assets/sendmux-mark.svg` — approved static logo input referenced by Cursor.
- Create `.cursor-plugin/plugin.json` — generated Cursor manifest.
- Create `mcp.json` — generated Cursor MCP component.
- Create `.mcp.json` — generated Open Plugins-compatible MCP component.
- Modify `scripts/build-plugin-bundles.mjs` — build and drift-check all plugin outputs from shared sources.
- Modify `scripts/build-plugin-bundles.test.mjs` — test public generator behaviour, drift, discovery, workflow filters, and documentation.
- Modify `.github/workflows/plugin-bundles.yml` — trigger validation for every new source and generated output.
- Modify `README.md` — accurately document Cursor availability before marketplace publication.

---

### Task 1: Generate a schema-shaped Cursor manifest

**Files:**
- Create: `assets/sendmux-mark.svg`
- Modify: `scripts/build-plugin-bundles.test.mjs`
- Modify: `scripts/build-plugin-bundles.mjs`
- Create: `.cursor-plugin/plugin.json`

**Interfaces:**
- Consumes: `openclaw.skills.json`, root `skills/`, and `assets/sendmux-mark.svg`.
- Produces: `buildPluginBundles(repoRoot)` writing `.cursor-plugin/plugin.json`; `cursorPluginManifest(metadata)` returning the Cursor manifest object.

- [ ] **Step 1: Copy the approved brand mark into the plugin repository**

Run:

```bash
mkdir -p assets
cp /Users/rj/Desktop/GIT-REPOS/sendmux/brand-system/assets/mark-blue-large.svg assets/sendmux-mark.svg
cmp -s /Users/rj/Desktop/GIT-REPOS/sendmux/brand-system/assets/mark-blue-large.svg assets/sendmux-mark.svg
```

Expected: `assets/sendmux-mark.svg` exists and `cmp` exits zero.

- [ ] **Step 2: Add the test fixture asset and failing Cursor manifest assertions**

Add this fixture setup inside `makeRepo()` after creating the test skill directories:

```js
mkdirSync(path.join(repoRoot, "assets"), { recursive: true });
writeFileSync(
  path.join(repoRoot, "assets", "sendmux-mark.svg"),
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>\n',
);
```

Add these assertions to `builds marketplace plugin bundles from canonical skills` after the Codex manifest assertions:

```js
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
```

- [ ] **Step 3: Run the focused test and verify red**

Run:

```bash
node --test --test-name-pattern="builds marketplace plugin bundles" scripts/build-plugin-bundles.test.mjs
```

Expected: FAIL because `.cursor-plugin/plugin.json` does not exist.

- [ ] **Step 4: Add the minimal Cursor manifest generator**

Add the logo path and `.cursor-plugin` to the generated outputs near the existing constants:

```js
const CURSOR_LOGO = "assets/sendmux-mark.svg";
const GENERATED_ROOTS = [
  ".claude-plugin",
  ".agents/plugins",
  ".cursor-plugin",
  "plugins/sendmux",
];
```

Add this builder after `codexPluginManifest(metadata)`:

```js
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
```

Before removing or writing generated output in `buildPluginBundles(repoRoot)`, validate the static logo:

```js
const logoPath = path.join(repoRoot, CURSOR_LOGO);
if (!existsSync(logoPath)) {
  throw new Error(`${CURSOR_LOGO} must exist for the Cursor plugin bundle`);
}
```

Write the manifest beside the existing marketplace writes:

```js
writeJson(
  path.join(repoRoot, ".cursor-plugin", "plugin.json"),
  cursorPluginManifest(metadata),
);
```

Copy the static input in `makeExpectedRepo(repoRoot)` so drift generation sees the same source:

```js
cpSync(path.join(repoRoot, "assets"), path.join(expectedRoot, "assets"), {
  recursive: true,
});
```

- [ ] **Step 5: Verify the manifest test is green**

Run:

```bash
node --test --test-name-pattern="builds marketplace plugin bundles" scripts/build-plugin-bundles.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Add failing input-error tests**

Append these tests:

```js
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
```

- [ ] **Step 7: Run the error tests and verify the missing-skills case is red**

Run:

```bash
node --test --test-name-pattern="fails clearly" scripts/build-plugin-bundles.test.mjs
```

Expected: one PASS for the logo and one FAIL because `readdirSync` currently emits a generic filesystem error.

- [ ] **Step 8: Add precise canonical-skill validation**

Replace `listSkillSlugs(repoRoot)` with:

```js
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
```

- [ ] **Step 9: Generate real output and run the full test file**

Run:

```bash
node scripts/build-plugin-bundles.mjs
node --test scripts/build-plugin-bundles.test.mjs
```

Expected: the generator reports nine skills and every test passes.

- [ ] **Step 10: Commit the manifest slice**

```bash
git add assets/sendmux-mark.svg .cursor-plugin/plugin.json scripts/build-plugin-bundles.mjs scripts/build-plugin-bundles.test.mjs
git commit -m "feat: generate Cursor plugin manifest"
```

### Task 2: Generate identical MCP files and include them in drift detection

**Files:**
- Modify: `scripts/build-plugin-bundles.test.mjs`
- Modify: `scripts/build-plugin-bundles.mjs`
- Create: `mcp.json`
- Create: `.mcp.json`

**Interfaces:**
- Consumes: the shared constant `MCP_SERVER_URL`.
- Produces: `mcpConfiguration()` and two byte-identical generated JSON files; `collectPluginBundleDrift(repoRoot)` covering directory and exact-file outputs.

- [ ] **Step 1: Add failing MCP output assertions**

In the main build test, add:

```js
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
```

- [ ] **Step 2: Run the focused build test and verify red**

Run:

```bash
node --test --test-name-pattern="builds marketplace plugin bundles" scripts/build-plugin-bundles.test.mjs
```

Expected: FAIL because `mcp.json` does not exist.

- [ ] **Step 3: Generalise safe generated outputs and write both MCP files**

Replace `GENERATED_ROOTS` with:

```js
const MCP_SERVER_URL = "https://mcp.sendmux.ai/mcp";
const GENERATED_OUTPUTS = [
  ".claude-plugin",
  ".agents/plugins",
  ".cursor-plugin",
  ".mcp.json",
  "mcp.json",
  "plugins/sendmux",
];
```

Update `assertSafeGeneratedPath()` to use `GENERATED_OUTPUTS`:

```js
if (
  !GENERATED_OUTPUTS.some(
    (output) => relative === output || relative.startsWith(`${output}/`),
  )
) {
  throw new Error(`Refusing to write unexpected generated path: ${relative}`);
}
```

Add the payload builder:

```js
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
```

Write both files in `buildPluginBundles(repoRoot)`:

```js
for (const relativePath of ["mcp.json", ".mcp.json"]) {
  const outputPath = path.join(repoRoot, relativePath);
  assertSafeGeneratedPath(repoRoot, outputPath);
  writeJson(outputPath, mcpConfiguration());
}
```

Make `walkFiles(root)` support exact files:

```js
function walkFiles(root) {
  if (!existsSync(root)) return [];
  if (!statSync(root).isDirectory()) return [root];
  const files = [];
  for (const entry of readdirSync(root)) {
    const entryPath = path.join(root, entry);
    if (statSync(entryPath).isDirectory()) {
      files.push(...walkFiles(entryPath));
    } else {
      files.push(entryPath);
    }
  }
  return files.sort();
}
```

Update `generatedFiles(repoRoot)`:

```js
function generatedFiles(repoRoot) {
  return GENERATED_OUTPUTS.flatMap((output) =>
    walkFiles(path.join(repoRoot, output)).map((filePath) =>
      path.relative(repoRoot, filePath),
    ),
  ).sort();
}
```

- [ ] **Step 4: Run the focused build test and verify green**

Run:

```bash
node --test --test-name-pattern="builds marketplace plugin bundles" scripts/build-plugin-bundles.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Add failing drift coverage for every Cursor output class**

Append:

```js
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
```

- [ ] **Step 6: Run drift coverage, generate real outputs, and verify all tests**

Run:

```bash
node --test --test-name-pattern="detects stale Cursor" scripts/build-plugin-bundles.test.mjs
node scripts/build-plugin-bundles.mjs
node --test scripts/build-plugin-bundles.test.mjs
node scripts/check-plugin-bundles.mjs
```

Expected: all commands exit zero; both MCP files are generated and the drift check passes.

- [ ] **Step 7: Commit the MCP slice**

```bash
git add mcp.json .mcp.json scripts/build-plugin-bundles.mjs scripts/build-plugin-bundles.test.mjs
git commit -m "feat: generate Cursor MCP configuration"
```

### Task 3: Ratchet CI filters and canonical-skill discovery

**Files:**
- Modify: `scripts/build-plugin-bundles.test.mjs`
- Modify: `.github/workflows/plugin-bundles.yml`

**Interfaces:**
- Consumes: committed generated Cursor files and the `skills` map in `openclaw.skills.json`.
- Produces: CI triggers for every source/output and a repository-level assertion that Cursor discovers every declared canonical skill.

- [ ] **Step 1: Strengthen the workflow filter test and verify red**

Replace the four assertions in `workflow checks plugin bundle drift` with:

```js
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
```

Run:

```bash
node --test --test-name-pattern="workflow checks" scripts/build-plugin-bundles.test.mjs
```

Expected: FAIL for the four new Cursor/asset paths.

- [ ] **Step 2: Add every path independently to both workflow filters**

Add these entries under both `pull_request.paths` and `push.paths`:

```yaml
      - "assets/**"
      - ".cursor-plugin/**"
      - "mcp.json"
      - ".mcp.json"
```

Change the job name to:

```yaml
name: Check Cursor, Claude, and Codex plugin bundles
```

- [ ] **Step 3: Run the workflow test and verify green**

Run:

```bash
node --test --test-name-pattern="workflow checks" scripts/build-plugin-bundles.test.mjs
```

Expected: PASS.

- [ ] **Step 4: Add repository-level canonical discovery coverage**

Add `readdirSync` to the filesystem imports, then append:

```js
test("Cursor discovers every declared canonical skill", () => {
  const manifest = readJson(".cursor-plugin/plugin.json");
  const config = readJson("openclaw.skills.json");
  const skillRoot = path.resolve(manifest.skills);
  const discoverable = readdirSync(skillRoot)
    .filter((slug) => existsSync(path.join(skillRoot, slug, "SKILL.md")))
    .sort();
  assert.deepEqual(discoverable, Object.keys(config.skills).sort());
});
```

- [ ] **Step 5: Prove the discovery test is red-capable, then restore green**

Temporarily change the generated manifest's `skills` value to `./missing-skills/`, run:

```bash
node --test --test-name-pattern="Cursor discovers" scripts/build-plugin-bundles.test.mjs
```

Expected: FAIL because the configured directory cannot be read.

Restore generated output with:

```bash
node scripts/build-plugin-bundles.mjs
node --test --test-name-pattern="Cursor discovers" scripts/build-plugin-bundles.test.mjs
```

Expected: PASS with all declared skill slugs matched exactly.

- [ ] **Step 6: Run full bundle validation and commit the CI slice**

```bash
node --test scripts/build-plugin-bundles.test.mjs
node scripts/check-plugin-bundles.mjs
git add .github/workflows/plugin-bundles.yml scripts/build-plugin-bundles.test.mjs .cursor-plugin/plugin.json
git commit -m "test: enforce Cursor plugin synchronisation"
```

### Task 4: Document Cursor accurately before publication

**Files:**
- Modify: `scripts/build-plugin-bundles.test.mjs`
- Modify: `README.md`

**Interfaces:**
- Consumes: Cursor's official `/add-plugin` command and the approved publication boundary.
- Produces: public documentation that describes the prepared plugin without claiming it is already listed.

- [ ] **Step 1: Add a failing documentation contract test**

Append:

```js
test("documents the prepared Cursor plugin without claiming publication", () => {
  const readme = readFileSync("README.md", "utf8");
  assert.match(readme, /Cursor \(after marketplace publication\):/);
  assert.match(readme, /\/add-plugin sendmux/);
  assert.match(readme, /\| Cursor \| After official marketplace publication/);
  assert.match(readme, /Generate Cursor, Claude, and Codex marketplace bundles:/);
});
```

- [ ] **Step 2: Run the documentation test and verify red**

Run:

```bash
node --test --test-name-pattern="documents the prepared Cursor" scripts/build-plugin-bundles.test.mjs
```

Expected: FAIL because `README.md` does not mention Cursor.

- [ ] **Step 3: Add accurate Cursor installation and target text**

Change the marketplace introduction to:

```markdown
Cursor, Claude, and Codex users can install Sendmux as a plugin marketplace from this repository. The Cursor bundle is prepared but is not available through `/add-plugin` until its marketplace submission is approved.
```

Insert before the Claude instructions:

````markdown
Cursor (after marketplace publication):

```text
/add-plugin sendmux
```
````

Add this target-matrix row:

```markdown
| Cursor | After official marketplace publication, run `/add-plugin sendmux`. |
```

Change the development heading sentence to:

```markdown
Generate Cursor, Claude, and Codex marketplace bundles:
```

Change the synchronisation explanation to:

```markdown
The canonical skill source stays in `skills/`. Cursor reads it directly; generated Cursor, Claude, and Codex manifests plus both MCP files are checked for drift in CI.
```

- [ ] **Step 4: Run the documentation and full bundle tests**

Run:

```bash
node --test --test-name-pattern="documents the prepared Cursor" scripts/build-plugin-bundles.test.mjs
node --test scripts/build-plugin-bundles.test.mjs
node scripts/check-plugin-bundles.mjs
```

Expected: all commands exit zero.

- [ ] **Step 5: Commit the documentation slice**

```bash
git add README.md scripts/build-plugin-bundles.test.mjs
git commit -m "docs: add prepared Cursor plugin"
```

### Task 5: Validate the complete plugin without publishing

**Files:**
- Verify only; modify files only if a validation failure exposes a defect.

**Interfaces:**
- Consumes: all committed plugin outputs.
- Produces: evidence that local tests, generated drift, Cursor's current schema, and unauthenticated OAuth discovery all behave as designed.

- [ ] **Step 1: Run local correctness checks**

```bash
node --test scripts/build-plugin-bundles.test.mjs
node scripts/check-plugin-bundles.mjs
git diff --check
```

Expected: tests pass, drift check prints `Plugin bundle check passed.`, and `git diff --check` has no output.

- [ ] **Step 2: Validate the manifest against Cursor's current official schema**

```bash
cursor_validator_dir=$(mktemp -d)
cursor_schema="$cursor_validator_dir/plugin.schema.json"
curl -fsSL 'https://raw.githubusercontent.com/cursor/plugins/main/schemas/plugin.schema.json' -o "$cursor_schema"
npm install --prefix "$cursor_validator_dir" --no-save --silent ajv ajv-formats
NODE_PATH="$cursor_validator_dir/node_modules" \
CURSOR_SCHEMA="$cursor_schema" \
CURSOR_MANIFEST=".cursor-plugin/plugin.json" \
node -e '
const fs = require("node:fs");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const schema = JSON.parse(fs.readFileSync(process.env.CURSOR_SCHEMA, "utf8"));
const manifest = JSON.parse(fs.readFileSync(process.env.CURSOR_MANIFEST, "utf8"));
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);
if (!validate(manifest)) {
  console.error(validate.errors);
  process.exit(1);
}
console.log("Cursor plugin manifest valid.");
'
```

Expected: `Cursor plugin manifest valid.` This follows Cursor's validator and installs no repository dependency. [research:https://github.com/cursor/plugins/blob/main/scripts/validate-plugins.mjs] [research:https://github.com/cursor/plugins/blob/main/.github/workflows/validate-plugins.yml]

- [ ] **Step 3: Verify the hosted MCP advertises OAuth without credentials**

Run the harmless initialisation request:

```bash
curl -sS -D - -o /dev/null -X POST 'https://mcp.sendmux.ai/mcp' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"sendmux-plugin-validation","version":"1.0.0"}}}'
```

Expected: HTTP `401` with a `WWW-Authenticate` header containing `resource_metadata="https://mcp.sendmux.ai/.well-known/oauth-protected-resource/mcp"`.

Validate the advertised metadata:

```bash
curl -fsSL 'https://mcp.sendmux.ai/.well-known/oauth-protected-resource/mcp' | node -e '
let body = "";
process.stdin.on("data", (chunk) => { body += chunk; });
process.stdin.on("end", () => {
  const metadata = JSON.parse(body);
  if (metadata.resource !== "https://mcp.sendmux.ai/mcp") process.exit(1);
  if (!metadata.authorization_servers?.includes("https://app.sendmux.ai")) process.exit(1);
  console.log("Sendmux MCP OAuth metadata valid.");
});
'
```

Expected: `Sendmux MCP OAuth metadata valid.` No credential is requested and no MCP tool is invoked.

- [ ] **Step 4: Inspect the final change set and stop at the publication boundary**

```bash
git status --short
git log --oneline 1548f7e..HEAD
git diff --stat 1548f7e..HEAD
```

Expected: no uncommitted files; commits cover design, manifest, MCP, synchronisation tests, and documentation. Do not bump the version, push, open a PR, publish a release, or submit to Cursor.
