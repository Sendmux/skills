---
name: sendmux-token-efficient-usage
description: "Use when the question is about *how to call* Sendmux cheaply, not what to send: choosing batch vs. looped sends, mailbox search/count/batch-read vs. full fetches, sync deltas, cursor pagination, ETags/conditional requests, idempotency keys, or picking between MCP, the sendmux CLI, an SDK, or direct HTTP. Trigger for reducing token/round-trip/API-call cost, avoiding broad mailbox or log fetches, or optimizing a polling/sync loop.\n\nThis is a routing/cost-decision skill, never a content-authoring one. If the request asks to write, draft, compose, or format the actual JSON body, subject, text, or attachment bytes of an email — even a single email, even one with an attachment, even inside a larger batch — do NOT use this skill; route that to sendmux-send-email or sendmux-attachments instead. Ask yourself: is the user asking \"what's the cheapest way to call Sendmux,\" or \"what should this email/attachment contain\"? Only the former belongs here."
license: Apache-2.0
metadata:
  author: sendmux
  version: "1.0"
---

# Sendmux token-efficient usage

Use this skill to choose the lowest-cost Sendmux route that still answers the task correctly.

## Boundaries

- Do not ask the user to paste an API key.
- For API-key authentication, use `smx_mbx_*` keys for normal Mailbox calls.
- For a self-registered agent, reuse one durable CLI profile. Mailbox reads become available after provisioning, before owner approval; Sending stays blocked until owner approval.
- For API-key authentication, use `smx_root_*` for Management calls.
- Do not default to MCP for every task. MCP is best when the required tool is curated; CLI and SDK cover broader surfaces.
- Keep real attachment bytes outside model context and route their mechanics to `sendmux-attachments`; use the attachment route reference below.
- Do not read full mailbox bodies, every message, or every log row unless the user asks for full content and narrower calls cannot answer.

Choose the authentication connection, then its already-approved product surface. For an existing OAuth profile, use the already-known approved surface from its granted permissions or setup context. If that surface is unknown, show the surface-specific alternatives below and ask which one the profile grants; there is no universal Mailbox default.

| Authentication connection | Validate with | Ownership boundary |
| --- | --- | --- |
| Existing CLI or REST OAuth profile | The selected CLI operation: `mailbox:get-connection`, `management:get-connection`, or `sending:get-connection` | Explain that the check stays within the profile's approved surface, scopes, and mailboxes. `sendmux-cli` owns login and refresh. |
| SDK application credentials | The selected SDK operation: `mailboxGetConnection`, `managementGetConnection`, or `sendingGetConnection` | The application supplies SDK credentials; this is not a CLI profile check. |
| Already-connected MCP session | The selected MCP operation: `mailbox_get_connection`, `management_get_connection`, or `sending_get_connection` | This validates only that MCP session. `sendmux-mcp-setup` owns hosted MCP OAuth setup; it is not an alternate view of a REST profile. |

These checks need no mailbox selector and send no email. Public OpenAPI discovery does not validate credentials.

## Surface choice

| Situation                               | Use                                 | Why                                                           |
| --------------------------------------- | ----------------------------------- | ------------------------------------------------------------- |
| Connected agent and curated tool exists | MCP tool                            | Small schema and no SDK boilerplate.                          |
| One-off terminal task                   | `sendmux` CLI with `--json`         | Direct, scriptable, exposes the full generated operation set. |
| Application code or repeated workflow   | SDK for the project already in use  | Reuses client setup, pagination, headers, and retry helpers.  |
| MCP lacks the needed operation          | CLI for terminal work, SDK for code | Do not invent uncurated MCP tools.                            |
| No package/tooling available            | Direct HTTP                         | Keep request bodies and headers aligned to OpenAPI.           |

Credential ownership follows the surface. For a durable CLI agent profile, the CLI automatically exchanges and caches the one-hour delegated token for `sending:*` commands. SDK callers supply a compatible `apiKey` or `accessToken` (or their own provider callback); SDK helpers do not read or update CLI profile state.

