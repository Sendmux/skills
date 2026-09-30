These commands measure the file's real byte length and upload it as a Sending attachment using the `work` profile. They do not send an email. I have not run them, so no upload result or `attachment_id` exists yet.

```zsh
# 1. Measure the exact on-disk byte length
SIZE_BYTES="$(wc -c < ./report.pdf | tr -d '[:space:]')"

# 2. Stop if the measurement is empty, non-numeric, or zero
[[ "$SIZE_BYTES" == <-> && "$SIZE_BYTES" -gt 0 ]] || { print -u2 "Could not measure ./report.pdf"; return 1 2>/dev/null || exit 1; }

# 3. Upload the raw bytes as a Sending attachment (no email is sent)
sendmux sending:upload-attachment --profile work \
  --body-file ./report.pdf \
  --header Content-Length="$SIZE_BYTES" \
  --query filename=report.pdf \
  --query content_type=application/pdf \
  --json
```

Notes:
- **Byte length:** `wc -c < ./report.pdf` counts the actual bytes in the binary file. It does not estimate from the filename or character count. `tr` removes the padding spaces that macOS `wc` adds.
- **Credentials:** The command uses `--profile work`, placed after `sending:upload-attachment`. It sets no `SENDMUX_API_KEY` and puts no key in the command line.
- **File transfer:** `--body-file` streams the PDF directly, so no base64 passes through the conversation.
- **Content-Type:** The explicit `application/pdf` is passed. If Sendmux rejects the file or it exceeds the Sending size limit, the command returns Sendmux's own error. Don't try to work around the limit.
- **Next step:** A successful response includes an `attachment_id` (`att_...`). Use that ID in a later `sending:send` or `sending_send_email` request as `{"attachments": [{"attachment_id": "att_..."}]}`. Don't use it with the Mailbox `blob_id` flow.
