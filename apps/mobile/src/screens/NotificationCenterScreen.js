import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import ShellCard from "../components/ShellCard";
import { loadNotificationInbox, loadNotificationPreference, saveNotificationInbox, saveNotificationPreference } from "../lib/notificationStore";
import { mapFlowHrNotification, permissionLabel, registerDevicePushTokenAsync, requestPushPermissionAsync } from "../lib/notifications";
import { colors, spacing } from "../theme/tokens";

const PREFERENCE_LABEL = {
  approvalRequest: "승인 요청 알림",
  approvalResult: "승인 결과 알림",
  payslipReady: "명세서 발행 알림"
};

export default function NotificationCenterScreen({ session }) {
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState("undetermined");
  const [pushToken, setPushToken] = useState("");
  const [preference, setPreference] = useState({});
  const [inbox, setInbox] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([loadNotificationPreference(), loadNotificationInbox()])
      .then(([pref, messages]) => {
        if (!active) {
          return;
        }
        setPreference(pref);
        setInbox(messages.map(mapFlowHrNotification));
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

  const unreadCount = useMemo(() => inbox.filter((item) => !item.read).length, [inbox]);

  async function enablePush() {
    const status = await requestPushPermissionAsync();
    setPermission(status);
    if (status === "granted") {
      const token = await registerDevicePushTokenAsync();
      if (token) {
        setPushToken(token);
      }
    }
  }

  async function togglePreference(key) {
    const next = { ...preference, [key]: !preference[key] };
    setPreference(next);
    await saveNotificationPreference(next);
  }

  async function markAllRead() {
    const next = inbox.map((item) => ({ ...item, read: true }));
    setInbox(next);
    await saveNotificationInbox(next);
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>알림 센터</Text>
        <Text style={styles.subtitle}>푸시 권한, 알림 선호, 최근 알림 내역을 한 화면에서 관리합니다.</Text>

        <ShellCard title="푸시 권한 상태" subtitle={`상태: ${permissionLabel(permission)}`}>
          <Pressable style={styles.btn} onPress={enablePush}>
            <Text style={styles.btnText}>권한 요청 / 갱신</Text>
          </Pressable>
          <Text style={styles.meta}>tenant: {session.tenantId}</Text>
          <Text style={styles.meta}>actor: {session.actorId}</Text>
          {pushToken ? <Text style={styles.token}>push token: {pushToken}</Text> : null}
        </ShellCard>

        <ShellCard title="알림 선호 설정">
          {Object.entries(PREFERENCE_LABEL).map(([key, label]) => (
            <Pressable key={key} style={styles.preferenceRow} onPress={() => togglePreference(key)}>
              <Text style={styles.preferenceLabel}>{label}</Text>
              <View style={[styles.toggle, preference[key] ? styles.toggleOn : null]}>
                <Text style={[styles.toggleText, preference[key] ? styles.toggleTextOn : null]}>
                  {preference[key] ? "ON" : "OFF"}
                </Text>
              </View>
            </Pressable>
          ))}
        </ShellCard>

        <ShellCard title="최근 알림" subtitle={loading ? "로딩 중..." : `미확인 ${unreadCount}건`}>
          <Pressable style={styles.secondaryBtn} onPress={markAllRead}>
            <Text style={styles.secondaryBtnText}>모두 읽음 처리</Text>
          </Pressable>
          {inbox.map((item) => (
            <View key={item.id} style={[styles.item, item.read ? styles.itemRead : null]}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemBody}>{item.body}</Text>
              <Text style={styles.itemMeta}>
                {item.category} · {item.createdAt}
              </Text>
            </View>
          ))}
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
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.ink
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14
  },
  btn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    paddingVertical: 10,
    alignItems: "center"
  },
  btnText: {
    color: colors.primary,
    fontWeight: "700"
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingVertical: 9,
    alignItems: "center"
  },
  secondaryBtnText: {
    color: colors.ink,
    fontWeight: "600"
  },
  meta: {
    color: colors.muted,
    fontSize: 12
  },
  token: {
    color: colors.primary,
    fontSize: 12
  },
  preferenceRow: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  preferenceLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "600"
  },
  toggle: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  toggleOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  toggleText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  toggleTextOn: {
    color: colors.primary
  },
  item: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: spacing.sm,
    gap: 5
  },
  itemRead: {
    opacity: 0.65
  },
  itemTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700"
  },
  itemBody: {
    color: colors.muted,
    fontSize: 13
  },
  itemMeta: {
    color: colors.muted,
    fontSize: 11
  }
});
