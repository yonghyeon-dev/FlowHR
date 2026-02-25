import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import ShellCard from "../components/ShellCard";
import { resolveMobileLocale } from "../lib/mobileLocale";
import { colors, spacing } from "../theme/tokens";

function action(label, locale) {
  const title = locale === "ko" ? "준비 중" : "Coming Soon";
  const message =
    locale === "ko"
      ? `${label} 화면은 다음 WI에서 확장됩니다.`
      : `${label} screen will be expanded in a follow-up WI.`;
  Alert.alert(title, message);
}

const copyByLocale = {
  ko: {
    title: "직원 홈",
    subtitle: "90초 셀프서비스 여정을 모바일에서 빠르게 처리합니다.",
    attendanceCardTitle: "출퇴근 정정",
    attendanceCardDesc: "최근 기록 확인 후 정정 요청으로 즉시 이동합니다.",
    attendanceAction: "정정 요청 시작",
    leaveCardTitle: "휴가 요청",
    leaveCardDesc: "잔여 연차와 캘린더를 확인한 뒤 요청을 제출합니다.",
    leaveAction: "휴가 요청 시작",
    requestCardTitle: "요청 이력/상태",
    requestCardDesc: "제출한 요청의 처리 상태와 타임라인을 확인합니다.",
    requestHistoryAction: "요청 이력 보기",
    requestFollowUpAction: "요청 후속 조치 보기",
    payslipCardTitle: "명세서 확인",
    payslipCardDesc: "최신 명세서 수신/확인 상태를 확인합니다.",
    payslipAction: "명세서 보기",
    analyticsCardTitle: "분석 대시보드",
    analyticsCardDesc: "요청/알림 흐름 KPI를 모바일에서도 확인합니다.",
    analyticsAction: "분석 대시보드 열기",
    notificationCardTitle: "알림 센터",
    notificationCardDesc: "중요 알림을 확인하고 히스토리를 조회합니다.",
    notificationCenterAction: "알림 센터 열기",
    notificationHistoryAction: "알림 이력 열기",
    extensionsCardTitle: "셀프서비스 확장",
    extensionsCardDesc: "공지, 복리후생, 채용 화면을 웹으로 바로 연결합니다.",
    noticesAction: "공지 열기",
    benefitsAction: "복리후생 열기",
    recruitmentAction: "채용 열기",
    tenantLabel: "tenant",
    actorLabel: "actor",
    logoutAction: "로그아웃"
  },
  en: {
    title: "Employee Home",
    subtitle: "Complete 90-second self-service journeys directly on mobile.",
    attendanceCardTitle: "Attendance Correction",
    attendanceCardDesc: "Open correction request quickly from your latest record.",
    attendanceAction: "Start Correction",
    leaveCardTitle: "Leave Request",
    leaveCardDesc: "Review leave balance and calendar before submitting.",
    leaveAction: "Start Leave Request",
    requestCardTitle: "Request History / Status",
    requestCardDesc: "Track submitted requests and timeline updates.",
    requestHistoryAction: "Open Request History",
    requestFollowUpAction: "Open Follow-Up",
    payslipCardTitle: "Payslip",
    payslipCardDesc: "Check latest payslip delivery and read status.",
    payslipAction: "Open Payslip",
    analyticsCardTitle: "Analytics Dashboard",
    analyticsCardDesc: "Review request and notification KPIs on mobile.",
    analyticsAction: "Open Analytics",
    notificationCardTitle: "Notification Center",
    notificationCardDesc: "Review priority notifications and open history.",
    notificationCenterAction: "Open Notification Center",
    notificationHistoryAction: "Open Notification History",
    extensionsCardTitle: "Extended Self-Service",
    extensionsCardDesc: "Jump to notices, benefits, and recruitment on web.",
    noticesAction: "Open Notices",
    benefitsAction: "Open Benefits",
    recruitmentAction: "Open Recruitment",
    tenantLabel: "tenant",
    actorLabel: "actor",
    logoutAction: "Logout"
  }
};

