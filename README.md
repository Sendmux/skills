# Sendmux Agent Skills

Official Sendmux skills for AI coding agents.

Install the pack once it is published:

```bash
npx skills add Sendmux/sendmux-skills
```

Install one skill from the pack:

```bash
npx skills add Sendmux/sendmux-skills --skill sendmux-send-email
```

Update an installed pack:

```bash
npx skills update
```

## What This Pack Teaches

- Choose the cheapest correct Sendmux surface for the task: MCP for connected agents, the `sendmux` CLI for terminal one-shots, and SDKs for application flows.
- Use the right key type for each job: `smx_root_*` for account-level work, `smx_mbx_*` for sending and single-mailbox work.
- Prefer efficient calls: batch operations, cursor pagination, conditional requests, idempotency keys, counts, snippets, and delta sync where the public surface supports them.
- Verify results before reporting success.

## Skills Catalogue

The catalogue is built item by item from the local API, SDK, CLI, and MCP source of truth.

| Skill | Use when |
| --- | --- |
| `sendmux-getting-started` | Choosing a Sendmux surface, setting up auth, or making a first verified call. |
| `sendmux-send-email` | Sending single or batch transactional email. |
| `sendmux-mailbox-agent` | Reading, triaging, replying, or syncing one mailbox. |
| `sendmux-management` | Managing domains, mailboxes, sending accounts, webhooks, billing, and logs. |
| `sendmux-cli` | Using the `sendmux` CLI from a terminal. |
| `sendmux-mcp-setup` | Connecting Sendmux MCP servers to an agent client. |
| `sendmux-token-efficient-usage` | Choosing low-token Sendmux calls and avoiding wasteful reads. |
| `sendmux-email-for-agents` | Giving an AI agent an inbox or email workflow, even when Sendmux is not named. |

## Install Matrix

| Agent | Project path | Global path |
| --- | --- | --- |
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| Cursor | `.agents/skills/` | `~/.cursor/skills/` |
| OpenAI Codex CLI | `.agents/skills/` | `~/.codex/skills/` |
| GitHub Copilot / VS Code | `.agents/skills/` | `~/.copilot/skills/` |
| Windsurf | `.windsurf/skills/` | `~/.codeium/windsurf/skills/` |
| Gemini CLI | `.agents/skills/` | `~/.gemini/skills/` |
| Cline | `.agents/skills/` | `~/.agents/skills/` |
| Other supported agents | Per agent | Per agent |

Claude.ai and Claude Desktop are not `skills add` targets. Upload a zipped individual skill folder manually through **Settings -> Capabilities/Features**.

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

See `docs/eval-lint-package-playbook.md` for the local eval, lint, package, and install-smoke loop.
See `docs/regen-update-playbook.md` for the source drift check and regeneration procedure.
