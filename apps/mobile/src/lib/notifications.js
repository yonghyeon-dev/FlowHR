import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
});

export async function requestPushPermissionAsync() {
  const settings = await Notifications.getPermissionsAsync();
  let status = settings.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  return status;
}

export async function registerDevicePushTokenAsync(projectId) {
  if (!Device.isDevice) {
    return null;
  }
  const status = await requestPushPermissionAsync();
  if (status !== "granted") {
    return null;
  }
  const result = await Notifications.getExpoPushTokenAsync({ projectId });
  return result.data ?? null;
}

export function permissionLabel(status) {
  if (status === "granted") {
    return "허용됨";
  }
  if (status === "denied") {
    return "거부됨";
  }
  return "미설정";
}

export function mapFlowHrNotification(payload) {
  return {
    id: payload?.id ?? `msg-${Date.now()}`,
    title: payload?.title ?? "FlowHR 알림",
    body: payload?.body ?? "",
    category: payload?.category ?? "general",
    createdAt: payload?.createdAt ?? new Date().toISOString(),
    read: Boolean(payload?.read)
  };
}
