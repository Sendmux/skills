#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const self = fileURLToPath(import.meta.url);
const policyPath = "skill-compatibility.json";
const mcpRoot = "packages/python/mcp/sendmux_mcp";
const cliRoot = "packages/ts/cli/src";
const requiredSkills = ["agent-email-inbox", "email-for-ai-agents", "sendmux-attachments", "sendmux-cli", "sendmux-email-for-agents", "sendmux-getting-started", "sendmux-mailbox-agent", "sendmux-management", "sendmux-mcp-setup", "sendmux-send-email", "sendmux-token-efficient-usage"];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const stable = (value) => JSON.stringify(normalize(value));
const objectHash = (value) => hash(stable(value));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const sha = (value) => { assert(/^[0-9a-f]{40}$/.test(value ?? ""), "Expected immutable 40-character revision"); return value; };
const hex = (value) => /^[0-9a-f]{64}$/.test(value ?? "");
const safePath = (value) => { assert(typeof value === "string" && value.length > 0 && !value.startsWith("/") && !value.split("/").includes(".."), "Invalid repository path"); return value; };
let gitEnvironment;

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]));
  return value;
}

function git(root, ...args) {
  if (!gitEnvironment) {
    gitEnvironment = { ...process.env };
    for (const name of execFileSync("git", ["rev-parse", "--local-env-vars"], { encoding: "utf8" }).trim().split("\n")) delete gitEnvironment[name];
  }
  return execFileSync("git", ["-C", root, ...args], { env: gitEnvironment, encoding: "utf8", timeout: 15_000, maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
}

function committed(root, revision) {
  sha(revision);
  assert(git(root, "rev-parse", `${revision}^{commit}`).trim() === revision, "Revision is not an immutable commit");
  const cache = new Map();
  return {
    at(otherRevision) { return committed(root, otherRevision); },
    read(file) {
      safePath(file);
      if (!cache.has(file)) cache.set(file, git(root, "show", `${revision}:${file}`));
      return cache.get(file);
    },
    files(prefix = "") {
      return git(root, "ls-tree", "-r", "--name-only", revision, "--", prefix).trim().split("\n").filter(Boolean);
    },
    blobs(prefix) {
      return git(root, "ls-tree", "-r", revision, "--", prefix).trim().split("\n").filter(Boolean).map((line) => {
        const [metadata, file] = line.split("\t");
        return [file, metadata.split(" ")[2]];
      });
    },
  };
}

function readJson(file, label) {
  assert(existsSync(file), `Missing ${label}: ${file}`);
  const bytes = readFileSync(file);
  assert(bytes.length <= 16 * 1024 * 1024, `${label} exceeds 16 MiB`);
  return JSON.parse(bytes);
}

function producerContract(name, source, base) {
  assert(source, `Missing ${name} source`);
  const revision = sha(source.revision);
  const openapiPath = resolve(base, source.openapi ?? "");
  const receipt = readJson(resolve(base, source.exportReceipt ?? ""), `${name} export receipt`);
  const spec = readJson(openapiPath, `${name} OpenAPI export`);
  const exporter = name === "app" ? "scripts/emit-openapi-spec.ts" : "app/http-api/v1/schemas/registry.js";
  assert(receipt.schemaVersion === 1 && receipt.producer === name && receipt.revision === revision
    && receipt.exporter === exporter && /^[0-9a-f]{40}$/.test(receipt.sourceTree ?? "") && hex(receipt.lockfileSha256)
    && receipt.openapiSha256 === hash(readFileSync(openapiPath)), `${name} export receipt does not bind the candidate`);
  assert(typeof spec.openapi === "string" && spec.paths && Object.keys(spec.paths).length > 0, `${name} OpenAPI export is empty`);
  // Release numbering does not change instructions. Descriptions, schemas,
  // permissions, defaults, limits and extensions remain part of the contract.
  const contract = { ...spec, info: { ...spec.info } };
  delete contract.info.version;
  let policy;
  if (source.policy || receipt.policySha256) {
    assert(source.policy, `Missing ${name} policy artifact`);
    const policyFile = resolve(base, source.policy);
    policy = readJson(policyFile, `${name} policy artifact`);
    assert(receipt.policySha256 === hash(readFileSync(policyFile)) && policy.schemaVersion === 1 && policy.producer === name && policy.revision === revision && policy.fingerprints && !Array.isArray(policy.fingerprints), `${name} policy export does not bind the candidate`);
    for (const value of Object.values(policy.fingerprints)) assert(hex(value?.code) && (value.runtime === undefined || hex(value.runtime)), `Invalid ${name} policy fingerprint`);
    if (policy.runtime) {
      assert(policy.fingerprints["agent-registration"], `Missing ${name} policy group: agent-registration`);
      assert(hex(policy.runtime.valuesSha256) && hex(policy.runtime.snapshotSha256) && policy.fingerprints["agent-registration"].runtime === policy.runtime.valuesSha256, `Invalid ${name} runtime policy binding`);
    }
  }
  return { contract, policy: policy?.fingerprints, identity: { revision, sourceTree: receipt.sourceTree, lockfileSha256: receipt.lockfileSha256, openapiSha256: receipt.openapiSha256, ...(policy ? { policySha256: receipt.policySha256 } : {}) } };
}

function sdkContracts(source, base) {
  assert(source?.root, "Missing SDK source");
  const sdk = committed(resolve(base, source.root), source.revision);
  const mcp = JSON.parse(sdk.read(`${mcpRoot}/mcp-contract.json`));
  assert(Object.keys(mcp.tools?.by_surface ?? {}).length > 0, "Missing MCP tool contract");
  assert(Object.keys(mcp.provenance?.sources ?? {}).length > 0, "Missing MCP contract provenance");
  for (const [file, digest] of Object.entries(mcp.provenance.sources)) {
    assert(hash(sdk.read(`${mcpRoot}/${safePath(file)}`)) === digest, `Stale MCP contract provenance: ${file}`);
  }
  delete mcp.provenance;
  const match = sdk.read(`${cliRoot}/generated/operations.ts`).match(/export const operations = ([\s\S]*?) as const satisfies/);
  assert(match, "Missing CLI operations contract");
  // Generated values are JSON. Quote only the outer identifier keys; never
  // execute source from another checkout to discover its public contract.
  const operations = JSON.parse(match[1].replace(/^  ([A-Za-z_$][\w$]*):/gm, '  "$1":').replace(/,\s*}$/, "}"));
  assert(Object.keys(operations).length > 0, "Empty CLI operations contract");
  const cli = { operations, source: sdk };
  const snapshots = Object.fromEntries(["app", "sending"].map((name) => [`openapi-${name}.json`, hash(sdk.read(`${mcpRoot}/openapi/openapi-${name}.json`))]));
  return { contracts: { mcp, cli, source: sdk }, identity: { revision: source.revision, snapshots } };
}

function codeTokens(text) {
  const tokens = text.match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/\/[^\n]*|\/\*[\s\S]*?\*\/|\s+|[^\s]/g) ?? [];
  return tokens.filter((token) => !/^\s|^\/\/|^\/\*/.test(token));
}

