/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import { CRM_LOST_REASONS, CRM_SOURCES, CRM_STAGES } from "@plane/constants";
import type { TCrmCompany, TCrmLead, TCrmLeadPayload, TCrmStage } from "@plane/types";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local
import { Field, SidePanel, inputClassName } from "./common";

type Props = {
  lead: TCrmLead | null; // null = creating
  initialStage?: TCrmStage;
  companies: TCrmCompany[];
  onSave: (data: TCrmLeadPayload) => Promise<unknown>;
  onDelete?: () => Promise<unknown>;
  onClose: () => void;
};

const pad = (n: number) => String(n).padStart(2, "0");

// Datetime-local inputs need "YYYY-MM-DDTHH:mm" in the viewer's local time; the API stores UTC.
const toLocalInput = (value: string | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);

export const CrmLeadPanel = observer(function CrmLeadPanel({
  lead,
  initialStage,
  companies,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const {
    workspace: { workspaceMemberIds },
    getUserDetails,
  } = useMember();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: lead?.name ?? "",
    phone: lead?.phone ?? "",
    company: lead?.company ?? "",
    stage: lead?.stage ?? initialStage ?? "schedule_meeting",
    source: lead?.source ?? "",
    assignee: lead?.assignee ?? "",
    last_contact_date: lead?.last_contact_date ?? "",
    next_follow_up_date: lead?.next_follow_up_date ?? "",
    next_action: lead?.next_action ?? "",
    meeting_date: toLocalInput(lead?.meeting_date),
    onboarding_date: toLocalInput(lead?.onboarding_date),
    data_received: lead?.data_received ?? false,
    whatsapp_group_created: lead?.whatsapp_group_created ?? false,
    lost_reason: lead?.lost_reason ?? "",
    notes: lead?.notes ?? "",
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const result = await onSave({
      name: form.name.trim(),
      phone: form.phone,
      company: form.company || null,
      stage: form.stage,
      source: form.source,
      assignee: form.assignee || null,
      last_contact_date: form.last_contact_date || null,
      next_follow_up_date: form.next_follow_up_date || null,
      next_action: form.next_action,
      meeting_date: fromLocalInput(form.meeting_date),
      onboarding_date: fromLocalInput(form.onboarding_date),
      data_received: form.data_received,
      whatsapp_group_created: form.whatsapp_group_created,
      lost_reason: form.stage === "lost" ? form.lost_reason : "",
      notes: form.notes,
    });
    setSaving(false);
    if (result) onClose();
  };

  return (
    <SidePanel
      title={lead ? lead.name : "Registrar lead"}
      onClose={onClose}
      footer={
        <>
          {lead && onDelete ? (
            <button
              type="button"
              className="text-red-600 text-13"
              onClick={async () => {
                if (window.confirm("¿Eliminar este lead?")) {
                  await onDelete();
                  onClose();
                }
              }}
            >
              Eliminar
            </button>
          ) : (
            <span />
          )}
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            label={lead ? "Guardar" : "Crear"}
            onClick={submit}
            loading={saving}
          />
        </>
      }
    >
      <Field label="Nombre *">
        <input className={inputClassName} value={form.name} onChange={(e) => set("name", e.target.value)} />
      </Field>
      <Field label="Teléfono / WhatsApp">
        <input className={inputClassName} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
      </Field>
      <Field label="Empresa">
        <select className={inputClassName} value={form.company} onChange={(e) => set("company", e.target.value)}>
          <option value="">Sin empresa</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Etapa">
        <select
          className={inputClassName}
          value={form.stage}
          onChange={(e) => set("stage", e.target.value as TCrmLead["stage"])}
        >
          {CRM_STAGES.map((stage) => (
            <option key={stage.key} value={stage.key}>
              {stage.label}
            </option>
          ))}
        </select>
      </Field>
      {form.stage === "lost" && (
        <Field label="Motivo de pérdida">
          <select
            className={inputClassName}
            value={form.lost_reason}
            onChange={(e) => set("lost_reason", e.target.value as TCrmLead["lost_reason"])}
          >
            <option value="">—</option>
            {CRM_LOST_REASONS.map((reason) => (
              <option key={reason.key} value={reason.key}>
                {reason.label}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Responsable de atención">
        <select className={inputClassName} value={form.assignee} onChange={(e) => set("assignee", e.target.value)}>
          <option value="">Sin asignar</option>
          {(workspaceMemberIds ?? []).map((id) => (
            <option key={id} value={id}>
              {getUserDetails(id)?.display_name ?? id}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Fuente">
        <select
          className={inputClassName}
          value={form.source}
          onChange={(e) => set("source", e.target.value as TCrmLead["source"])}
        >
          <option value="">—</option>
          {CRM_SOURCES.map((source) => (
            <option key={source.key} value={source.key}>
              {source.label}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Último contacto">
          <input
            type="date"
            className={inputClassName}
            value={form.last_contact_date}
            onChange={(e) => set("last_contact_date", e.target.value)}
          />
        </Field>
        <Field label="Próximo seguimiento">
          <input
            type="date"
            className={inputClassName}
            value={form.next_follow_up_date}
            onChange={(e) => set("next_follow_up_date", e.target.value)}
          />
        </Field>
        <Field label="Fecha de reunión">
          <input
            type="datetime-local"
            className={inputClassName}
            value={form.meeting_date}
            onChange={(e) => set("meeting_date", e.target.value)}
          />
        </Field>
        <Field label="Fecha de onboarding">
          <input
            type="datetime-local"
            className={inputClassName}
            value={form.onboarding_date}
            onChange={(e) => set("onboarding_date", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Próxima acción">
        <input
          className={inputClassName}
          value={form.next_action}
          onChange={(e) => set("next_action", e.target.value)}
        />
      </Field>
      <div className="flex gap-6 text-13 text-secondary">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.data_received}
            onChange={(e) => set("data_received", e.target.checked)}
          />
          Datos recibidos
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.whatsapp_group_created}
            onChange={(e) => set("whatsapp_group_created", e.target.checked)}
          />
          Grupo WhatsApp creado
        </label>
      </div>
      <Field label="Notas">
        <textarea
          className={`${inputClassName} min-h-28`}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </Field>
    </SidePanel>
  );
});
