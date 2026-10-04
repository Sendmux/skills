# Four-skill workflow evidence adoption

Goal: Deploy complete Sendmux agent-email workflows, publish matching API/tooling/docs/skills, and submit a tested Monid connector PR; Monid controls final listing.

Status: local evidence, source review and four real producer-bound workflow records; no compatibility acceptance, package, install, release or publication claim. Reviewed source is `51f9d21b56f92887b6ea145366aca1dc116aef75`; baseline is `be7a4670d04ceb481fed4de1457c53d4e2295fee`. Pre-existing dirty selector map before this adoption had SHA256 `751aa20d53c8c9867f09be839ba572f3b72bf7f011e503dcfe9f21e0125fc8ae`; its dependency selectors are retained. Only release-input bindings and four additive workflow-review entries change.

## Immutable adoption

New root: `evidence/skill-compatibility/evaluations/monid-20261004/`.

- `three-skill-packet/` copies all 39 original files from MAIN Sendmux `.claude/artifacts/monid-readiness/release-current-prep/skills-workflow-review-prep-current-20261003/prepared-evals/`, including original responses, metadata, grades, receipts, null timings, benchmarks, provenance and source manifest. Manifest SHA256: `eac9104f7ba5e1ebdb665c59f32680ce737fb9b1f938222cc5ff8e47100605f2`.
- `sendmux-mailbox-agent/` copies all 45 original files from `release-current-prep/skills-workflow-current-20261003/sendmux-mailbox-agent/aggregate-evals-7-8-10-11/`. Benchmark SHA256: `0d01f12f678832c2053bd2acbb72da312fbbcc1259fe8ef06b431f30583d2c49`.

Read-only adoption check exited 0: exact source/destination relative-path sets and SHA256s for all 84 files; mailbox integrity copy hashes; metadata assertions equal grading assertions; each benchmark run equals its grading expectations; current assertions all pass; unavailable timing/token/tool-call metrics remain null. Original source manifests retain their original absolute roots as provenance. Benchmarks remain immediately above their eval case directories, as required by `scripts/skill-compatibility.mjs:289–305`.

| Skill and exact cases | Current | Old | Observed distinction |
| --- | ---: | ---: | --- |
| CLI standalone upload, eval0 | 6/6 | 5/6 | Old answer measures bytes but omits Content-Length. |
| Agent-email router, eval7 | 5/5 | 1/5 | Old answer lacks persistent editable reply and exact saved-revision approval/administration routing. |
| MCP setup, eval7 | 4/4 | 2/4 | Old answer lacks candidate version/catalogue distinction. |
| Mailbox, eval7/8/10/11 | 19/19 | 9/19 | Saved reply, uncertain send, schedule cancellation/edit/send and attachment-text polling. |

Totals are assertion counts across seven paired cases, not independent repetitions: current34/34, old17/34. Three-skill runs used current-three then old-three waves; the proposed paired-wave chronology was not used. Mailbox grading has mixed provenance, including honest root-inline grading and reused eval8 old output. Original receipt qualifications remain authoritative. Host model identity, separate IDs, whole-task duration, token counts and complete transcripts/isolation audits are unavailable. No performance or repeatability conclusion follows.

## Source review

This review compares changed instructions, unchanged owning assertions and their actual graded outputs. It does not replace producer contract inspection or independently regrade the mailbox runs.

- CLI `skills/sendmux-cli/SKILL.md:126–135,245–256`: catalogue is explicitly unpublished; upload measures byte length and passes Content-Length with command-first profile syntax. Owning standalone-upload eval0 tests byte length/header, profile/query/body flags and upload without send. It does not test catalogue reporting.
- Router `skills/sendmux-email-for-agents/SKILL.md:22–24,47–60,119–128,150`: routes saved/reopenable replies to mailbox guidance, preserves approval of the exact saved revision, separates administration and sending authority, and adds attachment-text routing. Eval7 exercises the saved-reply/approval/provider-authority branches. Attachment-text routing has no direct router-specific case; mailbox eval11 is downstream evidence only.
- Mailbox `skills/sendmux-mailbox-agent/SKILL.md:222–254`: distinguishes persistent draft identity/revision from immediate send, draft-write from send permission, and connected account from authority; reconciles uncertain sends on the same draft. Cancellation/read/edit/fresh-approval/send preserves both revision counters. Extraction checks pending/status/outcome, preserves original-download fallback and untrusted-content/byte bounds. Eval7/8 cover saved reply/uncertain reconciliation; readiness eval10/11 cover cancellation and extraction. These are explanation-only outputs, not actual sends, schedules, extraction or billing acceptance.
- MCP setup `skills/sendmux-mcp-setup/SKILL.md:35,59–69`: separates historical released2.1.3/54-tool guidance from unpublished candidate2.2.0/64-tool source and credential-visible subsets; client examples remain documented configurations, not certification. Eval7 checks that distinction and protocol/client qualification. This review verifies the instruction/answer distinction, not currently published package availability; changed package bytes require the owning new-version release process.

Whole-skill digests include every committed file under each skill, using the owning sorted JSON hash algorithm (`scripts/skill-compatibility.mjs:14–24,238–245`). Direct Git-object read-only computation exited 0:

