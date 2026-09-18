---
name: sendmux-cli
description: Use when a user wants to run the Sendmux **CLI** (the `sendmux` terminal binary) — installing it, OAuth login/logout, connection checks, agent inbox registration and owner invites, managing API-key or OAuth profiles, key-scope preflight errors (e.g. root vs mailbox vs agent key), `--json` output, or invoking Management, Mailbox, and Sending operation commands (domains, mailboxes, webhooks, messages, search, sending email, attachments, delivery logs) via `sendmux COMMAND --flag` syntax. Trigger for "what sendmux command", "how do I run/install sendmux", CLI flag or error questions, and profile/credential setup in the terminal. Do NOT trigger for using Sendmux through MCP tools, the REST API directly from code, or general email-sending strategy questions unrelated to the CLI.
license: Apache-2.0
metadata:
  author: sendmux
  version: "1.0"
---

# Sendmux CLI

Use this skill when the terminal is the right Sendmux surface.

## Boundaries

- Do not ask the user to paste API keys.
- For API-key profiles, use `smx_root_` for `management:*` and `smx_mbx_` or scoped `smx_agent_` for `mailbox:*`.
- OAuth profiles require the operation's approved surface, scopes and mailbox access. REST OAuth tokens authenticate HTTP, not SMTP or IMAP.
- Durable agent profiles can read and receive mail while active, but cannot send until an invited owner accepts and approves sending.
- After owner approval, `sending:*` commands with an agent profile automatically exchange and cache a one-hour delegated token.
- Do not run destructive commands without explicit confirmation.
- Use `--json` for agent-readable output.
- Prefer task-specific Sendmux skills when the user needs strategy; use this skill for exact CLI mechanics.

## Install

```bash
npm install -g @sendmux/cli
sendmux --help
```

The package exposes the `sendmux` binary.

## OAuth login and connection checks

For an existing user's account, create a new named OAuth profile with the required scopes:

```bash
sendmux auth:login work --scope mailbox.read --scope email.send
sendmux mailbox:get-connection --profile work --json
```

The CLI opens browser consent and receives the callback on the same computer. `--no-browser` only suppresses automatic browser launch and prints the authorisation URL; the OAuth callback still requires the browser flow on the CLI host, so the flag alone is not a remote-machine authentication transport. The CLI preserves existing profiles.

When explaining the OAuth lifecycle, include all three storage and recovery facts: the CLI stores tokens locally with restricted file permissions; expiring tokens refresh automatically with concurrent refreshes serialised; and an uncertain refresh outcome requires authentication under a new profile name because `auth:login` preserves an occupied profile. To reuse the same name, first complete `sendmux auth:logout work`, then log in again.

Use `sending:get-connection`, `mailbox:get-connection`, or `management:get-connection` for the selected surface. These checks require no mailbox selector and send no email. Use `data.label` for the connection name and `data.team.id` for its stable team identifier.

Run `sendmux auth:logout work` to revoke the connection and remove its profile. A failed revocation keeps the profile for retry; logout also clears an interrupted login reservation.

