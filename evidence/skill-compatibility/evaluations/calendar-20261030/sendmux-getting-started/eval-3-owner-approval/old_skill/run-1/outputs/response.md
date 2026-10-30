No existing account or API key needed. The agent registers its own inbox through the CLI and invites you with `--owner-email`.

If its agent supports Skills and the Sendmux pack is missing, install it first:

```bash
npx skills add Sendmux/skills
```

Replace `owner@example.com` with your email, then run:

```bash
npm install -g @sendmux/cli
sendmux agent:register my-agent \
  --mailbox-local-part my-agent \
  --client-name "My agent" \
  --owner-email owner@example.com \
  --default \
  --json
```

The CLI saves the credential in a permission-restricted profile without printing it, records idempotency state, and waits up to 10 minutes for mailbox readiness. Rerun the same command with the same profile and options to resume safely; no challenge or proof of work is required.

Verify the saved profile before reading messages. Do not combine profile commands with `SENDMUX_API_KEY`, `SENDMUX_ACCESS_TOKEN` or `--api-key` overrides:

```bash
sendmux mailbox:get-connection --profile my-agent --json
sendmux mailbox:me:get --profile my-agent --json
```

If registration already happened without your email, invite you separately:

```bash
sendmux agent:invite-owner owner@example.com --profile my-agent --json
```

| Credential | Access and lifetime |
| --- | --- |
| Saved agent profile | Read and receive mail without an expiry date while registration remains active; read/receive-only. |
| Delegated Sending token | Available after you accept the invitation and approve sending. `sending:*` commands automatically exchange the saved credential for a one-hour `email.send` token and cache it until near expiry. |

The inbox starts capped at 500 MiB. Owner-approved sending raises it to at least 5 GiB; revoking sending does not itself reduce its current storage allocation. A full registration revoke removes read access, the owner link, invitation/recovery handles and all derived sending tokens.

Commands shown only; registration and invitation have not been run. Keep the saved profile private; never paste or log its credential.
