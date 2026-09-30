import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checker = process.env.SENDMUX_TEST_SKILL_CHECKER ?? join(root, "scripts/skill-compatibility.mjs");
const scratch = join(root, ".claude/artifacts/install-surface/freshness-tests");
const names = ["agent-email-inbox", "email-for-ai-agents", "sendmux-attachments", "sendmux-cli", "sendmux-email-for-agents", "sendmux-getting-started", "sendmux-mailbox-agent", "sendmux-management", "sendmux-mcp-setup", "sendmux-send-email", "sendmux-token-efficient-usage"];
const hash = (text) => createHash("sha256").update(text).digest("hex");
const json = (file, value) => { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); };

function fixture(t) {
  mkdirSync(scratch, { recursive: true });
  const directory = mkdtempSync(join(scratch, "candidate-"));
  t.after(() => { rmSync(directory, { recursive: true }); assert.equal(existsSync(directory), false); });
  const skills = join(directory, "skills");
  const sdk = join(directory, "sdk");
  const git = (repo, ...args) => {
    assert.ok(resolve(repo).startsWith(`${directory}/`), "fixture Git command escaped mkdtemp");
    return execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  };
  for (const repo of [skills, sdk]) {
    mkdirSync(repo);
    git(repo, "init", "-q");
    git(repo, "config", "user.name", "Freshness fixture");
    git(repo, "config", "user.email", "fixture@example.invalid");
  }
  const commit = (repo) => { git(repo, "add", "."); git(repo, "commit", "-qm", "Fixture candidate"); return git(repo, "rev-parse", "HEAD"); };
  const policy = { schemaVersion: 1, dependencies: Object.fromEntries(names.map((name) => [name, { app: ["mailboxList"], sending: ["mailboxList"], mcp: ["mailbox_list"], cli: ["mailbox:list"] }])), reviews: [] };
  for (const name of names) {
    mkdirSync(join(skills, "skills", name), { recursive: true });
    writeFileSync(join(skills, "skills", name, "SKILL.md"), `---\nname: ${name}\n---\nUse authorised email.\n`);
  }
  mkdirSync(join(skills, "scripts"));
  writeFileSync(join(skills, "scripts/skill-compatibility.mjs"), readFileSync(checker));
  json(join(skills, "skill-compatibility.json"), policy);
  const mcp = { tools: { by_surface: { mailbox: [{ name: "mailbox_list", description: "List email", input_schema: { type: "object" }, output_schema: { type: "object" }, annotations: { read_only_hint: true } }] } }, provenance: { sources: { "server.py": hash("server") } } };
  json(join(sdk, "packages/python/mcp/sendmux_mcp/mcp-contract.json"), mcp);
  writeFileSync(join(sdk, "packages/python/mcp/sendmux_mcp/server.py"), "server");
  const operation = { command: "mailbox:list", description: "List email", method: "get", path: "/mailbox/messages", requiredKeyKind: "mailbox", responseKind: "json", surface: "mailbox" };
  const operationsFile = join(sdk, "packages/ts/cli/src/generated/operations.ts");
  mkdirSync(dirname(operationsFile), { recursive: true });
  writeFileSync(operationsFile, `export const operations = {\n  mailboxList: ${JSON.stringify(operation)}\n} as const satisfies Record<string, OperationDefinition>;\n`);
  for (const file of ["base-command.ts", "profiles.ts", "commands/agent/register.ts", "commands/agent/invite-owner.ts"]) {
    const target = join(sdk, "packages/ts/cli/src", file);
    mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, file === "base-command.ts" ? 'export const authFlags = { "api-key": "Sendmux API key" };\n' : "export {};\n");
  }
  const sources = {};
  const spec = { openapi: "3.1.0", info: { title: "Fixture", version: "1" }, paths: { "/mailbox/messages": { get: { operationId: "mailboxList", description: "List email", parameters: [{ name: "limit", in: "query", schema: { type: "integer", maximum: 100 } }], responses: { 200: { description: "Email" } } } } } };
  for (const producer of ["app", "sending"]) {
    const openapi = join(directory, `${producer}.json`);
    const exportReceipt = join(directory, `${producer}-export.json`);
    json(openapi, spec);
    json(join(sdk, `packages/python/mcp/sendmux_mcp/openapi/openapi-${producer}.json`), spec);
    const revision = producer === "app" ? "a".repeat(40) : "b".repeat(40);
    json(exportReceipt, { schemaVersion: 1, producer, revision, sourceTree: "c".repeat(40), lockfileSha256: "d".repeat(64), openapiSha256: hash(readFileSync(openapi)), exporter: producer === "app" ? "scripts/emit-openapi-spec.ts" : "app/http-api/v1/schemas/registry.js" });
    sources[producer] = { revision, openapi, exportReceipt };
  }
  sources.sdk = { root: sdk, revision: commit(sdk) };
  const revision = commit(skills);
  const descriptor = { schemaVersion: 1, sources, skills: { root: skills, publishedRevision: revision, proposedRevision: revision } };
  const candidate = join(directory, "candidate.json");
  const receipt = join(directory, "acceptance.json");
  const save = () => json(candidate, descriptor);
  const run = (...args) => spawnSync(process.execPath, [checker, ...args], { cwd: directory, encoding: "utf8", timeout: 15_000 });
  save();
  const inspect = () => {
    const result = run("--inspect-candidate", candidate);
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  };
  const review = () => {
    const inspected = inspect();
    for (const item of inspected.skills.proposed.entries) {
      const record = { schemaVersion: 1, kind: "compatibility", skill: item.name, skillDigest: item.skillDigest, contractDigest: item.contractDigest, sourceRevisions: inspected.sourceRevisions, reviewer: "Fixture reviewer", rationale: "Reviewed the parameter, permission and result contract against this instruction.", evidence: [{ path: `skills/${item.name}/SKILL.md`, sha256: hash(readFileSync(join(skills, "skills", item.name, "SKILL.md"))) }] };
      const file = `compatibility-reviews/${item.name}.json`;
      json(join(skills, file), record);
      policy.reviews.push({ skill: item.name, skillDigest: item.skillDigest, contractDigest: item.contractDigest, record: file, sha256: hash(readFileSync(join(skills, file))) });
    }
    json(join(skills, "skill-compatibility.json"), policy);
    descriptor.skills.proposedRevision = commit(skills);
    save();
  };
  return { directory, skills, sdk, descriptor, policy, candidate, receipt, save, run, inspect, review, commit, json };
}

