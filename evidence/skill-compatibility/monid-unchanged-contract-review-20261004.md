# Seven unchanged skills: independent source compatibility review

Reviewer: Codex independent source reviewer, `monid-seven-skill-contract-review`.
Reviewed: 2026-10-04 18:33 Australia/Melbourne.
Result: seven compatible; zero source-contract blockers. Recommended new record kind: `compatibility` for each of these seven, with current source revisions and exact current skill/contract digests below. This report is private review evidence, not a canonical acceptance record.

## Immutable inputs and scope

- Skills: `/Users/rj/Desktop/GIT-REPOS/sendmux-skills-monid-readiness-reconciled`, proposed `51f9d21b56f92887b6ea145366aca1dc116aef75`.
- App: `/Users/rj/Desktop/GIT-REPOS/sendmux`, `5000ba2ec29cb1c399921aa9aa19f7df04fb92f5`.
- Sending: `2c324361e353bd4abcd399b6e19be1855deebe5b`.
- SDK: `/Users/rj/Desktop/GIT-REPOS/sendmux-sdk-monid-readiness-current-20261002`, `7e867c5bd7b7c85add27c7c04e036997ae57dbc4`.
- Current exports: skills `evidence/skill-compatibility/contracts/monid-20261004/`; historical exports: its parent directory.
- Historical reviews: skills `evidence/skill-compatibility/reviews/<slug>.json`, binding app `043544c168faf3124893358bacb0d54042af238b`, sending `214f87fbfa5d2016dbc77bee343776675a55996f`, SDK `5c08efe9194081e67b0167a556ce46e6369fe549`.
- Current inspector: sibling `skills-evidence-adoption-current-20261004/inspection-before-review-adoption.json`; descriptor: `candidate-source-inspection.json` beside it.

The reviewed seven dependency selectors are structurally identical in committed proposed source and the current working map. The map's other four entries are outside this review. “Unchanged” means unchanged against the historical reviewed whole-skill digest, not necessarily against published `be7a4670d04ceb481fed4de1457c53d4e2295fee`.

Read all seven bodies. Independently hashed every committed file under each skill, including evals and agent metadata, with default sorted-key stable JSON matching `scripts/skill-compatibility.mjs:236-246`. All seven match their historical whole-skill digests and inspector entries; every working file matches the pinned committed bytes. An initial diagnostic used locale sorting; it was corrected to the checker's default lexical sorting before the findings below. No content mismatch exists.

| Skill | Tracked files | Body SHA256 | Whole-skill digest |
| --- | ---: | --- | --- |
| agent-email-inbox | 3 | `2a5be98e2eaeb92707b3d20e2a6a9bb81d4e20e212a7b22856f73dedb0d31b1a` | `74d2bc70ac8f182249bd78caec0dbd213ef7f9357541cbdacdc17167219abbf7` |
| email-for-ai-agents | 3 | `00166b24a755bb9af2492e567be94ee0340b19007293cbc6cbcc02042326b46e` | `eb668c43d4c594ea0e70a59e0c6fb8dc75bed7c3244d0ad706afd2ec770f3060` |
| sendmux-attachments | 5 | `bf4b381efd3e89afef46464c0b68b948bfd3bc8eb69a6d3993fad8ae3dca77e2` | `1683e3417d4184809ecf349175a16271bb8a8c942b7ada148b8831a1e2872af6` |
| sendmux-getting-started | 3 | `d705868beeb1275d912c2cf81c879ae53457db04f65561c17c304562b443c6ac` | `5029bf05c88abc8c25680cbd4a1cb7e311668752478c295f984f491a4781d556` |
| sendmux-management | 3 | `04719fe232f6f06a2bea78bac953f4b3fb1738776e1928e5142065e9d430a080` | `497f5468ad5a842c9d26e2580851df58e25a24a4465f08a0ddac1b4b3cc6c30f` |
| sendmux-send-email | 3 | `0cefbfeddcf22dd0b0cd1f5c7677edcfc88a2dfc391655cdafe4232b9965d3a3` | `60fcef4c782addf56f3e67cc770e74a5e980aca007ab25b0bb3cab679776b6f7` |
| sendmux-token-efficient-usage | 4 | `dc71d5b01735a0a1c4f6d9577c719f8302f5411a66ea173e50db2c2091ed8458` | `e074ad0de774f6c45c5ee9248ebc3443291b137224cf5f0a34a0133b860e32c3` |

