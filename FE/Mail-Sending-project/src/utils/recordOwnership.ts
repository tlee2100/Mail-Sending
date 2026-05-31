import type { AuthUser } from "../stores/auth";

type RecordLike = Record<string, unknown> | null | undefined;

function normalize(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
}

function nestedOwner(record: Record<string, unknown>) {
  const owner = record.owner;
  return owner && typeof owner === "object" ? (owner as Record<string, unknown>) : null;
}

export function recordOwnerId(record: RecordLike) {
  if (!record) return "";
  const owner = nestedOwner(record);
  return normalize(
    record.user_id ||
      record.userId ||
      record.owner_id ||
      record.ownerId ||
      owner?.id,
  );
}

export function recordOwnerEmail(record: RecordLike) {
  if (!record) return "";
  const owner = nestedOwner(record);
  return normalize(
    record.user_email ||
      record.userEmail ||
      record.owner_email ||
      record.ownerEmail ||
      owner?.email,
  );
}

export function hasRecordOwner(record: RecordLike) {
  return !!recordOwnerId(record) || !!recordOwnerEmail(record);
}

export function isRecordOwnedByUser(record: RecordLike, user: AuthUser | null) {
  if (!record || !user) return false;
  const ownerId = recordOwnerId(record);
  const ownerEmail = recordOwnerEmail(record);
  return (
    (!!ownerId && ownerId === normalize(user.id)) ||
    (!!ownerEmail && ownerEmail === normalize(user.email))
  );
}

export function canManageOwnRecord(record: RecordLike, user: AuthUser | null) {
  return !hasRecordOwner(record) || isRecordOwnedByUser(record, user);
}

export function recordOwnerLabel(record: RecordLike) {
  if (!record) return "";
  const owner = nestedOwner(record);
  const name =
    record.owner_name ||
    record.ownerName ||
    record.user_name ||
    record.userName ||
    owner?.name;
  const email =
    record.owner_email ||
    record.ownerEmail ||
    record.user_email ||
    record.userEmail ||
    owner?.email;
  const id =
    record.owner_id ||
    record.ownerId ||
    record.user_id ||
    record.userId ||
    owner?.id;

  if (name && email) return `${name} (${email})`;
  if (name || email) return String(name || email);
  if (id) return `User #${id}`;
  return "";
}
