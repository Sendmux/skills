#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const skillsRoot = process.env.SENDMUX_SKILLS_ROOT || repoRoot;
const docsRoot =
  process.env.SENDMUX_DOCS || "/Users/rj/Desktop/GIT-REPOS/sendmux-docs";
const sdkRoot =
  process.env.SENDMUX_SDK || "/Users/rj/Desktop/GIT-REPOS/sendmux-sdk";
const appOpenApi =
  process.env.SENDMUX_APP_OPENAPI || path.join(docsRoot, "openapi-app.json");
const sendingOpenApi =
  process.env.SENDMUX_SENDING_OPENAPI ||
  path.join(docsRoot, "openapi-sending.json");

const expectedSkills = [
  "sendmux-cli",
  "sendmux-attachments",
  "sendmux-email-for-agents",
  "sendmux-getting-started",
  "sendmux-mailbox-agent",
  "sendmux-management",
  "sendmux-mcp-setup",
  "sendmux-send-email",
  "sendmux-token-efficient-usage",
];

const requiredSendingPaths = [
  ["post", "/emails/attachment-uploads"],
  ["put", "/emails/attachment-uploads/{upload_id}"],
  ["post", "/emails/attachments"],
  ["get", "/emails/attachments/{attachment_id}"],
  ["post", "/emails/send"],
  ["post", "/emails/send/batch"],
];

const requiredMailboxPaths = [
  ["post", "/mailbox/attachments:upload"],
  ["get", "/mailbox/messages/{message_id}/attachments/{attachment_id}"],
  ["post", "/mailbox/attachment-uploads"],
  ["post", "/mailbox/messages:batch-get"],
  ["post", "/mailbox/messages:batch-update"],
  ["post", "/mailbox/messages:batch-delete"],
  ["get", "/mailbox/messages/count"],
  ["get", "/mailbox/messages/query-changes"],
  ["get", "/mailbox/messages/search-snippets"],
  ["get", "/mailbox/changes"],
  ["get", "/mailbox/events"],
  ["get", "/mailbox/folders/changes"],
  ["get", "/mailbox/folders/query-changes"],
];

const requiredMcpTools = [
  "mailbox_count_messages",
  "mailbox_search_message_snippets",
  "mailbox_batch_get_messages",
  "mailbox_get_changes",
  "mailbox_send_message",
  "mailbox_get_attachment",
  "mailbox_read_attachment",
  "mailbox_upload_attachment",
  "mailbox_wait_for_message",
  "management_create_domain",
  "management_create_mailbox",
  "management_create_mailbox_key",
  "management_get_spend_summary",
  "management_create_webhook",
  "sending_create_attachment_upload",
  "sending_get_attachment",
  "sending_send_email",
  "sending_send_email_batch",
  "sending_upload_attachment",
];

const requiredMcpEnv = [
  "SENDMUX_API_KEY",
  "SENDMUX_MCP_SURFACES",
  "SENDMUX_MCP_TRANSPORT",
  "SENDMUX_MCP_HTTP_BEARER_TOKEN",
];

const allowedSkillOnlyEnv = new Set(["SENDMUX_ROOT_KEY", "SENDMUX_MBX_KEY"]);
const allowedUnderscoreIdentifiers = new Set(["mailbox_id"]);

const tsPackages = {
  "packages/ts/sdk/package.json": "@sendmux/sdk",
  "packages/ts/sending/package.json": "@sendmux/sending",
  "packages/ts/mailbox/package.json": "@sendmux/mailbox",
  "packages/ts/management/package.json": "@sendmux/management",
  "packages/ts/cli/package.json": "@sendmux/cli",
};

const phpPackages = {
  "packages/php/sdk/composer.json": "sendmux/sdk",
  "packages/php/sending/composer.json": "sendmux/sending",
  "packages/php/mailbox/composer.json": "sendmux/mailbox",
  "packages/php/management/composer.json": "sendmux/management",
};

const pythonPackages = {
  "packages/python/sdk/pyproject.toml": "sendmux-sdk",
  "packages/python/sending/pyproject.toml": "sendmux-sending",
  "packages/python/mailbox/pyproject.toml": "sendmux-mailbox",
  "packages/python/management/pyproject.toml": "sendmux-management",
  "packages/python/mcp/pyproject.toml": "sendmux-mcp",
};

const rubyPackages = {
  "packages/ruby/sdk/sendmux-sdk.gemspec": "sendmux-sdk",
  "packages/ruby/sending/sendmux-sending.gemspec": "sendmux-sending",
  "packages/ruby/mailbox/sendmux-mailbox.gemspec": "sendmux-mailbox",
  "packages/ruby/management/sendmux-management.gemspec": "sendmux-management",
};

const requiredCorpusTokens = [
  ["root key prefix", /smx_root_/],
  ["mailbox key prefix", /smx_mbx_/],
  ["idempotency header", /Idempotency-Key/],
  ["If-Match header", /If-Match/],
  ["If-None-Match header", /If-None-Match/],
  ["ETag header", /ETag/],
  ["cursor pagination", /pagination\.next_cursor|cursor pagination|next_cursor/],
  ["CLI package", /@sendmux\/cli/],
  ["CLI binary", /\bsendmux\b/],
  ["agent registration command", /agent:register/],
  ["agent owner invite command", /agent:invite-owner/],
  ["durable agent read access", /durable[^\n.]*read|read[^\n.]*without an expiry/i],
  ["owner-gated agent sending", /owner[^\n.]*approv[^\n.]*(?:send|sending)|send[^\n.]*owner[^\n.]*approv/i],
  ["Sending TS package", /@sendmux\/sending/],
  ["Mailbox TS package", /@sendmux\/mailbox/],
  ["Management TS package", /@sendmux\/management/],
  ["MCP package", /sendmux-mcp/],
  ["mailbox MCP server", /sendmux-mcp-mailbox/],
  ["management MCP server", /sendmux-mcp-management/],
  ["sending MCP server", /sendmux-mcp-sending/],
  ["MCP HTTP bearer token env", /SENDMUX_MCP_HTTP_BEARER_TOKEN/],
  ["batch send MCP tool", /sending_send_email_batch/],
  ["mailbox count MCP tool", /mailbox_count_messages/],
  ["mailbox snippets MCP tool", /mailbox_search_message_snippets/],
  ["mailbox batch-get MCP tool", /mailbox_batch_get_messages/],
  ["mailbox changes MCP tool", /mailbox_get_changes/],
  ["attachment skill", /sendmux-attachments/],
  ["mailbox upload attachment MCP tool", /mailbox_upload_attachment/],
  ["mailbox attachment metadata MCP tool", /mailbox_get_attachment/],
  ["mailbox read attachment MCP tool", /mailbox_read_attachment/],
  ["management create domain MCP tool", /management_create_domain/],
  ["management create mailbox MCP tool", /management_create_mailbox/],
  ["management create mailbox key MCP tool", /management_create_mailbox_key/],
  ["sending upload attachment MCP tool", /sending_upload_attachment/],
  ["sending create attachment upload MCP tool", /sending_create_attachment_upload/],
  ["sending get attachment MCP tool", /sending_get_attachment/],
  ["sending attachment upload endpoint", /\/emails\/attachments/],
  ["sending delegated upload endpoint", /\/emails\/attachment-uploads/],
];

