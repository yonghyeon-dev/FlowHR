import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import ShellCard from "../components/ShellCard";
import { sortNotificationsNewest } from "../lib/notificationFeed";
import {
  buildNotificationHistoryStats,
  filterNotificationHistory,
  toggleNotificationArchive
} from "../lib/notificationHistory";
import { loadNotificationInbox, saveNotificationInbox } from "../lib/notificationStore";
import { colors, spacing } from "../theme/tokens";

const CATEGORY_OPTIONS = [
  { key: "all", label: "All categories" },
  { key: "approvalRequest", label: "Approval request" },
  { key: "approvalResult", label: "Approval result" },
  { key: "payslipReady", label: "Payslip ready" }
];

const READ_OPTIONS = [
  { key: "all", label: "All read states" },
  { key: "unread", label: "Unread only" },
  { key: "read", label: "Read only" }
];

const ARCHIVE_OPTIONS = [
  { key: "all", label: "All archive states" },
  { key: "active", label: "Active only" },
  { key: "archived", label: "Archived only" }
];

function formatArchiveMeta(item) {
  if (!item.archivedAt) {
    return "active";
  }
  return `archived at ${item.archivedAt}`;
}

function FilterChip({ active, label, onPress }) {
  return (
    <Pressable style={[styles.chip, active ? styles.chipActive : null]} onPress={onPress}>
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

export default function NotificationHistoryScreen({ session }) {
  const [loading, setLoading] = useState(true);
  const [inbox, setInbox] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [readState, setReadState] = useState("all");
  const [archiveState, setArchiveState] = useState("all");

  async function refreshHistory() {
    const messages = await loadNotificationInbox();
    setInbox(sortNotificationsNewest(messages));
  }

  useEffect(() => {
    let active = true;
    loadNotificationInbox()
      .then((messages) => {
        if (!active) {
          return;
        }
        setInbox(sortNotificationsNewest(messages));
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

  const stats = useMemo(() => buildNotificationHistoryStats(inbox), [inbox]);
  const filteredHistory = useMemo(
    () =>
      filterNotificationHistory(inbox, {
        query,
        category,
        readState,
        archiveState
      }),
    [archiveState, category, inbox, query, readState]
  );

  async function toggleArchive(item) {
    const next = toggleNotificationArchive(inbox, item.id, !item.archivedAt);
    setInbox(next);
    await saveNotificationInbox(next);
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Notification History</Text>
        <Text style={styles.subtitle}>Search, filter, and archive in-app notifications without bloating the live feed.</Text>

        <ShellCard title="Search">
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search title/body keyword"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
          <View style={styles.inlineActions}>
            <Pressable style={styles.secondaryBtn} onPress={() => setQuery("")}>
              <Text style={styles.secondaryBtnText}>Clear query</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => refreshHistory()}>
              <Text style={styles.secondaryBtnText}>Refresh</Text>
            </Pressable>
          </View>
        </ShellCard>

        <ShellCard title="Filters">
          <Text style={styles.filterLabel}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORY_OPTIONS.map((option) => (
              <FilterChip
                key={option.key}
                active={category === option.key}
                label={option.label}
                onPress={() => setCategory(option.key)}
              />
            ))}
          </View>
          <Text style={styles.filterLabel}>Read state</Text>
          <View style={styles.chipRow}>
            {READ_OPTIONS.map((option) => (
              <FilterChip
                key={option.key}
                active={readState === option.key}
                label={option.label}
                onPress={() => setReadState(option.key)}
              />
            ))}
          </View>
          <Text style={styles.filterLabel}>Archive state</Text>
          <View style={styles.chipRow}>
            {ARCHIVE_OPTIONS.map((option) => (
              <FilterChip
                key={option.key}
                active={archiveState === option.key}
                label={option.label}
                onPress={() => setArchiveState(option.key)}
              />
            ))}
          </View>
        </ShellCard>

        <ShellCard
          title="Snapshot"
          subtitle={`total ${stats.total} · active ${stats.active} · archived ${stats.archived} · unread ${stats.unread}`}
        >
          <Text style={styles.meta}>tenant: {session.tenantId}</Text>
          <Text style={styles.meta}>actor: {session.actorId}</Text>
        </ShellCard>

        <ShellCard title="History list" subtitle={loading ? "Loading..." : `${filteredHistory.length} item(s)`}>
          {filteredHistory.map((item) => (
            <View key={item.id} style={[styles.item, item.archivedAt ? styles.itemArchived : null]}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemBody}>{item.body}</Text>
              <Text style={styles.itemMeta}>
                {item.category} · {item.createdAt}
              </Text>
              <Text style={styles.itemMeta}>{formatArchiveMeta(item)}</Text>
              <Pressable style={styles.secondaryBtn} onPress={() => toggleArchive(item)}>
                <Text style={styles.secondaryBtnText}>{item.archivedAt ? "Unarchive" : "Archive"}</Text>
              </Pressable>
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
  inlineActions: { flexDirection: "row", gap: spacing.sm },
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
  itemArchived: {
    opacity: 0.65
  },
  itemTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  itemBody: { color: colors.muted, fontSize: 13 },
  itemMeta: { color: colors.muted, fontSize: 11 }
});