For externally managed tokens, inject `SENDMUX_ACCESS_TOKEN` through the environment. The CLI does not refresh that token. Supplying it alongside an API key is an error. See [OAuth for REST APIs](https://sendmux.ai/docs/developer-tools/oauth) for grant scopes and refresh rules.

## Agent inbox onboarding

No existing Sendmux account or API key is required:

```bash
sendmux agent:register my-agent \
  --mailbox-local-part my-agent \
  --client-name "My agent" \
  --default \
  --json
```

Add `--owner-email owner@example.com` to invite the owner during registration. Otherwise invite later:

```bash
sendmux agent:invite-owner owner@example.com --profile my-agent --json
```

The CLI persists registration idempotency before the network request, stores the durable credential in the local profile with restricted permissions, never prints it, reloads it from disk, and waits up to 10 minutes for readiness. Rerun registration with the same profile and options to resume safely. Include this storage transition when explaining the onboarding lifecycle: the inbox is capped at 500 MiB before owner approval, and enabling owner-approved sending raises it to at least 5 GiB.

Use the profile for later reads:

```bash
sendmux mailbox:messages:list --profile my-agent --query limit=25 --json
```

Read/receive access has no expiry date while the registration remains active. Sending remains blocked until the owner accepts and approves it. After approval, a command such as `sending:send --profile my-agent` automatically exchanges the durable credential for a one-hour `email.send` token and caches it until near expiry. Full registration revocation removes read access and every delegated token.

Revoking sending does not itself change the current inbox storage allocation.

## Profiles

Create separate profiles for root and mailbox keys.

```bash
SENDMUX_API_KEY="$SENDMUX_ROOT_KEY" sendmux profiles:set default --default --json
SENDMUX_API_KEY="$SENDMUX_MBX_KEY" sendmux profiles:set mailbox --json
SENDMUX_API_KEY="$SENDMUX_MBX_KEY" sendmux profiles:set sending --json
sendmux profiles:list --json
sendmux profiles:show default --json
```

`profiles:set` reads the key from `SENDMUX_API_KEY`; populate the source variables through the user's secret store. The direct `--api-key` flag remains supported and takes precedence over `SENDMUX_API_KEY`, but do not expand a secret into that flag because the resulting value is visible in process arguments.

Profile reads mask stored API keys and never reveal agent credentials. `profiles:set` reports `key_kind` as `root` or `mailbox`; `agent:register` creates a discriminated agent profile.

Authentication resolution: `SENDMUX_ACCESS_TOKEN` takes precedence and rejects a simultaneous API key. Otherwise:

1. `--api-key`, then `SENDMUX_API_KEY`.
2. If no direct key is present, `--profile` / `-p`, then `SENDMUX_PROFILE`, then the configured default profile.
3. Base URL comes from `--base-url`, then `SENDMUX_BASE_URL`, then the selected profile.

## Preflight

For API-key authentication, the CLI infers key kind from the prefix before sending a request. OAuth profiles use their approved grants instead of API-key prefix checks.

| Command surface | Required key                                                                      |
| --------------- | --------------------------------------------------------------------------------- |
| `management:*`  | `smx_root_`                                                                       |
| `mailbox:*`     | `smx_mbx_` or scoped `smx_agent_`                                                 |
| `sending:*`     | Send-capable `smx_mbx_` key or owner-approved Sending-resource `smx_agent_` token |

For an agent profile, `mailbox:*` uses the durable read credential. `sending:*` obtains a delegated token only after owner approval. `management:*` rejects agent profiles before the request.

Wrong-key examples fail before network:

```text
Command requires a root API key, but --api-key contains a mailbox API key.
Command requires a send-capable `smx_mbx_` key or owner-approved Sending-resource `smx_agent_` token, but --api-key contains a root API key.
```

## Command catalogue

The CLI exposes generated operation commands:

| Surface    | Count | Examples                                                                                                                                                   |
| ---------- | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Management |    54 | `management:domains:list`, `management:create-domain`, `management:create-mailbox`, `management:get-spend-summary`, `management:create-webhook`            |
| Mailbox    |    42 | `mailbox:search-message-snippets`, `mailbox:batch-get-messages`, `mailbox:query-message-changes`, `mailbox:send-message`, `mailbox:list-granted-mailboxes` |
| Sending    |     8 | `sending:get-open-api-spec`, `sending:send`, `sending:send:batch`, `sending:upload-attachment`, `sending:create-attachment-upload`, `sending:complete-attachment-upload`, `sending:get-attachment` |
| OAuth      |     2 | `auth:login`, `auth:logout` |
| Profiles   |     3 | `profiles:list`, `profiles:set`, `profiles:show`                                                                                                           |
| Agent      |     2 | `agent:register`, `agent:invite-owner`                                                                                                                      |

Use command-level help to discover accepted path, query, header, and body fields:

```bash
sendmux management:create-domain --help
sendmux mailbox:search-message-snippets --help
sendmux sending:send:batch --help
sendmux sending:upload-attachment --help
```

## Operation flags

Operation commands share these flags:

| Flag                  | Use                                                                        |
| --------------------- | -------------------------------------------------------------------------- |
| `--api-key`           | Direct key; overrides profile/env profile lookup.                          |
| `--base-url`          | Override API base URL.                                                     |
| `--profile`, `-p`     | Select a local profile.                                                    |
| `--body`              | Inline JSON request body, or text bytes for byte-oriented operations.      |
| `--body-file`         | Read a JSON request body or byte payload from a file.                      |
| `--attach`            | Attach a local file to supported send commands. Repeat for multiple files. |
| `--file`              | Read a local file for mailbox attachment upload convenience commands.       |
| `--via-presigned`     | Upload a mailbox `--file` through a short-lived signed URL instead of API bytes. |
| `--content-type`      | Override inferred MIME type for `--attach` or `--file`.                    |
| `--path name=value`   | Path parameters. Repeat for multiple path params.                          |
| `--query name=value`  | Query parameters. Repeat for filters and pagination.                       |
| `--header name=value` | Headers accepted by the operation. Repeat for multiple headers.            |
| `--idempotency-key`   | Shortcut for `Idempotency-Key`. Works only when the operation supports it. |
| `--if-match`          | Shortcut for `If-Match`. Works only when the operation supports it.        |
| `--if-none-match`     | Shortcut for `If-None-Match`. Works only when the operation supports it.   |
| `--json`              | Machine-readable output.                                                   |

`--path`, `--query`, and `--header` require `name=value`. Booleans use `true` or `false`. Repeat an array-valued parameter rather than comma-joining it.

Pass either `--body` or `--body-file`, not both.

Use `sendmux-attachments` for attachment-heavy flows and size/token trade-offs.

## Examples

For workflows spanning Sending, Mailbox, and Management, state the classification explicitly: they are three command surfaces and may use three profiles, but the CLI has only `root` and `mailbox` API-key kinds. A send-capable mailbox key may populate both the mailbox and sending profiles; do not call those profiles different key kinds.

Create a domain:

```bash
sendmux management:create-domain \
  --profile default \
  --idempotency-key "$IDEMPOTENCY_KEY" \
  --body '{"domain":"example.com","mode":"send_receive"}' \
  --json
```

Get domain DNS records:

```bash
sendmux management:get-domain-zone-file \
  --profile default \
  --path public_id=mdom_abc \
  --json
```

Search a mailbox without reading full messages:

```bash
sendmux mailbox:search-message-snippets \
  --profile mailbox \
  --query q=invoice \
  --query is_unread=true \
  --query limit=10 \
  --json
```

Batch-read selected mailbox messages:

```bash
sendmux mailbox:batch-get-messages \
  --profile mailbox \
  --body '{
    "ids": ["eml_abc", "eml_def"],
    "body_mode": "clean_json",
    "max_body_chars": 4000
  }' \
  --json
```

Send a batch:

```bash
sendmux sending:send:batch \
  --profile sending \
  --idempotency-key "$IDEMPOTENCY_KEY" \
  --body-file ./messages.json \
  --json
```

Send through the Sending API with a local attachment:

```bash
sendmux sending:send \
  --profile sending \
  --idempotency-key "$IDEMPOTENCY_KEY" \
  --attach ./report.pdf \
  --body '{"from":{"email":"sender@example.com"},"to":{"email":"user@example.com"},"subject":"Report","html_body":"<p>Attached.</p>"}' \
  --json
```

`sending:send --attach` uploads the file first and injects an `attachment_id` reference; it does not place base64 in the send body.

Upload a Sending attachment separately:

```bash
sendmux sending:upload-attachment \
  --profile sending \
  --body-file ./report.pdf \
  --query filename=report.pdf \
  --query content_type=application/pdf \
  --json
```

Send a mailbox message with a local attachment:

```bash
sendmux mailbox:send-message \
  --profile mailbox \
  --idempotency-key "$IDEMPOTENCY_KEY" \
  --attach ./report.pdf \
  --body '{"to":[{"email":"user@example.com","name":null}],"subject":"Report","text_body":"Attached."}' \
  --json
```

Mailbox attachment upload commands share the 7,500,000 byte per-attachment cap. For larger files, split the file or host it externally and send a link.

Upload a mailbox attachment by presigned URL:

```bash
sendmux mailbox:upload-attachment \
  --profile mailbox \
  --file ./report.pdf \
  --via-presigned \
  --json
```

Poll one unchanged-safe delivery log:

```bash
sendmux management:get-email-log \
  --profile default \
  --path public_id=dlog_abc \
  --if-none-match "$ETAG" \
  --json
```

## Routing

- First setup/auth check: `sendmux-getting-started`.
- Sending strategy and body shape: `sendmux-send-email`.
- Attachment file paths and presigned upload/download: `sendmux-attachments`.
- Mailbox read, search, sync, triage, or reply: `sendmux-mailbox-agent`.
- Account-level management strategy: `sendmux-management`.
- MCP connection setup: `sendmux-mcp-setup`.
- Cheapest-call doctrine: `sendmux-token-efficient-usage`.
