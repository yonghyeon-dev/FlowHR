import { type KpiCopy } from "@/components/admin-kpi/copy";

type NoticeLite = {
  id: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  publishedAt: string | null;
  updatedAt: string;
};

type NoticeReadReceiptLite = {
  noticeId: string;
  readAt: string;
};

export type NoticeReadCoverageSnapshot = {
  publishedNoticeCount: number;
  noReadNoticeCount: number;
  unreadAging3dCount: number;
};

export function buildNoticeReadCoverageSnapshot(
  input: {
    notices: NoticeLite[];
    readReceipts: NoticeReadReceiptLite[];
  },
  now = new Date()
): NoticeReadCoverageSnapshot {
  const nowMs = now.getTime();
  const agingThresholdMs = 3 * 24 * 60 * 60 * 1000;
  const readCountByNoticeId = new Map<string, number>();
  input.readReceipts.forEach((receipt) =>
    readCountByNoticeId.set(receipt.noticeId, (readCountByNoticeId.get(receipt.noticeId) ?? 0) + 1)
  );
  const published = input.notices.filter((notice) => notice.status === "PUBLISHED");
  const noReadNoticeCount = published.filter((notice) => (readCountByNoticeId.get(notice.id) ?? 0) === 0).length;
  const unreadAging3dCount = published.filter((notice) => {
    if ((readCountByNoticeId.get(notice.id) ?? 0) > 0) {
      return false;
    }
    const baselineMs = new Date(notice.publishedAt ?? notice.updatedAt).getTime();
    return Number.isFinite(baselineMs) && nowMs - baselineMs >= agingThresholdMs;
  }).length;
  return {
    publishedNoticeCount: published.length,
    noReadNoticeCount,
    unreadAging3dCount
  };
}

type AdminNoticesKpiPanelProps = {
  copy: KpiCopy;
  snapshot: NoticeReadCoverageSnapshot;
};

export function AdminNoticesKpiPanel({ copy, snapshot }: AdminNoticesKpiPanelProps) {
  return (
    <article className="panel">
      <h2>{copy.noticesPanel.title}</h2>
      <p className="small muted">{copy.noticesPanel.description}</p>
      <div className="kpi-strip">
        <article className="kpi-card">
          <p>{copy.noticesPanel.publishedNoticeCount}</p>
          <strong>{snapshot.publishedNoticeCount}</strong>
        </article>
        <article className="kpi-card">
          <p>{copy.noticesPanel.noReadNoticeCount}</p>
          <strong>{snapshot.noReadNoticeCount}</strong>
        </article>
        <article className="kpi-card">
          <p>{copy.noticesPanel.unreadAging3dCount}</p>
          <strong>{snapshot.unreadAging3dCount}</strong>
          <small>{copy.noticesPanel.agingThreshold}</small>
        </article>
      </div>
    </article>
  );
}
