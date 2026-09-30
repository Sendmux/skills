Run these from the directory containing `./report.pdf`. None of them sends an email.

**1. Optional: confirm the profile reaches the Sending surface**

```bash
sendmux sending:get-connection --profile work --json
```

This check sends no email and needs no mailbox selector.

**2. Optional: confirm the fields the upload command accepts**

```bash
sendmux sending:upload-attachment --help
```

**3. Measure the file's byte length**

```bash
SIZE_BYTES="$(wc -c < ./report.pdf | tr -d '[:space:]')"
echo "$SIZE_BYTES"
```

- `wc -c` counts raw bytes, not characters.
- Reading via `<` gives just the number, without the filename.
- `tr` removes the padding spaces macOS adds to the output.

**4. Upload the file as a Sending attachment**

```bash
sendmux sending:upload-attachment \
  --profile work \
  --body-file ./report.pdf \
  --header Content-Length="$SIZE_BYTES" \
  --query filename=report.pdf \
  --query content_type=application/pdf \
  --json
```

- `--profile work` uses the credentials stored in your existing profile. No key is typed, and no `--api-key` value appears in process arguments.
- `--body-file ./report.pdf` streams the file's bytes as the request body.
- `Content-Length` is the byte count measured in step 3.
- This command only uploads. It does not call `sending:send` or `sending:send:batch`, so no email is sent.

**What to expect**

These commands have not been run in this evaluation, so I have no upload result or attachment ID to report. When you run step 4, the `--json` output should include the attachment's identifier. You can later pass that ID as an `attachment_id` in a `sending:send` body, but only if you choose to send.
