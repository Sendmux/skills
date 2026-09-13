import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const clawhubToken = "synthetic-clawhub-token-task5a";
const siteToken = "synthetic-site-token-task5a";

function extractStepRun(workflowPath, stepName) {
  const lines = readFileSync(workflowPath, "utf8").replaceAll("\r\n", "\n").split("\n");
  const stepIndex = lines.findIndex((line) => line.trim() === `- name: ${stepName}`);
  assert.notEqual(stepIndex, -1, `${workflowPath} must contain step ${stepName}`);

  for (let index = stepIndex + 1; index < lines.length; index += 1) {
    const match = lines[index].match(/^(\s*)run:\s*(.*)$/);
    if (!match) continue;
    if (match[2] !== "|") return match[2];

    const blockIndent = match[1].length + 2;
    const block = [];
    for (index += 1; index < lines.length; index += 1) {
      if (lines[index].trim() && lines[index].search(/\S/) < blockIndent) break;
      block.push(lines[index].slice(blockIndent));
    }
    return block.join("\n");
  }

  assert.fail(`${workflowPath} step ${stepName} must have a run command`);
}

function writeExecutable(filePath, source) {
  writeFileSync(filePath, source);
  chmodSync(filePath, 0o700);
}

function makeClawhubFixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), "sendmux-clawhub-workflow-"));
  process.stderr.write(`ClawHub fixture root: ${root}\n`);
  const repo = path.join(root, "repo");
  const bin = path.join(root, "bin");
  const runnerTemp = path.join(root, "runner-temp");
  const receipt = path.join(root, "clawhub-receipt.json");
  const ready = path.join(root, "clawhub-ready");
  const attempts = path.join(root, "clawhub-attempts");
  mkdirSync(path.join(repo, "scripts"), { recursive: true });
  mkdirSync(path.join(repo, "dist", "clawhub", "skills", "sendmux-test"), {
    recursive: true,
  });
  mkdirSync(bin);
  mkdirSync(runnerTemp);
  copyFileSync("scripts/publish-openclaw-bundle.mjs", path.join(repo, "scripts", "publish-openclaw-bundle.mjs"));
  writeFileSync(
    path.join(repo, "openclaw.skills.json"),
    `${JSON.stringify({ owner: "sendmux.ai", outputRoot: "dist/clawhub/skills" })}\n`,
  );
  writeFileSync(path.join(repo, "dist", "clawhub", "skills", "sendmux-test", "SKILL.md"), "test\n");
  writeExecutable(
    path.join(bin, "clawhub"),
    `#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const configPath = process.env.CLAWHUB_CONFIG_PATH || "";
const configExists = Boolean(configPath) && existsSync(configPath);
const attemptsPath = process.env.FIXTURE_ATTEMPTS;
const attempt = existsSync(attemptsPath) ? Number(readFileSync(attemptsPath, "utf8")) + 1 : 1;
writeFileSync(attemptsPath, String(attempt));
let config = null;
if (configExists) config = JSON.parse(readFileSync(configPath, "utf8"));
writeFileSync(process.env.FIXTURE_RECEIPT, JSON.stringify({
  argv: process.argv.slice(2),
  attempt,
  configPath,
  configExists,
  directoryMode: configExists ? statSync(path.dirname(configPath)).mode & 0o777 : null,
  fileMode: configExists ? statSync(configPath).mode & 0o777 : null,
  parentPid: process.ppid,
  pid: process.pid,
  registry: config?.registry ?? null,
  tokenHash: config?.token ? createHash("sha256").update(config.token).digest("hex") : null,
  tokenEnvironmentPresent: Object.hasOwn(process.env, "CLAWHUB_TOKEN"),
}));
if (!configExists) process.exit(86);
if (process.env.FIXTURE_RATE_LIMIT === "1") {
  writeFileSync(process.env.FIXTURE_READY, String(process.pid));
  process.stderr.write("Rate limit: max 5 new skills per hour (reset in 0s)\\n");
  process.exit(1);
}
if (process.env.FIXTURE_WAIT === "1") {
  if (process.env.FIXTURE_IGNORE_SIGNAL === "1") {
    process.on("SIGHUP", () => {});
    process.on("SIGINT", () => {});
    process.on("SIGTERM", () => {});
  }
  writeFileSync(process.env.FIXTURE_READY, String(process.pid));
  setInterval(() => {}, 1000);
} else {
  process.exit(Number(process.env.FIXTURE_EXIT_CODE || 0));
}
`,
  );
  return { attempts, bin, ready, receipt, repo, root, runnerTemp };
}

function makeSiteFixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), "sendmux-site-workflow-"));
  process.stderr.write(`SITE fixture root: ${root}\n`);
  const bin = path.join(root, "bin");
  const receipt = path.join(root, "curl-receipt.json");
  mkdirSync(bin);
  writeExecutable(
    path.join(bin, "curl"),
    `#!/usr/bin/env node
import { writeFileSync } from "node:fs";

let stdin = "";
for await (const chunk of process.stdin) stdin += chunk;
writeFileSync(process.env.FIXTURE_RECEIPT, JSON.stringify({
  argv: process.argv.slice(2),
  pid: process.pid,
  stdin,
}));
if (process.env.FIXTURE_CURL_STDERR) process.stderr.write(process.env.FIXTURE_CURL_STDERR);
process.exit(Number(process.env.FIXTURE_EXIT_CODE || 0));
`,
  );
  return { bin, receipt, root };
}

function startShell(block, { cwd, env }) {
  const child = spawn("bash", ["-euo", "pipefail", "-c", block], {
    cwd,
    detached: true,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  const exit = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code, signal) => resolve({ code, pid: child.pid, signal }));
  });
  const closed = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code, signal) => resolve({ code, pid: child.pid, signal, stderr, stdout }));
  });
  return { closed, exit, pid: child.pid };
}

function settleWithin(promise, label, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`${label} did not settle within ${timeoutMs}ms`)), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

async function runShell(block, { onStart, timeoutMs = 3000, ...options }) {
  const running = startShell(block, options);
  onStart?.(running);
  try {
    return await settleWithin(running.closed, `workflow shell PID ${running.pid}`, timeoutMs);
  } catch (error) {
    await recoverShell(running);
    throw error;
  }
}

function clawhubEnvironment(fixture, overrides = {}) {
  return {
    CLAWHUB_TOKEN: clawhubToken,
    FIXTURE_ATTEMPTS: fixture.attempts,
    FIXTURE_READY: fixture.ready,
    FIXTURE_RECEIPT: fixture.receipt,
    PATH: `${fixture.bin}:${process.env.PATH}`,
    RUNNER_TEMP: fixture.runnerTemp,
    ...overrides,
  };
}

function readReceipt(fixture) {
  assert.equal(existsSync(fixture.receipt), true, "the ClawHub consumer must write its receipt");
  return JSON.parse(readFileSync(fixture.receipt, "utf8"));
}

function assertSecretAbsent(result) {
  assert.equal(
    [result.stdout, result.stderr].some((output) => output.includes(clawhubToken)),
    false,
    "the synthetic credential must not appear in stdout or stderr",
  );
}

async function waitForPidToExit(pid) {
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    try {
      process.kill(pid, 0);
    } catch (error) {
      if (error.code === "ESRCH") return true;
      if (error.code === "EPERM") {
        await new Promise((resolve) => setTimeout(resolve, 20));
        continue;
      }
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  return false;
}

function isPidRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;
    if (error.code === "EPERM") return true;
    throw error;
  }
}

function isProcessGroupRunning(pid) {
  return isPidRunning(-pid);
}

