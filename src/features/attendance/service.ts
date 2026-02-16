import type { Actor } from "@/lib/actor";
import { requireOwnOrAny, requirePermission, resolveActorPermissions } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import { derivePayableMinutes, type PayableMinutes } from "@/lib/payroll-rules";
import type {
  AttendanceCaptureChannel,
  AttendanceRecordEntity,
  DataAccess,
  UpdateAttendanceRecordInput
} from "@/features/shared/data-access";
import type { DomainEventPublisher } from "@/features/shared/domain-event-publisher";
import { getRuntimeDomainEventPublisher } from "@/features/shared/runtime-domain-event-publisher";
import { requireEmployeeWithinTenant, resolveTenantScope } from "@/features/shared/tenant-scope";
import { ServiceError } from "@/features/shared/service-error";

type CreateAttendanceInput = {
  employeeId: string;
  checkInAt: Date;
  checkOutAt: Date | null;
  breakMinutes: number;
  isHoliday: boolean;
  notes?: string;
  capture?: {
    channel: AttendanceCaptureChannel;
    deviceId?: string;
    attestationToken?: string;
    ipAddress?: string;
    latitude?: number;
    longitude?: number;
    accuracyMeters?: number;
  };
};

type UpdateAttendanceInput = {
  checkInAt?: Date;
  checkOutAt?: Date;
  breakMinutes?: number;
  isHoliday?: boolean;
  notes?: string;
  capture?: {
    channel?: AttendanceCaptureChannel;
    deviceId?: string | null;
    attestationToken?: string;
    ipAddress?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    accuracyMeters?: number | null;
  };
};

type ListAttendanceInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
  state?: "PENDING" | "APPROVED" | "REJECTED";
};

type ListAttendanceAggregatesInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
};

export type AttendanceAggregate = {
  employeeId: string;
  periodStart: Date;
  periodEnd: Date;
  counts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    payable: number;
  };
  totals: PayableMinutes;
};

type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
  eventPublisher?: DomainEventPublisher;
};

function getEventPublisher(context: ServiceContext): DomainEventPublisher {
  return context.eventPublisher ?? getRuntimeDomainEventPublisher();
}

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function isAttendanceGpsPolicyEnabled() {
  return isTruthyFlag(
    process.env.FLOWHR_ATTENDANCE_GPS_REQUIRED ?? process.env.ATTENDANCE_GPS_REQUIRED
  );
}

function isAttendanceGeofencePolicyEnabled() {
  return isTruthyFlag(
    process.env.FLOWHR_ATTENDANCE_GEOFENCE_ENABLED ?? process.env.ATTENDANCE_GEOFENCE_ENABLED
  );
}

function isAttendanceMultiSiteGeofencePolicyEnabled() {
  return isTruthyFlag(
    process.env.FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_ENABLED ??
      process.env.ATTENDANCE_MULTI_SITE_GEOFENCE_ENABLED
  );
}

function isAttendanceTrustedDevicePolicyEnabled() {
  return isTruthyFlag(
    process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_ENABLED ??
      process.env.ATTENDANCE_TRUSTED_DEVICE_ENABLED
  );
}

function isAttendanceDeviceAttestationPolicyEnabled() {
  return isTruthyFlag(
    process.env.FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_ENABLED ??
      process.env.ATTENDANCE_DEVICE_ATTESTATION_ENABLED
  );
}

function isAttendanceAntiSpoofingPolicyEnabled() {
  return isTruthyFlag(
    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_ENABLED ??
      process.env.ATTENDANCE_ANTI_SPOOFING_ENABLED
  );
}

type GeofenceConfig = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

