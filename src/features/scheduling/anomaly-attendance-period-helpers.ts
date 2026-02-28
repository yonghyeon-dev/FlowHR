export function buildAnomalyAttendancePeriodWindow(input: {
  periodStart: Date;
  periodEnd: Date;
}) {
  const oneDayMs = 24 * 60 * 60 * 1000;
  return {
    periodStart: new Date(input.periodStart.getTime() - oneDayMs),
    periodEnd: new Date(input.periodEnd.getTime() + oneDayMs)
  };
}
