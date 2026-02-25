import { useEffect, useMemo, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Linking, StyleSheet, Text, View } from "react-native";

import ApprovalQueueScreen from "../screens/ApprovalQueueScreen";
import AdminHomeScreen from "../screens/AdminHomeScreen";
import EmailTemplateScreen from "../screens/EmailTemplateScreen";
import EmployeeHomeScreen from "../screens/EmployeeHomeScreen";
import EmployeeRequestFollowUpScreen from "../screens/EmployeeRequestFollowUpScreen";
import EmployeeRequestHistoryScreen from "../screens/EmployeeRequestHistoryScreen";
import EmployeeRequestSubmitScreen from "../screens/EmployeeRequestSubmitScreen";
import LoginScreen from "../screens/LoginScreen";
import MobileAnalyticsDashboardScreen from "../screens/MobileAnalyticsDashboardScreen";
import NotificationCenterScreen from "../screens/NotificationCenterScreen";
import NotificationHistoryScreen from "../screens/NotificationHistoryScreen";
import { resolveMobileLocale } from "../lib/mobileLocale";
import { clearSession, loadSession, saveSession } from "../lib/sessionStore";
import { colors } from "../theme/tokens";

const Stack = createNativeStackNavigator();
const copy = {
  ko: {
    splashTitle: "FlowHR 모바일",
    splashSub: "앱 셸을 불러오는 중...",
    titles: {
      adminHome: "관리자 홈",
      approvalQueue: "승인 대기 큐",
      employeeHome: "직원 홈",
      requestFollowUp: "요청 후속 조치",
      requestHistory: "요청 이력",
      requestSubmit: "요청 제출",
      analytics: "모바일 분석 대시보드",
      notificationCenter: "알림 센터",
      notificationHistory: "알림 이력",
      emailTemplates: "이메일 템플릿"
    }
  },
  en: {
    splashTitle: "FlowHR Mobile",
    splashSub: "Loading app shell...",
    titles: {
      adminHome: "Admin Home",
      approvalQueue: "Approval Queue",
      employeeHome: "Employee Home",
      requestFollowUp: "Request Follow-Up",
      requestHistory: "Request History",
      requestSubmit: "Request Submit",
      analytics: "Analytics Dashboard",
      notificationCenter: "Notification Center",
      notificationHistory: "Notification History",
      emailTemplates: "Email Templates"
    }
  }
};

