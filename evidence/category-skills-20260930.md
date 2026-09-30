# Category skills: local verification

Status: coded and verified locally; publication, downstream site/docs sync and skills.sh indexing remain with the release owner.

## Change

- `agent-email-inbox` reads one authorised inbox, bounds snippet and batch reads, reports evidence gaps and returns unsent reply text. It makes no mailbox writes.
- `email-for-ai-agents` separates message approval from Sending permission, sends one approved message with a stable idempotency key and reports the returned outcome.
- Catalogues and generated Claude, Codex and Cursor plugin manifests use version `1.7.0`. The OpenClaw generator produces eleven skills.
- All thirty-two tracked files under the original nine skill directories remain byte-identical to the starting commit `be7a4670d04ceb481fed4de1457c53d4e2295fee`.

## Source trace

The public documentation checkout was `Sendmux/sendmux-docs` at `3673b3f733bd8c1e4a14073234fb2d36a92da2ed`.

| Behaviour | Source |
| --- | --- |
| Separate text and unread filters; bounded batch `ids` and clean bodies | `developer-tools/mailbox-api/search-and-batch.mdx:15`, `:73`, `:121` |
| Granted mailbox selection | `developer-tools/mailbox-api/targeting-and-capabilities.mdx:11` |
| Hosted MCP and separate access surfaces | `ai-integrations/mcp/index.mdx:80` |
| Owner acceptance versus owner sending approval | `ai-integrations/agent-access.mdx:17`, `:51` |
| Object sender and recipient; queued response | `sending/http.mdx:35`, `:104` |
| Same-key, same-body replay within 24 hours; conflict cases | `sending/idempotency.mdx:19`, `:54` |
| Local file upload, delegated upload and attachment references | `sending/attachments.mdx:7`, `:38`, `:87` |
| CLI body files and idempotency flag | `developer-tools/cli.mdx:149`, `:172`, `:205` |

Tool names and arguments were also checked against the SDK MCP contract. The source examples explicitly use `ids` for batch reads, object `from`/`to` for Sending, a top-level MCP `Idempotency-Key`, and an HTTP header for direct REST calls.

## Evaluations

Behavioural cases were drafted before the skill bodies. Each case was run with and without the skill using isolated Claude CLI sessions, with no tools or MCP servers. Responses describe intended calls; they do not prove live authentication or delivery.

| Skill | Final content assertions | Without skill | Native description cases |
| --- | --- | --- | --- |
| `agent-email-inbox` | 16/16 | 10/16 | 20/20 |
| `email-for-ai-agents` | 17/17 | 12/17 | 20/20 |

One run per case. The native trigger tests load a disposable candidate plugin and observe the first Skill/Read decision. The candidate was present in all forty native initialisation events; only Read and Skill were available, with no MCP servers. The isolated comparison does not include the installed legacy Sendmux skills.

Failures retained before correction:

- Recipient shape: `"to": [{ "email": "user@example.com" }]`. A concrete documented object example corrected the tested output.
- Batch argument: `"message_ids": ["<IDs returned by step 2, max 10>"]`. The batch example now names `ids` explicitly.
- Draft-only boundary: proposed `send only a holding acknowledgement`. Next actions now remain inside review, bounded reads and unsent draft revisions.
- Each first trigger run scored 19/20. Explicit description boundaries corrected false matches for mailbox mutations and batch sends.
- Before bundle regeneration, the existing checker reported the new skill files missing and manifests stale. The regenerated candidate passed.

The first content attempt leaked unrelated global context and was discarded. Valid content runs use `--safe-mode`, empty tools/MCP and no session persistence. A first native command-stub probe was also excluded: restricted Claude did not load its candidate. The explicit-plugin method verifies candidate availability before accepting results.

Final skill SHA-256 values:

| Skill | SHA-256 |
| --- | --- |
| `agent-email-inbox` | `2a5be98e2eaeb92707b3d20e2a6a9bb81d4e20e212a7b22856f73dedb0d31b1a` |
| `email-for-ai-agents` | `00166b24a755bb9af2492e567be94ee0340b19007293cbc6cbcc02042326b46e` |

## Distribution checks

- `node scripts/check-plugin-bundles.mjs`: passed.
- `node scripts/check-openclaw-bundle.mjs`: passed for eleven skills.
- `node --test scripts/build-plugin-bundles.test.mjs scripts/agent-storage-floor.test.mjs scripts/publish-openclaw-bundle.test.mjs`: 16 passed, zero skipped.
- Official `quick_validate.py` and `package_skill.py`: passed for both skills. Each `.skill` package contains only its `SKILL.md`; evaluation fixtures are excluded.
- `npx --yes skills add <local candidate> --skill agent-email-inbox email-for-ai-agents --agent claude-code codex cursor --copy --yes --json`: passed in a disposable project. Installed copies and generated plugin copies match the canonical bytes.
- No live email, mailbox mutation, repository publication or release was performed by this lane.

## Humanisation

Humanisation: skipped for agent-only instructions, per `sendmux-docs/automation/docs-authoring-workflow.md:63`. README changes are table rows; catalogues and manifests are metadata or generated files. The canonical finalisation contract excludes tables, metadata and generated structure from provider rewriting. Manual review checked concise language, Australian spelling, factual scope, commands and protected identifiers. No eligible prose submission or provider call was required.

## Private artifacts

Artifacts remain under MAIN `.claude/artifacts/install-surface/skills/`:

- `<skill>/evaluation-receipt.json` binds the final skill, assertions, description and result hashes.
- `<skill>/iteration-4/` holds final responses, per-assertion grading and official benchmark files.
- `<skill>/trigger-iteration-2/` holds native results, input metadata and stream traces.
- `<skill>/content-review.html` is the standalone review artifact.
- `distribution-receipt.json`, `final-generation-packaging.json` and `final-bundle-checks.json` hold package/install/bundle evidence.
- Earlier failed and discarded runs remain separately labelled; none count as passing evidence.

No existing tests were changed or removed. Added evaluation fixtures check public workflow behaviour and its nearest unsafe or out-of-scope alternatives. Site digests, published package installation and marketplace indexing need verification after release.
