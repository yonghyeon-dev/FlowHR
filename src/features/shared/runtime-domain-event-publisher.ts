import {
  createMemoryDomainEventPublisher,
  noOpDomainEventPublisher,
  type DomainEventPublisher
} from "@/features/shared/domain-event-publisher";

const memoryDomainEventPublisher = createMemoryDomainEventPublisher();

export function getRuntimeDomainEventPublisher(): DomainEventPublisher {
  const mode = process.env.FLOWHR_EVENT_PUBLISHER?.toLowerCase();
  if (mode === "memory") {
    return memoryDomainEventPublisher;
  }
  return noOpDomainEventPublisher;
}

export function resetRuntimeMemoryDomainEvents() {
  memoryDomainEventPublisher.reset();
}

export function getRuntimeMemoryDomainEvents() {
  return memoryDomainEventPublisher.list();
}
