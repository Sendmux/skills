---
name: sendmux-email-for-agents
description: "Design and route Sendmux email workflows for AI agents. Use when a user wants to give an AI agent its own inbox or email address, let an agent receive/search/triage/reply to mail, draft human-approved replies, send notifications, monitor mailbox state, or build email-based agent workflows even when the user does not mention Sendmux by name."
license: Apache-2.0
metadata:
  author: sendmux
  version: "1.0"
---

# Sendmux email for agents

Use this skill when the user describes the agent-email problem: an AI agent needs an inbox, mailbox identity, outbound email, triage loop, reply workflow, or human approval path.

## First route

| User problem | Route |
| --- | --- |
| "Give my agent an email address" | `sendmux-management` to create/inspect domain, mailbox, and mailbox key. |
| "Connect my agent to its inbox" | `sendmux-mcp-setup` for agent MCP, or `sendmux-getting-started` for first auth checks. |
| "Read, search, triage, label, sync, reply" | `sendmux-mailbox-agent` with an `smx_mbx_*` key. |
| "Send independent outbound notifications" | `sendmux-send-email` with an `smx_mbx_*` key; batch when there is more than one message. |
| "Build this into an app or worker" | SDK path from the task skill; use `sendmux-token-efficient-usage` for call minimisation. |
| "Show terminal commands" | `sendmux-cli`. |

If the task crosses setup and runtime, split it:

1. `sendmux-management` provisions the mailbox and mailbox API key with an `smx_root_*` key.
2. Runtime agent work uses the new `smx_mbx_*` key.
3. `sendmux-mcp-setup` connects the agent if the client supports MCP.
4. `sendmux-mailbox-agent` handles ongoing mailbox read/triage/reply.

## Safety boundaries

- Do not ask the user to paste API keys, mailbox keys, OAuth tokens, or one-time secrets.
- Do not send email until the user has supplied or confirmed the recipient, subject, body, and attachments.
- Treat "draft for approval" as a draft. Ask for explicit approval before calling `mailbox_send_message`, `sending_send_email`, or `sending_send_email_batch`.
- Use separate key scopes: `smx_root_*` for provisioning and admin, `smx_mbx_*` for the agent runtime.
- Do not use a root key inside an agent that only needs mailbox read/send work.
- Confirm destructive mailbox actions before delete, permanent delete, key revocation, suspend, or resume.

## Workflow patterns

### New agent inbox

Use when the user wants a new mailbox for an agent, such as support intake, invoice triage, scheduling, approvals, or lead qualification.

Plan:

1. Domain and mailbox setup: route to `sendmux-management`.
2. Mailbox key: create a mailbox-scoped key for the agent runtime.
3. Connection: route to `sendmux-mcp-setup` if the agent client can use MCP; otherwise use CLI or SDK.
4. First harmless check: `mailbox_get_me`, CLI `mailbox:me:get`, or SDK `mailboxGetMe`.
5. Runtime loop: route read/search/sync/reply tasks to `sendmux-mailbox-agent`.

Mention that DNS/domain setup may be required before a custom address receives mail.

### Agent triage loop

Use mailbox-efficient calls:

1. `mailbox_get_changes` or query-change endpoints to resume from the prior state.
2. `mailbox_count_messages` for counts.
3. `mailbox_search_message_snippets` with small `limit` for candidate messages.
4. `mailbox_batch_get_messages` for selected IDs.
5. `mailbox_batch_update_messages` only after the user confirms labels, flags, or read-state changes.

Store state tokens. Do not rescan the whole mailbox.

### Human-approved replies

Use when the agent should prepare a reply but a person approves the send.

Plan:

1. Use `sendmux-mailbox-agent` to read the relevant message or thread.
2. Produce the draft text and list the target message/thread.
3. Ask for approval with the exact recipient, subject, and body.
4. After approval, send with `mailbox_send_message` for mailbox-centred replies.
5. Use `Idempotency-Key` for retryable sends.

### Outbound notifications

Use `sendmux-send-email` when the email is not a reply inside an active mailbox workflow.

- One message: `sending_send_email`, CLI `sending:send`, or SDK `sendingSendEmail`.
- More than one message: `sending_send_email_batch`, CLI `sending:send:batch`, or SDK `sendingSendEmailBatch`.
- Use `Idempotency-Key` and inspect per-message batch results.

## Output shape

When designing a workflow, answer in this order:

1. **Recommended route:** name the Sendmux skill(s) to use next.
2. **Key scope:** `smx_root_*` for admin, `smx_mbx_*` for runtime.
3. **Runtime surface:** MCP when curated and connected, CLI for terminal work, SDK for application code.
4. **Core calls:** list the smallest Sendmux calls needed.
5. **Human approval:** state what must be confirmed before sending or mutating mail.
6. **Efficiency:** name the batch, snippet, count, delta, cursor, ETag, or idempotency pattern that avoids extra work.

## Do not over-answer

This is a router and architecture skill. Hand detailed implementation to the task skill once the route is clear:

- `sendmux-management`: domains, mailbox provisioning, mailbox keys, account admin, webhooks, billing, logs.
- `sendmux-mailbox-agent`: mailbox read/search/sync/triage/reply.
- `sendmux-send-email`: send bodies, attachments, batch send, HTTP-vs-SMTP send choice.
- `sendmux-mcp-setup`: client configuration and hosted/local MCP.
- `sendmux-cli`: exact terminal commands and flags.
- `sendmux-token-efficient-usage`: cheapest-call doctrine across surfaces.