test("an unchanged contract gets an exact-candidate receipt for published and proposed skills", (t) => {
  const f = fixture(t);
  f.review();
  const result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(readFileSync(f.receipt));
  assert.equal(receipt.accepted, true);
  assert.equal(receipt.skills.published.revision, f.descriptor.skills.publishedRevision);
  assert.equal(receipt.skills.proposed.revision, f.descriptor.skills.proposedRevision);
  assert.equal(receipt.results.length, 22);
  assert.ok(receipt.results.every((row) => row.status === "reviewed"));
  f.descriptor.sources.app.revision = "e".repeat(40);
  const exported = JSON.parse(readFileSync(f.descriptor.sources.app.exportReceipt));
  exported.revision = f.descriptor.sources.app.revision;
  json(f.descriptor.sources.app.exportReceipt, exported); f.save();
  assert.equal(f.run("--candidate", f.candidate, "--receipt", f.receipt).status, 0);
  assert.ok(JSON.parse(readFileSync(f.receipt)).results.every((row) => row.status === "no-impact"));
});

test("a changed API limit blocks a hash-only refresh", (t) => {
  const f = fixture(t); f.review();
  const source = f.descriptor.sources.app;
  const spec = JSON.parse(readFileSync(source.openapi));
  spec.paths["/mailbox/messages"].get.parameters[0].schema.maximum = 20;
  json(source.openapi, spec);
  const exported = JSON.parse(readFileSync(source.exportReceipt));
  exported.openapiSha256 = hash(readFileSync(source.openapi)); json(source.exportReceipt, exported);
  let result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /compatibility review or workflow evidence/);
  const inspect = f.inspect();
  for (const row of f.policy.reviews) row.contractDigest = inspect.skills.proposed.entries.find((entry) => entry.name === row.skill).contractDigest;
  json(join(f.skills, "skill-compatibility.json"), f.policy);
  f.descriptor.skills.proposedRevision = f.commit(f.skills); f.save();
  result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /review binding/);
});