## Cheapest-call map

| Task                            | Cheapest correct default                                                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Send one outbound email         | `sending_send_email`, CLI `sending:send`, SDK `sendingSendEmail`; include `Idempotency-Key`.                                           |
| Send multiple outbound emails   | `sending_send_email_batch`, CLI `sending:send:batch`, SDK `sendingSendEmailBatch`; do not loop single sends.                           |
| Send or read attachments        | Use the attachment route reference below.                                                                                              |
| Count matching mailbox messages | `mailbox_count_messages`, CLI `mailbox:count-messages`, SDK `mailboxCountMessages`.                                                    |
| Search mailbox text             | `mailbox_search_message_snippets`, CLI `mailbox:search-message-snippets`, SDK `mailboxSearchMessageSnippets`; then fetch selected IDs. |
| Read several known messages     | `mailbox_batch_get_messages`, CLI `mailbox:batch-get-messages`, SDK `mailboxBatchGetMessages`.                                         |
| Update/delete several messages  | Batch update/delete after explicit confirmation.                                                                                       |
| Resume broad mailbox sync       | `mailbox_get_changes`, CLI `mailbox:get-changes`, SDK `mailboxGetChanges`.                                                             |
| Resume filtered mailbox sync    | CLI/SDK `mailbox:query-message-changes` / `mailboxQueryMessageChanges`; MCP does not curate it yet.                                    |
| Watch live mailbox events       | CLI/SDK `mailbox:stream-events` / `mailboxStreamEvents`; MCP does not curate it yet.                                                   |
| Scan threads                    | List threads, then fetch one thread or its messages.                                                                                   |
| Manage domains/mailboxes/keys   | Management MCP for curated create/list/get/update/suspend/resume/key tools; CLI/SDK for uncovered lifecycle work.                      |
| Manage sending accounts         | CLI/SDK; MCP does not curate provider tools yet.                                                                                       |
| Manage webhooks                 | MCP for list/create/test; CLI/SDK for get/update/delete/rotate/delivery payloads.                                                      |
| Inspect spend, logs, metrics    | Metrics first; use `management:list-email-logs` / `managementListEmailLogs` for filtered summaries, then `management:get-email-log` / `managementGetEmailLog` for one selected row. |

### Attachment route reference

`sendmux-attachments` owns the detailed upload/download procedures and current direct-upload limits.

When comparing local-file routes, state how bytes move and which size authority applies for each alternative below, then recommend the one matching the user's environment:

1. **Terminal:** recommend CLI `--attach` for a one-off task. It uploads directly outside model context; server-enforced direct-upload limits apply. There is no presign-limit response.
2. **Application code:** name `sendEmailWithFiles` or `uploadAttachmentFromFile` from `@sendmux/sending/node`, or `uploadMailboxAttachmentFromFile` from `@sendmux/mailbox/node`. These helpers upload directly outside model context; server-enforced direct-upload limits apply, with no presign-limit response.
3. **Connected MCP:** name `sending_create_attachment_upload` for Sending, or `mailbox_upload_attachment` with `presign_upload_url=true` for Mailbox. Both use presigned external transfer outside model context. For Sending, obey the upload intent's returned `max_size_bytes`; Mailbox accepts requested `size_bytes` up to 7,500,000.

For tiny agent-authored content, MCP inline `content_base64` is available only after measuring the decoded content at no more than 32,768 bytes; a filename or file type cannot establish eligibility.

For presigned Sending uploads, the intent returns a temporary `upload_id`; take the final `attachment_id` from the successful external `PUT` response. A successful external Mailbox upload returns the `blob_id` for Mailbox sends. Never use MCP `file_path` or real-file inline base64.

For an agent with no key, avoid manual protocol calls and token copying:

```bash
sendmux agent:register my-agent --default --json
sendmux mailbox:me:get --profile my-agent --json
sendmux agent:invite-owner owner@example.com --profile my-agent --json
```

