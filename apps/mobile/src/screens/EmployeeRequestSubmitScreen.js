import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import ShellCard from "../components/ShellCard";
import {
  EMPLOYEE_LEAVE_UNIT_OPTIONS,
  EMPLOYEE_REQUEST_TYPE_OPTIONS,
  buildEmployeeRequestStats,
  createEmployeeRequestRecord,
  validateEmployeeRequestDraft
} from "../lib/employeeRequest";
import { submitEmployeeRequestToApi } from "../lib/employeeRequestApi";
import { loadEmployeeRequestsWithApiFallback } from "../lib/employeeRequestSync";
import { loadEmployeeRequests, saveEmployeeRequests } from "../lib/employeeRequestStore";
import { colors, spacing } from "../theme/tokens";

function ChoiceChip({ active, label, onPress }) {
  return (
    <Pressable style={[styles.chip, active ? styles.chipActive : null]} onPress={onPress}>
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

export default function EmployeeRequestSubmitScreen({
  session,
  initialRequestType = "attendanceCorrection",
  onOpenRequestHistory,
  onOpenRequestFollowUp
}) {
  const [loading, setLoading] = useState(true);
  const [requestType, setRequestType] = useState(initialRequestType);
  const [requestDate, setRequestDate] = useState(new Date().toISOString().slice(0, 10));
  const [leaveEndDate, setLeaveEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [leaveUnit, setLeaveUnit] = useState("fullDay");
  const [leaveHours, setLeaveHours] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [requests, setRequests] = useState([]);

  async function loadRecentRequests({ silent = false } = {}) {
    const { items, source } = await loadEmployeeRequestsWithApiFallback(session);
    setRequests(items);
    if (!silent) {
      setErrorMessage("");
      setStatusMessage(
        source === "api" ? "Synced request history from FlowHR API." : "Loaded request history from local cache."
      );
    }
  }

  useEffect(() => {
    setRequestType(initialRequestType);
  }, [initialRequestType]);

  useEffect(() => {
    let active = true;
    loadRecentRequests({ silent: true })
      .then(() => {
        if (!active) {
          return;
        }
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          loadEmployeeRequests().then((items) => setRequests(items));
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [session]);

  const stats = useMemo(() => buildEmployeeRequestStats(requests), [requests]);
  const isLeaveRequest = requestType === "leaveRequest";
  const draft = {
    requestType,
    requestDate,
    leaveEndDate,
    leaveUnit,
    leaveHours,
    reason,
    note
  };

  function clearForm() {
    const today = new Date().toISOString().slice(0, 10);
    setRequestDate(today);
    setLeaveEndDate(today);
    setLeaveUnit("fullDay");
    setLeaveHours("");
    setReason("");
    setNote("");
  }

  async function submitRequest() {
    const validation = validateEmployeeRequestDraft(draft);
    if (!validation.valid) {
      setErrorMessage(validation.errors.join(" "));
      setStatusMessage("");
      return;
    }
    try {
      const record = await submitEmployeeRequestToApi({ session, draft: validation.normalized });
      const next = [record, ...requests.filter((item) => item.id !== record.id)];
      setRequests(next);
      await saveEmployeeRequests(next);
      setErrorMessage("");
      setStatusMessage("Request submitted to FlowHR API.");
    } catch (error) {
      const fallbackRecord = createEmployeeRequestRecord(validation.normalized, session.actorId);
      const next = [fallbackRecord, ...requests];
      setRequests(next);
      await saveEmployeeRequests(next);
      setErrorMessage(error instanceof Error ? `${error.message} (saved locally)` : "API submit failed (saved locally)");
      setStatusMessage("");
    }
    clearForm();
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Request Submit</Text>
        <Text style={styles.subtitle}>Submit attendance correction or leave requests from mobile self-service.</Text>

        <ShellCard title="Request type">
          <View style={styles.chipRow}>
            {EMPLOYEE_REQUEST_TYPE_OPTIONS.map((option) => (
              <ChoiceChip
                key={option.key}
                active={requestType === option.key}
                label={option.label}
                onPress={() => setRequestType(option.key)}
              />
            ))}
          </View>
        </ShellCard>

        <ShellCard title="Request form">
          <Text style={styles.label}>Request date (YYYY-MM-DD)</Text>
          <TextInput value={requestDate} onChangeText={setRequestDate} autoCapitalize="none" autoCorrect={false} style={styles.input} />

          {isLeaveRequest ? (
            <>
              <Text style={styles.label}>Leave end date (YYYY-MM-DD)</Text>
              <TextInput value={leaveEndDate} onChangeText={setLeaveEndDate} autoCapitalize="none" autoCorrect={false} style={styles.input} />

              <Text style={styles.label}>Leave unit</Text>
              <View style={styles.chipRow}>
                {EMPLOYEE_LEAVE_UNIT_OPTIONS.map((option) => (
                  <ChoiceChip
                    key={option.key}
                    active={leaveUnit === option.key}
                    label={option.label}
                    onPress={() => setLeaveUnit(option.key)}
                  />
                ))}
              </View>

              {leaveUnit === "hourly" ? (
                <>
                  <Text style={styles.label}>Leave hours</Text>
                  <TextInput
                    value={leaveHours}
                    onChangeText={setLeaveHours}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="decimal-pad"
                    style={styles.input}
                    placeholder="e.g. 2.5"
                  />
                </>
              ) : null}
            </>
          ) : null}

          <Text style={styles.label}>Reason</Text>
          <TextInput value={reason} onChangeText={setReason} autoCapitalize="sentences" autoCorrect={false} style={styles.input} />

          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            autoCapitalize="sentences"
            autoCorrect={false}
            multiline
            numberOfLines={4}
            style={[styles.input, styles.textArea]}
          />

          <View style={styles.row}>
            <Pressable style={styles.secondaryBtn} onPress={clearForm}>
              <Text style={styles.secondaryBtnText}>Clear form</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={submitRequest}>
              <Text style={styles.primaryBtnText}>Submit request</Text>
            </Pressable>
          </View>
          <View style={styles.row}>
            <Pressable style={styles.secondaryBtn} onPress={onOpenRequestHistory}>
              <Text style={styles.secondaryBtnText}>Open request history</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={onOpenRequestFollowUp}>
              <Text style={styles.secondaryBtnText}>Open follow-up inbox</Text>
            </Pressable>
          </View>
          <View style={styles.row}>
            <Pressable style={styles.secondaryBtn} onPress={() => loadRecentRequests()}>
              <Text style={styles.secondaryBtnText}>Sync API history</Text>
            </Pressable>
          </View>

          {statusMessage ? <Text style={styles.success}>{statusMessage}</Text> : null}
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        </ShellCard>

        <ShellCard
          title="Snapshot"
          subtitle={`total ${stats.total} | submitted ${stats.submitted} | attendance ${stats.attendanceCorrection} | leave ${stats.leaveRequest}`}
        >
          <Text style={styles.meta}>tenant: {session.tenantId}</Text>
          <Text style={styles.meta}>actor: {session.actorId}</Text>
        </ShellCard>

        <ShellCard title="Recent requests" subtitle={loading ? "Loading..." : `${requests.length} item(s)`}>
          {requests.length === 0 ? <Text style={styles.meta}>No requests submitted yet.</Text> : null}
          {requests.map((item) => (
            <View key={item.id} style={styles.item}>
              <Text style={styles.itemTitle}>{item.requestType === "leaveRequest" ? "Leave request" : "Attendance correction"}</Text>
              <Text style={styles.itemMeta}>request date {item.requestDate}</Text>
              {item.requestType === "leaveRequest" ? (
                <Text style={styles.itemMeta}>
                  leave {item.requestDate} ~ {item.leaveEndDate} | {item.leaveUnit}{item.leaveHours ? ` (${item.leaveHours}h)` : ""}
                </Text>
              ) : null}
              <Text style={styles.itemMeta}>reason: {item.reason}</Text>
              <Text style={styles.itemMeta}>status: {item.status}</Text>
              <Text style={styles.itemMeta}>created at {item.createdAt}</Text>
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
  textArea: {
    minHeight: 92,
    textAlignVertical: "top"
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
  primaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    paddingVertical: 9,
    alignItems: "center"
  },
  primaryBtnText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
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
  success: { color: "#027a48", fontSize: 12 },
  error: { color: "#b42318", fontSize: 12 },
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
