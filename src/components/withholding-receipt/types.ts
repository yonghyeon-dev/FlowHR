export type WithholdingReceiptResponse = {
  receipt: {
    year: number;
    employeeId: string;
    issue: boolean;
    canIssue: boolean;
    issued: boolean;
    receiptNumber: string;
    issuerName: string;
    issuedAt: string | null;
    runStates: {
      totalRuns: number;
      confirmedRuns: number;
      previewedRuns: number;
      undistributedRuns: number;
      pendingReceiptRuns: number;
      previewedRunIds: string[];
      undistributedRunIds: string[];
      pendingReceiptRunIds: string[];
    };
    annualTotalsKrw: {
      grossPayKrw: number;
      withholdingTaxKrw: number;
      socialInsuranceKrw: number;
      otherDeductionsKrw: number;
      totalDeductionsKrw: number;
      netPayKrw: number;
    };
    blockingReasons: string[];
  };
};

export type WithholdingReceiptDocumentResponse = {
  document: {
    year: number;
    employeeId: string;
    receiptNumber: string;
    issuedAt: string;
    issuerName: string;
    format: "json" | "text";
    fileName: string;
    contentType: string;
    contentSha256: string;
    generatedAt: string;
    receipt: WithholdingReceiptResponse["receipt"];
    content: string;
  };
};

export type ApiLog = {
  id: number;
  label: string;
  status: number;
  ok: boolean;
  at: string;
};

export function currentYear() {
  return new Date().getFullYear();
}

export function formatKrw(value: number) {
  return `${value.toLocaleString("ko-KR")} KRW`;
}
