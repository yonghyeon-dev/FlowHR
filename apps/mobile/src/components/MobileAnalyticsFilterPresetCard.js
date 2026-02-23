import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  buildMobileAnalyticsFilterPresetStats,
  parseMobileAnalyticsFilterPresetTransfer,
  resolveMobileAnalyticsFocusLabel,
  serializeMobileAnalyticsFilterPresetTransfer
} from "../lib/mobileAnalytics";
import { colors, spacing } from "../theme/tokens";
import ShellCard from "./ShellCard";

function errorMessage(code) {
  if (code === "empty_payload") {
    return "Import failed: payload is empty.";
  }
  if (code === "invalid_json") {
    return "Import failed: payload must be valid JSON.";
  }
  if (code === "unsupported_type") {
    return "Import failed: unsupported payload type.";
  }
  if (code === "unsupported_version") {
    return "Import failed: unsupported payload version.";
  }
  if (code === "invalid_state") {
    return "Import failed: state payload is missing.";
  }
  return "Import failed: invalid payload.";
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
    setStatus("Export payload generated. Copy and share this JSON.");
    setStatusTone("neutral");
  }

  async function importPayload() {
    const parsed = parseMobileAnalyticsFilterPresetTransfer(payload);
    if (!parsed.ok) {
      setStatus(errorMessage(parsed.code));
      setStatusTone("error");
      return;
    }
    try {
      await onImportPresetTransfer(parsed.state);
      setStatus(
        `Preset imported: pinned ${parsed.state.presetState.pinnedPresetKeys.length}, recent ${parsed.state.presetState.recentPresetKeys.length}.`
      );
      setStatusTone("success");
    } catch {
      setStatus("Import failed: could not persist preset state.");
      setStatusTone("error");
    }
  }

  function clearPayload() {
    setPayload("");
    setStatus("Preset transfer payload cleared.");
    setStatusTone("neutral");
  }

  return (
    <ShellCard
      title="Filter presets"
      subtitle={`active: ${filterState.periodKey} / ${resolveMobileAnalyticsFocusLabel(filterState.focus)}`}
    >
      <Text style={styles.label}>Pinned presets</Text>
      <View style={styles.chipRow}>
        {pinnedPresetStats.length === 0 ? <Text style={styles.meta}>No pinned presets yet.</Text> : null}
        {pinnedPresetStats.map((preset) => (
          <Chip
            key={`pin-${preset.key}`}
            active={false}
            label={`${preset.label} (${preset.count})`}
            onPress={() => onApplyPreset(preset.key)}
          />
        ))}
      </View>

      <Text style={styles.label}>Recent presets</Text>
      <View style={styles.chipRow}>
        {recentPresetStats.length === 0 ? <Text style={styles.meta}>No recent presets yet.</Text> : null}
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
            filter: {preset.filter.periodKey} / {resolveMobileAnalyticsFocusLabel(preset.filter.focus)}
          </Text>
          <View style={styles.row}>
            <Pressable style={styles.button} onPress={() => onApplyPreset(preset.key)}>
              <Text style={styles.buttonText}>Apply preset</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={() => onTogglePresetPin(preset.key)}>
              <Text style={styles.buttonText}>
                {presetState.pinnedPresetKeys.includes(preset.key) ? "Unpin" : "Pin"}
              </Text>
            </Pressable>
          </View>
        </View>
      ))}

      <Text style={styles.label}>Preset transfer</Text>
      <TextInput
        multiline
        numberOfLines={7}
        value={payload}
        onChangeText={setPayload}
        placeholder="Paste analytics preset transfer JSON here"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.payloadInput}
      />
      <View style={styles.row}>
        <Pressable style={styles.button} onPress={generatePayload}>
          <Text style={styles.buttonText}>Generate export payload</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={importPayload}>
          <Text style={styles.buttonText}>Import payload</Text>
        </Pressable>
      </View>
      <Pressable style={styles.button} onPress={clearPayload}>
        <Text style={styles.buttonText}>Clear payload</Text>
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
