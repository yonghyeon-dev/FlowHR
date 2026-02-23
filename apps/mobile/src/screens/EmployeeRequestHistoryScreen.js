import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import ShellCard from "../components/ShellCard";
import {
  EMPLOYEE_REQUEST_SORT_OPTIONS,
  EMPLOYEE_REQUEST_STATUS_OPTIONS,
  EMPLOYEE_REQUEST_TYPE_OPTIONS,
  applyEmployeeRequestStatus,
  buildEmployeeRequestStats,
  filterEmployeeRequests,
  formatEmployeeRequestStatus,
  sortEmployeeRequests
} from "../lib/employeeRequest";
import { loadEmployeeRequests, saveEmployeeRequests } from "../lib/employeeRequestStore";
import { colors, spacing } from "../theme/tokens";

const REQUEST_TYPE_FILTER_OPTIONS = [{ key: "all", label: "All request types" }, ...EMPLOYEE_REQUEST_TYPE_OPTIONS];

const STATUS_ACTIONS = {
  submitted: ["inReview", "canceled"],
  inReview: ["approved", "rejected"],
  rejected: ["inReview"],
  canceled: ["inReview"],
  approved: []
};

function FilterChip({ active, label, onPress }) {
  return (
    <Pressable style={[styles.chip, active ? styles.chipActive : null]} onPress={onPress}>
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

export default function EmployeeRequestHistoryScreen({ session }) {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [query, setQuery] = useState("");
  const [requestTypeFilter, setRequestTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("newest");

  async function refreshHistory() {
    const items = await loadEmployeeRequests();
    setRequests(items);
  }

  useEffect(() => {
    let active = true;
    loadEmployeeRequests()
      .then((items) => {
        if (!active) {
          return;
        }
        setRequests(items);
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

  const stats = useMemo(() => buildEmployeeRequestStats(requests), [requests]);
  const visibleRequests = useMemo(
    () => sortEmployeeRequests(filterEmployeeRequests(requests, { requestType: requestTypeFilter, status: statusFilter, query }), sortKey),
    [query, requestTypeFilter, requests, sortKey, statusFilter]
  );

  async function transitionStatus(item, nextStatus) {
    const next = applyEmployeeRequestStatus(requests, item.id, nextStatus);
    setRequests(next);
    await saveEmployeeRequests(next);
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Request History</Text>
        <Text style={styles.subtitle}>Track request history with status filters and timeline updates.</Text>

        <ShellCard title="Search">
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Search reason or note"
            style={styles.input}
          />
          <View style={styles.row}>
            <Pressable style={styles.secondaryBtn} onPress={() => setQuery("")}>
              <Text style={styles.secondaryBtnText}>Clear query</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => refreshHistory()}>
              <Text style={styles.secondaryBtnText}>Refresh</Text>
            </Pressable>
          </View>
        </ShellCard>

        <ShellCard title="Filters and sort">
          <Text style={styles.label}>Request type</Text>
          <View style={styles.chipRow}>
            {REQUEST_TYPE_FILTER_OPTIONS.map((option) => (
              <FilterChip
                key={option.key}
                active={requestTypeFilter === option.key}
                label={option.label}
                onPress={() => setRequestTypeFilter(option.key)}
              />
            ))}
          </View>

          <Text style={styles.label}>Status</Text>
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
            {EMPLOYEE_REQUEST_SORT_OPTIONS.map((option) => (
              <FilterChip key={option.key} active={sortKey === option.key} label={option.label} onPress={() => setSortKey(option.key)} />
            ))}
          </View>
        </ShellCard>

        <ShellCard
          title="Snapshot"
          subtitle={`total ${stats.total} | submitted ${stats.submitted} | review ${stats.inReview} | approved ${stats.approved} | rejected ${stats.rejected}`}
        >
          <Text style={styles.meta}>tenant: {session.tenantId}</Text>
          <Text style={styles.meta}>actor: {session.actorId}</Text>
        </ShellCard>

        <ShellCard title="Request timeline" subtitle={loading ? "Loading..." : `${visibleRequests.length} item(s)`}>
          {visibleRequests.length === 0 ? <Text style={styles.meta}>No request history matches current filters.</Text> : null}
          {visibleRequests.map((item) => (
            <View key={item.id} style={styles.item}>
              <Text style={styles.itemTitle}>{item.requestType === "leaveRequest" ? "Leave request" : "Attendance correction"}</Text>
              <Text style={styles.itemMeta}>status: {formatEmployeeRequestStatus(item.status)}</Text>
              <Text style={styles.itemMeta}>request date: {item.requestDate}</Text>
              {item.requestType === "leaveRequest" ? (
                <Text style={styles.itemMeta}>
                  leave: {item.requestDate} ~ {item.leaveEndDate} | {item.leaveUnit}{item.leaveHours ? ` (${item.leaveHours}h)` : ""}
                </Text>
              ) : null}
              <Text style={styles.itemMeta}>reason: {item.reason}</Text>
              <Text style={styles.itemMeta}>created at: {item.createdAt}</Text>
              <Text style={styles.itemMeta}>
                timeline: {(item.statusTimeline ?? []).map((entry) => `${formatEmployeeRequestStatus(entry.status)} @ ${entry.at}`).join(" -> ")}
              </Text>
              <View style={styles.row}>
                {(STATUS_ACTIONS[item.status] ?? []).map((nextStatus) => (
                  <Pressable key={nextStatus} style={styles.secondaryBtn} onPress={() => transitionStatus(item, nextStatus)}>
                    <Text style={styles.secondaryBtnText}>Mark {formatEmployeeRequestStatus(nextStatus)}</Text>
                  </Pressable>
                ))}
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
  row: { flexDirection: "row", gap: spacing.sm },
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
  itemMeta: { color: colors.muted, fontSize: 11 }
});
