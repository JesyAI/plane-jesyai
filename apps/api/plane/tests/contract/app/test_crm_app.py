# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import date, timedelta

import pytest
from django.urls import reverse
from rest_framework import status

from plane.db.models import CrmCompany, CrmLead, User, Workspace


@pytest.mark.contract
class TestCrmAPI:
    @pytest.mark.django_db
    def test_create_and_list_lead(self, session_client, workspace):
        url = reverse("workspace-crm-leads", kwargs={"slug": workspace.slug})
        response = session_client.post(url, {"name": "Ana", "phone": "+52 55 0000 0000"}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["stage"] == CrmLead.Stage.SCHEDULE_MEETING
        # never contacted -> "new" alert
        assert response.data["alert"] == "new"

        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert [lead["name"] for lead in response.data] == ["Ana"]

    @pytest.mark.django_db
    def test_lead_goes_cold_after_threshold(self, session_client, workspace):
        # "4. Esperando datos" turns cold after 2 days without contact.
        lead = CrmLead.objects.create(
            workspace=workspace,
            name="Bruno",
            stage=CrmLead.Stage.WAITING_DATA,
            last_contact_date=date.today() - timedelta(days=2),
        )
        url = reverse("workspace-crm-lead", kwargs={"slug": workspace.slug, "pk": lead.id})
        response = session_client.get(url)
        assert response.data["alert"] == "cold"
        assert response.data["days_since_contact"] == 2

        # Contacting the lead resets the alert.
        response = session_client.patch(url, {"last_contact_date": date.today().isoformat()}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["alert"] == "ok"

    @pytest.mark.django_db
    def test_company_rolls_up_leads(self, session_client, workspace):
        company = CrmCompany.objects.create(workspace=workspace, name="Taquería Demo", branches_count=3)
        CrmLead.objects.create(workspace=workspace, company=company, name="A", stage=CrmLead.Stage.FIRST_WEEK)
        CrmLead.objects.create(workspace=workspace, company=company, name="B", stage=CrmLead.Stage.ACTIVE_CLIENT)

        url = reverse("workspace-crm-companies", kwargs={"slug": workspace.slug})
        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        data = response.data[0]
        assert data["people_count"] == 2
        assert data["most_advanced_stage"] == CrmLead.Stage.ACTIVE_CLIENT
        assert data["size"] == "Mediana"
        # both leads were never contacted
        assert data["alert"] == "new"

    @pytest.mark.django_db
    def test_lead_cannot_link_company_from_other_workspace(self, session_client, workspace, create_user):
        other = Workspace.objects.create(name="Other", owner=create_user, slug="other-ws")
        foreign = CrmCompany.objects.create(workspace=other, name="Foreign")
        url = reverse("workspace-crm-leads", kwargs={"slug": workspace.slug})
        response = session_client.post(url, {"name": "X", "company": str(foreign.id)}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_deleting_company_detaches_its_leads(self, session_client, workspace):
        company = CrmCompany.objects.create(workspace=workspace, name="Pizzería Demo")
        lead = CrmLead.objects.create(workspace=workspace, company=company, name="Carla")
        url = reverse("workspace-crm-company", kwargs={"slug": workspace.slug, "pk": company.id})
        assert session_client.delete(url).status_code == status.HTTP_204_NO_CONTENT

        lead.refresh_from_db()
        assert lead.company_id is None
        leads_url = reverse("workspace-crm-leads", kwargs={"slug": workspace.slug})
        assert session_client.get(leads_url).data[0]["company_name"] is None

    @pytest.mark.django_db
    def test_assignee_must_be_workspace_member(self, session_client, workspace, create_user):
        outsider = User.objects.create(email="outsider@example.com", username="outsider")
        url = reverse("workspace-crm-leads", kwargs={"slug": workspace.slug})
        response = session_client.post(url, {"name": "X", "assignee": str(outsider.id)}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        response = session_client.post(url, {"name": "Y", "assignee": str(create_user.id)}, format="json")
        assert response.status_code == status.HTTP_201_CREATED

    @pytest.mark.django_db
    def test_unknown_lead_returns_404(self, session_client, workspace):
        url = reverse(
            "workspace-crm-lead", kwargs={"slug": workspace.slug, "pk": "00000000-0000-0000-0000-000000000000"}
        )
        assert session_client.get(url).status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_crm_is_pinned_in_sidebar_by_default(self, session_client, workspace):
        url = reverse("workspace-user-preference", kwargs={"slug": workspace.slug})
        response = session_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["crm"]["is_pinned"] is True

    @pytest.mark.django_db
    def test_days_since_contact_uses_workspace_timezone(self, session_client, workspace):
        from datetime import datetime as real_datetime, timezone as dt_timezone
        from unittest.mock import patch

        class FrozenDatetime(real_datetime):
            @classmethod
            def now(cls, tz=None):
                # 01:00 UTC on Oct 18 is still Oct 17, 19:00 in Monterrey.
                return real_datetime(2026, 10, 18, 1, 0, tzinfo=dt_timezone.utc).astimezone(tz)

        workspace.timezone = "America/Monterrey"
        workspace.save()
        lead = CrmLead.objects.create(
            workspace=workspace, name="Diego", stage=CrmLead.Stage.FIRST_WEEK, last_contact_date=date(2026, 10, 17)
        )
        url = reverse("workspace-crm-lead", kwargs={"slug": workspace.slug, "pk": lead.id})
        with patch("plane.app.serializers.crm.datetime", FrozenDatetime):
            response = session_client.get(url)
        assert response.data["days_since_contact"] == 0
        # "5. Primera semana" goes cold after 1 day; contacted "today" locally must stay ok.
        assert response.data["alert"] == "ok"
