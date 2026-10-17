/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { cloneElement, useId } from "react";
import type { ReactElement, ReactNode } from "react";
// plane imports
import { CRM_ALERT_LABELS, CRM_STAGES, CRM_STAGE_LABELS } from "@plane/constants";
import type { TCrmAlert, TCrmStage } from "@plane/types";
import { cn } from "@plane/utils";

export const inputClassName =
  "w-full rounded-md border border-subtle bg-surface-1 px-2.5 py-1.5 text-13 text-primary outline-none focus:border-strong";

export function AlertBadge({ alert }: { alert: TCrmAlert }) {
  return (
    <span
      className={cn("rounded-full px-2 py-0.5 text-11 font-medium whitespace-nowrap", {
        "bg-layer-1 text-secondary": alert === "ok",
        "bg-red-500/10 text-red-600": alert === "cold",
        "bg-blue-500/10 text-blue-600": alert === "new",
      })}
    >
      {CRM_ALERT_LABELS[alert]}
    </span>
  );
}

export function StageBadge({ stage }: { stage: TCrmStage | null }) {
  if (!stage) return <span className="text-tertiary">—</span>;
  const color = CRM_STAGES.find((s) => s.key === stage)?.color;
  return (
    <span className="inline-flex items-center gap-1.5 text-12 whitespace-nowrap text-secondary">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
      {CRM_STAGE_LABELS[stage]}
    </span>
  );
}

// The label points at its control by id: wrapping a <select> in the <label> would make the
// selected option part of the field's accessible name ("Empresa Sin empresa").
export function Field({ label, children }: { label: string; children: ReactElement<{ id?: string }> }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-12 font-medium text-tertiary">
        {label}
      </label>
      {cloneElement(children, { id })}
    </div>
  );
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  // Date-only values must not shift by timezone.
  const date = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

export function SidePanel({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-30 flex justify-end bg-black/30"
      role="presentation"
      onMouseDown={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="shadow-xl flex h-full w-full max-w-md flex-col bg-surface-1"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
          <h3 className="text-16 font-semibold text-primary">{title}</h3>
          <button type="button" onClick={onClose} className="text-tertiary hover:text-primary" aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">{children}</div>
        <div className="flex items-center justify-between gap-2 border-t border-subtle px-4 py-3">{footer}</div>
      </div>
    </div>
  );
}