## Exact selected-contract delta

Used the canonical selection functions read-only, including recursive referenced schemas and security schemes, exact named public declarations, selected CLI/MCP operations, setup metadata and catalogues (`scripts/skill-compatibility.mjs:139-233`). Computed old/new selected hashes; old values equal each historical review and current values equal inspector. SDK provenance checks execute as read-only source hashes in `sdkContracts`; no producer export, test, runtime or acceptance ran. Current app/sending OpenAPI and policy file hashes independently match their export receipts.

| Skill | Historical selected contract | Current selected contract | Changed selected surfaces |
| --- | --- | --- | --- |
| agent-email-inbox | `f573c17c9d0d4fd2663127724b09e35ca9ce7f7f35650bcba9852a9592f85757` | `0da6f128dd746c936b1635b7b23730d07c8fca7faf696765b32e8589fa062cb4` | app, MCP, public declarations |
| email-for-ai-agents | `d7fd02d55bc40033d337b5deefa16ced40499e0e2969e03838ee54b2bc457f67` | `7f5fbf27a667f5885fbc5bba2a15d053c482a75b5a54793e2fa5050f60123223` | app policy, public declarations |
| sendmux-attachments | `a37569ff9e5580a288f4a448bfe41435be9cb22b6552e9147c275b67595b6925` | `8085316c08a733f4bd551320b21abaef618911a4f7cc7807599919bb8ce58591` | app, MCP, public declarations |
| sendmux-getting-started | `fa99413a1edc268536adb4739d5a1a6952e49af80987f10d8295f3086f45f53b` | `e4115a662c55b768028fd1a45348c45d8f9d76950dd64039a2af17171f9eac52` | app, app policy, public declarations |
| sendmux-management | `51e7bff500e371b6a0a97152051a308c7689346a2c739d520c4a214c5b613cda` | `456c2cb6fcb49a6f9231dad4961a2a37b5823f3a1b59412f7c465a875ad5b8c2` | app, app policy, MCP, MCP catalogue, public declarations |
| sendmux-send-email | `2d358b1ebec7165fc889c7217218c19ae13f58e51dbb5b8d89b985e0421812a5` | `55992ed17d0aeec1b5bed7abc4dd642de049167a5c71d19461535e2083d9279b` | app policy, public declarations |
| sendmux-token-efficient-usage | `ebc0852b0a585af0b82701534938bd4b5e25a2b93c835159646d418ee19dc228` | `969ac3220d07bd7eec3f6b3171b259a831e2f8efe691e6dc1cc12ba6c8f58709` | app, app policy, MCP, MCP catalogue, public declarations |

Every selected Sending operation, Sending policy group, CLI command/global flag contract, package export, Python script entry, and MCP setup contract remains identical where selected. Every selected public declaration except CLI `runSdkOperation` remains identical.

Changed contract details:

