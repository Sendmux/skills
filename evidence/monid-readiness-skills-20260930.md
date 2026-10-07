# Monid readiness skills — local candidate

Local finalisation checkpoint: 2026-09-30 15:34. Coded locally, not merged or published. No push, tag, release or public installation performed.

## Source and behaviour

- `skills/sendmux-mailbox-agent/SKILL.md:220` teaches persisted threaded drafts, reviewed revisions, conflict recovery and retry reconciliation; `:232` maps candidate MCP, CLI and TypeScript operations; `:244` covers scheduling/cancellation; `:250` covers attachment-text outcomes.
- `skills/sendmux-email-for-agents/SKILL.md:22` routes saved/scheduled drafts to mailbox operations; `:125` separates direct-send idempotency from saved-draft reconciliation. Credential permissions and human approval remain separate gates.
- `skills/sendmux-cli/SKILL.md:126` names unpublished candidate counts 52/57/8. `skills/sendmux-mcp-setup/SKILL.md:35` separates released2.1.3's54tools (26/22/6) from candidate64 (35/23/6). Candidate source is not proof of publication.
- Canonical rules: docs candidate `developer-tools/mailbox-api/saved-drafts.mdx:9`, `:26`, `:53`. Client exports: SDK candidate `packages/ts/mailbox/src/generated/sdk.gen.ts:86`, `:108`, `:117`, `:130`, `:143`, `:419`, `:430`.

## Verification

- Full source suite after both approved assertion patches:48passed,0failed/cancelled/skipped. Raw: `.claude/artifacts/monid-readiness-skills/full-tests-approved-both-candidate.log`. Initial finalisation invocation omitted candidate source environment and failed23 against old default SDK missing contracts; corrected candidate source environment48/48. Raw failure retained at `full-tests-approved-both.log`; no code/assertion changed to mask it.
- Nine new missing-operation regressions each seen red then green: seven draft and two attachment-text operations removed from real candidate spec. Quoted red: `expected: true`, `actual: false`, checker originally reported only `MCP tool catalogue count guidance drift`. Raw: `draft-drift-red.log`, `draft-drift-green.log` under same artifact root. No test removed or skipped.
- Final drift, plugin, OpenClaw9skills and independent push/pull-request path-filter checks pass. Raw: `drift-approved-both-final.log`, `plugin-final-loop-check.log`, `openclaw-final-loop-check.log`, `workflow-final-loop-check.log`. `git diff --check` passes.
- Both archives pass integrity checks; every archive/install file equals canonical source bytes across four local install targets. Canonical descriptions remained unchanged during final loops, so prior packaging/install receipt stands and parity was re-read. Raw: `package-install-final.json`. Evals excluded from packages; no public install.

## Frozen behaviour benchmark and approved assertions

- Original iteration3:20cases × original/candidate guidance,40independently graded runs, one run per case/configuration. Original80/102; candidate99/102. Those grade and aggregate records remain untouched.
- User explicitly approved exact MCP patch SHA256 `f9886b4bfca6a1a46309773182a957267ad1c2c1e1d3132ba3338beb90d967a9` and mailbox patch `d78c94eab9e7b85cf6a417c84bdd62a2e3c03fb2c3b969fac2a7fbbfbaecaed9`; both applied after hash/apply-check. Mailbox alternatives preserve valid saved-draft/direct-send and current-revision re-read/merge paths; every other expectation retained.
- Separate iteration4-approved-evals reuses frozen answers/transcripts: four affected mailbox grades regraded inline, remaining36 carried forward. Original guidance80/102; candidate102/102 (mailbox55/55, router47/47). This is assertion reclassification, not new behavioural performance or provider execution. Root independently reviewed aggregate.
- Regrade provenance records original grade hashes, summaries, changed assertion indices and exact approved patch. Raw: `approved-eval-regrade-provenance.json`; both `<skill>-workspace/iteration-4-approved-evals/benchmark.json`, `benchmark.md`, `review.html` under artifact root. Original iteration3 remains available.
- All original answer/transcript hashes were verified against independent grading records. Token artifacts use actual `timing.json.total_tokens`: candidate/original mailbox35339.75/33902, router34818.5/34876.625. Toolkit source unchanged; configured executor default `gpt-6.1-sol`. One repetition per behaviour case; no stability claim.

