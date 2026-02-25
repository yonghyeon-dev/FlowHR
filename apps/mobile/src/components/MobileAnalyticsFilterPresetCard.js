import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  buildMobileAnalyticsFilterPresetStats,
  parseMobileAnalyticsFilterPresetTransfer,
  resolveMobileAnalyticsFocusLabel,
  serializeMobileAnalyticsFilterPresetTransfer
} from "../lib/mobileAnalytics";
import { resolveMobileLocale } from "../lib/mobileLocale";
import { colors, spacing } from "../theme/tokens";
import ShellCard from "./ShellCard";

const COPY_BY_LOCALE = {
  ko: {
    title: "필터 프리셋",
    activePrefix: "활성",
    pinned: "고정 프리셋",
    pinnedEmpty: "아직 고정된 프리셋이 없습니다.",
    recent: "최근 프리셋",
    recentEmpty: "아직 최근 사용 프리셋이 없습니다.",
    filterMetaPrefix: "필터",
    applyPreset: "프리셋 적용",
    pin: "고정",
    unpin: "고정 해제",
    transferTitle: "프리셋 전송",
    transferPlaceholder: "분석 프리셋 전송 JSON을 여기에 붙여넣으세요",
    generateExport: "내보내기 페이로드 생성",
    importPayload: "페이로드 가져오기",
    clearPayload: "페이로드 지우기",
    statusGenerated: "내보내기 페이로드를 생성했습니다. JSON을 복사해 공유하세요.",
    statusImported: "프리셋 가져오기 완료: 고정 {pinned}, 최근 {recent}",
    statusImportPersistFailed: "프리셋 상태를 저장하지 못했습니다.",
    statusCleared: "프리셋 전송 페이로드를 비웠습니다.",
    errors: {
      empty_payload: "가져오기 실패: 페이로드가 비어 있습니다.",
      invalid_json: "가져오기 실패: 올바른 JSON 형식이 아닙니다.",
      unsupported_type: "가져오기 실패: 지원하지 않는 페이로드 유형입니다.",
      unsupported_version: "가져오기 실패: 지원하지 않는 페이로드 버전입니다.",
      invalid_state: "가져오기 실패: 상태 데이터가 누락되었습니다.",
      fallback: "가져오기 실패: 잘못된 페이로드입니다."
    }
  },
  en: {
    title: "Filter presets",
    activePrefix: "active",
    pinned: "Pinned presets",
    pinnedEmpty: "No pinned presets yet.",
    recent: "Recent presets",
    recentEmpty: "No recent presets yet.",
    filterMetaPrefix: "filter",
    applyPreset: "Apply preset",
    pin: "Pin",
    unpin: "Unpin",
    transferTitle: "Preset transfer",
    transferPlaceholder: "Paste analytics preset transfer JSON here",
    generateExport: "Generate export payload",
    importPayload: "Import payload",
    clearPayload: "Clear payload",
    statusGenerated: "Export payload generated. Copy and share this JSON.",
    statusImported: "Preset imported: pinned {pinned}, recent {recent}.",
    statusImportPersistFailed: "Import failed: could not persist preset state.",
    statusCleared: "Preset transfer payload cleared.",
    errors: {
      empty_payload: "Import failed: payload is empty.",
      invalid_json: "Import failed: payload must be valid JSON.",
      unsupported_type: "Import failed: unsupported payload type.",
      unsupported_version: "Import failed: unsupported payload version.",
      invalid_state: "Import failed: state payload is missing.",
      fallback: "Import failed: invalid payload."
    }
  }
};

function formatWithArgs(template, args) {
  return Object.entries(args).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template
  );
}

function errorMessage(code, copy) {
  if (copy.errors[code]) {
    return copy.errors[code];
  }
  return copy.errors.fallback;
}

