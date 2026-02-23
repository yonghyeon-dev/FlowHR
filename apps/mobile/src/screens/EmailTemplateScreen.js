import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import ShellCard from "../components/ShellCard";
import { listEmailTemplates, renderEmailTemplate } from "../lib/emailTemplates";
import {
  loadEmailTemplatePreference,
  loadEmailTemplatePreviewHistory,
  saveEmailTemplatePreference,
  saveEmailTemplatePreviewHistory
} from "../lib/emailTemplateStore";
import { colors, spacing } from "../theme/tokens";

const TEMPLATE_OPTIONS = listEmailTemplates();
const VARIABLE_FIELDS = [
  { key: "employeeName", label: "직원명" },
  { key: "organizationName", label: "조직명" },
  { key: "actionLabel", label: "업무/요청명" },
  { key: "deepLink", label: "딥링크" }
];

function emptyVariables() {
  return {
    employeeName: "",
    organizationName: "",
    actionLabel: "",
    deepLink: ""
  };
}

export default function EmailTemplateScreen({ session }) {
  const [loading, setLoading] = useState(true);
  const [templateId, setTemplateId] = useState(TEMPLATE_OPTIONS[0]?.id ?? "approval-request");
  const [locale, setLocale] = useState("ko");
  const [variables, setVariables] = useState(emptyVariables());
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([loadEmailTemplatePreference(), loadEmailTemplatePreviewHistory()])
      .then(([pref, savedHistory]) => {
        if (!active) {
          return;
        }
        setTemplateId(pref.templateId);
        setLocale(pref.locale);
        setVariables({ ...emptyVariables(), ...(pref.variables ?? {}) });
        setHistory(savedHistory);
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

  const preview = useMemo(
    () =>
      renderEmailTemplate({
        templateId,
        locale,
        variables
      }),
    [templateId, locale, variables]
  );

  async function persistPreference(next) {
    await saveEmailTemplatePreference({
      templateId: next.templateId ?? templateId,
      locale: next.locale ?? locale,
      variables: next.variables ?? variables
    });
  }

  async function selectTemplate(nextTemplateId) {
    setTemplateId(nextTemplateId);
    await persistPreference({ templateId: nextTemplateId });
  }

  async function selectLocale(nextLocale) {
    setLocale(nextLocale);
    await persistPreference({ locale: nextLocale });
  }

  async function updateVariable(key, value) {
    const nextVariables = { ...variables, [key]: value };
    setVariables(nextVariables);
    await persistPreference({ variables: nextVariables });
  }

  async function savePreview() {
    const nextHistory = [
      {
        id: `${Date.now()}`,
        templateId: preview.templateId,
        locale: preview.locale,
        subject: preview.subject,
        createdAt: new Date().toISOString()
      },
      ...history
    ].slice(0, 8);
    setHistory(nextHistory);
    await saveEmailTemplatePreviewHistory(nextHistory);
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>이메일 템플릿 프리뷰</Text>
        <Text style={styles.subtitle}>거래성 알림 메일 템플릿을 모바일에서 바로 확인하고 문구를 검증합니다.</Text>

        <ShellCard title="템플릿 선택" subtitle={loading ? "로딩 중..." : "승인/명세 템플릿 baseline"}>
          {TEMPLATE_OPTIONS.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.option, item.id === templateId ? styles.optionActive : null]}
              onPress={() => selectTemplate(item.id)}
            >
              <Text style={[styles.optionTitle, item.id === templateId ? styles.optionTitleActive : null]}>{item.title}</Text>
              <Text style={styles.optionMeta}>{item.category}</Text>
            </Pressable>
          ))}
        </ShellCard>

        <ShellCard title="언어 선택" subtitle="ko / en 전환">
          <View style={styles.localeRow}>
            {["ko", "en"].map((code) => (
              <Pressable
                key={code}
                style={[styles.localeChip, locale === code ? styles.localeChipActive : null]}
                onPress={() => selectLocale(code)}
              >
                <Text style={[styles.localeText, locale === code ? styles.localeTextActive : null]}>
                  {code.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </ShellCard>

        <ShellCard title="치환 변수 입력">
          {VARIABLE_FIELDS.map((field) => (
            <View key={field.key} style={styles.field}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                value={variables[field.key] ?? ""}
                onChangeText={(value) => updateVariable(field.key, value)}
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
          ))}
        </ShellCard>

        <ShellCard title="프리뷰 결과" subtitle={`template: ${preview.templateId} · locale: ${preview.locale}`}>
          {preview.missingVariables.length > 0 ? (
            <Text style={styles.warning}>필수 변수 누락: {preview.missingVariables.join(", ")}</Text>
          ) : null}
          <View style={styles.previewPanel}>
            <Text style={styles.previewLabel}>Subject</Text>
            <Text style={styles.previewText}>{preview.subject}</Text>
          </View>
          <View style={styles.previewPanel}>
            <Text style={styles.previewLabel}>Body</Text>
            <Text style={styles.previewText}>{preview.body}</Text>
          </View>
          <Pressable style={styles.btn} onPress={savePreview}>
            <Text style={styles.btnText}>프리뷰 저장</Text>
          </Pressable>
          <Text style={styles.meta}>tenant: {session.tenantId}</Text>
          <Text style={styles.meta}>actor: {session.actorId}</Text>
        </ShellCard>

        <ShellCard title="최근 저장 프리뷰">
          {history.length === 0 ? <Text style={styles.empty}>저장된 프리뷰가 없습니다.</Text> : null}
          {history.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <Text style={styles.historyTitle}>{item.subject}</Text>
              <Text style={styles.historyMeta}>
                {item.templateId} · {item.locale} · {item.createdAt}
              </Text>
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
  option: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: spacing.sm,
    gap: 4
  },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  optionTitleActive: { color: colors.primary },
  optionMeta: { color: colors.muted, fontSize: 11, textTransform: "uppercase" },
  localeRow: { flexDirection: "row", gap: spacing.sm },
  localeChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 8
  },
  localeChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  localeText: { color: colors.muted, fontWeight: "700" },
  localeTextActive: { color: colors.primary },
  field: { gap: 5 },
  label: { color: colors.muted, fontSize: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: "#fff",
    color: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  warning: { color: "#b21f3a", fontSize: 12, fontWeight: "600" },
  previewPanel: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: "#fff", padding: spacing.sm, gap: 5 },
  previewLabel: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  previewText: { color: colors.ink, lineHeight: 19 },
  btn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    paddingVertical: 10,
    alignItems: "center"
  },
  btnText: { color: colors.primary, fontWeight: "700" },
  meta: { color: colors.muted, fontSize: 12 },
  empty: { color: colors.muted, fontSize: 13 },
  historyItem: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: "#fff", padding: spacing.sm, gap: 4 },
  historyTitle: { color: colors.ink, fontWeight: "700", fontSize: 13 },
  historyMeta: { color: colors.muted, fontSize: 11 }
});