export default function EmployeeHomeScreen({
  session,
  onLogout,
  onOpenAttendanceCorrectionRequest,
  onOpenLeaveRequest,
  onOpenRequestHistory,
  onOpenRequestFollowUp,
  onOpenMobileAnalytics,
  onOpenNotifications,
  onOpenNotificationHistory,
  onOpenNotices,
  onOpenBenefits,
  onOpenRecruitment
}) {
  const locale = resolveMobileLocale();
  const copy = locale === "ko" ? copyByLocale.ko : copyByLocale.en;

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>

        <ShellCard title={copy.attendanceCardTitle}>
          <Text style={styles.desc}>{copy.attendanceCardDesc}</Text>
          <Pressable style={styles.btn} onPress={onOpenAttendanceCorrectionRequest}>
            <Text style={styles.btnText}>{copy.attendanceAction}</Text>
          </Pressable>
        </ShellCard>

        <ShellCard title={copy.leaveCardTitle}>
          <Text style={styles.desc}>{copy.leaveCardDesc}</Text>
          <Pressable style={styles.btn} onPress={onOpenLeaveRequest}>
            <Text style={styles.btnText}>{copy.leaveAction}</Text>
          </Pressable>
        </ShellCard>

        <ShellCard title={copy.requestCardTitle}>
          <Text style={styles.desc}>{copy.requestCardDesc}</Text>
          <Pressable style={styles.btn} onPress={onOpenRequestHistory}>
            <Text style={styles.btnText}>{copy.requestHistoryAction}</Text>
          </Pressable>
          <Pressable style={styles.btn} onPress={onOpenRequestFollowUp}>
            <Text style={styles.btnText}>{copy.requestFollowUpAction}</Text>
          </Pressable>
        </ShellCard>

        <ShellCard title={copy.payslipCardTitle}>
          <Text style={styles.desc}>{copy.payslipCardDesc}</Text>
          <Pressable style={styles.btn} onPress={() => action(copy.payslipAction, locale)}>
            <Text style={styles.btnText}>{copy.payslipAction}</Text>
          </Pressable>
        </ShellCard>

        <ShellCard title={copy.analyticsCardTitle}>
          <Text style={styles.desc}>{copy.analyticsCardDesc}</Text>
          <Pressable style={styles.btn} onPress={onOpenMobileAnalytics}>
            <Text style={styles.btnText}>{copy.analyticsAction}</Text>
          </Pressable>
        </ShellCard>

        <ShellCard title={copy.notificationCardTitle}>
          <Text style={styles.desc}>{copy.notificationCardDesc}</Text>
          <View style={styles.row}>
            <Pressable style={styles.btn} onPress={onOpenNotifications}>
              <Text style={styles.btnText}>{copy.notificationCenterAction}</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={onOpenNotificationHistory}>
              <Text style={styles.btnText}>{copy.notificationHistoryAction}</Text>
            </Pressable>
          </View>
        </ShellCard>

        <ShellCard title={copy.extensionsCardTitle}>
          <Text style={styles.desc}>{copy.extensionsCardDesc}</Text>
          <View style={styles.row}>
            <Pressable style={styles.btn} onPress={onOpenNotices}>
              <Text style={styles.btnText}>{copy.noticesAction}</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={onOpenBenefits}>
              <Text style={styles.btnText}>{copy.benefitsAction}</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={onOpenRecruitment}>
              <Text style={styles.btnText}>{copy.recruitmentAction}</Text>
            </Pressable>
          </View>
        </ShellCard>

        <View style={styles.meta}>
          <Text style={styles.metaText}>{copy.tenantLabel}: {session.tenantId}</Text>
          <Text style={styles.metaText}>{copy.actorLabel}: {session.actorId}</Text>
        </View>

        <Pressable style={styles.logout} onPress={onLogout}>
          <Text style={styles.logoutText}>{copy.logoutAction}</Text>
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

