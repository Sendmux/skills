```sh
report_bytes="$(wc -c < ./report.pdf | tr -d '[:space:]')"
printf 'Local file length: %s bytes\n' "$report_bytes"

sendmux sending:upload-attachment \
  --profile work \
  --body-file ./report.pdf \
  --query filename=report.pdf \
  --query content_type=application/pdf \
  --json
```

`wc -c` measures the actual binary byte length. The upload reads the file directly and uses credentials from the existing `work` profile. This uploads an attachment without sending an email.

These commands have not been run; no upload result is available.
