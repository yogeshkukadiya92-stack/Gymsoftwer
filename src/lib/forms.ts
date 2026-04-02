export type FormFieldType =
  | "short_text"
  | "paragraph"
  | "phone"
  | "email"
  | "number"
  | "link"
  | "file_upload"
  | "date"
  | "time"
  | "dropdown"
  | "multi_select"
  | "multiple_choice"
  | "checkbox"
  | "linear_scale";

export type FieldCondition = {
  fieldId: string;
  equals: string;
};

export type IntakeFormField = {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  options?: string[];
  condition?: FieldCondition;
  scaleMin?: number;
  scaleMax?: number;
  scaleLowLabel?: string;
  scaleHighLabel?: string;
};

export type FieldTypeDefinition = {
  type: FormFieldType;
  label: string;
  description: string;
  category: "Basic" | "Choice" | "Contact" | "Advanced";
  needsOptions?: boolean;
};

export const fieldTypeDefinitions: FieldTypeDefinition[] = [
  {
    type: "short_text",
    label: "Short answer",
    description: "Single-line text input for names and short replies.",
    category: "Basic",
  },
  {
    type: "paragraph",
    label: "Long answer",
    description: "Multi-line text field for notes and detailed answers.",
    category: "Basic",
  },
  {
    type: "multiple_choice",
    label: "Multiple choice",
    description: "Choose exactly one option from a list.",
    category: "Choice",
    needsOptions: true,
  },
  {
    type: "checkbox",
    label: "Checkboxes",
    description: "Choose multiple options from a list.",
    category: "Choice",
    needsOptions: true,
  },
  {
    type: "dropdown",
    label: "Dropdown",
    description: "Compact single-select dropdown list.",
    category: "Choice",
    needsOptions: true,
  },
  {
    type: "multi_select",
    label: "Multi-select",
    description: "Compact multi-select dropdown list.",
    category: "Choice",
    needsOptions: true,
  },
  {
    type: "number",
    label: "Number",
    description: "Numeric input for age, weight, fees, or counts.",
    category: "Advanced",
  },
  {
    type: "email",
    label: "Email",
    description: "Email address field with browser validation.",
    category: "Contact",
  },
  {
    type: "phone",
    label: "Phone number",
    description: "Phone field for mobile or WhatsApp contact.",
    category: "Contact",
  },
  {
    type: "link",
    label: "Link",
    description: "Website or profile link.",
    category: "Advanced",
  },
  {
    type: "file_upload",
    label: "File upload",
    description: "Upload a document, image, or attachment.",
    category: "Advanced",
  },
  {
    type: "date",
    label: "Date",
    description: "Calendar date field.",
    category: "Advanced",
  },
  {
    type: "time",
    label: "Time",
    description: "Time picker field.",
    category: "Advanced",
  },
  {
    type: "linear_scale",
    label: "Linear scale",
    description: "Numeric rating scale such as 1 to 5 or 1 to 10.",
    category: "Advanced",
  },
];

export function fieldTypeNeedsOptions(type: FormFieldType) {
  return (
    type === "dropdown" ||
    type === "multi_select" ||
    type === "multiple_choice" ||
    type === "checkbox"
  );
}

export type IntakeForm = {
  id: string;
  slug: string;
  title: string;
  description: string;
  audience: string;
  status: "Active" | "Draft";
  redirectUrl?: string;
  fields: IntakeFormField[];
};

export type IntakeFormResponse = {
  id: string;
  formId: string;
  submittedAt: string;
  answers: Record<string, string>;
  memberId?: string;
  respondentPhone?: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    browser?: string;
    operatingSystem?: string;
    deviceType?: string;
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
    submittedFrom?: string;
  };
};

export type FormsStore = {
  forms: IntakeForm[];
  responses: IntakeFormResponse[];
};

export type NewIntakeFormInput = {
  title: string;
  description: string;
  audience: string;
  redirectUrl?: string;
  fields?: IntakeFormField[];
};

