/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { CRM_STAGES } from "@plane/constants";
import type { TCrmLead, TCrmStage } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local
import { AlertBadge, formatDate } from "./common";

type Props = {
  leads: TCrmLead[];
  onOpen: (lead: TCrmLead) => void;
  onMove: (lead: TCrmLead, stage: TCrmStage) => void;
  onCreate: (stage: TCrmStage) => void;
};

export const CrmPipeline = observer(function CrmPipeline({ leads, onOpen, onMove, onCreate }: Props) {
  const { getUserDetails } = useMember();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<TCrmStage | null>(null);

  return (
    <div className="flex h-full gap-3 overflow-x-auto p-4">
      {CRM_STAGES.map((stage) => {
        const stageLeads = leads.filter((lead) => lead.stage === stage.key);
        return (
          <div
            key={stage.key}
            data-stage={stage.key}
            className={cn("flex w-72 shrink-0 flex-col rounded-lg bg-layer-1 p-2", {
              "ring-2 ring-accent-strong": overStage === stage.key,
            })}
            onDragOver={(e) => {
              e.preventDefault();
              setOverStage(stage.key);
            }}
            onDragLeave={() => setOverStage((current) => (current === stage.key ? null : current))}
            onDrop={() => {
              const lead = leads.find((item) => item.id === draggingId);
              if (lead) onMove(lead, stage.key);
              setDraggingId(null);
              setOverStage(null);
            }}
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="flex items-center gap-2 text-13 font-medium text-primary">
                <span className="size-2 rounded-full" style={{ backgroundColor: stage.color }} />
                {stage.label}
                <span className="text-tertiary">{stageLeads.length}</span>
              </span>
              <button
                type="button"
                className="text-16 text-tertiary hover:text-primary"
                onClick={() => onCreate(stage.key)}
                aria-label={`Nuevo lead en ${stage.label}`}
              >
                +
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
              {stageLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={() => setDraggingId(lead.id)}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setOverStage(null);
                  }}
                  // A draggable <button> does not start HTML5 drags in Firefox, so the card stays a div.
                  // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpen(lead)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onOpen(lead);
                  }}
                  className={cn(
                    "cursor-pointer rounded-md border border-subtle bg-surface-1 p-2.5 text-13 hover:border-strong",
                    { "opacity-50": draggingId === lead.id }
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-primary">{lead.name}</span>
                    <AlertBadge alert={lead.alert} />
                  </div>
                  {lead.company_name && <div className="text-12 text-secondary">{lead.company_name}</div>}
                  {lead.phone && <div className="text-12 text-tertiary">{lead.phone}</div>}
                  <div className="mt-1.5 flex items-center justify-between text-11 text-tertiary">
                    <span>{lead.assignee ? getUserDetails(lead.assignee)?.display_name : "Sin asignar"}</span>
                    {lead.next_follow_up_date && <span>Seguimiento: {formatDate(lead.next_follow_up_date)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});
