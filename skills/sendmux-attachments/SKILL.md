---
name: sendmux-attachments
description: Use Sendmux attachment workflows without wasting model context on base64. Use when uploading, downloading, reading, forwarding, or sending email attachments through Sendmux MCP, CLI, SDKs, or direct HTTP, especially when choosing file_path vs presigned upload URL vs inline base64, reading inbound attachments with mailbox_read_attachment, fetching short-lived download_url links, or attaching local files to outbound mail.
license: Apache-2.0
metadata:
  author: sendmux
  version: "1.0"
---

# Sendmux attachments

Use this skill whenever a Sendmux task involves attachment bytes.

## Core rule

Do not pipe real files through model context as base64 unless the file is tiny and agent-authored. Prefer paths or signed URLs.

| Mode | Use when | Token cost | Limit |
| --- | --- | ---: | --- |
| Local `file_path` | Local stdio MCP can read the user-shared file root. | tiny | Mailbox cap: 7,500,000 bytes; Sending upload cap: 18 MiB. |
| Presigned upload URL | Hosted MCP, shell-capable agents, or large local files. | tiny | Mailbox cap: 7,500,000 bytes; Sending upload cap: 18 MiB; exact size is signed. |
| CLI `--attach` / SDK file helpers | Terminal or application code can read the file. | tiny | Mailbox cap for mailbox sends; Sending upload cap: 18 MiB and final message cap: 25 MB. |
| Inline base64 | Small generated text/files only. | high | MCP inline cap is 32 KiB decoded. |

Approximate base64 cost: 25 KB becomes about 11K generated tokens; 1 MB is impractical. A file path is usually under 100 tokens.

## Security model

- A caller must authenticate to mint upload URLs or upload directly.
- The later presigned `PUT` has no `Authorization` header, but it only works with the unguessable short-lived signed URL and exact headers returned by Sendmux.
- Do not invent file-type allow-lists. Set the best `Content-Type`; let Sendmux return the real validation error if a file is rejected.
- For presigned `PUT`, send the exact `Content-Type` and `Content-Length` returned with the URL.
- Direct Sending API binary uploads require exact `Content-Length`. CLI, SDK, and MCP file helpers calculate it for you.
- Do not try to bypass upload size caps. For mailbox uploads, split or externally host files over 7,500,000 bytes.
- For MCP reads, call `mailbox_read_attachment` first. It returns inline text for text-like attachments and a link for binary or oversized files.
- For direct downloads, use the `download_url` in attachment metadata promptly. If it expires, fetch the message or attachment metadata again.
- Sending API sends use `attachment_id` refs returned by Sending upload endpoints. Mailbox sends use `blob_id` refs returned by mailbox upload endpoints. Do not mix them.

## MCP

### Mailbox upload and read

Use `mailbox_upload_attachment` before `mailbox_send_message`.

Local stdio, cheapest path:

```text
mailbox_upload_attachment
filename: report.pdf
content_type: application/pdf
file_path: /absolute/path/report.pdf
```

The file path must be inside a filesystem root shared by the MCP client. Hosted MCP rejects `file_path`.

Hosted or shell-capable path:

```text
mailbox_upload_attachment
filename: report.pdf
content_type: application/pdf
size_bytes: 5242880
presign_upload_url: true
```

Then upload without an API key:

```bash
curl -X PUT "$UPLOAD_URL" \
  -H "Content-Type: application/pdf" \
  -H "Content-Length: 5242880" \
  --data-binary @./report.pdf
```

Use the returned `blob_id` in `mailbox_send_message`:

```json
{
  "attachments": [
    {
      "blob_id": "blob_...",
      "filename": "report.pdf",
      "content_type": "application/pdf"
    }
  ]
}
```

For tiny generated content only, use `content_base64`. If the tool rejects size, switch to `file_path`, presigned upload, CLI, or SDK file helpers.

To read inbound attachments, call `mailbox_read_attachment` with `message_id` and `attachment_id`.

```text
mailbox_read_attachment
message_id: msg_...
attachment_id: att_...
```

Use returned `text` directly for text-like files. If the tool returns `resource_link` / `download_url`, fetch the link promptly outside model context. Use `mailbox_get_attachment` only when metadata is enough or you need to refresh an expired link. Do not construct attachment URLs manually.

### Sending API upload

Local stdio, cheapest path:

```text
sending_upload_attachment
filename: report.pdf
content_type: application/pdf
file_path: /absolute/path/report.pdf
```

Use the returned `attachment_id` in `sending_send_email` or `sending_send_email_batch`:

```json
{
  "attachments": [{ "attachment_id": "att_..." }]
}
```

Hosted or shell-capable path:

```text
sending_create_attachment_upload
filename: report.pdf
content_type: application/pdf
size_bytes: 5242880
```

Then `PUT` the file bytes to the returned `upload_url` with the returned headers, including `X-Sendmux-Upload-Token`; do not add a Sendmux API key:

```bash
curl -X PUT "$UPLOAD_URL" \
  -H "X-Sendmux-Upload-Token: $UPLOAD_TOKEN" \
  -H "Content-Type: application/pdf" \
  -H "Content-Length: 5242880" \
  --data-binary @./report.pdf
```

Use the `attachment_id` from the upload response in the send request. Use `sending_get_attachment` only for metadata checks.

