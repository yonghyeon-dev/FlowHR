import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import ShellCard from "../components/ShellCard";
import { colors, spacing } from "../theme/tokens";

function action(label) {
  Alert.alert("Coming Soon", `${label} 화면은 WI-0253~에서 확장됩니다.`);
}

export default function AdminHomeScreen({
  session,
  onLogout,
  onOpenApprovalQueue,
  onOpenNotifications,
  onOpenNotificationHistory,
  onOpenEmailTemplates
}) {
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>관리자 홈</Text>
        <Text style={styles.subtitle}>운영 속도와 가시성을 위한 모바일 관리자 진입점입니다.</Text>

        <ShellCard title="승인 대기 큐">
          <Text style={styles.desc}>정체 항목과 우선순위 배지를 모바일에서 바로 확인합니다.</Text>
          <Pressable style={styles.btn} onPress={onOpenApprovalQueue}>
            <Text style={styles.btnText}>승인 대기 보기</Text>
          </Pressable>
        </ShellCard>

        <ShellCard title="실시간 근태 현황">
          <Text style={styles.desc}>출근/지각/미출근 스냅샷을 빠르게 점검합니다.</Text>
          <Pressable style={styles.btn} onPress={() => action("실시간 근태 현황")}>
            <Text style={styles.btnText}>근태 현황 보기</Text>
          </Pressable>
        </ShellCard>

        <ShellCard title="온보딩 마법사">
          <Text style={styles.desc}>조직/직원 초기 설정 흐름으로 연결됩니다.</Text>
          <Pressable style={styles.btn} onPress={() => action("온보딩 마법사")}>
            <Text style={styles.btnText}>온보딩 시작</Text>
          </Pressable>
        </ShellCard>

        <ShellCard title="알림 센터">
          <Text style={styles.desc}>승인/급여 상태 알림과 선호 설정을 관리합니다.</Text>
          <View style={styles.row}>
            <Pressable style={styles.btn} onPress={onOpenNotifications}>
              <Text style={styles.btnText}>알림 센터 열기</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={onOpenNotificationHistory}>
              <Text style={styles.btnText}>알림 히스토리 열기</Text>
            </Pressable>
          </View>
        </ShellCard>

        <ShellCard title="이메일 템플릿">
          <Text style={styles.desc}>거래성 메일 템플릿을 locale별로 미리봅니다.</Text>
          <Pressable style={styles.btn} onPress={onOpenEmailTemplates}>
            <Text style={styles.btnText}>템플릿 프리뷰 열기</Text>
          </Pressable>
        </ShellCard>

        <View style={styles.meta}>
          <Text style={styles.metaText}>tenant: {session.tenantId}</Text>
          <Text style={styles.metaText}>actor: {session.actorId}</Text>
        </View>

        <Pressable style={styles.logout} onPress={onLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </Pressable>
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
  desc: {
    color: colors.muted,
    lineHeight: 20,
    fontSize: 13
  },
  row: {
    gap: spacing.sm
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
  meta: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: spacing.sm,
    gap: 4
  },
  metaText: {
    color: colors.muted,
    fontSize: 12
  },
  logout: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingVertical: 10,
    alignItems: "center"
  },
  logoutText: {
    color: colors.ink,
    fontWeight: "600"
  }
});
