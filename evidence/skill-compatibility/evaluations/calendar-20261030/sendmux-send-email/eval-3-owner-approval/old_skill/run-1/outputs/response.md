Inbox access alone does not grant sending permission.

- **Before owner acceptance and sending approval:** the durable credential remains read/receive-only. Send attempts fail closed. The self-registered inbox is capped at **500 MiB**.
- **After you accept the invitation and approve sending:** storage rises to **at least 5 GiB**. Using the existing profile, the CLI automatically exchanges for a **one-hour delegated `email.send` token**, caching it only until near expiry. The durable read credential is not sent directly to the Sending API. Supply one stable `--idempotency-key` per logical send, reusing it for retries.
- **If you revoke sending:** sending becomes unavailable again. Revocation itself does not change the inbox’s current storage allocation.

Owner approval grants sending authority; requests still need to pass validation, and acceptance for delivery is not guaranteed. Confirm the sender, recipients, subject, body and attachments before any actual send.

No live checks or sends performed.
