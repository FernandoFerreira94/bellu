export type CalendarView = "day" | "week" | "month" | "agenda";

export type CalendarEventStatus = "confirmed" | "tentative" | "cancelled";
export type CalendarEventSource = "google" | "manual" | "whatsapp" | "luna";
export type FinanceEntryType = "income" | "expense";
export type WhatsAppConnectionStatus = "disconnected" | "pairing" | "connected";
export type LunaMessageRole = "assistant" | "user" | "system";

export type Service = {
  id: string;
  name: string;
  description: string | null;
  durationInMinutes: number;
  price: number;
  isActive: boolean;
  lunaEnabled: boolean;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientHistoryItem = {
  id: string;
  eventId: string | null;
  serviceId: string | null;
  date: string;
  notes: string | null;
  amount: number | null;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  birthDate: string | null;
  notes: string | null;
  tags: string[];
  lastVisitAt: string | null;
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalVisits: number;
    lifetimeValue: number;
  };
};

export type ClientProfile = Client & {
  history: ClientHistoryItem[];
};

export type CalendarEvent = {
  id: string;
  externalId: string | null;
  title: string;
  description: string | null;
  start: string;
  end: string;
  status: CalendarEventStatus;
  source: CalendarEventSource;
  clientId: string | null;
  serviceId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FinanceEntry = {
  id: string;
  type: FinanceEntryType;
  category: string;
  description: string | null;
  amount: number;
  occurredAt: string;
  serviceId: string | null;
  clientId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FinanceSummary = {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  periodLabel: string;
};

export type WorkingHours = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export type WhatsAppSession = {
  id: string;
  status: WhatsAppConnectionStatus;
  qrCode: string | null;
  phone: string | null;
  sessionPath: string;
  updatedAt: string;
};

export type Settings = {
  workingHours: WorkingHours[];
  gapBetweenClientsInMinutes: number;
  whatsapp: {
    sessionPath: string;
    autoReplyEnabled: boolean;
    qrCode: string | null;
  };
};

export type LunaMessage = {
  id: string;
  role: LunaMessageRole;
  content: string;
  createdAt: string;
};

export type LunaChatState = {
  isOpen: boolean;
  messages: LunaMessage[];
  isLoading: boolean;
};

export type CalendarSyncPayload = {
  events: CalendarEvent[];
  nextSyncToken: string | null;
  syncedAt: string;
};

export type GoogleCalendarWebhookPayload = {
  channelId: string;
  resourceId: string;
  resourceState: string;
  resourceUri: string | null;
  receivedAt: string;
};

export type DashboardDaySummary = {
  date: string;
  appointmentsCount: number;
  clientsCount: number;
  expectedRevenue: number;
  pendingMessages: number;
};

export type Specialty =
  | 'nail_designer'
  | 'hair'
  | 'makeup'
  | 'waxing'
  | 'massage'
  | 'other';

export type StudioProfile = {
  id: string;
  studio_name: string;
  owner_name: string;
  specialty: Specialty;
  logo_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
};
