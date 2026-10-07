**Recommended route:** Start with the human-approved replies workflow, owned by `sendmux-mailbox-agent` for reading threads and preparing replies. Delegated replies sent through an agent profile's Sending access belong to `sendmux-send-email`.

**Setup sequence:** Reuse an existing authorised connection. If setup is needed, `sendmux-cli` owns REST OAuth login and connection validation; select an authorised mailbox afterwards. Hosted MCP requires separate authorisation.

**Credential scope:** Mailbox reading requires `mailbox.read`; sending requires the chosen surface's `email.send`. No actual credential or outgoing-account access has been established here.

**Runtime surface:** Hand implementation to the task skill on the authorised Mailbox or Sending connection. This router documents draft text followed by approval and sending; it does not establish a saved draft that a person can reopen and edit in Sendmux, or a customer-connected outgoing-account workflow. Those requirements need supported-workflow confirmation before promising this route meets them.

**Core calls:** Read the relevant message or thread, then prepare draft text associated with that thread. Keep the work draft-only until the person approves the final message.

**Write gates:** Require approval of the final recipient, subject, body and attachments, plus sending permission for the selected surface. Permission alone does not authorise a send.

**Efficiency:** Use snippets and batch reads for selected messages, delta state for recurring triage, and one stable `Idempotency-Key` per approved logical send, reused on retries.
