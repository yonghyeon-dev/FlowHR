import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function actorHeaders(role: string, actorId: string, organizationId?: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId
  };
  if (organizationId) {
    headers["x-actor-organization-id"] = organizationId;
  }
  return headers;
}

function jsonRequest(method: string, urlPath: string, payload: unknown, headers: Record<string, string>) {
  return new Request(`http://localhost${urlPath}`, {
    method,
    headers,
    body: JSON.stringify(payload)
  });
}

function getRequest(urlPath: string, headers: Record<string, string>) {
  return new Request(`http://localhost${urlPath}`, {
    method: "GET",
    headers
  });
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import("../../src/features/shared/memory-data-access.ts");

  const templateRoute = await import("../../src/app/api/contracts/templates/route.ts");
  const templatePatchRoute = await import("../../src/app/api/contracts/templates/[templateId]/route.ts");
  const documentRoute = await import("../../src/app/api/contracts/documents/route.ts");
  const requestApprovalRoute = await import("../../src/app/api/contracts/documents/[documentId]/request-approval/route.ts");
  const approvalRoute = await import("../../src/app/api/contracts/documents/[documentId]/approval/route.ts");
  const sendRoute = await import("../../src/app/api/contracts/documents/[documentId]/send/route.ts");
  const respondRoute = await import("../../src/app/api/contracts/documents/[documentId]/respond/route.ts");
  const expireRoute = await import("../../src/app/api/contracts/documents/[documentId]/expire/route.ts");
  const renewRoute = await import("../../src/app/api/contracts/documents/[documentId]/renew/route.ts");

  resetMemoryDataAccess();

  const contractsApiSpec = readUtf8("specs", "contracts", "api.yaml");
  const contractsContract = readUtf8("specs", "contracts", "contract.yaml");
  const contractsTestCases = readUtf8("specs", "contracts", "test-cases.md");
  assert.match(contractsApiSpec, /\/contracts\/templates/);
  assert.match(contractsApiSpec, /\/contracts\/documents\/\{documentId\}\/respond/);
  assert.match(contractsContract, /signature hash evidence/i);
  assert.match(contractsTestCases, /Renew operation/);

  const organization = await memoryDataAccess.organizations.create({ name: "Org Contracts" });
  await memoryDataAccess.employees.create({ id: "EMP-CONTRACT-A", organizationId: organization.id, name: "Employee A" });
  await memoryDataAccess.employees.create({ id: "EMP-CONTRACT-B", organizationId: organization.id, name: "Employee B" });

  const createTemplateResponse = await templateRoute.POST(
    jsonRequest(
      "POST",
      "/api/contracts/templates",
      {
        name: "Employment KR",
        category: "employment",
        body: "base clause"
      },
      actorHeaders("admin", "ADMIN-CONTRACT", organization.id)
    )
  );
  assert.equal(createTemplateResponse.status, 201);
  const createTemplateBody = await readJson<{ template: { id: string; version: number } }>(createTemplateResponse);
  assert.equal(createTemplateBody.template.version, 1);

  const archiveTargetResponse = await templateRoute.POST(
    jsonRequest(
      "POST",
      "/api/contracts/templates",
      {
        name: "Archive Target",
        category: "nda",
        body: "archive me"
      },
      actorHeaders("admin", "ADMIN-CONTRACT", organization.id)
    )
  );
  assert.equal(archiveTargetResponse.status, 201);
  const archiveTargetBody = await readJson<{ template: { id: string } }>(archiveTargetResponse);
  const archiveTargetId = archiveTargetBody.template.id;

  const archiveResponse = await templatePatchRoute.DELETE(
    new Request(`http://localhost/api/contracts/templates/${archiveTargetId}`, {
      method: "DELETE",
      headers: actorHeaders("admin", "ADMIN-CONTRACT", organization.id)
    }),
    {
      params: Promise.resolve({ templateId: archiveTargetId })
    }
  );
  assert.equal(archiveResponse.status, 200);
  const archiveBody = await readJson<{ template: { id: string; isArchived: boolean } }>(archiveResponse);
  assert.equal(archiveBody.template.id, archiveTargetId);
  assert.equal(archiveBody.template.isArchived, true);

  const listTemplatesAfterArchiveResponse = await templateRoute.GET(
    getRequest("/api/contracts/templates", actorHeaders("admin", "ADMIN-CONTRACT", organization.id))
  );
  assert.equal(listTemplatesAfterArchiveResponse.status, 200);
  const listTemplatesAfterArchiveBody = await readJson<{
    templates: Array<{ id: string; isArchived: boolean }>;
  }>(listTemplatesAfterArchiveResponse);
  assert.ok(
    listTemplatesAfterArchiveBody.templates.every((template) => template.id !== archiveTargetId)
  );
  assert.ok(listTemplatesAfterArchiveBody.templates.every((template) => template.isArchived === false));

  const archiveMissingResponse = await templatePatchRoute.DELETE(
    new Request("http://localhost/api/contracts/templates/CT-UNKNOWN", {
      method: "DELETE",
      headers: actorHeaders("admin", "ADMIN-CONTRACT", organization.id)
    }),
    {
      params: Promise.resolve({ templateId: "CT-UNKNOWN" })
    }
  );
  assert.equal(archiveMissingResponse.status, 404);

  const updateTemplateResponse = await templatePatchRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/contracts/templates/${createTemplateBody.template.id}`,
      {
        body: "base clause updated"
      },
      actorHeaders("admin", "ADMIN-CONTRACT", organization.id)
    ),
    {
      params: Promise.resolve({ templateId: createTemplateBody.template.id })
    }
  );
  assert.equal(updateTemplateResponse.status, 200);
  const updateTemplateBody = await readJson<{ template: { version: number } }>(updateTemplateResponse);
  assert.equal(updateTemplateBody.template.version, 2);

  const createDocumentResponse = await documentRoute.POST(
    jsonRequest(
      "POST",
      "/api/contracts/documents",
      {
        templateId: createTemplateBody.template.id,
        employeeId: "EMP-CONTRACT-A",
        title: "Contract A"
      },
      actorHeaders("admin", "ADMIN-CONTRACT", organization.id)
    )
  );
  assert.equal(createDocumentResponse.status, 201);
  const createDocumentBody = await readJson<{ document: { id: string; documentHash: string } }>(createDocumentResponse);
  const documentId = createDocumentBody.document.id;

  const sendBeforeApprovalResponse = await sendRoute.POST(
    jsonRequest("POST", `/api/contracts/documents/${documentId}/send`, {}, actorHeaders("admin", "ADMIN-CONTRACT", organization.id)),
    {
      params: Promise.resolve({ documentId })
    }
  );
  assert.equal(sendBeforeApprovalResponse.status, 409);

  const requestApprovalResponse = await requestApprovalRoute.POST(
    jsonRequest(
      "POST",
      `/api/contracts/documents/${documentId}/request-approval`,
      {},
      actorHeaders("admin", "ADMIN-CONTRACT", organization.id)
    ),
    {
      params: Promise.resolve({ documentId })
    }
  );
  assert.equal(requestApprovalResponse.status, 200);

  const rejectApprovalResponse = await approvalRoute.POST(
    jsonRequest(
      "POST",
      `/api/contracts/documents/${documentId}/approval`,
      { action: "REJECT" },
      actorHeaders("payroll_operator", "PAYROLL-CONTRACT", organization.id)
    ),
    {
      params: Promise.resolve({ documentId })
    }
  );
  assert.equal(rejectApprovalResponse.status, 200);
  const rejectApprovalBody = await readJson<{ document: { status: string; approvalStatus: string } }>(rejectApprovalResponse);
  assert.equal(rejectApprovalBody.document.status, "DRAFT");
  assert.equal(rejectApprovalBody.document.approvalStatus, "REJECTED");

  const requestApprovalAgainResponse = await requestApprovalRoute.POST(
    jsonRequest(
      "POST",
      `/api/contracts/documents/${documentId}/request-approval`,
      {},
      actorHeaders("admin", "ADMIN-CONTRACT", organization.id)
    ),
    {
      params: Promise.resolve({ documentId })
    }
  );
  assert.equal(requestApprovalAgainResponse.status, 200);

  const approveResponse = await approvalRoute.POST(
    jsonRequest(
      "POST",
      `/api/contracts/documents/${documentId}/approval`,
      { action: "APPROVE" },
      actorHeaders("payroll_operator", "PAYROLL-CONTRACT", organization.id)
    ),
    {
      params: Promise.resolve({ documentId })
    }
  );
  assert.equal(approveResponse.status, 200);
  const approveBody = await readJson<{ document: { status: string; approvalStatus: string } }>(approveResponse);
  assert.equal(approveBody.document.status, "DRAFT");
  assert.equal(approveBody.document.approvalStatus, "APPROVED");

  const sendApprovedResponse = await sendRoute.POST(
    jsonRequest("POST", `/api/contracts/documents/${documentId}/send`, {}, actorHeaders("admin", "ADMIN-CONTRACT", organization.id)),
    {
      params: Promise.resolve({ documentId })
    }
  );
  assert.equal(sendApprovedResponse.status, 200);

  const createDocumentBResponse = await documentRoute.POST(
    jsonRequest(
      "POST",
      "/api/contracts/documents",
      {
        templateId: createTemplateBody.template.id,
        employeeId: "EMP-CONTRACT-B",
        title: "Contract B",
        requiresApproval: false
      },
      actorHeaders("admin", "ADMIN-CONTRACT", organization.id)
    )
  );
  assert.equal(createDocumentBResponse.status, 201);
  const createDocumentBBody = await readJson<{ document: { id: string } }>(createDocumentBResponse);
  const documentBId = createDocumentBBody.document.id;

  const sendDocumentBResponse = await sendRoute.POST(
    jsonRequest("POST", `/api/contracts/documents/${documentBId}/send`, {}, actorHeaders("admin", "ADMIN-CONTRACT", organization.id)),
    {
      params: Promise.resolve({ documentId: documentBId })
    }
  );
  assert.equal(sendDocumentBResponse.status, 200);

  const employeeAOwnListResponse = await documentRoute.GET(
    getRequest("/api/contracts/documents", actorHeaders("employee", "EMP-CONTRACT-A", organization.id))
  );
  assert.equal(employeeAOwnListResponse.status, 200);
  const employeeAOwnListBody = await readJson<{ documents: Array<{ employeeId: string; id: string }> }>(employeeAOwnListResponse);
  assert.ok(employeeAOwnListBody.documents.every((row) => row.employeeId === "EMP-CONTRACT-A"));

  const employeeARespondOtherResponse = await respondRoute.POST(
    jsonRequest(
      "POST",
      `/api/contracts/documents/${documentBId}/respond`,
      {
        action: "REJECT",
        expectedDocumentHash: "0".repeat(64)
      },
      actorHeaders("employee", "EMP-CONTRACT-A", organization.id)
    ),
    {
      params: Promise.resolve({ documentId: documentBId })
    }
  );
  assert.equal(employeeARespondOtherResponse.status, 403);

  const employeeASignMismatchResponse = await respondRoute.POST(
    jsonRequest(
      "POST",
      `/api/contracts/documents/${documentId}/respond`,
      {
        action: "SIGN",
        signatureInput: "employee-a-signature",
        expectedDocumentHash: "f".repeat(64)
      },
      actorHeaders("employee", "EMP-CONTRACT-A", organization.id)
    ),
    {
      params: Promise.resolve({ documentId })
    }
  );
  assert.equal(employeeASignMismatchResponse.status, 409);

  const employeeASignResponse = await respondRoute.POST(
    jsonRequest(
      "POST",
      `/api/contracts/documents/${documentId}/respond`,
      {
        action: "SIGN",
        signatureInput: "employee-a-signature",
        expectedDocumentHash: createDocumentBody.document.documentHash
      },
      actorHeaders("employee", "EMP-CONTRACT-A", organization.id)
    ),
    {
      params: Promise.resolve({ documentId })
    }
  );
  assert.equal(employeeASignResponse.status, 200);
  const employeeASignBody = await readJson<{ document: { status: string; signatureHash: string; signatureEvidenceHash: string } }>(employeeASignResponse);
  assert.equal(employeeASignBody.document.status, "SIGNED");
  assert.equal(employeeASignBody.document.signatureHash.length, 64);
  assert.equal(employeeASignBody.document.signatureEvidenceHash.length, 64);

  const expireDocumentBResponse = await expireRoute.POST(
    jsonRequest(
      "POST",
      `/api/contracts/documents/${documentBId}/expire`,
      { reason: "manual expire for renewal" },
      actorHeaders("admin", "ADMIN-CONTRACT", organization.id)
    ),
    {
      params: Promise.resolve({ documentId: documentBId })
    }
  );
  assert.equal(expireDocumentBResponse.status, 200);
  const expireDocumentBBody = await readJson<{ document: { status: string } }>(expireDocumentBResponse);
  assert.equal(expireDocumentBBody.document.status, "EXPIRED");

  const renewDocumentBResponse = await renewRoute.POST(
    jsonRequest(
      "POST",
      `/api/contracts/documents/${documentBId}/renew`,
      {},
      actorHeaders("admin", "ADMIN-CONTRACT", organization.id)
    ),
    {
      params: Promise.resolve({ documentId: documentBId })
    }
  );
  assert.equal(renewDocumentBResponse.status, 200);
  const renewDocumentBBody = await readJson<{ sourceDocument: { status: string }; renewedDocument: { status: string; renewalOfDocumentId: string | null } }>(renewDocumentBResponse);
  assert.equal(renewDocumentBBody.sourceDocument.status, "RENEWED");
  assert.equal(renewDocumentBBody.renewedDocument.status, "DRAFT");
  assert.equal(renewDocumentBBody.renewedDocument.renewalOfDocumentId, documentBId);
}

run()
  .then(() => {
    console.log("e2e-wi0276-0281-contract-lifecycle-bundle.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
