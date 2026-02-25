export type BenefitCatalogStatus = "ACTIVE" | "INACTIVE";
export type BenefitRequestStatus = "SUBMITTED" | "APPROVED" | "REJECTED";

export type BenefitCatalogItem = {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  annualLimitKrw: number;
  status: BenefitCatalogStatus;
  createdAt: string;
  updatedAt: string;
};

export type BenefitRequestItem = {
  id: string;
  organizationId: string;
  benefitId: string;
  employeeId: string;
  amountKrw: number;
  reason: string;
  status: BenefitRequestStatus;
  requestedAt: string;
  reviewedAt: string | null;
  reviewedByActorId: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
};
