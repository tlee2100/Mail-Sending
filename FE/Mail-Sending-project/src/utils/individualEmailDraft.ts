export type IndividualEmailDraft = {
  recipients: string;
  subject: string;
  content: string;
  previewEmail: string;
  emailAccountId: string;
  templateId: string;
};

const STORAGE_KEY = "individual-email.draft.v1";

const DEFAULT_DRAFT: IndividualEmailDraft = {
  recipients: "",
  subject: "",
  content: "",
  previewEmail: "",
  emailAccountId: "",
  templateId: "",
};

export function readIndividualEmailDraft(): IndividualEmailDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_DRAFT };
    }

    const parsed = JSON.parse(raw) as Partial<IndividualEmailDraft>;
    return {
      ...DEFAULT_DRAFT,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_DRAFT };
  }
}

export function writeIndividualEmailDraft(payload: Partial<IndividualEmailDraft>) {
  const nextDraft = {
    ...readIndividualEmailDraft(),
    ...payload,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDraft));
  } catch {
    // ignore storage errors
  }
}

export function resetIndividualEmailDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

export function parseRecipientInput(value: string) {
  return [...new Set(
    value
      .split(/[\n,;]/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  )];
}
