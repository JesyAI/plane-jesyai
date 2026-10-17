/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { sortBy } from "lodash-es";
import { observer } from "mobx-react";
// plane imports
import { CRM_BUSINESS_TYPES, CRM_STAGES } from "@plane/constants";
import type { TCrmCompany, TCrmLead } from "@plane/types";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local
import { AlertBadge, StageBadge, formatDate } from "./common";

function Table({ headers, children, empty }: { headers: string[]; children: ReactNode[]; empty: string }) {
  return (
    <div className="p-4">
      <div className="overflow-x-auto rounded-lg border border-subtle">
        <table className="w-full text-left text-13">
          <thead className="bg-layer-1 text-12 text-tertiary">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-3 py-2 font-medium whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {children.length ? (
              children
            ) : (
              <tr>
                <td colSpan={headers.length} className="px-3 py-8 text-center text-tertiary">
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const Row = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <tr className="cursor-pointer hover:bg-layer-1" onClick={onClick}>
    {children}
  </tr>
);

const Cell = ({ children }: { children: ReactNode }) => <td className="px-3 py-2 text-secondary">{children}</td>;

const whatsappLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

type LeadsProps = {
  leads: TCrmLead[];
  onOpen: (lead: TCrmLead) => void;
  empty?: string;
};

export const CrmLeadsTable = observer(function CrmLeadsTable({ leads, onOpen, empty }: LeadsProps) {
  const { getUserDetails } = useMember();
  return (
    <Table
      headers={["Lead", "Empresa", "Teléfono", "Etapa", "Alerta", "Responsable", "Próxima acción", "Seguimiento"]}
      empty={empty ?? "Aún no hay leads."}
    >
      {leads.map((lead) => (
        <Row key={lead.id} onClick={() => onOpen(lead)}>
          <Cell>
            <span className="font-medium text-primary">{lead.name}</span>
          </Cell>
          <Cell>{lead.company_name ?? "—"}</Cell>
          <Cell>{lead.phone || "—"}</Cell>
          <Cell>
            <StageBadge stage={lead.stage} />
          </Cell>
          <Cell>
            <AlertBadge alert={lead.alert} />
          </Cell>
          <Cell>{lead.assignee ? (getUserDetails(lead.assignee)?.display_name ?? "—") : "—"}</Cell>
          <Cell>{lead.next_action || "—"}</Cell>
          <Cell>{formatDate(lead.next_follow_up_date)}</Cell>
        </Row>
      ))}
    </Table>
  );
});

type TodayProps = LeadsProps & { onContacted: (lead: TCrmLead) => void };

/** "Escribir hoy": cold or never-contacted leads, grouped by stage, with a suggested message. */
export const CrmTodayTable = observer(function CrmTodayTable({ leads, onOpen, onContacted }: TodayProps) {
  const { getUserDetails } = useMember();
  const due = leads.filter((lead) => lead.alert !== "ok");
  return (
    <div>
      {CRM_STAGES.map((stage) => {
        const stageLeads = due.filter((lead) => lead.stage === stage.key);
        if (!stageLeads.length) return null;
        return (
          <div key={stage.key}>
            <div className="px-4 pt-4 text-13 font-semibold text-primary">
              {stage.label} <span className="text-tertiary">{stageLeads.length}</span>
            </div>
            <Table headers={["Lead", "Teléfono", "Qué escribirle", "Responsable", "Días sin contacto", ""]} empty="">
              {stageLeads.map((lead) => (
                <Row key={lead.id} onClick={() => onOpen(lead)}>
                  <Cell>
                    <span className="font-medium text-primary">{lead.name}</span>
                    {lead.company_name && <div className="text-12 text-tertiary">{lead.company_name}</div>}
                  </Cell>
                  <Cell>
                    {lead.phone ? (
                      <a
                        href={whatsappLink(lead.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {lead.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </Cell>
                  <Cell>{lead.what_to_write || "—"}</Cell>
                  <Cell>{lead.assignee ? (getUserDetails(lead.assignee)?.display_name ?? "—") : "—"}</Cell>
                  <Cell>{lead.days_since_contact ?? "Sin contacto"}</Cell>
                  <Cell>
                    <button
                      type="button"
                      className="rounded-md border border-subtle px-2 py-1 text-12 whitespace-nowrap hover:bg-layer-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onContacted(lead);
                      }}
                    >
                      Ya le escribí
                    </button>
                  </Cell>
                </Row>
              ))}
            </Table>
          </div>
        );
      })}
      {!due.length && <div className="p-8 text-center text-13 text-tertiary">🎉 Nadie por contactar hoy.</div>}
    </div>
  );
});

export const CrmMeetingsTable = observer(function CrmMeetingsTable({ leads, onOpen }: LeadsProps) {
  const upcoming = sortBy(
    leads.filter((lead) => lead.meeting_date && lead.stage !== "lost"),
    (lead) => new Date(lead.meeting_date!).getTime()
  );
  return (
    <Table headers={["Fecha de reunión", "Lead", "Empresa", "Teléfono", "Etapa"]} empty="No hay reuniones agendadas.">
      {upcoming.map((lead) => (
        <Row key={lead.id} onClick={() => onOpen(lead)}>
          <Cell>
            {new Date(lead.meeting_date!).toLocaleString("es-MX", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Cell>
          <Cell>
            <span className="font-medium text-primary">{lead.name}</span>
          </Cell>
          <Cell>{lead.company_name ?? "—"}</Cell>
          <Cell>{lead.phone || "—"}</Cell>
          <Cell>
            <StageBadge stage={lead.stage} />
          </Cell>
        </Row>
      ))}
    </Table>
  );
});

type CompaniesProps = { companies: TCrmCompany[]; onOpen: (company: TCrmCompany) => void };

export const CrmCompaniesTable = observer(function CrmCompaniesTable({ companies, onOpen }: CompaniesProps) {
  const { getUserDetails } = useMember();
  return (
    <Table
      headers={[
        "Empresa",
        "Tipo de negocio",
        "Sucursales",
        "Tamaño",
        "Personas",
        "Atiende",
        "Etapa más avanzada",
        "Alerta",
        "Último contacto",
      ]}
      empty="Aún no hay empresas."
    >
      {companies.map((company) => (
        <Row key={company.id} onClick={() => onOpen(company)}>
          <Cell>
            <span className="font-medium text-primary">{company.name}</span>
            {company.city && <div className="text-12 text-tertiary">{company.city}</div>}
          </Cell>
          <Cell>{CRM_BUSINESS_TYPES.find((type) => type.key === company.business_type)?.label ?? "—"}</Cell>
          <Cell>{company.branches_count ?? "—"}</Cell>
          <Cell>{company.size || "—"}</Cell>
          <Cell>
            {company.people_count}
            {company.cold_people_count > 0 && (
              <span className="text-red-600"> · {company.cold_people_count} fríos</span>
            )}
          </Cell>
          <Cell>
            {company.assignee_ids
              .map((id) => getUserDetails(id)?.display_name)
              .filter(Boolean)
              .join(", ") || "—"}
          </Cell>
          <Cell>
            <StageBadge stage={company.most_advanced_stage} />
          </Cell>
          <Cell>{company.people_count ? <AlertBadge alert={company.alert} /> : "—"}</Cell>
          <Cell>{formatDate(company.last_contact_date)}</Cell>
        </Row>
      ))}
    </Table>
  );
});
