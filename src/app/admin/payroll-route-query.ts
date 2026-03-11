type SearchParamsRecord = Record<string, string | string[] | undefined>;

function appendSearchParam(
  nextParams: URLSearchParams,
  key: string,
  value: string | string[] | undefined
) {
  if (typeof value === "string") {
    nextParams.append(key, value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      nextParams.append(key, item);
    }
  }
}

export function getFirstSearchParamValue(
  searchParams: SearchParamsRecord,
  key: string
) {
  const value = searchParams[key];
  if (typeof value === "string") {
    return value;
  }
  return Array.isArray(value) ? (value[0] ?? null) : null;
}

export function buildRedirectHref(
  pathname: string,
  searchParams: SearchParamsRecord,
  omittedKeys: string[]
) {
  const nextParams = new URLSearchParams();
  const omittedKeySet = new Set(omittedKeys);

  for (const [key, value] of Object.entries(searchParams)) {
    if (omittedKeySet.has(key)) {
      continue;
    }
    appendSearchParam(nextParams, key, value);
  }

  const queryString = nextParams.toString();
  return queryString.length > 0 ? `${pathname}?${queryString}` : pathname;
}
