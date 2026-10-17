/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import { cn } from "@plane/utils";
import type { TCrmCompany, TCrmLead, TCrmStage } from "@plane/types";
// hooks
import { useUser } from "@/hooks/store/user";
// local
import { CrmCompanyPanel } from "./company-panel";
import { CrmLeadPanel } from "./lead-panel";
import { CrmPipeline } from "./pipeline";
import { CrmCompaniesTable, CrmLeadsTable, CrmMeetingsTable, CrmTodayTable } from "./tables";
import { useCrm } from "./use-crm";

const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

const TABS = [
  { key: "pipeline", label: "Pipeline" },
  { key: "today", label: "✍️ Escribir hoy" },
  { key: "waiting", label: "📨 Esperando datos" },
  { key: "meetings", label: "📅 Reuniones" },
  { key: "leads", label: "Todos los leads" },
  { key: "mine", label: "Mis leads" },
  { key: "companies", label: "🏢 Empresas" },
] as const;

type TTab = (typeof TABS)[number]["key"];

type TLeadPanelState = { lead: TCrmLead | null; stage?: TCrmStage } | null;
type TCompanyPanelState = { company: TCrmCompany | null } | null;

export const CrmRoot = observer(function CrmRoot() {
  const { workspaceSlug } = useParams();
  const slug = workspaceSlug?.toString() ?? "";
  const { data: currentUser } = useUser();
  const crm = useCrm(slug);
  const [tab, setTab] = useState<TTab>("pipeline");
  const [leadPanel, setLeadPanel] = useState<TLeadPanelState>(null);
  const [companyPanel, setCompanyPanel] = useState<TCompanyPanelState>(null);

  const openLead = (lead: TCrmLead) => setLeadPanel({ lead });

  const renderTab = () => {
    switch (tab) {
      case "pipeline":
        return (
          <CrmPipeline
            leads={crm.leads}
            onOpen={openLead}
            onMove={crm.moveLead}
            onCreate={(stage) => setLeadPanel({ lead: null, stage })}
          />
        );
      case "today":
        return (
          <CrmTodayTable
            leads={crm.leads}
            onOpen={openLead}
            onContacted={(lead) => crm.updateLead(lead.id, { last_contact_date: today() })}
          />
        );
      case "waiting":
        return (
          <CrmLeadsTable
            leads={crm.leads.filter((lead) => lead.stage === "waiting_data")}
            onOpen={openLead}
            empty="Nadie esperando datos."
          />
        );
      case "meetings":
        return <CrmMeetingsTable leads={crm.leads} onOpen={openLead} />;
      case "mine":
        return (
          <CrmLeadsTable
            leads={crm.leads.filter((lead) => lead.assignee === currentUser?.id && lead.stage !== "lost")}
            onOpen={openLead}
            empty="No tienes leads asignados."
          />
        );
      case "companies":
        return <CrmCompaniesTable companies={crm.companies} onOpen={(company) => setCompanyPanel({ company })} />;
      default:
        return <CrmLeadsTable leads={crm.leads} onOpen={openLead} />;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle px-4 py-2">
        <div className="flex flex-wrap gap-1">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn("rounded-md px-2.5 py-1 text-13 text-secondary hover:bg-layer-1", {
                "bg-layer-2 font-medium text-primary": tab === item.key,
              })}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="md"
            stretch="auto"
            label="Nueva empresa"
            onClick={() => setCompanyPanel({ company: null })}
          />
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            label="Registrar lead"
            onClick={() => setLeadPanel({ lead: null })}
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {crm.isLoading ? <div className="p-8 text-13 text-tertiary">Cargando…</div> : renderTab()}
      </div>

      {leadPanel && (
        <CrmLeadPanel
          key={leadPanel.lead?.id ?? `new-${leadPanel.stage ?? ""}`}
          lead={leadPanel.lead}
          initialStage={leadPanel.stage}
          companies={crm.companies}
          onSave={(data) => (leadPanel.lead ? crm.updateLead(leadPanel.lead.id, data) : crm.createLead(data))}
          onDelete={leadPanel.lead ? () => crm.deleteLead(leadPanel.lead!.id) : undefined}
          onClose={() => setLeadPanel(null)}
        />
      )}
      {companyPanel && (
        <CrmCompanyPanel
          key={companyPanel.company?.id ?? "new"}
          company={companyPanel.company}
          onSave={(data) =>
            companyPanel.company ? crm.updateCompany(companyPanel.company.id, data) : crm.createCompany(data)
          }
          onDelete={companyPanel.company ? () => crm.deleteCompany(companyPanel.company!.id) : undefined}
          onClose={() => setCompanyPanel(null)}
        />
      )}
    </div>
  );
});