const allowedNegativeProofOfWorkGuidance =
  /\bno\s+(?:existing account,\s*)?(?:API key,\s*)?(?:challenge\s+or\s+)?(?:proof_of_work|proof-of-work|proof of work)(?:\s+step)?\s+is\s+(?:required|needed)\b|\b(?:proof_of_work|proof-of-work|proof of work)\b:\*{0,2}\s*neither\s+(?:step|one)\s+is\s+(?:required|needed)\b/gi;

const forbiddenAgentOnboardingPatterns = [
  ["ALTCHA", /\bALTCHA\b/i],
  ["registration challenge", /\/identity\/challenge|registration challenge/i],
  [
    "proof of work",
    /proof_of_work|proof-of-work|proof of work/i,
    allowedNegativeProofOfWorkGuidance,
  ],
  ["identity assertion", /identity_assertion|identity assertion/i],
  ["claim token", /claim_token|claim token/i],
  ["pre-claim credential", /pre-claim/i],
  ["runtime auth instructions", /\/auth\.md/i],
];

const failures = [];

function fail(message) {
  failures.push(message);
}

function fullPath(root, relativePath) {
  return path.join(root, relativePath);
}

function readText(filePath) {
  if (!existsSync(filePath)) {
    fail(`Missing file: ${filePath}`);
    return "";
  }
  return readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  const text = readText(filePath);
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`Invalid JSON in ${filePath}: ${error.message}`);
    return null;
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function readMcpContractFacts() {
  const initialFailureCount = failures.length;
  const contractPath = fullPath(
    sdkRoot,
    "packages/python/mcp/sendmux_mcp/mcp-contract.json",
  );
  const contract = readJson(contractPath);
  if (!isObject(contract)) {
    fail("MCP contract is missing or unusable");
    return null;
  }

  const requiredObjects = [
    ["package", contract.package],
    ["hosted", contract.hosted],
    ["tools", contract.tools],
    ["uploads", contract.uploads],
    ["uploads.mailbox", contract.uploads?.mailbox],
    ["uploads.sending", contract.uploads?.sending],
  ];
  for (const [field, value] of requiredObjects) {
    if (!isObject(value)) {
      fail(`MCP contract ${field} is missing or unusable`);
    }
  }

  const facts = {
    packageIdentity: contract.package?.identity,
    packageVersion: contract.package?.version,
    protocols: contract.protocols,
    hostedResource: contract.hosted?.resource,
    hostedTransports: contract.hosted?.transports,
    toolsBySurface: contract.tools?.by_surface,
    uploads: contract.uploads,
  };

  const requiredStrings = [
    ["package.identity", facts.packageIdentity],
    ["package.version", facts.packageVersion],
    ["hosted.resource", facts.hostedResource],
    ["uploads.mailbox.inline_property", facts.uploads?.mailbox?.inline_property],
    ["uploads.mailbox.tool", facts.uploads?.mailbox?.tool],
    ["uploads.sending.inline_property", facts.uploads?.sending?.inline_property],
    ["uploads.sending.limit_authority", facts.uploads?.sending?.limit_authority],
    ["uploads.sending.presigned_tool", facts.uploads?.sending?.presigned_tool],
    ["uploads.sending.tool", facts.uploads?.sending?.tool],
  ];
  for (const [field, value] of requiredStrings) {
    if (!isNonEmptyString(value)) {
      fail(`MCP contract ${field} is missing or unusable`);
    }
  }
  if (
    isNonEmptyString(facts.packageVersion) &&
    !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(
      facts.packageVersion,
    )
  ) {
    fail("MCP contract package.version is missing or unusable");
  }

  const requiredStringArrays = [
    ["protocols", facts.protocols],
    ["hosted.transports", facts.hostedTransports],
    ["uploads.mailbox.modes", facts.uploads?.mailbox?.modes],
  ];
  for (const [field, value] of requiredStringArrays) {
    if (
      !Array.isArray(value) ||
      value.length === 0 ||
      value.some((item) => !isNonEmptyString(item))
    ) {
      fail(`MCP contract ${field} is missing or unusable`);
    }
  }

  const requiredPositiveIntegers = [
    ["uploads.inline_decoded_max_bytes", facts.uploads?.inline_decoded_max_bytes],
    ["uploads.mailbox.presigned_max_bytes", facts.uploads?.mailbox?.presigned_max_bytes],
    ["uploads.mailbox.request_schema_max_bytes", facts.uploads?.mailbox?.request_schema_max_bytes],
  ];
  for (const [field, value] of requiredPositiveIntegers) {
    if (!isPositiveInteger(value)) {
      fail(`MCP contract ${field} is missing or unusable`);
    }
  }
  if (
    facts.uploads?.sending?.request_schema_max_bytes !== null &&
    !isPositiveInteger(facts.uploads?.sending?.request_schema_max_bytes)
  ) {
    fail(
      "MCP contract uploads.sending.request_schema_max_bytes is missing or unusable",
    );
  }

  if (!isObject(facts.toolsBySurface)) {
    fail("MCP contract tools.by_surface is missing or unusable");
  } else {
    const requiredSurfaces = ["mailbox", "management", "sending"];
    const extraSurfaces = Object.keys(facts.toolsBySurface).filter(
      (surface) => !requiredSurfaces.includes(surface),
    );
    if (extraSurfaces.length > 0) {
      fail(
        `MCP contract tools.by_surface has unexpected surface ${extraSurfaces.join(", ")}`,
      );
    }
    for (const surface of requiredSurfaces) {
      const tools = facts.toolsBySurface[surface];
      if (!Array.isArray(tools) || tools.length === 0) {
        fail(`MCP contract tools.by_surface.${surface} is missing or unusable`);
        continue;
      }
      for (const [index, tool] of tools.entries()) {
        if (
          !isObject(tool) ||
          !isNonEmptyString(tool.name) ||
          !isNonEmptyString(tool.title) ||
          !isNonEmptyString(tool.description) ||
          !isObject(tool.annotations) ||
          !isObject(tool.input_schema) ||
          !Object.hasOwn(tool, "output_schema") ||
          (tool.output_schema !== null && !isObject(tool.output_schema))
        ) {
          fail(
            `MCP contract tools.by_surface.${surface}[${index}] is incomplete or unusable`,
          );
        }
      }
    }
  }

  return failures.length === initialFailureCount ? facts : null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compareSets(label, actual, expected) {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const missing = expected.filter((item) => !actualSet.has(item));
  const extra = actual.filter((item) => !expectedSet.has(item));

  if (missing.length > 0) {
    fail(`${label} missing: ${missing.join(", ")}`);
  }
  if (extra.length > 0) {
    fail(`${label} has unexpected entries: ${extra.join(", ")}`);
  }
}

function containsInOrder(text, values) {
  if (!Array.isArray(values)) return false;
  let offset = 0;
  for (const value of values) {
    const literal = escapeRegExp(String(value));
    const pattern = typeof value === "number"
      ? `(?<![\\w.,+-])${literal}(?!\\w|[.,]\\d|-[\\d.])`
      : `(?<![\\w.+-])${literal}(?![\\w+-]|\\.[\\w])`;
    const matcher = new RegExp(pattern, "g");
    matcher.lastIndex = offset;
    const match = matcher.exec(text);
    if (!match) return false;
    offset = matcher.lastIndex;
  }
  return true;
}

function sameOrderedValues(actual, expected) {
  return (
    Array.isArray(actual) &&
    Array.isArray(expected) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function formattedInteger(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function assertMcpContractPublishing(facts) {
  if (!facts) return;

  const setupText = readText(
    fullPath(skillsRoot, "skills/sendmux-mcp-setup/SKILL.md"),
  );
  const setupEvalsPath = fullPath(
    skillsRoot,
    "skills/sendmux-mcp-setup/evals/evals.json",
  );
  const setupEvals = readJson(setupEvalsPath);
  const evalList = Array.isArray(setupEvals) ? setupEvals : setupEvals?.evals;
  const compatibilityEval = Array.isArray(evalList)
    ? evalList.find((entry) => entry?.id === 7)
    : null;
  const compatibilityExpected = compatibilityEval?.expected_output || "";
  const compatibilityExpectations = Array.isArray(compatibilityEval?.expectations)
    ? compatibilityEval.expectations.join("\n")
    : "";
  const installLine = setupText
    .split("\n")
    .find((line) => line.startsWith("This guide targets ")) || "";

  const packageValues = [facts.packageIdentity, facts.packageVersion];
  const packageGuidanceValid =
    containsInOrder(installLine, packageValues) &&
    /^This guide targets the released\b/i.test(installLine) &&
    containsInOrder(compatibilityExpected, packageValues) &&
    /\bdistinguishes the released\b/i.test(compatibilityExpected) &&
    containsInOrder(compatibilityExpectations, packageValues) &&
    /\bdistinguishes the released\b/i.test(compatibilityExpectations);
  if (!packageGuidanceValid) {
    fail("MCP package identity/version guidance drift");
  }

  const publishedProtocolLists = [
    installLine,
    compatibilityExpected,
    compatibilityExpectations,
  ].map((text) => text.match(/\b\d{4}-\d{2}-\d{2}\b/g) || []);
  if (
    publishedProtocolLists.some(
      (protocols) => !sameOrderedValues(protocols, facts.protocols),
    )
  ) {
    fail("MCP protocol guidance drift");
  }

  const counts = Object.fromEntries(
    ["mailbox", "management", "sending"].map((surface) => [
      surface,
      facts.toolsBySurface?.[surface]?.length,
    ]),
  );
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const countValues = [
    total,
    counts.mailbox,
    counts.management,
    counts.sending,
  ];
  const tableHasCounts = [
    ["Mailbox", counts.mailbox],
    ["Management", counts.management],
    ["Sending", counts.sending],
  ].every(([surface, count]) =>
    new RegExp(`^\\|\\s*${surface}\\s*\\|[^\\n]*\\|\\s*${count}\\s*\\|`, "m").test(
      setupText,
    ),
  );
  if (
    !containsInOrder(installLine, countValues) ||
    !tableHasCounts ||
    !containsInOrder(compatibilityExpected, countValues) ||
    !containsInOrder(compatibilityExpectations, countValues) ||
    !/grant-visible|visible tools/i.test(
      `${setupText}\n${compatibilityExpected}\n${compatibilityExpectations}`,
    ) ||
    !/not[^\n]*certified/i.test(
      `${setupText}\n${compatibilityExpected}\n${compatibilityExpectations}`,
    )
  ) {
    fail("MCP tool catalogue count guidance drift");
  }

  if (!setupText.includes(facts.hostedResource)) {
    fail("MCP hosted resource guidance drift");
  }
  const transportNames = (facts.hostedTransports || []).map((transport) =>
    transport === "streamable-http" ? "Streamable HTTP" : transport,
  );
  if (!transportNames.every((transport) => installLine.includes(transport))) {
    fail("MCP hosted transport guidance drift");
  }

  const attachmentTexts = [
    "sendmux-mcp-setup",
    "sendmux-attachments",
    "sendmux-mailbox-agent",
    "sendmux-send-email",
    "sendmux-token-efficient-usage",
  ].map((skillName) =>
    readText(fullPath(skillsRoot, `skills/${skillName}/SKILL.md`)),
  );
  const attachmentCorpus = attachmentTexts.join("\n");
  const inlineMaximum = formattedInteger(facts.uploads?.inline_decoded_max_bytes);
  if (
    !attachmentTexts
      .filter((_, index) => index !== 2)
      .every((text) => text.includes(inlineMaximum) && /decoded/i.test(text))
  ) {
    fail("MCP inline decoded bound guidance drift");
  }

  const mailboxModeLines = attachmentCorpus
    .split("\n")
    .filter(
      (line) =>
        line.includes("mailbox_upload_attachment") ||
        /MCP inline `?[a-z][a-z0-9_]*_base64/i.test(line),
    );
  const publishedMailboxModes = [
    ...new Set(
      mailboxModeLines.flatMap((line) =>
        line.match(/\b[a-z][a-z0-9_]*(?:_base64|_upload_url)\b/g) || [],
      ),
    ),
  ];
  const contractMailboxModes = Array.isArray(facts.uploads?.mailbox?.modes)
    ? facts.uploads.mailbox.modes
    : [];
  if (
    publishedMailboxModes.length !== contractMailboxModes.length ||
    contractMailboxModes.some((mode) => !publishedMailboxModes.includes(mode))
  ) {
    fail("MCP Mailbox upload modes guidance drift");
  }

  const mailboxPresignedMaximum = formattedInteger(
    facts.uploads?.mailbox?.presigned_max_bytes,
  );
  if (
    ![attachmentTexts[0], attachmentTexts[1], attachmentTexts[2], attachmentTexts[4]].every(
      (text) => text.includes(mailboxPresignedMaximum),
    )
  ) {
    fail("MCP Mailbox presigned maximum guidance drift");
  }
  const mailboxRequestMaximum = formattedInteger(
    facts.uploads?.mailbox?.request_schema_max_bytes,
  );
  if (!attachmentCorpus.includes(mailboxRequestMaximum)) {
    fail("MCP Mailbox request-schema maximum guidance drift");
  }

  const sendingAuthorityPublishingGuidance = [
    ["sendmux-mcp-setup", attachmentTexts[0]],
    ["sendmux-attachments", attachmentTexts[1]],
    ["sendmux-send-email", attachmentTexts[3]],
    ["sendmux-token-efficient-usage", attachmentTexts[4]],
  ];
  const sendingGuidance = sendingAuthorityPublishingGuidance
    .map(([, text]) => text)
    .join("\n");
  const sendingLimitAuthority = String(
    facts.uploads?.sending?.limit_authority,
  );
  const sendingAuthorityMatch = sendingLimitAuthority.match(
    /^upload intent response ([A-Za-z0-9_]+)$/,
  );
  if (!sendingAuthorityMatch) {
    fail("MCP Sending limit authority guidance drift");
  } else {
    const authorityField = escapeRegExp(sendingAuthorityMatch[1]);
    const presignedTool = escapeRegExp(facts.uploads.sending.presigned_tool);
    const authorityPattern = new RegExp(
      `(?:upload intent(?:'s)?|${presignedTool})[^\\n.]*\\breturned\\s+\`${authorityField}\``,
      "i",
    );
    const contradictoryAuthorityPattern = new RegExp(
      `(?:upload intent(?:'s)?|${presignedTool})[^\\n.]*\\brequest(?:ed)?\\s+\`${authorityField}\``,
      "i",
    );
    for (const [skillName, text] of sendingAuthorityPublishingGuidance) {
      if (
        !authorityPattern.test(text) ||
        contradictoryAuthorityPattern.test(text)
      ) {
        fail(`MCP Sending limit authority guidance drift in ${skillName}`);
      }
    }
  }
  const sendingRequestMaximum = facts.uploads?.sending?.request_schema_max_bytes;
  if (
    sendingRequestMaximum === null
      ? !/no universal MCP Sending presign limit/i.test(sendingGuidance)
      : !sendingGuidance.includes(formattedInteger(sendingRequestMaximum))
  ) {
    fail("MCP Sending request-schema maximum guidance drift");
  }
}

function assertMcpFilePathGuidance(facts) {
  if (!facts?.toolsBySurface) return;

  const guidance = [
    [
      "sendmux-attachments",
      /MCP tools do not accept `file_path` or read shared filesystem roots/i,
    ],
    [
      "sendmux-mcp-setup",
      /Local and hosted MCP do not accept `file_path` or shared filesystem roots/i,
    ],
    [
      "sendmux-mailbox-agent",
      /Do not give MCP a local `file_path`[^\n]*CLI[^\n]*SDK file helpers/i,
    ],
    [
      "sendmux-send-email",
      /MCP does not receive a local `file_path`/i,
    ],
    [
      "sendmux-token-efficient-usage",
      /Never use MCP `file_path`/i,
    ],
  ].map(([skillName, negativePattern]) => ({
    skillName,
    negativePattern,
    text: readText(fullPath(skillsRoot, `skills/${skillName}/SKILL.md`)),
  }));
  const contractAcceptsFilePath = Object.values(facts.toolsBySurface)
    .flat()
    .some((tool) =>
      Object.hasOwn(tool?.input_schema?.properties || {}, "file_path"),
    );
  const hasNegativeGuidance = guidance.some(({ text, negativePattern }) =>
    negativePattern.test(text),
  );
  const allNegativeGuidancePresent = guidance.every(({ text, negativePattern }) =>
    negativePattern.test(text),
  );
  const hasPositiveRecommendation = guidance.some(({ text }) =>
    text
      .split("\n")
      .some((line) =>
        /\bMCP(?: tools?)?\s+(?:accepts?|supports?|recommends?|uses?|receives?)[^.\n]*`?file_path`?/i.test(
          line,
        ),
      ),
  );

  if (
    (contractAcceptsFilePath && hasNegativeGuidance) ||
    (!contractAcceptsFilePath &&
      (!allNegativeGuidancePresent || hasPositiveRecommendation))
  ) {
    fail("MCP file_path guidance drift");
  }
}

function textBetween(text, start, end) {
  const startIndex = text.indexOf(start);
  if (startIndex === -1) return "";
  const endIndex = text.indexOf(end, startIndex + start.length);
  return endIndex === -1 ? text.slice(startIndex) : text.slice(startIndex, endIndex);
}

function assertSyncGuidance() {
  const text = readText(
    fullPath(skillsRoot, "skills/sendmux-token-efficient-usage/SKILL.md"),
  );
  const broad = textBetween(
    text,
    "Broad mailbox sync:",
    "For a message-only continuation",
  );
  if (
    !/```bash[\s\S]*?sendmux mailbox:get-changes[\s\S]*?--query types=messages,folders,threads/.test(
      broad,
    ) ||
    !containsInOrder(broad, [
      "data.types.messages.new_state",
      "data.types.folders.new_state",
      "data.types.threads.new_state",
    ])
  ) {
    fail("typed multi-resource sync guidance drift");
  }

  const continuation = textBetween(
    text,
    "For a message-only continuation",
    "Filtered message sync:",
  );
  if (
    !continuation.includes("--query types=messages") ||
    !continuation.includes("data.types.messages.new_state") ||
    !continuation.includes("data.types.messages.has_more") ||
    /next_cursor/.test(continuation)
  ) {
    fail("typed continuation guidance drift");
  }

  const filtered = textBetween(
    text,
    "Filtered message sync:",
    "A polling-loop answer",
  );
  if (
    !filtered.includes("data.new_query_state") ||
    !filtered.includes("data.has_more") ||
    /next_cursor/.test(filtered)
  ) {
    fail("filtered sync guidance drift");
  }

  const listGuidance = text
    .split("\n")
    .find((line) => line.startsWith("- For filtered summary pages")) || "";
  if (
    !listGuidance.includes("pagination.next_cursor") ||
    !listGuidance.includes("next `cursor` input")
  ) {
    fail("list pagination guidance drift");
  }
}

function assertSdkExampleGuidance() {
  const sendingText = readText(
    fullPath(skillsRoot, "skills/sendmux-send-email/SKILL.md"),
  );
  const gettingStartedText = readText(
    fullPath(skillsRoot, "skills/sendmux-getting-started/SKILL.md"),
  );
  const sdkSection = textBetween(
    sendingText,
    "## TypeScript SDK",
    "## Direct HTTP",
  );
  const singleExample = textBetween(sdkSection, "One email:", "Batch:");
  const batchExample = textBetween(sdkSection, "Batch:", "## Direct HTTP");
  const openApiExample = textBetween(
    gettingStartedText,
    "sendingGetOpenApiSpec",
    "## Error handling",
  );

  if (
    !singleExample.includes("response.data.data.message_id") ||
    !singleExample.includes("response.data.data.status") ||
    !batchExample.includes("response.data.data.results") ||
    !openApiExample.includes("response.data.info")
  ) {
    fail("Sending SDK response envelope guidance drift");
  }
  if (
    !singleExample.includes("throwOnError: true") ||
    !batchExample.includes("throwOnError: true") ||
    !openApiExample.includes("throwOnError: true")
  ) {
    fail("throwOnError guidance drift");
  }
}

function assertRecipientBounds() {
  const sendingSpec = readJson(sendingOpenApi);
  const sendRequest = sendingSpec?.components?.schemas?.EmailSendRequest;
  const batchRequest = sendingSpec?.components?.schemas?.BatchSendRequest;
  const ccMaximum = sendRequest?.properties?.cc?.maxItems;
  const bccMaximum = sendRequest?.properties?.bcc?.maxItems;
  const combinedMatches = [
    sendRequest?.properties?.cc?.description,
    sendRequest?.properties?.bcc?.description,
  ].map((description) => String(description || "").match(/subject to (\d+) total/i));
  const combinedMaximum = Number(combinedMatches[0]?.[1]);
  const batchMaximum = batchRequest?.properties?.messages?.maxItems;
  const sendEmailText = readText(
    fullPath(skillsRoot, "skills/sendmux-send-email/SKILL.md"),
  );

  if (
    !isPositiveInteger(ccMaximum) ||
    ccMaximum !== bccMaximum ||
    !isPositiveInteger(combinedMaximum) ||
    combinedMatches.some((match) => Number(match?.[1]) !== combinedMaximum) ||
    !isPositiveInteger(batchMaximum) ||
    !sendEmailText.includes(
      `max ${ccMaximum} each and subject to ${combinedMaximum} total`,
    ) ||
    !sendEmailText.includes(`up to ${batchMaximum} independently confirmed messages`)
  ) {
    fail("Sending recipient bounds guidance drift");
  }
}

function findOpenApiOperation(spec, operationId) {
  for (const pathItem of Object.values(spec?.paths || {})) {
    for (const operation of Object.values(pathItem || {})) {
      if (operation?.operationId === operationId) return operation;
    }
  }
  return null;
}

function resolveLocalSchema(spec, schema) {
  const reference = schema?.$ref;
  if (!reference?.startsWith("#/components/schemas/")) return schema;
  return spec?.components?.schemas?.[reference.split("/").at(-1)];
}

function assertManagementCreateMailboxKeyBody() {
  const appSpec = readJson(appOpenApi);
  const operation = findOpenApiOperation(appSpec, "managementCreateMailboxKey");
  const schema = operation?.requestBody?.content?.["application/json"]?.schema;
  if (!isObject(schema?.properties) || !Array.isArray(schema.required)) {
    fail("managementCreateMailboxKey OpenAPI request body is missing or unusable");
    return;
  }

  const managementText = readText(
    fullPath(skillsRoot, "skills/sendmux-management/SKILL.md"),
  );
  const bodyText = managementText.match(
    /sendmux management:create-mailbox-key[\s\S]{0,500}?--body\s+'([^']+)'/,
  )?.[1];
  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
    fail("management:create-mailbox-key example has missing or invalid JSON body");
    return;
  }
  if (!isObject(body)) {
    fail("management:create-mailbox-key example has missing or invalid JSON body");
    return;
  }

  for (const requiredField of schema.required) {
    if (!Object.hasOwn(body, requiredField)) {
      fail(
        `management:create-mailbox-key request body missing required field ${requiredField}`,
      );
    }
  }
  if (schema.additionalProperties === false) {
    for (const field of Object.keys(body)) {
      if (!Object.hasOwn(schema.properties, field)) {
        fail(
          `management:create-mailbox-key request body uses unsupported field ${field}`,
        );
      }
    }
  }
}

function assertAdjacentSdkExamples() {
  const tokenEfficientText = readText(
    fullPath(skillsRoot, "skills/sendmux-token-efficient-usage/SKILL.md"),
  );
  const conditionalRead = textBetween(
    tokenEfficientText,
    "For the first metadata-bearing read",
    "The terminal delivery statuses",
  );
  const conditionalCall = textBetween(
    conditionalRead,
    "managementGetEmailLog({",
    "if (result.response",
  );
  if (
    !conditionalRead.includes("createManagementClient") ||
    !conditionalRead.includes(
      "createManagementClient({ apiKey: process.env.SENDMUX_API_KEY! })",
    ) ||
    !conditionalCall.includes("client,")
  ) {
    fail("conditional Management SDK client guidance drift");
  }
  if (!conditionalCall.includes("throwOnError: false")) {
    fail("conditional Management SDK throwOnError guidance drift");
  }
  if (
    !conditionalCall.includes(
      'headers: priorEtag ? { "If-None-Match": priorEtag } : {},',
    )
  ) {
    fail("conditional Management SDK headers guidance drift");
  }

  const mailboxAgentText = readText(
    fullPath(skillsRoot, "skills/sendmux-mailbox-agent/SKILL.md"),
  );
  const mailboxSdk = textBetween(mailboxAgentText, "SDK:", "## Triage and mutation");
  const snippetsCall = textBetween(
    mailboxSdk,
    "mailboxSearchMessageSnippets({",
    "const ids",
  );
  if (!snippetsCall.includes("throwOnError: true")) {
    fail("Mailbox snippet throwOnError guidance drift");
  }
  if (!mailboxSdk.includes("snippets.data.data.snippets.map")) {
    fail("Mailbox snippet SDK response guidance drift");
  }

  const appSpec = readJson(appOpenApi);
  const batchGetOperation = findOpenApiOperation(
    appSpec,
    "mailboxBatchGetMessages",
  );
  const batchGetSchema = resolveLocalSchema(
    appSpec,
    batchGetOperation?.requestBody?.content?.["application/json"]?.schema,
  );
  const idsMinimum = batchGetSchema?.properties?.ids?.minItems;
  if (!isPositiveInteger(idsMinimum)) {
    fail("Mailbox batch-get ids minItems is missing or unusable");
    return;
  }
  const expectedGuard =
    idsMinimum === 1
      ? "if (ids.length > 0) {"
      : `if (ids.length >= ${idsMinimum}) {`;
  if (
    !mailboxSdk.includes(
      "const ids = snippets.data.data.snippets.map((item) => item.message_id);",
    ) ||
    !mailboxSdk.includes(expectedGuard) ||
    !/if \(ids\.length[^\n]*\) \{[\s\S]*?mailboxBatchGetMessages\(\{[\s\S]*?body: \{\s*ids,/m.test(
      mailboxSdk,
    )
  ) {
    fail("Mailbox snippet empty-result guard guidance drift");
  }
}

function assertOpenApiPaths(label, specPath, requiredPaths) {
  const spec = readJson(specPath);
  if (!spec?.paths) return;

  for (const [method, route] of requiredPaths) {
    if (!spec.paths[route]?.[method]) {
      fail(`${label} missing ${method.toUpperCase()} ${route} in ${specPath}`);
    }
  }
}

function assertPackageNames(root, packages, readName) {
  for (const [relativePath, expectedName] of Object.entries(packages)) {
    const filePath = fullPath(root, relativePath);
    const actualName = readName(filePath);
    if (!actualName) continue;
    if (actualName !== expectedName) {
      fail(`${relativePath} expected name ${expectedName}, found ${actualName}`);
    }
  }
}

function jsonPackageName(filePath) {
  return readJson(filePath)?.name;
}

function tomlProjectName(filePath) {
  const match = readText(filePath).match(/^name\s*=\s*["']([^"']+)["']/m);
  if (!match) {
    fail(`Missing project name in ${filePath}`);
    return null;
  }
  return match[1];
}

function rubyGemspecName(filePath) {
  const match = readText(filePath).match(/spec\.name\s*=\s*["']([^"']+)["']/);
  if (!match) {
    fail(`Missing gemspec name in ${filePath}`);
    return null;
  }
  return match[1];
}

function walkCorpusFiles(dir) {
  if (!existsSync(dir)) return [];

  const files = [];
  for (const entry of readdirSync(dir)) {
    const entryPath = path.join(dir, entry);
    const stat = statSync(entryPath);
    if (stat.isDirectory()) {
      files.push(...walkCorpusFiles(entryPath));
    } else if (/\.(md|yaml|json)$/.test(entryPath)) {
      files.push(entryPath);
    }
  }
  return files;
}

function publicSkillCorpusFiles() {
  const files = [
    fullPath(skillsRoot, "README.md"),
    fullPath(skillsRoot, "skills.sh.json"),
  ];

  for (const skillName of expectedSkills) {
    const skillRoot = fullPath(skillsRoot, `skills/${skillName}`);
    files.push(path.join(skillRoot, "SKILL.md"));
    for (const publicDirectory of ["references", "scripts", "assets"]) {
      files.push(...walkCorpusFiles(path.join(skillRoot, publicDirectory)));
    }
  }

  return files;
}

function assertSkillsCatalogue() {
  const skillsDir = fullPath(skillsRoot, "skills");
  if (!existsSync(skillsDir)) {
    fail(`Missing skills directory: ${skillsDir}`);
    return;
  }

  const actualSkills = readdirSync(skillsDir)
    .filter((entry) => statSync(path.join(skillsDir, entry)).isDirectory())
    .sort();
  compareSets("Skill directories", actualSkills, expectedSkills);

  const readmeText = readText(fullPath(skillsRoot, "README.md"));
  const skillsJsonText = readText(fullPath(skillsRoot, "skills.sh.json"));

  for (const skillName of expectedSkills) {
    if (!readmeText.includes(skillName)) {
      fail(`README.md missing skill ${skillName}`);
    }
    if (!skillsJsonText.includes(skillName)) {
      fail(`skills.sh.json missing skill ${skillName}`);
    }

    const skillText = readText(path.join(skillsDir, skillName, "SKILL.md"));
    if (!/^metadata:\n\s+author:\s*sendmux\n\s+version:\s*["']1\.0["']/m.test(skillText)) {
      fail(`${skillName} missing metadata.author sendmux and metadata.version "1.0"`);
    }
  }
}

function assertSkillCorpusTokens() {
  const corpusFiles = publicSkillCorpusFiles();
  const corpusText = corpusFiles.map((filePath) => readText(filePath)).join("\n");

  for (const [label, pattern] of requiredCorpusTokens) {
    if (!pattern.test(corpusText)) {
      fail(`Skill corpus missing ${label} (${pattern})`);
    }
  }

  for (const [label, pattern, allowedNegativePattern] of forbiddenAgentOnboardingPatterns) {
    const textToCheck = allowedNegativePattern
      ? corpusText.replace(allowedNegativePattern, "")
      : corpusText;
    if (pattern.test(textToCheck)) {
      fail(`Skill corpus still contains obsolete ${label} guidance (${pattern})`);
    }
  }
}

function assertUntrustedInboundContentBoundaries() {
  const targetedSkills = [
    "sendmux-attachments",
    "sendmux-email-for-agents",
    "sendmux-mailbox-agent",
  ];

  for (const skillName of targetedSkills) {
    const skillText = readText(fullPath(skillsRoot, `skills/${skillName}/SKILL.md`));
    if (!/untrusted/i.test(skillText) || !/instruction/i.test(skillText)) {
      fail(`${skillName} must treat inbound email and attachment content as untrusted data, not instructions`);
    }
  }
}

function assertAgentStorageTransitions() {
  const targetedSkills = [
    "sendmux-cli",
    "sendmux-email-for-agents",
    "sendmux-getting-started",
    "sendmux-mailbox-agent",
    "sendmux-send-email",
    "sendmux-token-efficient-usage",
  ];

  for (const skillName of targetedSkills) {
    const skillText = readText(fullPath(skillsRoot, `skills/${skillName}/SKILL.md`));
    if (!/500 MiB/.test(skillText)) {
      fail(`${skillName} must state the pre-owner 500 MiB inbox storage cap`);
    }
    if (!/5 GiB/.test(skillText)) {
      fail(`${skillName} must state the owner-approved 5 GiB inbox storage allocation`);
    }
  }
}

function directUploadCurlEvidence(command, curlConfig) {
  const hasBinaryBody =
    /(?:^|\n)\s*--data-binary(?:=|\s+)@[^\s\\]+(?=\s|\\|$)/.test(
      command,
    );
  const argvHasPostAndEndpoint =
    /(?:^|\s)(?:-X|--request)(?:=|\s+)["']?POST["']?\s+["']?https:\/\/smtp\.sendmux\.ai\/api\/v1\/emails\/attachments(?:\?[^"'\s\\]*)?["']?(?=\s|\\|$)/.test(
      command,
    );
  const argvHasContentLength =
    /(?:^|\s)(?:-H|--header)(?:=|\s+)["']Content-Length\s*:[^"']*["']/i.test(
      command,
    );
  const configHasPostAndEndpoint =
    /^\s*request\s*=\s*["']POST["']\s*$/m.test(curlConfig) &&
    /^\s*url\s*=\s*["']https:\/\/smtp\.sendmux\.ai\/api\/v1\/emails\/attachments(?:\?[^"']*)?["']\s*$/m.test(
      curlConfig,
    );
  const configHasContentLength =
    /^\s*header\s*=\s*["']Content-Length\s*:[^"']*["']\s*$/im.test(
      curlConfig,
    );

  const argvIsComplete =
    hasBinaryBody && argvHasPostAndEndpoint && argvHasContentLength;
  const configIsComplete =
    hasBinaryBody && configHasPostAndEndpoint && configHasContentLength;
  return {
    complete: argvIsComplete || configIsComplete,
    missingOnlyContentLength:
      hasBinaryBody &&
      ((argvHasPostAndEndpoint && !argvHasContentLength) ||
        (configHasPostAndEndpoint && !configHasContentLength)),
  };
}

function curlExamplesFromFencedShellBlocks(skillText) {
  const examples = [];
  const shellBlocks = skillText.matchAll(
    /^```(?:bash|sh)\s*\n([\s\S]*?)^```/gm,
  );

  for (const blockMatch of shellBlocks) {
    const lines = blockMatch[1].split("\n");
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      if (!/^\s*curl(?:\s|$)/.test(lines[lineIndex])) continue;

      const commandLines = [lines[lineIndex]];
      while (/\\\s*$/.test(commandLines.at(-1)) && lineIndex + 1 < lines.length) {
        lineIndex += 1;
        commandLines.push(lines[lineIndex]);
      }

      const command = commandLines.join("\n");
      const heredocMarker = command.match(
        /<<-?\s*["']?([A-Za-z_][A-Za-z0-9_]*)["']?\s*$/,
      )?.[1];
      let curlConfig = "";
      if (
        heredocMarker &&
        /--config(?:=|\s+)-(?=\s|\\|$)/.test(command)
      ) {
        const markerIndex = lines.findIndex(
          (line, index) =>
            index > lineIndex && line.trim() === heredocMarker,
        );
        if (markerIndex !== -1) {
          curlConfig = lines.slice(lineIndex + 1, markerIndex).join("\n");
        }
      }

      examples.push(directUploadCurlEvidence(command, curlConfig));
    }
  }

  return examples;
}

function assertAttachmentSkillContentLengthGuidance() {
  const skillPath = fullPath(
    skillsRoot,
    "skills/sendmux-attachments/SKILL.md",
  );
  const skillText = readText(skillPath);
  const directUploadExamples = curlExamplesFromFencedShellBlocks(skillText);
  const completeExample = directUploadExamples.some(
    (example) => example.complete,
  );
  const missingOnlyContentLength = directUploadExamples.some(
    (example) => example.missingOnlyContentLength,
  );

  if (missingOnlyContentLength && !completeExample) {
    fail(
      "sendmux-attachments Direct HTTP Sending upload example must include Content-Length",
    );
  } else if (!completeExample) {
    fail("sendmux-attachments missing Direct HTTP Sending direct upload curl example");
  }

  if (
    !/direct Sending API binary uploads require exact `Content-Length`/i.test(
      skillText,
    )
  ) {
    fail("sendmux-attachments missing direct Sending Content-Length guidance");
  }
}

function assertCliPackage() {
  const cliPackagePath = fullPath(sdkRoot, "packages/ts/cli/package.json");
  const cliPackage = readJson(cliPackagePath);
  if (!cliPackage) return;

  if (cliPackage.name !== "@sendmux/cli") {
    fail(`CLI package expected @sendmux/cli, found ${cliPackage.name}`);
  }
  if (!cliPackage.bin?.sendmux) {
    fail(`CLI package missing bin.sendmux in ${cliPackagePath}`);
  }

  const topics = Object.keys(cliPackage.oclif?.topics || {}).sort();
  compareSets("CLI topics", topics, [
    "agent",
    "mailbox",
    "management",
    "profiles",
    "sending",
  ]);

  const commandContracts = [
    {
      path: "packages/ts/cli/src/commands/agent/register.ts",
      args: ["profile"],
      flags: ["base-url", "client-name", "default", "mailbox-local-part", "owner-email"],
    },
    {
      path: "packages/ts/cli/src/commands/agent/invite-owner.ts",
      args: ["email"],
      flags: ["profile"],
    },
  ];

  for (const contract of commandContracts) {
    const source = readText(fullPath(sdkRoot, contract.path));
    for (const arg of contract.args) {
      const pattern = new RegExp(`(?:^|\\n)\\s*${escapeRegExp(arg)}\\s*:\\s*Args\\.string\\(`);
      if (!pattern.test(source)) {
        fail(`${contract.path} missing required argument ${arg}`);
      }
    }
    for (const flag of contract.flags) {
      const pattern = new RegExp(
        `(?:^|\\n)\\s*(?:["']${escapeRegExp(flag)}["']|${escapeRegExp(flag)})\\s*:\\s*Flags\\.(?:string|boolean)\\(`,
      );
      if (!pattern.test(source)) {
        fail(`${contract.path} missing required flag ${flag}`);
      }
    }
  }
}

function readCliOperationCounts() {
  const operationsPath = fullPath(
    sdkRoot,
    "packages/ts/cli/src/generated/operations.ts",
  );
  const source = readText(operationsPath);
  const match = source.match(
    /export const operations = ([\s\S]*?) as const satisfies/,
  );
  if (!match) {
    fail(`CLI generated operations manifest is missing or unusable in ${operationsPath}`);
    return null;
  }

  // The manifest comes from a separately checked-out repository, so count the
  // JSON-encoded "surface" property of each generated operation as text and
  // never execute it.
  const counts = { mailbox: 0, management: 0, sending: 0 };
  const surfacePattern =
    /(?<!\\)"surface"\s*:\s*"(mailbox|management|sending)"(?=\s*[,}])/g;
  for (const [, surface] of match[1].matchAll(surfacePattern)) {
    counts[surface] += 1;
  }
  if (Object.values(counts).every((count) => count === 0)) {
    fail(`CLI generated operations manifest is missing or unusable in ${operationsPath}`);
    return null;
  }
  return counts;
}

function assertCliCommandCounts() {
  const counts = readCliOperationCounts();
  if (!counts) return;
  const cliSkillText = readText(
    fullPath(skillsRoot, "skills/sendmux-cli/SKILL.md"),
  );
  for (const [surface, count] of Object.entries(counts)) {
    const label = `${surface[0].toUpperCase()}${surface.slice(1)}`;
    if (
      !new RegExp(`^\\|\\s*${label}\\s*\\|\\s*${count}\\s*\\|`, "m").test(
        cliSkillText,
      )
    ) {
      fail(`CLI ${label} command count guidance drift`);
    }
  }
}

function assertMcpSources() {
  const curationPath = fullPath(
    sdkRoot,
    "packages/python/mcp/sendmux_mcp/curation.py",
  );
  const configPath = fullPath(
    sdkRoot,
    "packages/python/mcp/sendmux_mcp/config.py",
  );
  const curation = readText(curationPath);
  const config = readText(configPath);

  for (const toolName of requiredMcpTools) {
    const pattern = new RegExp(`name\\s*=\\s*["']${escapeRegExp(toolName)}["']`);
    if (!pattern.test(curation)) {
      fail(`MCP curation missing tool ${toolName} in ${curationPath}`);
    }
  }

  for (const envName of requiredMcpEnv) {
    if (!config.includes(envName)) {
      fail(`MCP config missing env ${envName} in ${configPath}`);
    }
  }
}

function allMcpToolNames() {
  const curationPath = fullPath(
    sdkRoot,
    "packages/python/mcp/sendmux_mcp/curation.py",
  );
  const curation = readText(curationPath);
  return new Set(
    [...curation.matchAll(/name\s*=\s*["']([a-z]+_[a-z_]+)["']/g)].map(
      (match) => match[1],
    ),
  );
}

function assertClaimedMcpToolsExist() {
  const toolNames = allMcpToolNames();
  const corpusFiles = walkCorpusFiles(fullPath(skillsRoot, "skills"));

  for (const filePath of corpusFiles) {
    const text = readText(filePath);
    for (const match of text.matchAll(/`((?:mailbox|management|sending)_[a-z_]+)`/g)) {
      const name = match[1];
      if (allowedUnderscoreIdentifiers.has(name)) continue;
      if (!toolNames.has(name)) {
        fail(`${path.relative(skillsRoot, filePath)} claims missing MCP tool ${name}`);
      }
    }
  }
}

function assertOfficialSendmuxEnvOnly() {
  const sourceText = [
    readText(fullPath(sdkRoot, "packages/python/mcp/sendmux_mcp/config.py")),
    readText(fullPath(sdkRoot, "packages/python/mcp/sendmux_mcp/hosted.py")),
    readText(fullPath(sdkRoot, "packages/python/mcp/README.md")),
    readText(fullPath(sdkRoot, "packages/ts/cli/src/base-command.ts")),
    readText(fullPath(sdkRoot, "packages/ts/cli/src/profiles.ts")),
    readText(fullPath(sdkRoot, "packages/ts/cli/README.md")),
  ].join("\n");
  const corpusFiles = walkCorpusFiles(fullPath(skillsRoot, "skills"));

  for (const filePath of corpusFiles) {
    const text = readText(filePath);
    for (const match of text.matchAll(/\bSENDMUX_[A-Z0-9_]+\b/g)) {
      const envName = match[0];
      if (allowedSkillOnlyEnv.has(envName)) continue;
      if (!sourceText.includes(envName)) {
        fail(`${path.relative(skillsRoot, filePath)} uses undocumented env var ${envName}`);
      }
    }
  }
}

function assertSdkPackages() {
  assertPackageNames(sdkRoot, tsPackages, jsonPackageName);
  assertPackageNames(sdkRoot, phpPackages, jsonPackageName);
  assertPackageNames(sdkRoot, pythonPackages, tomlProjectName);
  assertPackageNames(sdkRoot, rubyPackages, rubyGemspecName);

  const goModPath = fullPath(sdkRoot, "go/go.mod");
  const goModule = readText(goModPath).match(/^module\s+(\S+)/m)?.[1];
  if (!goModule) {
    fail(`Missing Go module declaration in ${goModPath}`);
  } else if (goModule !== "sendmux.ai/go/v3") {
    fail(`Go module expected sendmux.ai/go/v3, found ${goModule}`);
  }
}

const mcpContractFacts = readMcpContractFacts();

assertOpenApiPaths("Sending OpenAPI", sendingOpenApi, requiredSendingPaths);
assertOpenApiPaths("App OpenAPI mailbox surface", appOpenApi, requiredMailboxPaths);
assertCliPackage();
assertCliCommandCounts();
assertMcpSources();
assertClaimedMcpToolsExist();
assertOfficialSendmuxEnvOnly();
assertSdkPackages();
assertSkillsCatalogue();
assertSkillCorpusTokens();
assertUntrustedInboundContentBoundaries();
assertAgentStorageTransitions();
assertAttachmentSkillContentLengthGuidance();
assertMcpContractPublishing(mcpContractFacts);
assertMcpFilePathGuidance(mcpContractFacts);
assertSyncGuidance();
assertSdkExampleGuidance();
assertRecipientBounds();
assertManagementCreateMailboxKeyBody();
assertAdjacentSdkExamples();

if (failures.length > 0) {
  console.error("Sendmux skill drift check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Sendmux skill drift check passed.");
console.log(`Skills root: ${skillsRoot}`);
console.log(`Docs root: ${docsRoot}`);
console.log(`SDK root: ${sdkRoot}`);
