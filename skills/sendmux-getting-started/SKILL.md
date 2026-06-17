---
name: sendmux-getting-started
description: Sendmux setup, API key validation, and first-call guidance. Use when the user wants to install Sendmux tooling, check whether an smx_root_ or smx_mbx_ key works, choose MCP vs CLI vs SDK, connect an agent to Sendmux email, configure auth, or make the first harmless Sendmux API call from an agent, terminal, or application.
license: Apache-2.0
metadata:
  author: sendmux
  version: "1.0"
---

# Sendmux getting started

Use this skill to get a user from "I have a Sendmux task" to the correct surface, key kind, package, and first verified call.

## Safety first

- Do not ask the user to paste an API key.
- Do not print API keys.
- Prefer existing environment variables, local CLI profiles, or the user's secret manager.
- If a key appears in chat or logs, stop and tell the user to rotate it before continuing.

## Pick the key

| Task | Key prefix | Start here |
| --- | --- | --- |
| Send email through the Sending API | `smx_mbx_` | `sendmux-send-email` for real sends; this skill can verify package/API discovery first. |
| Read, search, sync, triage, or reply from one mailbox | `smx_mbx_` | Mailbox MCP, CLI, or SDK. |
| Manage domains, mailboxes, mailbox keys, providers, webhooks, logs, billing, or metrics | `smx_root_` | Management MCP, CLI, or SDK. |

If the task mixes management and mailbox work, use separate keys and separate clients or profiles. Do not use a root key for mailbox-scoped examples.

## Choose the surface

1. Use MCP first when the user's agent already has the relevant `sendmux-mcp` server connected and the needed tool is curated.
2. Use the `sendmux` CLI for one-shot terminal work, debugging, shell scripts, and examples the user can copy into a terminal. Add `--json` so downstream agents can parse the envelope.
3. Use an SDK when writing application code. Install only the package for the chosen surface unless the project needs multiple surfaces.
4. Use direct HTTP only when the user's environment cannot use MCP, CLI, or an SDK.

## Install the relevant package

CLI:

```bash
npm install -g @sendmux/cli
```

MCP:

```bash
pipx install sendmux-mcp
```

TypeScript SDK packages:

```bash
npm install @sendmux/mailbox
npm install @sendmux/management
npm install @sendmux/sending
```

Use the one package matching the task; do not install all three unless the project needs all three.

## First verified calls

### Mailbox key, mailbox work

MCP tool:

```text
mailbox_get_me
```

CLI:

```bash
SENDMUX_API_KEY="$SENDMUX_MBX_KEY" sendmux profiles:set mailbox --default --json
sendmux mailbox:me:get --json
```

SDK:

```ts
import { createMailboxClient, mailboxGetMe } from "@sendmux/mailbox";

const client = createMailboxClient({ apiKey: process.env.SENDMUX_API_KEY! });
const response = await mailboxGetMe({ client });
console.log(response.data);
```

This call resolves the mailbox behind the bearer token and should be the default harmless first call for `smx_mbx_` mailbox workflows.

### Root key, management work

MCP tool:

```text
management_list_mailboxes
```

CLI:

```bash
SENDMUX_API_KEY="$SENDMUX_ROOT_KEY" sendmux profiles:set root --default --json
sendmux management:mailboxes:list --query limit=1 --json
```

SDK:

```ts
import { createManagementClient, managementListMailboxes } from "@sendmux/management";

const client = createManagementClient({ apiKey: process.env.SENDMUX_API_KEY! });
const response = await managementListMailboxes({
  client,
  query: { limit: 1 },
});
console.log(response.data);
```

Use a small list call as the first management check. It verifies the root key and avoids creating or changing resources.

### Sending work

The Sending surface uses `smx_mbx_` keys. Do not send a real email as a health check unless the user explicitly asks to send one and provides the message details.

CLI package/API discovery:

```bash
SENDMUX_API_KEY="$SENDMUX_MBX_KEY" sendmux sending:get-open-api-spec --json
```

SDK package/API discovery:

```ts
import { createSendingClient, sendingGetOpenApiSpec } from "@sendmux/sending";

const client = createSendingClient({ apiKey: process.env.SENDMUX_API_KEY! });
const response = await sendingGetOpenApiSpec({ client });
console.log(response.data.info);
```

For a real send, route to `sendmux-send-email` and include an `Idempotency-Key`.

## Interpret failures

- Prefix error: the selected surface and key do not match. Switch to `smx_mbx_` for Sending/Mailbox or `smx_root_` for Management.
- `401`: key missing, invalid, or revoked.
- `403`: key is valid but lacks the permission or surface required by the call.
- `429` or `503`: retry according to the response headers; do not loop manually.
- Empty list with `ok: true`: auth worked; there may be no resources yet.

## Route after setup

- Sending one or many outbound messages: `sendmux-send-email`.
- Reading, searching, syncing, or replying from a mailbox: `sendmux-mailbox-agent`.
- Managing domains, mailboxes, keys, webhooks, spend, logs, or metrics: `sendmux-management`.
- CLI-specific workflows: `sendmux-cli`.
- MCP client configuration: `sendmux-mcp-setup`.
- Choosing the cheapest call pattern: `sendmux-token-efficient-usage`.
