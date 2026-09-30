**No. Do not call `sending_send_email` after `--attach` succeeds.** `sendmux sending:send --attach` uploads the file and sends the message in one step. A second send through MCP would deliver a duplicate email.

## Approved message

| Field | Value |
|---|---|
| Profile | `work` |
| From | `sender@example.com` |
| To | `user@example.com` |
| Subject | `Signed quote` |
| Body | `Attached quote.` |
| Attachment | `./signed-quote.pdf` (exactly one) |

## 1. Validate the connection (read-only)

```bash
sendmux sending:get-connection --profile work --json
```

This confirms that `email.send` is authorised. It does not check credits or provider readiness.

## 2. Generate one idempotency key and save it privately

```bash
IDEMPOTENCY_KEY="signed-quote-$(uuidgen | tr 'A-Z' 'a-z')"
```

Generate this key once for this logical send. Store it with the payload below in private workflow state, without any credentials. Do not regenerate it for retries.

## 3. Write the private body file

`./sendmux-email.json`:

```json
{
  "from": { "email": "sender@example.com" },
  "to": { "email": "user@example.com" },
  "subject": "Signed quote",
  "html_body": "<p>Attached quote.</p>",
  "text_body": "Attached quote."
}
```

Notes on this file:
- `from` and `to` are address objects, as the Sending API requires.
- The approved text is used unchanged. The HTML version only wraps it in `<p>`.
- The file has no attachment field, because `--attach` supplies the PDF.

## 4. Run the retry-safe send once

```bash
sendmux sending:send --profile work \
  --idempotency-key "$IDEMPOTENCY_KEY" \
  --body-file ./sendmux-email.json \
  --attach ./signed-quote.pdf \
  --json
```

I have not run this command. It is the prepared call.

## After running it

- **Success:** report the returned `message_id` and status. `queued` only means the message is queued. It does not confirm delivery or that the recipient read it. Stop there, with no MCP send and no second CLI send.
- **Uncertain timeout:** retry only with the same key and the same body within the 24-hour window. If the upload finished, the retry needs the original `attachment_id`, but `--attach` may not expose it. If you can't recover the exact original payload, check what happened to the first attempt before sending anything again. Never switch to a new key to get around the uncertainty.
- **`409 idempotency_conflict`:** if the first request is still running, wait briefly and retry unchanged. If the body changed, check the original request and get fresh approval.
- **`429` or `503`:** follow the retry headers in the response.
- **Permission or validation errors:** fix the cause. Do not resend blindly.
