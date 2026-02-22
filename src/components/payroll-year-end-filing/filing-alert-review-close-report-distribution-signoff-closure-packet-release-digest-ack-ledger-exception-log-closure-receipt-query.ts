export type ExceptionClosureReceiptQueryParams = {
  metricParam: string | null;
  levelParam: string | null;
  ownerRoleParam: string | null;
  ownerActorIdParam: string | null;
  valueParam: string | null;
  handoffReadyParam: string | null;
  exportReadyParam: string | null;
  archiveReadyParam: string | null;
  routingReadyParam: string | null;
  signatureReadyParam: string | null;
  packageLockedParam: string | null;
  handoverAcknowledgedParam: string | null;
  receiptVerifiedParam: string | null;
  digestReadyParam: string | null;
  closeReportPublishedParam: string | null;
  publicationReadyParam: string | null;
  distributionReadyParam: string | null;
  signoffReadyParam: string | null;
  closurePacketSealedParam: string | null;
  dispatchReadyParam: string | null;
  releaseDigestPublishedParam: string | null;
  releaseDigestDeliveryReadyParam: string | null;
  ackLedgerVerifiedParam: string | null;
  ackChannelsReconciledParam: string | null;
  exceptionLogClosedParam: string | null;
  allExceptionsResolvedParam: string | null;
};

export function readExceptionClosureReceiptQueryParams(searchParams: {
  get: (key: string) => string | null;
}): ExceptionClosureReceiptQueryParams {
  return {
    metricParam: searchParams.get("metric"),
    levelParam: searchParams.get("level"),
    ownerRoleParam: searchParams.get("ownerRole"),
    ownerActorIdParam: searchParams.get("ownerActorId"),
    valueParam: searchParams.get("value"),
    handoffReadyParam: searchParams.get("handoffReady"),
    exportReadyParam: searchParams.get("exportReady"),
    archiveReadyParam: searchParams.get("archiveReady"),
    routingReadyParam: searchParams.get("routingReady"),
    signatureReadyParam: searchParams.get("signatureReady"),
    packageLockedParam: searchParams.get("packageLocked"),
    handoverAcknowledgedParam: searchParams.get("handoverAcknowledged"),
    receiptVerifiedParam: searchParams.get("receiptVerified"),
    digestReadyParam: searchParams.get("digestReady"),
    closeReportPublishedParam: searchParams.get("closeReportPublished"),
    publicationReadyParam: searchParams.get("publicationReady"),
    distributionReadyParam: searchParams.get("distributionReady"),
    signoffReadyParam: searchParams.get("signoffReady"),
    closurePacketSealedParam: searchParams.get("closurePacketSealed"),
    dispatchReadyParam: searchParams.get("dispatchReady"),
    releaseDigestPublishedParam: searchParams.get("releaseDigestPublished"),
    releaseDigestDeliveryReadyParam: searchParams.get("releaseDigestDeliveryReady"),
    ackLedgerVerifiedParam: searchParams.get("ackLedgerVerified"),
    ackChannelsReconciledParam: searchParams.get("ackChannelsReconciled"),
    exceptionLogClosedParam: searchParams.get("exceptionLogClosed"),
    allExceptionsResolvedParam: searchParams.get("allExceptionsResolved")
  };
}
