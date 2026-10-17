/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { TCrmCompany, TCrmCompanyPayload, TCrmLead, TCrmLeadPayload } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export class CrmService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getLeads(workspaceSlug: string): Promise<TCrmLead[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/crm/leads/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createLead(workspaceSlug: string, data: TCrmLeadPayload): Promise<TCrmLead> {
    return this.post(`/api/workspaces/${workspaceSlug}/crm/leads/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateLead(workspaceSlug: string, leadId: string, data: TCrmLeadPayload): Promise<TCrmLead> {
    return this.patch(`/api/workspaces/${workspaceSlug}/crm/leads/${leadId}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteLead(workspaceSlug: string, leadId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/crm/leads/${leadId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getCompanies(workspaceSlug: string): Promise<TCrmCompany[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/crm/companies/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createCompany(workspaceSlug: string, data: TCrmCompanyPayload): Promise<TCrmCompany> {
    return this.post(`/api/workspaces/${workspaceSlug}/crm/companies/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateCompany(workspaceSlug: string, companyId: string, data: TCrmCompanyPayload): Promise<TCrmCompany> {
    return this.patch(`/api/workspaces/${workspaceSlug}/crm/companies/${companyId}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteCompany(workspaceSlug: string, companyId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/crm/companies/${companyId}/`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}

export const crmService = new CrmService();
