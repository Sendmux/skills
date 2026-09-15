# Task 5b — MCP 2 skill content, contract and distribution evidence

Recorded 2026-09-15 10:28. This is local candidate evidence for `agent/mcp-2-modernisation`, based on Task 5a HEAD `d71f6ef12610357006250f0de6be80b70acd05bd`. It is not a publication, deployment or live-service certificate.

## Current status

The nine-skill content, offline, discovery and local distribution matrices are accepted. Independent final re-review at 10:27 approves the local candidate, with no remaining Critical or Important finding. I1's request-versus-response and per-publishing-skill authority escapes are repaired and regression-tested; M2's additive-assertion record is reconciled. Accepted skill, eval and generated-package bytes remain unchanged by that repair. M1 and all final release/live gates remain open.

Local acceptance is against SDK candidate `46c36fe4e23d6c8432a63a7548fa396a8079e4bf`, whose package reports candidate `sendmux-mcp` `1.8.0`. This does not establish the final `2.0.0` pin, registry publication, deployment, live credentials/uploads/delivery, client certification or future model reliability.

## Correctness trace

1. Package-owned contract input: SDK `packages/python/mcp/sendmux_mcp/mcp-contract.json` SHA-256 `8912880a415158c6c3e028ae2a3cfde702ba1382c8b2575d71f67eed719d2014`, plus package-owned App/Sending OpenAPI and generated CLI operations.
2. Contract reader: `scripts/check-skill-drift.mjs:221` reads named package/protocol/hosted/tool/upload fields. Its semantic guards check publishing locations, two-way MCP `file_path` drift, sync, SDK envelopes, recipients and Management request bodies; the final Sending authority repair at `scripts/check-skill-drift.mjs:568` derives the returned field and rejects request-side contradictions per publishing skill.
3. CI seam: `.github/workflows/skill-drift.yml:23,33,75` includes and runs `scripts/check-skill-drift.test.mjs`; `scripts/check-workflow-path-filters.mjs:41` requires that reader for both workflow events.
4. Source-to-distribution seam: `scripts/build-plugin-bundles.mjs:222-277` derives plugin runtime files from canonical skills; `scripts/build-openclaw-bundle.mjs:156-217` derives native YAML metadata and one-file skill output; the canonical skill-creator packages each source skill.
5. Content evidence: MAIN `.claude/artifacts/mcp2-task5b-current-nine-matrix.gLVJpH/inventory.json` SHA-256 `f2401a8c1c06b62253ca1a1fd911da898caf1e8ca4188b7a7a0b4ec5440ed569`; ROOT `66c2b8` independently matched all 27 source/eval/trigger hashes, the 59/315/62 inventory, eight unchanged siblings, retained controls and Token history/scalars.
6. Distribution evidence: MAIN `.claude/artifacts/mcp2-task5b-distribution.UufxOg/root-final-verification.json` SHA-256 `b5d69d7bdc5154593be8c349c273b93fdc20997727f3e1ad5525f16af28d7fa4`; ROOT `269c72` independently matched all source, plugin, archive, OpenClaw and install bytes and exact cleanup handles.

## Content and discovery matrix

All nine current content sets pass 315/315 exact grading texts across 59 cases. All nine retained offline sets are accepted. All nine current YAML-decoded description scalars pass 62/62 discovery queries with 183/186 individual first decisions.

| Skill | Content | Discovery | Offline |
| --- | ---: | ---: | --- |
| `sendmux-attachments` | 51/51 | 8/8 queries, 23/24 decisions (`8fytT1`) | accepted |
| `sendmux-cli` | 32/32 | 6/6, 17/18 (`qzxYsJ`) | accepted |
| `sendmux-email-for-agents` | 42/42 | 10/10, 30/30 (`w7OqOe`) | `KpekSN` accepted |
| `sendmux-getting-started` | 27/27 | 6/6, 18/18 (`U9cMBB`) | `lGuLfW` accepted |
| `sendmux-mailbox-agent` | 31/31 | 5/5, 15/15 (`pCjTDA`) | `lgUpK5` accepted |
| `sendmux-management` | 22/22 | 6/6, 18/18 (`8qRMRO`) | `3HKkge` accepted |
| `sendmux-mcp-setup` | 44/44 | 8/8, 24/24 (`sB4Bt3`) | accepted |
| `sendmux-send-email` | 31/31 | 5/5, 15/15 (`va5F7L`) | accepted |
| `sendmux-token-efficient-usage` | 35/35 (`IOtxJA`) | 8/8, 23/24 (`htzkvt`) | `1KDE2B` accepted |

The three retained individual misses are Attachments, CLI and Token. Token's miss is the email-writing negative selecting 1/3 times, below the unchanged `<0.5` negative threshold. Query-level acceptance is not 100% individual classification.

