import assert from "node:assert/strict";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkerPath = path.join(repoRoot, "scripts/check-skill-drift.mjs");
const sdkRoot =
  process.env.SENDMUX_SDK ||
  "/Users/rj/Desktop/GIT-REPOS/sendmux-sdk";
const appOpenApi =
  process.env.SENDMUX_APP_OPENAPI ||
  path.join(
    sdkRoot,
    "packages/python/mcp/sendmux_mcp/openapi/openapi-app.json",
  );
const sendingOpenApi =
  process.env.SENDMUX_SENDING_OPENAPI ||
  path.join(
    sdkRoot,
    "packages/python/mcp/sendmux_mcp/openapi/openapi-sending.json",
  );
const publicSkillEntries = [
  "SKILL.md",
  "evals",
  "references",
  "scripts",
  "assets",
];
const minimalSdkFiles = [
  "packages/ts/sdk/package.json",
  "packages/ts/sending/package.json",
  "packages/ts/mailbox/package.json",
  "packages/ts/management/package.json",
  "packages/ts/cli/package.json",
  "packages/ts/cli/src/commands/agent/register.ts",
  "packages/ts/cli/src/commands/agent/invite-owner.ts",
  "packages/ts/cli/src/generated/operations.ts",
  "packages/ts/cli/src/base-command.ts",
  "packages/ts/cli/src/profiles.ts",
  "packages/ts/cli/README.md",
  "packages/php/sdk/composer.json",
  "packages/php/sending/composer.json",
  "packages/php/mailbox/composer.json",
  "packages/php/management/composer.json",
  "packages/python/sdk/pyproject.toml",
  "packages/python/sending/pyproject.toml",
  "packages/python/mailbox/pyproject.toml",
  "packages/python/management/pyproject.toml",
  "packages/python/mcp/pyproject.toml",
  "packages/python/mcp/sendmux_mcp/curation.py",
  "packages/python/mcp/sendmux_mcp/config.py",
  "packages/python/mcp/sendmux_mcp/hosted.py",
  "packages/python/mcp/sendmux_mcp/mcp-contract.json",
  "packages/python/mcp/README.md",
  "packages/ruby/sdk/sendmux-sdk.gemspec",
  "packages/ruby/sending/sendmux-sending.gemspec",
  "packages/ruby/mailbox/sendmux-mailbox.gemspec",
  "packages/ruby/management/sendmux-management.gemspec",
  "go/go.mod",
];

function makeSkillsFixture(t) {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), "sendmux-skill-drift-"));
  t.diagnostic(`fixture created: ${fixtureRoot}`);
  t.after(() => {
    rmSync(fixtureRoot, { recursive: true, force: true });
    assert.equal(existsSync(fixtureRoot), false);
    t.diagnostic(`fixture removed: ${fixtureRoot}`);
  });

  for (const relativePath of ["README.md", "skills.sh.json"]) {
    cpSync(path.join(repoRoot, relativePath), path.join(fixtureRoot, relativePath));
  }

  const fixtureSkillsRoot = path.join(fixtureRoot, "skills");
  mkdirSync(fixtureSkillsRoot);
  for (const skillName of readdirSync(path.join(repoRoot, "skills"))) {
    const sourceSkillRoot = path.join(repoRoot, "skills", skillName);
    const fixtureSkillRoot = path.join(fixtureSkillsRoot, skillName);
    mkdirSync(fixtureSkillRoot);
    for (const entry of publicSkillEntries) {
      const sourcePath = path.join(sourceSkillRoot, entry);
      if (existsSync(sourcePath)) {
        cpSync(sourcePath, path.join(fixtureSkillRoot, entry), { recursive: true });
      }
    }
  }

  return fixtureRoot;
}

function runChecker(skillsRoot, overrides = {}) {
  return spawnSync(process.execPath, [checkerPath], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      SENDMUX_SKILLS_ROOT: skillsRoot,
      SENDMUX_SDK: overrides.sdkRoot || sdkRoot,
      SENDMUX_APP_OPENAPI: overrides.appOpenApi || appOpenApi,
      SENDMUX_SENDING_OPENAPI: overrides.sendingOpenApi || sendingOpenApi,
    },
  });
}

function makeContractFixture(t) {
  const skillsRoot = makeSkillsFixture(t);
  const fixtureSdkRoot = path.join(skillsRoot, "sdk");
  for (const relativePath of minimalSdkFiles) {
    const targetPath = path.join(fixtureSdkRoot, relativePath);
    mkdirSync(path.dirname(targetPath), { recursive: true });
    cpSync(path.join(sdkRoot, relativePath), targetPath);
  }

  const fixtureOpenApiRoot = path.join(skillsRoot, "openapi");
  mkdirSync(fixtureOpenApiRoot);
  const fixtureAppOpenApi = path.join(fixtureOpenApiRoot, "openapi-app.json");
  const fixtureSendingOpenApi = path.join(
    fixtureOpenApiRoot,
    "openapi-sending.json",
  );
  cpSync(appOpenApi, fixtureAppOpenApi);
  cpSync(sendingOpenApi, fixtureSendingOpenApi);

  return {
    skillsRoot,
    sdkRoot: fixtureSdkRoot,
    appOpenApi: fixtureAppOpenApi,
    sendingOpenApi: fixtureSendingOpenApi,
  };
}

function runFixtureChecker(fixture) {
  return runChecker(fixture.skillsRoot, fixture);
}

