# MCP2.1 native fact adoption

## Correctness

`sendmux-mcp` guide guidance and Case 7 now match the `2.1.0` package fact from SDK commit `8a204d91eab96652ec39e9e59cef6280ef88b925`. The supplied producer workspace matched that commit for `pyproject.toml`, `mcp-contract.json`, `server.json`, and `CHANGELOG.md` before use.

## Tests

- RED: `SENDMUX_SDK=/Users/rj/Desktop/GIT-REPOS/sendmux-sdk-combined-native-release SENDMUX_DOCS=/Users/rj/Desktop/GIT-REPOS/sendmux-docs-mcp-oauth node scripts/check-skill-drift.mjs` exited 1 before the patch with only `MCP package identity/version guidance drift`.
- GREEN: plugin/OpenClaw generation and their checkers, workflow path-filter check, and the direct drift check all exited 0 with the same producer roots.
- `node --test` with explicit selectors for all five `scripts/*.test.mjs` files and the same roots: 38 pass, 0 fail.

## Scope proof

- Source normalised by replacing only `2.1.0` with `2.0.0` hashes exactly to base `1ac1ffcbfcd8c28e7acd46bb1cb26677e377f69d` for both changed source files.
- Regenerated plugin MCP copy is byte-identical to the canonical source. Ignored OpenClaw output was archived before regeneration at `.claude/artifacts/skills-native-mcp-21/pre-regeneration-dist-clawhub-skills/`.

## Status

Local change only; the implementer performed no remote action, provider evaluation, release, archive/install acceptance, or publication. ROOT's subsequent archive/install verification is recorded below; public distribution remains pending.

## Retained validation evidence

Original direct-console checks had no retained raw files or parent-PID receipts; they are qualified rather than treated as handle-verified evidence. The retained RED fixture is `.claude/artifacts/skills-native-mcp-21/owned-red-fixture-20260916-200436/`: it copies `HEAD`, changes only the guide's one and Case 7's two version tokens to `2.0.0`, and its raw checker log exits 1 with only `MCP package identity/version guidance drift`; PID `6515` was absent after wait. The retained absolute-path GREEN run is `.claude/artifacts/skills-native-mcp-21/owned-validation-20260916-200357-absolute/`: five check logs and the 38/38 test log are present; PIDs `5519`, `5525`, `5530`, `5535`, `5540`, and `5545` all exited 0 and were absent after wait; its owned TMPDIR was removed. The preceding relative-TMPDIR capture is retained as a harness-failure record, not evidence of product failure.

## ROOT verification — 2026-09-16 20:14

ROOT ran the existing SDK `run`/`workspace` owner with an absolute owned TMPDIR for the four bundle/filter/drift checkers and all five test files. Every command exited 0; the suite records 38 pass, 0 fail, 0 cancelled, 0 skipped. Raw output is `.claude/artifacts/skills-native-mcp21-package.OHZj4K/root-validation.log` (SHA-256 `accce61825c2a3d9549f23e01df531bf4352653170ce708b59a496c99e797953`). `root-validation-cleanup.json` records independent absence checks for all 68 signed process handles and 120 recorded temporary paths. These receipts supersede neither the original failed capture nor its explicit qualification.

The canonical skill packager produced `sendmux-mcp-setup.skill` with exactly `SKILL.md` and `agents/openai.yaml`; eval files are intentionally excluded. Both isolated Claude and agents installs passed validation and exact source-byte comparison. The archive SHA-256 is `01022ad6035fa97afb2f8ee35485cf3d1a97d9cacec3e1ced78d9b9bd4ca380f`; the previous archive is retained and all eight sibling archives are unchanged. `package-install.log` and `cleanup.jsonl` in the same artifact directory retain the commands, member list, install results, and verified absence of 16 signed process handles and the install workspace.

ROOT also rechecked the three-token-only source delta, source/plugin byte equality, archive hashes, and all four MCP producer inputs against immutable SDK commit `8a204d91eab96652ec39e9e59cef6280ef88b925`. Existing behavioural/provider evaluations remain historical evidence, not fresh runs. Full public distribution, release workflows, and site synchronisation are still required.

## Pack release metadata — 2026-09-17 16:19

The already-published pack `1.5.0` remains immutable. The canonical `openclaw.skills.json` version and four generated plugin/marketplace manifests now select `1.6.0`; both existing generators ran, and all nine OpenClaw outputs changed only their generated version line. Bundle parity, OpenClaw validation, both workflow path-filter checks, skill drift and `git diff --check` passed. No tests or skill wording changed, so the accepted behavioural and provider evaluations above were not repeated.

ROOT independently rehashed all 58 preserved source/eval/runtime/evidence/plan/archive files against the post-generation manifest before adding this section. The nine canonical skill bodies and nine accepted archives were unchanged. Raw logs, exact five-file version diff and before/after hashes are in `.claude/artifacts/skills-plugin-160-metadata-20260917/`; the checker's temporary directory is verified absent. Drift used SDK `77dc354fbecc9459d8f4f1c49d36ea129b4bfd90` and docs `ad17e9409a8ec668552fcc730828c13d44bcad99`, not a claim that either candidate was newly published. Public merge, release, distribution and SITE readback remain open.

## Archive rebuild for 2.1.1 parity — 2026-09-18 15:44

The `2c73b9b6` native-fact refresh (2.1.0 to 2.1.1) left `dist/sendmux-mcp-setup.skill` (SHA-256 `01022ad6035fa97afb2f8ee35485cf3d1a97d9cacec3e1ced78d9b9bd4ca380f`) one line behind its source. L8 rebuilt it with the canonical packager (`python -m scripts.package_skill` from the skill-creator toolkit at ja-k8s commit `127f182c8d70bc934305a175a80d581d2638b78d`, B11 runtime Python 3.14.6 / PyYAML 6.0.2): members are exactly `sendmux-mcp-setup/SKILL.md` and `sendmux-mcp-setup/agents/openai.yaml`, evals excluded; new SHA-256 `7c34f53f9e090b421ef399775efef2cf2d0272d120fe55abab88c334343224f8`. Both isolated installs (a `.claude/skills` home layout and a `.agents/skills` project layout under a fresh temporary workspace) passed `quick_validate` and byte-for-byte comparison with the source; the workspace was removed and verified absent. The eight sibling archives are unchanged (before/after hash tables match) and all nine archives diff clean against their sources with evals excluded. `check-plugin-bundles.mjs` and `check-openclaw-bundle.mjs` passed. `dist/` is ignored, so this section is the tracked record; raw receipts are in `.claude/artifacts/l8-review-pr22/archive-rebuild/` (`package-install.log`, `rebuild.sh`, `before.txt`, `after.txt`, `parity-before.txt`, `parity-after.txt`, `previous-sendmux-mcp-setup.skill`). Archives and installs for the eight unchanged skills were not repeated. Public merge, release, distribution and SITE readback remain open.
