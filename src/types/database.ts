export type ProfessionalSlug = "ester" | "izabela";
export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";
export type PaymentMethod = "pix" | "cash" | "debit" | "credit" | "transfer" | "other";
export type ReceivableStatus = "pending" | "partial" | "paid" | "cancelled";
export type ExpenseResponsibility = "ester" | "izabela" | "shared";
export type ExpenseStatus = "planned" | "pending" | "paid" | "cancelled";
export type RecurrenceInterval = "none" | "weekly" | "monthly" | "yearly";
export type ReturnStatus =
  | "upcoming"
  | "near"
  | "overdue"
  | "scheduled"
  | "completed"
  | "dismissed";
export type FinancialBasis = "accrual" | "cash";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export type ProfessionalRow = {
  id: string;
  slug: ProfessionalSlug;
  display_name: string;
  short_name: string;
  accent_color: string;
  instagram_handle: string | null;
  is_active: boolean;
} & Timestamps;

export type ProfileRow = {
  id: string;
  full_name: string;
  professional_id: string;
  is_active: boolean;
} & Timestamps;

export type BusinessSettingsRow = {
  id: number;
  clinic_name: string;
  ester_share_bps: number;
  izabela_share_bps: number;
  cash_reserve_cents: number | string;
  notes: string | null;
} & Timestamps;

export type RoomRow = {
  id: string;
  name: string;
  is_active: boolean;
} & Timestamps;

export type ClientRow = {
  id: string;
  full_name: string;
  phone: string;
  phone_normalized: string;
  birth_date: string | null;
  reference_professional_id: string | null;
  notes: string | null;
  contact_consent: boolean;
  is_active: boolean;
} & Timestamps;

export type ProcedureRow = {
  id: string;
  name: string;
  short_description: string | null;
  category: string;
  default_price_cents: number | string;
  duration_minutes: number;
  suggested_return_days: number | null;
  requires_return_confirmation: boolean;
  is_active: boolean;
} & Timestamps;

export type AppointmentRow = {
  id: string;
  client_id: string;
  professional_id: string;
  procedure_id: string;
  room_id: string | null;
  starts_at: string;
  ends_at: string;
  expected_amount_cents: number | string;
  status: AppointmentStatus;
  created_by: string | null;
} & Timestamps;

export type AppointmentBoardRow = {
  id: string;
  professional_id: string;
  procedure_id: string;
  room_id: string | null;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  client_id: string | null;
  expected_amount_cents: number | string | null;
  created_at: string;
  updated_at: string;
};

export type ReceivableRow = {
  id: string;
  professional_id: string;
  client_id: string | null;
  service_record_id: string | null;
  description: string;
  competence_date: string;
  amount_cents: number | string;
  status: ReceivableStatus;
  created_by: string;
} & Timestamps;

export type PaymentRow = {
  id: string;
  receivable_id: string;
  professional_id: string;
  amount_cents: number | string;
  paid_at: string;
  method: PaymentMethod;
  notes: string | null;
  created_by: string;
  created_at: string;
};

export type ExpenseRow = {
  id: string;
  description: string;
  category_id: string;
  amount_cents: number | string;
  competence_date: string;
  due_date: string | null;
  paid_at: string | null;
  responsibility: ExpenseResponsibility;
  payment_method: PaymentMethod | null;
  status: ExpenseStatus;
  recurrence: RecurrenceInterval;
  recurrence_group_id: string | null;
  notes: string | null;
  created_by: string;
} & Timestamps;

export type ReturnReminderRow = {
  id: string;
  client_id: string;
  professional_id: string;
  service_record_id: string | null;
  procedure_id: string | null;
  last_service_at: string;
  suggested_return_on: string;
  status: ReturnStatus;
  contact_authorized: boolean;
  last_contacted_at: string | null;
  linked_appointment_id: string | null;
} & Timestamps;