function mutateJson(filePath, mutate) {
  const value = JSON.parse(readFileSync(filePath, "utf8"));
  mutate(value);
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function contractPath(fixture) {
  return path.join(
    fixture.sdkRoot,
    "packages/python/mcp/sendmux_mcp/mcp-contract.json",
  );
}

function replaceFixtureText(filePath, currentText, replacement) {
  const text = readFileSync(filePath, "utf8");
  const updated = text.replaceAll(currentText, replacement);
  assert.notEqual(updated, text, `${currentText} must exist in ${filePath}`);
  writeFileSync(filePath, updated);
}

function replaceDirectUploadCode(skillsRoot, replacement) {
  const skillPath = path.join(
    skillsRoot,
    "skills/sendmux-attachments/SKILL.md",
  );
  const skillText = readFileSync(skillPath, "utf8");
  const updated = skillText.replace(
    /(Sending API direct upload with an API key:\n\n```bash\n)[\s\S]*?(\n```)/,
    `$1${replacement}$2`,
  );
  assert.notEqual(updated, skillText, "direct upload fixture section must exist");
  writeFileSync(skillPath, updated);
}

function mutateDirectUploadCode(skillsRoot, mutate) {
  const skillPath = path.join(
    skillsRoot,
    "skills/sendmux-attachments/SKILL.md",
  );
  const skillText = readFileSync(skillPath, "utf8");
  const sectionPattern =
    /(Sending API direct upload with an API key:\n\n```bash\n)([\s\S]*?)(\n```)/;
  const section = skillText.match(sectionPattern);
  assert.ok(section, "direct upload fixture section must exist");
  const mutatedCode = mutate(section[2]);
  assert.notEqual(mutatedCode, section[2], "direct upload fixture must change");
  writeFileSync(
    skillPath,
    skillText.replace(sectionPattern, `$1${mutatedCode}$3`),
  );
}

function appendToGettingStarted(skillsRoot, text) {
  const skillPath = path.join(
    skillsRoot,
    "skills/sendmux-getting-started/SKILL.md",
  );
  const skillText = readFileSync(skillPath, "utf8");
  writeFileSync(skillPath, `${skillText}\n${text}\n`);
}

function replaceInGettingStarted(skillsRoot, currentText, replacement) {
  const skillPath = path.join(
    skillsRoot,
    "skills/sendmux-getting-started/SKILL.md",
  );
  const skillText = readFileSync(skillPath, "utf8");
  const updated = skillText.replace(currentText, replacement);
  assert.notEqual(updated, skillText, "getting-started fixture must change");
  writeFileSync(skillPath, updated);
}

const argvDirectUpload = [
  'curl -X POST "https://smtp.sendmux.ai/api/v1/emails/attachments?filename=report.pdf" \\',
  '  -H "Authorization: Bearer $SENDMUX_MBX_KEY" \\',
  '  -H "Content-Type: application/pdf" \\',
  '  -H "Content-Length: $SIZE_BYTES" \\',
  "  --data-binary @./report.pdf",
].join("\n");

test("distinguishes negative proof-of-work guidance from obsolete instructions", (t) => {
  const fixtureRoot = makeSkillsFixture(t);
  replaceDirectUploadCode(fixtureRoot, argvDirectUpload);

  const result = runChecker(fixtureRoot);
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stderr, /obsolete proof of work guidance/);

  const obsoleteFixtureRoot = makeSkillsFixture(t);
  replaceDirectUploadCode(obsoleteFixtureRoot, argvDirectUpload);
  appendToGettingStarted(
    obsoleteFixtureRoot,
    "No proof of work step is required.",
  );

  const negativeOnlyResult = runChecker(obsoleteFixtureRoot);
  assert.equal(negativeOnlyResult.status, 0, negativeOnlyResult.stderr);
  assert.doesNotMatch(
    negativeOnlyResult.stderr,
    /obsolete proof of work guidance/,
  );

  appendToGettingStarted(
    obsoleteFixtureRoot,
    "Solve the proof of work before registering.",
  );
  const obsoleteResult = runChecker(obsoleteFixtureRoot);
  assert.equal(obsoleteResult.status, 1);
  assert.match(obsoleteResult.stderr, /obsolete proof of work guidance/);

  const contrastFixtureRoot = makeSkillsFixture(t);
  replaceDirectUploadCode(contrastFixtureRoot, argvDirectUpload);
  replaceInGettingStarted(
    contrastFixtureRoot,
    "No existing account, API key, challenge or proof of work step is required.",
    "No API key is required, but proof of work is required before registering.",
  );

  const contrastResult = runChecker(contrastFixtureRoot);
  assert.equal(contrastResult.status, 1);
  assert.match(contrastResult.stderr, /obsolete proof of work guidance/);

  const wrongSubjectFixtureRoot = makeSkillsFixture(t);
  replaceDirectUploadCode(wrongSubjectFixtureRoot, argvDirectUpload);
  replaceInGettingStarted(
    wrongSubjectFixtureRoot,
    "No existing account, API key, challenge or proof of work step is required.",
    "No API key is required, and proof of work is required before registering.",
  );

  const wrongSubjectResult = runChecker(wrongSubjectFixtureRoot);
  assert.equal(wrongSubjectResult.status, 1);
  assert.match(wrongSubjectResult.stderr, /obsolete proof of work guidance/);
});

test("accepts a direct attachment upload using fenced stdin curl config", (t) => {
  const fixtureRoot = makeSkillsFixture(t);

  const result = runChecker(fixtureRoot);
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(
    result.stderr,
    /missing Direct HTTP Sending direct upload curl example/,
  );
});

