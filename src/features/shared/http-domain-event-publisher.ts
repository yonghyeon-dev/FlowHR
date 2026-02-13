import type { DomainEvent, DomainEventPublisher } from "@/features/shared/domain-event-publisher";

export type HttpDomainEventPublisherOptions = {
  endpointUrl: string;
  authToken?: string;
  timeoutMs: number;
  retryCount: number;
  failOpen: boolean;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function postEvent(
  options: HttpDomainEventPublisherOptions,
  event: DomainEvent
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    return await fetch(options.endpointUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(options.authToken ? { authorization: `Bearer ${options.authToken}` } : {}),
        "x-flowhr-event-name": event.name
      },
      body: JSON.stringify({
        specVersion: "flowhr.domain-event.v1",
        event
      }),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

export class HttpDomainEventPublisher implements DomainEventPublisher {
  constructor(private readonly options: HttpDomainEventPublisherOptions) {}

  async publish(event: DomainEvent): Promise<void> {
    let lastError: unknown = null;
    for (let attempt = 0; attempt <= this.options.retryCount; attempt += 1) {
      try {
        const response = await postEvent(this.options, event);
        if (!response.ok) {
          throw new Error(
            `event transport responded with ${response.status} for ${event.name}`
          );
        }
        return;
      } catch (error) {
        lastError = error;
        const isLastAttempt = attempt === this.options.retryCount;
        if (isLastAttempt) {
          break;
        }
        await delay(100 * (attempt + 1));
      }
    }

    const message = [
      "external event transport failed",
      `name=${event.name}`,
      `entityType=${event.entityType}`,
      `entityId=${event.entityId ?? "-"}`,
      `retries=${this.options.retryCount}`,
      `reason=${lastError instanceof Error ? lastError.message : "unknown"}`
    ].join(" ");

    if (this.options.failOpen) {
      console.error(message);
      return;
    }

    throw new Error(message);
  }
}

export function createHttpDomainEventPublisher(
  options: HttpDomainEventPublisherOptions
): DomainEventPublisher {
  return new HttpDomainEventPublisher(options);
}
