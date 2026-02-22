export const FILING_WORKFLOW_STEPS = [
  "alert",
  "checklist",
  "review",
  "close-off",
  "delivery",
  "archive",
  "report"
] as const;

export type FilingWorkflowStep = (typeof FILING_WORKFLOW_STEPS)[number];

export type FilingWorkflowAlertLevel = "watch" | "critical";

export type FilingWorkflowMetadata = {
  metric: string;
  level: FilingWorkflowAlertLevel;
  ownerRole: string;
  ownerActorId: string;
  value: number | null;
};

export const FILING_WORKFLOW_GATE_KEYS = [
  "handoffReady",
  "exportReady",
  "archiveReady",
  "routingReady",
  "signatureReady",
  "packageLocked",
  "handoverAcknowledged",
  "receiptVerified",
  "digestReady",
  "closeReportPublished",
  "publicationReady",
  "distributionReady",
  "signoffReady",
  "closurePacketSealed",
  "dispatchReady",
  "releaseDigestPublished",
  "releaseDigestDeliveryReady",
  "ackLedgerVerified",
  "ackChannelsReconciled",
  "exceptionLogClosed",
  "allExceptionsResolved"
] as const;

export type FilingWorkflowGateKey = (typeof FILING_WORKFLOW_GATE_KEYS)[number];

export type FilingWorkflowGates = Record<FilingWorkflowGateKey, boolean>;

export type FilingWorkflowActionLogEntry = {
  id: string;
  step: FilingWorkflowStep;
  message: string;
  actor: string;
  at: string;
};

export type FilingWorkflowState = {
  currentStep: FilingWorkflowStep;
  gates: FilingWorkflowGates;
  metadata: FilingWorkflowMetadata;
  actionLog: FilingWorkflowActionLogEntry[];
};

export type FilingStepDefinition = {
  step: FilingWorkflowStep;
  title: string;
  description: string;
};

export const FILING_STEP_DEFINITIONS: ReadonlyArray<FilingStepDefinition> = [
  {
    step: "alert",
    title: "Alert",
    description: "Monitor filing alerts and assign owners."
  },
  {
    step: "checklist",
    title: "Checklist",
    description: "Execute mandatory filing checklist items."
  },
  {
    step: "review",
    title: "Review",
    description: "Review checklist output and capture handoff evidence."
  },
  {
    step: "close-off",
    title: "Close-off",
    description: "Complete close-off package and audit sign-off."
  },
  {
    step: "delivery",
    title: "Delivery",
    description: "Lock delivery package and verify handover."
  },
  {
    step: "archive",
    title: "Archive",
    description: "Verify archive evidence and completion artifacts."
  },
  {
    step: "report",
    title: "Report",
    description: "Publish final report and distribution sign-off."
  }
];

export const FILING_WORKFLOW_GATE_LABELS: Record<FilingWorkflowGateKey, string> = {
  handoffReady: "Handoff Ready",
  exportReady: "Export Ready",
  archiveReady: "Archive Ready",
  routingReady: "Routing Ready",
  signatureReady: "Signature Ready",
  packageLocked: "Package Locked",
  handoverAcknowledged: "Handover Acknowledged",
  receiptVerified: "Completion Receipt Verified",
  digestReady: "Digest Ready",
  closeReportPublished: "Close Report Published",
  publicationReady: "Publication Ready",
  distributionReady: "Distribution Ready",
  signoffReady: "Sign-off Ready",
  closurePacketSealed: "Closure Packet Sealed",
  dispatchReady: "Dispatch Ready",
  releaseDigestPublished: "Release Digest Published",
  releaseDigestDeliveryReady: "Release Digest Delivery Ready",
  ackLedgerVerified: "Ack Ledger Verified",
  ackChannelsReconciled: "Ack Channels Reconciled",
  exceptionLogClosed: "Exception Log Closed",
  allExceptionsResolved: "All Exceptions Resolved"
};
