# Skills workflow Node security pins

Status: source candidate only. Merge, release and publication remain held.

Base: `f7da88a6c5946a5eb820c6a9baa4f0e09a1393f3` on canonical `Sendmux/skills` main.

Replace four floating Node `22` selectors with the operator-approved `22.23.4`: OpenClaw validation and publication jobs, plugin bundle validation, and skill drift validation. Existing `actions/setup-node` inputs and workflow behaviour are retained. No skills, public bundles, metadata versions, source revisions, review evidence, compatibility hashes or publishing guards are changed.

Canonical input: https://github.com/actions/setup-node#supported-version-syntax (exact versions); patched runtime target is explicitly operator-approved for this security task.

Local verification on Node 22.23.4:

- `node --test scripts/workflow-boundaries.test.mjs scripts/build-plugin-bundles.test.mjs scripts/publish-openclaw-bundle.test.mjs`: exit 0; 23 passed, zero failed/skipped.
- `node scripts/check-workflow-path-filters.mjs`: exit 0 for both pull_request and push filters.
- `git diff --check`: exit 0.
- Native PR validation/freshness workflows must pass before any merge request is approved. No publishing workflow is manually dispatched.

No tests added, removed or changed. Local logs: Skills MAIN `.claude/artifacts/node-sec-skills-pins/`.

Publication boundary: a merge of these workflow paths into main triggers the existing OpenClaw workflow, including automatic ClawHub publication after validation and freshness. This source PR does not authorize that action. Any merge request must explicitly cover the coupled publication and its rollback; a source revert restores prior workflow selectors but does not undo an external publication. No release/tag is needed or authorized for this workflow-only source candidate.