function declaration(text, name, file = "") {
  assert(/^[\w$]+$/.test(name), "Invalid public declaration selector");
  const python = file.endsWith(".py");
  const pattern = python
    ? `^(?:(?:async )?(?:def|class) ${name}\\b|${name}(?:\\s*:[^=\\n]+)?\\s*=)`
    : `^(?:export (?:default )?)?(?:abstract )?(?:async )?(?:const|let|function\\*?|class|interface|type) ${name}\\b`;
  const start = new RegExp(pattern, "m").exec(text);
  assert(start, `Missing public declaration: ${name}`);
  const tail = text.slice(start.index + start[0].length);
  const next = (python ? /\n(?:(?:async )?(?:def|class) |[A-Za-z_]\w*(?:\s*:[^=\n]+)?\s*=|@)/ : /\n(?:export |(?:async )?function\*? |const |let |(?:abstract )?class |interface |type )/).exec(tail);
  const selected = start[0] + tail.slice(0, next?.index ?? tail.length);
  return python ? selected.split("\n").filter((line) => line.trim() && !/^\s*#/.test(line)).map((line) => line.trimEnd()) : codeTokens(selected);
}

function selectOpenApi(spec, operationIds, catalogueOnly = false) {
  const operations = {};
  const methods = ["get", "post", "put", "patch", "delete", "head", "options", "trace"];
  for (const id of operationIds) {
    const matches = Object.entries(spec.paths).flatMap(([path, item]) => methods.filter((method) => item[method]?.operationId === id).map((method) => ({ path, method, ...Object.fromEntries(Object.entries(item).filter(([key]) => !methods.includes(key))), operation: item[method] })));
    assert(matches.length === 1, `Missing or ambiguous API ${catalogueOnly ? "capability" : "operation"}: ${id}`);
    operations[id] = matches[0];
  }
  if (catalogueOnly) return Object.keys(operations).sort();
  const selected = { operations, servers: spec.servers ?? [], security: spec.security ?? [] };
  const references = {};
  const scan = (value) => {
    if (!value || typeof value !== "object") return;
    if (typeof value.$ref === "string") {
      const ref = value.$ref;
      assert(ref.startsWith("#/"), `Unresolved external API reference: ${ref}`);
      if (!Object.hasOwn(references, ref)) {
        const definition = ref.slice(2).split("/").reduce((node, key) => node?.[key.replaceAll("~1", "/").replaceAll("~0", "~")], spec);
        assert(definition !== undefined, `Missing API reference: ${ref}`);
        references[ref] = definition;
        scan(definition);
      }
    }
    if (Array.isArray(value.security)) for (const requirement of value.security) for (const name of Object.keys(requirement)) {
      const ref = `#/components/securitySchemes/${name}`;
      scan({ $ref: ref });
    }
    for (const child of Object.values(value)) scan(child);
  };
  scan(selected);
  return { ...selected, references };
}

function selectedContracts(mapping, contracts) {
  assert(mapping && !Array.isArray(mapping) && Object.keys(mapping).length > 0, "Missing dependency selectors");
  const selected = {};
  for (const surface of ["app", "sending"]) if (mapping[surface]?.length) selected[surface] = selectOpenApi(contracts[surface], mapping[surface]);
  for (const surface of ["app", "sending"]) {
    if (mapping[`${surface}Catalog`]?.length) selected[`${surface}Catalog`] = selectOpenApi(contracts[surface], mapping[`${surface}Catalog`], true);
    const key = `${surface}Policy`;
    if (mapping[key]?.length) {
      assert(contracts[key], `Missing ${surface} policy artifact`);
      selected[key] = Object.fromEntries(mapping[key].map((name) => {
        assert(contracts[key][name], `Missing ${surface} policy group: ${name}`);
        return [name, contracts[key][name]];
      }));
    }
  }
  if (mapping.mcp?.length) {
    const tools = Object.values(contracts.mcp.tools.by_surface).flat();
    selected.mcp = mapping.mcp.map((name) => {
      const tool = tools.find((tool) => tool.name === name);
      assert(tool, `Missing MCP tool: ${name}`); return tool;
    });
  }
  if (mapping.mcpSetup) {
    const { tools, package: identity, ...transport } = contracts.mcp;
    selected.mcpSetup = { ...transport, package: identity?.identity };
  }
  if (mapping.mcpCatalog) selected.mcpCatalog = Object.fromEntries(Object.entries(contracts.mcp.tools.by_surface).map(([surface, tools]) => [surface, tools.map((tool) => tool.name).sort()]));
  if (mapping.cliCatalog) selected.cliCatalog = {
    generated: Object.values(contracts.cli.operations).map((operation) => operation.command).sort(),
    commands: contracts.source.files(`${cliRoot}/commands`).filter((file) => file.endsWith(".ts")).map((file) => file.slice(`${cliRoot}/commands/`.length, -3).replaceAll("/", ":")).sort(),
  };
  if (mapping.cli?.length) {
    selected.cli = Object.fromEntries(mapping.cli.map((name) => {
      const operation = Object.values(contracts.cli.operations).find((operation) => operation.command === name);
      if (operation) return [name, operation];
      assert(/^[a-z][a-z0-9-]*(?::[a-z][a-z0-9-]*)+$/.test(name), `Invalid CLI command: ${name}`);
      const text = contracts.source.read(`${cliRoot}/commands/${name.replaceAll(":", "/")}.ts`);
      const fields = text.match(/static (?:args|flags|description)\s*=\s*[\s\S]*?(?=\n\n|\n  async run)/g);
      assert(fields?.length, `Missing CLI command metadata: ${name}`);
      return [name, fields.map(codeTokens)];
    }));
    selected.cliGlobals = declaration(contracts.source.read(`${cliRoot}/base-command.ts`), "authFlags");
  }
  if (mapping.public) selected.public = Object.fromEntries(Object.entries(mapping.public).map(([file, names]) => [file, Object.fromEntries(names.map((name) => [name, declaration(contracts.source.read(safePath(file)), name, file)]))]));
  if (mapping.packageJson) selected.packageJson = Object.fromEntries(Object.entries(mapping.packageJson).map(([file, pointers]) => {
    const manifest = JSON.parse(contracts.source.read(safePath(file)));
    return [file, Object.fromEntries(pointers.map((pointer) => {
      assert(pointer.startsWith("/"), `Invalid package field: ${pointer}`);
      const value = pointer.slice(1).split("/").reduce((node, key) => node?.[key.replaceAll("~1", "/").replaceAll("~0", "~")], manifest);
      assert(value !== undefined, `Missing package field: ${file} ${pointer}`);
      return [pointer, value];
    }))];
  }));
  if (mapping.pythonScripts) selected.pythonScripts = Object.fromEntries(Object.entries(mapping.pythonScripts).map(([file, names]) => {
    const section = contracts.source.read(safePath(file)).split(/^\[project\.scripts\][ \t]*$/m)[1]?.split(/^\[/m)[0];
    assert(section, `Missing Python console scripts: ${file}`);
    return [file, Object.fromEntries(names.map((name) => {
      assert(/^[A-Za-z0-9_-]+$/.test(name), "Invalid Python console script selector");
      const entry = new RegExp(`^${name}\\s*=\\s*(["'])([^\\n]*?)\\1\\s*(?:#.*)?$`, "m").exec(section);
      assert(entry?.[2], `Missing Python console script: ${name}`);
      return [name, entry[2]];
    }))];
  }));
  assert(Object.keys(selected).length > 0, "Missing dependency selectors");
  return selected;
}

function skillSnapshot(repository, revision, dependencies, contracts) {
  const source = committed(repository, revision);
  const files = source.files("skills");
  const names = files.filter((file) => /^skills\/[^/]+\/SKILL\.md$/.test(file)).map((file) => file.split("/")[1]).sort();
  assert(names.length > 0, "Missing skills source");
  const entries = names.map((name) => {
    const mapping = dependencies[name];
    assert(mapping && Object.keys(mapping).length > 0, `Missing dependency mapping: ${name}`);
    const content = Object.fromEntries(files.filter((file) => file.startsWith(`skills/${name}/`)).map((file) => [file, hash(source.read(file))]));
    return { name, skillDigest: objectHash(content), contractDigest: objectHash(selectedContracts(mapping, contracts)) };
  });
  return { revision, treeDigest: objectHash(entries.map(({ name, skillDigest }) => ({ name, skillDigest }))), entries };
}

export function inspectCandidate(file, inspectionMap) {
  const descriptor = readJson(file, "candidate descriptor");
  assert(descriptor.schemaVersion === 1, "Unsupported candidate schema");
  const base = dirname(resolve(file));
  const app = producerContract("app", descriptor.sources?.app, base);
  const sending = producerContract("sending", descriptor.sources?.sending, base);
  const sdk = sdkContracts(descriptor.sources?.sdk, base);
  assert(descriptor.skills?.root, "Missing skills source");
  const repository = resolve(base, descriptor.skills.root);
  const source = committed(repository, descriptor.skills.proposedRevision);
  const policyBytes = inspectionMap ? readFileSync(inspectionMap) : source.read(policyPath);
  const policy = JSON.parse(policyBytes);
  assert(policy.schemaVersion === 1 && Array.isArray(policy.reviews), "Missing compatibility review map");
  for (const name of requiredSkills) assert(policy.dependencies?.[name] && Object.keys(policy.dependencies[name]).length, `Missing dependency mapping: ${name}`);
  const contracts = { app: app.contract, sending: sending.contract, appPolicy: app.policy, sendingPolicy: sending.policy, ...sdk.contracts };
  const published = skillSnapshot(repository, descriptor.skills.publishedRevision, policy.dependencies, contracts);
  const proposed = skillSnapshot(repository, descriptor.skills.proposedRevision, policy.dependencies, contracts);
  for (const name of requiredSkills) assert(proposed.entries.some((entry) => entry.name === name), `Missing proposed skill: ${name}`);
  const sourceRevisions = { app: app.identity.revision, sending: sending.identity.revision, sdk: sha(descriptor.sources.sdk.revision) };
  const inputs = { sourceRevisions, sources: { app: app.identity, sending: sending.identity, sdk: sdk.identity }, skills: { published, proposed }, policyDigest: hash(policyBytes), checkerDigest: hash(readFileSync(self)) };
  return { ...inputs, candidateDigest: objectHash(inputs), policy, source };
}

function verifyEvidence(record, source, skillSource) {
  assert(Array.isArray(record.evidence) && record.evidence.length > 0, "Missing review evidence");
  for (const item of record.evidence) {
    const reader = item.path.startsWith(`skills/${record.skill}/`) ? skillSource : source;
    assert(hex(item.sha256) && hash(reader.read(safePath(item.path))) === item.sha256, `Stale review evidence: ${item.path}`);
  }
  if (record.kind === "compatibility") {
    assert(typeof record.reviewer === "string" && record.reviewer.trim() && typeof record.rationale === "string" && record.rationale.trim().length >= 20, "Missing explicit compatibility review");
    return;
  }
  assert(record.kind === "workflow" && hex(record.previousSkillDigest) && record.previousSkillDigest !== record.skillDigest, "Workflow review requires updated instructions");
  const evidence = new Set(record.evidence.map((item) => item.path));
  const readArtifact = (file) => {
    assert(evidence.has(file), `Missing workflow evaluation artifact: ${file}`);
    return source.read(file);
  };
  const artifacts = record.evidence.filter((item) => /\/with_skill\/run-\d+\/grading\.json$/.test(item.path));
  assert(artifacts.length > 0, "Missing workflow evaluation artifacts");
  for (const item of artifacts) {
    const [, casePath, runNumber] = item.path.match(/^(.*)\/with_skill\/run-(\d+)\/grading\.json$/);
    const runPath = `${casePath}/with_skill/run-${runNumber}`;
    const metadata = JSON.parse(readArtifact(`${casePath}/eval_metadata.json`));
    const execution = JSON.parse(readArtifact(`${runPath}/receipt.json`));
    assert(typeof metadata.prompt === "string" && execution.arm === "with_skill" && execution.skill_sha256 === hash(skillSource.read(`skills/${record.skill}/SKILL.md`)) && execution.prompt_sha256 === hash(metadata.prompt), "Workflow receipt does not bind the evaluated skill or prompt");
    assert(readArtifact(`${runPath}/outputs/response.md`).trim(), "Missing evaluated workflow output");
    const grading = JSON.parse(readArtifact(item.path));
    assert(Array.isArray(grading.expectations) && grading.expectations.length > 0 && grading.expectations.every((expectation) => expectation.passed === true && typeof expectation.evidence === "string" && expectation.evidence.trim()), `Workflow evaluation failed: ${item.path}`);
    assert(Array.isArray(metadata.assertions) && stable([...metadata.assertions].sort()) === stable(grading.expectations.map((expectation) => expectation.text).sort()), `Workflow assertions do not match grading: ${item.path}`);
    const summary = { passed: grading.expectations.length, failed: 0, total: grading.expectations.length, pass_rate: 1 };
    assert(stable(grading.summary) === stable(summary), `Invalid workflow grading summary: ${item.path}`);
    const benchmark = JSON.parse(readArtifact(`${dirname(casePath)}/benchmark.json`));
    const runs = benchmark.runs?.filter((run) => run.configuration === "with_skill" && run.eval_id === metadata.eval_id && run.run_number === Number(runNumber));
    assert(benchmark.metadata?.skill_name === record.skill && runs?.length === 1 && Object.entries(summary).every(([key, value]) => runs[0].result?.[key] === value) && stable(runs[0].expectations) === stable(grading.expectations), `Workflow benchmark does not match grading: ${item.path}`);
  }
}

function findReview(entry, candidate) {
  return candidate.policy.reviews.find((item) => item.skill === entry.name && item.skillDigest === entry.skillDigest && item.contractDigest === entry.contractDigest);
}

function acceptSkill(entry, lane, candidate) {
  const review = findReview(entry, candidate);
  if (!review && lane === "published") {
    const replacement = candidate.skills.proposed.entries.find((item) => item.name === entry.name && item.skillDigest !== entry.skillDigest);
    assert(replacement, `${lane}/${entry.name} requires a compatibility review or workflow evidence for ${entry.contractDigest}`);
    const accepted = acceptSkill(replacement, "proposed", candidate);
    const replacementReview = findReview(replacement, candidate);
    const record = JSON.parse(candidate.source.read(replacementReview.record));
    assert(record.kind === "workflow" && record.previousSkillDigest === entry.skillDigest, `${lane}/${entry.name} can only be superseded by its tested replacement`);
    return { lane, name: entry.name, status: "superseded", skillDigest: entry.skillDigest, replacementDigest: replacement.skillDigest, reviewDigest: accepted.reviewDigest };
  }
  assert(review, `${lane}/${entry.name} requires a compatibility review or workflow evidence for ${entry.contractDigest}`);
  const bytes = candidate.source.read(safePath(review.record));
  assert(hash(bytes) === review.sha256, `Stale review record: ${review.record}`);
  const record = JSON.parse(bytes);
  assert(record.schemaVersion === 1 && record.skill === entry.name && record.skillDigest === entry.skillDigest && record.contractDigest === entry.contractDigest, `Invalid review binding: ${review.record}`);
  assert(["app", "sending", "sdk"].every((name) => /^[0-9a-f]{40}$/.test(record.sourceRevisions?.[name] ?? "")), `Missing reviewed source revisions: ${review.record}`);
  verifyEvidence(record, candidate.source, candidate.source.at(candidate.skills[lane].revision));
  return { lane, name: entry.name, status: stable(record.sourceRevisions) === stable(candidate.sourceRevisions) ? "reviewed" : "no-impact", reviewDigest: review.sha256 };
}

export function acceptCandidate(file) {
  const candidate = inspectCandidate(file);
  const results = Object.entries(candidate.skills).flatMap(([lane, snapshot]) => snapshot.entries.map((entry) => acceptSkill(entry, lane, candidate)));
  const { policy, source, ...identity } = candidate;
  return { schemaVersion: 1, accepted: true, ...identity, results, checkedAt: new Date().toISOString() };
}

function expectedRevision(receipt, source, revision) {
  if (!source && !revision) return;
  assert(["app", "sending", "sdk", "skills"].includes(source), "Unknown release source");
  const actual = source === "skills" ? receipt.skills?.proposed?.revision : receipt.sourceRevisions?.[source];
  assert(actual === sha(revision), `${source} revision mismatch in skill acceptance`);
}

export function verifyReceipt(file, candidateFile, source, revision) {
  const receipt = readJson(file, "skill acceptance receipt");
  const current = acceptCandidate(candidateFile);
  assert(receipt.schemaVersion === 1 && receipt.accepted === true && receipt.candidateDigest === current.candidateDigest
    && stable(receipt.results) === stable(current.results), "Stale skill acceptance receipt");
  expectedRevision(current, source, revision);
  return current;
}

export function verifySkillsReceipt(file, root, revision) {
  const receipt = readJson(file, "published skill acceptance receipt");
  const source = committed(root, revision);
  assert(receipt.schemaVersion === 1 && receipt.accepted === true && receipt.skills?.proposed?.revision === sha(revision), "Skills revision mismatch in acceptance receipt");
  assert(receipt.policyDigest === hash(source.read(policyPath)) && receipt.checkerDigest === hash(source.read("scripts/skill-compatibility.mjs")), "Stale published skill acceptance receipt");
  const policy = JSON.parse(source.read(policyPath));
  const identity = { sourceRevisions: receipt.sourceRevisions, sources: receipt.sources, skills: receipt.skills, policyDigest: receipt.policyDigest, checkerDigest: receipt.checkerDigest };
  assert(receipt.candidateDigest === objectHash(identity), "Invalid published candidate digest");
  const candidate = { ...identity, policy, source };
  const files = source.files("skills");
  const entries = receipt.skills.proposed.entries;
  assert(Array.isArray(entries) && entries.length === requiredSkills.length, "Incomplete published skill receipt");
  for (const name of requiredSkills) {
    const item = entries.find((entry) => entry.name === name);
    const content = Object.fromEntries(files.filter((path) => path.startsWith(`skills/${name}/`)).map((path) => [path, hash(source.read(path))]));
    assert(item?.skillDigest === objectHash(content), `Published skill bytes changed: ${name}`);
    const expected = acceptSkill(item, "proposed", candidate);
    const actual = receipt.results?.filter((result) => result.lane === "proposed" && result.name === name);
    assert(actual?.length === 1 && stable(actual[0]) === stable(expected), `Invalid published review binding: ${name}`);
  }
  assert(receipt.skills.proposed.treeDigest === objectHash(entries.map(({ name, skillDigest }) => ({ name, skillDigest }))), "Invalid published skill tree digest");
  return { accepted: true, revision, treeDigest: receipt.skills.proposed.treeDigest };
}

export function prepareCandidate(file, root, revision, sdkRoot, sdkRevision) {
  const repository = resolve(root);
  const source = committed(repository, revision);
  const policy = JSON.parse(source.read(policyPath));
  const inputs = policy.releaseInputs;
  assert(inputs?.app && inputs?.sending && inputs?.publishedRevision, "Missing verified release inputs in compatibility map");
  const sources = {};
  for (const producer of ["app", "sending"]) {
    const input = inputs[producer];
    sources[producer] = { revision: sha(input.revision) };
    for (const field of ["openapi", "exportReceipt", "policy"]) {
      if (field === "policy" && !input[field]) continue;
      const relative = safePath(input[field]);
      const target = resolve(repository, relative);
      assert(hash(readFileSync(target)) === hash(source.read(relative)), `Release input differs from committed candidate: ${relative}`);
      sources[producer][field] = target;
    }
  }
  sources.sdk = { root: resolve(sdkRoot), revision: sha(sdkRevision ?? inputs.sdkRevision) };
  const descriptor = { schemaVersion: 1, sources, skills: { root: repository, publishedRevision: sha(inputs.publishedRevision), proposedRevision: sha(revision) } };
  writeFileSync(file, `${JSON.stringify(descriptor, null, 2)}\n`);
  return descriptor;
}

export function main(args = process.argv.slice(2)) {
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    assert(args[index]?.startsWith("--") && args[index + 1] && !Object.hasOwn(options, args[index]), "Expected unique --option value pairs");
    options[args[index]] = args[index + 1];
  }
  assert(!options["--inspection-map"] || (options["--inspect-candidate"] && Object.keys(options).every((name) => ["--inspect-candidate", "--inspection-map"].includes(name))), "--inspection-map is read-only and requires --inspect-candidate alone");
  let result;
  if (options["--prepare-candidate"]) result = prepareCandidate(options["--prepare-candidate"], options["--skills-root"], options["--revision"], options["--sdk-root"], options["--sdk-revision"]);
  else if (options["--verify-skills-receipt"]) result = verifySkillsReceipt(options["--verify-skills-receipt"], options["--skills-root"], options["--revision"]);
  else if (options["--verify-receipt"]) result = verifyReceipt(options["--verify-receipt"], options["--candidate"], options["--source"], options["--revision"]);
  else if (options["--inspect-candidate"]) {
    const { policy, source, ...identity } = inspectCandidate(options["--inspect-candidate"], options["--inspection-map"]);
    result = identity;
  } else {
    assert(options["--candidate"] && options["--receipt"], "Expected --candidate descriptor.json --receipt acceptance.json");
    result = acceptCandidate(options["--candidate"]);
    expectedRevision(result, options["--source"], options["--revision"]);
    writeFileSync(options["--receipt"], `${JSON.stringify(result, null, 2)}\n`);
  }
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(self)) {
  try { main(); } catch (error) { console.error(`Skill compatibility failed: ${error.message}`); process.exitCode = 1; }
}
