/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TCrmStage =
  | "schedule_meeting"
  | "meeting_scheduled"
  | "reschedule"
  | "schedule_onboarding"
  | "waiting_data"
  | "first_week"
  | "active_client"
  | "lost";

export type TCrmSource = "referral" | "social" | "event" | "outbound" | "website" | "other";

export type TCrmLostReason = "price" | "no_budget" | "competitor" | "no_response" | "bad_timing" | "other";

export type TCrmBusinessType =
  | "restaurant"
  | "cafe"
  | "bar"
  | "fast_food"
  | "dark_kitchen"
  | "bakery"
  | "hotel"
  | "other";

export type TCrmAlert = "ok" | "cold" | "new";

export type TCrmLead = {
  id: string;
  workspace: string;
  company: string | null;
  company_name: string | null;
  name: string;
  phone: string;
  stage: TCrmStage;
  source: TCrmSource | "";
  assignee: string | null;
  last_contact_date: string | null;
  next_follow_up_date: string | null;
  next_action: string;
  meeting_date: string | null;
  onboarding_date: string | null;
  data_received: boolean;
  whatsapp_group_created: boolean;
  lost_reason: TCrmLostReason | "";
  notes: string;
  sort_order: number;
  created_at: string;
  // computed by the API
  days_since_contact: number | null;
  alert: TCrmAlert;
  stage_number: number;
  what_to_write: string;
};

export type TCrmCompany = {
  id: string;
  workspace: string;
  name: string;
  business_type: TCrmBusinessType | "";
  city: string;
  website: string;
  branches_count: number | null;
  employees_count: number | null;
  notes: string;
  created_at: string;
  // computed by the API
  size: string;
  people_count: number;
  cold_people_count: number;
  most_advanced_stage: TCrmStage | null;
  assignee_ids: string[];
  last_contact_date: string | null;
  alert: TCrmAlert;
};

export type TCrmLeadPayload = Partial<
  Omit<
    TCrmLead,
    | "id"
    | "workspace"
    | "company_name"
    | "created_at"
    | "days_since_contact"
    | "alert"
    | "stage_number"
    | "what_to_write"
    | "sort_order"
  >
>;

export type TCrmCompanyPayload = Partial<
  Omit<
    TCrmCompany,
    | "id"
    | "workspace"
    | "created_at"
    | "size"
    | "people_count"
    | "cold_people_count"
    | "most_advanced_stage"
    | "assignee_ids"
    | "last_contact_date"
    | "alert"
  >
>;
