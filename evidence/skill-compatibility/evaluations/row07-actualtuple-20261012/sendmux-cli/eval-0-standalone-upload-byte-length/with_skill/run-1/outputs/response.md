```bash
REPORT_SIZE_BYTES="$(wc -c < ./report.pdf | tr -d '[:space:]')"

sendmux sending:upload-attachment \
  --profile work \
  --body-file ./report.pdf \
  --header Content-Length="$REPORT_SIZE_BYTES" \
  --query filename=report.pdf \
  --query content_type=application/pdf \
  --json
```

Uses existing profile credentials; sends no email. Commands not run; upload result and installed CLI command support unverified.
