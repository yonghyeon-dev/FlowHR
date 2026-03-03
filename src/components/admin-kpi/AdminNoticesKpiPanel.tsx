import Link from "next/link";
import { type KpiCopy } from "@/components/admin-kpi/copy";
import { type AdminKpiFocusMetric } from "@/components/admin-kpi/AdminKpiSections";

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
  analyticsFocusMetric?: AdminKpiFocusMetric;
};

type NoticePriorityAction = {
  href: string;
  reason: string;
};

function withAnalyticsSourceContext(
  href: string,
  options?: { focusMetric?: string; analyticsFocusMetric?: AdminKpiFocusMetric }
): string {
  const contextParams = new URLSearchParams({ source: "admin-analytics" });
  if (options?.focusMetric) {
    contextParams.set("focusMetric", options.focusMetric);
  }
  if (options?.analyticsFocusMetric && options.analyticsFocusMetric !== "all") {
    contextParams.set("analyticsFocus", options.analyticsFocusMetric);
  }
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}${contextParams.toString()}`;
}

function resolveNoticePriorityAction(
  snapshot: NoticeReadCoverageSnapshot,
  copy: KpiCopy,
  analyticsFocusMetric?: AdminKpiFocusMetric
): NoticePriorityAction {
  if (snapshot.unreadAging3dCount > 0) {
    return {
      href: withAnalyticsSourceContext(
        "/admin/notices?status=PUBLISHED&risk=no-read",
        { focusMetric: "noticeUnreadAging3dCount", analyticsFocusMetric }
      ),
      reason: copy.noticesPanel.priorityReasonAging
    };
  }
  if (snapshot.noReadNoticeCount > 0) {
    return {
      href: withAnalyticsSourceContext("/admin/notices?status=PUBLISHED&risk=no-read", {
        focusMetric: "noticeNoReadCount",
        analyticsFocusMetric
      }),
      reason: copy.noticesPanel.priorityReasonNoRead
    };
  }
  return {
    href: withAnalyticsSourceContext("/admin/notices?status=PUBLISHED", {
      focusMetric: "noticePublishedCount",
      analyticsFocusMetric
    }),
    reason: copy.noticesPanel.priorityReasonClear
  };
}

export function AdminNoticesKpiPanel({ copy, snapshot, analyticsFocusMetric }: AdminNoticesKpiPanelProps) {
  const priorityAction = resolveNoticePriorityAction(snapshot, copy, analyticsFocusMetric);
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
      <div style={{ marginTop: 10 }}>
        <h3>{copy.noticesPanel.priorityActionLabel}</h3>
        <p className="small muted">{priorityAction.reason}</p>
        <div className="actions">
          <Link href={priorityAction.href} className="btn btn-secondary">
            {copy.noticesPanel.actionOpenNoReadQueue}
          </Link>
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        <h3>{copy.noticesPanel.quickActionsLabel}</h3>
        <div className="actions">
          <Link
            href={withAnalyticsSourceContext("/admin/notices", {
              focusMetric: "noticePublishedCount",
              analyticsFocusMetric
            })}
            className="btn btn-secondary btn-small"
          >
            {copy.noticesPanel.actionOpenNoticeWorkspace}
          </Link>
          <Link
            href={withAnalyticsSourceContext("/admin/notices?status=PUBLISHED&risk=no-read", {
              focusMetric: "noticeNoReadCount",
              analyticsFocusMetric
            })}
            className="btn btn-secondary btn-small"
          >
            {copy.noticesPanel.actionOpenNoReadQueue}
          </Link>
        </div>
      </div>
    </article>
  );
}
