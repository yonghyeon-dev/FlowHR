import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import ShellCard from "../components/ShellCard";
import {
  appendLiveMockNotification,
  buildNotificationCategoryStats,
  filterNotificationsByCategory,
  formatSyncClock,
  resolveNotificationCategoryLabelMap,
  sortNotificationsNewest
} from "../lib/notificationFeed";
import { filterNotificationHistory } from "../lib/notificationHistory";
import {
  loadNotificationInbox,
  loadNotificationPreference,
  saveNotificationInbox,
  saveNotificationPreference
} from "../lib/notificationStore";
import {
  mapFlowHrNotification,
  permissionLabel,
  registerDevicePushTokenAsync,
  requestPushPermissionAsync
} from "../lib/notifications";
import { resolveMobileLocale } from "../lib/mobileLocale";
import { colors, spacing } from "../theme/tokens";

const LIVE_SYNC_MS = 30000;

const COPY_BY_LOCALE = {
  ko: {
    title: "알림 센터",
    subtitle: "실시간 폴링, 푸시 권한 설정, 앱 내 활성 피드를 관리합니다.",
    pushPermissionTitle: "푸시 권한",
    requestPermission: "권한 요청/새로고침",
    refreshNow: "지금 새로고침",
    liveSyncOn: "실시간 동기화 켜짐",
    liveSyncOff: "실시간 동기화 꺼짐",
    lastSync: "마지막 동기화",
    tenant: "테넌트",
    actor: "액터",
    pushToken: "푸시 토큰",
    preferencesTitle: "알림 수신 설정",
    feedFilterTitle: "피드 필터",
    activeFilter: "현재 필터",
    unreadCount: "읽지 않음",
    appendLiveEvent: "모의 실시간 이벤트 추가",
    activeFeedTitle: "활성 피드",
    loading: "불러오는 중...",
    itemSuffix: "건",
    markAllRead: "전체 읽음 처리",
    openHistory: "이력 검색/보관",
    on: "켜짐",
    off: "꺼짐",
    preferenceLabel: {
      approvalRequest: "승인 요청",
      approvalResult: "승인 결과",
      payslipReady: "명세서 발행"
    }
  },
  en: {
    title: "Notification Center",
    subtitle: "Manage live polling, push preference controls, and active in-app feed.",
    pushPermissionTitle: "Push permission",
    requestPermission: "Request / Refresh permission",
    refreshNow: "Refresh now",
    liveSyncOn: "Live sync ON",
    liveSyncOff: "Live sync OFF",
    lastSync: "last sync",
    tenant: "tenant",
    actor: "actor",
    pushToken: "push token",
    preferencesTitle: "Notification preferences",
    feedFilterTitle: "Feed filters",
    activeFilter: "active filter",
    unreadCount: "unread",
    appendLiveEvent: "Append simulated live event",
    activeFeedTitle: "Active feed",
    loading: "Loading...",
    itemSuffix: "item(s)",
    markAllRead: "Mark all read",
    openHistory: "History search/archive",
    on: "ON",
    off: "OFF",
    preferenceLabel: {
      approvalRequest: "Approval request",
      approvalResult: "Approval result",
      payslipReady: "Payslip ready"
    }
  }
};

function normalizeInbox(messages, locale) {
  return sortNotificationsNewest(messages.map((item) => mapFlowHrNotification(item, locale)));
}

