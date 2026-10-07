The supplied setup guide says `sendmux-mcp` supports MCP protocol revisions `2025-11-25` and `2026-07-28` over stdio or Streamable HTTP. These date-labelled revisions identify the protocol it speaks; the package version identifies a software release.

Keep release and catalogue claims separate:

| Reference in the guide | Package version | Full tool catalogue |
| --- | --- | --- |
| Released historical reference | `2.1.3` | 54: 26 Mailbox, 22 Management, 6 Sending |
| Unpublished candidate source | `2.2.0` | 64: 35 Mailbox, 23 Management, 6 Sending |

The candidate's declared version and tool counts do not prove that `2.2.0` has been published.

A customer should expect the tools permitted by their approved OAuth grant. Selected surfaces and credential permissions determine the visible subset; seeing fewer tools does not redefine the full catalogue or imply a broken connection. For a multi-mailbox grant, first use `mailbox_list_granted_mailboxes`, then pass the returned `mailbox_id` when targeting a mailbox. Tool discovery alone does not validate the upstream credential; the selected surface's harmless connection check can verify the connection without sending email.

Clients named in the guide have documented configuration examples. Naming them does not certify compatibility: verify the chosen client separately for its configuration, transport and authentication flow.
