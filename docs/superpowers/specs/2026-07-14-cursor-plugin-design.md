# Sendmux Cursor Plugin Design

Last updated: 2026-07-14 09:34

## Assumptions

1. The first change set prepares and validates the plugin but does not publish a release or submit it to a marketplace. **Confirmed: yes.** [qa-log:2026-07-14-09:30]
2. The canonical root `skills/` directory remains the only source of Sendmux skill content. **Confirmed: yes.** [qa-log:2026-07-14-09:30]
3. Cursor should connect to the existing hosted Sendmux MCP endpoint through its OAuth flow rather than introduce another credential or server. **Confirmed: yes.** [qa-log:2026-07-14-09:30]

## Goal

Make Sendmux installable as a native Cursor plugin while keeping Cursor, Claude, Codex, raw Agent Skills, MCP, CLI, and SDK guidance synchronised from existing public sources. [user] [file:README.md:5] [file:README.md:33] [file:README.md:76]

Success means the repository contains a valid Cursor manifest and hosted MCP configuration, all generated metadata matches the existing plugin version, every canonical skill remains discoverable, CI detects drift, and no release or marketplace submission occurs in this change set. [qa-log:2026-07-14-09:30]

## Decision

Use Cursor's official single-plugin repository layout:

```text
.cursor-plugin/
  plugin.json
.mcp.json
mcp.json
assets/
  sendmux-mark.svg
skills/
  <existing canonical skills>
```

Cursor's official plugin catalogue uses `.cursor-plugin/plugin.json` at the repository root and supports root-level skills and MCP configuration. [research:https://github.com/cursor/plugins] The verified Resend Cursor plugin demonstrates the same thin integration pattern: canonical skills plus a remote HTTP MCP server, without a separate extension runtime. [research:https://github.com/resend/resend-skills]

This is a distribution wrapper, not a new Sendmux product surface. Cursor receives instructions from the existing skills and tools from the existing hosted MCP endpoint. The SDK and CLI remain alternatives taught by those skills. [file:README.md:53] [file:README.md:86]

## Sources of Truth and Synchronisation

