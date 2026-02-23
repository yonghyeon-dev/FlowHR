import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";

import ShellCard from "../components/ShellCard";
import { sortNotificationsNewest } from "../lib/notificationFeed";
import {
  NOTIFICATION_HISTORY_ARCHIVE_OPTIONS,
  NOTIFICATION_HISTORY_CATEGORY_OPTIONS,
  NOTIFICATION_HISTORY_READ_OPTIONS,
  applyNotificationBulkAction,
  buildNotificationHistoryStats,
  filterNotificationHistory,
  formatNotificationArchiveMeta,
  mergeNotificationSelection,
  pruneNotificationSelection,
  toggleNotificationArchive
} from "../lib/notificationHistory";
import { loadNotificationInbox, saveNotificationInbox } from "../lib/notificationStore";
import styles from "./NotificationHistoryScreen.styles";

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
  const [selectedIds, setSelectedIds] = useState({});

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

  useEffect(() => {
    setSelectedIds((current) => pruneNotificationSelection(current, inbox));
  }, [inbox]);

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

  const selectedCount = useMemo(() => Object.keys(selectedIds).length, [selectedIds]);
  const selectedVisibleCount = useMemo(
    () => filteredHistory.filter((item) => selectedIds[item.id]).length,
    [filteredHistory, selectedIds]
  );

  async function toggleArchive(item) {
    const next = toggleNotificationArchive(inbox, item.id, !item.archivedAt);
    setInbox(next);
    await saveNotificationInbox(next);
  }

  function toggleSelection(itemId) {
    setSelectedIds((current) => {
      if (current[itemId]) {
        const { [itemId]: _discard, ...rest } = current;
        return rest;
      }
      return {
        ...current,
        [itemId]: true
      };
    });
  }

  function selectVisibleItems() {
    const ids = filteredHistory.map((item) => item.id);
    setSelectedIds((current) => mergeNotificationSelection(current, ids));
  }

  function clearSelection() {
    setSelectedIds({});
  }

  async function applyBulkAction(action) {
    const targetIds = Object.keys(selectedIds);
    if (targetIds.length === 0) {
      return;
    }
    const next = applyNotificationBulkAction(inbox, targetIds, action);
    setInbox(sortNotificationsNewest(next));
    await saveNotificationInbox(next);
    clearSelection();
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Notification History</Text>
        <Text style={styles.subtitle}>Search, filter, and run bulk archive/read actions for mobile notifications.</Text>

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
            {NOTIFICATION_HISTORY_CATEGORY_OPTIONS.map((option) => (
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
            {NOTIFICATION_HISTORY_READ_OPTIONS.map((option) => (
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
            {NOTIFICATION_HISTORY_ARCHIVE_OPTIONS.map((option) => (
              <FilterChip
                key={option.key}
                active={archiveState === option.key}
                label={option.label}
                onPress={() => setArchiveState(option.key)}
              />
            ))}
          </View>
        </ShellCard>

        <ShellCard title="Snapshot" subtitle={`total ${stats.total} · active ${stats.active} · archived ${stats.archived} · unread ${stats.unread}`}>
          <Text style={styles.meta}>tenant: {session.tenantId}</Text>
          <Text style={styles.meta}>actor: {session.actorId}</Text>
        </ShellCard>

        <ShellCard title="Bulk actions" subtitle={`selected ${selectedCount} · visible selected ${selectedVisibleCount}`}>
          <View style={styles.inlineActions}>
            <Pressable style={styles.secondaryBtn} onPress={selectVisibleItems}>
              <Text style={styles.secondaryBtnText}>Select visible</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={clearSelection}>
              <Text style={styles.secondaryBtnText}>Clear selection</Text>
            </Pressable>
          </View>
          <View style={styles.inlineActions}>
            <Pressable style={styles.secondaryBtn} onPress={() => applyBulkAction("markRead")}>
              <Text style={styles.secondaryBtnText}>Mark read selected</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => applyBulkAction("archive")}>
              <Text style={styles.secondaryBtnText}>Archive selected</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => applyBulkAction("unarchive")}>
              <Text style={styles.secondaryBtnText}>Unarchive selected</Text>
            </Pressable>
          </View>
        </ShellCard>

        <ShellCard title="History list" subtitle={loading ? "Loading..." : `${filteredHistory.length} item(s)`}>
          {filteredHistory.length === 0 ? <Text style={styles.meta}>No items match current filters.</Text> : null}
          {filteredHistory.map((item) => (
            <View
              key={item.id}
              style={[
                styles.item,
                item.archivedAt ? styles.itemArchived : null,
                selectedIds[item.id] ? styles.itemSelected : null
              ]}
            >
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Pressable
                  style={[styles.selectBtn, selectedIds[item.id] ? styles.selectBtnActive : null]}
                  onPress={() => toggleSelection(item.id)}
                >
                  <Text style={[styles.selectBtnText, selectedIds[item.id] ? styles.selectBtnTextActive : null]}>
                    {selectedIds[item.id] ? "Selected" : "Select"}
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.itemBody}>{item.body}</Text>
              <Text style={styles.itemMeta}>
                {item.category} · {item.createdAt}
              </Text>
              <Text style={styles.itemMeta}>{formatNotificationArchiveMeta(item)}</Text>
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
