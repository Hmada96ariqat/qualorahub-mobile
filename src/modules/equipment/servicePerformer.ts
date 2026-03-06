export interface ServicePerformerDisplay {
  kind?: string | null;
  id?: string | null;
  name?: string | null;
}

export interface ServicePerformerUserLike {
  user_id?: string | null;
  id?: string | null;
  value?: string | null;
  label?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  nick_name?: string | null;
  email?: string | null;
}

export interface ServicePerformerContactLike {
  id?: string | null;
  value?: string | null;
  label?: string | null;
  name?: string | null;
  email?: string | null;
}

export interface ParsedServicePerformerReference {
  kind: 'user' | 'contact';
  id: string;
  raw: string;
}

function normalizeToken(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function readUserId(user: ServicePerformerUserLike): string {
  return String(user.user_id ?? user.id ?? user.value ?? '').trim();
}

function readUserLabel(user: ServicePerformerUserLike): string {
  return String(
    user.display_name ?? user.full_name ?? user.nick_name ?? user.label ?? user.email ?? '',
  ).trim();
}

function readContactId(contact: ServicePerformerContactLike): string {
  return String(contact.id ?? contact.value ?? '').trim();
}

function readContactLabel(contact: ServicePerformerContactLike): string {
  return String(contact.name ?? contact.label ?? contact.email ?? '').trim();
}

export const parseServicePerformerReference = (
  value: unknown,
): ParsedServicePerformerReference | null => {
  const normalized = String(value ?? '').trim();
  const match = /^(user|contact):([0-9a-fA-F-]{36})$/i.exec(normalized);

  if (!match) {
    return null;
  }

  return {
    kind: match[1].toLowerCase() as 'user' | 'contact',
    id: match[2].toLowerCase(),
    raw: normalized,
  };
};

export const normalizeServicePerformerReference = (value: unknown): string | null => {
  const parsed = parseServicePerformerReference(value);
  if (!parsed) {
    return null;
  }

  return `${parsed.kind}:${parsed.id}`;
};

export const getServicePerformerId = (value: unknown): string | null => {
  return parseServicePerformerReference(value)?.id ?? null;
};

export const matchesServicePerformerId = (value: unknown, candidateId: string): boolean => {
  return getServicePerformerId(value) === normalizeToken(candidateId);
};

export const resolveServicePerformerValue = (input: {
  reference?: unknown;
  performer?: ServicePerformerDisplay | null;
  users?: ServicePerformerUserLike[];
  contacts?: ServicePerformerContactLike[];
}): string | null => {
  const performerKind = normalizeToken(input.performer?.kind);
  const performerId = String(input.performer?.id ?? '')
    .trim()
    .toLowerCase();
  if ((performerKind === 'user' || performerKind === 'contact') && performerId.length > 0) {
    return `${performerKind}:${performerId}`;
  }

  const normalizedReference = normalizeServicePerformerReference(input.reference);
  if (normalizedReference) {
    return normalizedReference;
  }

  const raw = String(input.reference ?? '').trim();
  if (!raw) {
    return null;
  }

  const normalizedRaw = normalizeToken(raw);

  const matchingUser = (input.users ?? []).find((user) => {
    const id = normalizeToken(readUserId(user));
    const label = normalizeToken(readUserLabel(user));
    const email = normalizeToken(user.email);

    return normalizedRaw === id || normalizedRaw === label || normalizedRaw === email;
  });
  if (matchingUser) {
    return `user:${readUserId(matchingUser).toLowerCase()}`;
  }

  const matchingContact = (input.contacts ?? []).find((contact) => {
    const id = normalizeToken(readContactId(contact));
    const label = normalizeToken(readContactLabel(contact));
    const email = normalizeToken(contact.email);

    return normalizedRaw === id || normalizedRaw === label || normalizedRaw === email;
  });
  if (matchingContact) {
    return `contact:${readContactId(matchingContact).toLowerCase()}`;
  }

  return null;
};

export const getServicePerformerLabel = (input: {
  reference?: unknown;
  performer?: ServicePerformerDisplay | null;
  users?: ServicePerformerUserLike[];
  contacts?: ServicePerformerContactLike[];
  fallback?: string;
}): string => {
  const performerName = String(input.performer?.name ?? '').trim();
  if (performerName) {
    return performerName;
  }

  const parsed = parseServicePerformerReference(input.reference);
  if (!parsed) {
    const raw = String(input.reference ?? '').trim();
    return raw || String(input.fallback ?? '').trim();
  }

  if (parsed.kind === 'user') {
    const user = (input.users ?? []).find(
      (entry) => normalizeToken(readUserId(entry)) === parsed.id,
    );

    return readUserLabel(user ?? {}) || String(input.fallback ?? '').trim();
  }

  const contact = (input.contacts ?? []).find(
    (entry) => normalizeToken(readContactId(entry)) === parsed.id,
  );

  return readContactLabel(contact ?? {}) || String(input.fallback ?? '').trim();
};
