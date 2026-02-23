import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import ShellCard from "../components/ShellCard";
import { colors, spacing } from "../theme/tokens";

function action(label) {
  Alert.alert("Coming Soon", `${label} 화면은 WI-0255~에서 확장됩니다.`);
}

export default function EmployeeHomeScreen({
  session,
  onLogout,
  onOpenAttendanceCorrectionRequest,
  onOpenLeaveRequest,
  onOpenRequestHistory,
  onOpenRequestFollowUp,
  onOpenNotifications,
  onOpenNotificationHistory
}) {
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>직원 홈</Text>
        <Text style={styles.subtitle}>90초 셀프서비스 여정을 모바일에서 빠르게 시작합니다.</Text>

        <ShellCard title="출퇴근 정정">
          <Text style={styles.desc}>최근 기록 확인 후 정정 요청으로 빠르게 이동합니다.</Text>
          <Pressable style={styles.btn} onPress={onOpenAttendanceCorrectionRequest}>
            <Text style={styles.btnText}>정정 요청 시작</Text>
          </Pressable>
        </ShellCard>

        <ShellCard title="휴가 요청">
          <Text style={styles.desc}>잔여 연차와 캘린더를 확인하고 요청 흐름으로 이동합니다.</Text>
          <Pressable style={styles.btn} onPress={onOpenLeaveRequest}>
            <Text style={styles.btnText}>휴가 요청 시작</Text>
          </Pressable>
        </ShellCard>

        <ShellCard title="요청 이력/상태">
          <Text style={styles.desc}>제출한 정정/휴가 요청의 처리 상태와 타임라인을 추적합니다.</Text>
          <Pressable style={styles.btn} onPress={onOpenRequestHistory}>
            <Text style={styles.btnText}>요청 이력 보기</Text>
          </Pressable>
          <Pressable style={styles.btn} onPress={onOpenRequestFollowUp}>
            <Text style={styles.btnText}>요청 후속 액션 보기</Text>
          </Pressable>
        </ShellCard>

        <ShellCard title="명세서 확인">
          <Text style={styles.desc}>최신 확정 명세서와 확인 상태를 점검합니다.</Text>
          <Pressable style={styles.btn} onPress={() => action("명세서 확인")}>
            <Text style={styles.btnText}>명세서 보기</Text>
          </Pressable>
        </ShellCard>

        <ShellCard title="알림 센터">
          <Text style={styles.desc}>승인/급여 상태 알림을 모아보고, 이력 검색/보관을 관리합니다.</Text>
          <View style={styles.row}>
            <Pressable style={styles.btn} onPress={onOpenNotifications}>
              <Text style={styles.btnText}>알림 센터 열기</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={onOpenNotificationHistory}>
              <Text style={styles.btnText}>알림 히스토리 열기</Text>
            </Pressable>
          </View>
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
