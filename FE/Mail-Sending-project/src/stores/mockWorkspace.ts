import { reactive } from "vue";

export type MockTagColor =
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "red"
  | "cyan";

export type MockFieldType = "text" | "select" | "date" | "number";

export type MockContactStatus = "active" | "inactive";

export type MockCampaignStatus = "draft" | "running" | "paused" | "sent";

export type MockTag = {
  id: string;
  name: string;
  description: string;
  color: MockTagColor;
  createdAt: string;
};

export type MockField = {
  id: string;
  name: string;
  type: MockFieldType;
  required: boolean;
  updatedAt: string;
};

export type MockContact = {
  id: string;
  name: string;
  email: string;
  status: MockContactStatus;
  tags: string[];
  fields: Record<string, string>;
  updatedAt: string;
  createdAt: string;
};

export type MockTemplate = {
  id: string;
  name: string;
  category: string;
  description: string;
  sample: string;
  updatedAt: string;
  useCount: number;
};

export type MockEmailAccount = {
  id: string;
  name: string;
  emailAddress: string;
  provider: string;
  isActive: boolean;
  isDefault: boolean;
  emailsSent: number;
  updatedAt: string;
};

export type MockCampaignRecipient = {
  email: string;
  name: string;
  status: "queued" | "delivered" | "opened" | "paused";
  lastEvent: string;
};

export type MockCampaign = {
  id: string;
  name: string;
  status: MockCampaignStatus;
  recipients: number;
  updatedAt: string;
  templateName: string;
  sender: string;
  audience: string;
  recipientRows: MockCampaignRecipient[];
};

export type MockActivity = {
  id: string;
  type: "campaign" | "contacts" | "template" | "account" | "profile" | "payment";
  title: string;
  description: string;
  createdAt: string;
};

type MockComposeDraft = {
  recipients: string;
  subject: string;
  content: string;
  previewEmail: string;
};

type MockProfile = {
  fullName: string;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
};

type WorkspaceState = {
  tags: MockTag[];
  fields: MockField[];
  contacts: MockContact[];
  templates: MockTemplate[];
  emailAccounts: MockEmailAccount[];
  campaigns: MockCampaign[];
  activities: MockActivity[];
  composeDraft: MockComposeDraft;
  profile: MockProfile;
};

