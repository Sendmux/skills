# Standalone attachment upload examples

Status: corrected and verified locally; root owns publication and release acceptance.

The two standalone Sending upload examples omitted the required `Content-Length` header. Both now measure the exact local file bytes and pass `--header Content-Length="$SIZE_BYTES"`. The attachment skill also explains where an existing profile flag goes, after an evaluation produced an invalid command ordering. No description changed.

## Source and root cause

- Deployed Sending export for `214f87fbfa5d2016dbc77bee343776675a55996f`: `sendingUploadAttachment` requires integer `Content-Length >= 1`.
- SDK `5946a8fbccf4125bdb333685dbdefa881293a09a`, `packages/ts/cli/src/operation-flags.ts:89` and `:153`: required headers are checked before reading `--body-file`.
- `packages/ts/cli/src/operation-runner.ts:277` calculates Content-Length for the combined `--attach` path. The standalone operation does not use that helper.
- Public docs `sending/attachments.mdx:7`, at `3673b3f733bd8c1e4a14073234fb2d36a92da2ed`, require exact binary Content-Length and distinguish file helpers.

Escape: prior workflow evaluations did not execute these standalone upload examples. The API/CLI metadata contained the requirement, but content reuse alone did not verify the executable commands.

## Verification

The original examples failed with:

> Missing header parameter "Content-Length". Pass --header Content-Length=<value>.

An executable offline check runs each documented shell snippet against disposable real files, captures command arguments without invoking Sendmux, and passes them to the actual built CLI option parser. Both snippets now pass a three-byte UTF-8 file and a one-byte binary file. Empty files fail with the expected minimum-one Content-Length error. Result: 6/6 cases green, all observed red before correction. Temporary fixture directories were removed by the verifier.

The first harness attempt matched both a help block and the upload block and stopped before testing; that extraction issue was corrected before the recorded red run. It is not counted as evidence of the product defect.

First focused attachment content evaluation placed `--profile` before the command; the actual CLI rejected it as `command --profile not found`. The additive instruction corrected the next evaluated response. A fake incompatible root key proves the correctly ordered command reaches Sending credential preflight without making a network request.

Final focused content results: 6/6 assertions for `sendmux-cli`, 6/6 for `sendmux-attachments`; each no-skill baseline scored 4/6. Official skill-creator benchmark aggregation produced the reports. Runs were isolated with no tools or MCP, and outputs describe intended behaviour. One run per case is not a statistical guarantee or live upload acceptance. Trigger evaluations were not repeated because descriptions are byte-identical.

Both corrected skills pass official quick validation; regenerated plugin copies match canonical source. Existing unrelated suite results are not relabelled as fresh verification. No live upload, mailbox action or email was performed.

## Artifacts

Private artifact root: `/Users/rj/Desktop/GIT-REPOS/sendmux-skills/.claude/artifacts/install-surface/skills/upload-example-fix/`.

- `verify-examples.mjs`, `parser-red.json`, `parser-green.json`: executable example and byte-boundary proof.
- `profile-order.json`: actual CLI preflight evidence with intentionally invalid, non-secret credentials.
- `sendmux-cli/iteration-1/`: final prompt, output, grading, timing, execution receipt and official benchmark.
- `sendmux-attachments/iteration-1/`: retained failed command-order output.
- `sendmux-attachments/iteration-2/`: final output and benchmark; unchanged no-skill baseline reused.
- `workflow-evaluation-receipt.json`: final content hashes and benchmark hashes.

No compatibility approval or published no-impact record was created. The old published examples are incompatible; release acceptance must bind their evaluated replacements and the exact prior skill digest.
