---
name: sendmux-send-email
description: Send email with Sendmux, including owner-approved Sending-resource smx_agent_ tokens from claim-token exchange. Use when the user wants to send one email, send multiple emails, choose single vs batch sending, add idempotency keys, include attachments, compare HTTP Sending API vs SMTP, or use Sendmux MCP, CLI, SDK, or direct HTTP for outbound email.
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
- Use a send-capable `smx_mbx_` key or owner-approved Sending-resource `smx_agent_` token for the Sending API.
- Do not use a pre-claim `smx_agent_` token for sending. Pre-claim self-registered agent tokens have `mailbox.read` and `email.receive`, not `email.send`.
- If using a self-registered agent, obtain the Sending-resource `smx_agent_` token by exchanging the saved `claim_token` after owner approval with `resource=https://smtp.sendmux.ai/api/v1`.

## Choose the send path

| User task                                 | Efficient default                                                                                                                      |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| One outbound email                        | `POST /emails/send`, MCP `sending_send_email`, CLI `sending:send`, or SDK `sendingSendEmail`.                                          |
| More than one independent outbound email  | Batch by default: `POST /emails/send/batch`, MCP `sending_send_email_batch`, CLI `sending:send:batch`, or SDK `sendingSendEmailBatch`. |
| Sending API attachment file               | Upload first with `sending_upload_attachment`, `sending_create_attachment_upload`, CLI `--attach`, or SDK file helpers; send by `attachment_id`. |
| Replying while working inside one mailbox | Use mailbox send from `sendmux-mailbox-agent` when the workflow is mailbox-centred.                                                    |
| Existing app only supports SMTP           | Use SMTP only because the existing tool requires it. For new agent or app integrations, prefer the HTTP Sending API.                   |

Batch sends accept up to 100 messages. A batch response can partially succeed, so inspect every result item.

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
- `cc`, `bcc`: arrays of recipients, max 100 each.
- `reply_to`: one address object.
- `return_path`: envelope sender for bounce handling.
- `custom_headers`: custom `X-*` headers.
- `attachments`: up to 10 items. Prefer uploaded refs `{ "attachment_id": "att_..." }`. Inline compatibility form uses `filename` plus base64 `content`, optional `type`, and `encoding: "base64"`.

For real local files, do not ask the model to produce base64. Route attachment-heavy work to `sendmux-attachments`; use CLI `--attach`, SDK file helpers, `sending_upload_attachment`, or delegated `sending_create_attachment_upload`, then pass `attachment_id` refs. Sending uploads cap each file at 18 MiB and the final sent message at 25 MB. Mailbox `blob_id` refs are for mailbox sends, not Sending API sends.

Batch send body:

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
- Local file upload before send: `sending_upload_attachment` with `file_path`.
- Hosted or shell-capable upload before send: `sending_create_attachment_upload`, then `PUT` bytes to the returned URL with the returned headers and no Sendmux API key.
- Metadata check for a temporary uploaded attachment: `sending_get_attachment`.

Include an idempotency key when the client exposes the header parameter. If the MCP client does not expose headers clearly, use CLI, SDK, or direct HTTP for retry-sensitive sends. For attachments through MCP, use `sendmux-attachments` so the agent chooses `file_path`, presigned upload, or tiny inline base64 correctly.

## CLI

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
  headers: { "Idempotency-Key": idempotencyKey },
  body: {
    from: { email: "sender@example.com", name: "Sender Name" },
    to: { email: "recipient@example.com", name: "Recipient Name" },
    subject: "Subject line",
    html_body: "<p>Hello.</p>",
    text_body: "Hello.",
  },
});

console.log(response.data.message_id, response.data.status);
```

Batch:

```ts
import { createSendingClient, sendingSendEmailBatch } from "@sendmux/sending";

const client = createSendingClient({ apiKey: process.env.SENDMUX_API_KEY! });

const response = await sendingSendEmailBatch({
  client,
  headers: { "Idempotency-Key": idempotencyKey },
  body: {
    messages,
  },
});

for (const result of response.data.results) {
  console.log(result.index, result.status, result.message_id, result.error);
}
```

## Direct HTTP

Use direct HTTP only when MCP, CLI, or SDK is unavailable:

```bash
curl -X POST https://smtp.sendmux.ai/api/v1/emails/send \
  -H "Authorization: Bearer $SENDMUX_MBX_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d @sendmux-email.json
```

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
