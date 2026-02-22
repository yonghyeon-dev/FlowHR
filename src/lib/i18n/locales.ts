export const SUPPORTED_LOCALES = ["ko", "en"] as const;

export type FlowLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: FlowLocale = "ko";

export function normalizeLocale(value: string | null | undefined): FlowLocale | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().replace("_", "-").toLowerCase();
  for (const locale of SUPPORTED_LOCALES) {
    if (normalized === locale || normalized.startsWith(`${locale}-`)) {
      return locale;
    }
  }
  return null;
}

type WeightedLanguage = {
  tag: string;
  weight: number;
  index: number;
};

function parseAcceptLanguage(headerValue: string): WeightedLanguage[] {
  return headerValue
    .split(",")
    .map((part, index) => {
      const [tagPart, ...paramParts] = part.trim().split(";");
      const tag = tagPart.trim();
      if (!tag) {
        return null;
      }

      let weight = 1;
      for (const param of paramParts) {
        const [key, rawValue] = param.trim().split("=");
        if (key?.trim().toLowerCase() !== "q") {
          continue;
        }
        const parsed = Number(rawValue);
        if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
          weight = parsed;
        }
      }

      return { tag, weight, index } satisfies WeightedLanguage;
    })
    .filter((entry): entry is WeightedLanguage => entry !== null)
    .sort((left, right) => {
      if (left.weight !== right.weight) {
        return right.weight - left.weight;
      }
      return left.index - right.index;
    });
}

export function resolveLocaleFromAcceptLanguage(
  headerValue: string | null | undefined
): FlowLocale {
  if (!headerValue) {
    return DEFAULT_LOCALE;
  }

  const candidates = parseAcceptLanguage(headerValue);
  for (const candidate of candidates) {
    const locale = normalizeLocale(candidate.tag);
    if (locale) {
      return locale;
    }
  }

  return DEFAULT_LOCALE;
}