async function waitForPathToDisappear(filePath) {
  const deadline = Date.now() + 2000;
  while (existsSync(filePath) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  return !existsSync(filePath);
}

async function waitForPathToExist(filePath) {
  const deadline = Date.now() + 2000;
  while (!existsSync(filePath) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  return existsSync(filePath);
}

async function terminateFixturePid(pid) {
  try {
    process.kill(pid, "SIGTERM");
  } catch (error) {
    if (error.code === "ESRCH") return;
    throw error;
  }
  if (await waitForPidToExit(pid)) return;
  process.kill(pid, "SIGKILL");
  assert.equal(await waitForPidToExit(pid), true, `fixture PID ${pid} must exit after SIGKILL`);
}

async function recoverShell(running) {
  try {
    process.kill(-running.pid, "SIGTERM");
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }

  try {
    await settleWithin(running.closed, `workflow shell PID ${running.pid} recovery`, 500);
  } catch (error) {
    if (!error.message.includes("did not settle")) throw error;
  }

  if (isProcessGroupRunning(running.pid)) {
    process.kill(-running.pid, "SIGKILL");
    assert.equal(
      await waitForPidToExit(-running.pid),
      true,
      `workflow process group ${running.pid} must exit after SIGKILL`,
    );
  }
  assert.equal(await waitForPidToExit(running.pid), true, `workflow shell PID ${running.pid} must exit`);
  assert.equal(isProcessGroupRunning(running.pid), false, `workflow process group ${running.pid} must exit`);
}

test("ClawHub publish reads an owner-only ephemeral config without secret argv", async (t) => {
  const fixture = makeClawhubFixture();
  t.after(() => rmSync(fixture.root, { recursive: true, force: true }));
  const workflow = readFileSync(".github/workflows/openclaw-clawhub.yml", "utf8");
  assert.equal(workflow.match(/npm install -g clawhub@0\.23\.3/g)?.length, 2);
  assert.doesNotMatch(workflow, /clawhub login --token/);
  assert.match(workflow, /^permissions:\n  contents: read$/m);
  assert.match(workflow, /^    environment: clawhub$/m);
  assert.match(workflow, /if:\s*\$\{\{\s*github\.event_name == 'push'/);
  const block = extractStepRun(".github/workflows/openclaw-clawhub.yml", "Publish ClawHub skills");

  const result = await runShell(block, {
    cwd: fixture.repo,
    env: clawhubEnvironment(fixture),
  });
  const receipt = readReceipt(fixture);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(receipt.configExists, true);
  assert.equal(receipt.registry, "https://clawhub.ai");
  assert.equal(receipt.tokenHash, createHash("sha256").update(clawhubToken).digest("hex"));
  assert.equal(receipt.directoryMode, 0o700);
  assert.equal(receipt.fileMode, 0o600);
  assert.equal(receipt.tokenEnvironmentPresent, false);
  assert.deepEqual(receipt.argv.slice(0, 2), ["skill", "publish"]);
  assert.equal(
    realpathSync(receipt.argv[2]),
    realpathSync(path.join(fixture.repo, "dist", "clawhub", "skills", "sendmux-test")),
  );
  assert.deepEqual(receipt.argv.slice(3), ["--owner", "sendmux.ai", "--json"]);
  assertSecretAbsent(result);
  assert.equal(existsSync(path.dirname(receipt.configPath)), false);
  assert.equal(isPidRunning(result.pid), false);
  assert.equal(isPidRunning(receipt.parentPid), false);
  assert.equal(isPidRunning(receipt.pid), false);
  t.diagnostic(
    `success shell PID ${result.pid}, publisher PID ${receipt.parentPid}, child PID ${receipt.pid} verified gone; removed ${path.dirname(receipt.configPath)}`,
  );
});

test("ClawHub publish cleans its exact config directory after publisher failure", async (t) => {
  const fixture = makeClawhubFixture();
  t.after(() => rmSync(fixture.root, { recursive: true, force: true }));
  const block = extractStepRun(".github/workflows/openclaw-clawhub.yml", "Publish ClawHub skills");

  const result = await runShell(block, {
    cwd: fixture.repo,
    env: clawhubEnvironment(fixture, { FIXTURE_EXIT_CODE: "23" }),
  });
  const receipt = readReceipt(fixture);
  assert.notEqual(result.code, 0);
  assert.equal(receipt.configExists, true);
  assertSecretAbsent(result);
  assert.equal(existsSync(path.dirname(receipt.configPath)), false);
  assert.equal(isPidRunning(result.pid), false);
  assert.equal(isPidRunning(receipt.parentPid), false);
  assert.equal(isPidRunning(receipt.pid), false);
  t.diagnostic(
    `failure shell PID ${result.pid}, publisher PID ${receipt.parentPid}, child PID ${receipt.pid} verified gone; removed ${path.dirname(receipt.configPath)}`,
  );
});

test("ClawHub publish rejects a missing credential before starting the publisher", async (t) => {
  const fixture = makeClawhubFixture();
  t.after(() => rmSync(fixture.root, { recursive: true, force: true }));
  const block = extractStepRun(".github/workflows/openclaw-clawhub.yml", "Publish ClawHub skills");

  const result = await runShell(block, {
    cwd: fixture.repo,
    env: clawhubEnvironment(fixture, { CLAWHUB_TOKEN: "" }),
  });
  assert.notEqual(result.code, 0);
  assert.equal(existsSync(fixture.receipt), false);
  assert.deepEqual(readdirSync(fixture.runnerTemp), []);
  assert.match(result.stderr, /CLAWHUB_TOKEN is required/);
  assert.equal(isPidRunning(result.pid), false);
  t.diagnostic(`missing-credential shell PID ${result.pid}; publisher was not started`);
});

test("ClawHub publish removes its exact config directory on workflow SIGHUP, SIGINT, and SIGTERM", async (t) => {
  const block = extractStepRun(".github/workflows/openclaw-clawhub.yml", "Publish ClawHub skills");

  for (const [signal, expectedStatus] of [["SIGHUP", 129], ["SIGINT", 130], ["SIGTERM", 143]]) {
    const fixture = makeClawhubFixture();
    t.after(() => rmSync(fixture.root, { recursive: true, force: true }));
    const running = startShell(block, {
      cwd: fixture.repo,
      env: clawhubEnvironment(fixture, { FIXTURE_IGNORE_SIGNAL: "1", FIXTURE_WAIT: "1" }),
    });
    let receipt;
    let result;
    let descendantsBeforeRecovery;

    try {
      assert.equal(
        await waitForPathToExist(fixture.ready),
        true,
        "the publisher fixture must reach its live wait boundary",
      );
      receipt = readReceipt(fixture);
      t.diagnostic(
        `${signal} owned handles: shell PID ${running.pid}, publisher PID ${receipt.parentPid}, child PID ${receipt.pid}, config ${receipt.configPath}`,
      );
      process.kill(running.pid, signal);
      await new Promise((resolve) => setTimeout(resolve, 100));
      assert.equal(isPidRunning(receipt.parentPid), true, "publisher must await its signal-ignoring child");
      assert.equal(isPidRunning(receipt.pid), true, "signal-ignoring child must exercise bounded escalation");
      assert.equal(
        existsSync(path.dirname(receipt.configPath)),
        true,
        "credential config must remain until the active child has closed",
      );
      const shellExit = await settleWithin(running.exit, `${signal} workflow shell exit`, 2000);
      assert.equal(shellExit.code, expectedStatus);
      assert.equal(shellExit.signal, null);
      assert.equal(
        await waitForPathToDisappear(path.dirname(receipt.configPath)),
        true,
        `credential directory ${path.dirname(receipt.configPath)} must be removed`,
      );
      assert.equal(isPidRunning(running.pid), false);
      descendantsBeforeRecovery = {
        child: isPidRunning(receipt.pid),
        publisher: isPidRunning(receipt.parentPid),
      };
      assert.equal(descendantsBeforeRecovery.publisher, false, "publisher must stop before fixture recovery");
      assert.equal(descendantsBeforeRecovery.child, false, "ClawHub child must stop before fixture recovery");
    } finally {
      if (receipt) {
        await terminateFixturePid(receipt.pid);
        await terminateFixturePid(receipt.parentPid);
      } else {
        try {
          process.kill(-running.pid, "SIGKILL");
        } catch (error) {
          if (error.code !== "ESRCH") throw error;
        }
      }
      if (isPidRunning(running.pid)) await terminateFixturePid(running.pid);
      result = await settleWithin(running.closed, `${signal} workflow stdio close`, 2000);
    }

    assertSecretAbsent(result);
    assert.equal(isPidRunning(running.pid), false);
    assert.equal(isPidRunning(receipt.parentPid), false);
    assert.equal(isPidRunning(receipt.pid), false);
    t.diagnostic(
      `${signal} before test recovery: workflow PID ${running.pid} gone, config removed, publisher alive=${descendantsBeforeRecovery.publisher}, child alive=${descendantsBeforeRecovery.child}; exact PIDs remained absent after finally`,
    );
  }
});

test("ClawHub cancellation interrupts a rate-limit wait before another publication", async (t) => {
  const fixture = makeClawhubFixture();
  t.after(() => rmSync(fixture.root, { recursive: true, force: true }));
  const block = extractStepRun(".github/workflows/openclaw-clawhub.yml", "Publish ClawHub skills");
  const running = startShell(block, {
    cwd: fixture.repo,
    env: clawhubEnvironment(fixture, { FIXTURE_RATE_LIMIT: "1" }),
  });
  let receipt;
  let result;

  try {
    assert.equal(await waitForPathToExist(fixture.ready), true, "publisher must enter its retry wait");
    receipt = readReceipt(fixture);
    t.diagnostic(
      `rate-limit owned handles: shell PID ${running.pid}, publisher PID ${receipt.parentPid}, child PID ${receipt.pid}, config ${receipt.configPath}`,
    );
    assert.equal(await waitForPidToExit(receipt.pid), true, "rate-limited ClawHub child must exit");
    process.kill(running.pid, "SIGINT");
    result = await settleWithin(running.closed, "rate-limit cancellation shell close", 2000);
    assert.equal(result.code, 130);
    assert.equal(isPidRunning(receipt.parentPid), false, "publisher retry wait must stop before recovery");
    assert.equal(existsSync(path.dirname(receipt.configPath)), false);
    assert.equal(readFileSync(fixture.attempts, "utf8"), "1", "cancellation must prevent another publish attempt");
  } finally {
    if (receipt && isPidRunning(receipt.parentPid)) await terminateFixturePid(receipt.parentPid);
    if (isPidRunning(running.pid)) {
      try {
        process.kill(-running.pid, "SIGKILL");
      } catch (error) {
        if (error.code !== "ESRCH") throw error;
      }
      await waitForPidToExit(running.pid);
    }
  }

  assertSecretAbsent(result);
  assert.equal(isPidRunning(running.pid), false);
  assert.equal(isPidRunning(receipt.parentPid), false);
  assert.equal(isPidRunning(receipt.pid), false);
  t.diagnostic(
    `rate-limit cancellation shell PID ${running.pid}, publisher PID ${receipt.parentPid}, child PID ${receipt.pid} verified gone; one publish attempt; removed ${path.dirname(receipt.configPath)}`,
  );
});

test("runShell timeout recovers its exact owned shell and child before fixture removal", async (t) => {
  const root = mkdtempSync(path.join(os.tmpdir(), "sendmux-workflow-timeout-"));
  process.stderr.write(`timeout fixture root: ${root}\n`);
  const ready = path.join(root, "ready");
  let running;
  let childPid;
  t.after(() => rmSync(root, { recursive: true, force: true }));

  try {
    await assert.rejects(
      runShell(
        `node --input-type=module -e '
          import { writeFileSync } from "node:fs";
          writeFileSync(process.env.FIXTURE_READY, String(process.pid));
          process.on("SIGTERM", () => {});
          setInterval(() => {}, 1000);
        ' &
        wait $!`,
        {
          cwd: process.cwd(),
          env: { FIXTURE_READY: ready },
          onStart: (handle) => {
            running = handle;
            t.diagnostic(`timeout owned shell/process-group PID ${handle.pid}`);
          },
          timeoutMs: 100,
        },
      ),
      /did not settle within 100ms/,
    );
    assert.equal(await waitForPathToExist(ready), true, "timeout child must report its exact PID");
    childPid = Number(readFileSync(ready, "utf8"));
    t.diagnostic(`timeout owned handles: shell/process-group PID ${running.pid}, child PID ${childPid}`);
    assert.equal(isPidRunning(running.pid), false, "timed-out shell must be recovered by runShell");
    assert.equal(isPidRunning(childPid), false, "timed-out child must be recovered by runShell");
  } finally {
    if (!childPid && existsSync(ready)) childPid = Number(readFileSync(ready, "utf8"));
    if (childPid) t.diagnostic(`timeout owned child PID ${childPid}`);
    if (childPid && isPidRunning(childPid)) await terminateFixturePid(childPid);
    if (running && isPidRunning(running.pid)) {
      try {
        process.kill(-running.pid, "SIGKILL");
      } catch (error) {
        if (error.code !== "ESRCH") throw error;
      }
      await waitForPidToExit(running.pid);
    }
  }
  t.diagnostic(`timeout recovery verified shell/process-group PID ${running.pid} and child PID ${childPid} absent`);
});

test("SITE notification preserves its fallback and sends the secret header only through stdin", async (t) => {
  const fixture = makeSiteFixture();
  t.after(() => rmSync(fixture.root, { recursive: true, force: true }));
  const workflow = readFileSync(".github/workflows/notify-site.yml", "utf8");
  assert.match(workflow, /^permissions:\n  contents: read$/m);
  assert.match(workflow, /^  push:\n    branches: \[main\]\n    paths:\n      - "skills\/\*\*"$/m);
  assert.match(workflow, /^  workflow_dispatch:$/m);
  const block = extractStepRun(".github/workflows/notify-site.yml", "Fire repository_dispatch");
  const baseEnvironment = {
    FIXTURE_RECEIPT: fixture.receipt,
    PATH: `${fixture.bin}:${process.env.PATH}`,
  };

  const missing = await runShell(block, {
    cwd: process.cwd(),
    env: { ...baseEnvironment, SITE_DISPATCH_TOKEN: "" },
  });
  assert.equal(missing.code, 0, missing.stderr);
  assert.match(missing.stdout, /skipping immediate dispatch/);
  assert.match(missing.stdout, /daily schedule still catches this drift within 24h/);
  assert.equal(existsSync(fixture.receipt), false);
  assert.equal(isPidRunning(missing.pid), false);

  const success = await runShell(block, {
    cwd: process.cwd(),
    env: { ...baseEnvironment, SITE_DISPATCH_TOKEN: siteToken },
  });
  const receipt = JSON.parse(readFileSync(fixture.receipt, "utf8"));
  assert.equal(success.code, 0, success.stderr);
  assert.deepEqual(receipt.argv, [
    "-fsSL",
    "-X",
    "POST",
    "--header",
    "@-",
    "https://api.github.com/repos/Sendmux/SITE_sendmux.ai/dispatches",
    "--data",
    '{"event_type":"skills-updated"}',
  ]);
  assert.equal(
    receipt.stdin,
    [
      `Authorization: Bearer ${siteToken}`,
      "Accept: application/vnd.github+json",
      "X-GitHub-Api-Version: 2022-11-28",
      "",
    ].join("\n"),
  );
  assert.equal(receipt.argv.some((argument) => argument.includes(siteToken)), false);
  assert.equal([success.stdout, success.stderr].some((output) => output.includes(siteToken)), false);
  assert.match(success.stdout, /Dispatched skills-updated to Sendmux\/SITE_sendmux\.ai/);
  assert.equal(isPidRunning(success.pid), false);
  assert.equal(isPidRunning(receipt.pid), false);

  rmSync(fixture.receipt);
  const failure = await runShell(block, {
    cwd: process.cwd(),
    env: {
      ...baseEnvironment,
      FIXTURE_CURL_STDERR: "synthetic request failure\n",
      FIXTURE_EXIT_CODE: "22",
      SITE_DISPATCH_TOKEN: siteToken,
    },
  });
  const failureReceipt = JSON.parse(readFileSync(fixture.receipt, "utf8"));
  assert.notEqual(failure.code, 0);
  assert.doesNotMatch(failure.stdout, /Dispatched skills-updated/);
  assert.equal(failureReceipt.argv.some((argument) => argument.includes(siteToken)), false);
  assert.equal([failure.stdout, failure.stderr].some((output) => output.includes(siteToken)), false);
  assert.equal(isPidRunning(failure.pid), false);
  assert.equal(isPidRunning(failureReceipt.pid), false);
  t.diagnostic(
    `fallback shell PID ${missing.pid}; success shell PID ${success.pid} and curl PID ${receipt.pid}; failure shell PID ${failure.pid} and curl PID ${failureReceipt.pid}; all verified gone`,
  );
});