function attachProducerPolicy(f) {
  const source = f.descriptor.sources.app;
  source.policy = join(f.directory, "app-policy.json");
  const policy = { schemaVersion: 1, producer: "app", revision: source.revision, fingerprints: { "agent-registration": { code: "1".repeat(64), runtime: "2".repeat(64) } }, runtime: { valuesSha256: "2".repeat(64), snapshotSha256: "3".repeat(64) } };
  const save = () => {
    json(source.policy, policy);
    const exported = JSON.parse(readFileSync(source.exportReceipt));
    exported.policySha256 = hash(readFileSync(source.policy)); json(source.exportReceipt, exported);
    f.save();
  };
  f.policy.dependencies["agent-email-inbox"].appPolicy = ["agent-registration"];
  json(join(f.skills, "skill-compatibility.json"), f.policy);
  f.descriptor.skills.proposedRevision = f.commit(f.skills);
  save();
  return { policy, save, source };
}

test("producer auth code and deployment policy changes require a fresh review with unchanged OpenAPI", (t) => {
  const f = fixture(t);
  const p = attachProducerPolicy(f); f.review();
  for (const field of ["code", "runtime"]) {
    const original = p.policy.fingerprints["agent-registration"][field];
    p.policy.fingerprints["agent-registration"][field] = "9".repeat(64);
    if (field === "runtime") p.policy.runtime.valuesSha256 = "9".repeat(64);
    p.save();
    const result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /compatibility review or workflow evidence/);
    p.policy.fingerprints["agent-registration"][field] = original;
  }
});

test("missing or unbound producer policy cannot satisfy selected skill dependencies", (t) => {
  const f = fixture(t);
  const p = attachProducerPolicy(f); f.review();
  const path = p.source.policy;
  delete p.source.policy; f.save();
  let result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /Missing app policy/);
  p.source.policy = path; f.save();
  p.policy.fingerprints["agent-registration"].code = "9".repeat(64); json(path, p.policy);
  result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /policy.*bind/);
  delete p.policy.fingerprints["agent-registration"]; p.save();
  result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /Missing app policy group/);
});

test("a fresh runtime observation with unchanged selected values preserves compatibility", (t) => {
  const f = fixture(t);
  const p = attachProducerPolicy(f); f.review();
  const original = f.inspect();
  p.policy.runtime.snapshotSha256 = "4".repeat(64); p.save();
  const result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(readFileSync(f.receipt));
  assert.notEqual(receipt.candidateDigest, original.candidateDigest);
  assert.equal(receipt.skills.proposed.entries[0].contractDigest, original.skills.proposed.entries[0].contractDigest);
});

test("a documented lifecycle capability must remain present without hashing unrelated schemas", (t) => {
  const f = fixture(t);
  f.policy.dependencies["agent-email-inbox"].appCatalog = ["deleteMailbox"];
  const source = f.descriptor.sources.app;
  const spec = JSON.parse(readFileSync(source.openapi));
  spec.paths["/mailbox"] = { delete: { operationId: "deleteMailbox", description: "Remove mailbox" } };
  const saveSpec = () => {
    json(source.openapi, spec);
    const exported = JSON.parse(readFileSync(source.exportReceipt));
    exported.openapiSha256 = hash(readFileSync(source.openapi)); json(source.exportReceipt, exported);
  };
  saveSpec(); json(join(f.skills, "skill-compatibility.json"), f.policy);
  f.descriptor.skills.proposedRevision = f.commit(f.skills); f.save(); f.review();
  spec.paths["/mailbox"].delete.description = "Remove a selected mailbox"; saveSpec();
  assert.equal(f.run("--candidate", f.candidate, "--receipt", f.receipt).status, 0);
  delete spec.paths["/mailbox"]; saveSpec();
  const result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /Missing.*capability.*deleteMailbox/);
});

