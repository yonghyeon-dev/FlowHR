import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import ShellCard from "../components/ShellCard";
import {
  appendLiveMockNotification,
  buildNotificationCategoryStats,
  filterNotificationsByCategory,
  formatSyncClock,
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
import { colors, spacing } from "../theme/tokens";

const LIVE_SYNC_MS = 30000;

const PREFERENCE_LABEL = {
  approvalRequest: "Approval request",
  approvalResult: "Approval result",
  payslipReady: "Payslip ready"
};

const CATEGORY_LABEL = {
  all: "All",
  approvalRequest: "Approval request",
  approvalResult: "Approval result",
  payslipReady: "Payslip ready"
};

function normalizeInbox(messages) {
  return sortNotificationsNewest(messages.map(mapFlowHrNotification));
}

export default function NotificationCenterScreen({ session, onOpenHistory }) {
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState("undetermined");
  const [pushToken, setPushToken] = useState("");
  const [preference, setPreference] = useState({});
  const [inbox, setInbox] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [liveSyncEnabled, setLiveSyncEnabled] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState("");

  async function refreshInbox() {
    const messages = await loadNotificationInbox();
    setInbox(normalizeInbox(messages));
    setLastSyncedAt(new Date().toISOString());
  }

  useEffect(() => {
    let active = true;
    Promise.all([loadNotificationPreference(), loadNotificationInbox()])
      .then(([pref, messages]) => {
        if (!active) {
          return;
        }
        setPreference(pref);
        setInbox(normalizeInbox(messages));
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
  }, []);

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
    const next = appendLiveMockNotification(inbox);
    setInbox(next);
    await saveNotificationInbox(next);
    setLastSyncedAt(new Date().toISOString());
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Notification Center</Text>
        <Text style={styles.subtitle}>Live polling, push preference controls, and active in-app feed.</Text>

        <ShellCard title="Push permission" subtitle={`status: ${permissionLabel(permission)}`}>
          <Pressable style={styles.btn} onPress={enablePush}>
            <Text style={styles.btnText}>Request / Refresh permission</Text>
          </Pressable>
          <View style={styles.controlRow}>
            <Pressable style={styles.secondaryBtn} onPress={() => refreshInbox()}>
              <Text style={styles.secondaryBtnText}>Refresh now</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => setLiveSyncEnabled((value) => !value)}>
              <Text style={styles.secondaryBtnText}>{liveSyncEnabled ? "Live sync ON" : "Live sync OFF"}</Text>
            </Pressable>
          </View>
          <Text style={styles.meta}>last sync: {formatSyncClock(lastSyncedAt)}</Text>
          <Text style={styles.meta}>tenant: {session.tenantId}</Text>
          <Text style={styles.meta}>actor: {session.actorId}</Text>
          {pushToken ? <Text style={styles.token}>push token: {pushToken}</Text> : null}
        </ShellCard>

        <ShellCard title="Notification preferences">
          {Object.entries(PREFERENCE_LABEL).map(([key, label]) => (
            <Pressable key={key} style={styles.preferenceRow} onPress={() => togglePreference(key)}>
              <Text style={styles.preferenceLabel}>{label}</Text>
              <View style={[styles.toggle, preference[key] ? styles.toggleOn : null]}>
                <Text style={[styles.toggleText, preference[key] ? styles.toggleTextOn : null]}>
                  {preference[key] ? "ON" : "OFF"}
                </Text>
              </View>
            </Pressable>
          ))}
        </ShellCard>

        <ShellCard title="Feed filters" subtitle={`active filter: ${CATEGORY_LABEL[activeCategory]} · unread ${unreadCount}`}>
          <View style={styles.categoryRow}>
            {Object.entries(CATEGORY_LABEL).map(([key, label]) => {
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
            <Text style={styles.secondaryBtnText}>Append simulated live event</Text>
          </Pressable>
        </ShellCard>

        <ShellCard title="Active feed" subtitle={loading ? "Loading..." : `${filteredInbox.length} item(s)`}>
          <View style={styles.controlRow}>
            <Pressable style={styles.secondaryBtn} onPress={markAllRead}>
              <Text style={styles.secondaryBtnText}>Mark all read</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={onOpenHistory}>
              <Text style={styles.secondaryBtnText}>History search/archive</Text>
            </Pressable>
          </View>
          {filteredInbox.map((item) => (
            <View key={item.id} style={[styles.item, item.read ? styles.itemRead : null]}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemBody}>{item.body}</Text>
              <Text style={styles.itemMeta}>
                {CATEGORY_LABEL[item.category] ?? item.category} · {item.createdAt}
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
