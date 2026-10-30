Your agent can register a new Sendmux inbox without an existing account or API key. Use the Sendmux getting-started skill and the installed CLI’s `--help` as the setup authority.

Replace `owner@example.com` with your email, then have the agent run:

```bash
npm install -g @sendmux/cli
sendmux agent:register --help
sendmux agent:register my-agent \
  --mailbox-local-part my-agent \
  --client-name "My agent" \
  --owner-email owner@example.com \
  --default \
  --json
```

No challenge or proof of work is required. The CLI saves registration state, stores the credential in a permission-restricted local profile without printing it, and waits up to 10 minutes for mailbox readiness. If interrupted, rerun the same command with the same profile and options to resume safely. Never paste or copy the credential into chat, logs or repository files.

Verify the saved profile before reading messages:

```bash
sendmux mailbox:get-connection --profile my-agent --json
sendmux mailbox:me:get --profile my-agent --json
```

Use that profile without `SENDMUX_API_KEY`, `SENDMUX_ACCESS_TOKEN` or `--api-key` overrides. The connection check validates access; it does not prove sending readiness.

If registration already happened without `--owner-email`, invite yourself separately:

```bash
sendmux agent:invite-owner owner@example.com --profile my-agent --json
```

Accept the owner invitation and approve sending if wanted:

| Credential | Access and lifetime |
| --- | --- |
| Saved agent profile | Read and receive email without an expiry date while registration remains active. It cannot send or change messages. |
| Delegated Sending token | Available only after you accept the invitation and approve sending. `sending:*` commands then automatically exchange the durable credential for a one-hour `email.send` token and cache it until near expiry. |

The inbox starts with a 500 MiB cap; owner-approved sending raises it to at least 5 GiB. Revoking sending leaves the current storage allocation unchanged. Revoking the full registration removes read access, the owner link, invitation/recovery handles and all derived sending tokens.

Not run: installation, registration, connection checks or invitations. Sending remains unavailable until your approval.