Token `htzkvt` confirms the exact 951-character, two-newline YAML scalar `5aeda543ebcbceaee046d56dd555a293017296c589ce53aae363a3b5187c2f42`; ROOT adopted only that description at current source SHA-256 `18daf8229e13c9562ce67bf77a5835ebfde702996bcedaef9088f254a49cc1fd`. Body, other frontmatter and three source files remained unchanged. Historical `idL3Fp` remains measurement evidence, not current routing authority.

Description parity uses native YAML decoding and the named exact override. The lightweight canonical `utils.py:parse_skill_md` quote stripper does not decode YAML escapes; this pre-existing verifier limitation is parked separately and is not a Task 5b product/source gate.

## Immutable evidence qualifications

- Final review M2 is reconciled by the 2026-09-15 10:24 source-accuracy amendment to the task brief: additive CLI case2/4 and MCP Setup case0/1/2/4/5 guards address observed errors and existing secrecy requirements. Original prompts, IDs, assertions and historical grades remain preserved except the separately adjudicated fields; later criteria use labelled projections. The pre-amendment brief is `.claude/artifacts/task-5b-content-brief-pre-final-review-amendment-20260915.md`, SHA-256 `5b726166d44ae2391dcf42cf437f18555983c6260323120f0b85dc8850a6c155`. No new provider run or retrospective approval is claimed.
- Original 49-case and six-new-case old/control observations remain immutable; approved prompt/assertion corrections and revised-rubric projections are separately labelled, never rewritten into historical GREENs.
- The historical Mailbox trigger RED remains preserved after its approved one-fixture correction with synthetic IDs and an explicit batch task.
- Retained offline aggregates compare one observation per case/arm and, for Token, multiple historical source snapshots. They are descriptive, not repeated-trial, timing-causal or reliability evidence.
- Description optimisation and exact-candidate confirmations are finite current-corpus results. Held-out-informed corrections are not blind generalisation evidence.
- Content runs are documentation-only. They do not prove API execution, authentication, upload bytes, permissions or delivery.
- Raw provider transcripts and secret-bearing material remain in private ignored artifacts and are not copied into this public evidence file.

## Added tests and observed REDs

Added `scripts/check-skill-drift.test.mjs` with these eleven public-CLI behavioural tests; removed none:

1. `distinguishes negative proof-of-work guidance from obsolete instructions` — genuine REDs for accurate negative text and later wrong-subject `but`/`and` escapes are recorded in `.claude/task-5b-drift-false-positive-report.md` SHA-256 `0b96bba320cf69297ac318448d23778750abf952a3eab4c780d09cceaf130ed6`.
2. `accepts a direct attachment upload using fenced stdin curl config` — genuine RED: current accepted stdin-config example was rejected as missing Direct HTTP upload; same report.
3. `requires complete command-local direct attachment upload evidence` — genuine REDs: named-header URL/Content-Length and binary-body-in-header decoys passed the first recogniser; same report.
4. `requires usable MCP contract fields without trusting compatibility aliases or declared totals` — genuine REDs for missing `protocols`, malformed hosted transports, null/malformed tools and declared-count aliases are recorded in `.claude/task-5b-drift-contract-report.md` SHA-256 `e31790de20ed7452bde32f1cc02b6982e7a20a84836e5c798f729c250a3a207e`.
5. `matches MCP contract fields only at their publishing locations` — genuine REDs for changed package identity, shortened ordered protocols, unexpected surfaces and upload-mode publication drift are recorded in the same contract report.
6. `keeps MCP file_path guidance aligned in both contract directions` — genuine RED: adding `file_path` to the copied MCP input schema exited 0 before the two-way guard; same report.
7. `derives CLI surface counts separately from the generated operations manifest` — genuine RED: changing one generated Management operation surface exited 0 before the independent CLI-count guard; same report.
8. `guards the documented sync, SDK envelope, throwing, and recipient semantics` — genuine RED: removing the typed multi-resource command exited 0 before the semantic guard; the same report records the 13 final independent mutations.
9. `validates the documented management:create-mailbox-key JSON body against OpenAPI` — genuine RED: replacing `app_name` with `name` exited 0 before the OpenAPI-derived body guard; same report.
10. `requires authenticated SDK clients and response envelopes at dereference sites` — genuine REDs for removed Management client, wrong Mailbox envelope, non-throwing snippet call, always-true empty guard and `undefined` conditional headers are recorded in the same report.
11. `requires the Sending response size authority in each publishing skill` — original false PASS failed the regression as `sendmux-mcp-setup returned field: 0 !== 1`; a first incomplete repair failed as `sendmux-send-email response relation: 0 !== 1`. Final coverage independently renames the returned field and changes the response relation in all four publishing skills, leaving siblings correct. The existing publishing-location test also records `Sending limit authority remains the upload intent response: 0 !== 1` for the contract mutation. REDs are `.claude/artifacts/task5-final-fix.FjyEwn/slice-1-red.log` (`e00c72d2acb45b5ab582fd4124782c0d7ef799a07558dd58c6e7b13cbca2ea53`), `slice-2-red.log` (`e0319953ed04796c5cc6172de3e21089a5aa394c0c214ae9f816f45a55b8b0ab`) and `slice-2-attempt-1-failed.log` (`62af1e50433b3620a1b06856a4af913819946485e228370a6f20c73fe3409df7`).

