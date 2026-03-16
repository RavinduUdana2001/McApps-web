export function formatAlertDate(timestamp: number) {
  if (!timestamp) return "";

  const ms = timestamp < 1000000000000 ? timestamp * 1000 : timestamp;
  const date = new Date(ms);

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCommentDate(timestamp: number) {
  if (!timestamp) return "";

  const ms = timestamp < 1000000000000 ? timestamp * 1000 : timestamp;
  const date = new Date(ms);

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}