1. App OAuth scope catalogue adds `mailbox.drafts.write` (`app-openapi.json:10360`). Existing read scopes and operations remain unchanged. Attachment upload adds an alternative OAuth grant of `mailbox.read` plus `mailbox.drafts.write`; existing `email.send` remains valid (`app-openapi.json:12436-12616`; app `src/app/api/v1/mailbox/_lib.ts:73-85`). This widens an upload path, not sending authority.
2. `MailboxMessageContent.body` adds nullable `cleaned_html` and `html_cleaning` response fields, retaining original `html`, text, truncation and existing stripping fields (`app-openapi.json:4401-4487`). Cleaning is explicitly not sanitisation; limits are 20,000 elements and 128 nested elements. Selected MCP `mailbox_batch_get_messages` embeds the same additive output fields. Read arguments and envelopes are unchanged.
3. `SendMailboxMessageBody` adds max 50 to each recipient array, documents 1–50 recipients across To/Cc/Bcc, defaults subject to empty and adds max length 998; To/subject become optional in the advertised schema (`app-openapi.json:8532`; app sink `src/app/api/v1/mailbox/_lib.ts:197-229`). Selected MCP `mailbox_send_message` mirrors these input changes. Reviewed skills give valid one-recipient examples and do not claim larger Mailbox recipient bounds.
4. Webhook secret description explains both signature headers while preserving creation/rotation-only secret retrieval (`app-openapi.json:10201`); selected MCP create-webhook output mirrors it. Domain verification's DMARC description now requires a record containing `v=DMARC1` (`app-openapi.json:3231`), mirrored in selected MCP verify-domain output. No reviewed skill teaches webhook verification code or claims DMARC enforcement.
5. MCP catalogue adds nine Mailbox tools (saved-draft lifecycle/schedule and attachment-text extraction) and `management_get_mailbox_cost_usage`; no tools removed (`SDK packages/python/mcp/sendmux_mcp/mcp-contract.json:1503,2314,14752`). The seven workflows do not require exhaustive catalogue coverage or direct use of these new tools.
6. `runSdkOperation` changes binary dispatch from one operation ID to `responseKind === "binary"`, with an operation-specific error (`SDK packages/ts/cli/src/operation-runner.ts:92-101`). Existing selected command metadata is identical; JSON, file-attachment and event-stream routes retain their behaviour at :63-89 and :104-108. Existing binary attachment retrieval remains classified binary. New raw-message operations account for wider dispatch; this does not add sends or change retry payloads.

Policy fingerprints were independently recomputed using exact selector/declaration tokenisation from `ja-k8s/AA-infrastructure/k3s/scripts/skill-policy.mjs:12-60,82-89`, reading old/current committed app source. Both sets equal exported values:

- `agent-registration`: only `AGENT_AUTH_POST_CLAIM_SCOPES` changes, adding `MAILBOX_DRAFTS_WRITE` (app `src/server/agent-auth/metadata.ts:27-38`). Pre-claim scopes remain read/receive.
- `durable-mailbox-read`: same scope addition plus `origin: { type: "agent_token", publicId: row.tokenPublicId }` in `validateAgentAccessTokenAuth` (app `src/server/agent-auth/access-tokens.ts:217-223`). Validation, readiness and revocation logic remains identical within selected declarations.
- `delegated-sending`: only the post-claim scope addition. Token exchange still requires Sending resource and exact `email.send`, owner-approved grant and readiness, and issues a one-hour token (`src/server/agent-auth/token-exchange.ts:32,80-85,135-156`). Selected exchange/approval/revoke declarations are unchanged.
- `mailbox-storage`: identical fingerprint and selected declarations. Full revocation declarations also remain identical; all derived tokens and invitation handles are revoked/cancelled (`src/server/agent-auth/revocation.ts:154-198`).

Agent-registration runtime fingerprint `9f15d58d5b20b72cbb6ba171802854295aac48d92d4e434e7201f93551279580` remains the supplied September 30 snapshot. Producer export records `refreshRuntime=false` in `producer-exports-current-20261004/app-export-result.md`. This is retained policy qualification, not current production verification.

## Per-skill finding and proposed rationale

