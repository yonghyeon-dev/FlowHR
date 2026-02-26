import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import ShellCard from "../components/ShellCard";
import {
  EMPLOYEE_REQUEST_FOLLOW_UP_SEVERITY_OPTIONS,
  EMPLOYEE_REQUEST_FOLLOW_UP_SORT_OPTIONS,
  EMPLOYEE_REQUEST_STATUS_OPTIONS,
  applyEmployeeRequestStatus,
  buildEmployeeRequestFollowUpStats,
  buildEmployeeRequestFollowUps,
  filterEmployeeRequestFollowUps,
  formatEmployeeRequestFollowUpSeverity,
  formatEmployeeRequestStatus,
  sortEmployeeRequestFollowUps
} from "../lib/employeeRequest";
import { loadEmployeeRequestsWithApiFallback } from "../lib/employeeRequestSync";
import { saveEmployeeRequests } from "../lib/employeeRequestStore";
import { colors, spacing } from "../theme/tokens";

const REQUEST_TYPE_LABEL = {
  attendanceCorrection: "Attendance correction",
  leaveRequest: "Leave request"
};

const ACTION_TO_STATUS = {
  moveToReview: "inReview",
  approve: "approved",
  reject: "rejected",
  reopenReview: "inReview"
};

const ACTION_LABEL = {
  moveToReview: "Move to in review",
  approve: "Approve",
  reject: "Reject",
  reopenReview: "Reopen review",
  openHistory: "Open history",
  openSubmit: "Open submit"
};