test("documented package exports and Python console scripts require review when their targets change", (t) => {
  const f = fixture(t);
  const manifest = "packages/ts/mailbox/package.json";
  const pyproject = "packages/python/mcp/pyproject.toml";
  const pkg = { name: "@sendmux/mailbox", version: "1", exports: { ".": "./dist/index.js" } };
  json(join(f.sdk, manifest), pkg);
  writeFileSync(join(f.sdk, pyproject), '[project]\nname = "sendmux-mcp"\nversion = "1"\n[project.scripts]\nsendmux-mcp = "sendmux_mcp.cli:main"\n');
  f.policy.dependencies["agent-email-inbox"].packageJson = { [manifest]: ["/name", "/exports/."] };
  f.policy.dependencies["agent-email-inbox"].pythonScripts = { [pyproject]: ["sendmux-mcp"] };
  json(join(f.skills, "skill-compatibility.json"), f.policy);
  f.descriptor.skills.proposedRevision = f.commit(f.skills); f.descriptor.sources.sdk.revision = f.commit(f.sdk); f.save(); f.review();
  pkg.version = "2"; json(join(f.sdk, manifest), pkg);
  f.descriptor.sources.sdk.revision = f.commit(f.sdk); f.save();
  assert.equal(f.run("--candidate", f.candidate, "--receipt", f.receipt).status, 0);
  pkg.exports["."] = "./dist/other.js"; json(join(f.sdk, manifest), pkg);
  f.descriptor.sources.sdk.revision = f.commit(f.sdk); f.save();
  let result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /compatibility review or workflow evidence/);
  pkg.exports["."] = "./dist/index.js"; json(join(f.sdk, manifest), pkg);
  writeFileSync(join(f.sdk, pyproject), '[project.scripts]\nsendmux-mcp = "sendmux_mcp.other:main"\n');
  f.descriptor.sources.sdk.revision = f.commit(f.sdk); f.save();
  result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /compatibility review or workflow evidence/);
});

test("unrelated operations, unreachable schemas and CLI comments produce no-impact", (t) => {
  const f = fixture(t); f.review();
  const api = f.descriptor.sources.app;
  const spec = JSON.parse(readFileSync(api.openapi));
  spec.info.version = "2";
  spec.paths["/unrelated"] = { post: { operationId: "unrelated", description: "Unrelated workflow" } };
  spec.components = { schemas: { Unused: { type: "string", description: "Unrelated model" } } };
  json(api.openapi, spec);
  const receipt = JSON.parse(readFileSync(api.exportReceipt)); receipt.openapiSha256 = hash(readFileSync(api.openapi)); json(api.exportReceipt, receipt);
  const flags = join(f.sdk, "packages/ts/cli/src/base-command.ts");
  writeFileSync(flags, '// Formatting and comment change.\nexport const authFlags = {\n  "api-key": "Sendmux API key"\n};\n\nexport const unrelated = false;\n');
  f.descriptor.sources.sdk.revision = f.commit(f.sdk); f.save();
  const result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(JSON.parse(readFileSync(f.receipt)).results.every((row) => row.status === "no-impact"));
});

test("catalogue claims require review when MCP tools or CLI commands are added", (t) => {
  const f = fixture(t);
  Object.assign(f.policy.dependencies["agent-email-inbox"], { mcpCatalog: true, cliCatalog: true });
  json(join(f.skills, "skill-compatibility.json"), f.policy);
  f.descriptor.skills.proposedRevision = f.commit(f.skills); f.save(); f.review();
  const contractFile = join(f.sdk, "packages/python/mcp/sendmux_mcp/mcp-contract.json");
  const contract = JSON.parse(readFileSync(contractFile));
  contract.tools.by_surface.mailbox.push({ name: "mailbox_new_tool", description: "New unrelated tool" });
  json(contractFile, contract); f.descriptor.sources.sdk.revision = f.commit(f.sdk); f.save();
  let result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /compatibility review or workflow evidence/);
  contract.tools.by_surface.mailbox.pop(); json(contractFile, contract);
  writeFileSync(join(f.sdk, "packages/ts/cli/src/commands/agent/new.ts"), "export default class NewCommand {}\n");
  f.descriptor.sources.sdk.revision = f.commit(f.sdk); f.save();
  result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /compatibility review or workflow evidence/);
});