export default function NotificationCenterScreen({ session, onOpenHistory }) {
  const locale = resolveMobileLocale();
  const copy = locale === "en" ? COPY_BY_LOCALE.en : COPY_BY_LOCALE.ko;
  const categoryLabel = useMemo(() => resolveNotificationCategoryLabelMap(locale), [locale]);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState("undetermined");
  const [pushToken, setPushToken] = useState("");
  const [preference, setPreference] = useState({});
  const [inbox, setInbox] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [liveSyncEnabled, setLiveSyncEnabled] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState("");

  async function refreshInbox() {
    const messages = await loadNotificationInbox(locale);
    setInbox(normalizeInbox(messages, locale));
    setLastSyncedAt(new Date().toISOString());
  }

  useEffect(() => {
    let active = true;
    Promise.all([loadNotificationPreference(), loadNotificationInbox(locale)])
      .then(([pref, messages]) => {
        if (!active) {
          return;
        }
        setPreference(pref);
        setInbox(normalizeInbox(messages, locale));
        setLastSyncedAt(new Date().toISOString());
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [locale]);

  useEffect(() => {
    if (!liveSyncEnabled) {
      return () => {};
    }
    const timer = setInterval(() => {
      refreshInbox().catch(() => {});
    }, LIVE_SYNC_MS);
    return () => clearInterval(timer);
  }, [liveSyncEnabled]);

  const activeInbox = useMemo(() => filterNotificationHistory(inbox, { archiveState: "active" }), [inbox]);
  const categoryStats = useMemo(() => buildNotificationCategoryStats(activeInbox), [activeInbox]);
  const filteredInbox = useMemo(
    () => filterNotificationsByCategory(activeInbox, activeCategory),
    [activeCategory, activeInbox]
  );
  const unreadCount = categoryStats.all?.unread ?? 0;

  async function enablePush() {
    const status = await requestPushPermissionAsync();
    setPermission(status);
    if (status === "granted") {
      const token = await registerDevicePushTokenAsync();
      if (token) {
        setPushToken(token);
      }
    }
  }

  async function togglePreference(key) {
    const next = { ...preference, [key]: !preference[key] };
    setPreference(next);
    await saveNotificationPreference(next);
  }

  async function markAllRead() {
    const next = inbox.map((item) => ({ ...item, read: true }));
    setInbox(next);
    await saveNotificationInbox(next);
  }

  async function appendLiveEvent() {
    const next = appendLiveMockNotification(inbox, new Date(), locale);
    setInbox(next);
    await saveNotificationInbox(next);
    setLastSyncedAt(new Date().toISOString());
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>

        <ShellCard title={copy.pushPermissionTitle} subtitle={`status: ${permissionLabel(permission, locale)}`}>
          <Pressable style={styles.btn} onPress={enablePush}>
            <Text style={styles.btnText}>{copy.requestPermission}</Text>
          </Pressable>
          <View style={styles.controlRow}>
            <Pressable style={styles.secondaryBtn} onPress={() => refreshInbox()}>
              <Text style={styles.secondaryBtnText}>{copy.refreshNow}</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => setLiveSyncEnabled((value) => !value)}>
              <Text style={styles.secondaryBtnText}>{liveSyncEnabled ? copy.liveSyncOn : copy.liveSyncOff}</Text>
            </Pressable>
          </View>
          <Text style={styles.meta}>{copy.lastSync}: {formatSyncClock(lastSyncedAt)}</Text>
          <Text style={styles.meta}>{copy.tenant}: {session.tenantId}</Text>
          <Text style={styles.meta}>{copy.actor}: {session.actorId}</Text>
          {pushToken ? <Text style={styles.token}>{copy.pushToken}: {pushToken}</Text> : null}
        </ShellCard>

        <ShellCard title={copy.preferencesTitle}>
          {Object.entries(copy.preferenceLabel).map(([key, label]) => (
            <Pressable key={key} style={styles.preferenceRow} onPress={() => togglePreference(key)}>
              <Text style={styles.preferenceLabel}>{label}</Text>
              <View style={[styles.toggle, preference[key] ? styles.toggleOn : null]}>
                <Text style={[styles.toggleText, preference[key] ? styles.toggleTextOn : null]}>
                  {preference[key] ? copy.on : copy.off}
                </Text>
              </View>
            </Pressable>
          ))}
        </ShellCard>

        <ShellCard
          title={copy.feedFilterTitle}
          subtitle={`${copy.activeFilter}: ${categoryLabel[activeCategory] ?? activeCategory} · ${copy.unreadCount} ${unreadCount}`}
        >
          <View style={styles.categoryRow}>
            {Object.entries(categoryLabel).map(([key, label]) => {
              const stat = categoryStats[key] ?? { total: 0, unread: 0 };
              return (
                <Pressable
                  key={key}
                  style={[styles.categoryChip, activeCategory === key ? styles.categoryChipActive : null]}
                  onPress={() => setActiveCategory(key)}
                >
                  <Text style={[styles.categoryText, activeCategory === key ? styles.categoryTextActive : null]}>
                    {label} {stat.unread > 0 ? `(${stat.unread})` : ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable style={styles.secondaryBtn} onPress={appendLiveEvent}>
            <Text style={styles.secondaryBtnText}>{copy.appendLiveEvent}</Text>
          </Pressable>
        </ShellCard>

        <ShellCard
          title={copy.activeFeedTitle}
          subtitle={loading ? copy.loading : `${filteredInbox.length} ${copy.itemSuffix}`}
        >
          <View style={styles.controlRow}>
            <Pressable style={styles.secondaryBtn} onPress={markAllRead}>
              <Text style={styles.secondaryBtnText}>{copy.markAllRead}</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={onOpenHistory}>
              <Text style={styles.secondaryBtnText}>{copy.openHistory}</Text>
            </Pressable>
          </View>
          {filteredInbox.map((item) => (
            <View key={item.id} style={[styles.item, item.read ? styles.itemRead : null]}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemBody}>{item.body}</Text>
              <Text style={styles.itemMeta}>
                {categoryLabel[item.category] ?? item.category} · {item.createdAt}
              </Text>
            </View>
          ))}
        </ShellCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 24, fontWeight: "800", color: colors.ink },
  subtitle: { color: colors.muted, fontSize: 14 },
  btn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    paddingVertical: 10,
    alignItems: "center"
  },
  btnText: { color: colors.primary, fontWeight: "700" },
  controlRow: { flexDirection: "row", gap: spacing.sm },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingVertical: 9,
    alignItems: "center"
  },
  secondaryBtnText: { color: colors.ink, fontWeight: "600", fontSize: 12 },
  meta: { color: colors.muted, fontSize: 12 },
  token: { color: colors.primary, fontSize: 12 },
  preferenceRow: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  preferenceLabel: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  toggle: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  toggleOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  toggleText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  toggleTextOn: { color: colors.primary },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  categoryChip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  categoryChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  categoryText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  categoryTextActive: { color: colors.primary },
  item: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: spacing.sm,
    gap: 5
  },
  itemRead: { opacity: 0.65 },
  itemTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  itemBody: { color: colors.muted, fontSize: 13 },
  itemMeta: { color: colors.muted, fontSize: 11 }
});