test("requires complete command-local direct attachment upload evidence", (t) => {
  const missingExample =
    /missing Direct HTTP Sending direct upload curl example/;
  const missingContentLength =
    /Direct HTTP Sending upload example must include Content-Length/;
  const mutations = [
    {
      name: "only Content-Length is missing",
      expected: missingContentLength,
      rejected: missingExample,
      apply: (fixtureRoot) =>
        mutateDirectUploadCode(fixtureRoot, (code) =>
          code.replace('header = "Content-Length: $SIZE_BYTES"\n', ""),
        ),
    },
    {
      name: "Content-Length appears only in prose and another curl example",
      expected: missingContentLength,
      rejected: missingExample,
      apply: (fixtureRoot) => {
        mutateDirectUploadCode(fixtureRoot, (code) =>
          code.replace('header = "Content-Length: $SIZE_BYTES"\n', ""),
        );
        const skillPath = path.join(
          fixtureRoot,
          "skills/sendmux-attachments/SKILL.md",
        );
        const skillText = readFileSync(skillPath, "utf8");
        writeFileSync(
          skillPath,
          `${skillText}\nA different example uses a Content-Length header.\n\n` +
            "```bash\n" +
            'curl -X POST "https://example.invalid/upload" \\\n' +
            '  -H "Content-Length: $SIZE_BYTES" \\\n' +
            "  --data-binary @./report.pdf\n" +
            "```\n",
        );
      },
    },
    {
      name: "Content-Length appears only inside another named header",
      expected: missingContentLength,
      rejected: missingExample,
      apply: (fixtureRoot) =>
        mutateDirectUploadCode(fixtureRoot, (code) =>
          code.replace(
            'header = "Content-Length: $SIZE_BYTES"',
            'header = "X-Upload-Note: Content-Length: $SIZE_BYTES"',
          ),
        ),
    },
    {
      name: "the endpoint appears only inside a header",
      expected: missingExample,
      rejected: missingContentLength,
      apply: (fixtureRoot) =>
        mutateDirectUploadCode(fixtureRoot, (code) =>
          code.replace(
            'url = "https://smtp.sendmux.ai/api/v1/emails/attachments?filename=report.pdf&content_type=application/pdf"',
            'header = "X-Upload-URL: https://smtp.sendmux.ai/api/v1/emails/attachments?filename=report.pdf"',
          ),
        ),
    },
    {
      name: "POST is missing",
      expected: missingExample,
      rejected: missingContentLength,
      apply: (fixtureRoot) =>
        mutateDirectUploadCode(fixtureRoot, (code) =>
          code.replace('request = "POST"', 'request = "GET"'),
        ),
    },
    {
      name: "the direct endpoint is missing",
      expected: missingExample,
      rejected: missingContentLength,
      apply: (fixtureRoot) =>
        mutateDirectUploadCode(fixtureRoot, (code) =>
          code.replace(
            "https://smtp.sendmux.ai/api/v1/emails/attachments?",
            "https://smtp.sendmux.ai/api/v1/emails/attachment-uploads?",
          ),
        ),
    },
    {
      name: "the binary body is missing",
      expected: missingExample,
      rejected: missingContentLength,
      apply: (fixtureRoot) =>
        mutateDirectUploadCode(fixtureRoot, (code) =>
          code.replace("--data-binary @./report.pdf", "--data @./report.pdf"),
        ),
    },
    {
      name: "binary-body text appears only inside a header value",
      expected: missingExample,
      rejected: missingContentLength,
      apply: (fixtureRoot) =>
        mutateDirectUploadCode(fixtureRoot, (code) =>
          code.replace(
            "--data-binary @./report.pdf <<CURL_CONFIG",
            '--header "X-Upload-Note: --data-binary @./report.pdf" <<CURL_CONFIG',
          ),
        ),
    },
  ];

  for (const mutation of mutations) {
    const fixtureRoot = makeSkillsFixture(t);
    mutation.apply(fixtureRoot);

    const result = runChecker(fixtureRoot);
    assert.equal(result.status, 1, mutation.name);
    assert.match(result.stderr, mutation.expected, mutation.name);
    assert.doesNotMatch(result.stderr, mutation.rejected, mutation.name);
  }
});

test("requires usable MCP contract fields without trusting compatibility aliases or declared totals", (t) => {
  const contractMutations = [
    {
      name: "protocols cannot fall back to runtime_protocols",
      diagnostic: /MCP contract protocols is missing or unusable/,
      mutate: (contract) => {
        delete contract.protocols;
      },
    },
    {
      name: "protocols must be an array",
      diagnostic: /MCP contract protocols is missing or unusable/,
      mutate: (contract) => {
        contract.protocols = { revision: "future" };
      },
    },
    {
      name: "hosted transports must be an array",
      diagnostic: /MCP contract hosted\.transports is missing or unusable/,
      mutate: (contract) => {
        contract.hosted.transports = { name: "streamable-http" };
      },
    },
    {
      name: "required package object must be usable",
      diagnostic: /MCP contract package is missing or unusable/,
      mutate: (contract) => {
        contract.package = null;
      },
    },
    {
      name: "package version must be usable",
      diagnostic: /MCP contract package\.version is missing or unusable/,
      mutate: (contract) => {
        contract.package.version = "future";
      },
    },
    {
      name: "tool objects must be complete",
      diagnostic: /MCP contract tools\.by_surface\.mailbox\[0\] is incomplete or unusable/,
      mutate: (contract) => {
        delete contract.tools.by_surface.mailbox[0].input_schema;
      },
    },
    {
      name: "null tool entries remain diagnostic",
      diagnostic: /MCP contract tools\.by_surface\.mailbox\[0\] is incomplete or unusable/,
      mutate: (contract) => {
        contract.tools.by_surface.mailbox[0] = null;
      },
    },
    {
      name: "surface arrays must remain arrays",
      diagnostic: /MCP contract tools\.by_surface\.mailbox is missing or unusable/,
      mutate: (contract) => {
        contract.tools.by_surface.mailbox = null;
      },
    },
    {
      name: "tool surfaces must be complete",
      diagnostic: /MCP contract tools\.by_surface has unexpected surface future/,
      mutate: (contract) => {
        contract.tools.by_surface.future = [
          structuredClone(contract.tools.by_surface.sending[0]),
        ];
      },
    },
    {
      name: "upload fields must be usable",
      diagnostic: /MCP contract uploads\.mailbox\.modes is missing or unusable/,
      mutate: (contract) => {
        contract.uploads.mailbox.modes = [];
      },
    },
    {
      name: "required upload object must be usable",
      diagnostic: /MCP contract uploads\.mailbox is missing or unusable/,
      mutate: (contract) => {
        contract.uploads.mailbox = null;
      },
    },
  ];

  for (const mutation of contractMutations) {
    const fixture = makeContractFixture(t);
    const baseline = runFixtureChecker(fixture);
    assert.equal(baseline.status, 0, `${mutation.name} baseline: ${baseline.stderr}`);

    const contractPath = path.join(
      fixture.sdkRoot,
      "packages/python/mcp/sendmux_mcp/mcp-contract.json",
    );
    mutateJson(contractPath, mutation.mutate);
    const result = runFixtureChecker(fixture);
    assert.equal(result.status, 1, mutation.name);
    assert.match(result.stderr, mutation.diagnostic, mutation.name);
  }

  const declaredTotalFixture = makeContractFixture(t);
  const baseline = runFixtureChecker(declaredTotalFixture);
  assert.equal(baseline.status, 0, baseline.stderr);
  mutateJson(
    path.join(
      declaredTotalFixture.sdkRoot,
      "packages/python/mcp/sendmux_mcp/mcp-contract.json",
    ),
    (contract) => {
      contract.tools.count = 999;
    },
  );
  const declaredTotalResult = runFixtureChecker(declaredTotalFixture);
  assert.equal(declaredTotalResult.status, 0, declaredTotalResult.stderr);
});

