# Retry with `order-88`, not `order-89`

Your colleague's suggestion would defeat the protection you set up. The first attempt timed out on the client side, so it may already have been accepted and queued. A new key like `order-89` tells Sendmux this is a **different logical send**, which could deliver a duplicate email. Reusing `order-88` lets Sendmux recognise the retry. If the original went through, the retry replays that result instead of sending again.

## The next request

Send the **same key** with the **byte-for-byte identical approved body**. Include the same sender, recipients, subject, `html_body`, `text_body`, and any original `attachment_id` refs. Do this within 24 hours of the first attempt.

**MCP (`sending_send_email`)**: the key is a top-level argument next to the message fields:

```json
{
  "Idempotency-Key": "order-88",
  "from": { "email": "<approved sender>" },
  "to": { "email": "<approved recipient>" },
  "subject": "<approved subject>",
  "html_body": "<approved HTML body>"
}
```

**CLI**: reuse the same private body file from the first attempt:

```bash
sendmux sending:send --profile <profile> \
  --idempotency-key "order-88" \
  --body-file ./sendmux-email.json --json
```

**Direct HTTP**: send `Idempotency-Key: order-88` as a header, not a body field.

Two cautions:
- **Don't re-upload attachments.** If the first attempt used `--attach ./file.pdf`, that command uploaded and sent together. Retry with the `attachment_id` the first attempt produced. If you can't recover the exact original payload, reconcile the original attempt before sending anything else.
- **Check the 24-hour window.** If more than 24 hours have passed since the first attempt, don't retry blindly. Reconcile the `order-88` attempt first, then decide whether a new send is needed.

The message is already approved and unchanged, so no new approval is needed for this retry.

## Handling `409 idempotency_conflict`

A 409 on `order-88` has two possible causes:

| Cause | What to do |
|---|---|
| **The original request is still in flight** (likely after a timeout) | Wait briefly, then retry again with `order-88` and the identical body. Repeat with modest backoff. |
| **The body differs from the original** (even a small change) | Stop. Compare the payload with the saved approved version and reconcile what the original request actually sent. If the content really needs to change, get fresh approval before any new send. |

In neither case should you switch to `order-89` to get past the conflict. That is exactly how duplicate sends happen.

Other responses:
- **`429` / `503`**: wait as the `Retry-After` or retry headers say, then retry with `order-88` unchanged.
- **Permission or validation errors**: fix the underlying problem. Don't resend blindly.

## Reporting the outcome

When a response arrives, report the returned `message_id` and status. A status of `queued` means Sendmux accepted and queued the message. It does not confirm delivery or that the recipient read it. If you never get a definitive response, report the send as **uncertain** rather than assuming it succeeded or failed.
