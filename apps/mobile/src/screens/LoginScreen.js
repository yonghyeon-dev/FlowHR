import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import ShellCard from "../components/ShellCard";
import { defaultBaseUrl } from "../lib/flowhrApi";
import { colors, spacing } from "../theme/tokens";

const ROLE_OPTIONS = [
  { label: "Employee", value: "EMPLOYEE" },
  { label: "Admin", value: "ADMIN" }
];

export default function LoginScreen({ onLogin }) {
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl());
  const [tenantId, setTenantId] = useState("ORG-DEMO");
  const [actorId, setActorId] = useState("EMP-1001");
  const [accessToken, setAccessToken] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [error, setError] = useState("");

  const roleHint = useMemo(() => {
    if (role === "ADMIN") {
      return "관리자 승인 큐, 근태 현황, 온보딩 shell로 이동합니다.";
    }
    return "직원 출퇴근, 휴가, 명세서 shell로 이동합니다.";
  }, [role]);

  async function submit() {
    if (!tenantId.trim() || !actorId.trim() || !accessToken.trim()) {
      setError("tenant, actor, token 값을 모두 입력해 주세요.");
      return;
    }
    setError("");
    await onLogin({
      role,
      baseUrl: baseUrl.trim(),
      tenantId: tenantId.trim(),
      actorId: actorId.trim(),
      accessToken: accessToken.trim()
    });
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>FLOWHR MOBILE SHELL</Text>
        <Text style={styles.title}>로그인 컨텍스트 입력</Text>
        <Text style={styles.subtitle}>
          Supabase 세션 토큰과 조직/사용자 컨텍스트를 입력하면 모바일 앱 shell을 바로 확인할 수 있습니다.
        </Text>

        <ShellCard title="Session Bootstrapping" subtitle={roleHint}>
          <View style={styles.field}>
            <Text style={styles.label}>API Base URL</Text>
            <TextInput value={baseUrl} onChangeText={setBaseUrl} autoCapitalize="none" style={styles.input} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Tenant ID</Text>
            <TextInput value={tenantId} onChangeText={setTenantId} autoCapitalize="characters" style={styles.input} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Actor ID</Text>
            <TextInput value={actorId} onChangeText={setActorId} autoCapitalize="characters" style={styles.input} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Access Token (Bearer)</Text>
            <TextInput
              value={accessToken}
              onChangeText={setAccessToken}
              autoCapitalize="none"
              secureTextEntry
              style={styles.input}
            />
          </View>
          <View style={styles.roleRow}>
            {ROLE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[styles.roleChip, role === option.value ? styles.roleChipActive : null]}
                onPress={() => setRole(option.value)}
              >
                <Text style={[styles.roleText, role === option.value ? styles.roleTextActive : null]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.submit} onPress={submit}>
            <Text style={styles.submitText}>앱 셸 시작</Text>
          </Pressable>
        </ShellCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1.1
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.ink
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20
  },
  field: {
    gap: spacing.xs
  },
  label: {
    fontSize: 12,
    color: colors.muted
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    color: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  roleRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  roleChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#fff"
  },
  roleChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  roleText: {
    color: colors.muted,
    fontWeight: "600"
  },
  roleTextActive: {
    color: colors.primary
  },
  error: {
    color: "#b21f3a",
    fontSize: 12
  },
  submit: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center"
  },
  submitText: {
    color: "#fff",
    fontWeight: "700"
  }
});
