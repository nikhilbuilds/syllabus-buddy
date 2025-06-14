export const repairBrokenJson = (content: string): string => {
  let repaired = content.trim();

  // 1. Remove code block markers
  if (repaired.startsWith("```json")) {
    repaired = repaired.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (repaired.startsWith("```")) {
    repaired = repaired.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  // 2. Smart quotes → normal
  repaired = repaired.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  // 3. Remove all control characters
  repaired = repaired.replace(/[\u0000-\u001F]+/g, " ");

  // 4. Fix trailing commas
  repaired = repaired.replace(/,\s*([}\]])/g, "$1");

  // 5. Quote unquoted keys
  repaired = repaired.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

  // 6. Escape all backslashes (for LaTeX)
  repaired = repaired.replace(/\\/g, "\\\\");

  // 7. Escape lone } inside explanation strings
  repaired = repaired.replace(
    /("explanation"\s*:\s*")([^"]*?)(})(")/g,
    (_match, start, middle, _brace, end) => {
      const fixed = middle.replace(/}/g, "\\}");
      return `${start}${fixed}${end}`;
    }
  );

  // 8. Truncate to last valid bracket
  const lastClose = Math.max(
    repaired.lastIndexOf("}"),
    repaired.lastIndexOf("]")
  );
  if (lastClose !== -1) {
    repaired = repaired.slice(0, lastClose + 1);
  }

  return repaired;
};