| Skill | State | Proposed compatibility rationale and instruction anchors |
| --- | --- | --- |
| agent-email-inbox | compatible | Selected read calls, selectors, filters and bounded batch arguments remain unchanged. Additive HTML-cleaning output and the new OAuth draft scope do not alter this explicitly read-only workflow: `SKILL.md:12,18-20,26-45,51-57` excludes saved-draft writes, keeps content untrusted and reports incomplete reads. CLI binary dispatch does not change its selected JSON read routes. |
| email-for-ai-agents | compatible | Selected Sending contracts, MCP request, idempotency and CLI send metadata remain identical. The post-claim draft-scope addition does not replace Sending authority: `SKILL.md:16-22,28-30,50-60` preserves separate message approval, owner gates, delegated Sending token, exact payload/attachment references and uncertain-result reconciliation. The CLI binary dispatch change does not affect sends. |
| sendmux-attachments | compatible | Existing authenticated upload/send routes, size authorities, exact Content-Length/returned headers, external byte transfer, and distinct blob_id/attachment_id semantics remain supported (`SKILL.md:16-40,46-99,103-136,140-177,235-337`). New draft-write upload alternative leaves existing email.send valid; narrowed Mailbox recipients leave all one-recipient examples valid. MCP inline/presign schemas and selected file helpers remain unchanged; selected mailbox-send input changes preserve the examples. CLI binary dispatch preserves existing attachment downloads. |
| sendmux-getting-started | compatible | Connection checks, package/factory names, profile priority, registration/readiness and delegated Sending CLI declarations remain identical (`SKILL.md:35-63,73-95,133-168,202-233`). Changed policy selectors add a post-claim draft scope and credential-origin metadata only; pre-claim read/receive access, full revocation, owner approval, one-hour token and storage claims remain source-supported. Retained runtime snapshot is not fresh live acceptance. |
| sendmux-management | compatible | Existing selected management operations, permission-specific mappings and CLI/SDK entry points remain supported (`SKILL.md:17-22,26-46,76-138,197-224,230-255`). New MCP cost-usage capability is additive; existing routing claims about provider/incoming-log coverage remain true. Domain section makes no DMARC enforcement claim. Secret retention instructions remain correct with the expanded signature description. Registration handoff/durable-access claim at :140 remains valid; changed policy selectors leave revocation and lifetime behaviour intact. |
| sendmux-send-email | compatible | Every selected Sending operation, schema, MCP send/upload tool, CLI command, idempotency and file helper is identical. Draft-scope addition does not affect owner gates, one-hour delegated token or unchanged storage policy (`SKILL.md:18-30,46-56,72-83,115-137,141-177,243-265`). Binary dispatch leaves JSON send outcomes and attachment injection unchanged. No newly required instruction change is identified. |
| sendmux-token-efficient-usage | compatible | Cost-routing calls, bounded search/batch reads, sync continuation, conditional-log semantics and retry helpers remain supported (`SKILL.md:24-44,50-78,94-148,154-226,230-280`). Additive body metadata, draft/tool catalogues and upload permission alternative do not invalidate these routes; single-recipient attachment mechanics and selected helpers remain valid. Owner-gate/token/storage statements at :80-90 remain source-supported by unchanged core policies. CLI binary dispatch does not change selected JSON/conditional-log semantics. |

## Acceptance boundary and preservation

`scripts/skill-compatibility.mjs:274-283` supports explicit reviewer/rationale plus hash-bound evidence for `compatibility`; workflow kind requires a different previous whole-skill digest. Historical attachment workflow evidence is historical, not a new evaluation. `no-impact` is the acceptance result derived at :332 from an exact matching review with older source revisions, not a substitute review kind.

All seven contracts have new digests, so unchanged historical records cannot alone bind this candidate. Adoption owner must write/review exact new records, bind evidence hashes, update the map and run owning acceptance. This review makes no eleven-skill acceptance claim and no new model/workflow/trigger/package/install/runtime coverage claim.

Checks performed read-only: seven whole-skill and working-byte recomputation, seven exact-selector old/current comparison, SDK source/provenance reads, four app-policy fingerprint recomputations, seven selector-preservation comparisons and four receipt hash matches. These computation commands exited 0. No tests, evaluations, network, installs, builds, containers, credentials, runtime, commits, pushes, exports, sending writes or publication performed.

Only this private artifact directory and the task's claim line were written. SKILLS bodies, maps, canonical reviews, exports and versions were not edited by this reviewer. Adoption owner's pre-existing working changes remain separate. Parent owns remaining release gates and publication.
