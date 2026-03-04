import { createContractTemplate, listContractTemplates } from "@/features/contracts/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type DefaultTemplateCode = "PERMANENT" | "CONTRACT" | "INTERN";

type DefaultTemplateSeedDefinition = {
  code: DefaultTemplateCode;
  name: string;
  body: string;
};

const DEFAULT_TEMPLATE_SEED_DEFINITIONS: DefaultTemplateSeedDefinition[] = [
  {
    code: "PERMANENT",
    name: "정규직 근로계약서 (PERMANENT)",
    body: [
      "제1조 (근무 장소)",
      "- 근무 장소: {{workplace}}",
      "",
      "제2조 (업무 내용)",
      "- 담당 업무: {{job_description}}",
      "",
      "제3조 (근무 시간)",
      "- 근무 시간: {{working_hours}}",
      "",
      "제4조 (급여)",
      "- 급여: {{salary}}",
      "",
      "제5조 (휴가)",
      "- 휴가: 근로기준법 및 취업규칙에 따름",
      "",
      "제6조 (계약 기간)",
      "- 계약 기간: 기간의 정함이 없는 근로계약"
    ].join("\n")
  },
  {
    code: "CONTRACT",
    name: "계약직 근로계약서 (CONTRACT)",
    body: [
      "제1조 (근무 장소)",
      "- 근무 장소: {{workplace}}",
      "",
      "제2조 (업무 내용)",
      "- 담당 업무: {{job_description}}",
      "",
      "제3조 (근무 시간)",
      "- 근무 시간: {{working_hours}}",
      "",
      "제4조 (급여)",
      "- 급여: {{salary}}",
      "",
      "제5조 (휴가)",
      "- 휴가: 근로기준법 및 취업규칙에 따름",
      "",
      "제6조 (계약 기간)",
      "- 계약 기간: {{contract_start_date}} ~ {{contract_end_date}}"
    ].join("\n")
  },
  {
    code: "INTERN",
    name: "인턴 근로계약서 (INTERN)",
    body: [
      "제1조 (근무 장소)",
      "- 근무 장소: {{workplace}}",
      "",
      "제2조 (업무 내용)",
      "- 담당 업무: {{job_description}}",
      "",
      "제3조 (근무 시간)",
      "- 근무 시간: {{working_hours}}",
      "",
      "제4조 (급여)",
      "- 급여: {{salary}}",
      "",
      "제5조 (휴가)",
      "- 휴가: 근로기준법 및 취업규칙에 따름",
      "",
      "제6조 (계약 기간)",
      "- 계약 기간: {{internship_start_date}} ~ {{internship_end_date}}"
    ].join("\n")
  }
];

function normalizeTemplateName(value: string) {
  return value.trim().toLocaleLowerCase("ko-KR");
}

export async function POST(request: Request) {
  const actor = await readActor(request);
  if (!actor) {
    return fail(401, "contracts.templates.seed_defaults.unauthorized");
  }
  if (actor.role !== "admin") {
    return fail(403, "contracts.templates.seed_defaults.forbidden", {
      reason: "admin_required"
    });
  }

  const organizationId = actor.organizationId?.trim() ?? "";
  if (!organizationId) {
    return fail(400, "contracts.templates.seed_defaults.organization_id_required");
  }

  const context = {
    actor,
    dataAccess: getRuntimeDataAccess()
  };

  try {
    const existing = await listContractTemplates(context, { organizationId });
    const existingNameSet = new Set(existing.templates.map((template) => normalizeTemplateName(template.name)));

    const createdCodes: DefaultTemplateCode[] = [];
    const skippedCodes: DefaultTemplateCode[] = [];

    for (const definition of DEFAULT_TEMPLATE_SEED_DEFINITIONS) {
      if (existingNameSet.has(normalizeTemplateName(definition.name))) {
        skippedCodes.push(definition.code);
        continue;
      }

      await createContractTemplate(context, {
        organizationId,
        name: definition.name,
        category: "employment",
        body: definition.body,
        status: "ACTIVE"
      });
      existingNameSet.add(normalizeTemplateName(definition.name));
      createdCodes.push(definition.code);
    }

    const afterSeed = await listContractTemplates(context, { organizationId });
    const seededNames = new Set(
      DEFAULT_TEMPLATE_SEED_DEFINITIONS.map((definition) => normalizeTemplateName(definition.name))
    );
    const seededTemplates = afterSeed.templates.filter((template) =>
      seededNames.has(normalizeTemplateName(template.name))
    );

    return ok({
      organizationId,
      summary: {
        createdCount: createdCodes.length,
        skippedCount: skippedCodes.length,
        totalSeededTemplates: seededTemplates.length
      },
      createdCodes,
      skippedCodes,
      templates: seededTemplates
    });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
