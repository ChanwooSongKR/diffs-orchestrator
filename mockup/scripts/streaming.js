function unescapeJsonString(value) {
  try {
    return JSON.parse(`"${value}"`);
  } catch {
    return value.replaceAll('\\"', '"').replaceAll("\\n", "\n");
  }
}

function dedupePreserveOrder(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const normalized = String(item ?? "").trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

function collectStringLeaves(value, bucket) {
  if (typeof value === "string") {
    bucket.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStringLeaves(item, bucket));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectStringLeaves(item, bucket));
  }
}

function tryParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function extractQuotedValues(raw) {
  const withoutKeys = raw.replace(/"(?:\\.|[^"\\])*"\s*:/g, "");
  const matches = [...withoutKeys.matchAll(/"((?:\\.|[^"\\])*)"/g)];
  return matches.map((match) => unescapeJsonString(match[1]));
}

function cleanupFallback(raw) {
  return raw
    .replace(/"(?:\\.|[^"\\])*"\s*:/g, "")
    .replace(/[{}\[\],]/g, " ")
    .replace(/\\n/g, "\n")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function formatStreamTextForDisplay(raw) {
  const input = String(raw ?? "");
  if (!input.trim()) return "";

  const parsed = tryParseJson(input);
  if (parsed !== null) {
    const leaves = [];
    collectStringLeaves(parsed, leaves);
    return dedupePreserveOrder(leaves).join("\n");
  }

  const extracted = dedupePreserveOrder(extractQuotedValues(input));
  if (extracted.length) {
    return extracted.join("\n");
  }

  return cleanupFallback(input);
}
