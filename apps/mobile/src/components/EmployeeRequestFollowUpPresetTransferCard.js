import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  parseEmployeeRequestFollowUpPresetState,
  serializeEmployeeRequestFollowUpPresetState
} from "../lib/employeeRequest";
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

export default function EmployeeRequestFollowUpPresetTransferCard({ presetState, onImportPresetState }) {
  const [payload, setPayload] = useState("");
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState("neutral");
  const exportPayload = useMemo(() => serializeEmployeeRequestFollowUpPresetState(presetState), [presetState]);

  function generatePayload() {
    setPayload(exportPayload);
    setStatus("Export payload generated. Copy and share this JSON.");
    setStatusTone("neutral");
  }

  async function importPayload() {
    const parsed = parseEmployeeRequestFollowUpPresetState(payload);
    if (!parsed.ok) {
      setStatus(errorMessage(parsed.code));
      setStatusTone("error");
      return;
    }
    try {
      await onImportPresetState(parsed.state);
      setStatus(`Preset imported: pinned ${parsed.state.pinnedPresetKeys.length}, recent ${parsed.state.recentPresetKeys.length}.`);
      setStatusTone("success");
    } catch {
      setStatus("Import failed: could not persist preset state.");
      setStatusTone("error");
    }
  }

  function clearPayload() {
    setPayload("");
    setStatus("Transfer payload cleared.");
    setStatusTone("neutral");
  }

  return (
    <ShellCard title="Follow-up preset transfer" subtitle="Import/export pinned and recent follow-up presets">
      <Text style={styles.meta}>Generate payload to share current follow-up preset state, or paste payload JSON to import.</Text>
      <TextInput
        multiline
        numberOfLines={7}
        value={payload}
        onChangeText={setPayload}
        placeholder="Paste follow-up preset transfer JSON here"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.payloadInput}
      />
      <View style={styles.actions}>
        <Pressable style={styles.button} onPress={generatePayload}>
          <Text style={styles.buttonText}>Generate export payload</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={importPayload}>
          <Text style={styles.buttonText}>Import payload</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={clearPayload}>
          <Text style={styles.buttonText}>Clear payload</Text>
        </Pressable>
      </View>
      {status ? (
        <Text style={[styles.status, statusTone === "error" ? styles.statusError : statusTone === "success" ? styles.statusSuccess : null]}>
          {status}
        </Text>
      ) : null}
    </ShellCard>
  );
}

const styles = StyleSheet.create({
  meta: {
    color: colors.muted,
    fontSize: 12
  },
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
  actions: {
    gap: spacing.sm
  },
  button: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingVertical: 9,
    alignItems: "center"
  },
  buttonText: {
    color: colors.ink,
    fontWeight: "600",
    fontSize: 12
  },
  status: {
    color: colors.muted,
    fontSize: 12
  },
  statusError: {
    color: "#b42318"
  },
  statusSuccess: {
    color: "#027a48"
  }
});
