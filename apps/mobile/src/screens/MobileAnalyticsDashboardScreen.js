import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import MobileAnalyticsFilterPresetCard from "../components/MobileAnalyticsFilterPresetCard";
import ShellCard from "../components/ShellCard";
import { loadApprovalQueueItems } from "../lib/approvalQueueStore";
import { loadEmployeeRequests } from "../lib/employeeRequestStore";
import {
  buildMobileAnalyticsSnapshot,
  buildMobileAnalyticsTrendSeries,
  formatMobileAnalyticsRate,
  MOBILE_ANALYTICS_FOCUS_OPTIONS,
  MOBILE_ANALYTICS_PERIOD_OPTIONS,
  pushMobileAnalyticsFilterPresetRecent,
  resolveMobileAnalyticsFilterFromPreset,
  resolveMobileAnalyticsFocusLabel,
  resolveMobileAnalyticsFocusCount,
  resolveMobileAnalyticsPeriodDays,
  serializeMobileAnalyticsSnapshot
} from "../lib/mobileAnalytics";
import {
  loadMobileAnalyticsFilterPresetState,
  saveMobileAnalyticsFilterPresetState
} from "../lib/mobileAnalyticsStore";
import { loadNotificationInbox } from "../lib/notificationStore";
import { colors, spacing } from "../theme/tokens";