function Chip({ active, label, onPress }) {
  return (
    <Pressable style={[styles.chip, active ? styles.chipActive : null]} onPress={onPress}>
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

export default function MobileAnalyticsFilterPresetCard({
  source,
  snapshotAt,
  filterState,
  presetState,
  onApplyPreset,
  onTogglePresetPin,
  onImportPresetTransfer
}) {
  const locale = resolveMobileLocale();
  const copy = locale === "en" ? COPY_BY_LOCALE.en : COPY_BY_LOCALE.ko;
  const [payload, setPayload] = useState("");
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState("neutral");

  const presetStats = useMemo(
    () => buildMobileAnalyticsFilterPresetStats(source, { now: snapshotAt }),
    [snapshotAt, source]
  );
  const pinnedPresetStats = useMemo(
    () =>
      presetState.pinnedPresetKeys
        .map((key) => presetStats.find((item) => item.key === key))
        .filter(Boolean),
    [presetState.pinnedPresetKeys, presetStats]
  );
  const recentPresetStats = useMemo(
    () =>
      presetState.recentPresetKeys
        .map((key) => presetStats.find((item) => item.key === key))
        .filter(Boolean),
    [presetState.recentPresetKeys, presetStats]
  );
  const exportPayload = useMemo(
    () => serializeMobileAnalyticsFilterPresetTransfer({ presetState, filterState }),
    [filterState, presetState]
  );

  function generatePayload() {
    setPayload(exportPayload);
    setStatus(copy.statusGenerated);
    setStatusTone("neutral");
  }

  async function importPayload() {
    const parsed = parseMobileAnalyticsFilterPresetTransfer(payload);
    if (!parsed.ok) {
      setStatus(errorMessage(parsed.code, copy));
      setStatusTone("error");
      return;
    }
    try {
      await onImportPresetTransfer(parsed.state);
      setStatus(
        formatWithArgs(copy.statusImported, {
          pinned: parsed.state.presetState.pinnedPresetKeys.length,
          recent: parsed.state.presetState.recentPresetKeys.length
        })
      );
      setStatusTone("success");
    } catch {
      setStatus(copy.statusImportPersistFailed);
      setStatusTone("error");
    }
  }

  function clearPayload() {
    setPayload("");
    setStatus(copy.statusCleared);
    setStatusTone("neutral");
  }

  return (
    <ShellCard
      title={copy.title}
      subtitle={`${copy.activePrefix}: ${filterState.periodKey} / ${resolveMobileAnalyticsFocusLabel(filterState.focus)}`}
    >
      <Text style={styles.label}>{copy.pinned}</Text>
      <View style={styles.chipRow}>
        {pinnedPresetStats.length === 0 ? <Text style={styles.meta}>{copy.pinnedEmpty}</Text> : null}
        {pinnedPresetStats.map((preset) => (
          <Chip
            key={`pin-${preset.key}`}
            active={false}
            label={`${preset.label} (${preset.count})`}
            onPress={() => onApplyPreset(preset.key)}
          />
        ))}
      </View>

      <Text style={styles.label}>{copy.recent}</Text>
      <View style={styles.chipRow}>
        {recentPresetStats.length === 0 ? <Text style={styles.meta}>{copy.recentEmpty}</Text> : null}
        {recentPresetStats.map((preset) => (
          <Chip
            key={`recent-${preset.key}`}
            active={false}
            label={`${preset.label} (${preset.count})`}
            onPress={() => onApplyPreset(preset.key)}
          />
        ))}
      </View>

      {presetStats.map((preset) => (
        <View key={preset.key} style={styles.item}>
          <Text style={styles.itemTitle}>
            {preset.label} ({preset.count})
          </Text>
          <Text style={styles.itemMeta}>{preset.note}</Text>
          <Text style={styles.itemMeta}>
            {copy.filterMetaPrefix}: {preset.filter.periodKey} / {resolveMobileAnalyticsFocusLabel(preset.filter.focus)}
          </Text>
          <View style={styles.row}>
            <Pressable style={styles.button} onPress={() => onApplyPreset(preset.key)}>
              <Text style={styles.buttonText}>{copy.applyPreset}</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={() => onTogglePresetPin(preset.key)}>
              <Text style={styles.buttonText}>
                {presetState.pinnedPresetKeys.includes(preset.key) ? copy.unpin : copy.pin}
              </Text>
            </Pressable>
          </View>
        </View>
      ))}

      <Text style={styles.label}>{copy.transferTitle}</Text>
      <TextInput
        multiline
        numberOfLines={7}
        value={payload}
        onChangeText={setPayload}
        placeholder={copy.transferPlaceholder}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.payloadInput}
      />
      <View style={styles.row}>
        <Pressable style={styles.button} onPress={generatePayload}>
          <Text style={styles.buttonText}>{copy.generateExport}</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={importPayload}>
          <Text style={styles.buttonText}>{copy.importPayload}</Text>
        </Pressable>
      </View>
      <Pressable style={styles.button} onPress={clearPayload}>
        <Text style={styles.buttonText}>{copy.clearPayload}</Text>
      </Pressable>
      {status ? (
        <Text style={[styles.meta, statusTone === "error" ? styles.statusError : statusTone === "success" ? styles.statusSuccess : null]}>
          {status}
        </Text>
      ) : null}
    </ShellCard>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  meta: { color: colors.muted, fontSize: 12 },
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
  item: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: spacing.sm,
    gap: 4
  },
  itemTitle: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  itemMeta: { color: colors.muted, fontSize: 11 },
  row: { flexDirection: "row", gap: spacing.sm },
  button: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingVertical: 9,
    alignItems: "center"
  },
  buttonText: { color: colors.ink, fontWeight: "600", fontSize: 12 },
  payloadInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    color: colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 120,
    textAlignVertical: "top"
  },
  statusError: { color: "#b42318" },
  statusSuccess: { color: "#027a48" }
});
