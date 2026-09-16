# MCP2.1 native fact adoption

## Correctness

`sendmux-mcp` guide guidance and Case 7 now match the `2.1.0` package fact from SDK commit `8a204d91eab96652ec39e9e59cef6280ef88b925`. The supplied producer workspace matched that commit for `pyproject.toml`, `mcp-contract.json`, `server.json`, and `CHANGELOG.md` before use.

## Tests

- RED: `SENDMUX_SDK=/Users/rj/Desktop/GIT-REPOS/sendmux-sdk-combined-native-release SENDMUX_DOCS=/Users/rj/Desktop/GIT-REPOS/sendmux-docs-mcp-oauth node scripts/check-skill-drift.mjs` exited 1 before the patch with only `MCP package identity/version guidance drift`.
- GREEN: plugin/OpenClaw generation and their checkers, workflow path-filter check, and the direct drift check all exited 0 with the same producer roots.
- `node --test` with explicit selectors for all five `scripts/*.test.mjs` files and the same roots: 38 pass, 0 fail.

## Scope proof

- Source normalised by replacing only `2.1.0` with `2.0.0` hashes exactly to base `1ac1ffcbfcd8c28e7acd46bb1cb26677e377f69d` for both changed source files.
- Regenerated plugin MCP copy is byte-identical to the canonical source. Ignored OpenClaw output was archived before regeneration at `.claude/artifacts/skills-native-mcp-21/pre-regeneration-dist-clawhub-skills/`.

## Status

Local change only; no remote action, provider evaluation, release, archive/install acceptance, or publication was performed.