export type Database = {
  public: {
    Tables: {
      professionals: {
        Row: ProfessionalRow;
        Insert: Partial<ProfessionalRow> &
          Pick<ProfessionalRow, "slug" | "display_name" | "short_name" | "accent_color">;
        Update: Partial<ProfessionalRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Pick<ProfileRow, "id" | "full_name" | "professional_id"> &
          Partial<Omit<ProfileRow, "id" | "full_name" | "professional_id">>;
        Update: Partial<Omit<ProfileRow, "id">>;
        Relationships: [];
      };
      business_settings: {
        Row: BusinessSettingsRow;
        Insert: Partial<BusinessSettingsRow>;
        Update: Partial<BusinessSettingsRow>;
        Relationships: [];
      };
      rooms: {
        Row: RoomRow;
        Insert: Pick<RoomRow, "name"> & Partial<RoomRow>;
        Update: Partial<RoomRow>;
        Relationships: [];
      };
      clients: {
        Row: ClientRow;
        Insert: Pick<ClientRow, "full_name" | "phone" | "phone_normalized"> & Partial<ClientRow>;
        Update: Partial<ClientRow>;
        Relationships: [];
      };
      procedures: {
        Row: ProcedureRow;
        Insert: Pick<
          ProcedureRow,
          "name" | "category" | "default_price_cents" | "duration_minutes"
        > &
          Partial<ProcedureRow>;
        Update: Partial<ProcedureRow>;
        Relationships: [];
      };
      appointments: {
        Row: AppointmentRow;
        Insert: Omit<AppointmentRow, "id" | "created_at" | "updated_at" | "status"> &
          Partial<Pick<AppointmentRow, "id" | "status" | "created_by" | "room_id">>;
        Update: Partial<AppointmentRow>;
        Relationships: [];
      };
      receivables: {
        Row: ReceivableRow;
        Insert: Omit<ReceivableRow, "id" | "created_at" | "updated_at" | "status"> &
          Partial<Pick<ReceivableRow, "id" | "status" | "client_id" | "service_record_id">>;
        Update: Partial<ReceivableRow>;
        Relationships: [];
      };
      payments: {
        Row: PaymentRow;
        Insert: Omit<PaymentRow, "id" | "created_at"> & Partial<Pick<PaymentRow, "id" | "notes">>;
        Update: Partial<PaymentRow>;
        Relationships: [];
      };
      expenses: {
        Row: ExpenseRow;
        Insert: Omit<ExpenseRow, "id" | "created_at" | "updated_at"> & Partial<ExpenseRow>;
        Update: Partial<ExpenseRow>;
        Relationships: [];
      };
      return_reminders: {
        Row: ReturnReminderRow;
        Insert: Omit<ReturnReminderRow, "id" | "created_at" | "updated_at"> &
          Partial<ReturnReminderRow>;
        Update: Partial<ReturnReminderRow>;
        Relationships: [];
      };
    };
    Views: {
      appointment_board: {
        Row: AppointmentBoardRow;
        Relationships: [];
      };
      my_appointments: {
        Row: AppointmentRow;
        Relationships: [];
      };
    };
    Functions: {
      is_partner: { Args: Record<string, never>; Returns: boolean };
      current_professional_id: { Args: Record<string, never>; Returns: string };
      current_professional_slug: { Args: Record<string, never>; Returns: ProfessionalSlug };
      write_audit_log: {
        Args: {
          p_action: string;
          p_entity_type: string;
          p_entity_id: string | null;
          p_metadata?: Json;
        };
        Returns: undefined;
      };
    };
    Enums: {
      professional_slug: ProfessionalSlug;
      appointment_status: AppointmentStatus;
      payment_method: PaymentMethod;
      receivable_status: ReceivableStatus;
      expense_responsibility: ExpenseResponsibility;
      expense_status: ExpenseStatus;
      recurrence_interval: RecurrenceInterval;
      return_status: ReturnStatus;
      financial_basis: FinancialBasis;
    };
    CompositeTypes: Record<string, never>;
  };
};
