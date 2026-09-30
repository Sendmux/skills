Your approval covers the exact sender, recipient, subject, body, no attachments and no CC/BCC. Your hosted MCP grant has Sending access with `email.send`. Both kinds of authority are in place, so no further approval is needed.

## Exact next calls (described, not executed)

**1. Validate the Sending connection**

```
sending_get_connection
{}
```

This confirms the hosted MCP grant authorises `email.send`. It does not check credits or provider readiness.

**2. Record the approved payload in private workflow state (no credentials)**

- `Idempotency-Key`: `build-42-status`
- Approved payload: the same message fields shown in step 3 below.

**3. Send once**

First I would inspect the `sending_send_email` schema to confirm that `Idempotency-Key` is a top-level argument. Then I would call it once:

```
sending_send_email
{
  "Idempotency-Key": "build-42-status",
  "from": { "email": "agent@myagent.mx" },
  "to": { "email": "user@example.com" },
  "subject": "Status",
  "html_body": "<p>Build passed.</p>",
  "text_body": "Build passed."
}
```

No `cc`, `bcc` or `attachments` fields are included.

**Retry and error handling (if it had been needed)**

- **Timeout:** retry once with the same key `build-42-status` and the identical body, within the 24-hour replay window.
- **`409 idempotency_conflict`:** if the first request is still in flight, wait briefly and retry unchanged. Never switch to a new key.
- **`429` or `503`:** follow the response's retry headers.
- **Permission or validation errors:** correct the cause rather than resending blindly.

**4. Simulated result**

```json
{ "ok": true, "data": { "message_id": "eml_simulated42", "status": "queued" } }
```

The response is a clear success, so no retry or further send is made.

## Report to you

Your approved status email was accepted by Sendmux.

- **From:** agent@myagent.mx
- **To:** user@example.com
- **Subject:** Status
- **Body:** `<p>Build passed.</p>` (text: "Build passed.")
- **Idempotency key:** `build-42-status`
- **Message ID:** `eml_simulated42`
- **Status:** `queued`

It was sent once, with no retries. "Queued" means Sendmux accepted the message for sending. It does not yet confirm delivery, or that the recipient has read it.
