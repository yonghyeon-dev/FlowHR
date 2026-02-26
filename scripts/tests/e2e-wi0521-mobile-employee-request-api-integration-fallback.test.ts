import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.trimEnd().split(/\r?\n/).length;
}

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body)
  };
}

async function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8("work-items", "WI-0521-mobile-employee-request-api-integration-fallback.md");
  const flowhrApi = readUtf8("apps", "mobile", "src", "lib", "flowhrApi.js");
  const requestApi = readUtf8("apps", "mobile", "src", "lib", "employeeRequestApi.js");
  const requestSync = readUtf8("apps", "mobile", "src", "lib", "employeeRequestSync.js");
  const submitScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeRequestSubmitScreen.js");
  const historyScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeRequestHistoryScreen.js");
  const followUpScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeRequestFollowUpScreen.js");

  assert.match(roadmap, /WI-0521/);
  assert.match(workItem, /WI-0521/i);
  assert.match(workItem, /mobile|request|api|fallback|sync/i);

  assert.match(flowhrApi, /"x-actor-role"/);
  assert.match(flowhrApi, /"x-actor-organization-id"/);

  assert.match(requestApi, /fetchEmployeeRequestsFromApi/);
  assert.match(requestApi, /submitEmployeeRequestToApi/);
  assert.match(requestApi, /\/api\/leave\/requests/);
  assert.match(requestApi, /\/api\/attendance\/records/);
  assert.match(requestSync, /loadEmployeeRequestsWithApiFallback/);

  assert.match(submitScreen, /submitEmployeeRequestToApi/);
  assert.match(submitScreen, /loadEmployeeRequestsWithApiFallback/);
  assert.match(submitScreen, /Sync API history/);
  assert.match(historyScreen, /loadEmployeeRequestsWithApiFallback/);
  assert.match(followUpScreen, /loadEmployeeRequestsWithApiFallback/);

  assert.ok(
    countLines(submitScreen) <= 320,
    `EmployeeRequestSubmitScreen.js should stay <= 320 lines (current: ${countLines(submitScreen)})`
  );
  assert.ok(
    countLines(historyScreen) <= 320,
    `EmployeeRequestHistoryScreen.js should stay <= 320 lines (current: ${countLines(historyScreen)})`
  );
  assert.ok(
    countLines(followUpScreen) <= 560,
    `EmployeeRequestFollowUpScreen.js should stay <= 560 lines (current: ${countLines(followUpScreen)})`
  );

  // @ts-expect-error Mobile sub-app baseline currently ships JS modules without d.ts.
  const apiModule = await import("../../apps/mobile/src/lib/employeeRequestApi.js");
  const { fetchEmployeeRequestsFromApi, submitEmployeeRequestToApi } = apiModule;

  const session = {
    baseUrl: "https://flowhr.example.test",
    tenantId: "ORG-DEMO",
    actorId: "EMP-1001",
    role: "EMPLOYEE",
    accessToken: "token-123"
  };

  const getCalls: Array<{ url: string; init: Record<string, unknown> }> = [];
  const fetchGetMock = async (url: string, init: Record<string, unknown>) => {
    getCalls.push({ url, init });
    if (url.includes("/api/leave/requests?")) {
      return jsonResponse({
        requests: [
          {
            id: "LEAVE-1",
            employeeId: "EMP-1001",
            startDate: "2026-02-20T00:00:00.000Z",
            endDate: "2026-02-21T00:00:00.000Z",
            unit: "FULL_DAY",
            hours: null,
            reason: "Annual leave",
            state: "APPROVED",
            approvedAt: "2026-02-19T04:00:00.000Z",
            createdAt: "2026-02-19T03:00:00.000Z",
            updatedAt: "2026-02-19T04:00:00.000Z"
          }
        ]
      });
    }
    if (url.includes("/api/attendance/records?")) {
      return jsonResponse({
        records: [
          {
            id: "ATT-1",
            employeeId: "EMP-1001",
            checkInAt: "2026-02-22T00:00:00.000Z",
            notes: "Missed checkout",
            state: "PENDING",
            createdAt: "2026-02-22T01:00:00.000Z",
            updatedAt: "2026-02-22T01:00:00.000Z"
          }
        ]
      });
    }
    return jsonResponse({ error: { message: "not found" } }, 404);
  };

  const fetched = await fetchEmployeeRequestsFromApi({ session, fetchImpl: fetchGetMock });
  assert.equal(fetched.length, 2);
  assert.equal(fetched[0].requestType, "attendanceCorrection");
  assert.equal(fetched[1].requestType, "leaveRequest");
  assert.ok(getCalls.some((call) => call.url.includes("employeeId=EMP-1001")));
  const headers = getCalls[0]?.init?.headers as Record<string, string>;
  assert.equal(headers["x-actor-role"], "employee");
  assert.equal(headers["x-actor-organization-id"], "ORG-DEMO");

  const postCalls: Array<{ url: string; init: Record<string, unknown> }> = [];
  const fetchPostMock = async (url: string, init: Record<string, unknown>) => {
    postCalls.push({ url, init });
    if (url.endsWith("/api/leave/requests")) {
      return jsonResponse({
        request: {
          id: "LEAVE-2",
          employeeId: "EMP-1001",
          startDate: "2026-03-03T00:00:00.000Z",
          endDate: "2026-03-04T00:00:00.000Z",
          unit: "HALF_DAY",
          hours: null,
          reason: "Leave reason",
          state: "PENDING",
          createdAt: "2026-03-02T09:00:00.000Z",
          updatedAt: "2026-03-02T09:00:00.000Z"
        }
      });
    }
    if (url.endsWith("/api/attendance/records")) {
      return jsonResponse({
        record: {
          id: "ATT-2",
          employeeId: "EMP-1001",
          checkInAt: "2026-03-05T00:00:00.000Z",
          notes: "Attendance correction reason",
          state: "PENDING",
          createdAt: "2026-03-05T09:00:00.000Z",
          updatedAt: "2026-03-05T09:00:00.000Z"
        }
      });
    }
    return jsonResponse({ error: { message: "unexpected endpoint" } }, 404);
  };

  const submittedLeave = await submitEmployeeRequestToApi({
    session,
    draft: {
      requestType: "leaveRequest",
      requestDate: "2026-03-03",
      leaveEndDate: "2026-03-04",
      leaveUnit: "halfDay",
      leaveHours: null,
      reason: "Leave reason",
      note: ""
    },
    fetchImpl: fetchPostMock
  });
  assert.equal(submittedLeave.requestType, "leaveRequest");
  assert.equal(submittedLeave.status, "submitted");

  const submittedAttendance = await submitEmployeeRequestToApi({
    session,
    draft: {
      requestType: "attendanceCorrection",
      requestDate: "2026-03-05",
      reason: "Attendance correction reason",
      note: "manual fix"
    },
    fetchImpl: fetchPostMock
  });
  assert.equal(submittedAttendance.requestType, "attendanceCorrection");
  assert.equal(submittedAttendance.status, "submitted");
  assert.ok(postCalls.some((call) => call.url.endsWith("/api/leave/requests")));
  assert.ok(postCalls.some((call) => call.url.endsWith("/api/attendance/records")));
}

run()
  .then(() => {
    console.log("e2e-wi0521-mobile-employee-request-api-integration-fallback.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
