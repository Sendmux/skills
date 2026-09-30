# Invoice Triage Report (Draft-Only)

I can't finish this by assuming the missing text agrees with the sender. Doing so would state facts about the dispute that nothing supports. The findings below are **provisional**, and each gap is listed.

## Scope checked

- **Mailbox and filters:** These came from the earlier connection and search steps, which aren't in this evidence. Fill them in from those results, for example `q: "invoice"`, `is_unread: true`, `limit: 10`.
- **Batch-get requested:** `msg_21`, `msg_22`
- **Mailbox writes:** None. No saved drafts, read-state changes, labels or sends.

## Messages reviewed

| ID | Category | Evidence | Next action |
|---|---|---|---|
| `msg_21` | Invoice dispute (provisional) | The body starts as a dispute but `content.body.is_truncated: true`. The disputed amount, invoice number, reason and requested remedy are not confirmed. | Do one bounded re-read of `msg_21` only, with a higher `max_body_chars` (e.g. 12000). |
| `msg_22` | Unknown | It was returned in `not_found`, so no content was retrieved. | Re-check the ID against the original search results. Do not guess its content. |

## Unresolved gaps

1. The dispute's substance in `msg_21` is cut off. Any conclusion about who is right is unsupported.
2. `msg_22` is missing. It may have been deleted, moved or mistyped, or it may be outside the grant.
3. The sender identity for replies still needs verifying with `mailbox_get_identity` if that hasn't already been done.

## Suggested bounded re-read (not executed)

```json
{
  "ids": ["msg_21"],
  "body_mode": "clean_json",
  "max_body_chars": 12000,
  "strip_quotes": true,
  "strip_signature": true,
  "include_attachments": "metadata"
}
```

Add `mailbox_id` if the connection covers multiple mailboxes.

## Unsent reply draft: msg_21 (holding reply, no commitments)

- **To:** [sender of msg_21, from message headers]
- **Subject:** Re: [original subject of msg_21]

> Hello,
>
> Thank you for getting in touch about this invoice. We've received your message and are reviewing the details of your dispute. So that we can resolve it accurately, could you confirm the invoice number, the amount you're disputing, and any supporting documents you'd like us to consider?
>
> We'll follow up once our review is complete.
>
> Kind regards,
> [verified sender name / team]

This draft doesn't accept or reject the dispute, promise a credit, or name any figures. Those facts aren't established yet. Once the full body is read, I can revise it with specifics.

No reply is drafted for `msg_22` because there is no content to reply to. Nothing has been sent, and any send would be a separate, approved task.
