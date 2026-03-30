export type UserRole = "member" | "trainer" | "admin";

export type Exercise = {
  id: string;
  name: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  primaryMuscle: string;
  equipment: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  cues: string[];
};

export type WorkoutPlanExercise = {
  id: string;
  exerciseId: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes: string;
};

export type WorkoutPlan = {
  id: string;
  name: string;
  goal: string;
  coach: string;
  split: string;
  durationWeeks: number;
  exercises: WorkoutPlanExercise[];
};

export type WorkoutAssignment = {
  id: string;
  planId: string;
  memberId: string;
  startDate: string;
  status: "Active" | "Paused" | "Completed";
};

export type WorkoutLog = {
  id: string;
  memberId: string;
  exerciseId: string;
  date: string;
  setsCompleted: number;
  repsCompleted: string;
  weightKg: number;
  notes: string;
};

export type ProgressCheckIn = {
  id: string;
  memberId: string;
  recordedOn: string;
  weightKg: number;
  waistCm: number;
  hipsCm: number;
  chestCm: number;
  thighCm: number;
  coachNote: string;
  energyLevel: "Low" | "Medium" | "High";
};

export type ProgressPhoto = {
  id: string;
  memberId: string;
  recordedOn: string;
  label: string;
  imageUrl: string;
  note: string;
};

export type Membership = {
  id: string;
  memberId: string;
  planName: string;
  status: "Active" | "Expiring Soon" | "On Hold";
  startDate: string;
  renewalDate: string;
  billingCycle: "Monthly" | "Quarterly" | "Yearly";
  amountInr: number;
  paymentStatus: "Paid" | "Pending" | "Overdue" | "Partially Paid";
  lastPaymentDate: string;
  nextInvoiceDate: string;
  paymentMethod: "UPI" | "Cash" | "Bank Transfer" | "Card";
  outstandingAmountInr: number;
};

export type Invoice = {
  id: string;
  membershipId: string;
  memberId: string;
  invoiceNumber: string;
  issuedOn: string;
  dueOn: string;
  amountInr: number;
  status: "Paid" | "Pending" | "Overdue" | "Partially Paid";
  paidOn?: string;
  paymentMethod?: "UPI" | "Cash" | "Bank Transfer" | "Card";
};

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  supplementType: string;
  brand: string;
  flavor: string;
  supplierName: string;
  sku: string;
  batchCode: string;
  unitSize: string;
  expiryDate: string;
  stockUnits: number;
  reorderLevel: number;
  costPriceInr: number;
  sellingPriceInr: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
};

export type InventorySale = {
  id: string;
  itemId: string;
  soldOn: string;
  quantity: number;
  totalAmountInr: number;
  customerName: string;
  paymentMethod: "UPI" | "Cash" | "Bank Transfer" | "Card";
};

export type GymBranch = {
  id: string;
  name: string;
  city: string;
  address: string;
  managerName: string;
  phone: string;
  kind: "Physical" | "Online";
};

export type BranchVisit = {
  id: string;
  memberId: string;
  branchId: string;
  visitDate: string;
  source: "Attendance" | "Membership" | "Walk-in" | "PT Session";
  note: string;
};

export type ClassSession = {
  id: string;
  title: string;
  coach: string;
  day: string;
  time: string;
  capacity: number;
  room: string;
  branchId?: string;
  zoomLink?: string;
};

export type Attendance = {
  id: string;
  sessionId: string;
  memberId: string;
  status: "Booked" | "Checked In" | "Missed";
};

export type Profile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  fitnessGoal: string;
  branch: string;
  joinedOn: string;
};

export type UserPermission = {
  userId: string;
  accessLabel?: string;
  allowedRoutes: string[];
};

export type AppData = {
  profiles: Profile[];
  userPermissions: UserPermission[];
  gymBranches: GymBranch[];
  branchVisits: BranchVisit[];
  memberships: Membership[];
  invoices: Invoice[];
  inventoryItems: InventoryItem[];
  inventorySales: InventorySale[];
  exercises: Exercise[];
  workoutPlans: WorkoutPlan[];
  assignments: WorkoutAssignment[];
  workoutLogs: WorkoutLog[];
  progressCheckIns: ProgressCheckIn[];
  progressPhotos: ProgressPhoto[];
  sessions: ClassSession[];
  attendance: Attendance[];
};
