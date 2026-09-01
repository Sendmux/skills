---
name: sendmux-cli
description: Use when a user wants Sendmux terminal commands for agent inbox registration, owner invites, profiles, key-scope preflight, JSON output, or Management, Mailbox, and Sending operations.
license: Apache-2.0
metadata:
  author: sendmux
  version: "1.0"
---

# Sendmux CLI

Use this skill when the terminal is the right Sendmux surface.

## Boundaries

- Do not ask the user to paste API keys.
- Use `smx_root_` keys only for `management:*` commands.
- Use `smx_mbx_` keys or scoped `smx_agent_` tokens for `mailbox:*` commands.
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

The CLI persists registration idempotency before the network request, stores the durable credential in the local profile with restricted permissions, never prints it, reloads it from disk, and waits up to 10 minutes for readiness. Rerun registration with the same profile and options to resume safely.

Use the profile for later reads:

```bash
sendmux mailbox:messages:list --profile my-agent --query limit=25 --json
```

Read/receive access has no expiry date while the registration remains active. Sending remains blocked until the owner accepts and approves it. After approval, a command such as `sending:send --profile my-agent` automatically exchanges the durable credential for a one-hour `email.send` token and caches it until near expiry. Full registration revocation removes read access and every delegated token.

The inbox is capped at 500 MiB before approval. Enabling owner-approved sending first raises it to at least 5 GiB. Revoking sending does not itself change the current inbox storage allocation.

## Profiles

Create separate profiles for root and mailbox keys.

```bash
sendmux profiles:set default --api-key "$SENDMUX_ROOT_KEY" --default --json
sendmux profiles:set mailbox --api-key "$SENDMUX_MBX_KEY" --json
sendmux profiles:set sending --api-key "$SENDMUX_MBX_KEY" --json
sendmux profiles:list --json
sendmux profiles:show default --json
```

Profile reads mask stored API keys and never reveal agent credentials. `profiles:set` reports `key_kind` as `root` or `mailbox`; `agent:register` creates a discriminated agent profile.

Authentication resolution:

1. `--api-key`, then `SENDMUX_API_KEY`.
2. If no direct key is present, `--profile` / `-p`, then `SENDMUX_PROFILE`, then the configured default profile.
3. Base URL comes from `--base-url`, then `SENDMUX_BASE_URL`, then the selected profile.

## Preflight

The CLI infers key kind from the prefix before sending a request.

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
| Management |    53 | `management:domains:list`, `management:create-domain`, `management:create-mailbox`, `management:get-spend-summary`, `management:create-webhook`            |
| Mailbox    |    41 | `mailbox:search-message-snippets`, `mailbox:batch-get-messages`, `mailbox:query-message-changes`, `mailbox:send-message`, `mailbox:list-granted-mailboxes` |
| Sending    |     7 | `sending:get-open-api-spec`, `sending:send`, `sending:send:batch`, `sending:upload-attachment`, `sending:create-attachment-upload`, `sending:complete-attachment-upload`, `sending:get-attachment` |
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
