# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import CrmCompanySerializer, CrmLeadSerializer
from plane.app.views.base import BaseViewSet
from plane.db.models import CrmCompany, CrmLead, Workspace


class CrmCompanyViewSet(BaseViewSet):
    serializer_class = CrmCompanySerializer
    model = CrmCompany

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace")
            .prefetch_related("leads")
            .distinct()
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list(self, request, slug):
        serializer = CrmCompanySerializer(self.get_queryset(), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def retrieve(self, request, slug, pk):
        serializer = CrmCompanySerializer(self.get_queryset().get(pk=pk))
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = CrmCompanySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace_id=workspace.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def partial_update(self, request, slug, pk):
        company = self.get_queryset().get(pk=pk)
        serializer = CrmCompanySerializer(company, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        company = self.get_queryset().get(pk=pk)
        # Soft delete only unlinks related rows in a background task; detach the leads now
        # so they never show a deleted company.
        company.leads.update(company=None)
        company.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CrmLeadViewSet(BaseViewSet):
    serializer_class = CrmLeadSerializer
    model = CrmLead

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("company", "workspace")
            .distinct()
        )

    def _context(self, workspace_id):
        return {"workspace_id": workspace_id}

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list(self, request, slug):
        leads = self.get_queryset()
        stage = request.query_params.get("stage")
        if stage:
            leads = leads.filter(stage=stage)
        assignee = request.query_params.get("assignee")
        if assignee:
            leads = leads.filter(assignee_id=assignee)
        company = request.query_params.get("company")
        if company:
            leads = leads.filter(company_id=company)
        serializer = CrmLeadSerializer(leads.order_by("sort_order", "-created_at"), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def retrieve(self, request, slug, pk):
        serializer = CrmLeadSerializer(self.get_queryset().get(pk=pk))
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = CrmLeadSerializer(data=request.data, context=self._context(workspace.id))
        if serializer.is_valid():
            serializer.save(workspace_id=workspace.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def partial_update(self, request, slug, pk):
        lead = self.get_queryset().get(pk=pk)
        serializer = CrmLeadSerializer(
            lead, data=request.data, partial=True, context=self._context(lead.workspace_id)
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        self.get_queryset().get(pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