test("rejects a stale unsuffixed Go module after accepting the v2 producer", (t) => {
  const fixture = makeContractFixture(t);
  const baseline = runFixtureChecker(fixture);
  assert.equal(baseline.status, 0, baseline.stderr);

  replaceFixtureText(
    path.join(fixture.sdkRoot, "go/go.mod"),
    "module sendmux.ai/go/v2",
    "module sendmux.ai/go",
  );
  const staleModule = runFixtureChecker(fixture);
  assert.equal(staleModule.status, 1);
  assert.match(
    staleModule.stderr,
    /Go module expected sendmux\.ai\/go\/v2, found sendmux\.ai\/go\n/,
  );
});

test("requires consistent released package guidance in the setup guide and case 7", (t) => {
  for (const location of ["guide", "expected_output", "expectations"]) {
    const fixture = makeContractFixture(t);
    const baseline = runFixtureChecker(fixture);
    assert.equal(baseline.status, 0, `${location} baseline: ${baseline.stderr}`);

    if (location === "guide") {
      replaceFixtureText(
        path.join(fixture.skillsRoot, "skills/sendmux-mcp-setup/SKILL.md"),
        "targets the released",
        "targets the unpublished",
      );
    } else {
      mutateJson(
        path.join(fixture.skillsRoot, "skills/sendmux-mcp-setup/evals/evals.json"),
        (value) => {
          const compatibility = value.evals.find((entry) => entry.id === 7);
          if (location === "expected_output") {
            compatibility.expected_output = compatibility.expected_output.replace(
              "distinguishes the released",
              "distinguishes the unpublished",
            );
          } else {
            compatibility.expectations = compatibility.expectations.map((text) =>
              text.replace(
                "distinguishes the released",
                "distinguishes the unpublished",
              ),
            );
          }
        },
      );
    }

    const contradictedRelease = runFixtureChecker(fixture);
    assert.equal(contradictedRelease.status, 1, location);
    assert.match(
      contradictedRelease.stderr,
      /MCP package identity\/version guidance drift/,
      location,
    );
  }
});

test("rejects substring matches for published contract values and sync fields", (t) => {
  const escaped = [];
  const mutations = [
    ["prerelease version", "version", (value) => `${value}-rc.1`],
    ["longer version", "version", (value) => `${value}0`],
    ["package suffix", "identity", (value) => `${value}-extra`],
    ["larger total", "total", (value) => `1${value}`],
    ["fractional total", "total", (value) => `${value}.5`],
    ["negative total", "total", (value) => `-${value}`],
    ["exponential total", "total", (value) => `${value}e2`],
    ["range total", "total", (value) => `${value}-${Number(value) + 1}`],
  ];
  for (const location of ["guide", "expected_output", "expectations"]) {
    for (const [name, field, replace] of mutations) {
      const fixture = makeContractFixture(t);
      const baseline = runFixtureChecker(fixture);
      assert.equal(baseline.status, 0, baseline.stderr);
      const contract = JSON.parse(readFileSync(contractPath(fixture), "utf8"));
      const values = {
        ...contract.package,
        total: Object.values(contract.tools.by_surface).flat().length,
      };
      const value = String(values[field]);
      const replacement = replace(value);
      const diagnostic = field === "total"
        ? /MCP tool catalogue count guidance drift/
        : /MCP package identity\/version guidance drift/;
      if (location === "guide") {
        const guidePath = path.join(
          fixture.skillsRoot,
          "skills/sendmux-mcp-setup/SKILL.md",
        );
        const original = readFileSync(guidePath, "utf8");
        const changed = original.replace(/^This guide targets .+$/m, (line) =>
          line.replaceAll(value, replacement),
        );
        assert.notEqual(changed, original);
        writeFileSync(guidePath, changed);
      } else {
        mutateJson(
          path.join(fixture.skillsRoot, "skills/sendmux-mcp-setup/evals/evals.json"),
          (document) => {
            const compatibility = document.evals.find((entry) => entry.id === 7);
            if (location === "expected_output") {
              compatibility.expected_output = compatibility.expected_output.replaceAll(
                value,
                replacement,
              );
            } else {
              compatibility.expectations = compatibility.expectations.map((text) =>
                text.replaceAll(value, replacement),
              );
            }
          },
        );
      }
      const result = runFixtureChecker(fixture);
      if (result.status === 0) escaped.push(`${location}: ${name}`);
      else {
        assert.equal(result.status, 1, result.stderr);
        assert.match(result.stderr, diagnostic, `${location}: ${name}`);
      }
    }
  }
  for (const surface of ["messages", "folders", "threads"]) {
    const fixture = makeContractFixture(t);
    const baseline = runFixtureChecker(fixture);
    assert.equal(baseline.status, 0, baseline.stderr);
    const field = `data.types.${surface}.new_state`;
    replaceFixtureText(
      path.join(fixture.skillsRoot, "skills/sendmux-token-efficient-usage/SKILL.md"),
      field,
      `${field}_extra`,
    );
    const result = runFixtureChecker(fixture);
    if (result.status === 0) escaped.push(`sync field: ${surface}`);
    else {
      assert.equal(result.status, 1, result.stderr);
      assert.match(result.stderr, /typed multi-resource sync guidance drift/);
    }
  }
  assert.deepEqual(
    escaped,
    [],
    "Different values must not pass as exact contract values",
  );
});

