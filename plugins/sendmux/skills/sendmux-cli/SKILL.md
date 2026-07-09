---
name: sendmux-cli
description: Use the Sendmux command-line interface for terminal-driven Sendmux work. Use when the user wants install commands, profiles, key-scope preflight, --json output, colon-namespaced Sendmux commands, request body/path/query/header flags, or CLI examples for Management, Mailbox, or Sending API operations.
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
- Use a send-capable `smx_mbx_` key or owner-approved Sending-resource `smx_agent_` token for `sending:*` commands. Pre-claim `smx_agent_` tokens cannot send.
- Do not run destructive commands without explicit confirmation.
- Use `--json` for agent-readable output.
- Prefer task-specific Sendmux skills when the user needs strategy; use this skill for exact CLI mechanics.

## Install

```bash
npm install -g @sendmux/cli
sendmux --help
```

The package exposes the `sendmux` binary.
Use the latest CLI before using `smx_agent_` tokens; older installs may reject that prefix before sending a request.

## Profiles

Create separate profiles for root and mailbox keys.

```bash
sendmux profiles:set default --api-key "$SENDMUX_ROOT_KEY" --default --json
sendmux profiles:set mailbox --api-key "$SENDMUX_MBX_KEY" --json
sendmux profiles:set sending --api-key "$SENDMUX_MBX_KEY" --json
sendmux profiles:list --json
sendmux profiles:show default --json
```

Profile reads mask stored keys. `profiles:set` reports `key_kind` as `root` or `mailbox`.

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