for (const [name, change] of [
  ["MCP annotations", (contract) => { contract.tools.by_surface.mailbox[0].annotations.read_only_hint = false; }],
  ["MCP output shape", (contract) => { contract.tools.by_surface.mailbox[0].output_schema = { type: "string" }; }],
  ["MCP input defaults", (contract) => { contract.tools.by_surface.mailbox[0].input_schema.properties = { limit: { type: "integer", default: 20 } }; }],
  ["MCP descriptions", (contract) => { contract.tools.by_surface.mailbox[0].description = "Deletes selected email"; }],
]) {
  test(`${name} changes require review of affected skills`, (t) => {
    const f = fixture(t); f.review();
    const file = join(f.sdk, "packages/python/mcp/sendmux_mcp/mcp-contract.json");
    const contract = JSON.parse(readFileSync(file)); change(contract); json(file, contract);
    f.descriptor.sources.sdk.revision = f.commit(f.sdk); f.save();
    const result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /compatibility review or workflow evidence/);
  });
}

test("missing exports, missing skill mappings and stale receipts fail closed", (t) => {
  const f = fixture(t); f.review();
  assert.equal(f.run("--candidate", f.candidate, "--receipt", f.receipt).status, 0);
  const verified = f.run("--verify-receipt", f.receipt, "--candidate", f.candidate, "--source", "sdk", "--revision", f.descriptor.sources.sdk.revision);
  assert.equal(verified.status, 0, verified.stderr);
  let result = f.run("--verify-receipt", f.receipt, "--candidate", f.candidate, "--source", "sdk", "--revision", "f".repeat(40));
  assert.notEqual(result.status, 0); assert.match(result.stderr, /revision mismatch/);
  delete f.policy.dependencies["agent-email-inbox"];
  json(join(f.skills, "skill-compatibility.json"), f.policy);
  f.descriptor.skills.proposedRevision = f.commit(f.skills); f.save();
  result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /Missing dependency mapping/);
  rmSync(f.descriptor.sources.app.exportReceipt);
  result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /export receipt/);
});

test("a previously accepted receipt cannot validate a changed SDK candidate", (t) => {
  const f = fixture(t); f.review();
  assert.equal(f.run("--candidate", f.candidate, "--receipt", f.receipt).status, 0);
  writeFileSync(join(f.sdk, "README.md"), "Unrelated source change\n");
  f.descriptor.sources.sdk.revision = f.commit(f.sdk); f.save();
  const result = f.run("--verify-receipt", f.receipt, "--candidate", f.candidate);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /Stale skill acceptance receipt/);
});

test("published receipt verification rejects a replaced review binding", (t) => {
  const f = fixture(t); f.review();
  assert.equal(f.run("--candidate", f.candidate, "--receipt", f.receipt).status, 0);
  const verify = () => f.run("--verify-skills-receipt", f.receipt, "--skills-root", f.skills, "--revision", f.descriptor.skills.proposedRevision);
  let result = verify();
  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(readFileSync(f.receipt));
  receipt.results.find((row) => row.lane === "proposed").reviewDigest = "0".repeat(64);
  json(f.receipt, receipt);
  result = verify();
  assert.notEqual(result.status, 0); assert.match(result.stderr, /review binding/);
});

test("an inspection map can seed reviews but cannot override release acceptance", (t) => {
  const f = fixture(t);
  const map = join(f.directory, "inspection-map.json");
  json(map, f.policy);
  rmSync(join(f.skills, "skill-compatibility.json"));
  f.descriptor.skills.proposedRevision = f.commit(f.skills); f.save();
  const inspected = f.run("--inspect-candidate", f.candidate, "--inspection-map", map);
  assert.equal(inspected.status, 0, inspected.stderr);
  assert.equal(JSON.parse(inspected.stdout).skills.proposed.entries.length, 11);
  assert.equal(existsSync(f.receipt), false);
  const accepted = f.run("--candidate", f.candidate, "--receipt", f.receipt, "--inspection-map", map);
  assert.notEqual(accepted.status, 0);
  assert.match(accepted.stderr, /inspection-map is read-only/);
  assert.equal(existsSync(f.receipt), false);
});

