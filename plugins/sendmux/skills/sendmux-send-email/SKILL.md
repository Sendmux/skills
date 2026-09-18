---
name: sendmux-send-email
description: "Use when a user needs advice or implementation help for sending one or many emails through Sendmux: choose the HTTP Sending API versus SMTP, design single or batch sends, attach files, apply idempotency, or inspect send results through MCP, CLI, SDK, or direct HTTP. Not for initial credential, API-key, OAuth, or profile setup—use sendmux-getting-started; not for reading, searching, syncing, or triaging an inbox—use sendmux-mailbox-agent."
license: Apache-2.0
metadata:
  author: sendmux
  version: "1.0"
---

# Sendmux send email

Use this skill when the user is ready to send outbound email through Sendmux or needs code/commands for sending.

## Safety first

- Do not ask the user to paste an API key.
- Do not invent recipients, sender addresses, subject lines, or body content.
- Send only after the user supplies or confirms every recipient and message.
- For batch sends, confirm the full recipient/message set before calling a send tool.
- Use a send-capable `smx_mbx_` key, owner-approved Sending-resource `smx_agent_` token, or REST OAuth grant with Sending access and `email.send` for the Sending HTTP API. SMTP requires a send-capable API key; OAuth access tokens are not SMTP or IMAP passwords.

For an agent-profile before/after approval answer, cover the complete lifecycle:

| State | Required explanation |
| --- | --- |
| Before owner acceptance and sending approval | The durable credential is read/receive-only, sends fail closed, and the self-registered inbox is capped at 500 MiB. |
| After sending approval | Storage rises to at least 5 GiB. The CLI automatically exchanges for a one-hour delegated `email.send` token and caches it only until near expiry; the sender supplies one stable `--idempotency-key` per logical send. |
| After sending revocation | Sending becomes unavailable again, but revocation does not itself change the current inbox storage allocation. |

Sending approval supplies the required authority; it does not guarantee that a later request will pass validation or be accepted for delivery.

## Choose the send path

| User task                                 | Efficient default                                                                                                                      |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| One outbound email                        | `POST /emails/send`, MCP `sending_send_email`, CLI `sending:send`, or SDK `sendingSendEmail`.                                          |
| More than one independent outbound email  | Batch by default: `POST /emails/send/batch`, MCP `sending_send_email_batch`, CLI `sending:send:batch`, or SDK `sendingSendEmailBatch`. |
| Sending API attachment file               | Upload a real file with `sending_create_attachment_upload`, CLI `--attach`, or SDK file helpers; reserve `sending_upload_attachment` inline content for tiny agent-authored bytes; send by `attachment_id`. |
| Replying while working inside one mailbox | Use mailbox send from `sendmux-mailbox-agent` when the workflow is mailbox-centred.                                                    |
| Existing app only supports SMTP           | Use SMTP only because the existing tool requires it. For new agent or app integrations, prefer the HTTP Sending API.                   |

When explaining a batch send, cover:

| Part | Requirement |
| --- | --- |
| Authority | A send-capable `smx_mbx_` key, owner-approved Sending-resource `smx_agent_` token, or REST OAuth grant with `email.send`. |
| Payload | A `messages[]` body with up to 100 independently confirmed messages. |
| Completion | Inspect every result item because a batch can partially succeed. |

Credential validation proves only that the credential can read Sending connection metadata; it does not approve or authorise a later message. A complete validation answer has three parts:

- **Validation:** `sendmux sending:get-connection --profile work --json` checks a Sending connection without sending email.
- **Transport:** a REST OAuth grant with `email.send` works for the HTTP Sending API; OAuth access tokens are not SMTP or IMAP passwords.
- **Next send:** separately require explicit user approval of the complete sender, recipients, subject, body, and attachments before any later send.

For OAuth profile setup, refresh and logout, follow `sendmux-cli`. SDK clients accept `accessToken` instead of `apiKey`, including a token provider; your application owns storage and refresh coordination.

## Required JSON shape

