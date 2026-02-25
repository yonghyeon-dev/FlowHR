export type NoticeAudience = "all" | "employees" | "admins";
export type NoticeStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED";

export type NoticeItem = {
  id: string;
  organizationId: string;
  title: string;
  body: string;
  audience: NoticeAudience;
  status: NoticeStatus;
  publishAt: string | null;
  publishedAt: string | null;
  createdByActorId: string;
  createdAt: string;
  updatedAt: string;
};

export type NoticeReadReceipt = {
  noticeId: string;
  organizationId: string;
  actorId: string;
  readAt: string;
};
