export type PayloadRow = {
  key: string;
  value: string;
  kind: "string" | "number" | "boolean" | "null" | "json";
};

type PayloadRecord = Record<string, unknown>;

function asRecord(value: unknown): PayloadRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as PayloadRecord;
}

function findStringByMatcher(
  value: unknown,
  matcher: (key: string) => boolean,
  depth = 0,
): string | null {
  if (depth > 5) {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = findStringByMatcher(item, matcher, depth + 1);
      if (nested) {
        return nested;
      }
    }

    return null;
  }

  const record = asRecord(value);
  if (!record) {
    return null;
  }

  for (const [key, item] of Object.entries(record)) {
    if (matcher(key) && typeof item === "string" && item.trim()) {
      return item.trim();
    }
  }

  for (const item of Object.values(record)) {
    const nested = findStringByMatcher(item, matcher, depth + 1);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function stringifyValue(value: unknown) {
  if (value === null) {
    return {
      value: "null",
      kind: "null" as const,
    };
  }

  if (typeof value === "string") {
    return {
      value,
      kind: "string" as const,
    };
  }

  if (typeof value === "number") {
    return {
      value: String(value),
      kind: "number" as const,
    };
  }

  if (typeof value === "boolean") {
    return {
      value: String(value),
      kind: "boolean" as const,
    };
  }

  return {
    value: JSON.stringify(value, null, 2),
    kind: "json" as const,
  };
}

export function parsePayloadRows(raw: string): PayloadRow[] {
  try {
    const parsed = JSON.parse(raw) as unknown;

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.entries(parsed).map(([key, value]) => {
        const next = stringifyValue(value);
        return {
          key,
          value: next.value,
          kind: next.kind,
        };
      });
    }

    const fallback = stringifyValue(parsed);
    return [
      {
        key: "value",
        value: fallback.value,
        kind: fallback.kind,
      },
    ];
  } catch {
    return [
      {
        key: "raw",
        value: raw,
        kind: "string",
      },
    ];
  }
}

export function extractPayloadEmail(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;

    return findStringByMatcher(parsed, (key) => {
      const normalized = key.trim().toLowerCase();
      return (
        normalized === "email" ||
        normalized === "mail" ||
        normalized === "emailaddress" ||
        normalized === "email_address" ||
        normalized === "loginemail" ||
        normalized === "login_email" ||
        normalized.endsWith("email")
      );
    });
  } catch {
    return null;
  }
}

export function extractPayloadUserId(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;

    return findStringByMatcher(parsed, (key) => {
      const normalized = key.trim().toLowerCase();
      return (
        normalized === "userid" ||
        normalized === "user_id" ||
        normalized === "uid" ||
        normalized.endsWith("userid") ||
        normalized.endsWith("user_id")
      );
    });
  } catch {
    return null;
  }
}

export function buildAccountDedupKey(raw: string) {
  const normalizedRaw = raw.trim();
  const email = extractPayloadEmail(normalizedRaw);
  if (email) {
    return `email:${email.toLowerCase()}`;
  }

  const userId = extractPayloadUserId(normalizedRaw);
  if (userId) {
    return `user:${userId}`;
  }

  return `raw:${normalizedRaw}`;
}
