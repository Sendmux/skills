# Actual published skills baseline reconciliation

Reviewer: Codex independent source reviewer, `skills-published-baseline-audit`.
Reviewed: 2026-10-04 18:58 Australia/Melbourne.
Scope: source compatibility reconciliation only; no new evaluation or acceptance.

## Immutable inputs

Actual latest published pack is `v1.7.1` at `fc7c11647c3bb9f6ba80e0aa6679ad6895d94ce1`, independently verified by the parent through public release/main readback. The previous pin, `be7a4670d04ceb481fed4de1457c53d4e2295fee`, contains version `1.6.0` and nine skills; it remains a genuine historical baseline, but is not the latest published pack.

Root's normal evidence checkpoint is `7a6d3ec1045f6a89363ff461b63ac703e572e363`. Normal rebase onto published `fc7c116` produced clean source `f575b1d645cee52ef34319852acb3f7eb961745b`. All eleven upstream metadata/evidence changes were carried; compared with the checkpoint, `skills/**` and generated plugin skill copies are unchanged. Current source producer bindings remain app `5000ba2ec29cb1c399921aa9aa19f7df04fb92f5`, Sending `2c324361e353bd4abcd399b6e19be1855deebe5b` and SDK `7e867c5bd7b7c85add27c7c04e036997ae57dbc4`. Historical supplied runtime-policy qualification remains.

## CLI replacement review

The actual published CLI whole-skill digest is `ba1e4cc36d503b7e4e0b58c30e91d08d30b420c261ec6b3f10e41e62c9420060`. The unchanged evaluated candidate digest is `9b16a314a4abaff01fa663caabe6fd5f7583d626b63609b1e81cfc182103e1be`, with body SHA256 `25f8c2ec8674eda97334471e15d5bf5050f99003e4d45f3d3e31574d845b5c9e` and current selected contract digest `2da62662eb0ead5cddc91483390b4208519bb3efc15d95c8d121b9af876d93c9`.

Direct `fc7c116` to `f575b1d` CLI body comparison changes only the catalogue paragraph and two counts: `skills/sendmux-cli/SKILL.md:126` qualifies the new catalogue as unpublished candidate source, `:130` changes Management 54 to 57, and `:131` changes Mailbox 42 to 52. Standalone-upload instructions and all other CLI skill files remain unchanged. Source comparison supports retention of published guidance; it is not a model execution or published-package verification.

Existing original CLI workflow review `reviews/monid-20261004/sendmux-cli.json:6` names previous whole-skill digest `276b34a4d99df580fe1322117feba5bfda96bf86a6ba755766d2fe4d8f975510` from be7. `scripts/skill-compatibility.mjs:315-321` requires replacement workflow previousSkillDigest to equal the actual published entry. The additive published-1.7.1 workflow review names actual `ba1e4cc3...`, preserves that original review byte-for-byte, and comes first for the exact candidate skill/contract tuple because `findReview:309-310` selects the first match.

## Genuine evaluation reuse and limits

The existing current CLI evaluation is reused exactly. Independent source checks verified its original receipt binds the unchanged candidate body and exact prompt; metadata/output/grading hashes match; six assertions match six passed grades; benchmark run and expectations agree. The original review's 23 evidence files retain their recorded SHA256s. No run, output, assertion, grade, benchmark, timing, metadata or provenance is changed.

The existing `old_skill` receipt explicitly names be7 at `three-skill-packet/sendmux-cli/eval-0-standalone-upload-byte-length/old_skill/run-1/receipt.json:11-14`. Its 5/6 result remains a comparison against be7 only. No old-arm run against fc7 occurred, and no measured improvement against published 1.7.1 is claimed. The current six-assertion case asks for standalone upload with measured byte length; it has no catalogue-count or catalogue-qualification assertion. Catalogue source comparison is separate from this genuine explanation-only workflow evidence. Null timing/cost and provenance limitations remain.

The additive review uses the actual published previous digest as a source compatibility replacement binding, supported by this exact published/current comparison and the genuine unchanged candidate evaluation. It does not invent an old fc7 execution, relabel old grades, certify catalogue behaviour through a nonexistent direct case, or claim new model coverage.

## Other lanes and preservation

Actual published and proposed attachments both have whole-skill digest `1683e3417d4184809ecf349175a16271bb8a8c942b7ada148b8831a1e2872af6`; direct matching review evidence applies without superseding published 1.7.1. The retained historical attachment workflow's old `4a2e9ee4...` supersession rationale stays historical. The other three current workflow previous digests already match actual published source. Both category skills are now present in the published snapshot and match the unchanged proposed bytes. Seven unchanged proposed skills match published bytes.

All 105 adopted evidence files, four current workflow records, seven current compatibility records, historical attachment workflow, earlier history, and both upstream Management supplemental reviews remain byte-exact. Map changes only add this CLI review first and replace the new candidate's published pin with fc7; previous map entries keep their relative order, dependency selectors and producer revisions.

Pure inspection and static review-selection checks are separate from owning acceptance. Final committed skills SHA requires fresh canonical candidate preparation and complete 11-published/11-proposed compatibility acceptance. Viewer/prompt review, trigger/feedback, package/install parity, public package identity and release/version/publication gates remain open and parent-owned. No version bump, runtime, model evaluation, suite, install, network, credential, production or publication action is part of this reconciliation.
