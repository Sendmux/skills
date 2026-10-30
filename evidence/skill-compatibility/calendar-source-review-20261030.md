# Calendar scope compatibility review

This source review covers existing email workflows against App
`87ce115810ebcfa91655295603c27af52fcff96f`, Sending
`2f4226655efc05f109b5feda50ed2ca1570aea91` and SDK
`1812300f1f30102ed0e624bc92cd92224cdf867d`. It does not qualify Calendar SDK,
CLI or MCP operations, installed clients or live delivery.

The selected App contracts add the shared OAuth scopes `calendar.read` and
`calendar.write`. Selected webhook schemas also add `calendar.changed` and a
typed Calendar payload while preserving the mail payload branch. Existing
operation arguments, responses and examples used by these skills remain
supported. Sending and SDK inputs are unchanged.

The latest prior authorisation review covered App `d0becf05`. Its registration,
quota, owner approval, credential exchange and revocation rules remain in place.
The additional calendar scopes do not grant email sending or message-update
permissions. Storage limits, delegated token lifetime and separate owner
acceptance and sending approval remain unchanged.

## Instruction review

Three complete skill bodies needed corrections. Getting started, Sending and
the agent-email router described the durable credential as globally read-only
or unable to perform Mailbox writes. Those statements now describe email sends
and message changes specifically. They do not deny separately scoped calendar
access. The Sending case's expected-output description is narrowed to email
actions. Its scored expectations stay unchanged.

The existing getting-started evaluation also exposed missing setup-authority
guidance in both the old and corrected model responses. The registration
instructions now ask the agent to identify the installed skill and CLI
`--help` as the authority before giving setup steps. The existing assertion is
preserved. An initial router response repeated a remaining broad Mailbox-write
claim from its credential table. That sentence now names email sends and
message changes too.

Eight unchanged workflows receive explicit source compatibility bindings:
inbox triage, AI-agent sending, attachments, CLI, mailbox operation, management,
MCP setup and efficient usage. Review covered their complete instructions and
selected public dependencies. The pinned SDK's catalogue remains the catalogue
taught by CLI and MCP guidance. Added App routes are not counted as released
SDK commands or tools.

## Evidence and limits

Fresh paired native tasks use the three existing owner-approval prompts, case
3 in each changed skill. Each task reads its assigned skill and produces a
planning answer without registration, credential access or sending. Independent
grading retains the existing expectation lists. New records bind the final
body, prompt, output, grade and benchmark hashes. Old-body comparisons remain
distinguishable from final qualification.

Final corrected responses pass all 26 existing expectations: getting started
11/11, Sending 6/6 and the router 9/9. The old setup response scores 10/11
because it omits the installed-skill/CLI-help authority explanation. The first
corrected setup response also scored 10/11 before the instruction was made
explicit. The first corrected router response scored 9/9 but repeated the
table's broad claim that the durable credential was not a Mailbox write
credential. Source review rejected that claim separately from the unchanged
scored expectations. Final source and output checks restrict it to email sends
and message changes.

Native tasks did not expose model identity, timing, token or tool-call counts.
Benchmark defaults for those metrics are not measurements. Only assertion
results and the recorded input/output hashes qualify these planning responses.

The unchanged CLI, MCP and mailbox replacements retain their genuine
historical workflow evidence and published predecessor digests. Changed bodies
use fresh workflow records. No historical output or grade is relabelled as an
evaluation of changed instructions. Unsupported published bodies are
superseded by tested replacements rather than given blanket approval.

Independent reviewers covered inbox/mailbox, onboarding/sending and CLI/MCP.
The coordinating reviewer adopted their findings and bound the changed-body
evidence. Existing mailbox required-field copy and illustrative CLI error-wording
caveats remain excluded from this review. Full committed candidate acceptance
and release qualification remain separate gates.

No live calendar, mailbox mutation, token exchange, email delivery or public
package release is certified by this source review.
