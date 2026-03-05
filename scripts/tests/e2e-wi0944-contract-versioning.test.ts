import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

function actorHeaders(role: string, actorId: string, organizationId?: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    ...(organizationId ? { "x-actor-organization-id": organizationId } : {})
  };
}

function jsonRequest(method: string, path: string, payload: unknown, headers: Record<string, string>) {
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    body: JSON.stringify(payload)
  });
}

function getRequest(path: string, headers: Record<string, string>) {
  return new Request(`http://localhost${path}`, {
    method: "GET",
    headers
  });
}

function computeDocumentHash(input: {
  templateId: string;
  templateVersion: number;
  employeeId: string;
  title: string;
  templateBody: string;
}) {
  return createHash("sha256")
    .update(
      [
        input.templateId,
        String(input.templateVersion),
        input.employeeId,
        input.title,
        input.templateBody
      ].join("|"),
      "utf8"
    )
    .digest("hex");
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const templateRoute = await import("../../src/app/api/contracts/templates/route.ts");
  const templatePatchRoute = await import("../../src/app/api/contracts/templates/[templateId]/route.ts");
  const templateVersionsRoute = await import(
    "../../src/app/api/contracts/templates/[templateId]/versions/route.ts"
  );
  const templateVersionRoute = await import(
    "../../src/app/api/contracts/templates/[templateId]/versions/[version]/route.ts"
  );
  const documentsRoute = await import("../../src/app/api/contracts/documents/route.ts");
  const sendRoute = await import("../../src/app/api/contracts/documents/[documentId]/send/route.ts");
  const respondRoute = await import(
    "../../src/app/api/contracts/documents/[documentId]/respond/route.ts"
  );

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0944 Org" });
  const employeeId = "EMP-WI0944-1001";
  await memoryDataAccess.employees.create({
    id: employeeId,
    organizationId: organization.id,
    name: "Employee WI0944"
  });

  const adminHeaders = actorHeaders("admin", "ADM-WI0944-1001", organization.id);
  const employeeHeaders = actorHeaders("employee", employeeId, organization.id);

  const templateBodyV1 = "Employment clause v1";
  const templateBodyV2 = "Employment clause v2";
  const documentTitle = "Contract V1 Sign";

  const createTemplateResponse = await templateRoute.POST(
    jsonRequest(
      "POST",
      "/api/contracts/templates",
      {
        name: "Employment Template WI0944",
        category: "employment",
        body: templateBodyV1,
        status: "ACTIVE"
      },
      adminHeaders
    )
  );
  assert.equal(createTemplateResponse.status, 201);
  const createTemplateBody = await readJson<{ template: { id: string; version: number } }>(
    createTemplateResponse
  );
  const templateId = createTemplateBody.template.id;
  assert.equal(createTemplateBody.template.version, 1);

  const createDocumentResponse = await documentsRoute.POST(
    jsonRequest(
      "POST",
      "/api/contracts/documents",
      {
        templateId,
        employeeId,
        title: documentTitle,
        requiresApproval: false
      },
      adminHeaders
    )
  );
  assert.equal(createDocumentResponse.status, 201);
  const createDocumentBody = await readJson<{ document: { id: string; documentHash: string } }>(
    createDocumentResponse
  );
  const documentId = createDocumentBody.document.id;

  const sendDocumentResponse = await sendRoute.POST(
    jsonRequest("POST", `/api/contracts/documents/${documentId}/send`, {}, adminHeaders),
    { params: Promise.resolve({ documentId }) } as RouteContext<{ documentId: string }>
  );
  assert.equal(sendDocumentResponse.status, 200);

  const signResponse = await respondRoute.POST(
    jsonRequest(
      "POST",
      `/api/contracts/documents/${documentId}/respond`,
      {
        action: "SIGN",
        signatureInput: "employee-signature-wi0944",
        expectedDocumentHash: createDocumentBody.document.documentHash
      },
      employeeHeaders
    ),
    { params: Promise.resolve({ documentId }) } as RouteContext<{ documentId: string }>
  );
  assert.equal(signResponse.status, 200);

  const updateTemplateResponse = await templatePatchRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/contracts/templates/${templateId}`,
      {
        body: templateBodyV2
      },
      adminHeaders
    ),
    { params: Promise.resolve({ templateId }) } as RouteContext<{ templateId: string }>
  );
  assert.equal(updateTemplateResponse.status, 200);
  const updateTemplateBody = await readJson<{ template: { version: number; body: string } }>(
    updateTemplateResponse
  );
  assert.equal(updateTemplateBody.template.version, 2);
  assert.equal(updateTemplateBody.template.body, templateBodyV2);

  const listVersionsResponse = await templateVersionsRoute.GET(
    getRequest(`/api/contracts/templates/${templateId}/versions`, adminHeaders),
    { params: Promise.resolve({ templateId }) } as RouteContext<{ templateId: string }>
  );
  assert.equal(listVersionsResponse.status, 200);
  const listVersionsBody = await readJson<
    Array<{ version: number; content: string; modifiedAt: string; modifiedBy: string }>
  >(listVersionsResponse);
  assert.deepEqual(
    listVersionsBody.map((row) => row.version),
    [2, 1]
  );
  assert.equal(listVersionsBody[0]?.content, templateBodyV2);
  assert.equal(listVersionsBody[1]?.content, templateBodyV1);

  const getVersionOneResponse = await templateVersionRoute.GET(
    getRequest(`/api/contracts/templates/${templateId}/versions/1`, adminHeaders),
    { params: Promise.resolve({ templateId, version: "1" }) } as RouteContext<{
      templateId: string;
      version: string;
    }>
  );
  assert.equal(getVersionOneResponse.status, 200);
  const getVersionOneBody = await readJson<{
    version: number;
    content: string;
    modifiedAt: string;
    modifiedBy: string;
  }>(getVersionOneResponse);
  assert.equal(getVersionOneBody.version, 1);
  assert.equal(getVersionOneBody.content, templateBodyV1);

  const listDocumentsResponse = await documentsRoute.GET(
    getRequest("/api/contracts/documents", adminHeaders)
  );
  assert.equal(listDocumentsResponse.status, 200);
  const listDocumentsBody = await readJson<{
    documents: Array<{
      id: string;
      templateVersion: number;
      documentHash: string;
      status: string;
    }>;
  }>(listDocumentsResponse);
  const signedDocument = listDocumentsBody.documents.find((document) => document.id === documentId);
  assert.ok(signedDocument, "signed contract should exist");
  assert.equal(signedDocument?.status, "SIGNED");
  assert.equal(signedDocument?.templateVersion, 1);
  assert.equal(
    signedDocument?.documentHash,
    computeDocumentHash({
      templateId,
      templateVersion: 1,
      employeeId,
      title: documentTitle,
      templateBody: templateBodyV1
    })
  );

  const employeeListVersionsResponse = await templateVersionsRoute.GET(
    getRequest(`/api/contracts/templates/${templateId}/versions`, employeeHeaders),
    { params: Promise.resolve({ templateId }) } as RouteContext<{ templateId: string }>
  );
  assert.equal(employeeListVersionsResponse.status, 403);

  const employeeVersionResponse = await templateVersionRoute.GET(
    getRequest(`/api/contracts/templates/${templateId}/versions/1`, employeeHeaders),
    { params: Promise.resolve({ templateId, version: "1" }) } as RouteContext<{
      templateId: string;
      version: string;
    }>
  );
  assert.equal(employeeVersionResponse.status, 403);
}

run()
  .then(() => {
    console.log("e2e-wi0944-contract-versioning.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