test("matches MCP contract fields only at their publishing locations", (t) => {
  const mutations = [
    {
      name: "package identity",
      diagnostic: /MCP package identity\/version guidance drift/,
      mutate: (contract) => {
        contract.package.identity = "future-sendmux-mcp";
      },
    },
    {
      name: "ordered protocols",
      diagnostic: /MCP protocol guidance drift/,
      mutate: (contract) => {
        contract.protocols.reverse();
      },
    },
    {
      name: "tool object and per-surface count",
      diagnostic: /MCP tool catalogue count guidance drift/,
      mutate: (contract) => {
        contract.tools.by_surface.mailbox.pop();
      },
    },
    {
      name: "hosted resource",
      diagnostic: /MCP hosted resource guidance drift/,
      mutate: (contract) => {
        contract.hosted.resource = "https://future.example/mcp";
      },
    },
    {
      name: "hosted transport",
      diagnostic: /MCP hosted transport guidance drift/,
      mutate: (contract) => {
        contract.hosted.transports = ["future-transport"];
      },
    },
    {
      name: "inline decoded maximum",
      diagnostic: /MCP inline decoded bound guidance drift/,
      mutate: (contract) => {
        contract.uploads.inline_decoded_max_bytes += 1;
      },
    },
    {
      name: "Mailbox modes",
      diagnostic: /MCP Mailbox upload modes guidance drift/,
      mutate: (contract) => {
        contract.uploads.mailbox.modes = ["content_base64"];
      },
    },
    {
      name: "Mailbox presigned maximum",
      diagnostic: /MCP Mailbox presigned maximum guidance drift/,
      mutate: (contract) => {
        contract.uploads.mailbox.presigned_max_bytes += 1;
      },
    },
    {
      name: "Mailbox request maximum",
      diagnostic: /MCP Mailbox request-schema maximum guidance drift/,
      mutate: (contract) => {
        contract.uploads.mailbox.request_schema_max_bytes += 1;
      },
    },
    {
      name: "Sending limit authority remains the upload intent response",
      diagnostic: /MCP Sending limit authority guidance drift/,
      mutate: (contract) => {
        contract.uploads.sending.limit_authority =
          "upload intent request max_size_bytes";
      },
    },
    {
      name: "Sending request maximum",
      diagnostic: /MCP Sending request-schema maximum guidance drift/,
      mutate: (contract) => {
        contract.uploads.sending.request_schema_max_bytes = 7654321;
      },
    },
  ];

  for (const mutation of mutations) {
    const fixture = makeContractFixture(t);
    const baseline = runFixtureChecker(fixture);
    assert.equal(baseline.status, 0, `${mutation.name} baseline: ${baseline.stderr}`);
    mutateJson(contractPath(fixture), mutation.mutate);
    const result = runFixtureChecker(fixture);
    assert.equal(result.status, 1, mutation.name);
    assert.match(result.stderr, mutation.diagnostic, mutation.name);
    if (mutation.name === "tool object and per-surface count") {
      assert.doesNotMatch(
        result.stderr,
        /CLI Management command count guidance drift/,
      );
    }
  }

  const futureVersionFixture = makeContractFixture(t);
  const baseline = runFixtureChecker(futureVersionFixture);
  assert.equal(baseline.status, 0, baseline.stderr);
  const contract = JSON.parse(readFileSync(contractPath(futureVersionFixture), "utf8"));
  const versionParts = contract.package.version.split(".").map(Number);
  const futureVersion = `${versionParts[0]}.${versionParts[1]}.${versionParts[2] + 1}`;
  mutateJson(contractPath(futureVersionFixture), (value) => {
    value.package.version = futureVersion;
  });
  for (const relativePath of [
    "skills/sendmux-mcp-setup/SKILL.md",
    "skills/sendmux-mcp-setup/evals/evals.json",
  ]) {
    replaceFixtureText(
      path.join(futureVersionFixture.skillsRoot, relativePath),
      contract.package.version,
      futureVersion,
    );
  }
  const movedTogether = runFixtureChecker(futureVersionFixture);
  assert.equal(movedTogether.status, 0, movedTogether.stderr);

  replaceFixtureText(
    path.join(
      futureVersionFixture.skillsRoot,
      "skills/sendmux-mcp-setup/evals/evals.json",
    ),
    futureVersion,
    contract.package.version,
  );
  const staleEval = runFixtureChecker(futureVersionFixture);
  assert.equal(staleEval.status, 1);
  assert.match(staleEval.stderr, /MCP package identity\/version guidance drift/);

  const exactProtocolFixture = makeContractFixture(t);
  const exactProtocolBaseline = runFixtureChecker(exactProtocolFixture);
  assert.equal(exactProtocolBaseline.status, 0, exactProtocolBaseline.stderr);
  const protocolContract = JSON.parse(
    readFileSync(contractPath(exactProtocolFixture), "utf8"),
  );
  const removedProtocol = protocolContract.protocols.at(-1);
  mutateJson(contractPath(exactProtocolFixture), (value) => {
    value.protocols.pop();
  });
  const staleProtocol = runFixtureChecker(exactProtocolFixture);
  assert.equal(staleProtocol.status, 1);
  assert.match(staleProtocol.stderr, /MCP protocol guidance drift/);
  for (const relativePath of [
    "skills/sendmux-mcp-setup/SKILL.md",
    "skills/sendmux-mcp-setup/evals/evals.json",
  ]) {
    const filePath = path.join(exactProtocolFixture.skillsRoot, relativePath);
    const text = readFileSync(filePath, "utf8");
    const updated = text
      .replaceAll(` and \`${removedProtocol}\``, "")
      .replaceAll(` and ${removedProtocol}`, "");
    assert.notEqual(updated, text, `${removedProtocol} must be published in ${relativePath}`);
    writeFileSync(filePath, updated);
  }
  const movedProtocol = runFixtureChecker(exactProtocolFixture);
  assert.equal(movedProtocol.status, 0, movedProtocol.stderr);

  const futureModeFixture = makeContractFixture(t);
  const futureModeBaseline = runFixtureChecker(futureModeFixture);
  assert.equal(futureModeBaseline.status, 0, futureModeBaseline.stderr);
  const oldMode = "presign_upload_url";
  const futureMode = "external_upload_url";
  mutateJson(contractPath(futureModeFixture), (contract) => {
    contract.uploads.mailbox.modes = contract.uploads.mailbox.modes.map((mode) =>
      mode === oldMode ? futureMode : mode,
    );
    const uploadTool = contract.tools.by_surface.mailbox.find(
      (tool) => tool.name === contract.uploads.mailbox.tool,
    );
    uploadTool.input_schema.properties[futureMode] =
      uploadTool.input_schema.properties[oldMode];
    delete uploadTool.input_schema.properties[oldMode];
  });
  for (const skillName of [
    "sendmux-mcp-setup",
    "sendmux-attachments",
    "sendmux-mailbox-agent",
    "sendmux-token-efficient-usage",
  ]) {
    replaceFixtureText(
      path.join(futureModeFixture.skillsRoot, `skills/${skillName}/SKILL.md`),
      oldMode,
      futureMode,
    );
  }
  const movedMode = runFixtureChecker(futureModeFixture);
  assert.equal(movedMode.status, 0, movedMode.stderr);
});