type GeofenceSiteConfig = {
  siteId: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

type AntiSpoofingPolicyConfig = {
  allowedChannels: Set<AttendanceCaptureChannel>;
  maxGpsAccuracyMeters: number;
  riskThreshold: number;
  signalFusionEnabled: boolean;
  minSignals: number;
  reputationPenalty: number;
  highRiskDeviceIds: Set<string>;
  highRiskIpAddresses: Set<string>;
  externalReputationEnabled: boolean;
  externalReputationProvider: "static" | "remote";
  externalReputationUrl: string | null;
  externalReputationTimeoutMs: number;
  externalReputationCacheTtlSeconds: number;
  externalReputationStrictMode: boolean;
};

type AntiSpoofingReputationSnapshot = {
  highRiskDeviceIds: Set<string>;
  highRiskIpAddresses: Set<string>;
  source: "static" | "remote" | "remote-fallback";
};

type AntiSpoofingReputationCache = {
  cacheKey: string;
  expiresAt: number;
  snapshot: AntiSpoofingReputationSnapshot;
};

let antiSpoofingReputationCache: AntiSpoofingReputationCache | null = null;

function parseNumberEnv(value: string | undefined): number | null {
  if (value === undefined) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

function parseIntegerEnv(value: string | undefined): number | null {
  const parsed = parseNumberEnv(value);
  if (parsed === null || !Number.isInteger(parsed)) {
    return null;
  }
  return parsed;
}

function parseCsvSet(value: string | undefined, normalize?: (token: string) => string) {
  const tokens = (value ?? "")
    .split(",")
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
    .map((token) => (normalize ? normalize(token) : token));
  return new Set(tokens);
}

function parseExternalReputationProvider(value: string | undefined): "static" | "remote" {
  const normalized = (value ?? "static").trim().toLowerCase();
  if (normalized === "static" || normalized === "remote") {
    return normalized;
  }
  throw new ServiceError(
    500,
    "attendance anti-spoofing policy is enabled but external reputation provider configuration is invalid"
  );
}

function resolveReputationCacheKey(config: AntiSpoofingPolicyConfig) {
  const staticDeviceIds = Array.from(config.highRiskDeviceIds).sort().join(",");
  const staticIpAddresses = Array.from(config.highRiskIpAddresses).sort().join(",");
  return [
    config.externalReputationEnabled ? "1" : "0",
    config.externalReputationProvider,
    config.externalReputationUrl ?? "",
    config.externalReputationStrictMode ? "1" : "0",
    staticDeviceIds,
    staticIpAddresses
  ].join("|");
}

function parseRemoteReputationPayload(payload: unknown): {
  highRiskDeviceIds: Set<string>;
  highRiskIpAddresses: Set<string>;
} {
  if (!payload || typeof payload !== "object") {
    throw new Error("reputation payload must be an object");
  }
  const body = payload as Record<string, unknown>;
  const deviceIdsRaw = body.highRiskDeviceIds ?? body.deviceIds ?? [];
  const ipAddressesRaw = body.highRiskIpAddresses ?? body.ipAddresses ?? [];

  if (!Array.isArray(deviceIdsRaw) || !Array.isArray(ipAddressesRaw)) {
    throw new Error("reputation payload arrays are invalid");
  }

  const highRiskDeviceIds = new Set(
    deviceIdsRaw
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
  );
  const highRiskIpAddresses = new Set(
    ipAddressesRaw
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 0)
  );

  return {
    highRiskDeviceIds,
    highRiskIpAddresses
  };
}

async function fetchRemoteReputationSnapshot(config: AntiSpoofingPolicyConfig) {
  const url = config.externalReputationUrl;
  if (!url) {
    throw new Error("reputation URL is missing");
  }

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), config.externalReputationTimeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json"
      },
      signal: abortController.signal
    });
    if (!response.ok) {
      throw new Error(`reputation provider responded with status ${response.status}`);
    }
    const payload = (await response.json()) as unknown;
    return parseRemoteReputationPayload(payload);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function resolveAntiSpoofingReputationSnapshot(
  config: AntiSpoofingPolicyConfig
): Promise<AntiSpoofingReputationSnapshot> {
  const baseSnapshot: AntiSpoofingReputationSnapshot = {
    highRiskDeviceIds: new Set(config.highRiskDeviceIds),
    highRiskIpAddresses: new Set(config.highRiskIpAddresses),
    source: "static"
  };

  if (!config.externalReputationEnabled || config.externalReputationProvider !== "remote") {
    return baseSnapshot;
  }

  const now = Date.now();
  const cacheKey = resolveReputationCacheKey(config);
  if (
    antiSpoofingReputationCache &&
    antiSpoofingReputationCache.cacheKey === cacheKey &&
    antiSpoofingReputationCache.expiresAt > now
  ) {
    return antiSpoofingReputationCache.snapshot;
  }

  try {
    const remoteSnapshot = await fetchRemoteReputationSnapshot(config);
    const mergedSnapshot: AntiSpoofingReputationSnapshot = {
      highRiskDeviceIds: new Set([...baseSnapshot.highRiskDeviceIds, ...remoteSnapshot.highRiskDeviceIds]),
      highRiskIpAddresses: new Set([...baseSnapshot.highRiskIpAddresses, ...remoteSnapshot.highRiskIpAddresses]),
      source: "remote"
    };
    antiSpoofingReputationCache = {
      cacheKey,
      expiresAt: now + config.externalReputationCacheTtlSeconds * 1000,
      snapshot: mergedSnapshot
    };
    return mergedSnapshot;
  } catch {
    if (config.externalReputationStrictMode) {
      throw new ServiceError(
        500,
        "attendance anti-spoofing policy could not load external reputation snapshot"
      );
    }
    return {
      ...baseSnapshot,
      source: "remote-fallback"
    };
  }
}

function parseTrustedDeviceAllowlist() {
  const raw = process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_IDS ?? "";
  const values = raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (values.length === 0) {
    throw new ServiceError(500, "attendance trusted device policy is enabled but allowlist is empty");
  }

  return new Set(values);
}

function parseDeviceAttestationMap() {
  const raw =
    process.env.FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_TOKENS ??
    process.env.ATTENDANCE_DEVICE_ATTESTATION_TOKENS ??
    "";
  const entries = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (entries.length === 0) {
    throw new ServiceError(
      500,
      "attendance device attestation policy is enabled but token mapping is empty"
    );
  }

  const mapping = new Map<string, string>();
  for (const entry of entries) {
    const [deviceIdRaw, tokenRaw, ...extra] = entry.split(":");
    const deviceId = deviceIdRaw?.trim() ?? "";
    const token = tokenRaw?.trim() ?? "";
    if (!deviceId || !token || extra.length > 0) {
      throw new ServiceError(
        500,
        "attendance device attestation policy is enabled but token mapping is invalid"
      );
    }
    mapping.set(deviceId, token);
  }

  return mapping;
}

