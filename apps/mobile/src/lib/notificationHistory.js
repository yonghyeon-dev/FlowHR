function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function hasArchive(item) {
  return Boolean(item?.archivedAt);
}

function matchesReadState(item, readState) {
  if (readState === "read") {
    return Boolean(item?.read);
  }
  if (readState === "unread") {
    return !item?.read;
  }
  return true;
}

function matchesArchiveState(item, archiveState) {
  if (archiveState === "archived") {
    return hasArchive(item);
  }
  if (archiveState === "active") {
    return !hasArchive(item);
  }
  return true;
}

function matchesCategory(item, category) {
  if (!category || category === "all") {
    return true;
  }
  return item?.category === category;
}

function matchesQuery(item, query) {
  const normalized = normalizeText(query);
  if (!normalized) {
    return true;
  }
  const haystack = normalizeText(`${item?.title ?? ""} ${item?.body ?? ""}`);
  return haystack.includes(normalized);
}

export function filterNotificationHistory(items, options = {}) {
  const { query = "", category = "all", readState = "all", archiveState = "all" } = options;
  return items.filter(
    (item) =>
      matchesCategory(item, category) &&
      matchesReadState(item, readState) &&
      matchesArchiveState(item, archiveState) &&
      matchesQuery(item, query)
  );
}

export function buildNotificationHistoryStats(items) {
  let active = 0;
  let archived = 0;
  let unread = 0;
  for (const item of items) {
    if (hasArchive(item)) {
      archived += 1;
    } else {
      active += 1;
    }
    if (!item.read) {
      unread += 1;
    }
  }
  return {
    total: items.length,
    active,
    archived,
    unread
  };
}

export function toggleNotificationArchive(items, notificationId, archived, now = new Date()) {
  const stamp = archived ? now.toISOString() : null;
  return items.map((item) => {
    if (item.id !== notificationId) {
      return item;
    }
    return {
      ...item,
      archivedAt: stamp
    };
  });
}

