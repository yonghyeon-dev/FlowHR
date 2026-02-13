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

export function calculateGrossPay(
  minutes: PayableMinutes,
  hourlyRateKrw: number,
  multipliers: Multipliers = defaultMultipliers
) {
  const regular = (minutes.regular / 60) * hourlyRateKrw * multipliers.regular;
  const overtime = (minutes.overtime / 60) * hourlyRateKrw * multipliers.overtime;
  const night = (minutes.night / 60) * hourlyRateKrw * multipliers.night;
  const holiday = (minutes.holiday / 60) * hourlyRateKrw * multipliers.holiday;
  return Math.round(regular + overtime + night + holiday);
}