function loadAntiSpoofingPolicyConfig(): AntiSpoofingPolicyConfig {
  const rawChannels =
    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_ALLOWED_CHANNELS ??
    process.env.ATTENDANCE_ANTI_SPOOFING_ALLOWED_CHANNELS ??
    "GPS,WIFI,QR";
  const allowedChannels = rawChannels
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value) => value.length > 0);

  const validChannels: AttendanceCaptureChannel[] = ["MANUAL", "GPS", "QR", "WIFI", "DEVICE"];
  const allowed = new Set<AttendanceCaptureChannel>();
  for (const channel of allowedChannels) {
    if (!validChannels.includes(channel as AttendanceCaptureChannel)) {
      throw new ServiceError(
        500,
        "attendance anti-spoofing policy is enabled but allowed channel configuration is invalid"
      );
    }
    allowed.add(channel as AttendanceCaptureChannel);
  }

  if (allowed.size === 0) {
    throw new ServiceError(
      500,
      "attendance anti-spoofing policy is enabled but allowed channel configuration is empty"
    );
  }

  const maxGpsAccuracyMeters =
    parseIntegerEnv(process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_MAX_GPS_ACCURACY_METERS) ?? 150;
  const riskThreshold =
    parseIntegerEnv(process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_RISK_THRESHOLD) ?? 2;
  const signalFusionEnabled = isTruthyFlag(
    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_ENABLED ??
      process.env.ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_ENABLED
  );
  const minSignals =
    parseIntegerEnv(
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_MIN_SIGNALS ??
        process.env.ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_MIN_SIGNALS
    ) ?? 2;
  const reputationPenalty =
    parseIntegerEnv(
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_REPUTATION_PENALTY ??
        process.env.ATTENDANCE_ANTI_SPOOFING_REPUTATION_PENALTY
    ) ?? 2;
  const highRiskDeviceIds = parseCsvSet(
    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_HIGH_RISK_DEVICE_IDS ??
      process.env.ATTENDANCE_ANTI_SPOOFING_HIGH_RISK_DEVICE_IDS
  );
  const highRiskIpAddresses = parseCsvSet(
    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_HIGH_RISK_IPS ??
      process.env.ATTENDANCE_ANTI_SPOOFING_HIGH_RISK_IPS,
    (token) => token.toLowerCase()
  );
  const externalReputationEnabled = isTruthyFlag(
    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_ENABLED ??
      process.env.ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_ENABLED
  );
  const externalReputationProvider = parseExternalReputationProvider(
    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_PROVIDER ??
      process.env.ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_PROVIDER
  );
  const externalReputationUrl =
    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_URL ??
    process.env.ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_URL ??
    null;
  const externalReputationTimeoutMs =
    parseIntegerEnv(
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_TIMEOUT_MS ??
        process.env.ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_TIMEOUT_MS
    ) ?? 2000;
  const externalReputationCacheTtlSeconds =
    parseIntegerEnv(
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_CACHE_TTL_SECONDS ??
        process.env.ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_CACHE_TTL_SECONDS
    ) ?? 300;
  const externalReputationStrictMode = isTruthyFlag(
    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_STRICT_MODE ??
      process.env.ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_STRICT_MODE
  );

  if (maxGpsAccuracyMeters <= 0) {
    throw new ServiceError(
      500,
      "attendance anti-spoofing policy is enabled but max GPS accuracy configuration is invalid"
    );
  }
  if (riskThreshold < 0 || riskThreshold > 10) {
    throw new ServiceError(
      500,
      "attendance anti-spoofing policy is enabled but risk threshold configuration is invalid"
    );
  }
  if (minSignals < 1 || minSignals > 4) {
    throw new ServiceError(
      500,
      "attendance anti-spoofing policy is enabled but signal fusion min-signals configuration is invalid"
    );
  }
  if (reputationPenalty < 1 || reputationPenalty > 5) {
    throw new ServiceError(
      500,
      "attendance anti-spoofing policy is enabled but reputation penalty configuration is invalid"
    );
  }
  if (externalReputationEnabled && externalReputationProvider === "remote" && !externalReputationUrl?.trim()) {
    throw new ServiceError(
      500,
      "attendance anti-spoofing policy is enabled but external reputation URL configuration is empty"
    );
  }
  if (externalReputationTimeoutMs < 100 || externalReputationTimeoutMs > 10000) {
    throw new ServiceError(
      500,
      "attendance anti-spoofing policy is enabled but external reputation timeout configuration is invalid"
    );
  }
  if (externalReputationCacheTtlSeconds < 0 || externalReputationCacheTtlSeconds > 3600) {
    throw new ServiceError(
      500,
      "attendance anti-spoofing policy is enabled but external reputation cache ttl configuration is invalid"
    );
  }

  return {
    allowedChannels: allowed,
    maxGpsAccuracyMeters,
    riskThreshold,
    signalFusionEnabled,
    minSignals,
    reputationPenalty,
    highRiskDeviceIds,
    highRiskIpAddresses,
    externalReputationEnabled,
    externalReputationProvider,
    externalReputationUrl: externalReputationUrl?.trim() || null,
    externalReputationTimeoutMs,
    externalReputationCacheTtlSeconds,
    externalReputationStrictMode
  };
}

