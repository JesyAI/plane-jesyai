/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import { CRM_BUSINESS_TYPES } from "@plane/constants";
import type { TCrmCompany, TCrmCompanyPayload } from "@plane/types";
// local
import { Field, SidePanel, inputClassName } from "./common";

type Props = {
  company: TCrmCompany | null; // null = creating
  onSave: (data: TCrmCompanyPayload) => Promise<unknown>;
  onDelete?: () => Promise<unknown>;
  onClose: () => void;
};

const toNumber = (value: string) => (value === "" ? null : Number(value));

export function CrmCompanyPanel({ company, onSave, onDelete, onClose }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: company?.name ?? "",
    business_type: company?.business_type ?? "",
    city: company?.city ?? "",
    website: company?.website ?? "",
    branches_count: company?.branches_count?.toString() ?? "",
    employees_count: company?.employees_count?.toString() ?? "",
    notes: company?.notes ?? "",
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const result = await onSave({
      name: form.name.trim(),
      business_type: form.business_type,
      city: form.city,
      website: form.website,
      branches_count: toNumber(form.branches_count),
      employees_count: toNumber(form.employees_count),
      notes: form.notes,
    });
    setSaving(false);
    if (result) onClose();
  };

  return (
    <SidePanel
      title={company ? company.name : "Nueva empresa"}
      onClose={onClose}
      footer={
        <>
          {company && onDelete ? (
            <button
              type="button"
              className="text-red-600 text-13"
              onClick={async () => {
                if (window.confirm("¿Eliminar esta empresa? Sus leads se conservan sin empresa.")) {
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
            label={company ? "Guardar" : "Crear"}
            onClick={submit}
            loading={saving}
          />
        </>
      }
    >
      <Field label="Empresa *">
        <input className={inputClassName} value={form.name} onChange={(e) => set("name", e.target.value)} />
      </Field>
      <Field label="Tipo de negocio">
        <select
          className={inputClassName}
          value={form.business_type}
          onChange={(e) => set("business_type", e.target.value as TCrmCompany["business_type"])}
        >
          <option value="">—</option>
          {CRM_BUSINESS_TYPES.map((type) => (
            <option key={type.key} value={type.key}>
              {type.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Ciudad">
        <input className={inputClassName} value={form.city} onChange={(e) => set("city", e.target.value)} />
      </Field>
      <Field label="Sitio web">
        <input
          className={inputClassName}
          placeholder="https://"
          value={form.website}
          onChange={(e) => set("website", e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Núm. sucursales">
          <input
            type="number"
            min={0}
            className={inputClassName}
            value={form.branches_count}
            onChange={(e) => set("branches_count", e.target.value)}
          />
        </Field>
        <Field label="Núm. empleados">
          <input
            type="number"
            min={0}
            className={inputClassName}
            value={form.employees_count}
            onChange={(e) => set("employees_count", e.target.value)}
          />
        </Field>
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
}