The existing `agent skills and evals describe 5 GiB as the owner-approved storage floor` test was repaired, not added. Original RED `.claude/artifacts/mcp2-task5b-distribution.UufxOg/root-storage-red.log` SHA-256 `c5442225904b970be36583dea5c445b6f20f18a5a4e4e249b00c19fc3c5a6c94` failed on Mailbox; first incomplete correction `.claude/artifacts/mcp2-task5b-distribution.UufxOg/root-storage-attempt1-red.log` SHA-256 `44c52c3cf0daf8651f313665f63d177ef0ccc22d9be852bc331352ef749bd39c` failed on Send Email. The final recogniser accepts exactly the three equivalent current revocation phrases without weakening the no-permanent-floor invariant.

Test prune: the eleven new tests exercise the real checker executable against copied boundaries and named exit diagnostics; they do not mock the checker or merely pin call shape. The storage test is a deliberate source-guard exception: `scripts/agent-storage-floor.test.mjs:20-24` names regression `dba9ca4` and remains the only direct cross-skill check that sending revocation does not promise a permanent storage floor. The existing workflow test retains unique invocation coverage despite partial overlap with path-filter checks. No test was removed or skipped.

## Verification

- All SDK-dependent commands use `SENDMUX_SDK=/Users/rj/Desktop/GIT-REPOS/sendmux-sdk-mcp-2-modernisation` at the exact frozen pin.
- `node --test scripts/check-skill-drift.test.mjs`: final 11/11, skipped 0; log `.claude/artifacts/task5-final-fix.FjyEwn/focused-drift-green.log`. The earlier ten-test receipt remains preserved, not presented as final coverage.
- `node scripts/check-skill-drift.mjs`: final PASS against frozen candidate SDK and current corpus, independently rerun by ROOT after the I1 repair.
- `node --test scripts/build-plugin-bundles.test.mjs`: 9/9, skipped 0; workflow filters pass for pull request and push.
- A full-suite call without the required `SENDMUX_SDK` correctly failed against old MAIN paths (`25/34`, nine failures including missing `mcp-contract.json` and CLI agent sources); `.claude/artifacts/mcp2-task5b-distribution.UufxOg/root-full-suite-wrong-sdk.log` SHA-256 `83d74ac46e07fe1d95a1bbb3d53d14e835b83180c07ddb2006f4b0f15014a61a`. No source workaround followed.
- Exact pinned command `SENDMUX_SDK=/Users/rj/Desktop/GIT-REPOS/sendmux-sdk-mcp-2-modernisation node --test scripts/*.test.mjs`: 34/34, failed 0, skipped 0; ROOT `acf51a`, log SHA-256 `47db43863cccd4b1e38a20567542a2249d2068e475e7c74c1ed5c0aacf2625cf`.
- The same exact command after I1: independent ROOT session `66588` exited 0 with 35/35, failed/cancelled/skipped/todo all zero. `.claude/artifacts/task5-final-fix.FjyEwn/root-full-suite.log` SHA-256 `8f9608955873b8f58ff625f3ba0c515b1cdee8c220a54ba75bd06479acb2ded9`; duration 9307ms. The prior 34-test result remains pre-I1 history.
- Nine canonical source validations, real pinned drift, plugin generation/check/parity, OpenClaw generation/check, packaging, 18 install validations and `git diff --check` passed. This is local candidate compatibility only.

The full final review package is `.claude/artifacts/task5b-final-review-20260915-1015.diff`, SHA-256 `0ab72f668f5250df20d4cd12d0e193f8b275b175e3b5460ff43072447ccb080e`; final narrow repair is `.claude/artifacts/task5-final-fix.FjyEwn/final-two-file.diff`, SHA-256 `65fc0d63f44cee9f8c1aa5d518da9a571e4237a92dae7581fbaa9ba48de34151`. The 10:27 re-review in `.claude/task-5-final-review-report.md` approves specification and quality (9/10), independently replays both original mutations to the required exit-1 diagnostics, and closes I1/M2. M1 is retained below.