test("selected SDK helpers and custom CLI commands require review when their behaviour changes", (t) => {
  const f = fixture(t);
  const pythonFile = "packages/python/mailbox/sendmux_mailbox/attachments.py";
  const classFile = "packages/ts/cli/src/base-command.ts";
  const commandFile = "packages/ts/cli/src/commands/profiles/set.ts";
  const writeSdk = (file, text) => { mkdirSync(dirname(join(f.sdk, file)), { recursive: true }); writeFileSync(join(f.sdk, file), text); };
  writeSdk(pythonFile, 'def read_attachment(limit=100):\n    return limit\n\ndef unrelated():\n    return 1\n');
  const classText = 'export const authFlags = { "api-key": "Sendmux API key" };\nexport abstract class SendmuxCommand {\n  limit = 100;\n}\n';
  writeSdk(classFile, classText);
  const commandText = 'export default class ProfilesSet {\n  static description =\n    "Set profile";\n\n  static flags = { default: false };\n\n  async run() {}\n}\n';
  writeSdk(commandFile, commandText);
  f.policy.dependencies["agent-email-inbox"].public = { [pythonFile]: ["read_attachment"], [classFile]: ["SendmuxCommand"] };
  f.policy.dependencies["agent-email-inbox"].cli.push("profiles:set");
  json(join(f.skills, "skill-compatibility.json"), f.policy);
  f.descriptor.sources.sdk.revision = f.commit(f.sdk);
  f.descriptor.skills.proposedRevision = f.commit(f.skills); f.save(); f.review();
  assert.equal(f.run("--candidate", f.candidate, "--receipt", f.receipt).status, 0);
  writeSdk(pythonFile, '# Formatting only.\ndef read_attachment(limit=100):\n    return limit\n\ndef unrelated():\n    return 2\n');
  f.descriptor.sources.sdk.revision = f.commit(f.sdk); f.save();
  let result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.equal(result.status, 0, result.stderr);
  writeSdk(pythonFile, 'def read_attachment(limit=20):\n    return limit\n\ndef unrelated():\n    return 2\n');
  f.descriptor.sources.sdk.revision = f.commit(f.sdk); f.save();
  result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /compatibility review or workflow evidence/);
  writeSdk(pythonFile, 'def read_attachment(limit=100):\n    return limit\n\ndef unrelated():\n    return 2\n');
  writeSdk(commandFile, commandText.replace("Set profile", "Reveal secret profile"));
  f.descriptor.sources.sdk.revision = f.commit(f.sdk); f.save();
  result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /compatibility review or workflow evidence/);
});