Register once, then reuse the durable profile across processes. For this self-registered agent, sending has two owner gates: the owner accepts the invitation, then explicitly approves sending. Once both are complete, use the same profile with `sending:*`; the CLI handles the one-hour delegated token exchange and cache.

Explain the storage boundary alongside this setup: the inbox is capped at 500 MiB before approval. Owner-approved sending raises it to at least 5 GiB first. Revoking sending does not itself change the current inbox storage allocation.

## Read less

For mailbox questions, reduce the result set before reading content:

1. Count when the user asks "how many" or when the query may be broad.
2. Search snippets with a small `limit` when the user needs examples; choose from the returned `message_id`, `subject`, and `preview` fields.
3. Batch-get only selected message IDs.
4. Request clean body/content only when message text affects the answer.

CLI:

```bash
sendmux mailbox:count-messages \
  --query q=invoice \
  --query is_unread=true \
  --json

sendmux mailbox:search-message-snippets \
  --query q=invoice \
  --query is_unread=true \
  --query limit=10 \
  --json

sendmux mailbox:batch-get-messages \
  --body '{
    "ids": ["eml_abc", "eml_def"],
    "body_mode": "clean_json",
    "max_body_chars": 4000,
    "strip_quotes": true,
    "strip_signature": true,
    "include_attachments": "metadata"
  }' \
  --json
```

## Write fewer requests

Batch when there is more than one target.

For API-key or delegated-token authentication, name the Sending authority alongside the recommended call: a send-capable `smx_mbx_*` key or owner-approved Sending-resource `smx_agent_*` token. This applies to both single and batch sends.

```bash
sendmux sending:send:batch \
  --idempotency-key "$IDEMPOTENCY_KEY" \
  --body-file ./messages.json \
  --json

sendmux mailbox:batch-update-messages \
  --body '{
    "ids": ["eml_abc", "eml_def"],
    "seen": true,
    "if_in_state": "state_from_prior_read"
  }' \
  --json
```

For batch sends, inspect every per-message result before reporting success. Batch can contain mixed outcomes.

## Sync by delta

Use sync endpoints instead of re-listing stable data.

Choose the sync route that matches the requested view: broad mailbox state uses `mailbox:get-changes` / `mailboxGetChanges`; a filtered message view uses `mailbox:query-message-changes` / `mailboxQueryMessageChanges`.

Broad mailbox sync:

```bash
sendmux mailbox:get-changes \
  --query types=messages,folders,threads \
  --query messages_since_state="$MESSAGES_STATE" \
  --query folders_since_state="$FOLDERS_STATE" \
  --query threads_since_state="$THREADS_STATE" \
  --query limit=100 \
  --json
```

This multi-resource sync requires `types=messages,folders,threads`; omitting `types` deliberately selects the legacy message-only response. Before the next call, persist each returned resource's `new_state` and `has_more`. Map `data.types.messages.new_state`, `data.types.folders.new_state`, and `data.types.threads.new_state` to the matching `*_since_state` input. Continue each resource whose saved `has_more` is true independently with its saved state; a narrower response updates only the resource it requested.

For a message-only continuation, use the selected resource's fields exactly:

```bash
sendmux mailbox:get-changes \
  --query types=messages \
  --query messages_since_state="$NEXT_MESSAGES_STATE" \
  --query limit=100 \
  --json
```

After every response, replace the current response, set `NEXT_MESSAGES_STATE` from its `data.types.messages.new_state`, and repeat only while that same latest response's `data.types.messages.has_more` is true.

Filtered message sync:

```bash
sendmux mailbox:query-message-changes \
  --query since_query_state="$QUERY_STATE" \
  --query q=invoice \
  --query is_unread=true \
  --query limit=100 \
  --json
```

After every response, set `QUERY_STATE` from its `data.new_query_state`, and continue with the same filters only while that same latest response's `data.has_more` is true and the next page is needed.

