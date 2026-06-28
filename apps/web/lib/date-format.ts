const utcDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
});

export function formatUtcDateTime(value: string | null | undefined, fallback = 'No date') {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return utcDateTimeFormatter.format(date);
}
