# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

# Third party imports
from rest_framework import serializers

# Module imports
from plane.db.models import CrmCompany, CrmLead, WorkspaceMember
from .base import BaseSerializer

Stage = CrmLead.Stage

# Position of each stage in the pipeline; used to find a company's most advanced lead.
STAGE_ORDER = {
    Stage.SCHEDULE_MEETING: 1,
    Stage.MEETING_SCHEDULED: 2,
    Stage.RESCHEDULE: 2,
    Stage.SCHEDULE_ONBOARDING: 3,
    Stage.WAITING_DATA: 4,
    Stage.FIRST_WEEK: 5,
    Stage.ACTIVE_CLIENT: 6,
    Stage.LOST: 0,
}

# Days without contact before a lead turns cold ("🔴 Frío"), per stage.
COLD_AFTER_DAYS = {
    Stage.FIRST_WEEK: 1,
    Stage.SCHEDULE_MEETING: 2,
    Stage.RESCHEDULE: 2,
    Stage.SCHEDULE_ONBOARDING: 2,
    Stage.WAITING_DATA: 2,
    Stage.MEETING_SCHEDULED: 3,
    Stage.ACTIVE_CLIENT: 7,
}

# Suggested message for the "Escribir hoy" view, per stage.
WHAT_TO_WRITE = {
    Stage.SCHEDULE_MEETING: "Proponle día y hora para la reunión de demo.",
    Stage.MEETING_SCHEDULED: "Confirma la reunión y recuérdale fecha y hora.",
    Stage.RESCHEDULE: "Mensaje de seguimiento: pregunta cuándo le acomoda reagendar.",
    Stage.SCHEDULE_ONBOARDING: "Agenda el onboarding: propón día y hora.",
    Stage.WAITING_DATA: "Recuérdale que mande sus datos (menú, horarios, sucursales).",
    Stage.FIRST_WEEK: "Seguimiento diario en el grupo de WhatsApp: ¿cómo va la primera semana?",
    Stage.ACTIVE_CLIENT: "Check-in semanal en el grupo de WhatsApp.",
    Stage.LOST: "",
}


def workspace_today(workspace):
    """Today's date in the workspace timezone, so "days without contact" flips at local midnight."""
    try:
        tz = ZoneInfo(workspace.timezone or "UTC")
    except ZoneInfoNotFoundError:
        tz = ZoneInfo("UTC")
    return datetime.now(tz).date()


def days_since_contact(lead, today):
    if lead.last_contact_date is None:
        return None
    return (today - lead.last_contact_date).days


def lead_alert(lead, today):
    """Return "new" (never contacted), "cold" (overdue) or "ok"."""
    if lead.stage == Stage.LOST:
        return "ok"
    days = days_since_contact(lead, today)
    if days is None:
        return "new"
    threshold = COLD_AFTER_DAYS.get(lead.stage)
    if threshold is not None and days >= threshold:
        return "cold"
    return "ok"


def company_size(branches_count):
    if not branches_count:
        return ""
    if branches_count == 1:
        return "Pequeña"
    if branches_count <= 4:
        return "Mediana"
    return "Grande"


class CrmLeadSerializer(BaseSerializer):
    days_since_contact = serializers.SerializerMethodField()
    alert = serializers.SerializerMethodField()
    stage_number = serializers.SerializerMethodField()
    what_to_write = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()

    class Meta:
        model = CrmLead
        fields = "__all__"
        read_only_fields = ["workspace", "sort_order"]

    def get_days_since_contact(self, obj):
        return days_since_contact(obj, workspace_today(obj.workspace))

    def get_alert(self, obj):
        return lead_alert(obj, workspace_today(obj.workspace))

    def get_stage_number(self, obj):
        return STAGE_ORDER[obj.stage]

    def get_what_to_write(self, obj):
        return WHAT_TO_WRITE.get(obj.stage, "")

    def get_company_name(self, obj):
        return obj.company.name if obj.company_id else None

    def validate_assignee(self, assignee):
        workspace_id = self.context.get("workspace_id")
        if (
            assignee
            and workspace_id
            and not WorkspaceMember.objects.filter(
                workspace_id=workspace_id, member=assignee, is_active=True
            ).exists()
        ):
            raise serializers.ValidationError("Assignee is not a member of this workspace.")
        return assignee

    def validate_company(self, company):
        workspace_id = self.context.get("workspace_id")
        if company and workspace_id and company.workspace_id != workspace_id:
            raise serializers.ValidationError("Company does not belong to this workspace.")
        return company


class CrmCompanySerializer(BaseSerializer):
    size = serializers.SerializerMethodField()
    people_count = serializers.SerializerMethodField()
    cold_people_count = serializers.SerializerMethodField()
    most_advanced_stage = serializers.SerializerMethodField()
    assignee_ids = serializers.SerializerMethodField()
    last_contact_date = serializers.SerializerMethodField()
    alert = serializers.SerializerMethodField()

    class Meta:
        model = CrmCompany
        fields = "__all__"
        read_only_fields = ["workspace"]

    def _leads(self, obj):
        # Uses the prefetch cache when the view provides it.
        return list(obj.leads.all())

    def get_size(self, obj):
        return company_size(obj.branches_count)

    def get_people_count(self, obj):
        return len(self._leads(obj))

    def get_cold_people_count(self, obj):
        today = workspace_today(obj.workspace)
        return sum(1 for lead in self._leads(obj) if lead_alert(lead, today) == "cold")

    def get_most_advanced_stage(self, obj):
        leads = self._leads(obj)
        if not leads:
            return None
        return max(leads, key=lambda lead: STAGE_ORDER[lead.stage]).stage

    def get_assignee_ids(self, obj):
        return sorted({str(lead.assignee_id) for lead in self._leads(obj) if lead.assignee_id})

    def get_last_contact_date(self, obj):
        dates = [lead.last_contact_date for lead in self._leads(obj) if lead.last_contact_date]
        return max(dates).isoformat() if dates else None

    def get_alert(self, obj):
        today = workspace_today(obj.workspace)
        alerts = [lead_alert(lead, today) for lead in self._leads(obj)]
        if "cold" in alerts:
            return "cold"
        if "new" in alerts:
            return "new"
        return "ok"
