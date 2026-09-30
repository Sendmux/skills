# Skill compatibility review

These records approve an exact skill digest against the selected public contract
digest. A source revision change alone is not approval. The checker requires the
selected contract to remain unchanged or a newly bound review/evaluation.

All eleven skills were reviewed against immutable deployed API exports and the
SDK source. The exported API JSON matches the SDK snapshots, including schemas,
descriptions, permissions, defaults and limits. Source review also checked the
registration, durable-read, storage, sending-approval and token-lifetime policy
fingerprints used by the relevant skills. The registration flag was independently
observed enabled in all four ready production instances; only its selected value
enters the policy fingerprint. No private code or runtime configuration is copied
into this repository.

The published snapshot is the canonical repository's current main source,
`be7a4670d04ceb481fed4de1457c53d4e2295fee`, which is what skill installs and plugin
updates read. The older v1.6.0 release tag has an earlier MCP package-version
target; this review does not certify every historical installed version.

Two published standalone upload examples omitted the required Content-Length
header. They are incompatible and are superseded by changed, tested instructions.
The corrected examples compute the exact file length and put profile flags after
the command. Actual CLI parsing passed with text and binary files and rejected
empty files. Focused model evaluations passed all twelve assertions.

The two new skills passed thirty-three content assertions and forty native
description-trigger cases. Disposable Claude Code, Codex and Cursor installs
matched source bytes. Model evaluations use simulated workflow responses; they
are not evidence of a live send or mailbox mutation.

The remaining unchanged skills received an explicit source/schema compatibility
review. Generic capability statements track the relevant operation names;
concrete examples track their complete selected contracts and named runtime
declarations. Package entry points and console scripts are selected separately.

This mechanism cannot automatically prove prose meaning, certify third-party
client behaviour, or cover an undeclared dependency. A new skill claim requires
the author to add its owning contract to the map and review it. A hash refresh
without a matching review or workflow evidence cannot clear a failed gate.

No email, account, mailbox, permission, or production data was changed by these
evaluations. New hosted OAuth and published-package acceptance remain separate
release checks.