function loadGeofenceConfig(): GeofenceConfig {
  const latitude = parseNumberEnv(process.env.FLOWHR_ATTENDANCE_GEOFENCE_LAT);
  const longitude = parseNumberEnv(process.env.FLOWHR_ATTENDANCE_GEOFENCE_LNG);
  const radiusMeters = parseNumberEnv(process.env.FLOWHR_ATTENDANCE_GEOFENCE_RADIUS_METERS);

  if (latitude === null || longitude === null || radiusMeters === null) {
    throw new ServiceError(500, "attendance geofence policy is enabled but configuration is invalid");
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || radiusMeters <= 0) {
    throw new ServiceError(500, "attendance geofence policy is enabled but configuration is invalid");
  }

  return {
    latitude,
    longitude,
    radiusMeters
  };
}

function parseMultiSiteGeofenceConfig(): GeofenceSiteConfig[] {
  const raw = process.env.FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_SITES ?? "";
  const entries = raw
    .split(";")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (entries.length === 0) {
    throw new ServiceError(
      500,
      "attendance multi-site geofence policy is enabled but site configuration is empty"
    );
  }

  return entries.map((entry) => {
    const segments = entry.split(":").map((segment) => segment.trim());
    if (segments.length !== 4) {
      throw new ServiceError(
        500,
        "attendance multi-site geofence policy is enabled but site configuration is invalid"
      );
    }

    const [siteId, latitudeRaw, longitudeRaw, radiusRaw] = segments;
    const latitude = parseNumberEnv(latitudeRaw);
    const longitude = parseNumberEnv(longitudeRaw);
    const radiusMeters = parseNumberEnv(radiusRaw);

    if (
      !siteId ||
      latitude === null ||
      longitude === null ||
      radiusMeters === null ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180 ||
      radiusMeters <= 0
    ) {
      throw new ServiceError(
        500,
        "attendance multi-site geofence policy is enabled but site configuration is invalid"
      );
    }

    return {
      siteId,
      latitude,
      longitude,
      radiusMeters
    };
  });
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineDistanceMeters(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number
) {
  const earthRadiusMeters = 6371000;
  const deltaLat = toRadians(toLatitude - fromLatitude);
  const deltaLng = toRadians(toLongitude - fromLongitude);
  const fromLatRad = toRadians(fromLatitude);
  const toLatRad = toRadians(toLatitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLatRad) * Math.cos(toLatRad) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

function assertGpsCapturePolicyForCreate(actor: Actor, input: CreateAttendanceInput) {
  if (!isAttendanceGpsPolicyEnabled() || actor.role !== "employee") {
    return;
  }

  if (
    !input.capture ||
    input.capture.channel !== "GPS" ||
    input.capture.latitude === undefined ||
    input.capture.longitude === undefined
  ) {
    throw new ServiceError(400, "attendance capture policy requires GPS channel with coordinates");
  }
}

function assertGpsCapturePolicyForUpdate(
  actor: Actor,
  existing: AttendanceRecordEntity,
  input: UpdateAttendanceInput
) {
  if (!isAttendanceGpsPolicyEnabled() || actor.role !== "employee") {
    return;
  }

  const nextChannel = input.capture?.channel ?? existing.captureChannel;
  const nextLatitude =
    input.capture?.latitude !== undefined ? input.capture.latitude : existing.captureLatitude;
  const nextLongitude =
    input.capture?.longitude !== undefined ? input.capture.longitude : existing.captureLongitude;

  if (nextChannel !== "GPS" || nextLatitude === null || nextLongitude === null) {
    throw new ServiceError(400, "attendance capture policy requires GPS channel with coordinates");
  }
}

function assertGeofenceForCoordinates(latitude: number, longitude: number) {
  const geofence = loadGeofenceConfig();
  const distanceMeters = haversineDistanceMeters(
    latitude,
    longitude,
    geofence.latitude,
    geofence.longitude
  );
  if (distanceMeters > geofence.radiusMeters) {
    throw new ServiceError(400, "attendance capture location is outside allowed geofence");
  }
}

function assertMultiSiteGeofenceForCoordinates(latitude: number, longitude: number) {
  const sites = parseMultiSiteGeofenceConfig();
  const insideAnySite = sites.some((site) => {
    const distanceMeters = haversineDistanceMeters(
      latitude,
      longitude,
      site.latitude,
      site.longitude
    );
    return distanceMeters <= site.radiusMeters;
  });

  if (!insideAnySite) {
    throw new ServiceError(400, "attendance capture location is outside allowed multi-site geofence");
  }
}

function assertGeofencePolicyForCreate(actor: Actor, input: CreateAttendanceInput) {
  const geofencePolicyEnabled = isAttendanceGeofencePolicyEnabled();
  const multiSitePolicyEnabled = isAttendanceMultiSiteGeofencePolicyEnabled();

  if ((!geofencePolicyEnabled && !multiSitePolicyEnabled) || actor.role !== "employee") {
    return;
  }

  const latitude = input.capture?.latitude;
  const longitude = input.capture?.longitude;
  if (input.capture?.channel !== "GPS" || latitude === undefined || longitude === undefined) {
    throw new ServiceError(400, "attendance geofence policy requires GPS coordinates");
  }

  if (multiSitePolicyEnabled) {
    assertMultiSiteGeofenceForCoordinates(latitude, longitude);
    return;
  }

  assertGeofenceForCoordinates(latitude, longitude);
}

function assertGeofencePolicyForUpdate(
  actor: Actor,
  existing: AttendanceRecordEntity,
  input: UpdateAttendanceInput
) {
  const geofencePolicyEnabled = isAttendanceGeofencePolicyEnabled();
  const multiSitePolicyEnabled = isAttendanceMultiSiteGeofencePolicyEnabled();

  if ((!geofencePolicyEnabled && !multiSitePolicyEnabled) || actor.role !== "employee") {
    return;
  }

  const nextChannel = input.capture?.channel ?? existing.captureChannel;
  const nextLatitude =
    input.capture?.latitude !== undefined ? input.capture.latitude : existing.captureLatitude;
  const nextLongitude =
    input.capture?.longitude !== undefined ? input.capture.longitude : existing.captureLongitude;

  if (
    nextChannel !== "GPS" ||
    nextLatitude === undefined ||
    nextLongitude === undefined ||
    nextLatitude === null ||
    nextLongitude === null
  ) {
    throw new ServiceError(400, "attendance geofence policy requires GPS coordinates");
  }

  if (multiSitePolicyEnabled) {
    assertMultiSiteGeofenceForCoordinates(nextLatitude, nextLongitude);
    return;
  }

  assertGeofenceForCoordinates(nextLatitude, nextLongitude);
}

function assertTrustedDevicePolicyForCreate(actor: Actor, input: CreateAttendanceInput) {
  if (!isAttendanceTrustedDevicePolicyEnabled() || actor.role !== "employee") {
    return;
  }

  const deviceId = input.capture?.deviceId?.trim();
  if (!deviceId) {
    throw new ServiceError(400, "attendance trusted device policy requires capture deviceId");
  }

  const trustedDevices = parseTrustedDeviceAllowlist();
  if (!trustedDevices.has(deviceId)) {
    throw new ServiceError(400, "attendance capture device is not in trusted device allowlist");
  }
}

function assertTrustedDevicePolicyForUpdate(
  actor: Actor,
  existing: AttendanceRecordEntity,
  input: UpdateAttendanceInput
) {
  if (!isAttendanceTrustedDevicePolicyEnabled() || actor.role !== "employee") {
    return;
  }

  const nextDeviceId = input.capture?.deviceId !== undefined ? input.capture.deviceId : existing.captureDeviceId;
  const normalized = nextDeviceId?.trim();
  if (!normalized) {
    throw new ServiceError(400, "attendance trusted device policy requires capture deviceId");
  }

  const trustedDevices = parseTrustedDeviceAllowlist();
  if (!trustedDevices.has(normalized)) {
    throw new ServiceError(400, "attendance capture device is not in trusted device allowlist");
  }
}

function assertDeviceAttestationForCreate(actor: Actor, input: CreateAttendanceInput) {
  if (!isAttendanceDeviceAttestationPolicyEnabled() || actor.role !== "employee") {
    return;
  }

  const deviceId = input.capture?.deviceId?.trim();
  if (!deviceId) {
    throw new ServiceError(
      400,
      "attendance device attestation policy requires effective capture deviceId"
    );
  }

  const attestationToken = input.capture?.attestationToken?.trim();
  if (!attestationToken) {
    throw new ServiceError(400, "attendance device attestation policy requires capture attestationToken");
  }

  const attestationMap = parseDeviceAttestationMap();
  const expectedToken = attestationMap.get(deviceId);
  if (!expectedToken || expectedToken !== attestationToken) {
    throw new ServiceError(400, "attendance capture attestation token is invalid for device");
  }
}

function assertDeviceAttestationForUpdate(
  actor: Actor,
  existing: AttendanceRecordEntity,
  input: UpdateAttendanceInput
) {
  if (!isAttendanceDeviceAttestationPolicyEnabled() || actor.role !== "employee") {
    return;
  }

  const nextDeviceId = input.capture?.deviceId !== undefined ? input.capture.deviceId : existing.captureDeviceId;
  const normalizedDeviceId = nextDeviceId?.trim();
  if (!normalizedDeviceId) {
    throw new ServiceError(
      400,
      "attendance device attestation policy requires effective capture deviceId"
    );
  }

  const attestationToken = input.capture?.attestationToken?.trim();
  if (!attestationToken) {
    throw new ServiceError(400, "attendance device attestation policy requires capture attestationToken");
  }

  const attestationMap = parseDeviceAttestationMap();
  const expectedToken = attestationMap.get(normalizedDeviceId);
  if (!expectedToken || expectedToken !== attestationToken) {
    throw new ServiceError(400, "attendance capture attestation token is invalid for device");
  }
}

function computeAntiSpoofingRiskScore(
  config: AntiSpoofingPolicyConfig,
  reputationSnapshot: AntiSpoofingReputationSnapshot,
  channel: AttendanceCaptureChannel,
  deviceId: string | null | undefined,
  ipAddress: string | null | undefined,
  accuracyMeters: number | null | undefined,
  latitude: number | null | undefined,
  longitude: number | null | undefined
) {
  let score = 0;
  const normalizedDeviceId = deviceId?.trim();
  const normalizedIpAddress = ipAddress?.trim();

  if (!config.allowedChannels.has(channel)) {
    score += 2;
  }
  if (!normalizedDeviceId) {
    score += 1;
  }
  if (!normalizedIpAddress) {
    score += 1;
  }
  if (
    channel === "GPS" &&
    (accuracyMeters === null ||
      accuracyMeters === undefined ||
      !Number.isFinite(accuracyMeters) ||
      accuracyMeters > config.maxGpsAccuracyMeters)
  ) {
    score += 1;
  }

  if (config.signalFusionEnabled) {
    let signalCount = 0;
    if (config.allowedChannels.has(channel)) {
      signalCount += 1;
    }
    if (normalizedDeviceId) {
      signalCount += 1;
    }
    if (normalizedIpAddress) {
      signalCount += 1;
    }
    if (
      channel === "GPS" &&
      latitude !== null &&
      latitude !== undefined &&
      longitude !== null &&
      longitude !== undefined &&
      accuracyMeters !== null &&
      accuracyMeters !== undefined &&
      Number.isFinite(accuracyMeters) &&
      accuracyMeters <= config.maxGpsAccuracyMeters
    ) {
      signalCount += 1;
    }

    if (signalCount < config.minSignals) {
      score += config.reputationPenalty;
    }
    if (normalizedDeviceId && reputationSnapshot.highRiskDeviceIds.has(normalizedDeviceId)) {
      score += config.reputationPenalty;
    }
    if (
      normalizedIpAddress &&
      reputationSnapshot.highRiskIpAddresses.has(normalizedIpAddress.toLowerCase())
    ) {
      score += config.reputationPenalty;
    }
  }

  return score;
}

async function assertAntiSpoofingPolicyForCreate(actor: Actor, input: CreateAttendanceInput) {
  if (!isAttendanceAntiSpoofingPolicyEnabled() || actor.role !== "employee") {
    return;
  }

  const config = loadAntiSpoofingPolicyConfig();
  const reputationSnapshot = await resolveAntiSpoofingReputationSnapshot(config);
  const channel = input.capture?.channel ?? "MANUAL";
  const riskScore = computeAntiSpoofingRiskScore(
    config,
    reputationSnapshot,
    channel,
    input.capture?.deviceId,
    input.capture?.ipAddress,
    input.capture?.accuracyMeters,
    input.capture?.latitude,
    input.capture?.longitude
  );

  if (riskScore > config.riskThreshold) {
    throw new ServiceError(
      400,
      `attendance anti-spoofing policy rejected capture payload (risk score ${riskScore} > threshold ${config.riskThreshold})`
    );
  }
}

async function assertAntiSpoofingPolicyForUpdate(
  actor: Actor,
  existing: AttendanceRecordEntity,
  input: UpdateAttendanceInput
) {
  if (!isAttendanceAntiSpoofingPolicyEnabled() || actor.role !== "employee") {
    return;
  }

  const config = loadAntiSpoofingPolicyConfig();
  const reputationSnapshot = await resolveAntiSpoofingReputationSnapshot(config);
  const nextChannel = input.capture?.channel ?? existing.captureChannel;
  const nextDeviceId = input.capture?.deviceId !== undefined ? input.capture.deviceId : existing.captureDeviceId;
  const nextIpAddress = input.capture?.ipAddress !== undefined ? input.capture.ipAddress : existing.captureIpAddress;
  const nextAccuracy =
    input.capture?.accuracyMeters !== undefined ? input.capture.accuracyMeters : existing.captureAccuracyMeters;
  const nextLatitude =
    input.capture?.latitude !== undefined ? input.capture.latitude : existing.captureLatitude;
  const nextLongitude =
    input.capture?.longitude !== undefined ? input.capture.longitude : existing.captureLongitude;
  const riskScore = computeAntiSpoofingRiskScore(
    config,
    reputationSnapshot,
    nextChannel,
    nextDeviceId,
    nextIpAddress,
    nextAccuracy,
    nextLatitude,
    nextLongitude
  );

  if (riskScore > config.riskThreshold) {
    throw new ServiceError(
      400,
      `attendance anti-spoofing policy rejected capture payload (risk score ${riskScore} > threshold ${config.riskThreshold})`
    );
  }
}

function toCapturePayload(record: AttendanceRecordEntity) {
  return {
    channel: record.captureChannel,
    deviceId: record.captureDeviceId,
    ipAddress: record.captureIpAddress,
    latitude: record.captureLatitude,
    longitude: record.captureLongitude,
    accuracyMeters: record.captureAccuracyMeters
  };
}

function toCreateCaptureInput(input: CreateAttendanceInput["capture"]) {
  return {
    captureChannel: input?.channel ?? "MANUAL",
    captureDeviceId: input?.deviceId ?? null,
    captureIpAddress: input?.ipAddress ?? null,
    captureLatitude: input?.latitude ?? null,
    captureLongitude: input?.longitude ?? null,
    captureAccuracyMeters: input?.accuracyMeters ?? null
  };
}

function toUpdateCaptureInput(input: UpdateAttendanceInput["capture"]) {
  if (!input) {
    return {};
  }

  return {
    captureChannel: input.channel,
    captureDeviceId: input.deviceId,
    captureIpAddress: input.ipAddress,
    captureLatitude: input.latitude,
    captureLongitude: input.longitude,
    captureAccuracyMeters: input.accuracyMeters
  };
}

export async function createAttendanceRecord(
  context: ServiceContext,
  input: CreateAttendanceInput
): Promise<AttendanceRecordEntity> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requireOwnOrAny(context, {
    own: Permissions.attendanceRecordWriteOwn,
    any: Permissions.attendanceRecordWriteAny,
    employeeId: input.employeeId
  });

  const employee = await requireEmployeeWithinTenant(
    context.dataAccess,
    context.actor,
    input.employeeId
  );

  assertGpsCapturePolicyForCreate(actor, input);
  assertGeofencePolicyForCreate(actor, input);
  assertTrustedDevicePolicyForCreate(actor, input);
  assertDeviceAttestationForCreate(actor, input);
  await assertAntiSpoofingPolicyForCreate(actor, input);

  const record = await context.dataAccess.attendance.create({
    employeeId: input.employeeId,
    checkInAt: input.checkInAt,
    checkOutAt: input.checkOutAt,
    breakMinutes: input.breakMinutes,
    isHoliday: input.isHoliday,
    notes: input.notes,
    ...toCreateCaptureInput(input.capture)
  });

  await context.dataAccess.audit.append({
    action: "attendance.recorded",
    entityType: "AttendanceRecord",
    entityId: record.id,
    organizationId: employee.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: record.employeeId,
      capture: toCapturePayload(record)
    }
  });
  await getEventPublisher(context).publish({
    name: "attendance.recorded.v1",
    occurredAt: new Date().toISOString(),
    entityType: "AttendanceRecord",
    entityId: record.id,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: record.employeeId,
      capture: toCapturePayload(record)
    }
  });

  return record;
}

