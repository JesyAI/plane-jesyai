/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import useSWR from "swr";
// plane imports
import { setToast } from "@plane/blocks/toast";
import type { TCrmCompany, TCrmCompanyPayload, TCrmLead, TCrmLeadPayload } from "@plane/types";
// services
import { crmService } from "@/services/crm.service";

export const useCrm = (workspaceSlug: string) => {
  const leadsKey = `CRM_LEADS_${workspaceSlug}`;
  const companiesKey = `CRM_COMPANIES_${workspaceSlug}`;

  const {
    data: leads,
    isLoading: isLoadingLeads,
    mutate: mutateLeads,
  } = useSWR(leadsKey, () => crmService.getLeads(workspaceSlug), { revalidateOnFocus: true });
  const {
    data: companies,
    isLoading: isLoadingCompanies,
    mutate: mutateCompanies,
  } = useSWR(companiesKey, () => crmService.getCompanies(workspaceSlug), { revalidateOnFocus: true });

  // Companies roll up their leads, so both lists are refreshed after any change.
  const refresh = useCallback(async () => {
    await Promise.all([mutateLeads(), mutateCompanies()]);
  }, [mutateLeads, mutateCompanies]);

  const run = useCallback(
    async <T>(action: () => Promise<T>, errorTitle: string): Promise<T | undefined> => {
      try {
        const result = await action();
        await refresh();
        return result;
      } catch (error) {
        const message = typeof error === "object" && error ? Object.values(error).flat().join(" ") : undefined;
        setToast({ type: "error", title: errorTitle, message: message || "Inténtalo de nuevo." });
        return undefined;
      }
    },
    [refresh]
  );

  const createLead = (data: TCrmLeadPayload) =>
    run(() => crmService.createLead(workspaceSlug, data), "No se pudo crear el lead");
  const updateLead = (id: string, data: TCrmLeadPayload) =>
    run(() => crmService.updateLead(workspaceSlug, id, data), "No se pudo actualizar el lead");
  const deleteLead = (id: string) => run(() => crmService.deleteLead(workspaceSlug, id), "No se pudo eliminar el lead");
  const createCompany = (data: TCrmCompanyPayload) =>
    run(() => crmService.createCompany(workspaceSlug, data), "No se pudo crear la empresa");
  const updateCompany = (id: string, data: TCrmCompanyPayload) =>
    run(() => crmService.updateCompany(workspaceSlug, id, data), "No se pudo actualizar la empresa");
  const deleteCompany = (id: string) =>
    run(() => crmService.deleteCompany(workspaceSlug, id), "No se pudo eliminar la empresa");

  /** Moves a lead to another stage, updating the board immediately. */
  const moveLead = async (lead: TCrmLead, stage: TCrmLead["stage"]) => {
    if (lead.stage === stage) return;
    await mutateLeads((current) => current?.map((item) => (item.id === lead.id ? { ...item, stage } : item)), {
      revalidate: false,
    });
    const result = await run(
      () => crmService.updateLead(workspaceSlug, lead.id, { stage }),
      "No se pudo mover el lead"
    );
    if (!result) await mutateLeads();
  };

  return {
    leads: (leads ?? []) as TCrmLead[],
    companies: (companies ?? []) as TCrmCompany[],
    isLoading: isLoadingLeads || isLoadingCompanies,
    createLead,
    updateLead,
    deleteLead,
    moveLead,
    createCompany,
    updateCompany,
    deleteCompany,
  };
};