## Canonical description loops

- Marketplace-contaminated earlier scores invalid. Official per-session `enabledPlugins` false disables only `agents-md@builtin` and `telemetry@builtin`; all other settings, HOME/auth and global files preserved. Official source: <https://code.claude.com/docs/en/settings-reference#enabledplugins> and `#pluginconfigs`; fetched reference retained at `claude-settings-reference.md`.
- One synthetic selection preflight and one artifact-adapter preflight each selected target with unchanged query and canonical guard. Artifact-only per-process dependency adapter redirects only exact canonical `mkdtemp(prefix="skill-eval-",dir="/tmp")` into owned artifact scratch; unexpected arguments or adapter initialisation fail closed. No toolkit/guard/global edit.
- Canonical bounded loops use unchanged existing mailbox6/router10 query datasets,2workers each,3runs/query,max5iterations,holdout0.4,timeout45, observed `claude-opus-5-5[1m]`. Both exit0 at iteration1 because training passed; neither selected a description change.
- Mailbox training4/4 (12/12decisions), held-out1/2 (3/6decisions). Sync positive passes3/3; marketing-campaign negative falsely selects3/3. Preserved gap; no held-out-driven optimisation and no perfect-trigger claim.
- Router training7/7 (21/21decisions), held-out3/3 (9/9decisions). Small isolated selection dataset; not a competing-marketplace accuracy claim.
- Raw launch/source/query hashes, results, logs, PID/workspace readback and teardown: `description-final-runtime/final-loop-receipt.json`, `loop-launch.jsonl`, `mailbox-loop.log`, `router-loop.log`; results `final-description-mailbox/2026-09-30_152551/results.json`, `final-description-router/2026-09-30_152551/results.json`.
- Guard SHA256 `53867699d6f1af0321a03549c68ef9d37f15e725a5a55221d13fb33502279566`; run_loop SHA256 `0e843320d5dd91e2a42cdf89d9e0eed0980a8fd60357ebe5e1fc4b91d3a33cb2` checked in every adapter process and after loops.48selection CLI calls plus adapter preflight,49owned workspaces, all recorded PIDs/paths absent. Wrapper/import-adapter/scratch directories removed; inert audit sources retained. No server needed.

## Remaining boundaries

- No live mailbox journey or public release in this local skills lane. Root owns product release/acceptance. Published SDK freshness remains a separate release gate; candidate source is not publication proof.
- Both descriptions unchanged; exact4existing generated plugin copies remain byte-identical. Root lifted prior overlap hold after owner released lease. No MAIN/other-worktree/freshness-file mutation.
- Parked: mailbox held-out campaign false selection; case10 immediate-send omission conservatism; unisolated historical scores invalid. Worktree artifacts pre-existed as real local directory rather than MAIN symlink; breach surfaced to root, paths preserved rather than relocating another session state.

## Source identity and status

Skills HEAD `be7a4670d04ceb481fed4de1457c53d4e2295fee`; docs candidate HEAD `6d33f4703a6ea7afe4e28dd22404e8ea15c97401`; SDK candidate HEAD `5946a8fbccf4125bdb333685dbdefa881293a09a`. No skills lockfile; local macOS.

Candidate snapshots: docs app SHA256 `4b7078e0e4ed9044b2fd88da5d4079803414569b8d525636622704fa4863256f`; Sending `c1f82f9b8944026571d9e66ae84d4bef90e6c575cc8a57127afcdc6e90aa7b0e`; SDK CLI operations `75648b5b89589cc67af768ccb3d884cc1534f61ae93e161bfe764a4bcdb742b3`; MCP contract `56890d1dff6806a1a8aa16bc137da4109651027ede685c0db51552426b9c6e5d`.

