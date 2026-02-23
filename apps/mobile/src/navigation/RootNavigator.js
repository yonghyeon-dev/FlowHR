import { useEffect, useMemo, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";

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
import { clearSession, loadSession, saveSession } from "../lib/sessionStore";
import { colors } from "../theme/tokens";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

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
        <Text style={styles.splashTitle}>FlowHR Mobile</Text>
        <Text style={styles.splashSub}>Loading app shell...</Text>
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
          <Stack.Screen name="AdminHome" options={{ title: "Admin Home" }}>
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
          <Stack.Screen name="ApprovalQueue" options={{ title: "Approval Queue" }}>
            {() => <ApprovalQueueScreen session={session} />}
          </Stack.Screen>
        ) : null}
        {session?.role === "EMPLOYEE" ? (
          <Stack.Screen name="EmployeeHome" options={{ title: "Employee Home" }}>
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
              />
            )}
          </Stack.Screen>
        ) : null}
        {session?.role === "EMPLOYEE" ? (
          <Stack.Screen name="EmployeeRequestFollowUp" options={{ title: "Request Follow-Up" }}>
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
          <Stack.Screen name="EmployeeRequestHistory" options={{ title: "Request History" }}>
            {({ navigation }) => (
              <EmployeeRequestHistoryScreen
                session={session}
                onOpenRequestFollowUp={() => navigation.navigate("EmployeeRequestFollowUp")}
              />
            )}
          </Stack.Screen>
        ) : null}
        {session?.role === "EMPLOYEE" ? (
          <Stack.Screen name="EmployeeRequestSubmit" options={{ title: "Request Submit" }}>
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
          <Stack.Screen name="MobileAnalyticsDashboard" options={{ title: "Analytics Dashboard" }}>
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
          <Stack.Screen name="Notifications" options={{ title: "Notification Center" }}>
            {({ navigation }) => (
              <NotificationCenterScreen
                session={session}
                onOpenHistory={() => navigation.navigate("NotificationHistory")}
              />
            )}
          </Stack.Screen>
        ) : null}
        {session ? (
          <Stack.Screen name="NotificationHistory" options={{ title: "Notification History" }}>
            {() => <NotificationHistoryScreen session={session} />}
          </Stack.Screen>
        ) : null}
        {session?.role === "ADMIN" ? (
          <Stack.Screen name="EmailTemplates" options={{ title: "Email Templates" }}>
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
