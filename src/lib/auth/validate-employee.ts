import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";

const ACTIVE_EMPLOYEE_CACHE_TTL_MS = 5 * 60 * 1000;

type CachedEmployeeStatus = "ACTIVE" | "INACTIVE" | "MISSING";

type CacheEntry = {
  status: CachedEmployeeStatus;
  expiresAt: number;
};

const employeeStatusCache = new Map<string, CacheEntry>();

type ActorLike = {
  id: string;
  role: string;
} | null;

function readCachedStatus(employeeId: string, now: number): CachedEmployeeStatus | null {
  const cached = employeeStatusCache.get(employeeId);
  if (!cached) {
    return null;
  }
  if (cached.expiresAt <= now) {
    employeeStatusCache.delete(employeeId);
    return null;
  }
  return cached.status;
}

function writeCachedStatus(employeeId: string, status: CachedEmployeeStatus, now: number) {
  employeeStatusCache.set(employeeId, {
    status,
    expiresAt: now + ACTIVE_EMPLOYEE_CACHE_TTL_MS
  });
}

function isStatusAllowed(status: CachedEmployeeStatus) {
  return status !== "INACTIVE";
}

export function clearEmployeeStatusValidationCacheForTests() {
  employeeStatusCache.clear();
}

export async function validateActiveEmployee(actor: ActorLike): Promise<boolean> {
  if (!actor || actor.role !== "employee") {
    return true;
  }

  const employeeId = actor.id.trim();
  if (!employeeId) {
    return true;
  }

  const now = Date.now();
  const cachedStatus = readCachedStatus(employeeId, now);
  if (cachedStatus) {
    return isStatusAllowed(cachedStatus);
  }

  const employee = await getRuntimeDataAccess().employees.findById(employeeId);
  const resolvedStatus: CachedEmployeeStatus = !employee
    ? "MISSING"
    : employee.status === "ACTIVE"
      ? "ACTIVE"
      : "INACTIVE";
  writeCachedStatus(employeeId, resolvedStatus, now);
  return isStatusAllowed(resolvedStatus);
}

