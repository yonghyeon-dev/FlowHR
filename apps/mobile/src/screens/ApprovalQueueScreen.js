import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import ShellCard from "../components/ShellCard";
import {
  APPROVAL_QUEUE_PRIORITY_OPTIONS,
  APPROVAL_QUEUE_SORT_OPTIONS,
  APPROVAL_QUEUE_STATUS_OPTIONS,
  applyApprovalQueueDecision,
  buildApprovalQueueStats,
  filterApprovalQueue,
  sortApprovalQueue
} from "../lib/approvalQueue";
import {
  loadApprovalQueueItems,
  resetApprovalQueueItems,
  saveApprovalQueueItems
} from "../lib/approvalQueueStore";
import { colors, spacing } from "../theme/tokens";

function Chip({ active, label, onPress }) {
  return (
    <Pressable style={[styles.chip, active ? styles.chipActive : null]} onPress={onPress}>
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

export default function ApprovalQueueScreen({ session }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortKey, setSortKey] = useState("stalledHoursDesc");

  async function refresh() {
    const loaded = await loadApprovalQueueItems();
    setItems(loaded);
  }

  useEffect(() => {
    let active = true;
    loadApprovalQueueItems()
      .then((loaded) => {
        if (!active) {
          return;
        }
        setItems(loaded);
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

  const stats = useMemo(() => buildApprovalQueueStats(items), [items]);
  const visibleItems = useMemo(
    () => sortApprovalQueue(filterApprovalQueue(items, { query, status: statusFilter, priority: priorityFilter }), sortKey),
    [items, priorityFilter, query, sortKey, statusFilter]
  );

  async function decide(item, decision) {
    const next = applyApprovalQueueDecision(items, item.id, decision);
    setItems(next);
    await saveApprovalQueueItems(next);
  }

  async function resetQueue() {
    const next = await resetApprovalQueueItems();
    setItems(next);
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Approval Queue</Text>
        <Text style={styles.subtitle}>Prioritize stalled approvals and process quick decisions on mobile.</Text>

        <ShellCard title="Search and refresh">
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search title/requester/domain"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
          <View style={styles.row}>
            <Pressable style={styles.secondaryBtn} onPress={() => setQuery("")}>
              <Text style={styles.secondaryBtnText}>Clear query</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => refresh()}>
              <Text style={styles.secondaryBtnText}>Refresh</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={resetQueue}>
              <Text style={styles.secondaryBtnText}>Reset seed</Text>
            </Pressable>
          </View>
        </ShellCard>

        <ShellCard title="Filters and sort">
          <Text style={styles.filterLabel}>Status</Text>
          <View style={styles.chipRow}>
            {APPROVAL_QUEUE_STATUS_OPTIONS.map((option) => (
              <Chip
                key={option.key}
                active={statusFilter === option.key}
                label={option.label}
                onPress={() => setStatusFilter(option.key)}
              />
            ))}
          </View>

          <Text style={styles.filterLabel}>Priority</Text>
          <View style={styles.chipRow}>
            {APPROVAL_QUEUE_PRIORITY_OPTIONS.map((option) => (
              <Chip
                key={option.key}
                active={priorityFilter === option.key}
                label={option.label}
                onPress={() => setPriorityFilter(option.key)}
              />
            ))}
          </View>

          <Text style={styles.filterLabel}>Sort</Text>
          <View style={styles.chipRow}>
            {APPROVAL_QUEUE_SORT_OPTIONS.map((option) => (
              <Chip key={option.key} active={sortKey === option.key} label={option.label} onPress={() => setSortKey(option.key)} />
            ))}
          </View>
        </ShellCard>

        <ShellCard
          title="Snapshot"
          subtitle={`total ${stats.total} | pending ${stats.pending} | high pending ${stats.highPriorityPending} | stalled 24h+ ${stats.stalledOver24h}`}
        >
          <Text style={styles.meta}>tenant: {session.tenantId}</Text>
          <Text style={styles.meta}>actor: {session.actorId}</Text>
        </ShellCard>

        <ShellCard title="Queue list" subtitle={loading ? "Loading..." : `${visibleItems.length} item(s)`}>
          {visibleItems.length === 0 ? <Text style={styles.meta}>No approval items match current filters.</Text> : null}
          {visibleItems.map((item) => (
            <View key={item.id} style={[styles.item, item.status !== "pending" ? styles.itemClosed : null]}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemBody}>requester: {item.requesterName}</Text>
              <Text style={styles.itemMeta}>
                domain {item.domain} | priority {item.priority} | stalled {item.stalledHours}h
              </Text>
              <Text style={styles.itemMeta}>submitted at {item.submittedAt}</Text>
              <Text style={styles.itemMeta}>status {item.status}{item.decidedAt ? ` | decided at ${item.decidedAt}` : ""}</Text>
              {item.status === "pending" ? (
                <View style={styles.row}>
                  <Pressable style={styles.secondaryBtn} onPress={() => decide(item, "approve")}>
                    <Text style={styles.secondaryBtnText}>Approve</Text>
                  </Pressable>
                  <Pressable style={styles.secondaryBtn} onPress={() => decide(item, "reject")}>
                    <Text style={styles.secondaryBtnText}>Reject</Text>
                  </Pressable>
                </View>
              ) : null}
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
  searchInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: colors.ink
  },
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
  filterLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" },
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
  meta: { color: colors.muted, fontSize: 12 },
  item: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: spacing.sm,
    gap: 5
  },
  itemClosed: { opacity: 0.65 },
  itemTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  itemBody: { color: colors.muted, fontSize: 13 },
  itemMeta: { color: colors.muted, fontSize: 11 }
});
