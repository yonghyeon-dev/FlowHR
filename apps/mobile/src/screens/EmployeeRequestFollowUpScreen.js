import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import EmployeeRequestFollowUpPresetTransferCard from "../components/EmployeeRequestFollowUpPresetTransferCard";
import ShellCard from "../components/ShellCard";
import {
  EMPLOYEE_REQUEST_FOLLOW_UP_BUNDLE_PRESET_OPTIONS,
  EMPLOYEE_REQUEST_FOLLOW_UP_SEVERITY_OPTIONS,
  EMPLOYEE_REQUEST_FOLLOW_UP_SORT_OPTIONS,
  EMPLOYEE_REQUEST_FOLLOW_UP_TEMPLATE_OPTIONS,
  EMPLOYEE_REQUEST_STATUS_OPTIONS,
  applyEmployeeRequestStatus,
  buildEmployeeRequestFollowUpBundleStats,
  buildEmployeeRequestFollowUpStats,
  buildEmployeeRequestFollowUps,
  buildEmployeeRequestFollowUpTemplateStats,
  filterEmployeeRequestFollowUps,
  formatEmployeeRequestFollowUpSeverity,
  formatEmployeeRequestStatus,
  getEmployeeRequestFollowUpBundlePreset,
  pushEmployeeRequestFollowUpPresetRecent,
  recommendEmployeeRequestFollowUpTemplate,
  resolveEmployeeRequestFollowUpFilterFromPreset,
  sortEmployeeRequestFollowUps,
  toggleEmployeeRequestFollowUpPresetPin
} from "../lib/employeeRequest";
import {
  loadEmployeeRequestFollowUpPresetState,
  loadEmployeeRequests,
  saveEmployeeRequestFollowUpPresetState,
  saveEmployeeRequests
} from "../lib/employeeRequestStore";
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
  const [presetState, setPresetState] = useState({
    pinnedPresetKeys: [],
    recentPresetKeys: []
  });

  async function refreshRequests() {
    const items = await loadEmployeeRequests();
    setRequests(items);
  }

  useEffect(() => {
    let active = true;
    Promise.all([loadEmployeeRequests(), loadEmployeeRequestFollowUpPresetState()])
      .then(([items, preset]) => {
        if (!active) {
          return;
        }
        setRequests(items);
        setPresetState(preset);
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

  const followUps = useMemo(() => {
    return buildEmployeeRequestFollowUps(requests).filter((item) => !dismissedMap[item.id]);
  }, [dismissedMap, requests]);

  const stats = useMemo(() => buildEmployeeRequestFollowUpStats(followUps), [followUps]);
  const templateStats = useMemo(() => buildEmployeeRequestFollowUpTemplateStats(followUps), [followUps]);
  const bundleStats = useMemo(() => buildEmployeeRequestFollowUpBundleStats(followUps), [followUps]);
  const pinnedBundleStats = useMemo(() => {
    return presetState.pinnedPresetKeys
      .map((key) => bundleStats.find((item) => item.key === key))
      .filter(Boolean);
  }, [bundleStats, presetState.pinnedPresetKeys]);
  const recentBundleStats = useMemo(() => {
    return presetState.recentPresetKeys
      .map((key) => bundleStats.find((item) => item.key === key))
      .filter(Boolean);
  }, [bundleStats, presetState.recentPresetKeys]);

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

  async function applyBundlePreset(presetKey) {
    const filter = resolveEmployeeRequestFollowUpFilterFromPreset(presetKey, {
      severity: severityFilter,
      status: statusFilter,
      sortKey,
      query
    });
    setSeverityFilter(filter.severity);
    setStatusFilter(filter.status);
    setSortKey(filter.sortKey);
    setQuery(filter.query);

    const nextRecent = pushEmployeeRequestFollowUpPresetRecent(presetState.recentPresetKeys, presetKey).filter(
      (key) => !presetState.pinnedPresetKeys.includes(key)
    );
    const nextState = {
      pinnedPresetKeys: presetState.pinnedPresetKeys,
      recentPresetKeys: nextRecent
    };
    setPresetState(nextState);
    await saveEmployeeRequestFollowUpPresetState(nextState);
  }

  async function toggleBundlePin(presetKey) {
    const nextPinned = toggleEmployeeRequestFollowUpPresetPin(presetState.pinnedPresetKeys, presetKey);
    const nextState = {
      pinnedPresetKeys: nextPinned,
      recentPresetKeys: presetState.recentPresetKeys.filter((key) => !nextPinned.includes(key))
    };
    setPresetState(nextState);
    await saveEmployeeRequestFollowUpPresetState(nextState);
  }

  async function importBundlePresetState(nextState) {
    const saved = await saveEmployeeRequestFollowUpPresetState(nextState);
    setPresetState(saved);
  }

  async function runBundleQuickAction(presetKey) {
    const preset = getEmployeeRequestFollowUpBundlePreset(presetKey);
    if (!preset?.quickAction) {
      return;
    }
    const filter = resolveEmployeeRequestFollowUpFilterFromPreset(presetKey);
    const scoped = sortEmployeeRequestFollowUps(
      filterEmployeeRequestFollowUps(followUps, {
        severity: filter.severity,
        status: filter.status,
        query: filter.query
      }),
      filter.sortKey
    );
    const target = scoped[0];
    if (!target) {
      return;
    }
    await handleFollowUpAction(target, preset.quickAction);
  }

  async function applyTemplateActionToFirst(templateKey, actionType = "primary") {
    const target = visibleFollowUps.find((item) => recommendEmployeeRequestFollowUpTemplate(item).key === templateKey);
    if (!target) {
      return;
    }
    const template = recommendEmployeeRequestFollowUpTemplate(target);
    const action = actionType === "secondary" ? template.secondaryAction : template.primaryAction;
    if (!action) {
      return;
    }
    await handleFollowUpAction(target, action);
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

        <ShellCard title="Severity filter">
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

        <ShellCard title="Action bundle presets" subtitle="Apply saved follow-up bundles and run quick actions.">
          <Text style={styles.label}>Pinned presets</Text>
          <View style={styles.chipRow}>
            {pinnedBundleStats.length === 0 ? <Text style={styles.meta}>No pinned presets yet.</Text> : null}
            {pinnedBundleStats.map((preset) => (
              <FilterChip
                key={`pin-${preset.key}`}
                active={false}
                label={`${preset.label} (${preset.count})`}
                onPress={() => applyBundlePreset(preset.key)}
              />
            ))}
          </View>

          <Text style={styles.label}>Recent presets</Text>
          <View style={styles.chipRow}>
            {recentBundleStats.length === 0 ? <Text style={styles.meta}>No recent presets yet.</Text> : null}
            {recentBundleStats.map((preset) => (
              <FilterChip
                key={`recent-${preset.key}`}
                active={false}
                label={`${preset.label} (${preset.count})`}
                onPress={() => applyBundlePreset(preset.key)}
              />
            ))}
          </View>

          {bundleStats.map((preset) => (
            <View key={preset.key} style={styles.bundleItem}>
              <Text style={styles.templateTitle}>
                {preset.label} ({preset.count})
              </Text>
              <Text style={styles.templateMeta}>{preset.note}</Text>
              <Text style={styles.templateMeta}>
                filter: {preset.filter.severity} / {preset.filter.status} / {preset.filter.sortKey}
              </Text>
              <View style={styles.actionRow}>
                <Pressable style={styles.actionBtn} onPress={() => applyBundlePreset(preset.key)}>
                  <Text style={styles.actionBtnText}>Apply preset</Text>
                </Pressable>
                <Pressable
                  style={[
                    preset.quickAction ? actionButtonStyle(preset.quickAction) : styles.actionBtn,
                    !preset.quickAction || preset.count === 0 ? styles.actionDisabled : null
                  ]}
                  onPress={() => runBundleQuickAction(preset.key)}
                  disabled={!preset.quickAction || preset.count === 0}
                >
                  <Text style={preset.quickAction ? actionTextStyle(preset.quickAction) : styles.actionBtnText}>
                    {preset.quickAction ? `Run ${ACTION_LABEL[preset.quickAction]}` : "No quick action"}
                  </Text>
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={() => toggleBundlePin(preset.key)}>
                  <Text style={styles.actionBtnText}>
                    {presetState.pinnedPresetKeys.includes(preset.key) ? "Unpin" : "Pin"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
          <Text style={styles.meta}>preset catalog size: {EMPLOYEE_REQUEST_FOLLOW_UP_BUNDLE_PRESET_OPTIONS.length}</Text>
        </ShellCard>

        <EmployeeRequestFollowUpPresetTransferCard
          presetState={presetState}
          onImportPresetState={importBundlePresetState}
        />

        <ShellCard title="Recommendation templates">
          {templateStats
            .filter((template) => template.count > 0)
            .map((template) => (
              <View key={template.key} style={styles.templateItem}>
                <Text style={styles.templateTitle}>
                  {template.label} ({template.count})
                </Text>
                <Text style={styles.templateMeta}>{template.note}</Text>
                <View style={styles.actionRow}>
                  <Pressable style={actionButtonStyle(template.primaryAction)} onPress={() => applyTemplateActionToFirst(template.key, "primary")}>
                    <Text style={actionTextStyle(template.primaryAction)}>{ACTION_LABEL[template.primaryAction]}</Text>
                  </Pressable>
                  {template.secondaryAction ? (
                    <Pressable style={styles.actionBtn} onPress={() => applyTemplateActionToFirst(template.key, "secondary")}>
                      <Text style={styles.actionBtnText}>{ACTION_LABEL[template.secondaryAction]}</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ))}
          {templateStats.every((template) => template.count === 0) ? (
            <Text style={styles.meta}>No recommendation templates are active.</Text>
          ) : null}
          <Text style={styles.meta}>catalog size: {EMPLOYEE_REQUEST_FOLLOW_UP_TEMPLATE_OPTIONS.length}</Text>
        </ShellCard>

        <ShellCard title="Action inbox" subtitle={loading ? "Loading..." : `${visibleFollowUps.length} alert(s)`}>
          {visibleFollowUps.length === 0 ? <Text style={styles.meta}>No active follow-up alerts match current filters.</Text> : null}
          {visibleFollowUps.map((item) => {
            const template = recommendEmployeeRequestFollowUpTemplate(item);
            return (
              <View key={item.id} style={styles.item}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemMeta}>
                  {REQUEST_TYPE_LABEL[item.requestType] ?? item.requestType} · {formatEmployeeRequestStatus(item.status)}
                </Text>
                <Text style={styles.itemMeta}>
                  severity: {formatEmployeeRequestFollowUpSeverity(item.severity)} · updated: {item.updatedAt}
                </Text>
                <Text style={styles.itemMeta}>recommended template: {template.label}</Text>
                <Text style={styles.itemBody}>{item.message}</Text>
                <Text style={styles.itemMeta}>reason: {item.reason || "-"}</Text>
                <View style={styles.actionRow}>
                  <Pressable
                    style={actionButtonStyle(template.primaryAction)}
                    onPress={() => handleFollowUpAction(item, template.primaryAction)}
                  >
                    <Text style={actionTextStyle(template.primaryAction)}>{ACTION_LABEL[template.primaryAction]}</Text>
                  </Pressable>
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
            );
          })}
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
  templateItem: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: spacing.sm,
    gap: 5
  },
  templateTitle: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  templateMeta: { color: colors.muted, fontSize: 11 },
  bundleItem: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: spacing.sm,
    gap: 5
  },
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
  actionDisabled: { opacity: 0.5 },
  actionBtnText: { color: colors.ink, fontSize: 11, fontWeight: "600" },
  actionPrimaryText: { color: colors.primary }
});
