import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import ShellCard from "../components/ShellCard";
import { colors, spacing } from "../theme/tokens";

function action(label) {
  Alert.alert("Coming Soon", `${label} 화면은 WI-0241~에서 확장됩니다.`);
}

export default function EmployeeHomeScreen({ session, onLogout }) {
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>직원 앱 셸</Text>
        <Text style={styles.subtitle}>90초 셀프서비스 여정을 모바일 홈에서 바로 시작합니다.</Text>

        <ShellCard title="출퇴근 정정">
          <Text style={styles.desc}>최근 기록 확인 후 정정 요청으로 빠르게 진입합니다.</Text>
          <Pressable style={styles.btn} onPress={() => action("출퇴근 정정")}>
            <Text style={styles.btnText}>정정 요청 시작</Text>
          </Pressable>
        </ShellCard>

        <ShellCard title="휴가 신청">
          <Text style={styles.desc}>잔여 연차와 캘린더를 함께 보며 신청 흐름으로 이동합니다.</Text>
          <Pressable style={styles.btn} onPress={() => action("휴가 신청")}>
            <Text style={styles.btnText}>휴가 신청 시작</Text>
          </Pressable>
        </ShellCard>

        <ShellCard title="명세서 확인">
          <Text style={styles.desc}>최신 확정 명세서와 수령 확인 상태를 확인합니다.</Text>
          <Pressable style={styles.btn} onPress={() => action("명세서 확인")}>
            <Text style={styles.btnText}>명세서 보기</Text>
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
