---
name: sendmux-attachments
description: Use Sendmux attachment workflows without wasting model context on base64. Use when uploading, downloading, reading, forwarding, or sending email attachments through Sendmux MCP, CLI, SDKs, or direct HTTP, especially when choosing file_path vs presigned upload URL vs inline base64, fetching short-lived download_url links, or attaching local files to outbound mail.
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
| Local `file_path` | Local stdio MCP can read the user-shared file root. | tiny | Mailbox cap: 7,500,000 bytes per attachment. |
| Presigned upload URL | Hosted MCP, shell-capable agents, or large local files. | tiny | Mailbox cap: 7,500,000 bytes; exact size is signed. |
| CLI `--attach` / SDK file helpers | Terminal or application code can read the file. | tiny | Mailbox cap for mailbox sends; Sending API request limit for Sending sends. |
| Inline base64 | Small generated text/files only. | high | MCP inline cap is 32 KiB decoded. |

Approximate base64 cost: 25 KB becomes about 11K generated tokens; 1 MB is impractical. A file path is usually under 100 tokens.

## Security model

- A caller must authenticate to mint upload URLs or upload directly.
- The later presigned `PUT` has no `Authorization` header, but it only works with the unguessable short-lived signed URL and exact headers returned by Sendmux.
- Do not invent file-type allow-lists. Set the best `Content-Type`; let Sendmux return the real validation error if a file is rejected.
- For presigned `PUT`, send the exact `Content-Type` and `Content-Length` returned with the URL.
- Do not try to bypass upload size caps. For mailbox uploads, split or externally host files over 7,500,000 bytes.
- For downloads, use the `download_url` in attachment metadata promptly. If it expires, fetch the message or attachment metadata again.

## MCP

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

To read inbound attachments, call `mailbox_get_attachment` or fetch message metadata, then fetch `download_url` promptly. Do not construct attachment URLs manually.

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

## TypeScript

Node file helpers live under Node subpaths so browser bundles stay clean.

Mailbox:

```ts
import { createMailboxClient } from "@sendmux/mailbox";
import { sendMailboxMessageWithFiles } from "@sendmux/mailbox/node";

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
from sendmux_mailbox import create_mailbox_client, send_mailbox_message_with_files

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