async function requireEditableRecord(
  context: ServiceContext,
  recordId: string
): Promise<AttendanceRecordEntity> {
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  const existing = await context.dataAccess.attendance.findById(recordId);
  if (!existing) {
    throw new ServiceError(404, "attendance record not found");
  }
  await requireEmployeeWithinTenant(context.dataAccess, context.actor, existing.employeeId);
  await requireOwnOrAny(context, {
    own: Permissions.attendanceRecordWriteOwn,
    any: Permissions.attendanceRecordWriteAny,
    employeeId: existing.employeeId
  });
  if (existing.state !== "PENDING") {
    throw new ServiceError(409, "only pending attendance can be edited");
  }

  return existing;
}

function toRecordUpdateInput(input: UpdateAttendanceInput): UpdateAttendanceRecordInput {
  return {
    checkInAt: input.checkInAt,
    checkOutAt: input.checkOutAt,
    breakMinutes: input.breakMinutes,
    isHoliday: input.isHoliday,
    notes: input.notes,
    ...toUpdateCaptureInput(input.capture)
  };
}

export async function updateAttendanceRecord(
  context: ServiceContext,
  recordId: string,
  input: UpdateAttendanceInput
): Promise<AttendanceRecordEntity> {
  const existing = await requireEditableRecord(context, recordId);
  assertGpsCapturePolicyForUpdate(context.actor!, existing, input);
  assertGeofencePolicyForUpdate(context.actor!, existing, input);
  assertTrustedDevicePolicyForUpdate(context.actor!, existing, input);
  assertDeviceAttestationForUpdate(context.actor!, existing, input);
  await assertAntiSpoofingPolicyForUpdate(context.actor!, existing, input);
  const employee = await requireEmployeeWithinTenant(
    context.dataAccess,
    context.actor,
    existing.employeeId
  );

  const record = await context.dataAccess.attendance.update(recordId, toRecordUpdateInput(input));
  await context.dataAccess.audit.append({
    action: "attendance.corrected",
    entityType: "AttendanceRecord",
    entityId: record.id,
    organizationId: employee.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: input
  });
  await getEventPublisher(context).publish({
    name: "attendance.corrected.v1",
    occurredAt: new Date().toISOString(),
    entityType: "AttendanceRecord",
    entityId: record.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      ...input
    }
  });

  return record;
}