Single send body:

```json
{
  "from": { "email": "sender@example.com", "name": "Sender Name" },
  "to": { "email": "recipient@example.com", "name": "Recipient Name" },
  "subject": "Subject line",
  "html_body": "<p>Hello.</p>",
  "text_body": "Hello."
}
```

Required fields: `from`, `to`, `subject`, `html_body`.

Useful optional fields:

- `text_body`: plain text alternative.
- `cc`, `bcc`: arrays of recipients, max 49 each and subject to 50 total `to`, `cc`, and `bcc` recipients.
- `reply_to`: one address object.
- `return_path`: envelope sender for bounce handling.
- `custom_headers`: custom `X-*` headers.
- `attachments`: up to 10 items. Prefer uploaded refs `{ "attachment_id": "att_..." }`. Inline compatibility form uses `filename` plus base64 `content`, optional `type`, and `encoding: "base64"`.

For real local files, do not ask the model to produce base64. Route attachment-heavy work to `sendmux-attachments`; use CLI `--attach`, SDK file helpers, or delegated `sending_create_attachment_upload`, then pass `attachment_id` refs. For a presigned Sending upload, the upload intent's returned `max_size_bytes` is the size authority; the final sent message is capped at 25 MB. Mailbox `blob_id` refs are for mailbox sends, not Sending API sends.

For a direct HTTP batch call, keep authority and retry metadata outside the JSON body:

```http
POST /emails/send/batch HTTP/1.1
Authorization: Bearer $SENDMUX_MBX_KEY
Content-Type: application/json
Idempotency-Key: $IDEMPOTENCY_KEY
```

`$SENDMUX_MBX_KEY` must resolve to a send-capable `smx_mbx_` key. An owner-approved Sending-resource `smx_agent_` token is also accepted. The request body is:

```json
{
  "messages": [
    {
      "from": { "email": "sender@example.com" },
      "to": { "email": "alice@example.com" },
      "subject": "Hello Alice",
      "html_body": "<p>Hi Alice.</p>"
    },
    {
      "from": { "email": "sender@example.com" },
      "to": { "email": "bob@example.com" },
      "subject": "Hello Bob",
      "html_body": "<p>Hi Bob.</p>"
    }
  ]
}
```

## Idempotency

Add `Idempotency-Key` to every send that may be retried. Use one stable key per logical email or batch.

- Same key and same body: returns the cached response for 24 hours.
- Same key and different body: returns `409 idempotency_conflict`.
- Keep keys under 255 characters.

## MCP

Use MCP when the user's agent already has the Sending server connected:

- One message: `sending_send_email`.
- Multiple messages: `sending_send_email_batch`.
- Tiny agent-authored content: `sending_upload_attachment` with `content_base64` only when the decoded content is at most 32,768 bytes.
- Real local file upload before send: complete every step below.
  1. Call `sending_create_attachment_upload` with the filename, content type, and exact local `size_bytes`; compare the size with returned `max_size_bytes`.
  2. Transfer bytes outside model context using the exact returned method, URL, and headers with no Sendmux API key. Keep the signed URL and returned headers out of process arguments and retained output.
  3. Take `attachment_id` from the successful external upload response. The intent returns `upload_id` and transfer metadata, not `attachment_id`; never substitute its `upload_id` or a Mailbox `blob_id`.
  4. Pass that `attachment_id` to `sending_send_email` with one stable `Idempotency-Key` for this logical send when the client exposes it. If MCP does not expose it clearly, use CLI, SDK, or direct HTTP for a retry-sensitive send.
- Metadata check for a temporary uploaded attachment: `sending_get_attachment`.

For attachments through MCP, use `sendmux-attachments` so the agent chooses presigned upload or tiny inline base64 correctly; MCP does not receive a local `file_path`.

## CLI

For a self-registered agent, use its profile instead of copying credentials:

```bash
sendmux sending:send \
  --profile my-agent \
  --idempotency-key "$IDEMPOTENCY_KEY" \
  --body-file ./sendmux-email.json \
  --json
```

