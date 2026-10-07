The approval for revision `5` and schedule version `2` covers the saved content scheduled for tomorrow. It does not approve edited content for immediate sending. Cancel first, then edit, review and approve the new content and immediate send time.

Before any calls, use a send-capable `smx_mbx_` key, appropriately scoped `smx_agent_` token or Mailbox OAuth grant for the authorised mailbox. Never use a root key or request a pasted credential. If the credential covers multiple mailboxes, select the authorised `mailbox_id` and include it in the REST query on every operation. A self-registered agent's registration alone grants no sending authority; owner-approved agent sends follow `sendmux-send-email` and the Sending API. Verify that the installed client actually exposes draft and schedule operations: this skill's operation names come from unpublished candidate source, not proof of a released client.

Permission checks:

- Read the draft: `mailbox.read`.
- Cancel the schedule: `mailbox.read` and `email.send`.
- Edit the draft: `mailbox.read` and `mailbox.drafts.write`.
- Send the saved draft immediately: `mailbox.read` and `email.send`; draft-write permission cannot substitute for sending permission.
- Verify the mailbox's authorised sender identity, recipient rules, credential send scope and current sending policy. A connected outgoing account is a possible route, not permission to send. These checks run again when sending begins; revocation can stop a pending send.

Safe sequence:

1. Read the same saved draft with `GET /api/v1/mailbox/drafts/{draftId}`. Inspect its content, status, `revision` and `schedule_version`. Treat `5` and `2` as the previously approved versions, not assumed current values. If either differs, reconcile the current draft and human intent before proceeding.
2. Cancel with `PATCH /api/v1/mailbox/drafts/{draftId}/schedule`, supplying both current `expected_revision` and `expected_schedule_version`, and `scheduled_for: null`. If the read confirms `5` and `2`, those are the cancellation preconditions. On `409`, re-read and reconcile rather than forcing stale values. Cancellation cannot undo sending that has already begun; do not proceed to a second send if the original send has started or its outcome is unresolved.
3. Confirm cancellation succeeded, then re-read the draft. Capture the resulting revision and schedule version; do not guess their increments. Wait for `ready` before editing or sending.
4. Edit through `PATCH /api/v1/mailbox/drafts/{draftId}` using the last-read `expected_revision` and the changed fields. Omitted fields retain their values. If replacing attachments, provide the complete desired attachment list. On `409`, read the newer draft and review a merge; never overwrite another person's revision.
5. Read the resulting saved draft and obtain human approval of the exact final recipients, subject, bodies and attachments, plus sending immediately. Approval of the old revision does not carry over. Record the approved revision and current schedule version.
6. Send through `POST /api/v1/mailbox/drafts/{draftId}/send`, including the newly approved `expected_revision` and current `expected_schedule_version` even though this is an immediate send after cancellation. Do not reuse revision `5` or schedule version `2` unless current readback actually establishes them. On a stale-version conflict, re-read and reconcile; changed content needs renewed approval.
7. If the send response is lost, read and reconcile the same draft's status, including `queued` or `uncertain`. Never create a new message to retry. The stable draft ID and approved revision identify the saved-draft send; no separate send idempotency key is required.

This is workflow advice only; no cancellation, edit or send has been performed.
