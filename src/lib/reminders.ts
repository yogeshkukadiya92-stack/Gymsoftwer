import { IntakeForm, IntakeFormResponse } from "@/lib/forms";
import { AppData, ClassSession, Membership, Profile } from "@/lib/types";

export type ReminderCategory = "Renewal" | "Class" | "Form follow-up";

export type ReminderRecipient = {
  id: string;
  name: string;
  phone: string;
  note: string;
  whatsappUrl: string;
};

export type ReminderCampaign = {
  id: string;
  title: string;
  category: ReminderCategory;
  scheduledFor: string;
  recipientCount: number;
  message: string;
  summary: string;
  recipients: ReminderRecipient[];
};

function notNull<T>(value: T | null): value is T {
  return value !== null;
}

function formatDateLabel(value: string) {
  if (!value) {
    return "Today";
  }

  return value;
}

function sanitizePhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export function buildWhatsAppLink(phone: string, message: string) {
  const normalizedPhone = sanitizePhone(phone);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

function buildRenewalMessage(member: Profile, membership: Membership) {
  return `Hi ${member.fullName}, your ${membership.planName} membership is ${membership.paymentStatus.toLowerCase()}. Outstanding amount: INR ${membership.outstandingAmountInr}. Please complete renewal by ${membership.renewalDate}. Reply here if you need help.`;
}

function buildClassMessage(member: Profile, session: ClassSession) {
  return `Hi ${member.fullName}, reminder for your ${session.title} class on ${session.day} at ${session.time}. Please join 5 minutes early. Reply if you need the meeting link again.`;
}

function buildFormFollowUpMessage(member: Profile, form: IntakeForm) {
  return `Hi ${member.fullName}, please complete our ${form.title}. It helps us prepare your sessions better. Fill it here when convenient and reply if you need support.`;
}

function createRecipient(
  member: Profile,
  note: string,
  message: string,
): ReminderRecipient {
  return {
    id: member.id,
    name: member.fullName,
    phone: member.phone,
    note,
    whatsappUrl: buildWhatsAppLink(member.phone, message),
  };
}

function buildRenewalCampaigns(data: AppData) {
  return data.memberships
    .filter(
      (membership) =>
        membership.outstandingAmountInr > 0 ||
        membership.paymentStatus === "Pending" ||
        membership.paymentStatus === "Overdue",
    )
    .map((membership) => {
      const member = data.profiles.find((profile) => profile.id === membership.memberId);

      if (!member) {
        return null;
      }

      const message = buildRenewalMessage(member, membership);
      const recipient = createRecipient(
        member,
        `${membership.planName} renewal due on ${membership.renewalDate}`,
        message,
      );

      return {
        id: `renewal-${membership.id}`,
        title: `${member.fullName} renewal follow-up`,
        category: "Renewal" as const,
        scheduledFor: formatDateLabel(membership.nextInvoiceDate),
        recipientCount: 1,
        message,
        summary: `${membership.paymentStatus} membership renewal with INR ${membership.outstandingAmountInr} outstanding.`,
        recipients: [recipient],
      };
    })
    .filter(notNull);
}

function buildClassCampaigns(data: AppData) {
  return data.sessions
    .map((session) => {
      const bookedEntries = data.attendance.filter(
        (entry) => entry.sessionId === session.id && entry.status === "Booked",
      );
      const recipients = bookedEntries
        .map((entry) => {
          const member = data.profiles.find((profile) => profile.id === entry.memberId);

          if (!member) {
            return null;
          }

          const message = buildClassMessage(member, session);
          return createRecipient(
            member,
            `${session.day} ${session.time} with ${session.coach}`,
            message,
          );
        })
        .filter(notNull);

      if (recipients.length === 0) {
        return null;
      }

      const sampleMember = data.profiles.find(
        (profile) => profile.id === bookedEntries[0]?.memberId,
      );
      const message = sampleMember
        ? buildClassMessage(sampleMember, session)
        : `Reminder for ${session.title}`;

      return {
        id: `class-${session.id}`,
        title: `${session.title} attendance reminder`,
        category: "Class" as const,
        scheduledFor: `${session.day} ${session.time}`,
        recipientCount: recipients.length,
        message,
        summary: `${recipients.length} booked attendee(s) for ${session.room}.`,
        recipients,
      };
    })
    .filter(notNull);
}

function buildFormFollowUpCampaigns(
  data: AppData,
  forms: IntakeForm[],
  responses: IntakeFormResponse[],
) {
  const members = data.profiles.filter((profile) => profile.role === "member");

  return forms
    .map((form) => {
      const submittedNames = new Set(
        responses
          .filter((response) => response.formId === form.id)
          .map((response) => response.answers.name?.trim().toLowerCase())
          .filter(Boolean),
      );

      const recipients = members
        .filter((member) => !submittedNames.has(member.fullName.trim().toLowerCase()))
        .map((member) => {
          const message = buildFormFollowUpMessage(member, form);
          return createRecipient(
            member,
            `${form.audience} follow-up`,
            `${message} Form link: /forms/${form.slug}`,
          );
        });

      if (recipients.length === 0) {
        return null;
      }

      return {
        id: `form-${form.id}`,
        title: `${form.title} follow-up`,
        category: "Form follow-up" as const,
        scheduledFor: "Any time this week",
        recipientCount: recipients.length,
        message: `Please complete ${form.title}. Form link: /forms/${form.slug}`,
        summary: `${recipients.length} member(s) have not yet submitted this form.`,
        recipients,
      };
    })
    .filter(notNull);
}

export function buildReminderCampaigns(
  data: AppData,
  forms: IntakeForm[],
  responses: IntakeFormResponse[],
) {
  const campaigns: ReminderCampaign[] = [
    ...buildRenewalCampaigns(data),
    ...buildClassCampaigns(data),
    ...buildFormFollowUpCampaigns(data, forms, responses),
  ];

  return campaigns;
}

export function getReminderStats(campaigns: ReminderCampaign[]) {
  const totalRecipients = campaigns.reduce(
    (sum, campaign) => sum + campaign.recipientCount,
    0,
  );
  const renewalCount = campaigns.filter(
    (campaign) => campaign.category === "Renewal",
  ).length;
  const classCount = campaigns.filter(
    (campaign) => campaign.category === "Class",
  ).length;
  const followUpCount = campaigns.filter(
    (campaign) => campaign.category === "Form follow-up",
  ).length;

  return {
    totalRecipients,
    renewalCount,
    classCount,
    followUpCount,
  };
}
