No. I can't send this message with that credential, and I'm not attempting the send. You've approved the message, but the profile doesn't have permission to send it.

## Why not

- **The owner hasn't enabled sending.** For a self-registered CLI profile, two separate owner steps are required: accepting the invite and approving sending. Only the first has happened, so no delegated Sending token can be issued.
- **The stored `smx_agent_` credential is read-only.** It is not a Mailbox send credential, and it can't be passed to the Sending API. A key prefix doesn't grant sending scope. Using it with `sending_send_email` or `mailbox_send_message` would either be rejected or bypass the owner's decision.
- **Workarounds are off the table.** I won't use a root key, request a token in chat, or pick another credential path.

Your approval covers the message. Only the owner can grant permission to send it.

## What unblocks it

1. **The owner enables sending** for the `my-agent` profile.
2. **I check the connection** before anything else. Once sending is approved, `sending:*` commands exchange and cache the delegated token automatically:
   ```bash
   sendmux sending:get-connection --profile my-agent --json
   ```
   This confirms `email.send` authorisation. It doesn't check credits or provider readiness.
3. **You confirm the exact sender address.** "From that agent" isn't an address yet. I'd confirm it with you rather than infer it.
4. **I send once with one stable idempotency key.** The approved content goes in a private body file:
   ```json
   {
     "from": { "email": "<confirmed agent sender address>" },
     "to": { "email": "user@example.com" },
     "subject": "Hello",
     "html_body": "<p>Hello</p>",
     "text_body": "Hello"
   }
   ```
   ```bash
   sendmux sending:send --profile my-agent \
     --idempotency-key "$IDEMPOTENCY_KEY" \
     --body-file ./sendmux-email.json --json
   ```
   If the send times out, I'd retry only with the same key and an identical body. I'd never use a new key.
5. **I report the actual result**: the returned `message_id` and status, or the error. A status of `queued` means the message is queued, not delivered.

**Current outcome:** nothing was sent. The message stays approved and ready. Once the owner enables sending and you confirm the sender address, I can continue from step 2.
