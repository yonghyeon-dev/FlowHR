import type { WorkScheduleEntity } from "@/features/shared/data-access";

type OverlapComparableSchedule = Pick<WorkScheduleEntity, "id" | "startAt" | "endAt">;

export function listStrictScheduleOverlaps(input: {
  schedules: OverlapComparableSchedule[];
  startAt: Date;
  endAt: Date;
  excludeScheduleId?: string;
}) {
  return input.schedules.filter(
    (schedule) =>
      schedule.id !== input.excludeScheduleId &&
      schedule.startAt < input.endAt &&
      schedule.endAt > input.startAt
  );
}
