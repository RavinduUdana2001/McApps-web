export function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}