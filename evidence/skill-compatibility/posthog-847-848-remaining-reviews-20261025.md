# Remaining skill compatibility reviews

Eight proposed skills pass source compatibility review for the app release at `d0becf05c6cbdc16cb78ba09296884b85d014ad0`. Codex reviewers read each complete body, its selected public dependencies and the changed authorisation policies on 2026-10-25. The published Sending skill also passes separately. This supplements the email approval-workflow review without changing instructions, selectors, gate code or historical evidence.

## Exact scope

Published skills remain `fc7c11647c3bb9f6ba80e0aa6679ad6895d94ce1`; reviewed proposed bodies are those at `8fdb41956191d4a2a993a25eaffc16fb604159ab`. Sending remains `2f4226655efc05f109b5feda50ed2ca1570aea91`; SDK remains `1812300f1f30102ed0e624bc92cd92224cdf867d`. Source reads used immutable commits, including where a local checkout's HEAD differed from its selected SDK revision.

App public OpenAPI bytes remain `dd39d2329fc51098455f499e551ad3e33f14bc9243c793dfa47fc353a57f62ea`, identical to the previous app input `1485e733571f795cddb896b5b1dc8c59bc6c7f78`. Sending and SDK source identities are unchanged. All four selected app policy fingerprints changed; reviewers independently recomputed the old and current fingerprints and matched the exported values. The selected runtime-value fingerprint remains `9f15d58d5b20b72cbb6ba171802854295aac48d92d4e434e7201f93551279580`; this report does not certify a fresh live configuration read.

The changed policies coordinate registration, approval, quota upgrades, credential exchange and revocation with concurrent account deletion. Review followed the changed coordination helper and the subsequent validation. Existing scopes, expiry, durable read access, owner approval, mailbox readiness and quota requirements remain enforced. Deleted accounts gain no credential or authority. No private source or runtime configuration is reproduced here.

## Per-skill decisions

| Skill | Reviewer | Decision and concrete coverage |
| --- | --- | --- |
| `sendmux-cli` | Codex `/root/review_cli_mcp_compat` | PASS proposed. Registration persistence, profile isolation, owner-gated exchange, upload limits and command shapes remain supported. Catalogue remains 57 Management, 53 Mailbox and 8 Sending operations. Retain the tested replacement of the published body; the illustrative error wording caveat below remains. |
| `sendmux-mcp-setup` | Codex `/root/review_cli_mcp_compat` | PASS proposed. Credential/resource boundaries, hosted versus REST authorisation, upload modes, transport setup and client-verification limits remain supported. Candidate catalogue remains 65 tools: 36 Mailbox, 23 Management and 6 Sending. Retain the tested replacement. |
| `sendmux-email-for-agents` | Codex `/root/review_onboarding_compat` | PASS proposed. Routing preserves saved-draft revision approval, separate Sending authority, owner-administered provisioning versus self-registration, durable-read lifetime and quota-upgrade ordering. Retain the tested replacement. |
| `sendmux-getting-started` | Codex `/root/review_onboarding_compat` | PASS both equal-byte versions. Credential checks remain distinct from mailbox readiness; profiles, registration, owner approval, quota, lifetime and revocation instructions remain supported. |
| `sendmux-management` | Codex `/root/review_onboarding_compat` | PASS both equal-byte versions. Administrative credentials, current permissions, one-time-secret handling, provisioning and destructive-action confirmation remain supported. Registration changes introduce no administrative-key requirement. |
| `sendmux-mailbox-agent` | Codex `/root/review_mailbox_sending_compat` | PASS proposed supported workflows, preserving the existing required-field copy caveat below. Read/search, bounded batches, saved revisions, scheduling, attachment extraction and sync remain supported. Durable read credentials still do not grant mailbox sending. Retain the tested replacement. |
| `sendmux-send-email` | Codex `/root/review_mailbox_sending_compat` | PASS published and proposed separately. Message approval, owner gates, one-hour delegated exchange, address objects, batching, attachment references and retry reconciliation remain supported. The proposed body's added reserved-header guidance is mailbox-specific and does not impose a Sending restriction. |
| `sendmux-token-efficient-usage` | Codex `/root/review_mailbox_sending_compat` | PASS both equal-byte versions. Profile reuse, surface-specific checks, bounded reads, batching, sync continuation, response-header access, upload identifiers and retry boundaries remain supported. |

## Historical tested replacements

Four new records retain `kind: workflow`, their actual published predecessor digests and the genuine unchanged evaluation artifacts. The old incompatible published bodies are not given blanket compatibility approval. Review checked body/prompt/output bindings, grades, summaries and matching benchmark runs; the new records preserve every historical evidence entry and bind this source review separately.

| Skill | Applicable historical record | Integrity and retained evaluation |
| --- | --- | --- |
| CLI | `reviews/row07-actualtuple-20261012/sendmux-cli.json` | 15/15 evidence hashes match; exact-body explanation-only upload case remains 6/6. |
| MCP setup | `reviews/row07-actualtuple-20261012/sendmux-mcp-setup.json` | 16/16 evidence hashes match; exact-body explanation-only catalogue/protocol/client case remains 4/4. |
| Email router | `reviews/row07-actualtuple-20261012/sendmux-email-for-agents.json` | 31/31 evidence hashes match, plus 23/23 in its prior workflow record; saved-reply routing remains 5/5 versus historical old-body 1/5. |
| Mailbox | `reviews/row07-actualtuple-20261012/sendmux-mailbox-agent.json` | 27/27 evidence hashes match; exact-body Row07 cases 7/8/10/11 retain all 19 passed assertions. |

Paths in this table are relative to `evidence/skill-compatibility/`. Review also verified the applicable setup, management, Sending and token-efficiency compatibility evidence. Sending's published and proposed bodies differ, so each receives its own compatibility record. Equal-byte setup, management and token-efficiency versions share their respective exact bindings.

## Preserved limits

CLI `skills/sendmux-cli/SKILL.md:121` gives a descriptive wrong-key example; the selected CLI actually emits `Command requires a sending API key, but --api-key contains a root API key.` Both reject the root key before a Sending request. The example is not certified as exact emitted text.

Mailbox `skills/sendmux-mailbox-agent/SKILL.md:193` overstates To and subject as mandatory. The public contract permits an empty subject and recipients across To/Cc/Bcc. The taught requests with To and subject remain valid. This pre-existing copy limitation was already excluded by the historical review and remains excluded; universal literal body accuracy is not claimed.

No new model evaluation, concurrency benchmark, upload/send, credential exchange, installed-client test or publication ran. Historical explanation-only evidence retains its original provenance, isolation and missing-metric limits; it does not become execution against this app revision. Source review and exact evidence binding do not themselves prove production recovery. Canonical acceptance, CI, merge, build and live verification remain separate gates.