| Skill | Previous whole-skill digest | Current whole-skill digest |
| --- | --- | --- |
| sendmux-cli | `276b34a4d99df580fe1322117feba5bfda96bf86a6ba755766d2fe4d8f975510` | `9b16a314a4abaff01fa663caabe6fd5f7583d626b63609b1e81cfc182103e1be` |
| sendmux-email-for-agents | `b954dac79d49b818d65b2dc4e6218427777292fc48328453fe5101fb8f3895b6` | `e592c53c7ef318d084407714719a4e07ab0d18ef5240f502048af95071a7d2e1` |
| sendmux-mailbox-agent | `7caa769e30408f23404ead3b3f427368ca715a09d8bc6c38d61e92ea23a2e3d3` | `7e91fe7dccb80deb333d6d1f2dc8eecc695d44a81fd46cffcd6a160f9f446eaf` |
| sendmux-mcp-setup | `330558950dc6569b802ab1c642b61927ca369d9fe3c151025a7643c0cfc9bf06` | `1aaadcb310878ed6b05850e889f5456fb5a55b8cea4b9ea6f454db518115130a` |

## Static viewer qualification

Canonical `python3 -B .../skill-creator/eval-viewer/generate_review.py` with each adopted workspace, `--skill-name`, its unchanged `--benchmark` and `--static` output under MAIN `release-current-prep/skills-evidence-adoption-current-20261004/` exited0 for CLI/router/MCP and exit1 for mailbox. No server/browser/install/network was started. Toolkit SHA256: `fc9d1b9243fe5ab6012ebd579bd76d0035de1b79fd3b969de114defab26478fb`.

Mailbox error: `generate_review.py:64`, `TypeError: '<' not supported between instances of 'NoneType' and 'int'`. Toolkit `build_run` reads metadata at run or configuration level, while some preserved cases have case-level metadata; the aggregate mixes absent and numeric discovered IDs. The three generated viewers also need prompt-embedding inspection because their metadata is case-level. Viewer generation is not viewer acceptance or human feedback. Toolkit, original metadata, null metrics and aggregate were not edited to make rendering pass. No owning acceptance is claimed from these viewers.

## Exact producer-bound construction

Six canonical producer export/policy/receipt files are copied byte-exact into `evidence/skill-compatibility/contracts/monid-20261004/`. Actual revisions: app `5000ba2ec29cb1c399921aa9aa19f7df04fb92f5`, sending `2c324361e353bd4abcd399b6e19be1855deebe5b`, SDK `7e867c5bd7b7c85add27c7c04e036997ae57dbc4`. App OpenAPI SHA256 `90143520564077283dddf9bcc7d11d73083befd7873107138cf64fa4d1a24bcf`; app policy `5778c054085df07a0d4e265f340285f57a12805fc7a0fcc5d1f6d6d701b07192`; sending OpenAPI `eb69dc0ca27e5f42cd9da70e90e2b1a386dfe588b743e47a8d91f3b7928a75e5`; sending policy `f283c265c300dc3f1a313d436a698866c1f6cd9fe15ba7eb73bd1085c172498a`.

The app runtime policy retains a historical supplied snapshot, not a fresh live policy query: values SHA256 `9f15d58d5b20b72cbb6ba171802854295aac48d92d4e434e7201f93551279580`, snapshot `8e6ddddcf5c3bb3b298583a0b09aed48ec305593c1ea28878fd3ae6ff4da8d50`. New source export does not certify current live runtime policy or deployment.

Canonical read-only `node scripts/skill-compatibility.mjs --inspect-candidate` with the real descriptor and `--inspection-map skill-compatibility.json` exited0. The descriptor is MAIN `release-current-prep/skills-evidence-adoption-current-20261004/candidate-source-inspection.json`; it inspects committed source objects at the revisions above, with uncommitted intended selectors. Four exact selected contract digests:

| Skill | Contract digest |
| --- | --- |
| sendmux-cli | `2da62662eb0ead5cddc91483390b4208519bb3efc15d95c8d121b9af876d93c9` |
| sendmux-email-for-agents | `12e578810ce86be42728569f74b240e688a10caa84c647fe0c86af57192ade25` |
| sendmux-mailbox-agent | `dbbb873d2752bc5587c229bf40bc8de96239e28ff880fcbaf891e8eea7ad0356` |
| sendmux-mcp-setup | `671efc8a465da5dfbb98ea60c08f0f08c1f214dff2b2971055cd0583a0f77d9d` |

New records are `evidence/skill-compatibility/reviews/monid-20261004/<skill>.json`, with real current/previous whole-skill digests, selected contract digest, source revisions, reviewer/rationale and hash-bound source, this note, six producer artifacts and complete adopted per-skill evidence. Existing historical reviews remain unchanged. New map entries bind each exact new review-file hash; release inputs point to the six new committed-source exports and SDK source revision. No provisional digest or old-export substitution is used.

Pending: commit exact selector/evidence/records through normal hooks; use owning `prepareCandidate` on that committed source and perform full owning compatibility acceptance only when parent permits it. All seven unchanged skills also have new selected contract digests and need truthful compatibility/source reviews; four workflow records alone do not close11-skill acceptance. Confirm the four whole-skill digests remain unchanged; any guidance/version amendment reopens its affected evaluation.

Parent owns complete relevant workflow/trigger checks, package validation and install parity, final released SDK/package identity, exact version approvals, normal source/CI review, publication and independent version/hash readback. Static viewer repair/inspection and human feedback remain open. Historical11-skill acceptance does not certify these amended hashes.

No skill bodies/public content/version, historical evidence or dependency selectors changed. Only additive evidence/reviews/export copies and map review/release-input bindings change. No new model evaluation, owning compatibility acceptance, full suite, runtime/build/container/credentials/commit/push/publication. Unrelated MAIN dirty work preserved.

Tally: 1 fixed-local / 6 investigating / 1 open / 0 shipped.