const LS_WORKSPACE = "mock.workspace.v2";
const LS_PROFILE_SHADOW = "mock.profile.shadow.v1";

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function seedState(): WorkspaceState {
  const tags: MockTag[] = [
    {
      id: "tag_newsletter",
      name: "Newsletter Subscribers",
      description: "Users subscribed to weekly product updates",
      color: "blue",
      createdAt: hoursAgo(22),
    },
    {
      id: "tag_partners",
      name: "Partners",
      description: "Business partners and affiliates",
      color: "green",
      createdAt: hoursAgo(30),
    },
    {
      id: "tag_vip",
      name: "VIP Customers",
      description: "High-value customers requiring special attention",
      color: "red",
      createdAt: hoursAgo(48),
    },
  ];

  const fields: MockField[] = [
    {
      id: "company",
      name: "Company",
      type: "text",
      required: false,
      updatedAt: hoursAgo(2),
    },
    {
      id: "plan",
      name: "Plan",
      type: "select",
      required: true,
      updatedAt: hoursAgo(24),
    },
    {
      id: "renewal_date",
      name: "Renewal Date",
      type: "date",
      required: false,
      updatedAt: hoursAgo(72),
    },
  ];

  const contacts: MockContact[] = [
    {
      id: "ct_001",
      name: "Maria Tran",
      email: "maria@acme.io",
      status: "active",
      tags: ["tag_newsletter", "tag_vip"],
      fields: {
        company: "Acme",
        plan: "Enterprise",
        renewal_date: "2026-06-30",
      },
      updatedAt: minutesAgo(35),
      createdAt: hoursAgo(50),
    },
    {
      id: "ct_002",
      name: "Daniel Pham",
      email: "daniel@acme.io",
      status: "active",
      tags: ["tag_partners"],
      fields: {
        company: "Acme",
        plan: "Partner",
      },
      updatedAt: hoursAgo(5),
      createdAt: hoursAgo(70),
    },
    {
      id: "ct_003",
      name: "Sarah Nguyen",
      email: "sarah@startup.io",
      status: "inactive",
      tags: ["tag_newsletter"],
      fields: {
        company: "Startup.io",
        plan: "Growth",
      },
      updatedAt: hoursAgo(26),
      createdAt: hoursAgo(90),
    },
  ];

  const templates: MockTemplate[] = [
    {
      id: "1",
      name: "Welcome Onboarding",
      category: "Onboarding",
      description: "Welcome new users and guide first steps.",
      sample: "welcome",
      updatedAt: hoursAgo(24),
      useCount: 4,
    },
    {
      id: "2",
      name: "Seasonal Promo",
      category: "Sales",
      description: "Limited-time campaign with discount CTA.",
      sample: "promo",
      updatedAt: hoursAgo(12),
      useCount: 2,
    },
    {
      id: "3",
      name: "Weekly Newsletter",
      category: "Content",
      description: "Curated weekly updates and highlights.",
      sample: "newsletter",
      updatedAt: hoursAgo(8),
      useCount: 7,
    },
  ];

  const emailAccounts: MockEmailAccount[] = [
    {
      id: "acc_001",
      name: "Main Marketing",
      emailAddress: "marketing@company.com",
      provider: "SMTP",
      isActive: true,
      isDefault: true,
      emailsSent: 1248,
      updatedAt: hoursAgo(3),
    },
  ];

  const campaigns: MockCampaign[] = [
    {
      id: "c_101",
      name: "Q2 Product Launch",
      status: "draft",
      recipients: 3,
      updatedAt: minutesAgo(35),
      templateName: "Welcome Onboarding",
      sender: "marketing@company.com",
      audience: "3 contacts",
      recipientRows: [
        {
          email: "maria@acme.io",
          name: "Maria Tran",
          status: "queued",
          lastEvent: "Queued 1m ago",
        },
        {
          email: "daniel@acme.io",
          name: "Daniel Pham",
          status: "queued",
          lastEvent: "Queued 1m ago",
        },
        {
          email: "sarah@startup.io",
          name: "Sarah Nguyen",
          status: "queued",
          lastEvent: "Queued 1m ago",
        },
      ],
    },
    {
      id: "c_102",
      name: "Weekly Newsletter",
      status: "running",
      recipients: 3,
      updatedAt: minutesAgo(5),
      templateName: "Weekly Newsletter",
      sender: "marketing@company.com",
      audience: "3 contacts",
      recipientRows: [
        {
          email: "maria@acme.io",
          name: "Maria Tran",
          status: "opened",
          lastEvent: "Opened 2m ago",
        },
        {
          email: "daniel@acme.io",
          name: "Daniel Pham",
          status: "delivered",
          lastEvent: "Delivered 8m ago",
        },
        {
          email: "sarah@startup.io",
          name: "Sarah Nguyen",
          status: "queued",
          lastEvent: "Queued 3m ago",
        },
      ],
    },
  ];

  const activities: MockActivity[] = [
    {
      id: uid("activity"),
      type: "campaign",
      title: "Campaign Created",
      description: 'New email campaign "Q2 Product Launch" created',
      createdAt: hoursAgo(2),
    },
    {
      id: uid("activity"),
      type: "contacts",
      title: "Contacts Imported",
      description: "3 new contacts added via CSV import",
      createdAt: hoursAgo(5),
    },
    {
      id: uid("activity"),
      type: "template",
      title: "Template Saved",
      description: 'Email template "Welcome Onboarding" saved',
      createdAt: hoursAgo(30),
    },
  ];

  return {
    tags,
    fields,
    contacts,
    templates,
    emailAccounts,
    campaigns,
    activities,
    composeDraft: {
      recipients: "",
      subject: "",
      content: "",
      previewEmail: "",
    },
    profile: {
      fullName: "Admin",
      email: "admin@email.com",
      password: "Demo@123456",
      createdAt: hoursAgo(240),
      updatedAt: hoursAgo(2),
    },
  };
}

function loadState() {
  if (typeof window === "undefined") {
    return seedState();
  }

  const fallback = seedState();
  const stored = parseJson<WorkspaceState>(
    window.localStorage.getItem(LS_WORKSPACE),
    fallback,
  );

  return {
    ...fallback,
    ...stored,
  };
}

const state = reactive<WorkspaceState>(loadState());

function save() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_WORKSPACE, JSON.stringify(state));
}

function addActivity(
  type: MockActivity["type"],
  title: string,
  description: string,
) {
  state.activities.unshift({
    id: uid("activity"),
    type,
    title,
    description,
    createdAt: nowIso(),
  });
  state.activities = state.activities.slice(0, 12);
}

