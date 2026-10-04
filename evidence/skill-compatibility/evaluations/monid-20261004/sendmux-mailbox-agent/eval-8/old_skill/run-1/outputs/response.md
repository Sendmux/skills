Do not overwrite the teammate's revision 4 using the agent's stale revision 3 view. Re-read the current draft, compare the teammate's changes with the proposed text, and resolve any conflicting edits before retrying.

The skill's mutation-conflict rule is to re-read current resource state before retrying a `409 conflict`. Where a documented mutation supports `if_in_state`, use the state returned by the fresh read; if another edit wins meanwhile, re-read again. Do not assume a revision number is interchangeable with a resource-state token.

This skill does not document saved-draft reads, updates, revision guards, or a draft-specific merge workflow. Verify the supported draft-saving operation and its concurrency guard before attempting the save; do not invent those arguments or use `mailbox_send_message`, which sends the reply. Nothing has been saved or sent by this guidance.
