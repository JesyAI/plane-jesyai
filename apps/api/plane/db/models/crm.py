# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.db import models

# Module imports
from .base import BaseModel


class CrmCompany(BaseModel):
    class BusinessType(models.TextChoices):
        RESTAURANT = "restaurant", "Restaurante"
        CAFE = "cafe", "Cafetería"
        BAR = "bar", "Bar / Cantina"
        FAST_FOOD = "fast_food", "Comida rápida"
        DARK_KITCHEN = "dark_kitchen", "Dark kitchen"
        BAKERY = "bakery", "Panadería / Pastelería"
        HOTEL = "hotel", "Hotel / Eventos"
        OTHER = "other", "Otro"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="crm_companies")
    name = models.CharField(max_length=255)
    business_type = models.CharField(max_length=32, choices=BusinessType.choices, blank=True, default="")
    city = models.CharField(max_length=255, blank=True, default="")
    website = models.URLField(max_length=1024, blank=True, default="")
    branches_count = models.PositiveIntegerField(null=True, blank=True)
    employees_count = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "CRM Company"
        verbose_name_plural = "CRM Companies"
        db_table = "crm_companies"
        ordering = ("name",)

    def __str__(self):
        return self.name


class CrmLead(BaseModel):
    class Stage(models.TextChoices):
        SCHEDULE_MEETING = "schedule_meeting", "1. Agendar reunión"
        MEETING_SCHEDULED = "meeting_scheduled", "2. Reunión agendada"
        RESCHEDULE = "reschedule", "2b. Reagendar / seguimiento"
        SCHEDULE_ONBOARDING = "schedule_onboarding", "3. Agendar onboarding"
        WAITING_DATA = "waiting_data", "4. Esperando datos"
        FIRST_WEEK = "first_week", "5. Primera semana (grupo WA)"
        ACTIVE_CLIENT = "active_client", "6. Cliente activo"
        LOST = "lost", "Perdido"

    class Source(models.TextChoices):
        REFERRAL = "referral", "Referido"
        SOCIAL = "social", "Redes sociales"
        EVENT = "event", "Evento"
        OUTBOUND = "outbound", "Outbound"
        WEBSITE = "website", "Sitio web"
        OTHER = "other", "Otro"

    class LostReason(models.TextChoices):
        PRICE = "price", "Precio"
        NO_BUDGET = "no_budget", "Sin presupuesto"
        COMPETITOR = "competitor", "Eligió competidor"
        NO_RESPONSE = "no_response", "Sin respuesta"
        BAD_TIMING = "bad_timing", "No era el momento"
        OTHER = "other", "Otro"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="crm_leads")
    company = models.ForeignKey("db.CrmCompany", on_delete=models.SET_NULL, null=True, blank=True, related_name="leads")
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=64, blank=True, default="")
    stage = models.CharField(max_length=32, choices=Stage.choices, default=Stage.SCHEDULE_MEETING)
    source = models.CharField(max_length=32, choices=Source.choices, blank=True, default="")
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="crm_leads"
    )
    last_contact_date = models.DateField(null=True, blank=True)
    next_follow_up_date = models.DateField(null=True, blank=True)
    next_action = models.TextField(blank=True, default="")
    meeting_date = models.DateTimeField(null=True, blank=True)
    onboarding_date = models.DateTimeField(null=True, blank=True)
    data_received = models.BooleanField(default=False)
    whatsapp_group_created = models.BooleanField(default=False)
    lost_reason = models.CharField(max_length=32, choices=LostReason.choices, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    sort_order = models.FloatField(default=65535)

    class Meta:
        verbose_name = "CRM Lead"
        verbose_name_plural = "CRM Leads"
        db_table = "crm_leads"
        ordering = ("-created_at",)

    def __str__(self):
        return self.name
