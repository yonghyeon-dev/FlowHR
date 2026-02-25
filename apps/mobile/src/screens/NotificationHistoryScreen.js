import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";

import ShellCard from "../components/ShellCard";
import { resolveNotificationCategoryLabelMap, sortNotificationsNewest } from "../lib/notificationFeed";
import {
  applyNotificationBulkAction,
  buildNotificationHistoryStats,
  filterNotificationHistory,
  formatNotificationArchiveMeta,
  getNotificationHistoryArchiveOptions,
  getNotificationHistoryCategoryOptions,
  getNotificationHistoryReadOptions,
  mergeNotificationSelection,
  pruneNotificationSelection,
  toggleNotificationArchive
} from "../lib/notificationHistory";
import { resolveMobileLocale } from "../lib/mobileLocale";
import { loadNotificationInbox, saveNotificationInbox } from "../lib/notificationStore";
import styles from "./NotificationHistoryScreen.styles";

const COPY_BY_LOCALE = {
  ko: {
    title: "알림 이력",
    subtitle: "검색, 필터, 보관, 일괄 작업으로 모바일 알림 이력을 관리합니다.",
    searchTitle: "검색",
    searchPlaceholder: "제목/본문 키워드 검색",
    clearQuery: "검색어 지우기",
    refresh: "새로고침",
    filterTitle: "필터",
    category: "분류",
    readState: "읽음 상태",
    archiveState: "보관 상태",
    resetFilters: "필터 초기화",
    snapshotTitle: "요약",
    snapshotSubtitle: "전체 {total} · 활성 {active} · 보관 {archived} · 읽지 않음 {unread}",
    tenant: "테넌트",
    actor: "액터",
    bulkTitle: "일괄 작업",
    bulkSubtitle: "선택 {selected} · 현재 목록 내 선택 {visibleSelected}",
    selectVisible: "현재 목록 전체 선택",
    clearSelection: "선택 해제",
    markReadSelected: "선택 항목 읽음 처리",
    archiveSelected: "선택 항목 보관",
    unarchiveSelected: "선택 항목 보관 해제",
    historyListTitle: "이력 목록",
    loading: "불러오는 중...",
    itemSuffix: "건",
    empty: "현재 필터 조건에 맞는 항목이 없습니다.",
    selected: "선택됨",
    select: "선택",
    archive: "보관",
    unarchive: "보관 해제"
  },
  en: {
    title: "Notification History",
    subtitle: "Search, filter, archive, and run bulk actions for mobile notifications.",
    searchTitle: "Search",
    searchPlaceholder: "Search title/body keyword",
    clearQuery: "Clear query",
    refresh: "Refresh",
    filterTitle: "Filters",
    category: "Category",
    readState: "Read state",
    archiveState: "Archive state",
    resetFilters: "Reset filters",
    snapshotTitle: "Snapshot",
    snapshotSubtitle: "total {total} · active {active} · archived {archived} · unread {unread}",
    tenant: "tenant",
    actor: "actor",
    bulkTitle: "Bulk actions",
    bulkSubtitle: "selected {selected} · visible selected {visibleSelected}",
    selectVisible: "Select visible",
    clearSelection: "Clear selection",
    markReadSelected: "Mark read selected",
    archiveSelected: "Archive selected",
    unarchiveSelected: "Unarchive selected",
    historyListTitle: "History list",
    loading: "Loading...",
    itemSuffix: "item(s)",
    empty: "No items match current filters.",
    selected: "Selected",
    select: "Select",
    archive: "Archive",
    unarchive: "Unarchive"
  }
};

function formatWithArgs(template, args) {
  return Object.entries(args).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template
  );
}

