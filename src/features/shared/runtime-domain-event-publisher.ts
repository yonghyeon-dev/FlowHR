import {
  createMemoryDomainEventPublisher,
  noOpDomainEventPublisher,
  type DomainEventPublisher
} from "@/features/shared/domain-event-publisher";
import { createHttpDomainEventPublisher } from "@/features/shared/http-domain-event-publisher";

const memoryDomainEventPublisher = createMemoryDomainEventPublisher();
let httpDomainEventPublisher: DomainEventPublisher | null = null;
let httpDomainEventPublisherKey: string | null = null;
let warnedMissingHttpEndpoint = false;

function parseNumber(input: string | undefined, fallback: number) {
  if (!input) {
    return fallback;
  }
  const value = Number(input);
  if (!Number.isFinite(value) || value < 0) {
    return fallback;
  }
  return Math.floor(value);
}

function parseBoolean(input: string | undefined, fallback: boolean) {
  if (!input) {
    return fallback;
  }
  const normalized = input.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") {
    return true;
  }
  if (normalized === "false" || normalized === "0" || normalized === "no") {
    return false;
  }
  return fallback;
}

function getHttpDomainEventPublisher(): DomainEventPublisher {
  const endpointUrl = process.env.FLOWHR_EVENT_HTTP_URL?.trim();
  if (!endpointUrl) {
    if (!warnedMissingHttpEndpoint) {
      console.warn(
        "FLOWHR_EVENT_PUBLISHER=http but FLOWHR_EVENT_HTTP_URL is missing. Falling back to noop publisher."
      );
      warnedMissingHttpEndpoint = true;
    }
    return noOpDomainEventPublisher;
  }

  const authToken = process.env.FLOWHR_EVENT_HTTP_TOKEN?.trim() || "";
  const timeoutMs = parseNumber(process.env.FLOWHR_EVENT_HTTP_TIMEOUT_MS, 3000);
  const retryCount = parseNumber(process.env.FLOWHR_EVENT_HTTP_RETRY_COUNT, 2);
  const failOpen = parseBoolean(process.env.FLOWHR_EVENT_HTTP_FAIL_OPEN, true);
  const key = [endpointUrl, authToken, String(timeoutMs), String(retryCount), String(failOpen)].join("|");

  if (!httpDomainEventPublisher || httpDomainEventPublisherKey !== key) {
    httpDomainEventPublisher = createHttpDomainEventPublisher({
      endpointUrl,
      authToken: authToken || undefined,
      timeoutMs,
      retryCount,
      failOpen
    });
    httpDomainEventPublisherKey = key;
  }

  return httpDomainEventPublisher;
}

export function getRuntimeDomainEventPublisher(): DomainEventPublisher {
  const mode = process.env.FLOWHR_EVENT_PUBLISHER?.toLowerCase();
  if (mode === "memory") {
    return memoryDomainEventPublisher;
  }
  if (mode === "http") {
    return getHttpDomainEventPublisher();
  }
  return noOpDomainEventPublisher;
}

export function resetRuntimeMemoryDomainEvents() {
  memoryDomainEventPublisher.reset();
  httpDomainEventPublisher = null;
  httpDomainEventPublisherKey = null;
  warnedMissingHttpEndpoint = false;
}

export function getRuntimeMemoryDomainEvents() {
  return memoryDomainEventPublisher.list();
}
