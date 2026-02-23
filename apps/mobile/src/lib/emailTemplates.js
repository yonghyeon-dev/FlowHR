const TEMPLATE_CATALOG = [
  {
    id: "approval-request",
    title: "승인 요청 안내",
    category: "approval",
    variables: ["employeeName", "organizationName", "actionLabel", "deepLink"],
    locales: {
      ko: {
        subject: "[{{organizationName}}] {{employeeName}} 님의 {{actionLabel}} 승인 요청",
        body: [
          "{{employeeName}} 님 안녕하세요.",
          "",
          "{{actionLabel}} 요청이 접수되어 승인 대기 상태입니다.",
          "아래 링크에서 상세 내용을 확인할 수 있습니다.",
          "{{deepLink}}",
          "",
          "FlowHR 팀 드림"
        ].join("\n")
      },
      en: {
        subject: "[{{organizationName}}] {{employeeName}} {{actionLabel}} approval request",
        body: [
          "Hi {{employeeName}},",
          "",
          "Your {{actionLabel}} request has been submitted and is waiting for approval.",
          "Open the link below to review details:",
          "{{deepLink}}",
          "",
          "Best regards,",
          "FlowHR Team"
        ].join("\n")
      }
    }
  },
  {
    id: "approval-result",
    title: "승인 결과 안내",
    category: "approval",
    variables: ["employeeName", "organizationName", "actionLabel", "deepLink"],
    locales: {
      ko: {
        subject: "[{{organizationName}}] {{actionLabel}} 처리 결과 안내",
        body: [
          "{{employeeName}} 님 안녕하세요.",
          "",
          "{{actionLabel}} 요청 처리 결과가 업데이트되었습니다.",
          "아래 링크에서 처리 상태를 확인해 주세요.",
          "{{deepLink}}",
          "",
          "FlowHR 팀 드림"
        ].join("\n")
      },
      en: {
        subject: "[{{organizationName}}] {{actionLabel}} request status updated",
        body: [
          "Hi {{employeeName}},",
          "",
          "Your {{actionLabel}} request status has been updated.",
          "Please check details from the link below:",
          "{{deepLink}}",
          "",
          "Best regards,",
          "FlowHR Team"
        ].join("\n")
      }
    }
  },
  {
    id: "payslip-ready",
    title: "명세서 발행 안내",
    category: "payroll",
    variables: ["employeeName", "organizationName", "actionLabel", "deepLink"],
    locales: {
      ko: {
        subject: "[{{organizationName}}] {{actionLabel}} 명세서가 발행되었습니다",
        body: [
          "{{employeeName}} 님 안녕하세요.",
          "",
          "{{actionLabel}} 명세서가 발행되었습니다.",
          "아래 링크에서 확인 및 수령 확인을 진행해 주세요.",
          "{{deepLink}}",
          "",
          "FlowHR 팀 드림"
        ].join("\n")
      },
      en: {
        subject: "[{{organizationName}}] {{actionLabel}} payslip is ready",
        body: [
          "Hi {{employeeName}},",
          "",
          "Your {{actionLabel}} payslip is now available.",
          "Please open the link below to review and acknowledge receipt:",
          "{{deepLink}}",
          "",
          "Best regards,",
          "FlowHR Team"
        ].join("\n")
      }
    }
  }
];

const PLACEHOLDER_RE = /\{\{(\w+)\}\}/g;

function getLocaleTemplate(template, locale) {
  return template.locales[locale] ?? template.locales.ko;
}

function interpolate(text, variables) {
  return text.replace(PLACEHOLDER_RE, (_, key) => {
    const value = variables[key];
    return value == null ? "" : String(value);
  });
}

function unique(values) {
  return Array.from(new Set(values));
}

export function listEmailTemplates() {
  return TEMPLATE_CATALOG.map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    variables: [...item.variables]
  }));
}

export function getEmailTemplate(templateId) {
  return TEMPLATE_CATALOG.find((item) => item.id === templateId) ?? TEMPLATE_CATALOG[0];
}

export function missingTemplateVariables(template, values) {
  return template.variables.filter((key) => !String(values[key] ?? "").trim());
}

export function renderEmailTemplate({ templateId, locale, variables }) {
  const template = getEmailTemplate(templateId);
  const localized = getLocaleTemplate(template, locale);
  const missing = missingTemplateVariables(template, variables);
  return {
    templateId: template.id,
    title: template.title,
    locale: locale === "en" ? "en" : "ko",
    variables: unique(template.variables),
    missingVariables: missing,
    subject: interpolate(localized.subject, variables),
    body: interpolate(localized.body, variables)
  };
}