test("requires the Sending response size authority in each publishing skill", (t) => {
  const publishingSkills = [
    {
      name: "sendmux-mcp-setup",
      responseText: "its returned `max_size_bytes`",
      requestText: "its requested `max_size_bytes`",
    },
    {
      name: "sendmux-attachments",
      responseText: "upload intent's returned `max_size_bytes`",
      requestText: "upload intent's requested `max_size_bytes`",
    },
    {
      name: "sendmux-send-email",
      responseText: "upload intent's returned `max_size_bytes`",
      requestText: "upload intent's requested `max_size_bytes`",
    },
    {
      name: "sendmux-token-efficient-usage",
      responseText: "upload intent's returned `max_size_bytes`",
      requestText: "upload intent's requested `max_size_bytes`",
    },
  ];
  const mutations = [
    {
      name: "returned field",
      text: () => ["max_size_bytes", "max_attachment_bytes"],
    },
    {
      name: "response relation",
      text: (skill) => [skill.responseText, skill.requestText],
    },
  ];

  for (const skill of publishingSkills) {
    for (const mutation of mutations) {
      const fixture = makeContractFixture(t);
      const baseline = runFixtureChecker(fixture);
      assert.equal(
        baseline.status,
        0,
        `${skill.name} ${mutation.name} baseline: ${baseline.stderr}`,
      );
      const [currentText, replacement] = mutation.text(skill);
      replaceFixtureText(
        path.join(fixture.skillsRoot, `skills/${skill.name}/SKILL.md`),
        currentText,
        replacement,
      );

      const result = runFixtureChecker(fixture);
      assert.equal(result.status, 1, `${skill.name} ${mutation.name}`);
      assert.match(
        result.stderr,
        /MCP Sending limit authority guidance drift/,
        `${skill.name} ${mutation.name}`,
      );
    }
  }
});

test("keeps MCP file_path guidance aligned in both contract directions", (t) => {
  const schemaAddsFilePath = makeContractFixture(t);
  let baseline = runFixtureChecker(schemaAddsFilePath);
  assert.equal(baseline.status, 0, baseline.stderr);
  mutateJson(contractPath(schemaAddsFilePath), (contract) => {
    const uploadTool = contract.tools.by_surface.mailbox.find(
      (tool) => tool.name === "mailbox_upload_attachment",
    );
    assert.ok(uploadTool, "mailbox upload tool must exist");
    uploadTool.input_schema.properties.file_path = { type: "string" };
  });
  let result = runFixtureChecker(schemaAddsFilePath);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /MCP file_path guidance drift/);

  const guidanceRecommendsFilePath = makeContractFixture(t);
  baseline = runFixtureChecker(guidanceRecommendsFilePath);
  assert.equal(baseline.status, 0, baseline.stderr);
  const attachmentPath = path.join(
    guidanceRecommendsFilePath.skillsRoot,
    "skills/sendmux-attachments/SKILL.md",
  );
  replaceFixtureText(
    attachmentPath,
    "MCP tools do not accept `file_path` or read shared filesystem roots",
    "MCP tools accept and recommend `file_path` from shared filesystem roots",
  );
  result = runFixtureChecker(guidanceRecommendsFilePath);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /MCP file_path guidance drift/);
});

test("derives CLI surface counts separately from the generated operations manifest", (t) => {
  const fixture = makeContractFixture(t);
  const baseline = runFixtureChecker(fixture);
  assert.equal(baseline.status, 0, baseline.stderr);
  const operationsPath = path.join(
    fixture.sdkRoot,
    "packages/ts/cli/src/generated/operations.ts",
  );
  const operations = readFileSync(operationsPath, "utf8");
  const mutated = operations.replace(
    '"surface": "management"',
    '"surface": "other"',
  );
  assert.notEqual(mutated, operations, "Management operation must exist");
  writeFileSync(operationsPath, mutated);

  const result = runFixtureChecker(fixture);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /CLI Management command count guidance drift/);
  assert.doesNotMatch(result.stderr, /MCP tool catalogue count guidance drift/);
});