## CLI

Mailbox send with a local attachment in one command:

```bash
SENDMUX_API_KEY="$SENDMUX_MBX_KEY" sendmux mailbox:send-message \
  --idempotency-key "$IDEMPOTENCY_KEY" \
  --attach ./report.pdf \
  --body '{
    "to": [{ "email": "user@example.com", "name": null }],
    "subject": "Report",
    "text_body": "Attached."
  }' \
  --json
```

Sending API with a local attachment:

```bash
SENDMUX_API_KEY="$SENDMUX_MBX_KEY" sendmux sending:send \
  --idempotency-key "$IDEMPOTENCY_KEY" \
  --attach ./report.pdf \
  --body-file ./email.json \
  --json
```

Upload a Sending attachment first, then send by `attachment_id`:

```bash
SENDMUX_API_KEY="$SENDMUX_MBX_KEY" sendmux sending:upload-attachment \
  --body-file ./report.pdf \
  --query filename=report.pdf \
  --query content_type=application/pdf \
  --json
```

Presigned mailbox upload from a local file:

```bash
SENDMUX_API_KEY="$SENDMUX_MBX_KEY" sendmux mailbox:upload-attachment \
  --file ./report.pdf \
  --via-presigned \
  --json
```

Mint only:

```bash
SENDMUX_API_KEY="$SENDMUX_MBX_KEY" sendmux mailbox:create-attachment-upload \
  --file ./report.pdf \
  --json
```

Override MIME type with `--content-type` only when inference is wrong.

## Direct HTTP

Sending API direct upload with an API key:

```bash
SIZE_BYTES="$(wc -c < ./report.pdf | tr -d '[:space:]')"

curl -X POST "https://smtp.sendmux.ai/api/v1/emails/attachments?filename=report.pdf&content_type=application/pdf" \
  -H "Authorization: Bearer $SENDMUX_MBX_KEY" \
  -H "Content-Type: application/pdf" \
  -H "Content-Length: $SIZE_BYTES" \
  --data-binary @./report.pdf
```

Sending API delegated upload:

```bash
curl -X POST "https://smtp.sendmux.ai/api/v1/emails/attachment-uploads" \
  -H "Authorization: Bearer $SENDMUX_MBX_KEY" \
  -H "Content-Type: application/json" \
  -d '{"filename":"report.pdf","content_type":"application/pdf","size_bytes":5242880}'
```

Then `PUT` to the returned `upload_url` with returned headers and no Sendmux API key. Use `GET /emails/attachments/{attachment_id}` only for metadata checks.

## TypeScript

Node file helpers live under Node subpaths so browser bundles stay clean.

Mailbox:

```ts
import { createMailboxClient } from "@sendmux/mailbox";
import {
  readMailboxTextAttachment,
  sendMailboxMessageWithFiles,
} from "@sendmux/mailbox/node";

const client = createMailboxClient({ apiKey: process.env.SENDMUX_API_KEY! });

await sendMailboxMessageWithFiles({
  client,
  files: ["./report.pdf"],
  headers: { "Idempotency-Key": idempotencyKey },
  body: {
    to: [{ email: "user@example.com", name: null }],
    subject: "Report",
    text_body: "Attached.",
  },
});

const text = await readMailboxTextAttachment({
  client,
  messageId: "msg_...",
  attachmentId: "att_...",
});
```

Sending API:

```ts
import { createSendingClient } from "@sendmux/sending";
import { sendEmailWithFiles } from "@sendmux/sending/node";

const client = createSendingClient({ apiKey: process.env.SENDMUX_API_KEY! });

await sendEmailWithFiles({
  client,
  files: ["./report.pdf"],
  headers: { "Idempotency-Key": idempotencyKey },
  body: {
    from: { email: "sender@example.com" },
    to: { email: "user@example.com" },
    subject: "Report",
    html_body: "<p>Attached.</p>",
  },
});
```

The combined package also exposes `@sendmux/sdk/node`.

## Python

Mailbox:

```python
from sendmux_mailbox import create_mailbox_client, read_mailbox_text_attachment, send_mailbox_message_with_files

client = create_mailbox_client(api_key=api_key)

send_mailbox_message_with_files(
    client,
    files=["./report.pdf"],
    body={
        "to": [{"email": "user@example.com", "name": None}],
        "subject": "Report",
        "text_body": "Attached.",
    },
    idempotency_key=idempotency_key,
)

text = read_mailbox_text_attachment(
    client,
    message_id="msg_...",
    attachment_id="att_...",
)
```

Sending API:

```python
from sendmux_sending import create_sending_client, send_email_with_files

client = create_sending_client(api_key=api_key)

send_email_with_files(
    client,
    files=["./report.pdf"],
    body={
        "from": {"email": "sender@example.com"},
        "to": {"email": "user@example.com"},
        "subject": "Report",
        "html_body": "<p>Attached.</p>",
    },
    idempotency_key=idempotency_key,
)
```

## Routing

- Sending content and recipient approval: `sendmux-send-email`.
- Mailbox search, triage, reply flow: `sendmux-mailbox-agent`.
- Exact terminal command mechanics: `sendmux-cli`.
- MCP installation or hosted/local setup: `sendmux-mcp-setup`.
- General token-efficiency decisions: `sendmux-token-efficient-usage`.
