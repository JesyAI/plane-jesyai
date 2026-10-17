/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TCrmBusinessType, TCrmLostReason, TCrmSource, TCrmStage } from "@plane/types";

export const CRM_STAGES: { key: TCrmStage; label: string; color: string }[] = [
  { key: "schedule_meeting", label: "1. Agendar reunión", color: "#8c8c8c" },
  { key: "meeting_scheduled", label: "2. Reunión agendada", color: "#3f76ff" },
  { key: "reschedule", label: "2b. Reagendar / seguimiento", color: "#e5484d" },
  { key: "schedule_onboarding", label: "3. Agendar onboarding", color: "#8e4ec6" },
  { key: "waiting_data", label: "4. Esperando datos", color: "#e5a000" },
  { key: "first_week", label: "5. Primera semana (grupo WA)", color: "#f76b15" },
  { key: "active_client", label: "6. Cliente activo", color: "#30a46c" },
  { key: "lost", label: "Perdido", color: "#8b5e34" },
];

export const CRM_STAGE_LABELS = Object.fromEntries(CRM_STAGES.map((s) => [s.key, s.label])) as Record<
  TCrmStage,
  string
>;

export const CRM_SOURCES: { key: TCrmSource; label: string }[] = [
  { key: "referral", label: "Referido" },
  { key: "social", label: "Redes sociales" },
  { key: "event", label: "Evento" },
  { key: "outbound", label: "Outbound" },
  { key: "website", label: "Sitio web" },
  { key: "other", label: "Otro" },
];

export const CRM_LOST_REASONS: { key: TCrmLostReason; label: string }[] = [
  { key: "price", label: "Precio" },
  { key: "no_budget", label: "Sin presupuesto" },
  { key: "competitor", label: "Eligió competidor" },
  { key: "no_response", label: "Sin respuesta" },
  { key: "bad_timing", label: "No era el momento" },
  { key: "other", label: "Otro" },
];

export const CRM_BUSINESS_TYPES: { key: TCrmBusinessType; label: string }[] = [
  { key: "restaurant", label: "Restaurante" },
  { key: "cafe", label: "Cafetería" },
  { key: "bar", label: "Bar / Cantina" },
  { key: "fast_food", label: "Comida rápida" },
  { key: "dark_kitchen", label: "Dark kitchen" },
  { key: "bakery", label: "Panadería / Pastelería" },
  { key: "hotel", label: "Hotel / Eventos" },
  { key: "other", label: "Otro" },
];

export const CRM_ALERT_LABELS = {
  ok: "🟢 Al día",
  cold: "🔴 Frío",
  new: "🆕 Sin contacto",
} as const;
