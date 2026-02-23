import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import ShellCard from "../components/ShellCard";
import { sortNotificationsNewest } from "../lib/notificationFeed";
import {
  NOTIFICATION_HISTORY_ARCHIVE_OPTIONS,
  NOTIFICATION_HISTORY_CATEGORY_OPTIONS,
  NOTIFICATION_HISTORY_PRESET_FILTERS,
  NOTIFICATION_HISTORY_READ_OPTIONS,
  applyNotificationBulkAction,
  buildNotificationPresetCounts,
  buildNotificationHistoryStats,
  filterNotificationHistory,
  formatNotificationArchiveMeta,
  getNotificationPresetFilter,
  mergeNotificationSelection,
  pruneNotificationSelection,
  pushNotificationPresetRecent,
  toggleNotificationArchive,
  toggleNotificationPresetPin
} from "../lib/notificationHistory";
import {
  defaultNotificationHistoryPresetState,
  loadNotificationHistoryPresetState,
  loadNotificationInbox,
  saveNotificationHistoryPresetState,
  saveNotificationInbox
} from "../lib/notificationStore";
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
  const [archiveState, setArchiveState] = useState("active");
  const [activePreset, setActivePreset] = useState("allOpen");
  const [selectedIds, setSelectedIds] = useState({});
  const [presetState, setPresetState] = useState(defaultNotificationHistoryPresetState);
  async function refreshHistory() {
    const messages = await loadNotificationInbox();
    setInbox(sortNotificationsNewest(messages));
  }
  useEffect(() => {
    let active = true;
    Promise.all([loadNotificationInbox(), loadNotificationHistoryPresetState()])
      .then(([messages, savedPresetState]) => {
        if (!active) {
          return;
        }
        setInbox(sortNotificationsNewest(messages));
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
  useEffect(() => {
    setSelectedIds((current) => pruneNotificationSelection(current, inbox));
  }, [inbox]);
  const stats = useMemo(() => buildNotificationHistoryStats(inbox), [inbox]);
  const presetCounts = useMemo(() => buildNotificationPresetCounts(inbox), [inbox]);
  const presetByKey = useMemo(() => {
    const index = {};
    for (const preset of NOTIFICATION_HISTORY_PRESET_FILTERS) {
      index[preset.key] = preset;
    }
    return index;
  }, []);
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
  const pinnedPresetKeys = presetState.pinnedPresetKeys ?? [];
  const recentPresetKeys = useMemo(
    () => (presetState.recentPresetKeys ?? []).filter((key) => !pinnedPresetKeys.includes(key)),
    [presetState.recentPresetKeys, pinnedPresetKeys]
  );
  function presetLabel(presetKey) {
    const preset = presetByKey[presetKey];
    if (!preset) {
      return presetKey;
    }
    return `${preset.label} (${presetCounts[presetKey] ?? 0})`;
  }
  async function persistPresetState(nextPresetState) {
    setPresetState(nextPresetState);
    await saveNotificationHistoryPresetState(nextPresetState);
  }
  async function toggleArchive(item) {
    const next = toggleNotificationArchive(inbox, item.id, !item.archivedAt);
    setInbox(next);
    await saveNotificationInbox(next);
  }
  async function applyPreset(presetKey) {
    const preset = getNotificationPresetFilter(presetKey);
    if (!preset) {
      return;
    }
    setActivePreset(presetKey);
    setQuery(preset.query);
    setCategory(preset.category);
    setReadState(preset.readState);
    setArchiveState(preset.archiveState);
    clearSelection();
    const nextPresetState = {
      ...presetState,
      recentPresetKeys: pushNotificationPresetRecent(presetState.recentPresetKeys, presetKey).filter(
        (key) => !pinnedPresetKeys.includes(key)
      )
    };
    await persistPresetState(nextPresetState);
  }
  async function togglePresetPin(presetKey) {
    const nextPinnedPresetKeys = toggleNotificationPresetPin(pinnedPresetKeys, presetKey);
    const nextPresetState = {
      ...presetState,
      pinnedPresetKeys: nextPinnedPresetKeys,
      recentPresetKeys: (presetState.recentPresetKeys ?? []).filter((key) => !nextPinnedPresetKeys.includes(key))
    };
    await persistPresetState(nextPresetState);
  }
  function updateQuery(value) {
    setQuery(value);
    setActivePreset("custom");
  }
  function updateCategory(value) {
    setCategory(value);
    setActivePreset("custom");
  }
  function updateReadState(value) {
    setReadState(value);
    setActivePreset("custom");
  }
  function updateArchiveState(value) {
    setArchiveState(value);
    setActivePreset("custom");
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
            onChangeText={updateQuery}
            placeholder="Search title/body keyword"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
          <View style={styles.inlineActions}>
            <Pressable style={styles.secondaryBtn} onPress={() => updateQuery("")}>
              <Text style={styles.secondaryBtnText}>Clear query</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => refreshHistory()}>
              <Text style={styles.secondaryBtnText}>Refresh</Text>
            </Pressable>
          </View>
        </ShellCard>
        <ShellCard title="Quick presets" subtitle={`active preset: ${activePreset}`}>
          {NOTIFICATION_HISTORY_PRESET_FILTERS.map((preset) => {
            const pinned = pinnedPresetKeys.includes(preset.key);
            return (
              <View key={preset.key} style={styles.presetRow}>
                <FilterChip active={activePreset === preset.key} label={presetLabel(preset.key)} onPress={() => applyPreset(preset.key)} />
                <Pressable style={[styles.pinBtn, pinned ? styles.pinBtnActive : null]} onPress={() => togglePresetPin(preset.key)}>
                  <Text style={[styles.pinBtnText, pinned ? styles.pinBtnTextActive : null]}>
                    {pinned ? "Unpin" : "Pin"}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </ShellCard>
        <ShellCard title="Pinned presets" subtitle={`${pinnedPresetKeys.length} pinned`}>
          {pinnedPresetKeys.length === 0 ? <Text style={styles.meta}>No pinned presets.</Text> : null}
          <View style={styles.chipRow}>
            {pinnedPresetKeys.map((presetKey) => <FilterChip key={presetKey} active={activePreset === presetKey} label={presetLabel(presetKey)} onPress={() => applyPreset(presetKey)} />)}
          </View>
        </ShellCard>
        <ShellCard title="Recent presets" subtitle={`${recentPresetKeys.length} recent`}>
          {recentPresetKeys.length === 0 ? <Text style={styles.meta}>No recent presets.</Text> : null}
          <View style={styles.chipRow}>
            {recentPresetKeys.map((presetKey) => <FilterChip key={presetKey} active={activePreset === presetKey} label={presetLabel(presetKey)} onPress={() => applyPreset(presetKey)} />)}
          </View>
        </ShellCard>
        <ShellCard title="Filters">
          <Text style={styles.filterLabel}>Category</Text>
          <View style={styles.chipRow}>
            {NOTIFICATION_HISTORY_CATEGORY_OPTIONS.map((option) => (
              <FilterChip key={option.key} active={category === option.key} label={option.label} onPress={() => updateCategory(option.key)} />
            ))}
          </View>
          <Text style={styles.filterLabel}>Read state</Text>
          <View style={styles.chipRow}>
            {NOTIFICATION_HISTORY_READ_OPTIONS.map((option) => (
              <FilterChip key={option.key} active={readState === option.key} label={option.label} onPress={() => updateReadState(option.key)} />
            ))}
          </View>
          <Text style={styles.filterLabel}>Archive state</Text>
          <View style={styles.chipRow}>
            {NOTIFICATION_HISTORY_ARCHIVE_OPTIONS.map((option) => (
              <FilterChip key={option.key} active={archiveState === option.key} label={option.label} onPress={() => updateArchiveState(option.key)} />
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
            <View key={item.id} style={[styles.item, item.archivedAt ? styles.itemArchived : null, selectedIds[item.id] ? styles.itemSelected : null]}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Pressable style={[styles.selectBtn, selectedIds[item.id] ? styles.selectBtnActive : null]} onPress={() => toggleSelection(item.id)}>
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