- `skills/` owns all skill content. Cursor reads it directly; Cursor-specific copies are forbidden. [file:README.md:90] [qa-log:2026-07-14-09:30]
- `openclaw.skills.json` owns the shared plugin version and canonical repository URL. [file:openclaw.skills.json:4] [file:openclaw.skills.json:5]
- `scripts/build-plugin-bundles.mjs` owns shared Sendmux plugin metadata and generates each marketplace's manifest. [file:scripts/build-plugin-bundles.mjs:22] [file:scripts/build-plugin-bundles.mjs:65]
- One generator function owns the MCP payload. It writes byte-identical `mcp.json` and `.mcp.json` files so Cursor and the Open Plugins MCP component format cannot diverge. [qa-log:2026-07-14-09:30] [research:https://open-plugins.com/]
- The approved Sendmux mark is copied into this public repository as `assets/sendmux-mark.svg`; the manifest references that stable local asset. [user]
- `collectPluginBundleDrift()` compares all generated Cursor, Claude, and Codex files with freshly generated expected output and reports each missing, unexpected, or stale file. [file:scripts/build-plugin-bundles.mjs:239] [file:scripts/build-plugin-bundles.mjs:253]
- Pull-request and `main`-push filters include every generator input and generated Cursor output independently. [file:CLAUDE.md:13] [file:.github/workflows/plugin-bundles.yml:3]

## Cursor Manifest

`.cursor-plugin/plugin.json` contains only fields supported by Cursor's public plugin schema:

- `name`: `sendmux`
- `displayName`: `Sendmux`
- `version`: read from `openclaw.skills.json`
- the shared public description, author, homepage, repository, Apache-2.0 licence, and keywords
- `logo`: `assets/sendmux-mark.svg`
- `category`: `communication`
- `skills`: `./skills/`
- `mcpServers`: `./mcp.json`

Cursor's current public schema explicitly permits these component paths and rejects undeclared fields. Cursor's `author` schema permits `name` and optional `email`, so the Cursor manifest uses `{ "name": "Sendmux" }` and does not copy the URL field used by the existing Claude and Codex manifests. [research:https://github.com/cursor/plugins/blob/main/schemas/plugin.schema.json]

## MCP Configuration

Both MCP files contain the same remote-server definition:

```json
{
  "mcpServers": {
    "sendmux": {
      "type": "http",
      "url": "https://mcp.sendmux.ai/mcp"
    }
  }
}
```

The endpoint is the existing public hosted Sendmux MCP server. Authentication remains its existing OAuth flow; the repository stores no API keys, bearer headers, client secrets, or local launch command. [research:https://github.com/Sendmux/sendmux-sdk/blob/main/packages/python/mcp/README.md] [file:CLAUDE.md:16]

## Generator Changes

Extend the existing generator rather than add a second build system:

1. Add the Cursor manifest and both root MCP files to the allowed generated paths.
2. Add pure builders for the Cursor manifest and MCP payload.
3. Generate those files from the same metadata read already used by Claude and Codex.
4. Include root files in expected-repository drift comparison without weakening the generated-path safety check.
5. Return enough output information for tests and the command summary to describe all three plugin targets accurately.

The current Claude and Codex outputs remain unchanged. [file:scripts/build-plugin-bundles.mjs:189]

## Test-Driven Validation

Tests are added before implementation in vertical slices:

1. **Build output:** assert the Cursor manifest, both MCP files, version, skills path, logo, server type, and exact endpoint.
2. **Single MCP source:** assert `mcp.json` and `.mcp.json` are byte-identical.
3. **Drift:** edit each Cursor output class and confirm `collectPluginBundleDrift()` names the stale file.
4. **Workflow coverage:** assert pull-request and push filters each contain `skills/**`, `openclaw.skills.json`, `.cursor-plugin/**`, `mcp.json`, `.mcp.json`, and the logo input.
5. **Repository validation:** parse every generated JSON file and confirm each canonical `skills/*/SKILL.md` remains present and discoverable.
6. **Safe live check:** make a read-only request to the hosted MCP URL or its published OAuth metadata and confirm an authentication/discovery response. This check must not obtain credentials, invoke a tool, or mutate Sendmux data.

Unit and drift tests run in CI. The live network check is a pre-submission validation because network availability should not make normal repository tests flaky. [qa-log:2026-07-14-09:30]

## Error Handling

- Missing version, repository metadata, canonical skills, or logo fails generation with a precise error.
- Missing, unexpected, or edited generated files fail drift validation with their repository-relative paths.
- Invalid JSON or an unsupported Cursor manifest shape blocks marketplace submission.
- An unavailable hosted MCP endpoint blocks submission validation but does not change or bypass the endpoint.

## Documentation

Update `README.md` to:

- add Cursor to the marketplace install section and target matrix;
- explain that installation provides skills and the hosted OAuth MCP connection but does not itself grant account access;
- rename the development command description from Claude-and-Codex-only to all generated plugin bundles;
- keep `npx skills add Sendmux/skills` as the client-neutral fallback.

The final installation wording must follow Cursor's current official marketplace flow after validation. [research:https://cursor.com/marketplace/publish]

## Non-Goals

- No VS Code extension, Cursor command, hook, rule, agent, background service, or custom UI.
- No duplicated Cursor-specific skill corpus.
- No new Sendmux API, SDK, CLI, MCP server, authentication method, or credential.
- No change to skill behaviour or public Sendmux workflow guidance.
- No release, marketplace submission, or directory listing in this change set.

## Release Boundary

After implementation and local validation, stop for explicit review. A later approved close-off may bump the shared version, create the GitHub release, submit to Cursor's official marketplace, and optionally list the same public repository on cursor.directory or Open Plugins. [file:CLAUDE.md:18] [qa-log:2026-07-14-09:30]
