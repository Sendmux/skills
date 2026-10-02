# SDK MCP compatibility release preparation

SDK PR #309 merged as `46e3f02ce325af651073d85e8156a4459bff36e0` after all checks passed. Publication failed before creating any tag: the latest published skills release `v1.7.0` lacks a review for the Management contract digest `67df3dd4257544a338f3f7db22518455e0fd628eb2e892a56014bc77f6ab226f`.

Skills PR #26 already approved the related App-export description change. Its digest `5dd62a8a...` differs from this SDK candidate; that review and the previous review remain unchanged. The added review binds existing skill bytes to the exact SDK contract and source revisions. Independent source review confirmed that the skill invokes verification without claiming a DMARC enforcement level. Only one selected MCP result description changes; inputs, output fields and types, authentication and permissions remain unchanged.

`openclaw.skills.json` advances to `1.7.1`; existing generator updates plugin versions. Release inputs retain the already-released SDK baseline for the instructions targeting MCP `2.1.3`. SDK publication supplies its immutable `46e3f02` override and uses the supplemental review. No skill instruction, evaluation, producer export, workflow or runtime code changed.

Local checks and exact acceptance receipts live under MAIN `.claude/artifacts/sdk-mcp-compatibility/`. CI and a final independent diff review gate the ready PR. Public merge/publication requires explicit operator approval under `AGENTS.md` because main pushes publish to ClawHub and the SDK guard requires a released GitHub acceptance receipt. Preparation does not authorise publication.

Local verification: 52 compatibility, static-drift, plugin and workflow tests passed with no skips; generated plugin check, static drift against pinned released SDK inputs and `git diff --check` exited 0. An initial run used the stale sibling SDK checkout and failed on missing current commands; the pinned archived release input fixed the environment without changing a test.
