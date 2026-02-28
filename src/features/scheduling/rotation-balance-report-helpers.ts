import type { WorkScheduleEntity } from "@/features/shared/data-access";
import {
  deriveRotationBalanceGrade,
  plannedMinutesForSchedule
} from "@/features/scheduling/rotation-fairness-core-helpers";
import { weekdayFromKstDateTime } from "@/features/scheduling/template-date-helpers";

type RotationBalanceWeekdayBucket = {
  weekday: number;
  scheduleCount: number;
  plannedMinutes: number;
};

export function buildRotationBalanceSummary(input: { schedules: WorkScheduleEntity[] }) {
  const buckets = new Map<number, RotationBalanceWeekdayBucket>();
  for (let weekday = 1; weekday <= 7; weekday += 1) {
    buckets.set(weekday, {
      weekday,
      scheduleCount: 0,
      plannedMinutes: 0
    });
  }

  for (const schedule of input.schedules) {
    const weekday = weekdayFromKstDateTime(schedule.startAt);
    const bucket = buckets.get(weekday);
    if (!bucket) {
      continue;
    }
    bucket.scheduleCount += 1;
    bucket.plannedMinutes += plannedMinutesForSchedule(schedule);
  }

  const weekdays = Array.from(buckets.values()).sort((a, b) => a.weekday - b.weekday);
  const activeWeekdays = weekdays.filter((bucket) => bucket.scheduleCount > 0);
  const weekdayGap =
    activeWeekdays.length === 0
      ? 0
      : Math.max(...activeWeekdays.map((bucket) => bucket.scheduleCount)) -
        Math.min(...activeWeekdays.map((bucket) => bucket.scheduleCount));
  const plannedMinutesGap =
    activeWeekdays.length === 0
      ? 0
      : Math.max(...activeWeekdays.map((bucket) => bucket.plannedMinutes)) -
        Math.min(...activeWeekdays.map((bucket) => bucket.plannedMinutes));
  const grade = deriveRotationBalanceGrade(weekdayGap, plannedMinutesGap);

  const recommendations: string[] = [];
  if (input.schedules.length === 0) {
    recommendations.push("조회 범위에 회전 일정이 없습니다.");
  } else if (grade === "BALANCED") {
    recommendations.push("현재 범위에서 회전 부하가 균형적입니다.");
  } else {
    if (weekdayGap > 1) {
      recommendations.push("요일별 배치 편차가 큽니다. 회전 템플릿 순서를 조정하세요.");
    }
    if (plannedMinutesGap > 480) {
      recommendations.push("요일별 계획 근로시간 편차가 큽니다. 템플릿 근무시간 또는 휴게시간을 조정하세요.");
    }
    if (activeWeekdays.length < 3) {
      recommendations.push("활성 요일이 적어 편중 위험이 큽니다. 회전 적용 요일을 확장하세요.");
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("현재 회전 밸런스는 허용 범위입니다.");
  }

  return {
    weekdays,
    activeWeekdaysCount: activeWeekdays.length,
    weekdayGap,
    plannedMinutesGap,
    grade,
    recommendations
  };
}