The owner must already have accepted the invitation and approved sending. The CLI obtains and caches the short-lived delegated token; the durable read credential is not used directly by the Sending API.

One email:

```bash
SENDMUX_API_KEY="$SENDMUX_MBX_KEY" sendmux sending:send \
  --idempotency-key "$IDEMPOTENCY_KEY" \
  --body '{
    "from": { "email": "sender@example.com", "name": "Sender Name" },
    "to": { "email": "recipient@example.com", "name": "Recipient Name" },
    "subject": "Subject line",
    "html_body": "<p>Hello.</p>",
    "text_body": "Hello."
  }' \
  --json
```

Batch:

```bash
SENDMUX_API_KEY="$SENDMUX_MBX_KEY" sendmux sending:send:batch \
  --idempotency-key "$IDEMPOTENCY_KEY" \
  --body-file ./sendmux-batch.json \
  --json
```

Use `--attach ./file.pdf` for local files; the CLI uploads bytes first and injects `attachment_id` refs before sending. Use `--body-file` for larger JSON payloads or already-prepared Sending API attachment objects.

## TypeScript SDK

One email:

```ts
import { createSendingClient, sendingSendEmail } from "@sendmux/sending";

const client = createSendingClient({ apiKey: process.env.SENDMUX_API_KEY! });

const response = await sendingSendEmail({
  client,
  throwOnError: true,
  headers: { "Idempotency-Key": idempotencyKey },
  body: {
    from: { email: "sender@example.com", name: "Sender Name" },
    to: { email: "recipient@example.com", name: "Recipient Name" },
    subject: "Subject line",
    html_body: "<p>Hello.</p>",
    text_body: "Hello.",
  },
});

console.log(response.data.data.message_id, response.data.data.status);
```

Batch:

```ts
import { createSendingClient, sendingSendEmailBatch } from "@sendmux/sending";

const client = createSendingClient({ apiKey: process.env.SENDMUX_API_KEY! });

const response = await sendingSendEmailBatch({
  client,
  throwOnError: true,
  headers: { "Idempotency-Key": idempotencyKey },
  body: {
    messages,
  },
});

for (const result of response.data.data.results) {
  console.log(result.index, result.status, result.message_id, result.error);
}
```

## Direct HTTP

Use direct HTTP only when MCP, CLI, or SDK is unavailable:

```bash
curl --silent --show-error --fail-with-body \
  --config - \
  --data-binary @sendmux-email.json <<CURL_CONFIG
request = "POST"
url = "https://smtp.sendmux.ai/api/v1/emails/send"
header = "Authorization: Bearer $SENDMUX_MBX_KEY"
header = "Content-Type: application/json"
header = "Idempotency-Key: $IDEMPOTENCY_KEY"
CURL_CONFIG
```

The stdin-fed config keeps the bearer and idempotency value out of the child process arguments. Do not print or persist that config.

## Responses and errors

Single send success returns a `200` success envelope with:

- `data.message_id`: `eml_...`
- `data.status`: `queued`

Batch success returns a `200` success envelope with:

- `data.summary.total`
- `data.summary.queued`
- `data.summary.failed`
- `data.results[]` containing `index`, `status`, `message_id`, and optional `error`

Handle these errors deliberately:

- `401`: missing, invalid, or revoked key.
- `402`: insufficient credits.
- `403`: key lacks `email.send`, is not allowed for the sender, or uses the wrong surface.
- `409`: idempotency conflict.
- `413`: request body exceeds 25 MB.
- `422`: validation failed; read `error.errors`.
- `429` or `503`: retry according to response headers.

## Routing

- Setup/auth first call: `sendmux-getting-started`.
- Attachment file paths, presigned upload URLs, and download URLs: `sendmux-attachments`.
- Mailbox-centred replies: `sendmux-mailbox-agent`.
- CLI-only details: `sendmux-cli`.
- Cheapest-call decisions: `sendmux-token-efficient-usage`.