function formatRelativeTime(input: string) {
  const time = new Date(input).getTime();
  if (!Number.isFinite(time)) return input;
  const diffMs = Date.now() - time;
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function parseRecipients(raw: string) {
  return raw
    .split(/[\n,;]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function buildRecipientsFromContacts(emails?: string[]) {
  const source = emails?.length
    ? emails.map((email) => state.contacts.find((item) => item.email === email))
    : state.contacts.slice(0, 5);

  return source
    .filter((value): value is MockContact => !!value)
    .map((contact, index): MockCampaignRecipient => {
      const status: MockCampaignRecipient["status"] =
        index === 0 ? "opened" : index === 1 ? "delivered" : "queued";
      return {
        email: contact.email,
        name: contact.name,
        status,
        lastEvent:
          status === "opened"
            ? "Opened just now"
            : status === "delivered"
              ? "Delivered 1m ago"
              : "Queued just now",
      };
    });
}

function updateProfileShadow(profile: Pick<MockProfile, "fullName" | "email">) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_PROFILE_SHADOW, JSON.stringify(profile));
}

function readProfileShadow() {
  if (typeof window === "undefined") return null;
  return parseJson<Pick<MockProfile, "fullName" | "email"> | null>(
    window.localStorage.getItem(LS_PROFILE_SHADOW),
    null,
  );
}

function initProfileShadow() {
  const shadow = readProfileShadow();
  if (!shadow) return;
  state.profile.fullName = shadow.fullName || state.profile.fullName;
  state.profile.email = shadow.email || state.profile.email;
}

initProfileShadow();

export const mockWorkspace = {
  state,
  formatRelativeTime,

  addContact(payload: {
    name: string;
    email: string;
    status?: MockContactStatus;
    tagIds?: string[];
  }) {
    const now = nowIso();
    const contact: MockContact = {
      id: uid("ct"),
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      status: payload.status || "active",
      tags: payload.tagIds || [],
      fields: {},
      updatedAt: now,
      createdAt: now,
    };

    state.contacts.unshift(contact);
    addActivity(
      "contacts",
      "Contact Added",
      `${contact.name} (${contact.email}) was added to your audience`,
    );
    save();
    return contact;
  },

  importContacts(fileName: string, mode: "append" | "replace") {
    const imported = [
      {
        id: uid("ct"),
        name: "Demo Import One",
        email: "import.one@example.com",
      },
      {
        id: uid("ct"),
        name: "Demo Import Two",
        email: "import.two@example.com",
      },
    ];

    if (mode === "replace") {
      for (const entry of imported) {
        const existing = state.contacts.find((item) => item.email === entry.email);
        if (existing) {
          existing.name = entry.name;
          existing.updatedAt = nowIso();
        } else {
          state.contacts.unshift({
            id: entry.id,
            name: entry.name,
            email: entry.email,
            status: "active",
            tags: [],
            fields: {},
            createdAt: nowIso(),
            updatedAt: nowIso(),
          });
        }
      }
    } else {
      for (const entry of imported) {
        state.contacts.unshift({
          id: entry.id,
          name: entry.name,
          email: entry.email,
          status: "active",
          tags: [],
          fields: {},
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
      }
    }

    addActivity(
      "contacts",
      "Contacts Imported",
      `${imported.length} contacts imported from ${fileName}`,
    );
    save();
    return imported.length;
  },

  exportContacts(format: "csv" | "xlsx", contactIds?: string[]) {
    const contacts = contactIds?.length
      ? state.contacts.filter((contact) => contactIds.includes(contact.id))
      : state.contacts;
    const filename = `contacts-export-${Date.now()}.${format}`;

    addActivity(
      "contacts",
      "Contacts Exported",
      `${contacts.length} contacts prepared for ${format.toUpperCase()} export`,
    );
    save();

    return {
      filename,
      content: contacts
        .map((contact) => `${contact.name},${contact.email},${contact.status}`)
        .join("\n"),
    };
  },

  addField(payload: {
    name: string;
    type: MockFieldType;
    required: boolean;
  }) {
    const field: MockField = {
      id: uid("field"),
      name: payload.name.trim(),
      type: payload.type,
      required: payload.required,
      updatedAt: nowIso(),
    };
    state.fields.unshift(field);
    addActivity("contacts", "Field Added", `${field.name} field is now available`);
    save();
    return field;
  },

  updateField(id: string, payload: Partial<Pick<MockField, "name" | "type" | "required">>) {
    const field = state.fields.find((item) => item.id === id);
    if (!field) return null;
    if (payload.name !== undefined) field.name = payload.name.trim();
    if (payload.type !== undefined) field.type = payload.type;
    if (payload.required !== undefined) field.required = payload.required;
    field.updatedAt = nowIso();
    addActivity("contacts", "Field Updated", `${field.name} field was updated`);
    save();
    return field;
  },

  deleteField(id: string) {
    const field = state.fields.find((item) => item.id === id);
    if (!field) return false;
    state.fields = state.fields.filter((item) => item.id !== id);
    for (const contact of state.contacts) {
      delete contact.fields[id];
    }
    addActivity("contacts", "Field Deleted", `${field.name} field was removed`);
    save();
    return true;
  },

  getContactById(id: string) {
    return state.contacts.find((contact) => contact.id === id) || null;
  },

  updateContactFields(id: string, fields: Record<string, string>) {
    const contact = state.contacts.find((item) => item.id === id);
    if (!contact) return null;
    contact.fields = { ...contact.fields, ...fields };
    contact.updatedAt = nowIso();
    addActivity(
      "contacts",
      "Contact Updated",
      `${contact.name} custom field values were saved`,
    );
    save();
    return contact;
  },

  addTag(payload: { name: string; description: string; color: MockTagColor }) {
    const tag: MockTag = {
      id: uid("tag"),
      name: payload.name.trim(),
      description: payload.description.trim(),
      color: payload.color,
      createdAt: nowIso(),
    };
    state.tags.unshift(tag);
    addActivity("contacts", "Tag Created", `${tag.name} tag was created`);
    save();
    return tag;
  },

  addTemplate(payload: {
    name: string;
    category: string;
    description: string;
    sample?: string;
  }) {
    const template: MockTemplate = {
      id: String(
        Math.max(0, ...state.templates.map((item) => Number(item.id) || 0)) + 1,
      ),
      name: payload.name.trim(),
      category: payload.category.trim(),
      description: payload.description.trim(),
      sample: payload.sample || "welcome",
      updatedAt: nowIso(),
      useCount: 0,
    };
    state.templates.unshift(template);
    addActivity(
      "template",
      "Template Created",
      `${template.name} is ready to be edited in the designer`,
    );
    save();
    return template;
  },

  addEmailAccount(payload: {
    name: string;
    emailAddress: string;
    provider: string;
  }) {
    const account: MockEmailAccount = {
      id: uid("acc"),
      name: payload.name.trim(),
      emailAddress: payload.emailAddress.trim().toLowerCase(),
      provider: payload.provider.trim() || "SMTP",
      isActive: true,
      isDefault: state.emailAccounts.length === 0,
      emailsSent: 0,
      updatedAt: nowIso(),
    };
    state.emailAccounts.unshift(account);
    addActivity(
      "account",
      "Account Added",
      `${account.emailAddress} connected as a sending account`,
    );
    save();
    return account;
  },

  setDefaultEmailAccount(id: string) {
    let updated = false;
    for (const account of state.emailAccounts) {
      const isCurrent = account.id === id;
      account.isDefault = isCurrent;
      if (isCurrent) {
        account.updatedAt = nowIso();
        updated = true;
      }
    }
    if (updated) {
      const account = state.emailAccounts.find((item) => item.id === id);
      if (account) {
        addActivity(
          "account",
          "Default Account Changed",
          `${account.emailAddress} is now the default sender`,
        );
      }
      save();
    }
    return updated;
  },

  toggleEmailAccount(id: string) {
    const account = state.emailAccounts.find((item) => item.id === id);
    if (!account) return null;
    account.isActive = !account.isActive;
    account.updatedAt = nowIso();
    addActivity(
      "account",
      account.isActive ? "Account Activated" : "Account Paused",
      `${account.emailAddress} is now ${account.isActive ? "active" : "inactive"}`,
    );
    save();
    return account;
  },

  addCampaign(payload?: { name?: string; templateName?: string }) {
    const recipients = buildRecipientsFromContacts();
    const defaultAccount =
      state.emailAccounts.find((item) => item.isDefault) || state.emailAccounts[0];
    const campaign: MockCampaign = {
      id: uid("c"),
      name: payload?.name?.trim() || `New Campaign ${state.campaigns.length + 1}`,
      status: "draft",
      recipients: recipients.length,
      updatedAt: nowIso(),
      templateName: payload?.templateName || state.templates[0]?.name || "Manual Compose",
      sender: defaultAccount?.emailAddress || "sender@example.com",
      audience: `${recipients.length} contacts`,
      recipientRows: recipients,
    };

    state.campaigns.unshift(campaign);
    addActivity(
      "campaign",
      "Campaign Created",
      `${campaign.name} was added to the campaign queue`,
    );
    save();
    return campaign;
  },

  getCampaignById(id: string) {
    return state.campaigns.find((campaign) => campaign.id === id) || null;
  },

  startCampaign(id: string) {
    const campaign = state.campaigns.find((item) => item.id === id);
    if (!campaign) return null;
    campaign.status = "running";
    campaign.updatedAt = nowIso();
    campaign.recipientRows = campaign.recipientRows.map((row, index) => ({
      ...row,
      status: index === 0 ? "opened" : "delivered",
      lastEvent: index === 0 ? "Opened just now" : "Delivered just now",
    }));
    const defaultAccount = state.emailAccounts.find((item) => item.isDefault);
    if (defaultAccount) {
      defaultAccount.emailsSent += campaign.recipients;
      defaultAccount.updatedAt = nowIso();
    }
    addActivity(
      "campaign",
      "Campaign Started",
      `${campaign.name} started sending to ${campaign.recipients} recipients`,
    );
    save();
    return campaign;
  },

  pauseCampaign(id: string) {
    const campaign = state.campaigns.find((item) => item.id === id);
    if (!campaign) return null;
    campaign.status = "paused";
    campaign.updatedAt = nowIso();
    campaign.recipientRows = campaign.recipientRows.map((row) => ({
      ...row,
      status: row.status === "opened" ? row.status : "paused",
      lastEvent: row.status === "opened" ? row.lastEvent : "Paused just now",
    }));
    addActivity("campaign", "Campaign Paused", `${campaign.name} was paused`);
    save();
    return campaign;
  },

  saveComposeDraft(payload: Partial<MockComposeDraft>) {
    state.composeDraft = {
      ...state.composeDraft,
      ...payload,
    };
    save();
  },

  resetComposeDraft() {
    state.composeDraft = {
      recipients: "",
      subject: "",
      content: "",
      previewEmail: "",
    };
    save();
  },

  sendPreview(email: string) {
    addActivity(
      "campaign",
      "Preview Sent",
      `Preview email sent to ${email.trim().toLowerCase()}`,
    );
    save();
  },

  sendIndividualEmails(payload: {
    recipients: string;
    subject: string;
    content: string;
  }) {
    const emails = parseRecipients(payload.recipients);
    const defaultAccount =
      state.emailAccounts.find((item) => item.isDefault) || state.emailAccounts[0];
    const campaign: MockCampaign = {
      id: uid("c"),
      name: payload.subject.trim() || `Manual Send ${state.campaigns.length + 1}`,
      status: "sent",
      recipients: emails.length,
      updatedAt: nowIso(),
      templateName: "Manual Compose",
      sender: defaultAccount?.emailAddress || "sender@example.com",
      audience: `${emails.length} recipients`,
      recipientRows: [],
    };

    campaign.recipientRows = emails.map((email, index) => ({
      email,
      name: email.split("@")[0] || `Recipient ${index + 1}`,
      status: (index === 0 ? "opened" : "delivered") as
        | "opened"
        | "delivered",
      lastEvent: index === 0 ? "Opened just now" : "Delivered just now",
    }));

    state.campaigns.unshift(campaign);
    if (defaultAccount) {
      defaultAccount.emailsSent += emails.length;
      defaultAccount.updatedAt = nowIso();
    }

    addActivity(
      "campaign",
      "Manual Emails Sent",
      `${emails.length} recipients received "${payload.subject.trim() || "Untitled Email"}"`,
    );

    save();
    return campaign;
  },

  syncProfile(fullName: string, email: string) {
    state.profile.fullName = fullName.trim();
    state.profile.email = email.trim();
    state.profile.updatedAt = nowIso();
    updateProfileShadow({
      fullName: state.profile.fullName,
      email: state.profile.email,
    });
    save();
  },

  updateProfile(payload: { fullName: string; email: string }) {
    state.profile.fullName = payload.fullName.trim();
    state.profile.email = payload.email.trim();
    state.profile.updatedAt = nowIso();
    updateProfileShadow({
      fullName: state.profile.fullName,
      email: state.profile.email,
    });
    addActivity("profile", "Profile Updated", "Profile details were saved locally");
    save();
  },

  changePassword(payload: { currentPassword: string; newPassword: string }) {
    if (payload.currentPassword !== state.profile.password) {
      throw new Error("Current password is incorrect");
    }
    state.profile.password = payload.newPassword;
    state.profile.updatedAt = nowIso();
    addActivity("profile", "Password Updated", "Password was updated in local demo mode");
    save();
  },

  trackPayment(method: string, amount: number) {
    addActivity(
      "payment",
      `${method} Demo Ready`,
      `Payment link prepared for ${amount.toLocaleString()} VND`,
    );
    save();
  },
};