export async function approveAttendanceRecord(
  context: ServiceContext,
  recordId: string
): Promise<AttendanceRecordEntity> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(context, Permissions.attendanceRecordApprove, "approval requires permission");

  const existing = await context.dataAccess.attendance.findById(recordId);
  if (!existing) {
    throw new ServiceError(404, "attendance record not found");
  }
  const employee = await requireEmployeeWithinTenant(
    context.dataAccess,
    context.actor,
    existing.employeeId
  );
  if (existing.state !== "PENDING") {
    throw new ServiceError(409, "only pending attendance can be approved");
  }

  const record = await context.dataAccess.attendance.update(recordId, {
    state: "APPROVED",
    approvedAt: new Date(),
    approvedBy: actor.id
  });
  await context.dataAccess.audit.append({
    action: "attendance.approved",
    entityType: "AttendanceRecord",
    entityId: record.id,
    organizationId: employee.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: record.employeeId
    }
  });
  await getEventPublisher(context).publish({
    name: "attendance.approved.v1",
    occurredAt: new Date().toISOString(),
    entityType: "AttendanceRecord",
    entityId: record.id,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: record.employeeId,
      approvedAt: record.approvedAt?.toISOString() ?? null
    }
  });

  return record;
}

export async function rejectAttendanceRecord(
  context: ServiceContext,
  recordId: string,
  reason?: string
): Promise<AttendanceRecordEntity> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  await requirePermission(context, Permissions.attendanceRecordReject, "rejection requires permission");

  const existing = await context.dataAccess.attendance.findById(recordId);
  if (!existing) {
    throw new ServiceError(404, "attendance record not found");
  }
  const employee = await requireEmployeeWithinTenant(
    context.dataAccess,
    context.actor,
    existing.employeeId
  );
  if (existing.state !== "PENDING") {
    throw new ServiceError(409, "only pending attendance can be rejected");
  }

  const record = await context.dataAccess.attendance.update(recordId, {
    state: "REJECTED",
    approvedAt: null,
    approvedBy: null
  });
  await context.dataAccess.audit.append({
    action: "attendance.rejected",
    entityType: "AttendanceRecord",
    entityId: record.id,
    organizationId: employee.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: record.employeeId,
      reason: reason ?? null
    }
  });
  await getEventPublisher(context).publish({
    name: "attendance.rejected.v1",
    occurredAt: new Date().toISOString(),
    entityType: "AttendanceRecord",
    entityId: record.id,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: record.employeeId,
      reason: reason ?? null
    }
  });

  return record;
}

