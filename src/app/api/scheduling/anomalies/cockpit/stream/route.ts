import { listScheduleAnomalyCockpitStreamQuerySchema } from "@/features/scheduling/schemas";
import { listScheduleAttendanceAnomalyCockpit } from "@/features/scheduling/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail } from "@/lib/http";

const DEFAULT_STREAM_INTERVAL_SECONDS = 5;
const DEFAULT_STREAM_SAMPLE_COUNT = 3;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatSseEvent(event: string, payload: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const normalizeOffset = (value: string | null) => (value ? value.replace(/ /g, "+") : value);

  const parsed = listScheduleAnomalyCockpitStreamQuerySchema.safeParse({
    from: normalizeOffset(url.searchParams.get("from")),
    to: normalizeOffset(url.searchParams.get("to")),
    lateThresholdMinutes: url.searchParams.get("lateThresholdMinutes") ?? undefined,
    topN: url.searchParams.get("topN") ?? undefined,
    intervalSeconds: url.searchParams.get("intervalSeconds") ?? undefined,
    sampleCount: url.searchParams.get("sampleCount") ?? undefined
  });

  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  const actor = await readActor(request);
  const dataAccess = getRuntimeDataAccess();
  const periodStart = new Date(parsed.data.from);
  const periodEnd = new Date(parsed.data.to);
  const lateThresholdMinutes = parsed.data.lateThresholdMinutes;
  const topN = parsed.data.topN;
  const intervalSeconds = parsed.data.intervalSeconds ?? DEFAULT_STREAM_INTERVAL_SECONDS;
  const sampleCount = parsed.data.sampleCount ?? DEFAULT_STREAM_SAMPLE_COUNT;

  try {
    const firstReport = await listScheduleAttendanceAnomalyCockpit(
      {
        actor,
        dataAccess
      },
      {
        periodStart,
        periodEnd,
        lateThresholdMinutes,
        topN,
        suppressAutomation: true
      }
    );

    await dataAccess.audit.append({
      action: "scheduling.anomaly.cockpit.stream.opened",
      entityType: "WorkSchedule",
      organizationId: actor?.organizationId ?? null,
      actorRole: actor?.role ?? "unknown",
      actorId: actor?.id,
      payload: {
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        lateThresholdMinutes: lateThresholdMinutes ?? null,
        topN: topN ?? null,
        intervalSeconds,
        sampleCount
      }
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(
          encoder.encode(formatSseEvent("cockpit-snapshot", { sequence: 1, sampleCount, report: firstReport }))
        );

        for (let sequence = 2; sequence <= sampleCount; sequence += 1) {
          if (intervalSeconds > 0) {
            await delay(intervalSeconds * 1000);
          }

          try {
            const report = await listScheduleAttendanceAnomalyCockpit(
              {
                actor,
                dataAccess
              },
              {
                periodStart,
                periodEnd,
                lateThresholdMinutes,
                topN,
                suppressAutomation: true
              }
            );
            controller.enqueue(encoder.encode(formatSseEvent("cockpit-snapshot", { sequence, sampleCount, report })));
          } catch (error) {
            if (isServiceError(error)) {
              controller.enqueue(
                encoder.encode(
                  formatSseEvent("stream-error", {
                    sequence,
                    status: error.status,
                    message: error.message,
                    details: error.details
                  })
                )
              );
              controller.close();
              return;
            }
            controller.error(error);
            return;
          }
        }

        controller.enqueue(
          encoder.encode(
            formatSseEvent("stream-end", {
              sampleCount,
              intervalSeconds
            })
          )
        );
        controller.close();
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive"
      }
    });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
