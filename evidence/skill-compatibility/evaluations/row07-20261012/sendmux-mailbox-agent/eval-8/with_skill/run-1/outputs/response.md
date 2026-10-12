Re-read the same draft and review a merge; do not overwrite the teammate’s revision 4 with text based on revision 3.

Use an authorised `smx_mbx_` key, scoped `smx_agent_` token or Mailbox OAuth grant for the selected mailbox, with `mailbox.read` and `mailbox.drafts.write`. Include the authorised `mailbox_id` in the query if the credential covers multiple mailboxes. Verify installed-client support before using its draft operations.

1. Read `GET /api/v1/mailbox/drafts/{draftId}` and wait for `ready`. Review the current content against revision 3 and the agent’s proposed text, preserving the teammate’s edits.
2. Save the reviewed merge with `PATCH /api/v1/mailbox/drafts/{draftId}`, using the revision just read as `expected_revision`—`4` only if it is still current. Send only changed fields; omitted fields keep their values. If changing attachments, supply the complete desired list.
3. A save using `expected_revision: 3` returns `409`. On any revision conflict, re-read and review the merge again before retrying; never just substitute a newer revision number into the old update. Keep the returned draft `id`, `revision` and `schedule_version`.

Saving does not authorise sending. Before sending, obtain approval of the exact saved recipients, subject, bodies and attachments at the final revision. Sending needs `mailbox.read` and `email.send`; `mailbox.drafts.write` cannot substitute for sending permission.
