type AuthLikeUser = {
  id?: string | number | null;
  email?: string | null;
  name?: string | null;
  role?: string | null;
};

type TemplateLike = Record<string, unknown> | null | undefined;

const OWNER_ID_KEYS = [
  "user_id",
  "userId",
  "owner_id",
  "ownerId",
  "created_by_id",
  "createdById",
  "created_by_user_id",
  "createdByUserId",
  "account_id",
  "accountId",
];

const OWNER_EMAIL_KEYS = [
  "user_email",
  "userEmail",
  "owner_email",
  "ownerEmail",
  "created_by_email",
  "createdByEmail",
  "email",
];

const OWNER_NAME_KEYS = [
  "user_name",
  "userName",
  "owner_name",
  "ownerName",
  "created_by_name",
  "createdByName",
  "name",
];

const OWNER_OBJECT_KEYS = [
  "user",
  "owner",
  "created_by",
  "createdBy",
  "created_by_user",
  "createdByUser",
  "author",
];

function normalize(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
}

function hasValue(value: unknown) {
  return normalize(value).length > 0;
}

function getAny(template: Record<string, unknown>, keys: string[]) {
  return keys.map((key) => template[key]).find(hasValue);
}

function getNestedOwner(template: Record<string, unknown>) {
  for (const key of OWNER_OBJECT_KEYS) {
    const value = template[key];
    if (value && typeof value === "object") {
      return value as Record<string, unknown>;
    }
  }
  return null;
}

export function hasTemplateOwner(template: TemplateLike) {
  if (!template) return false;
  const directOwner = [...OWNER_ID_KEYS, ...OWNER_EMAIL_KEYS, ...OWNER_NAME_KEYS]
    .some((key) => hasValue(template[key]));
  if (directOwner) return true;

  const nestedOwner = getNestedOwner(template);
  if (!nestedOwner) return false;
  return ["id", ...OWNER_ID_KEYS, ...OWNER_EMAIL_KEYS, ...OWNER_NAME_KEYS].some(
    (key) => hasValue(nestedOwner[key]),
  );
}

export function isTemplateOwnedByUser(template: TemplateLike, user: AuthLikeUser | null) {
  if (!template || !user) return false;

  const nestedOwner = getNestedOwner(template);
  const ownerId = getAny(template, OWNER_ID_KEYS) || nestedOwner?.id || getAny(nestedOwner || {}, OWNER_ID_KEYS);
  const ownerEmail = getAny(template, OWNER_EMAIL_KEYS) || getAny(nestedOwner || {}, OWNER_EMAIL_KEYS);
  const ownerName = getAny(template, OWNER_NAME_KEYS) || getAny(nestedOwner || {}, OWNER_NAME_KEYS);

  const userId = normalize(user.id);
  const userEmail = normalize(user.email);
  const userName = normalize(user.name);

  return (
    (!!ownerId && !!userId && normalize(ownerId) === userId) ||
    (!!ownerEmail && !!userEmail && normalize(ownerEmail) === userEmail) ||
    (!!ownerName && !!userName && normalize(ownerName) === userName)
  );
}

export function canManageTemplate(template: TemplateLike, user: AuthLikeUser | null) {
  if (!hasTemplateOwner(template)) return true;
  return isTemplateOwnedByUser(template, user);
}

export function isAdminUser(user: AuthLikeUser | null) {
  return normalize(user?.role) === "admin";
}

export function canDeleteTemplate(template: TemplateLike, user: AuthLikeUser | null) {
  return isAdminUser(user) || canManageTemplate(template, user);
}

export function templateOwnerLabel(template: TemplateLike) {
  if (!template) return "";
  const nestedOwner = getNestedOwner(template);
  const ownerName = getAny(template, OWNER_NAME_KEYS) || getAny(nestedOwner || {}, OWNER_NAME_KEYS);
  const ownerEmail = getAny(template, OWNER_EMAIL_KEYS) || getAny(nestedOwner || {}, OWNER_EMAIL_KEYS);
  const ownerId = getAny(template, OWNER_ID_KEYS) || nestedOwner?.id || getAny(nestedOwner || {}, OWNER_ID_KEYS);

  if (ownerName) return String(ownerName);
  if (ownerEmail) return String(ownerEmail);
  if (ownerId) return `User #${ownerId}`;
  return "";
}