function FilterChip({ active, label, onPress }) {
  return (
    <Pressable style={[styles.chip, active ? styles.chipActive : null]} onPress={onPress}>
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

export default function NotificationHistoryScreen({ session }) {
  const locale = resolveMobileLocale();
  const copy = locale === "en" ? COPY_BY_LOCALE.en : COPY_BY_LOCALE.ko;
  const categoryLabelMap = useMemo(() => resolveNotificationCategoryLabelMap(locale), [locale]);
  const categoryOptions = useMemo(() => getNotificationHistoryCategoryOptions(locale), [locale]);
  const readOptions = useMemo(() => getNotificationHistoryReadOptions(locale), [locale]);
  const archiveOptions = useMemo(() => getNotificationHistoryArchiveOptions(locale), [locale]);

  const [loading, setLoading] = useState(true);
  const [inbox, setInbox] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [readState, setReadState] = useState("all");
  const [archiveState, setArchiveState] = useState("active");
  const [selectedIds, setSelectedIds] = useState({});

  async function refreshHistory() {
    setInbox(sortNotificationsNewest(await loadNotificationInbox(locale)));
  }

  useEffect(() => {
    let active = true;
    loadNotificationInbox(locale)
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
  }, [locale]);

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
  const selectedCount = Object.keys(selectedIds).length;
  const selectedVisibleCount = filteredHistory.filter((item) => selectedIds[item.id]).length;

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

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setReadState("all");
    setArchiveState("active");
    clearSelection();
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
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>

        <ShellCard title={copy.searchTitle}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={copy.searchPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
          <View style={styles.inlineActions}>
            <Pressable style={styles.secondaryBtn} onPress={() => setQuery("")}>
              <Text style={styles.secondaryBtnText}>{copy.clearQuery}</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => refreshHistory()}>
              <Text style={styles.secondaryBtnText}>{copy.refresh}</Text>
            </Pressable>
          </View>
        </ShellCard>

        <ShellCard title={copy.filterTitle}>
          <Text style={styles.filterLabel}>{copy.category}</Text>
          <View style={styles.chipRow}>
            {categoryOptions.map((option) => (
              <FilterChip key={option.key} active={category === option.key} label={option.label} onPress={() => setCategory(option.key)} />
            ))}
          </View>
          <Text style={styles.filterLabel}>{copy.readState}</Text>
          <View style={styles.chipRow}>
            {readOptions.map((option) => (
              <FilterChip key={option.key} active={readState === option.key} label={option.label} onPress={() => setReadState(option.key)} />
            ))}
          </View>
          <Text style={styles.filterLabel}>{copy.archiveState}</Text>
          <View style={styles.chipRow}>
            {archiveOptions.map((option) => (
              <FilterChip
                key={option.key}
                active={archiveState === option.key}
                label={option.label}
                onPress={() => setArchiveState(option.key)}
              />
            ))}
          </View>
          <View style={styles.inlineActions}>
            <Pressable style={styles.secondaryBtn} onPress={clearFilters}>
              <Text style={styles.secondaryBtnText}>{copy.resetFilters}</Text>
            </Pressable>
          </View>
        </ShellCard>

        <ShellCard
          title={copy.snapshotTitle}
          subtitle={formatWithArgs(copy.snapshotSubtitle, {
            total: stats.total,
            active: stats.active,
            archived: stats.archived,
            unread: stats.unread
          })}
        >
          <Text style={styles.meta}>{copy.tenant}: {session.tenantId}</Text>
          <Text style={styles.meta}>{copy.actor}: {session.actorId}</Text>
        </ShellCard>

        <ShellCard
          title={copy.bulkTitle}
          subtitle={formatWithArgs(copy.bulkSubtitle, {
            selected: selectedCount,
            visibleSelected: selectedVisibleCount
          })}
        >
          <View style={styles.inlineActions}>
            <Pressable style={styles.secondaryBtn} onPress={selectVisibleItems}>
              <Text style={styles.secondaryBtnText}>{copy.selectVisible}</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={clearSelection}>
              <Text style={styles.secondaryBtnText}>{copy.clearSelection}</Text>
            </Pressable>
          </View>
          <View style={styles.inlineActions}>
            <Pressable style={styles.secondaryBtn} onPress={() => applyBulkAction("markRead")}>
              <Text style={styles.secondaryBtnText}>{copy.markReadSelected}</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => applyBulkAction("archive")}>
              <Text style={styles.secondaryBtnText}>{copy.archiveSelected}</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => applyBulkAction("unarchive")}>
              <Text style={styles.secondaryBtnText}>{copy.unarchiveSelected}</Text>
            </Pressable>
          </View>
        </ShellCard>

        <ShellCard title={copy.historyListTitle} subtitle={loading ? copy.loading : `${filteredHistory.length} ${copy.itemSuffix}`}>
          {filteredHistory.length === 0 ? <Text style={styles.meta}>{copy.empty}</Text> : null}
          {filteredHistory.map((item) => (
            <View key={item.id} style={[styles.item, item.archivedAt ? styles.itemArchived : null, selectedIds[item.id] ? styles.itemSelected : null]}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Pressable style={[styles.selectBtn, selectedIds[item.id] ? styles.selectBtnActive : null]} onPress={() => toggleSelection(item.id)}>
                  <Text style={[styles.selectBtnText, selectedIds[item.id] ? styles.selectBtnTextActive : null]}>
                    {selectedIds[item.id] ? copy.selected : copy.select}
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.itemBody}>{item.body}</Text>
              <Text style={styles.itemMeta}>
                {categoryLabelMap[item.category] ?? item.category} · {item.createdAt}
              </Text>
              <Text style={styles.itemMeta}>{formatNotificationArchiveMeta(item, locale)}</Text>
              <Pressable style={styles.secondaryBtn} onPress={() => toggleArchive(item)}>
                <Text style={styles.secondaryBtnText}>{item.archivedAt ? copy.unarchive : copy.archive}</Text>
              </Pressable>
            </View>
          ))}
        </ShellCard>
      </ScrollView>
    </SafeAreaView>
  );
}