export const starterForms: IntakeForm[] = [
  {
    id: "form-1",
    slug: "client-intake",
    title: "Client Intake Form",
    description: "Collect basic workshop joining details, goals, and contact info.",
    audience: "New clients",
    status: "Active",
    redirectUrl: "",
    fields: [
      { id: "name", label: "Full name", type: "short_text", required: true },
      { id: "phone", label: "Phone number", type: "phone", required: true },
      { id: "email", label: "Email address", type: "email", required: true },
      {
        id: "goal",
        label: "Primary goal",
        type: "multiple_choice",
        required: true,
        options: ["Weight loss", "Yoga mobility", "Strength", "Stress relief"],
      },
      {
        id: "notes",
        label: "Any health note or expectation",
        type: "paragraph",
        required: false,
        condition: {
          fieldId: "goal",
          equals: "Yoga mobility",
        },
      },
    ],
  },
  {
    id: "form-2",
    slug: "weekly-feedback",
    title: "Weekly Feedback Form",
    description: "Take quick feedback after weekly online sessions.",
    audience: "Existing workshop clients",
    status: "Active",
    redirectUrl: "",
    fields: [
      { id: "name", label: "Full name", type: "short_text", required: true },
      {
        id: "favorite",
        label: "Which class helped most this week?",
        type: "short_text",
        required: true,
      },
      {
        id: "improve",
        label: "What should we improve next week?",
        type: "paragraph",
        required: false,
      },
      {
        id: "topics",
        label: "Which topics do you want next?",
        type: "checkbox",
        required: false,
        options: ["Mobility", "Breathwork", "Core", "Fat loss"],
      },
    ],
  },
];

export const starterResponses: IntakeFormResponse[] = [
  {
    id: "response-1",
    formId: "form-1",
    submittedAt: "2026-03-18 08:45",
    respondentPhone: "+91 98765 40000",
    metadata: {
      browser: "Chrome",
      operatingSystem: "Android",
      deviceType: "Mobile",
      country: "India",
      city: "Surat",
      timezone: "Asia/Calcutta",
      submittedFrom: "Surat, India",
    },
    answers: {
      name: "Riya Sharma",
      phone: "+91 98765 40000",
      email: "riya@example.com",
      goal: "Yoga mobility",
      notes: "Need low-impact sessions for the first week.",
    },
  },
  {
    id: "response-2",
    formId: "form-1",
    submittedAt: "2026-03-18 09:05",
    respondentPhone: "+91 98765 41111",
    metadata: {
      browser: "Safari",
      operatingSystem: "iOS",
      deviceType: "Mobile",
      country: "India",
      city: "Ahmedabad",
      timezone: "Asia/Calcutta",
      submittedFrom: "Ahmedabad, India",
    },
    answers: {
      name: "Parth Mehta",
      phone: "+91 98765 41111",
      email: "parth@example.com",
      goal: "Weight loss",
      notes: "Available only for morning classes.",
    },
  },
  {
    id: "response-3",
    formId: "form-2",
    submittedAt: "2026-03-18 10:15",
    metadata: {
      browser: "Chrome",
      operatingSystem: "Windows",
      deviceType: "Desktop",
      country: "India",
      city: "Rajkot",
      timezone: "Asia/Calcutta",
      submittedFrom: "Rajkot, India",
    },
    answers: {
      name: "Diya Patel",
      favorite: "Fat Loss Mobility Flow",
      improve: "Please share replay link after class.",
      topics: "Mobility, Core",
    },
  },
];

export function slugifyFormTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildDefaultFormFields(title: string): IntakeFormField[] {
  return [
    { id: "name", label: "Full name", type: "short_text", required: true },
    { id: "phone", label: "Phone number", type: "phone", required: true },
    { id: "email", label: "Email address", type: "email", required: true },
    {
      id: "notes",
      label: `${title} details`,
      type: "paragraph",
      required: false,
    },
  ];
}
