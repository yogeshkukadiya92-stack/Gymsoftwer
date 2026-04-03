export type LeadStatus =
  | "New"
  | "Contacted"
  | "Trial Booked"
  | "Converted"
  | "Lost";

export type LeadSource = "WhatsApp" | "Instagram" | "Referral" | "Walk-in" | "Website";

export type LeadRecord = {
  id: string;
  fullName: string;
  phone: string;
  goal: string;
  source: LeadSource;
  status: LeadStatus;
  assignedTo: string;
  nextFollowUp: string;
  note: string;
};

export type DietPlanRecord = {
  id: string;
  memberId?: string;
  memberName: string;
  coach: string;
  goal: string;
  calories: number;
  proteinGrams: number;
  meals: Array<{
    title: string;
    items: string[];
  }>;
  adherence: number;
  updatedOn: string;
};

export type CustomWhatsAppCampaign = {
  id: string;
  title: string;
  category: "Custom";
  scheduledFor: string;
  message: string;
  recipients: Array<{
    id: string;
    name: string;
    phone: string;
    note: string;
  }>;
};

export type TrainerClientNote = {
  id: string;
  memberId: string;
  memberName: string;
  trainerName: string;
  note: string;
  focusArea: string;
  updatedOn: string;
};

export const starterLeads: LeadRecord[] = [
  {
    id: "lead-1",
    fullName: "Khushi Patel",
    phone: "+91 98765 30001",
    goal: "Fat loss with online accountability",
    source: "Instagram",
    status: "New",
    assignedTo: "Yogesh Kukadiya",
    nextFollowUp: "2026-03-30",
    note: "Asked about morning Zoom batch and diet support.",
  },
  {
    id: "lead-2",
    fullName: "Ritesh Sharma",
    phone: "+91 98765 30002",
    goal: "Strength and posture correction",
    source: "Referral",
    status: "Contacted",
    assignedTo: "Naina Kapoor",
    nextFollowUp: "2026-03-31",
    note: "Interested in trainer-led hybrid plan with supplement advice.",
  },
  {
    id: "lead-3",
    fullName: "Neha Mehta",
    phone: "+91 98765 30003",
    goal: "Yoga mobility and stress management",
    source: "Website",
    status: "Trial Booked",
    assignedTo: "Naina Kapoor",
    nextFollowUp: "2026-04-01",
    note: "Booked for Tuesday Zoom class trial.",
  },
  {
    id: "lead-4",
    fullName: "Parth Joshi",
    phone: "+91 98765 30004",
    goal: "Body recomposition",
    source: "WhatsApp",
    status: "Converted",
    assignedTo: "Yogesh Kukadiya",
    nextFollowUp: "2026-04-05",
    note: "Converted into workshop monthly membership.",
  },
];

export const starterDietPlans: DietPlanRecord[] = [
  {
    id: "diet-1",
    memberId: "member-1",
    memberName: "Aarav Mehta",
    coach: "Naina Kapoor",
    goal: "Lean muscle gain",
    calories: 2550,
    proteinGrams: 165,
    adherence: 88,
    updatedOn: "2026-03-24",
    meals: [
      {
        title: "Breakfast",
        items: ["Oats + whey protein", "Banana", "Peanut butter"],
      },
      {
        title: "Lunch",
        items: ["Rice", "Paneer bhurji", "Salad"],
      },
      {
        title: "Post-workout",
        items: ["Whey isolate shake", "Fruit"],
      },
      {
        title: "Dinner",
        items: ["Chapati", "Dal", "Vegetable sabzi", "Curd"],
      },
    ],
  },
  {
    id: "diet-2",
    memberId: "member-2",
    memberName: "Diya Patel",
    coach: "Yogesh Kukadiya",
    goal: "Fat loss and consistency",
    calories: 1820,
    proteinGrams: 125,
    adherence: 79,
    updatedOn: "2026-03-23",
    meals: [
      {
        title: "Breakfast",
        items: ["Greek yogurt", "Chia seeds", "Apple"],
      },
      {
        title: "Lunch",
        items: ["Millet roti", "Mixed veg", "Dal"],
      },
      {
        title: "Evening",
        items: ["Protein bar", "Black coffee"],
      },
      {
        title: "Dinner",
        items: ["Soup", "Tofu stir fry", "Salad"],
      },
    ],
  },
  {
    id: "diet-3",
    memberId: "member-3",
    memberName: "Kabir Shah",
    coach: "Naina Kapoor",
    goal: "Mobility and core strength",
    calories: 2100,
    proteinGrams: 140,
    adherence: 72,
    updatedOn: "2026-03-22",
    meals: [
      {
        title: "Breakfast",
        items: ["Moong chilla", "Curd", "Papaya"],
      },
      {
        title: "Lunch",
        items: ["Rice", "Chicken curry", "Veggies"],
      },
      {
        title: "Snack",
        items: ["Fruit bowl", "Mixed nuts"],
      },
      {
        title: "Dinner",
        items: ["Khichdi", "Paneer salad"],
      },
    ],
  },
];

export const starterCustomCampaigns: CustomWhatsAppCampaign[] = [
  {
    id: "campaign-1",
    title: "Sunday motivation push",
    category: "Custom",
    scheduledFor: "2026-03-29 08:00",
    message:
      "Hi team, a new week starts tomorrow. Please confirm your class attendance and keep your nutrition on point.",
    recipients: [
      {
        id: "member-1",
        name: "Aarav Mehta",
        phone: "+91 98765 43210",
        note: "Strength batch member",
      },
      {
        id: "member-2",
        name: "Diya Patel",
        phone: "+91 98765 45555",
        note: "Workshop monthly client",
      },
    ],
  },
];

export const starterTrainerNotes: TrainerClientNote[] = [
  {
    id: "trainer-note-1",
    memberId: "member-1",
    memberName: "Aarav Mehta",
    trainerName: "Naina Kapoor",
    focusArea: "Lower body strength",
    note: "Squat depth improving. Next week increase top set only if recovery stays high.",
    updatedOn: "2026-03-28",
  },
  {
    id: "trainer-note-2",
    memberId: "member-2",
    memberName: "Diya Patel",
    trainerName: "Yogesh Kukadiya",
    focusArea: "Fat loss consistency",
    note: "Attendance is good. Needs stronger sleep routine and protein consistency.",
    updatedOn: "2026-03-28",
  },
];
