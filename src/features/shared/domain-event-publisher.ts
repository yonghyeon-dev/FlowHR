export const domainEventNames = [
  "organization.created.v1",
  "department.created.v1",
  "department.updated.v1",
  "position.created.v1",
  "position.updated.v1",
  "employee.created.v1",
  "employee.profile.updated.v1",
  "approval.policy.updated.v1",
  "approval.delegation.created.v1",
  "approval.delegation.updated.v1",
  "approval.template.created.v1",
  "approval.template.updated.v1",
  "approval.execution.escalation.requested.v1",
  "attendance.recorded.v1",
  "attendance.corrected.v1",
  "attendance.approved.v1",
  "attendance.rejected.v1",
  "scheduling.schedule.assigned.v1",
  "scheduling.schedule.updated.v1",
  "scheduling.schedule.deleted.v1",
  "scheduling.template.created.v1",
  "scheduling.template.assigned.v1",
  "scheduling.template.range_assigned.v1",
  "scheduling.rotation.assigned.v1",
  "scheduling.anomaly.detected.v1",
  "scheduling.anomaly.escalated.v1",
  "scheduling.anomaly.ticket.requested.v1",
  "scheduling.anomaly.incident.updated.v1",
  "scheduling.anomaly.incident.escalation.requested.v1",
  "scheduling.anomaly.incident.auto_action.executed.v1",
  "payroll.calculated.v1",
  "payroll.deductions.calculated.v1",
  "payroll.deduction_profile.updated.v1",
  "payroll.insurance_settlement.previewed.v1",
  "payroll.period.close_previewed.v1",
  "payroll.period.closed.v1",
  "payroll.payslip.distribution_previewed.v1",
  "payroll.payslip.distributed.v1",
  "payroll.payslip.receipt_confirmed.v1",
  "payroll.year_end.settlement.previewed.v1",
  "payroll.year_end.settlement.recalculated.v1",
  "payroll.year_end.settlement.finalize_previewed.v1",
  "payroll.year_end.settlement.finalized.v1",
  "payroll.year_end.filing_data.exported.v1",
  "payroll.year_end.filing_package.submitted.v1",
  "payroll.year_end.filing_package.acknowledged.v1",
  "payroll.year_end.withholding_receipt.previewed.v1",
  "payroll.year_end.withholding_receipt.issued.v1",
  "payroll.confirmed.v1",
  "leave.requested.v1",
  "leave.approved.v1",
  "leave.rejected.v1",
  "leave.canceled.v1",
  "leave.accrual.settled.v1",
  "leave.policy.updated.v1",
  "leave.promotion.notice.dispatched.v1"
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
