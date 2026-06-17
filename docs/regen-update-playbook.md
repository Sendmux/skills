# Regeneration and Drift-Check Playbook

Use this playbook before publishing the pack, and whenever the Sendmux OpenAPI, SDK, CLI, or MCP surface changes.

## Source Repos

- Skills pack: `/Users/rj/Desktop/GIT-REPOS/sendmux-skills`
- Docs/OpenAPI snapshots: `/Users/rj/Desktop/GIT-REPOS/sendmux-docs`
- SDK/CLI/MCP packages: `/Users/rj/Desktop/GIT-REPOS/sendmux-sdk`

Override paths only when running from a different checkout:

```bash
SENDMUX_DOCS=/path/to/sendmux-docs \
SENDMUX_SDK=/path/to/sendmux-sdk \
node scripts/check-skill-drift.mjs
```

## Drift Check

Run from the skills repo root:

```bash
node scripts/check-skill-drift.mjs
```

The script checks that:

- Sending OpenAPI still exposes `POST /emails/send` and `POST /emails/send/batch`.
- Mailbox OpenAPI still exposes batch, count, snippet, changes, event, and query-changes endpoints.
- CLI metadata still exposes the `sendmux` binary and `mailbox`, `management`, `profiles`, and `sending` topics.
- MCP curation still contains the low-token mailbox, management, and sending tools taught by the skills.
- SDK package manifests still use the names referenced by the skills.
- The pack still contains all eight expected skill folders and catalogue entries.
- The skill corpus still teaches key prefixes, idempotency, conditional requests, cursor pagination, MCP servers, and efficient tool aliases.

If the script fails, treat the error as a source-to-skill drift signal. Update the affected skill text, evals, README, or metadata, then rerun the script.

## Regeneration Procedure

1. Refresh source facts:

   ```bash
   git -C /Users/rj/Desktop/GIT-REPOS/sendmux-docs status --short
   git -C /Users/rj/Desktop/GIT-REPOS/sendmux-sdk status --short
   node scripts/check-skill-drift.mjs
   ```

2. Identify affected skills:

   - Sending API or `@sendmux/sending`: `sendmux-send-email`, `sendmux-token-efficient-usage`, `sendmux-email-for-agents`.
   - Mailbox API or `@sendmux/mailbox`: `sendmux-mailbox-agent`, `sendmux-token-efficient-usage`, `sendmux-email-for-agents`.
   - Management API or `@sendmux/management`: `sendmux-management`, `sendmux-token-efficient-usage`, `sendmux-email-for-agents`.
   - CLI package: `sendmux-cli`, plus task skills that include CLI examples.
   - MCP package: `sendmux-mcp-setup`, plus task skills that name MCP tools.
   - Install or catalogue metadata: `README.md`, `skills.sh.json`, and affected `agents/openai.yaml` files.

3. Update affected files surgically:

   - Edit `skills/<skill-name>/SKILL.md`.
   - Update `skills/<skill-name>/evals/evals.json` when the expected workflow changes.
   - Regenerate or edit `skills/<skill-name>/agents/openai.yaml` only when the skill trigger or user-facing metadata changes.
   - Update `README.md` and `skills.sh.json` when the catalogue, install matrix, or grouping changes.

4. Run the per-skill loop from `docs/eval-lint-package-playbook.md` for every changed skill.

5. Run pack-level checks:

   ```bash
   node scripts/check-skill-drift.mjs
   git diff --check
   ```

6. Before publish, rerun cross-tool install validation from a temporary project:

   ```bash
   npx --yes skills add /path/to/sendmux-skills --skill '*' \
     --agent claude-code --agent cursor --agent codex \
     --agent github-copilot --agent windsurf --agent gemini-cli \
     --agent cline --copy --yes
   ```

## Injected-Drift Smoke Test

Use this to prove the check fails when a source surface changes:

```bash
mkdir -p /tmp/sendmux-skills-drift
node -e "const fs=require('fs'); const src='/Users/rj/Desktop/GIT-REPOS/sendmux-docs/openapi-sending.json'; const dst='/tmp/sendmux-skills-drift/openapi-sending.json'; const spec=JSON.parse(fs.readFileSync(src,'utf8')); delete spec.paths['/emails/send/batch']; fs.writeFileSync(dst, JSON.stringify(spec, null, 2));"
SENDMUX_SENDING_OPENAPI=/tmp/sendmux-skills-drift/openapi-sending.json \
node scripts/check-skill-drift.mjs
```

Expected result: non-zero exit and an error containing `Sending OpenAPI missing POST /emails/send/batch`.
