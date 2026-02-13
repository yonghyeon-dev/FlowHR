export type PayableMinutes = {
  regular: number;
  overtime: number;
  night: number;
  holiday: number;
};

export type Multipliers = {
  regular: number;
  overtime: number;
  night: number;
  holiday: number;
};

export const defaultMultipliers: Multipliers = {
  regular: 1.0,
  overtime: 1.5,
  night: 1.5,
  holiday: 1.5
};

export function workedMinutes(checkInAt: Date, checkOutAt: Date, breakMinutes: number) {
  const ms = checkOutAt.getTime() - checkInAt.getTime();
  if (ms <= 0) {
    return 0;
  }
  const total = Math.floor(ms / 60000) - Math.max(0, Math.floor(breakMinutes));
  return Math.max(0, total);
}

function overlapMinutesInWindow(
  checkInAt: Date,
  checkOutAt: Date,
  windowStartHour: number,
  windowEndHour: number
) {
  let cursor = new Date(checkInAt.getTime());
  let minutes = 0;

  while (cursor < checkOutAt) {
    const next = new Date(cursor.getTime() + 60000);
    if (next > checkOutAt) {
      break;
    }
    const hour = cursor.getHours();
    const inWindow = windowStartHour <= hour && hour < windowEndHour;
    if (inWindow) {
      minutes += 1;
    }
    cursor = next;
  }

  return minutes;
}

export function splitPayableMinutes(totalMinutes: number, isHoliday = false): PayableMinutes {
  if (totalMinutes <= 0) {
    return { regular: 0, overtime: 0, night: 0, holiday: 0 };
  }

  if (isHoliday) {
    const holiday = Math.min(totalMinutes, 480);
    const overtime = Math.max(0, totalMinutes - 480);
    return { regular: 0, overtime, night: 0, holiday };
  }

  const regular = Math.min(totalMinutes, 480);
  const overtime = Math.max(0, totalMinutes - 480);
  return { regular, overtime, night: 0, holiday: 0 };
}

export function derivePayableMinutes(
  checkInAt: Date,
  checkOutAt: Date,
  breakMinutes: number,
  isHoliday = false
) {
  const totalMinutes = workedMinutes(checkInAt, checkOutAt, breakMinutes);
  if (isHoliday) {
    return splitPayableMinutes(totalMinutes, true);
  }

  // WI-0001 rule: treat 00:00~04:00 as night category for payroll premium.
  const rawNight = overlapMinutesInWindow(checkInAt, checkOutAt, 0, 4);
  const baseRegular = Math.min(totalMinutes, 480);
  const night = Math.min(rawNight, baseRegular);
  const regular = Math.max(0, baseRegular - night);
  const overtime = Math.max(0, totalMinutes - 480);

  return {
    regular,
    overtime,
    night,
    holiday: 0
  };
}

export function calculateGrossPay(
  minutes: PayableMinutes,
  hourlyRateKrw: number,
  multipliers: Multipliers = defaultMultipliers
) {
  const isHolidayCase = minutes.holiday > 0;
  const nightBaseMinutes = Math.min(minutes.night, 180);
  const nightOvertimeMinutes = Math.max(0, minutes.night - 180);

  const holidayBaseMinutes = minutes.holiday;
  const holidayOvertimeMinutes = minutes.overtime;

  const regular = (minutes.regular / 60) * hourlyRateKrw * multipliers.regular;
  const overtime = isHolidayCase
    ? 0
    : (minutes.overtime / 60) * hourlyRateKrw * multipliers.overtime;

  const nightBase = (nightBaseMinutes / 60) * hourlyRateKrw * multipliers.night;
  // Night minutes above 3h are treated as night+overtime premium in WI-0001.
  const nightOvertime =
    (nightOvertimeMinutes / 60) *
    hourlyRateKrw *
    (multipliers.night + (multipliers.overtime - 1));

  const holidayBase = isHolidayCase
    ? (holidayBaseMinutes / 60) * hourlyRateKrw * multipliers.holiday
    : 0;
  // Holiday overtime uses combined premium.
  const holidayOvertime = isHolidayCase
    ? (holidayOvertimeMinutes / 60) *
      hourlyRateKrw *
      (multipliers.holiday * multipliers.overtime)
    : 0;

  const night = nightBase + nightOvertime;
  const holiday = holidayBase + holidayOvertime;

  return Math.round(regular + overtime + night + holiday);
}