function Chip({ active, label, onPress }) {
  return (
    <Pressable style={[styles.chip, active ? styles.chipActive : null]} onPress={onPress}>
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

export default function MobileAnalyticsDashboardScreen({
  session,
  onOpenApprovalQueue,
  onOpenRequestHistory,
  onOpenRequestFollowUp,
  onOpenNotifications
}) {
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [filterState, setFilterState] = useState({ periodKey: "7d", focus: "all" });
  const [presetState, setPresetState] = useState({ pinnedPresetKeys: [], recentPresetKeys: [] });
  const [exportPayload, setExportPayload] = useState("");
  const [snapshotAt, setSnapshotAt] = useState(new Date());

  async function refreshAll() {
    const [approvalItems, requestItems, notificationItems] = await Promise.all([
      loadApprovalQueueItems(),
      loadEmployeeRequests(),
      loadNotificationInbox()
    ]);
    setApprovals(approvalItems);
    setRequests(requestItems);
    setNotifications(notificationItems);
    setSnapshotAt(new Date());
  }

  useEffect(() => {
    let active = true;
    Promise.all([refreshAll(), loadMobileAnalyticsFilterPresetState()])
      .then(([, savedPresetState]) => {
        if (!active) {
          return;
        }
        setPresetState(savedPresetState);
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

  const periodDays = useMemo(() => resolveMobileAnalyticsPeriodDays(filterState.periodKey, 7), [filterState.periodKey]);
  const source = useMemo(
    () => ({ approvals, requests, notifications }),
    [approvals, notifications, requests]
  );
  const snapshot = useMemo(
    () => buildMobileAnalyticsSnapshot(source, { periodDays, now: snapshotAt }),
    [periodDays, snapshotAt, source]
  );
  const focusCount = useMemo(
    () => resolveMobileAnalyticsFocusCount(snapshot, filterState.focus),
    [filterState.focus, snapshot]
  );
  const trendSeries = useMemo(
    () => buildMobileAnalyticsTrendSeries(source, { periodDays, now: snapshotAt }),
    [periodDays, snapshotAt, source]
  );
  const trendMax = useMemo(
    () =>
      trendSeries.reduce((max, row) => {
        const sum = row.approvals + row.requests + row.notifications;
        return Math.max(max, sum);
      }, 0),
    [trendSeries]
  );

  function generateExportPayload() {
    setExportPayload(serializeMobileAnalyticsSnapshot(snapshot));
  }

  function clearExportPayload() {
    setExportPayload("");
  }

  async function applyFilterPreset(presetKey) {
    const nextFilter = resolveMobileAnalyticsFilterFromPreset(presetKey, filterState);
    setFilterState(nextFilter);

    const nextRecent = pushMobileAnalyticsFilterPresetRecent(presetState.recentPresetKeys, presetKey).filter(
      (key) => !presetState.pinnedPresetKeys.includes(key)
    );
    const nextPresetState = {
      pinnedPresetKeys: presetState.pinnedPresetKeys,
      recentPresetKeys: nextRecent
    };
    const saved = await saveMobileAnalyticsFilterPresetState(nextPresetState);
    setPresetState(saved);
  }

  async function toggleFilterPresetPin(presetKey) {
    const nextPinned = presetState.pinnedPresetKeys.includes(presetKey)
      ? presetState.pinnedPresetKeys.filter((key) => key !== presetKey)
      : [...presetState.pinnedPresetKeys, presetKey];
    const nextPresetState = {
      pinnedPresetKeys: nextPinned,
      recentPresetKeys: presetState.recentPresetKeys.filter((key) => !nextPinned.includes(key))
    };
    const saved = await saveMobileAnalyticsFilterPresetState(nextPresetState);
    setPresetState(saved);
  }

  async function importFilterPresetTransfer(nextState) {
    const saved = await saveMobileAnalyticsFilterPresetState(nextState.presetState);
    setPresetState(saved);
    setFilterState(nextState.filterState);
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <Text style={styles.subtitle}>Mobile KPI snapshot across approvals, employee requests, and notifications.</Text>

        <ShellCard title="Window and refresh" subtitle={`window: ${snapshot.window.periodDays} days`}>
          <View style={styles.chipRow}>
            {MOBILE_ANALYTICS_PERIOD_OPTIONS.map((item) => (
              <Chip
                key={item.key}
                active={filterState.periodKey === item.key}
                label={item.label}
                onPress={() => setFilterState((prev) => ({ ...prev, periodKey: item.key }))}
              />
            ))}
          </View>
          <Text style={styles.meta}>focus: {resolveMobileAnalyticsFocusLabel(filterState.focus)}</Text>
          <View style={styles.chipRow}>
            {MOBILE_ANALYTICS_FOCUS_OPTIONS.map((item) => (
              <Chip
                key={item.key}
                active={filterState.focus === item.key}
                label={item.label}
                onPress={() => setFilterState((prev) => ({ ...prev, focus: item.key }))}
              />
            ))}
          </View>
          <View style={styles.row}>
            <Pressable style={styles.secondaryBtn} onPress={() => refreshAll()}>
              <Text style={styles.secondaryBtnText}>Refresh snapshot</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={generateExportPayload}>
              <Text style={styles.secondaryBtnText}>Generate export</Text>
            </Pressable>
          </View>
          <Text style={styles.meta}>generated at: {snapshot.generatedAt}</Text>
          <Text style={styles.meta}>
            range: {snapshot.window.from} → {snapshot.window.to}
          </Text>
        </ShellCard>

        <MobileAnalyticsFilterPresetCard
          source={source}
          snapshotAt={snapshotAt}
          filterState={filterState}
          presetState={presetState}
          onApplyPreset={applyFilterPreset}
          onTogglePresetPin={toggleFilterPresetPin}
          onImportPresetTransfer={importFilterPresetTransfer}
        />

        <ShellCard title="KPI snapshot" subtitle={loading ? "Loading..." : `${focusCount} focus item(s)`}>
          <Text style={styles.kpi}>action required: {snapshot.kpi.actionRequired}</Text>
          <Text style={styles.meta}>approvals pending: {snapshot.kpi.approvalsPending}</Text>
          <Text style={styles.meta}>requests pending action: {snapshot.kpi.requestsPendingAction}</Text>
          <Text style={styles.meta}>notifications unread: {snapshot.kpi.notificationsUnread}</Text>
          <Text style={styles.meta}>approval decision rate: {formatMobileAnalyticsRate(snapshot.kpi.approvalsDecisionRate)}</Text>
          <Text style={styles.meta}>request approval rate: {formatMobileAnalyticsRate(snapshot.kpi.requestsApprovalRate)}</Text>
          <Text style={styles.meta}>notification read rate: {formatMobileAnalyticsRate(snapshot.kpi.notificationsReadRate)}</Text>
        </ShellCard>

        <ShellCard title="Domain breakdown">
          {filterState.focus === "all" || filterState.focus === "approval" ? (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Approval queue</Text>
              <Text style={styles.meta}>pending: {snapshot.domain.approval.pending}</Text>
              <Text style={styles.meta}>high pending: {snapshot.domain.approval.highPriorityPending}</Text>
              <Text style={styles.meta}>stalled 24h+: {snapshot.domain.approval.stalledOver24h}</Text>
            </View>
          ) : null}
          {filterState.focus === "all" || filterState.focus === "request" ? (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Employee requests</Text>
              <Text style={styles.meta}>submitted: {snapshot.domain.request.submitted}</Text>
              <Text style={styles.meta}>in review: {snapshot.domain.request.inReview}</Text>
              <Text style={styles.meta}>approved: {snapshot.domain.request.approved}</Text>
            </View>
          ) : null}
          {filterState.focus === "all" || filterState.focus === "notification" ? (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Notifications</Text>
              <Text style={styles.meta}>active: {snapshot.domain.notification.total}</Text>
              <Text style={styles.meta}>unread: {snapshot.domain.notification.unread}</Text>
              <Text style={styles.meta}>approval request unread: {snapshot.domain.notification.categories.approvalRequest?.unread ?? 0}</Text>
            </View>
          ) : null}
        </ShellCard>

        <ShellCard title="Daily trend" subtitle={`${trendSeries.length} day(s)`}>
          {trendSeries.map((row) => {
            const total = row.approvals + row.requests + row.notifications;
            const widthPercent = trendMax > 0 ? Math.max(8, Math.round((total / trendMax) * 100)) : 8;
            return (
              <View key={row.day} style={styles.trendRow}>
                <Text style={styles.trendDay}>{row.day}</Text>
                <View style={styles.trendTrack}>
                  <View style={[styles.trendFill, { width: `${widthPercent}%` }]} />
                </View>
                <Text style={styles.trendMeta}>A{row.approvals}/R{row.requests}/N{row.notifications}</Text>
              </View>
            );
          })}
        </ShellCard>

        <ShellCard title="Quick links">
          <View style={styles.row}>
            {onOpenApprovalQueue ? (
              <Pressable style={styles.secondaryBtn} onPress={onOpenApprovalQueue}>
                <Text style={styles.secondaryBtnText}>Open approval queue</Text>
              </Pressable>
            ) : null}
            {onOpenRequestHistory ? (
              <Pressable style={styles.secondaryBtn} onPress={onOpenRequestHistory}>
                <Text style={styles.secondaryBtnText}>Open request history</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.row}>
            {onOpenRequestFollowUp ? (
              <Pressable style={styles.secondaryBtn} onPress={onOpenRequestFollowUp}>
                <Text style={styles.secondaryBtnText}>Open follow-up inbox</Text>
              </Pressable>
            ) : null}
            {onOpenNotifications ? (
              <Pressable style={styles.secondaryBtn} onPress={onOpenNotifications}>
                <Text style={styles.secondaryBtnText}>Open notifications</Text>
              </Pressable>
            ) : null}
          </View>
        </ShellCard>

        <ShellCard title="Export snapshot" subtitle="Share snapshot payload as JSON">
          <TextInput
            editable={false}
            multiline
            numberOfLines={8}
            value={exportPayload}
            placeholder="Generate export payload to see dashboard snapshot JSON"
            style={styles.payload}
          />
          <View style={styles.row}>
            <Pressable style={styles.secondaryBtn} onPress={generateExportPayload}>
              <Text style={styles.secondaryBtnText}>Generate export payload</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={clearExportPayload}>
              <Text style={styles.secondaryBtnText}>Clear payload</Text>
            </Pressable>
          </View>
          <Text style={styles.meta}>tenant: {session.tenantId}</Text>
          <Text style={styles.meta}>actor: {session.actorId}</Text>
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
  row: { flexDirection: "row", gap: spacing.sm },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: colors.primary },
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
  kpi: { color: colors.ink, fontWeight: "800", fontSize: 16 },
  meta: { color: colors.muted, fontSize: 12 },
  panel: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: spacing.sm,
    gap: 4
  },
  panelTitle: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  trendRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  trendDay: { color: colors.muted, fontSize: 11, width: 76 },
  trendTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#e6e9ef",
    overflow: "hidden"
  },
  trendFill: {
    height: "100%",
    backgroundColor: colors.primary
  },
  trendMeta: { color: colors.muted, fontSize: 11, width: 78, textAlign: "right" },
  payload: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    color: colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 120,
    textAlignVertical: "top"
  }
});