function resolveMobileWebUrl(pathname) {
  const base = (process.env.EXPO_PUBLIC_FLOWHR_WEB_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${path}`;
}

export default function RootNavigator() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const locale = resolveMobileLocale();
  const appCopy = locale === "ko" ? copy.ko : copy.en;

  useEffect(() => {
    let active = true;
    loadSession()
      .then((stored) => {
        if (active) {
          setSession(stored);
          setLoading(false);
        }
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

  const actions = useMemo(
    () => ({
      async login(nextSession) {
        const saved = await saveSession(nextSession);
        setSession(saved);
      },
      async logout() {
        await clearSession();
        setSession(null);
      }
    }),
    []
  );

  if (loading) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashTitle}>{appCopy.splashTitle}</Text>
        <Text style={styles.splashSub}>{appCopy.splashSub}</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!session ? (
          <Stack.Screen name="Login" options={{ headerShown: false }}>
            {() => <LoginScreen onLogin={actions.login} />}
          </Stack.Screen>
        ) : null}
        {session?.role === "ADMIN" ? (
          <Stack.Screen name="AdminHome" options={{ title: appCopy.titles.adminHome }}>
            {({ navigation }) => (
              <AdminHomeScreen
                session={session}
                onLogout={actions.logout}
                onOpenApprovalQueue={() => navigation.navigate("ApprovalQueue")}
                onOpenMobileAnalytics={() => navigation.navigate("MobileAnalyticsDashboard")}
                onOpenNotifications={() => navigation.navigate("Notifications")}
                onOpenNotificationHistory={() => navigation.navigate("NotificationHistory")}
                onOpenEmailTemplates={() => navigation.navigate("EmailTemplates")}
              />
            )}
          </Stack.Screen>
        ) : null}
        {session?.role === "ADMIN" ? (
          <Stack.Screen name="ApprovalQueue" options={{ title: appCopy.titles.approvalQueue }}>
            {() => <ApprovalQueueScreen session={session} />}
          </Stack.Screen>
        ) : null}
        {session?.role === "EMPLOYEE" ? (
          <Stack.Screen name="EmployeeHome" options={{ title: appCopy.titles.employeeHome }}>
            {({ navigation }) => (
              <EmployeeHomeScreen
                session={session}
                onLogout={actions.logout}
                onOpenAttendanceCorrectionRequest={() =>
                  navigation.navigate("EmployeeRequestSubmit", { requestType: "attendanceCorrection" })
                }
                onOpenLeaveRequest={() =>
                  navigation.navigate("EmployeeRequestSubmit", { requestType: "leaveRequest" })
                }
                onOpenRequestHistory={() => navigation.navigate("EmployeeRequestHistory")}
                onOpenRequestFollowUp={() => navigation.navigate("EmployeeRequestFollowUp")}
                onOpenMobileAnalytics={() => navigation.navigate("MobileAnalyticsDashboard")}
                onOpenNotifications={() => navigation.navigate("Notifications")}
                onOpenNotificationHistory={() => navigation.navigate("NotificationHistory")}
                onOpenNotices={() => void Linking.openURL(resolveMobileWebUrl("/employee/notices"))}
                onOpenBenefits={() => void Linking.openURL(resolveMobileWebUrl("/employee/benefits"))}
                onOpenRecruitment={() => void Linking.openURL(resolveMobileWebUrl("/employee/recruitment"))}
                onOpenSchedule={() => void Linking.openURL(resolveMobileWebUrl("/employee/schedule"))}
                onOpenContracts={() => void Linking.openURL(resolveMobileWebUrl("/employee/contracts"))}
                onOpenPayslips={() => void Linking.openURL(resolveMobileWebUrl("/employee/payslips"))}
              />
            )}
          </Stack.Screen>
        ) : null}
        {session?.role === "EMPLOYEE" ? (
          <Stack.Screen name="EmployeeRequestFollowUp" options={{ title: appCopy.titles.requestFollowUp }}>
            {({ navigation }) => (
              <EmployeeRequestFollowUpScreen
                session={session}
                onOpenRequestHistory={() => navigation.navigate("EmployeeRequestHistory")}
                onOpenRequestSubmit={(requestType) =>
                  navigation.navigate("EmployeeRequestSubmit", { requestType: requestType ?? "attendanceCorrection" })
                }
              />
            )}
          </Stack.Screen>
        ) : null}
        {session?.role === "EMPLOYEE" ? (
          <Stack.Screen name="EmployeeRequestHistory" options={{ title: appCopy.titles.requestHistory }}>
            {({ navigation }) => (
              <EmployeeRequestHistoryScreen
                session={session}
                onOpenRequestFollowUp={() => navigation.navigate("EmployeeRequestFollowUp")}
              />
            )}
          </Stack.Screen>
        ) : null}
        {session?.role === "EMPLOYEE" ? (
          <Stack.Screen name="EmployeeRequestSubmit" options={{ title: appCopy.titles.requestSubmit }}>
            {({ route, navigation }) => (
              <EmployeeRequestSubmitScreen
                session={session}
                initialRequestType={route.params?.requestType ?? "attendanceCorrection"}
                onOpenRequestHistory={() => navigation.navigate("EmployeeRequestHistory")}
                onOpenRequestFollowUp={() => navigation.navigate("EmployeeRequestFollowUp")}
              />
            )}
          </Stack.Screen>
        ) : null}
        {session ? (
          <Stack.Screen name="MobileAnalyticsDashboard" options={{ title: appCopy.titles.analytics }}>
            {({ navigation }) => (
              <MobileAnalyticsDashboardScreen
                session={session}
                onOpenApprovalQueue={session.role === "ADMIN" ? () => navigation.navigate("ApprovalQueue") : undefined}
                onOpenRequestHistory={session.role === "EMPLOYEE" ? () => navigation.navigate("EmployeeRequestHistory") : undefined}
                onOpenRequestFollowUp={session.role === "EMPLOYEE" ? () => navigation.navigate("EmployeeRequestFollowUp") : undefined}
                onOpenNotifications={() => navigation.navigate("Notifications")}
              />
            )}
          </Stack.Screen>
        ) : null}
        {session ? (
          <Stack.Screen name="Notifications" options={{ title: appCopy.titles.notificationCenter }}>
            {({ navigation }) => (
              <NotificationCenterScreen
                session={session}
                onOpenHistory={() => navigation.navigate("NotificationHistory")}
              />
            )}
          </Stack.Screen>
        ) : null}
        {session ? (
          <Stack.Screen name="NotificationHistory" options={{ title: appCopy.titles.notificationHistory }}>
            {() => <NotificationHistoryScreen session={session} />}
          </Stack.Screen>
        ) : null}
        {session?.role === "ADMIN" ? (
          <Stack.Screen name="EmailTemplates" options={{ title: appCopy.titles.emailTemplates }}>
            {() => <EmailTemplateScreen session={session} />}
          </Stack.Screen>
        ) : null}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  splashTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.ink
  },
  splashSub: {
    fontSize: 14,
    color: colors.muted
  }
});
