"use client";

import { useCallback, useEffect, useState } from "react";

type StickySerializer<T> = {
  serialize(value: T): string;
  deserialize(raw: string): T;
};

// LocalStorage-backed state for small UX conveniences (tenant/actor ids, filters, etc).
// - Reads once on mount.
// - Writes only when setter is used (prevents mount-time overwrites).
export function useStickyState<T>(
  key: string,
  defaultValue: T,
  serializer: StickySerializer<T>
) {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) {
        return;
      }
      setValue(serializer.deserialize(raw));
    } catch {
      // ignore
    }
  }, [key, serializer]);

  const setStickyValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (value: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, serializer.serialize(resolved));
        } catch {
          // ignore
        }
        return resolved;
      });
    },
    [key, serializer]
  );

  return [value, setStickyValue] as const;
}

const stringSerializer: StickySerializer<string> = {
  serialize(value) {
    return value;
  },
  deserialize(raw) {
    return raw;
  }
};

export function useStickyStringState(key: string, defaultValue: string) {
  return useStickyState(key, defaultValue, stringSerializer);
}

const booleanSerializer: StickySerializer<boolean> = {
  serialize(value) {
    return value ? "true" : "false";
  },
  deserialize(raw) {
    return raw.trim().toLowerCase() === "true";
  }
};

export function useStickyBooleanState(key: string, defaultValue: boolean) {
  return useStickyState(key, defaultValue, booleanSerializer);
}

