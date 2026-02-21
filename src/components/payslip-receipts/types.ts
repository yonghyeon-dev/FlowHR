export type PayrollRunReceiptDto = {
  id: string;
  employeeId: string | null;
  periodStart: string;
  periodEnd: string;
  state: "PREVIEWED" | "CONFIRMED";
  grossPayKrw: number;
  totalDeductionsKrw: number | null;
  netPayKrw: number | null;
  payslipDeliveryChannel: string | null;
  payslipDistributedAt: string | null;
  payslipDistributedBy: string | null;
  payslipReceiptConfirmedAt: string | null;
  payslipReceiptConfirmedBy: string | null;
};

export type PayrollRunsResponse = {
  runs: PayrollRunReceiptDto[];
};

export type ReceiptAcknowledgeResponse = {
  receipt: {
    runId: string;
    employeeId: string;
    deliveryChannel: string | null;
    distributedAt: string;
    receiptConfirmedAt: string;
    receiptConfirmedBy: string;
    alreadyConfirmed: boolean;
  };
};

export type ApiLog = {
  id: number;
  label: string;
  status: number;
  ok: boolean;
  at: string;
};

export function defaultMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
  return {
    periodStartDate: start.toISOString().slice(0, 10),
    periodEndDate: end.toISOString().slice(0, 10)
  };
}

export function toSeoulStartIso(dateValue: string) {
  return `${dateValue}T00:00:00+09:00`;
}

export function toSeoulEndIso(dateValue: string) {
  return `${dateValue}T23:59:59+09:00`;
}

export function formatKrw(value: number | null) {
  if (value === null) {
    return "-";
  }
  return `${value.toLocaleString("ko-KR")} KRW`;
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString("ko-KR");
}
