# Sendmux Agent Skills

Official Sendmux skills for AI coding agents.

## Marketplace install

This repository contains Sendmux plugin bundles for Cursor, Claude, and Codex. The Cursor bundle is prepared but is not available through `/add-plugin` until its marketplace submission is approved.

Cursor (after marketplace publication):

```text
/add-plugin sendmux
```

Claude app, Claude Desktop, and Cowork:

1. Open **Customize**.
2. Go to **Plugins**.
3. In **Personal plugins**, click **+** and choose **Add marketplace**.
4. Choose **Add from a repository**.
5. Enter `Sendmux/skills`, then install the **Sendmux** plugin.

Claude Code:

```text
/plugin marketplace add Sendmux/skills
/plugin install sendmux@sendmux
/reload-plugins
```

Codex app and Codex CLI:

```bash
codex plugin marketplace add Sendmux/skills
```

Then open **Plugins** in the Codex app or `/plugins` in Codex CLI and install **Sendmux** from the Sendmux marketplace.

## Direct Agent Skills install

Use `skills add` when your agent supports raw Agent Skills rather than plugin marketplaces.

```bash
npx skills add Sendmux/skills
```

Install one skill from the pack:

```bash
npx skills add Sendmux/skills --skill sendmux-send-email
```

Update an installed pack:

```bash
npx skills update
```

## What This Pack Teaches

- Choose the cheapest correct Sendmux surface for the task: MCP for connected agents, the `sendmux` CLI for terminal one-shots, and SDKs for application flows.
- Use the right credential for each job: `smx_root_*` for account-level work, send-capable `smx_mbx_*` keys or owner-approved Sending-resource `smx_agent_*` tokens for sending, `smx_mbx_*` keys for single-mailbox work, and scoped `smx_agent_*` tokens for self-registered agent mailbox work.
- Prefer efficient calls: batch operations, cursor pagination, conditional requests, idempotency keys, counts, snippets, and delta sync where the public surface supports them.
- Verify results before reporting success.

## Skills Catalogue

The catalogue is built item by item from the local API, SDK, CLI, and MCP source of truth.

| Skill                           | Use when                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `sendmux-getting-started`       | Choosing a Sendmux surface, setting up auth, or making a first verified call.                           |
| `sendmux-send-email`            | Sending single or batch transactional email.                                                            |
| `sendmux-attachments`           | Uploading, downloading, or sending attachments without wasting context on base64.                       |
| `sendmux-mailbox-agent`         | Reading, triaging, replying, or syncing one mailbox.                                                    |
| `sendmux-management`            | Managing domains, mailboxes, sending accounts, webhooks, billing, and logs.                             |
| `sendmux-cli`                   | Using the `sendmux` CLI from a terminal.                                                                |
| `sendmux-mcp-setup`             | Connecting Sendmux MCP servers to an agent client.                                                      |
| `sendmux-token-efficient-usage` | Choosing low-token Sendmux calls and avoiding wasteful reads.                                           |
| `sendmux-email-for-agents`      | Giving an AI agent an inbox, challenge-first self-registration flow, or email workflow, even when Sendmux is not named. |

## Target matrix

| Target | Recommended install |
| --- | --- |
| Cursor | After official marketplace publication, run `/add-plugin sendmux`. |
| Claude app, Claude Desktop, Cowork | Add marketplace from repository `Sendmux/skills`, then install **Sendmux**. |
| Claude Code | `/plugin marketplace add Sendmux/skills`, then `/plugin install sendmux@sendmux`. |
| Codex app and Codex CLI | `codex plugin marketplace add Sendmux/skills`, then install **Sendmux** from **Plugins** or `/plugins`. |
| Agent Skills clients | `npx skills add Sendmux/skills`. |
| Single-skill installs | `npx skills add Sendmux/skills --skill <skill-name>`. |

Marketplace plugins and raw Agent Skills only teach workflows. They do not grant Sendmux access. Authorise hosted MCP, create API keys, or use agent access before asking an agent to act on Sendmux data.

## Development

This repo uses the Agent Skills format:

```text
skills/
  <skill-name>/
    SKILL.md
    references/
    scripts/
    assets/
```

Each skill must be validated, benchmarked against a baseline, and packaged before it is marked complete.

Generate Cursor, Claude, and Codex marketplace bundles:

```bash
node scripts/build-plugin-bundles.mjs
node scripts/check-plugin-bundles.mjs
```

The canonical skill source stays in `skills/`. Cursor reads it directly; generated Cursor, Claude, and Codex manifests plus both MCP files are checked for drift in CI.

See `docs/eval-lint-package-playbook.md` for the local eval, lint, package, and install-smoke loop.
See `docs/regen-update-playbook.md` for the source drift check and regeneration procedure.