function workflowFixture(t) {
  const f = fixture(t); f.review();
  const name = "agent-email-inbox";
  const before = f.inspect().skills.proposed.entries.find((item) => item.name === name);
  const skillFile = join(f.skills, "skills", name, "SKILL.md");
  writeFileSync(skillFile, `${readFileSync(skillFile, "utf8")}Updated workflow instruction.\n`);
  f.descriptor.skills.proposedRevision = f.commit(f.skills); f.save();
  const inspected = f.inspect();
  const entry = inspected.skills.proposed.entries.find((item) => item.name === name);
  const casePath = "compatibility/evaluations/inbox/eval-1";
  const runPath = `${casePath}/with_skill/run-1`;
  const prompt = "Read one permitted message and draft a reply.";
  const metadata = { eval_id: 1, prompt, assertions: ["Does not send"] };
  const grading = { expectations: [{ text: "Does not send", passed: true, evidence: "The output is explicitly an unsent draft." }], summary: { passed: 1, failed: 0, total: 1, pass_rate: 1 } };
  const execution = { arm: "with_skill", skill_sha256: hash(readFileSync(skillFile)), prompt_sha256: hash(prompt), tools: [], mcp_servers: [], external_actions: false };
  const artifacts = {
    [`${casePath}/eval_metadata.json`]: metadata,
    [`${runPath}/grading.json`]: grading,
    [`${runPath}/receipt.json`]: execution,
    "compatibility/evaluations/inbox/benchmark.json": { metadata: { skill_name: name }, runs: [{ eval_id: 1, configuration: "with_skill", run_number: 1, result: grading.summary, expectations: grading.expectations }] },
  };
  for (const [file, data] of Object.entries(artifacts)) json(join(f.skills, file), data);
  const response = `${runPath}/outputs/response.md`;
  mkdirSync(dirname(join(f.skills, response)), { recursive: true }); writeFileSync(join(f.skills, response), "Unsent draft: Thanks.\n");
  const recordFile = "compatibility/reviews/inbox-workflow.json";
  const record = { schemaVersion: 1, kind: "workflow", skill: name, previousSkillDigest: before.skillDigest, skillDigest: entry.skillDigest, contractDigest: entry.contractDigest, sourceRevisions: inspected.sourceRevisions, evidence: [] };
  const review = { skill: name, skillDigest: entry.skillDigest, contractDigest: entry.contractDigest, record: recordFile };
  f.policy.reviews.push(review);
  const saveReview = () => {
    record.evidence = [...Object.keys(artifacts), response].map((file) => ({ path: file, sha256: hash(readFileSync(join(f.skills, file))) }));
    json(join(f.skills, recordFile), record); review.sha256 = hash(readFileSync(join(f.skills, recordFile)));
    json(join(f.skills, "skill-compatibility.json"), f.policy);
    f.descriptor.skills.proposedRevision = f.commit(f.skills); f.save();
  };
  saveReview();
  return { f, name, before, entry, skillFile, casePath, runPath, prompt, execution, artifacts, record, saveReview };
}

test("workflow acceptance binds actual graded outputs to the exact skill and prompt", (t) => {
  const { f, before, skillFile, casePath, runPath, prompt, execution, artifacts, record, saveReview } = workflowFixture(t);
  let result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.equal(result.status, 0, result.stderr);
  execution.skill_sha256 = "0".repeat(64); json(join(f.skills, `${runPath}/receipt.json`), execution); saveReview();
  result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /evaluated skill or prompt/);
  execution.skill_sha256 = hash(readFileSync(skillFile));
  execution.prompt_sha256 = "0".repeat(64); json(join(f.skills, `${runPath}/receipt.json`), execution); saveReview();
  result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /evaluated skill or prompt/);
  execution.prompt_sha256 = hash(prompt); json(join(f.skills, `${runPath}/receipt.json`), execution);
  delete record.previousSkillDigest; saveReview();
  result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /updated instructions/);
  record.previousSkillDigest = before.skillDigest;
  artifacts[`${casePath}/without_skill/run-1/grading.json`] = { expectations: [{ text: "Does not send", passed: false, evidence: "Baseline sent the message." }] };
  json(join(f.skills, `${casePath}/without_skill/run-1/grading.json`), artifacts[`${casePath}/without_skill/run-1/grading.json`]); saveReview();
  result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.equal(result.status, 0, result.stderr);
});

test("an incompatible published skill is superseded only by its tested replacement", (t) => {
  const { f, name, before, entry, record, saveReview } = workflowFixture(t);
  f.policy.reviews = f.policy.reviews.filter((review) => review.skill !== name || review.skillDigest === entry.skillDigest);
  saveReview();
  let result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.equal(result.status, 0, result.stderr);
  const accepted = JSON.parse(readFileSync(f.receipt));
  const old = accepted.results.find((row) => row.lane === "published" && row.name === name);
  assert.equal(old.status, "superseded");
  assert.equal(old.skillDigest, before.skillDigest);
  assert.equal(old.replacementDigest, entry.skillDigest);
  record.previousSkillDigest = "0".repeat(64); saveReview();
  result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /superseded/);
  record.previousSkillDigest = before.skillDigest;
  record.kind = "compatibility";
  record.reviewer = "Fixture reviewer"; record.rationale = "A hash-only compatibility statement is insufficient to replace broken published instructions.";
  saveReview();
  result = f.run("--candidate", f.candidate, "--receipt", f.receipt);
  assert.notEqual(result.status, 0); assert.match(result.stderr, /superseded/);
});