test("counts CLI surfaces without executing the generated operations manifest", (t) => {
  const fixture = makeContractFixture(t);
  const operationsPath = path.join(
    fixture.sdkRoot,
    "packages/ts/cli/src/generated/operations.ts",
  );
  const sentinel = "drift checker executed the generated operations manifest";
  replaceFixtureText(
    operationsPath,
    "export const operations = {",
    `export const operations = (process.stderr.write(${JSON.stringify(`${sentinel}\n`)}), {`,
  );
  replaceFixtureText(
    operationsPath,
    "} as const satisfies",
    "}) as const satisfies",
  );

  const result = runFixtureChecker(fixture);
  assert.doesNotMatch(
    result.stderr,
    new RegExp(sentinel),
    "the checker must read the manifest as text instead of executing it",
  );
  assert.equal(result.status, 0, result.stderr);
});

test("guards the documented sync, SDK envelope, throwing, and recipient semantics", (t) => {
  const skillPath = (fixture, skillName) =>
    path.join(fixture.skillsRoot, `skills/${skillName}/SKILL.md`);
  const mutations = [
    {
      name: "typed multi-resource selection",
      diagnostic: /typed multi-resource sync guidance drift/,
      apply: (fixture) =>
        replaceFixtureText(
          skillPath(fixture, "sendmux-token-efficient-usage"),
          "  --query types=messages,folders,threads \\",
          "  --query limit=3 \\",
        ),
    },
    {
      name: "typed resource continuation",
      diagnostic: /typed continuation guidance drift/,
      apply: (fixture) =>
        replaceFixtureText(
          skillPath(fixture, "sendmux-token-efficient-usage"),
          "set `NEXT_MESSAGES_STATE` from its `data.types.messages.new_state`, and repeat only while that same latest response's `data.types.messages.has_more` is true",
          "set `NEXT_MESSAGES_STATE` from its `data.new_state`, and repeat only while that same latest response's `data.has_more` is true",
        ),
    },
    {
      name: "delta continuation never uses a cursor",
      diagnostic: /typed continuation guidance drift/,
      apply: (fixture) =>
        replaceFixtureText(
          skillPath(fixture, "sendmux-token-efficient-usage"),
          "set `NEXT_MESSAGES_STATE` from its `data.types.messages.new_state`, and repeat only while that same latest response's `data.types.messages.has_more` is true",
          "set `NEXT_MESSAGES_STATE` from its `pagination.next_cursor`, and repeat only while that same latest response's `data.types.messages.has_more` is true",
        ),
    },
    {
      name: "filtered sync state",
      diagnostic: /filtered sync guidance drift/,
      apply: (fixture) =>
        replaceFixtureText(
          skillPath(fixture, "sendmux-token-efficient-usage"),
          "set `QUERY_STATE` from its `data.new_query_state`, and continue with the same filters only while that same latest response's `data.has_more` is true",
          "set `QUERY_STATE` from its `data.new_state`, and continue with the same filters only while that same latest response's `data.types.messages.has_more` is true",
        ),
    },
    {
      name: "list pagination remains distinct from delta state",
      diagnostic: /list pagination guidance drift/,
      apply: (fixture) =>
        replaceFixtureText(
          skillPath(fixture, "sendmux-token-efficient-usage"),
          "map the returned `pagination.next_cursor` to the next `cursor` input",
          "map the returned `data.next_cursor` to the next `cursor` input",
        ),
    },
    {
      name: "single-send SDK envelope",
      diagnostic: /Sending SDK response envelope guidance drift/,
      apply: (fixture) =>
        replaceFixtureText(
          skillPath(fixture, "sendmux-send-email"),
          "response.data.data.message_id, response.data.data.status",
          "response.data.info.message_id, response.data.info.status",
        ),
    },
    {
      name: "batch-send SDK envelope",
      diagnostic: /Sending SDK response envelope guidance drift/,
      apply: (fixture) =>
        replaceFixtureText(
          skillPath(fixture, "sendmux-send-email"),
          "response.data.data.results",
          "response.data.info.results",
        ),
    },
    {
      name: "single-send throwOnError",
      diagnostic: /throwOnError guidance drift/,
      apply: (fixture) => {
        const filePath = skillPath(fixture, "sendmux-send-email");
        const text = readFileSync(filePath, "utf8");
        const updated = text.replace("  throwOnError: true,", "  throwOnError: false,");
        assert.notEqual(updated, text);
        writeFileSync(filePath, updated);
      },
    },
    {
      name: "batch-send throwOnError",
      diagnostic: /throwOnError guidance drift/,
      apply: (fixture) => {
        const filePath = skillPath(fixture, "sendmux-send-email");
        const text = readFileSync(filePath, "utf8");
        const first = text.indexOf("  throwOnError: true,");
        const second = text.indexOf("  throwOnError: true,", first + 1);
        assert.notEqual(second, -1);
        writeFileSync(
          filePath,
          `${text.slice(0, second)}  throwOnError: false,${text.slice(second + "  throwOnError: true,".length)}`,
        );
      },
    },
    {
      name: "OpenAPI-spec throwOnError",
      diagnostic: /throwOnError guidance drift/,
      apply: (fixture) =>
        replaceFixtureText(
          skillPath(fixture, "sendmux-getting-started"),
          "sendingGetOpenApiSpec({ client, throwOnError: true })",
          "sendingGetOpenApiSpec({ client, throwOnError: false })",
        ),
    },
    {
      name: "per-field recipient maximum",
      diagnostic: /Sending recipient bounds guidance drift/,
      apply: (fixture) =>
        replaceFixtureText(
          skillPath(fixture, "sendmux-send-email"),
          "max 49 each and subject to 50 total",
          "max 50 each and subject to 50 total",
        ),
    },
    {
      name: "combined recipient maximum",
      diagnostic: /Sending recipient bounds guidance drift/,
      apply: (fixture) =>
        replaceFixtureText(
          skillPath(fixture, "sendmux-send-email"),
          "max 49 each and subject to 50 total",
          "max 49 each and subject to 51 total",
        ),
    },
    {
      name: "batch maximum remains distinct",
      diagnostic: /Sending recipient bounds guidance drift/,
      apply: (fixture) =>
        replaceFixtureText(
          skillPath(fixture, "sendmux-send-email"),
          "A `messages[]` body with up to 100 independently confirmed messages.",
          "A `messages[]` body with up to 101 independently confirmed messages.",
        ),
    },
  ];

  for (const mutation of mutations) {
    const fixture = makeContractFixture(t);
    const baseline = runFixtureChecker(fixture);
    assert.equal(baseline.status, 0, `${mutation.name} baseline: ${baseline.stderr}`);
    mutation.apply(fixture);
    const result = runFixtureChecker(fixture);
    assert.equal(result.status, 1, mutation.name);
    assert.match(result.stderr, mutation.diagnostic, mutation.name);
  }
});

