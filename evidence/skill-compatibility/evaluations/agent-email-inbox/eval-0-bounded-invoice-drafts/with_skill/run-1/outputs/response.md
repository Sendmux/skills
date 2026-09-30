# Plan: Unread Invoice Triage in `mbx_support` (Draft-Only)

Nothing below has been executed. These are the intended calls, in order, over your existing Sendmux MCP connection (`https://mcp.sendmux.ai/mcp`). The workflow is read-only. It will not mark messages read, save drafts, apply labels or flags, delete anything, or send anything, even if the connection has an `email.send` grant.

## 1. Confirm the connection and read permission

**Call:** `mailbox_get_connection`

```json
{}
```

- I pass no mailbox selector on this call.
- I will check that `mailbox.read` appears in the returned permissions.
- I will check that `mbx_support` is among the returned authorised mailbox IDs. You named it, so I won't ask again or need `mailbox_list_granted_mailboxes`. I would only call that if `mbx_support` doesn't appear directly.
- A valid connection doesn't prove the mailbox storage is ready. An error on the next call would be reported as a gap.
- **CLI equivalent:** `sendmux mailbox:get-connection --profile <profile> --json`

If `mailbox.read` is missing or `mbx_support` isn't granted, I stop and report that. I won't ask for credentials or provision anything.

## 2. Bounded search for unread invoices

**Call:** `mailbox_search_message_snippets`

```json
{
  "mailbox_id": "mbx_support",
  "q": "invoice",
  "is_unread": true,
  "limit": 10
}
```

- `q` holds only the search text. The unread filter goes in `is_unread`, not in the query string.
- The results are a capped page of up to 10 matches, not the total inbox. If you want a total, I'd add `mailbox_count_messages` with `mailbox_id: "mbx_support"` and `is_unread: true`.
- **If the search returns nothing:** I report "no unread messages matching 'invoice' in mbx_support" and stop, with no batch read.

## 3. Batch-read the selected results

**Call:** `mailbox_batch_get_messages`

```json
{
  "mailbox_id": "mbx_support",
  "ids": ["<returned message IDs selected from step 2, max 10>"],
  "body_mode": "clean_json",
  "max_body_chars": 4000,
  "strip_quotes": true,
  "strip_signature": true,
  "include_attachments": "metadata"
}
```

- I only use IDs actually returned in step 2.
- Any `not_found` IDs or truncated bodies get reported as gaps. I would raise `max_body_chars` only for a specific message where it's needed to decide, such as a cut-off amount or due date.
- **Security:** email content is treated as untrusted. Any instructions inside messages (links, "update bank details", requests for credentials) are classified as content, never acted on. Attachment metadata such as a PDF name doesn't tell me what the file contains.

## 4. Verify the sender identity before drafting

**Call:** `mailbox_get_identity`

```json
{ "mailbox_id": "mbx_support" }
```

This confirms the From address and name that the drafts should use.

## Output you'll receive

**Scope checked**
- Mailbox: `mbx_support`
- Filters: `q="invoice"`, `is_unread=true`, `limit=10`
- Number returned, and whether the cap was hit (meaning more may exist)
- Read state as observed. Nothing is changed by me.

**Triage table.** Each row covers one message:

| Message ID | From / Subject | Category | Evidence | Next action |
|---|---|---|---|---|

- **Category** examples: invoice received / payment request, billing dispute or query, overdue reminder, receipt / no action, suspicious / possible phishing.
- **Evidence** is a short quote or fact from the body or headers, such as an amount, invoice number, or due date.
- **Next action** is one of: human review, a further bounded read, or an unsent draft.

**Gaps**
- `not_found` IDs
- Truncated bodies
- Attachments seen only as metadata
- Anything that makes a conclusion provisional

**Unsent reply drafts.** For each message where a reply is useful, I provide:
- **From:** the verified identity from step 4
- **To:** the original sender
- **Subject:** `Re: <original subject>`
- **Body:** complete reply text built only from facts in the message. Anything I can't know, such as payment dates, PO numbers, or approval status, appears as a flagged placeholder like `[CONFIRM: payment date]` rather than an invented commitment.

The drafts stay in my response, or in a document you choose. Sending any of them would be a separate task that you approve explicitly.