A polling-loop answer must distinguish sync continuation from cursor-paginated list calls. For the latter, preserve the same filters and a small bounded limit, count matches cumulatively across pages, stop immediately when the local threshold is reached even mid-page, and follow the returned `pagination.next_cursor` only while another list page is needed. At the start of every polling tick, call each enabled sync route once with its saved state and perform each enabled conditional-log read once, even when the prior sync response had `has_more=false`; within that tick, add one call for every requested continuation page.

Use the public delivery-log seams exactly:

- For filtered summary pages, use CLI `management:list-email-logs` or SDK `managementListEmailLogs`. Preserve only supported filters (`status`, `from_date`, `to_date`, `provider_id`, `search`), and map the returned `pagination.next_cursor` to the next `cursor` input.
- For repeated reads of one known log, CLI `management:get-email-log --if-none-match "$ETAG"` can send an ETag supplied from elsewhere, but CLI output is the API JSON body—not an HTTP status/header envelope. It cannot acquire or refresh the ETag or branch on `304`.
- For the first metadata-bearing read and every later `304`-aware read, use the supported SDK packages directly; `priorEtag` is absent on the first call:

```ts
import { responseEtag } from "@sendmux/core";
import { createManagementClient, managementGetEmailLog } from "@sendmux/management";

const client = createManagementClient({ apiKey: process.env.SENDMUX_API_KEY! });

const result = await managementGetEmailLog({
  client,
  path: { public_id: logId },
  headers: priorEtag ? { "If-None-Match": priorEtag } : {},
  throwOnError: false,
});

if (result.response?.status === 304) {
  // Unchanged representation; there is no response body.
} else if (result.error) {
  // Handle the unsuccessful response.
} else {
  const log = result.data?.data;
  const nextEtag = responseEtag(result.response);
}
```

The terminal delivery statuses are `sent`, `failed`, and `rejected`. A `304` means the representation is unchanged; it does not establish a terminal delivery status.

## Transfer less

- Use small `limit` values on list calls.
- Follow `pagination.next_cursor` only until enough evidence has been gathered.
- Prefer summary or metrics endpoints before log lists.
- Use `If-None-Match` for repeated detail reads that previously returned an `ETag`.
- Use `If-Match` for updates when the prior read returned an `ETag`.
- For inbound attachments, fetch metadata and use the short-lived `download_url`; if it expires, re-fetch metadata instead of building URLs manually.
- For outbound attachments, follow the attachment route reference above.

CLI conditional examples:

```bash
sendmux management:get-email-log \
  --path public_id=dlog_abc \
  --if-none-match "$ETAG" \
  --json

sendmux management:update-mailbox \
  --path public_id=mbx_abc \
  --if-match "$ETAG" \
  --body '{"display_name":"Agent Inbox"}' \
  --json
```

SDK helpers:

```
import {
  conditionalHeaders,
  idempotencyHeaders,
  paginate,
  responseEtag,
} from "@sendmux/core";

const headers = conditionalHeaders({ ifNoneMatch: priorEtag });
const writeHeaders = {
  ...conditionalHeaders({ etag: priorEtag }),
  ...idempotencyHeaders(operationKey),
};
```

## Retry safely

Use `Idempotency-Key` on supported mutations so retrying does not create duplicate work.

Good candidates:

- `sending:send` and `sending:send:batch`.
- `mailbox:send-message`.
- Management creates, mailbox key creation, suspend/resume, provider mutations, webhook create/rotate/test.

When retrying application code, prefer SDK retry helpers only for safe reads or idempotent writes. Non-idempotent writes should fail rather than risk duplicate side effects.

## Routing

- Setup, key scopes, first call: `sendmux-getting-started`.
- Email send bodies and SMTP-vs-HTTP choice: `sendmux-send-email`.
- Attachment upload/download mechanics: `sendmux-attachments`.
- Mailbox read/search/sync/triage/reply details: `sendmux-mailbox-agent`.
- Management domains, mailboxes, webhooks, billing, logs: `sendmux-management`.
- CLI syntax and profiles: `sendmux-cli`.
- MCP installation and client config: `sendmux-mcp-setup`.
