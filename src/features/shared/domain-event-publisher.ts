export const domainEventNames = [
  "attendance.recorded.v1",
  "attendance.corrected.v1",
  "attendance.approved.v1",
  "payroll.calculated.v1",
  "payroll.deductions.calculated.v1",
  "payroll.confirmed.v1",
  "leave.requested.v1",
  "leave.approved.v1",
  "leave.rejected.v1",
  "leave.canceled.v1",
  "leave.accrual.settled.v1"
] as const;

export type DomainEventName = (typeof domainEventNames)[number];

export type DomainEvent = {
  name: DomainEventName;
  occurredAt: string;
  entityType: string;
  entityId?: string;
  actorId?: string;
  actorRole?: string;
  payload?: Record<string, unknown>;
};

export interface DomainEventPublisher {
  publish(event: DomainEvent): Promise<void>;
}

class NoOpDomainEventPublisher implements DomainEventPublisher {
  async publish(_event: DomainEvent): Promise<void> {
    void _event;
    return;
  }
}

export const noOpDomainEventPublisher: DomainEventPublisher = new NoOpDomainEventPublisher();

export interface MemoryDomainEventPublisher extends DomainEventPublisher {
  list(): DomainEvent[];
  reset(): void;
}

class InMemoryDomainEventPublisher implements MemoryDomainEventPublisher {
  private readonly events: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    this.events.push({ ...event });
  }

  list(): DomainEvent[] {
    return this.events.map((event) => ({ ...event }));
  }

  reset(): void {
    this.events.length = 0;
  }
}

export function createMemoryDomainEventPublisher(): MemoryDomainEventPublisher {
  return new InMemoryDomainEventPublisher();
}