function ensureValidPeriod(periodStart: Date, periodEnd: Date) {
  if (periodEnd <= periodStart) {
    throw new ServiceError(400, "to must be after from");
  }
}

const emptyTotals: PayableMinutes = {
  regular: 0,
  overtime: 0,
  night: 0,
  holiday: 0
};

export async function listAttendanceRecords(
  context: ServiceContext,
  input: ListAttendanceInput
): Promise<AttendanceRecordEntity[]> {
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  ensureValidPeriod(input.periodStart, input.periodEnd);
  const tenantScope = resolveTenantScope(context.actor);
  if (tenantScope && input.employeeId) {
    await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId);
  }

  const actor = context.actor;
  const permissions = await resolveActorPermissions(context);

  if (permissions.has(Permissions.attendanceRecordListAny)) {
    return await context.dataAccess.attendance.listInPeriod({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      organizationId: tenantScope ?? undefined,
      employeeId: input.employeeId,
      state: input.state
    });
  }

  if (permissions.has(Permissions.attendanceRecordListByEmployee)) {
    if (!input.employeeId) {
      throw new ServiceError(400, "employeeId is required for manager list queries");
    }
    return await context.dataAccess.attendance.listInPeriod({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      organizationId: tenantScope ?? undefined,
      employeeId: input.employeeId,
      state: input.state
    });
  }

  if (permissions.has(Permissions.attendanceRecordListOwn)) {
    const employeeId = input.employeeId ?? actor.id;
    if (employeeId !== actor.id) {
      throw new ServiceError(403, "employee can only list own attendance records");
    }
    return await context.dataAccess.attendance.listInPeriod({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      organizationId: tenantScope ?? undefined,
      employeeId,
      state: input.state
    });
  }

  throw new ServiceError(403, "attendance list requires permission");
}

