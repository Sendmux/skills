# Skill compatibility enforcement — 2026-09-30

Status: checker and workflow changes verified locally; publication and final candidate acceptance remain with the install-surface release task.

`scripts/skill-compatibility.mjs` reads immutable producer exports, SDK source and both published/proposed skill revisions. Per-skill selectors retain relevant API operations, schemas, permissions, defaults, limits, descriptions, MCP annotations, CLI behavior, public helpers, package entry points and producer policy hashes. Capability-only selectors check the named operation identities without hashing unrelated schemas. Formatting, comments and unrelated contracts do not require instruction rewrites.

Matching contracts produce exact-candidate receipts. Changed contracts require an explicit compatibility review or updated instructions with bound workflow evaluations. Missing mappings, sources, reviews, evaluation artifacts, immutable revisions or receipt bindings fail. A changed published skill can be superseded only by a tested replacement bound to its exact old digest. A read-only inspection-map override can seed a review; it cannot override acceptance.

The skill drift workflow checks pinned public inputs and preserves acceptance. OpenClaw publication waits for that workflow, including successful source checks. Push and pull-request filters independently cover the checker, map and `evidence/skill-compatibility/` inputs.

Validation: all 20 compatibility CLI tests passed with no skips. The existing drift, bundle, storage, publisher and workflow-boundary suites passed 39/39 using the task SDK and real API exports. Both changed workflows passed official actionlint 1.7.12, and path-filter validation passed. The final dependency map resolved all eleven actual skills against immutable deployed app/Sending exports and SDK source.

Negative controls demonstrated the important failures: missing policy and changed policy were wrongly accepted before implementation (`Expected "actual" to be strictly unequal to: 0`); changed package entry points and removed lifecycle capabilities failed the same way. Other controls caught stale review/evaluation bindings, broad hashing, catalogue changes and incorrect published-skill supersession. No tests were removed.

Private logs in skills MAIN `.claude/artifacts/install-surface/`: `freshness-check.log`, `freshness-policy-red.log`, `freshness-package-entries-red.log`, `freshness-existing-pinned-check.log`, and the earlier `freshness-*-red.log` files. An unpinned local suite run failed because its default SDK MAIN checkout was stale; the pinned run passed without test changes. Disposable fixture repositories/processes were removed and checked absent.

Final source exports and review records are committed separately by the release coordinator. Acceptance must be generated after that final skills commit. No release, push, live email, or third-party client certification was performed by this lane.