Status: coded locally, not merged/published. Final changed-file hashes: `.claude/artifacts/monid-readiness-skills/final-source-manifest.json`. No new prose rewrite, push or release authorised.

## Current source-commit preparation — 2026-10-03 14:29 AEST

The sections above retain their original 30 September source and evaluation provenance. They do not certify this reconciled candidate or its amended MCP setup/eval hashes.

- Current skills source base: `34edb755108fed239db4f79b6b71691c629b1c25`; exact accepted 18-path source manifest preserved in MAIN Sendmux `.claude/artifacts/monid-readiness/skills-reconciliation/reconciled-source-manifest.json`. Product source committed normally as `6348d5722792131579866d53a9cebd278d38bb5a` at 2026-10-03 14:27:22 AEST; SDK source `7e867c5bd7b7c85add27c7c04e036997ae57dbc4`. This preparation follows that product timestamp.
- Current source bindings: docs checkout `sendmux-docs-monid-readiness-current-20261003`, SDK checkout `sendmux-sdk-monid-readiness-current-20261002`; app OpenAPI `90143520564077283dddf9bcc7d11d73083befd7873107138cf64fa4d1a24bcf`, Sending OpenAPI `c1f82f9b8944026571d9e66ae84d4bef90e6c575cc8a57127afcdc6e90aa7b0e`.
- Source-only metadata correction preserved released 2.1.3/54 as historical guidance; 2.2.0 describes local candidate metadata and does not imply publication of changed-source features. The 64-tool changed-source catalogue remains unpublished; protocol revisions, grant-visible subsets and uncertified-client qualification remain intact. Older published 2.2.0 bytes cannot certify this candidate.
- Actual red-to-green: current-bound static drift failed solely with `MCP package identity/version guidance drift`, then passed after the reviewed correction. Existing generator, plugin check and independent push/pull-request path-filter check exited 0. Three targeted Node suites passed 44 tests, zero failures/cancellations/skips/todo; 27770.193791 ms. Compatibility tests use isolated fixtures, not real release acceptance. No assertions changed in this correction.
- Canonical and generated MCP setup SHA256 both `180839dcaf9a94b9a895912bf1760e61e5fce6ca1d31172b734da44d08731910`; eval fixture `2fafad40c9ff553b135946b0084bbbb8d3059d6dddda4b3393978737a6cc6672`. The unchanged builder generated the mirror. Original 18 candidate files remain archived byte-exact; other 22 generated files and all 66 tracked compatibility/review/export/evaluation-related files remain unchanged. Immutable SDK acceptance pin `4b245f66d78068d7c326fb184887ffa7fc033feb` preserved.
- Humanisation: skipped — agent-only instruction; generated mirror; eval fixture. This correction changes prose, not merely metadata. Explicit exemption: current docs `automation/docs-authoring-workflow.md:61–65`; owning precedent `evidence/category-skills-20260930.md:66–68`. Manual factual, Australian-English, identifier and hash review completed; no paid rewrite or detector-pass claimed.
- Source commit is development-only. No configured `core.hooksPath`; the default hook directory contains only sample hooks, so no active local commit hook was found. No hook changed or bypassed. Existing exact-input green source checks remain evidence; commit preparation does not repeat them or run immutable release acceptance.
- Remaining gates: owning validation/package/install parity; exact committed producer exports and final approved package versions; matching skill reviews/workflow acceptance; API-first deployed acceptance; exact merge/publication approval and GitHub/ClawHub/site-sync readback. No current model eval, live journey, push, merge or publication claimed. Local skills 1.7.0 stays a development baseline; older public skills 1.7.1 stays historical readback.

Current logs, byte-preservation snapshot, exact commands and release boundaries: MAIN Sendmux `.claude/artifacts/monid-readiness/release-current-prep/skills-local-commit-prerequisites-20261003/applied-handoff.md`, its adjacent logs and `preserved-old18/snapshot.json`. Parent owns the global release ledger and exclusive heavy-test host.