export async function listAttendanceAggregates(
  context: ServiceContext,
  input: ListAttendanceAggregatesInput
): Promise<AttendanceAggregate[]> {
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  ensureValidPeriod(input.periodStart, input.periodEnd);
  const tenantScope = resolveTenantScope(context.actor);
  if (tenantScope && input.employeeId) {
    await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId);
  }

  const actor = context.actor;
  let employeeId = input.employeeId;
  const permissions = await resolveActorPermissions(context);

  if (permissions.has(Permissions.attendanceAggregateListAny)) {
    // optional employeeId filter is allowed
  } else if (permissions.has(Permissions.attendanceAggregateListByEmployee)) {
    if (!employeeId) {
      throw new ServiceError(400, "employeeId is required for manager aggregate queries");
    }
  } else if (permissions.has(Permissions.attendanceAggregateListOwn)) {
    employeeId = employeeId ?? actor.id;
    if (employeeId !== actor.id) {
      throw new ServiceError(403, "employee can only list own attendance aggregates");
    }
  } else {
    throw new ServiceError(403, "attendance aggregates require permission");
  }

  const records = await context.dataAccess.attendance.listInPeriod({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    organizationId: tenantScope ?? undefined,
    employeeId
  });

  const aggregates = new Map<string, AttendanceAggregate>();

  function ensureAggregate(targetEmployeeId: string): AttendanceAggregate {
    const existing = aggregates.get(targetEmployeeId);
    if (existing) {
      return existing;
    }

    const created: AttendanceAggregate = {
      employeeId: targetEmployeeId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      counts: {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        payable: 0
      },
      totals: { ...emptyTotals }
    };
    aggregates.set(targetEmployeeId, created);
    return created;
  }

  if (employeeId) {
    ensureAggregate(employeeId);
  }

  for (const record of records) {
    const aggregate = ensureAggregate(record.employeeId);

    aggregate.counts.total += 1;
    if (record.state === "PENDING") {
      aggregate.counts.pending += 1;
    } else if (record.state === "APPROVED") {
      aggregate.counts.approved += 1;
    } else {
      aggregate.counts.rejected += 1;
    }

    if (record.state !== "APPROVED" || !record.checkOutAt) {
      continue;
    }

    aggregate.counts.payable += 1;
    const split = derivePayableMinutes(
      record.checkInAt,
      record.checkOutAt,
      record.breakMinutes,
      record.isHoliday
    );
    aggregate.totals = {
      regular: aggregate.totals.regular + split.regular,
      overtime: aggregate.totals.overtime + split.overtime,
      night: aggregate.totals.night + split.night,
      holiday: aggregate.totals.holiday + split.holiday
    };
  }

  return Array.from(aggregates.values()).sort((a, b) => a.employeeId.localeCompare(b.employeeId));
}
