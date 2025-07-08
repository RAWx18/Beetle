const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

export function FormattedDate({
  date,
  ...props
}: React.ComponentPropsWithoutRef<'time'> & { date: string | Date }) {
  if (!date) return null;
  let parsedDate = typeof date === 'string' ? new Date(date) : date;
  const isValidDate = parsedDate instanceof Date && !isNaN(parsedDate.getTime());

  if (!isValidDate) {
    // Render as plain text if not a valid date
    return <time {...props}>{String(date)}</time>;
  }

  return (
    <time dateTime={parsedDate.toISOString()} {...props}>
      {dateFormatter.format(parsedDate)}
    </time>
  );
}