## Package and install evidence

Artifact root: `.claude/artifacts/mcp2-task5b-distribution.UufxOg`.

| Archive | SHA-256 |
| --- | --- |
| `dist/sendmux-attachments.skill` | `3fe491d69413c6b842ba4d9006bd3ce125cbe3a90972d5833f41d16bd3213007` |
| `dist/sendmux-cli.skill` | `265b77a1cba31f1f400630be1d07ef10e2fb746ae9a33261e027bef1bb90c806` |
| `dist/sendmux-email-for-agents.skill` | `bff5fd69123984e76385db7608763c302e4b1257400902c31b09d736f5d3bf9d` |
| `dist/sendmux-getting-started.skill` | `03364a88d7843a8a9851602154486fbdce48ff80952a841733b4d606e5537b3c` |
| `dist/sendmux-mailbox-agent.skill` | `48f54826f9334280730d6bf7a58b2d9639b97d63f970b4744a2deb855cac875b` |
| `dist/sendmux-management.skill` | `b15c6ec7698901128d47bbf4bf1512a75168da66105a59228d501e4d6a2711e9` |
| `dist/sendmux-mcp-setup.skill` | `cd6c5fb60788287a9553a020a6122f327a2126517c70e9f1bbb6a3f25f01c162` |
| `dist/sendmux-send-email.skill` | `5440a43643a23f8d1ca6af38e5b0d46ccab4ef128880419defbc0f3666698c4c` |
| `dist/sendmux-token-efficient-usage.skill` | `a77168582d24ad4d8b6c3920773b64256f26195453dd3f61f34c879268f3df1c` |

ROOT verified 32 source files; nine archives; 14 source/archive/plugin runtime-member triples; nine native-YAML OpenClaw metadata/body/account-note transforms; 18 Claude/Agents install receipts and 18 absent validation PIDs. The exact owned install root was removed. Across both full-suite attempts, distribution and test runs, 257 exact temporary paths and 84 exact PIDs were verified absent. No broad process search or guessed cleanup was used.

## Remaining gates

1. Complete Task 5b local commit handling and coordinated remote PR review. The checker repair and independent local review are accepted.
2. Re-read regenerated distribution when release inputs change; the accepted checker/test-only repair requires no package regeneration.
3. Keep the current 32 source hashes and finite evaluation qualifications attached to the candidate; ROOT rechecked their exact parity after I1.
4. Task 6 supplies the immutable final SDK/registry `2.0.0` pin, resolves its SDK/CLI source slices, reruns final matrices, and owns publication plus downstream distribution propagation.
5. Verify public tag/release/registry/ClawHub/site state, deployed/live attachment/auth/delivery behaviour and run-owned cleanup. Atlassian UI acceptance remains operator-run.
6. Resolve final-review M1 before public publication: change Token's `optimizing` to repository-required `optimising` and confirm that exact description with its full eight-query discovery set before adoption. The accepted current scalar remains frozen until that release-stage step; no changed wording is claimed measured.

Cleanup qualification: the earlier Task 5a OpenClaw temporary build lost its exact suffix after a shell cleanup failure, as recorded in `.claude/task-5a-workflow-report.md` and `.claude/task-5a-review-2.md`. Its removal is unverified; later exact-handle cleanup does not prove that unknown directory absent. The separate denied teardown of `/tmp/sendmux-ai-peers.hAqYpO` also remains a manual handback. No guessed path or broad deletion is authorised by these records.

## Completion checkpoint

⏸ Local candidate reviewed; publication and deployment pending.

Correctness: content/discovery and distribution matrices independently pass; I1's checker-only class and M2's record alignment are closed by independent re-review.
Tests: `+scripts/check-skill-drift.test.mjs` (eleven named public-CLI tests, each with recorded RED above); `-none`. Final full suite 35/35, no skips; existing storage guard retained for regression `dba9ca4`.
Journeys: not applicable to this local documentation/evaluation slice; live upload/auth/delivery and Atlassian UI remain Task 6 gates.
Evidence: this file plus the named ignored matrix, drift and distribution artifacts; private raw transcripts excluded.
Status: local candidate compatibility only; not published or deployed.
Torn down: prior 18 install PIDs/root plus 257 exact test paths and 84 test PIDs verified absent by ROOT `269c72`; final I1/root runs separately verified 285 exact paths and 64 PIDs absent. These overlapping run sets are not added together. Historical unknown-path/denied cleanup remains qualified above.
Parked: canonical lightweight YAML escape decoding limitation; unresolved historical cleanup. Required release gates: M1 exact description, final `2.0.0`, publication, deployment, live and manual acceptance.
