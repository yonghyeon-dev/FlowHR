# Domain Event Transport Rollout

## Purpose

FlowHR publishes domain events from service layer.  
Runtime transport is selected by `FLOWHR_EVENT_PUBLISHER`.

## Modes

- `noop`: drop events (default safe mode)
- `memory`: keep events in in-process memory (tests/local verification)
- `http`: POST events to external endpoint

## HTTP Transport Contract

- Method: `POST`
- Content-Type: `application/json`
- Header:
  - `x-flowhr-event-name: <event-name>`
  - `authorization: Bearer <token>` (optional)
- Body:

```json
{
  "specVersion": "flowhr.domain-event.v1",
  "event": {
    "name": "attendance.recorded.v1",
    "occurredAt": "2026-02-13T00:00:00.000Z",
    "entityType": "AttendanceRecord"
  }
}
```

## Environment Variables

- `FLOWHR_EVENT_PUBLISHER` = `noop|memory|http`
- `FLOWHR_EVENT_HTTP_URL` (required for `http`)
- `FLOWHR_EVENT_HTTP_TOKEN` (optional)
- `FLOWHR_EVENT_HTTP_TIMEOUT_MS` (optional, default `3000`)
- `FLOWHR_EVENT_HTTP_RETRY_COUNT` (optional, default `2`)
- `FLOWHR_EVENT_HTTP_FAIL_OPEN` (optional, default `true`)

## Fallback Policy

- `fail-open=true`:
  - delivery failure logs error and does not break business API flow
- `fail-open=false`:
  - delivery failure throws error and blocks API completion

Recommendation:

- start with `fail-open=true` in initial rollout
- switch to `fail-open=false` only after receiver SLO and replay path are validated

## Rollout Steps

1. Deploy receiver endpoint in staging.
2. Set staging env:
   - `FLOWHR_EVENT_PUBLISHER=http`
   - `FLOWHR_EVENT_HTTP_URL=<staging-endpoint>`
   - token/timeout/retry values
3. Verify:
   - HTTP 2xx ratio
   - payload schema compatibility
   - duplicate/retry handling in receiver
4. Promote to production with `fail-open=true`.
5. Tighten policy (`fail-open=false`) only after 안정화.
