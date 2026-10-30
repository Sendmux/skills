- **Before approval:** Inbox access permits reading and receiving, not sending. Until you accept the owner invitation and approve sending, send attempts fail closed. The self-registered inbox is capped at **500 MiB**.
- **After approval:** Storage rises to **at least 5 GiB**. Using the same CLI agent profile, the CLI automatically exchanges its durable read credential for a **one-hour delegated `email.send` token**, caching it only until near expiry. The durable credential itself is not sent directly to the Sending API. Supply one stable `--idempotency-key` per logical send and reuse it for retries.
- **If you revoke sending:** Sending becomes unavailable again; revocation itself leaves the current storage allocation unchanged.

Each message still requires confirmation of its sender, recipients, subject, body and attachments before sending.

No live send checked. Owner approval grants sending authority; validation and acceptance for delivery can still fail.