test("validates the documented management:create-mailbox-key JSON body against OpenAPI", (t) => {
  const wrongFieldFixture = makeContractFixture(t);
  let baseline = runFixtureChecker(wrongFieldFixture);
  assert.equal(baseline.status, 0, baseline.stderr);
  const wrongFieldPath = path.join(
    wrongFieldFixture.skillsRoot,
    "skills/sendmux-management/SKILL.md",
  );
  replaceFixtureText(
    wrongFieldPath,
    '--body \'{"app_name":"agent-runtime"}\'',
    '--body \'{"name":"agent-runtime"}\'',
  );
  let result = runFixtureChecker(wrongFieldFixture);
  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /management:create-mailbox-key request body missing required field app_name/,
  );
  assert.match(
    result.stderr,
    /management:create-mailbox-key request body uses unsupported field name/,
  );

  const missingLabelFixture = makeContractFixture(t);
  baseline = runFixtureChecker(missingLabelFixture);
  assert.equal(baseline.status, 0, baseline.stderr);
  replaceFixtureText(
    path.join(
      missingLabelFixture.skillsRoot,
      "skills/sendmux-management/SKILL.md",
    ),
    '--body \'{"app_name":"agent-runtime"}\'',
    "--body '{}'",
  );
  result = runFixtureChecker(missingLabelFixture);
  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /management:create-mailbox-key request body missing required field app_name/,
  );
  assert.doesNotMatch(result.stderr, /request body uses unsupported field/);
});

test("requires authenticated SDK clients and response envelopes at dereference sites", (t) => {
  const missingClientFixture = makeContractFixture(t);
  let baseline = runFixtureChecker(missingClientFixture);
  assert.equal(baseline.status, 0, baseline.stderr);
  replaceFixtureText(
    path.join(
      missingClientFixture.skillsRoot,
      "skills/sendmux-token-efficient-usage/SKILL.md",
    ),
    "const result = await managementGetEmailLog({\n  client,\n  path:",
    "const result = await managementGetEmailLog({\n  path:",
  );
  let result = runFixtureChecker(missingClientFixture);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /conditional Management SDK client guidance drift/);

  const wrongEnvelopeFixture = makeContractFixture(t);
  baseline = runFixtureChecker(wrongEnvelopeFixture);
  assert.equal(baseline.status, 0, baseline.stderr);
  replaceFixtureText(
    path.join(
      wrongEnvelopeFixture.skillsRoot,
      "skills/sendmux-mailbox-agent/SKILL.md",
    ),
    "snippets.data.data.snippets.map",
    "snippets.data.snippets.map",
  );
  result = runFixtureChecker(wrongEnvelopeFixture);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Mailbox snippet SDK response guidance drift/);

  const nonThrowingFixture = makeContractFixture(t);
  baseline = runFixtureChecker(nonThrowingFixture);
  assert.equal(baseline.status, 0, baseline.stderr);
  const mailboxAgentPath = path.join(
    nonThrowingFixture.skillsRoot,
    "skills/sendmux-mailbox-agent/SKILL.md",
  );
  const mailboxAgentText = readFileSync(mailboxAgentPath, "utf8");
  const nonThrowingText = mailboxAgentText.replace(
    /(const snippets = await mailboxSearchMessageSnippets\(\{[\s\S]*?)  throwOnError: true,([\s\S]*?\n\}\);)/,
    "$1  throwOnError: false,$2",
  );
  assert.notEqual(nonThrowingText, mailboxAgentText);
  writeFileSync(mailboxAgentPath, nonThrowingText);
  result = runFixtureChecker(nonThrowingFixture);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Mailbox snippet throwOnError guidance drift/);

  const unguardedEmptyFixture = makeContractFixture(t);
  baseline = runFixtureChecker(unguardedEmptyFixture);
  assert.equal(baseline.status, 0, baseline.stderr);
  replaceFixtureText(
    path.join(
      unguardedEmptyFixture.skillsRoot,
      "skills/sendmux-mailbox-agent/SKILL.md",
    ),
    "if (ids.length > 0) {",
    "if (ids.length >= 0) {",
  );
  result = runFixtureChecker(unguardedEmptyFixture);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Mailbox snippet empty-result guard guidance drift/);

  const undefinedHeadersFixture = makeContractFixture(t);
  baseline = runFixtureChecker(undefinedHeadersFixture);
  assert.equal(baseline.status, 0, baseline.stderr);
  replaceFixtureText(
    path.join(
      undefinedHeadersFixture.skillsRoot,
      "skills/sendmux-token-efficient-usage/SKILL.md",
    ),
    'headers: priorEtag ? { "If-None-Match": priorEtag } : {},',
    'headers: priorEtag ? { "If-None-Match": priorEtag } : undefined,',
  );
  result = runFixtureChecker(undefinedHeadersFixture);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /conditional Management SDK headers guidance drift/);
});
