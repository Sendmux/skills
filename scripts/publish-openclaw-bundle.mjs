#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const configPath = path.join(repoRoot, "openclaw.skills.json");
const cancellationForceKillMs = 1000;
const signalExitCodes = new Map([
  ["SIGHUP", 129],
  ["SIGINT", 130],
  ["SIGTERM", 143],
]);

class PublicationCancelled extends Error {
  constructor(signal) {
    super(`ClawHub publication cancelled by ${signal}`);
    this.signal = signal;
  }
}

function createPublicationCancellation() {
  let activeChild = null;
  let forceKillTimer = null;
  let retryReject = null;
  let requestedSignal = null;

  function clearForceKill() {
    if (forceKillTimer) clearTimeout(forceKillTimer);
    forceKillTimer = null;
  }

  function stopActiveChild() {
    if (!activeChild || activeChild.exitCode !== null || activeChild.signalCode !== null) return;
    activeChild.kill(requestedSignal);
    forceKillTimer = setTimeout(() => {
      if (activeChild && activeChild.exitCode === null && activeChild.signalCode === null) {
        activeChild.kill("SIGKILL");
      }
    }, cancellationForceKillMs);
  }

  return {
    clearChild(child) {
      if (activeChild !== child) return;
      activeChild = null;
      clearForceKill();
    },
    get signal() {
      return requestedSignal;
    },
    request(signal) {
      if (requestedSignal) return;
      requestedSignal = signal;
      retryReject?.(new PublicationCancelled(signal));
      stopActiveChild();
    },
    sleep(ms) {
      if (requestedSignal) return Promise.reject(new PublicationCancelled(requestedSignal));
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          retryReject = null;
          resolve();
        }, ms);
        retryReject = (error) => {
          retryReject = null;
          clearTimeout(timer);
          reject(error);
        };
      });
    },
    throwIfRequested() {
      if (requestedSignal) throw new PublicationCancelled(requestedSignal);
    },
    trackChild(child) {
      activeChild = child;
      child.once("exit", clearForceKill);
      if (requestedSignal) stopActiveChild();
    },
  };
}

function readConfig() {
  return JSON.parse(readFileSync(configPath, "utf8"));
}

export function isNewSkillRateLimitError(output) {
  return /Rate limit:\s*max\s+5\s+new\s+skills\s+per\s+hour/i.test(output);
}

export function parseRateLimitResetSeconds(output) {
  const match = output.match(/\breset\s+in\s+(\d+)\s*s\b/i);
  return match ? Number(match[1]) : null;
}

export function planRateLimitRetry({ output, bufferSeconds, maxWaitSeconds }) {
  if (!isNewSkillRateLimitError(output)) {
    return { shouldRetry: false, waitSeconds: null };
  }

  const resetSeconds = parseRateLimitResetSeconds(output) ?? maxWaitSeconds;
  const waitSeconds = resetSeconds + bufferSeconds;

  return {
    shouldRetry: waitSeconds <= maxWaitSeconds,
    waitSeconds,
  };
}

export function listSkillDirs(root) {
  if (!existsSync(root)) {
    throw new Error(`Missing OpenClaw bundle root: ${root}`);
  }

  const skillDirs = readdirSync(root)
    .map((entry) => path.join(root, entry))
    .filter((entryPath) => statSync(entryPath).isDirectory())
    .filter((entryPath) => existsSync(path.join(entryPath, "SKILL.md")))
    .sort();

  if (skillDirs.length === 0) {
    throw new Error(`No generated skills found in ${root}`);
  }

  return skillDirs;
}

