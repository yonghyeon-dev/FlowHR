import type { NoticeItem } from "@/features/notices/types";
import {
  resolveNoticeAudienceLabel,
  type EmployeeNoticeBoardCopy
} from "@/components/notices/copy";

type EmployeeNoticeBoardListProps = {
  copy: EmployeeNoticeBoardCopy;
  notices: NoticeItem[];
  filteredNotices: NoticeItem[];
  readNoticeIds: string[];
  readAtByNoticeId: Map<string, string>;
  pending: boolean;
  runtimeLocale: string;
  onMarkAsRead: (noticeId: string) => void;
};

export function EmployeeNoticeBoardList({
  copy,
  notices,
  filteredNotices,
  readNoticeIds,
  readAtByNoticeId,
  pending,
  runtimeLocale,
  onMarkAsRead
}: EmployeeNoticeBoardListProps) {
  if (notices.length === 0) {
    return <p className="small muted">{copy.listEmpty}</p>;
  }

  if (filteredNotices.length === 0) {
    return <p className="small muted">{copy.filteredListEmpty}</p>;
  }

  return (
    <ul className="simple-list">
      {filteredNotices.map((notice) => {
        const isRead = readNoticeIds.includes(notice.id);
        const readAt = readAtByNoticeId.get(notice.id) ?? null;
        return (
          <li key={notice.id}>
            <span>
              <strong>{notice.title}</strong>
              <br />
              <span className="small muted">{notice.body}</span>
              <br />
              <span className="small muted">
                {copy.audienceLabel}: {resolveNoticeAudienceLabel(copy, notice.audience)} ·{" "}
                {notice.publishedAt ?? notice.updatedAt}
              </span>
              <br />
              <span className="small muted">
                {isRead ? copy.readBadge : copy.unreadBadge}
                {readAt ? ` · ${copy.readAtLabel}: ${new Date(readAt).toLocaleString(runtimeLocale)}` : ""}
              </span>
            </span>
            {isRead ? null : (
              <button
                type="button"
                className="btn btn-secondary btn-small"
                disabled={pending}
                onClick={() => onMarkAsRead(notice.id)}
              >
                {copy.markReadAction}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