function FilterChip({ active, label, onPress }) {
  return (
    <Pressable style={[styles.chip, active ? styles.chipActive : null]} onPress={onPress}>
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

function actionButtonStyle(action) {
  if (action === "approve" || action === "moveToReview" || action === "reopenReview") {
    return [styles.actionBtn, styles.actionPrimary];
  }
  return [styles.actionBtn];
}

function actionTextStyle(action) {
  if (action === "approve" || action === "moveToReview" || action === "reopenReview") {
    return [styles.actionBtnText, styles.actionPrimaryText];
  }
  return [styles.actionBtnText];
}

export default function EmployeeRequestFollowUpScreen({
  session,
  onOpenRequestHistory,
  onOpenRequestSubmit
}) {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("priority");
  const [dismissedMap, setDismissedMap] = useState({});

  async function refreshRequests() {
    const { items } = await loadEmployeeRequestsWithApiFallback(session);
    setRequests(items);
  }

  useEffect(() => {
    let active = true;
    refreshRequests()
      .then(() => {
        if (!active) {
          return;
        }
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
  }, [session]);

  const followUps = useMemo(() => {
    return buildEmployeeRequestFollowUps(requests).filter((item) => !dismissedMap[item.id]);
  }, [dismissedMap, requests]);

  const stats = useMemo(() => buildEmployeeRequestFollowUpStats(followUps), [followUps]);
  const visibleFollowUps = useMemo(() => {
    const filtered = filterEmployeeRequestFollowUps(followUps, {
      severity: severityFilter,
      status: statusFilter,
      query
    });
    return sortEmployeeRequestFollowUps(filtered, sortKey);
  }, [followUps, query, severityFilter, sortKey, statusFilter]);

  async function handleFollowUpAction(item, action) {
    if (action === "openHistory") {
      onOpenRequestHistory?.();
      return;
    }
    if (action === "openSubmit") {
      onOpenRequestSubmit?.(item.requestType ?? "attendanceCorrection");
      return;
    }
    const targetStatus = ACTION_TO_STATUS[action];
    if (!targetStatus) {
      return;
    }
    const next = applyEmployeeRequestStatus(requests, item.requestId, targetStatus);
    setRequests(next);
    await saveEmployeeRequests(next);
  }

  function dismissFollowUp(followUpId) {
    setDismissedMap((prev) => ({ ...prev, [followUpId]: true }));
  }

  function clearDismissed() {
    setDismissedMap({});
  }

  function resetFilters() {
    setQuery("");
    setSeverityFilter("all");
    setStatusFilter("all");
    setSortKey("priority");
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Request Follow-Up</Text>
        <Text style={styles.subtitle}>Status-driven request alerts with quick follow-up actions.</Text>

        <ShellCard title="Search and refresh">
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Search title, message, or reason"
            style={styles.input}
          />
          <View style={styles.row}>
            <Pressable style={styles.secondaryBtn} onPress={() => setQuery("")}>
              <Text style={styles.secondaryBtnText}>Clear query</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => refreshRequests()}>
              <Text style={styles.secondaryBtnText}>Refresh</Text>
            </Pressable>
          </View>
        </ShellCard>

        <ShellCard title="Filters">
          <Text style={styles.label}>Severity</Text>
          <View style={styles.chipRow}>
            {EMPLOYEE_REQUEST_FOLLOW_UP_SEVERITY_OPTIONS.map((option) => (
              <FilterChip
                key={option.key}
                active={severityFilter === option.key}
                label={option.label}
                onPress={() => setSeverityFilter(option.key)}
              />
            ))}
          </View>
          <Text style={styles.label}>Request status</Text>
          <View style={styles.chipRow}>
            {EMPLOYEE_REQUEST_STATUS_OPTIONS.map((option) => (
              <FilterChip
                key={option.key}
                active={statusFilter === option.key}
                label={option.label}
                onPress={() => setStatusFilter(option.key)}
              />
            ))}
          </View>
          <Text style={styles.label}>Sort</Text>
          <View style={styles.chipRow}>
            {EMPLOYEE_REQUEST_FOLLOW_UP_SORT_OPTIONS.map((option) => (
              <FilterChip key={option.key} active={sortKey === option.key} label={option.label} onPress={() => setSortKey(option.key)} />
            ))}
          </View>
          <View style={styles.row}>
            <Pressable style={styles.secondaryBtn} onPress={resetFilters}>
              <Text style={styles.secondaryBtnText}>Reset filters</Text>
            </Pressable>
          </View>
        </ShellCard>

        <ShellCard
          title="Follow-up snapshot"
          subtitle={`total ${stats.total} | critical ${stats.critical} | watch ${stats.watch} | action ${stats.actionRequired}`}
        >
          <Text style={styles.meta}>tenant: {session.tenantId}</Text>
          <Text style={styles.meta}>actor: {session.actorId}</Text>
          <View style={styles.row}>
            <Pressable style={styles.secondaryBtn} onPress={clearDismissed}>
              <Text style={styles.secondaryBtnText}>Reset dismissed alerts</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={onOpenRequestHistory}>
              <Text style={styles.secondaryBtnText}>Open request history</Text>
            </Pressable>
          </View>
        </ShellCard>

        <ShellCard title="Action inbox" subtitle={loading ? "Loading..." : `${visibleFollowUps.length} alert(s)`}>
          {visibleFollowUps.length === 0 ? <Text style={styles.meta}>No active follow-up alerts match current filters.</Text> : null}
          {visibleFollowUps.map((item) => (
            <View key={item.id} style={styles.item}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>
                {REQUEST_TYPE_LABEL[item.requestType] ?? item.requestType} · {formatEmployeeRequestStatus(item.status)}
              </Text>
              <Text style={styles.itemMeta}>
                severity: {formatEmployeeRequestFollowUpSeverity(item.severity)} · updated: {item.updatedAt}
              </Text>
              <Text style={styles.itemBody}>{item.message}</Text>
              <Text style={styles.itemMeta}>reason: {item.reason || "-"}</Text>
              <View style={styles.actionRow}>
                {item.actions.map((action) => (
                  <Pressable key={`${item.id}-${action}`} style={actionButtonStyle(action)} onPress={() => handleFollowUpAction(item, action)}>
                    <Text style={actionTextStyle(action)}>{ACTION_LABEL[action] ?? action}</Text>
                  </Pressable>
                ))}
                <Pressable style={styles.actionBtn} onPress={() => dismissFollowUp(item.id)}>
                  <Text style={styles.actionBtnText}>Dismiss</Text>
                </Pressable>
              </View>
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
  label: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: colors.ink
  },
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
  meta: { color: colors.muted, fontSize: 12 },
  item: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: spacing.sm,
    gap: 5
  },
  itemTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  itemMeta: { color: colors.muted, fontSize: 11 },
  itemBody: { color: colors.ink, fontSize: 12 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  actionPrimary: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  actionBtnText: { color: colors.ink, fontSize: 11, fontWeight: "600" },
  actionPrimaryText: { color: colors.primary }
});
