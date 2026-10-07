```bash
SIZE_BYTES="$(wc -c < ./report.pdf | tr -d '[:space:]')"

sendmux sending:upload-attachment \
  --profile work \
  --body-file ./report.pdf \
  --header Content-Length="$SIZE_BYTES" \
  --query filename=report.pdf \
  --query content_type=application/pdf \
  --json
```

`wc -c` measures the local file's byte length. Credentials stay in the existing `work` profile; this uploads an attachment without sending an email.

The supplied skill describes candidate CLI commands; published-version availability is unverified. No commands have been run here, so no upload result is available.
