# Email for AI agents compatibility review

Verdict: the complete unchanged `email-for-ai-agents` skill remains compatible with selected contract `9ca326ae2fce8623b8882771d68bb3f7c39bfaa6e0b235e2e95502c1ad067171`. Codex `/root` reviewed the full instructions, the selected dependency map and the changed authorisation policy source on 2026-10-25. This record covers this skill only; it does not establish acceptance for the other skills in the candidate.

## Exact inputs

| Input | Revision or SHA-256 |
| --- | --- |
| Published skills | `fc7c11647c3bb9f6ba80e0aa6679ad6895d94ce1` |
| Proposed skills before this metadata addition | `bbe8702902ee4d96640399b0c4a4d38e587525ec` |
| Skill directory digest, both snapshots | `eb668c43d4c594ea0e70a59e0c6fb8dc75bed7c3244d0ad706afd2ec770f3060` |
| `skills/email-for-ai-agents/SKILL.md` bytes | `00166b24a755bb9af2492e567be94ee0340b19007293cbc6cbcc02042326b46e` |
| App source | `d0becf05c6cbdc16cb78ba09296884b85d014ad0` |
| Sending source | `2f4226655efc05f109b5feda50ed2ca1570aea91` |
| SDK source | `1812300f1f30102ed0e624bc92cd92224cdf867d` |
| App OpenAPI bytes | `dd39d2329fc51098455f499e551ad3e33f14bc9243c793dfa47fc353a57f62ea` |
| Sending OpenAPI bytes | `eb69dc0ca27e5f42cd9da70e90e2b1a386dfe588b743e47a8d91f3b7928a75e5` |
| Selected app delegated-sending policy code | `cb1230dedace7b7ee2d25eaa2c08f0136d62b48b74a341883345a99bbec93f9e` |

## Change and source review

The previous candidate used app source `1485e733571f795cddb896b5b1dc8c59bc6c7f78` and selected delegated-sending policy `680e203697c19816a376602783e294d49e8baae57ce05a9c3f0c02c8f88aa80c`. Its skill contract digest was `7f5fbf27a667f5885fbc5bba2a15d053c482a75b5a54793e2fa5050f60123223`, already covered by the historical review. The Sending and SDK revisions are identical between those candidates. The app OpenAPI bytes are identical too. This skill selects no app operation; its only app dependency is the delegated-sending policy. That policy change therefore accounts for the changed selected contract.

The changed source coordinates credential exchange, owner approval and revocation with concurrent account deletion. Review traced the account lookup and the remaining validation after that coordination. Missing or deleted accounts cannot obtain a delegated Sending token. Resource, `email.send`, token expiry/revocation, claimed ownership, separate owner approval and mailbox-readiness checks remain in place. Approval still cannot turn a durable read credential directly into Sending authority. Revocation still invalidates the registration and its derived access. The selected scope metadata and revocation endpoint are unchanged. No private source or runtime configuration is reproduced here.

The complete skill remains supported:

| Instruction | Review result |
| --- | --- |
| Establish both kinds of authority | Exact-message approval remains separate from `email.send`; owner acceptance and owner sending approval remain required for a self-registered CLI profile. A connection check still does not certify credits or provider readiness. |
| Prepare one retry-safe request | Selected Sending operations, MCP tools, CLI commands and public SDK declarations are unchanged. Address objects, top-level MCP `Idempotency-Key`, the HTTP header, attachment references and the CLI upload-and-send warning retain their reviewed meanings. |
| Send and reconcile | The selected Sending contract and SDK behaviour are unchanged. The skill retains the identical-payload retry rule, 24-hour replay boundary, conflict/retry handling and the distinction between queued and delivered. |

`git diff --exit-code` between the published and proposed skill directories returned 0. Canonical `inspectCandidate` independently computed the same skill digest and the new contract digest for both snapshots. Historical review and evaluation files remain untouched.

This is a source compatibility review. No fresh model evaluation, live send, credential exchange, client certification, package publication or production mutation was performed. Full candidate acceptance remains a separate gate.
