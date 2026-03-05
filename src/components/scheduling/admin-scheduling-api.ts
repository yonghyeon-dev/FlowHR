import { extractErrorMessage, parseResponseBody } from "@/components/scheduling/helpers";

type BuildAdminSchedulingHeadersInput = {
  payloadIncluded: boolean;
  usesBearerToken: boolean;
  bearerToken: string;
  adminActorId: string;
  organizationId: string;
};

export function buildAdminSchedulingHeaders(input: BuildAdminSchedulingHeadersInput) {
  const headers: Record<string, string> = {};
  if (input.payloadIncluded) {
    headers["content-type"] = "application/json";
  }
  if (input.usesBearerToken) {
    headers.authorization = `Bearer ${input.bearerToken}`;
  } else {
    headers["x-actor-role"] = "admin";
    headers["x-actor-id"] = input.adminActorId.trim() || "ADM-1001";
    if (input.organizationId.trim()) {
      headers["x-actor-organization-id"] = input.organizationId.trim();
    }
  }
  return headers;
}

export async function requestSeedDefaultsAvailability(input: {
  usesBearerToken: boolean;
  bearerToken: string;
  adminActorId: string;
  organizationId: string;
  isKoLocale: boolean;
}) {
  const response = await fetch("/api/scheduling/schedules/seed-defaults", {
    method: "GET",
    headers: buildAdminSchedulingHeaders({
      payloadIncluded: false,
      usesBearerToken: input.usesBearerToken,
      bearerToken: input.bearerToken,
      adminActorId: input.adminActorId,
      organizationId: input.organizationId
    })
  });
  const body = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(extractErrorMessage(body, input.isKoLocale));
  }
  return Boolean((body as { showSeedDefaultsAction?: unknown } | null)?.showSeedDefaultsAction);
}
