export function formatNumber(value?: number | null) {
  return Number(value || 0).toLocaleString("en-US");
}

export function titleCase(value?: string | null) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function displayName(first?: string, last?: string, fallback = "Contact") {
  const name = `${first || ""} ${last || ""}`.trim();
  return name || fallback;
}

export function parseRecipientText(value: string) {
  const emails = value
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(emails));
}
