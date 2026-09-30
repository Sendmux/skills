# Full registration revocation compatibility review — 2026-09-30

Nine existing review bindings now include the previously omitted full-registration revocation dependency. Product source, skill instructions and completed workflow evaluations are unchanged.

The source review used app `043544c168faf3124893358bacb0d54042af238b` and Sending `214f87fbfa5d2016dbc77bee343776675a55996f`. Full registration revocation invalidates durable read access and derived Sending tokens, clears recovery and approval state, and cancels pending invitations. The read and Sending authorisation checks reject the revoked state. Owner revocation of sending remains a separate operation that preserves active durable reads and the current storage allocation.

The added policy inputs cover the revocation endpoint, its entry functions, shared state transition and invitation cancellation. Only the durable-read and delegated-sending policy fingerprints changed. The exported OpenAPI and selected registration/storage policies are byte-identical to the previous reviewed inputs. The final SDK revision changes release guards rather than these selected contracts; the existing SDK source-review revision remains recorded honestly.

Validation: the focused producer regression failed before the selector fix and passes afterwards, including comment-only no-impact checks. All eight producer freshness checks passed without skips. The actual candidate checker rejected the old review records against the regenerated policy before these explicit source reviews were renewed.

Existing workflow evidence remains bound to the same instruction and prompt hashes. The two incompatible published upload examples remain superseded by their previously evaluated replacements. This review adds no model evaluation, live revocation, mailbox mutation or sending result.