function parseArgs(argv) {
  const config = readConfig();
  const options = {
    clawhubBin: "clawhub",
    dryRun: false,
    maxWaitSeconds: 3900,
    owner: config.owner,
    rateLimitBufferSeconds: 5,
    root: path.resolve(repoRoot, config.outputRoot),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (!argv[index]) throw new Error(`${arg} requires a value`);
      return argv[index];
    };

    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--root") {
      options.root = path.resolve(repoRoot, next());
    } else if (arg === "--owner") {
      options.owner = next();
    } else if (arg === "--clawhub-bin") {
      options.clawhubBin = next();
    } else if (arg === "--max-rate-limit-wait-seconds") {
      options.maxWaitSeconds = Number(next());
    } else if (arg === "--rate-limit-buffer-seconds") {
      options.rateLimitBufferSeconds = Number(next());
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.owner) {
    throw new Error("Missing ClawHub owner. Set openclaw.skills.json owner or pass --owner.");
  }
  if (!Number.isFinite(options.maxWaitSeconds) || options.maxWaitSeconds < 0) {
    throw new Error("--max-rate-limit-wait-seconds must be a non-negative number");
  }
  if (!Number.isFinite(options.rateLimitBufferSeconds) || options.rateLimitBufferSeconds < 0) {
    throw new Error("--rate-limit-buffer-seconds must be a non-negative number");
  }

  return options;
}

function commandForSkill(skillDir, options) {
  const args = ["skill", "publish", skillDir, "--owner", options.owner, "--json"];
  if (options.dryRun) args.push("--dry-run");
  return { command: options.clawhubBin, args };
}

function runCommand(command, args, cancellation) {
  return new Promise((resolve, reject) => {
    cancellation?.throwIfRequested();
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    cancellation?.trackChild(child);
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      process.stdout.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      process.stderr.write(chunk);
    });
    child.on("error", (error) => {
      cancellation?.clearChild(child);
      reject(error);
    });
    child.on("close", (code, signal) => {
      cancellation?.clearChild(child);
      if (cancellation?.signal) {
        reject(new PublicationCancelled(cancellation.signal));
      } else {
        resolve({ code, signal, stdout, stderr });
      }
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function publishSkillDir(
  skillDir,
  options,
  runner = runCommand,
  sleeper = sleep,
  cancellation,
) {
  while (true) {
    const { command, args } = commandForSkill(skillDir, options);
    const result = await runner(command, args, cancellation);
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n");

    if (result.code === 0) {
      return result;
    }

    const retry = planRateLimitRetry({
      output,
      bufferSeconds: options.rateLimitBufferSeconds,
      maxWaitSeconds: options.maxWaitSeconds,
    });

    if (!retry.shouldRetry) {
      throw new Error(`${path.basename(skillDir)}: clawhub publish failed with exit code ${result.code}`);
    }

    console.error(
      `ClawHub new-skill rate limit hit for ${path.basename(skillDir)}; retrying in ${retry.waitSeconds}s.`,
    );
    if (cancellation) {
      await cancellation.sleep(retry.waitSeconds * 1000);
    } else {
      await sleeper(retry.waitSeconds * 1000);
    }
  }
}

export async function main(argv = process.argv.slice(2), cancellation) {
  const options = parseArgs(argv);
  const skillDirs = listSkillDirs(options.root);

  for (const skillDir of skillDirs) {
    await publishSkillDir(skillDir, options, runCommand, sleep, cancellation);
  }

  const mode = options.dryRun ? "Dry-run checked" : "Published";
  console.log(`${mode} ${skillDirs.length} ClawHub skills for ${options.owner}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cancellation = createPublicationCancellation();
  const signalHandlers = new Map(
    [...signalExitCodes].map(([signal]) => [signal, () => cancellation.request(signal)]),
  );
  for (const [signal, handler] of signalHandlers) process.on(signal, handler);

  main(process.argv.slice(2), cancellation)
    .catch((error) => {
      if (error instanceof PublicationCancelled) {
        process.exitCode = signalExitCodes.get(error.signal);
      } else {
        console.error(error.message);
        process.exitCode = 1;
      }
    })
    .finally(() => {
      for (const [signal, handler] of signalHandlers) process.off(signal, handler);
    });
}
