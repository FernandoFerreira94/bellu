import { z } from "zod";

import type {
  CalendarEvent,
  CalendarSyncPayload,
  GoogleCalendarWebhookPayload,
} from "@/types";

export const googleOAuthSchema = z.object({
  code: z.string().min(1, "Código OAuth obrigatório."),
  redirectUri: z.string().url("Redirect URI inválida."),
});

export const googleCalendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  start: z.string(),
  end: z.string(),
  status: z.enum(["confirmed", "tentative", "cancelled"]),
});

export const googleCalendarWebhookSchema = z.object({
  channelId: z.string().min(1, "Channel ID obrigatório."),
  resourceId: z.string().min(1, "Resource ID obrigatório."),
  resourceState: z.string().min(1, "Resource state obrigatório."),
  resourceUri: z.string().url("Resource URI inválida.").optional(),
});

export type GoogleOAuthInput = z.infer<typeof googleOAuthSchema>;
export type GoogleCalendarEventInput = z.infer<
  typeof googleCalendarEventSchema
>;
export type GoogleCalendarWebhookInput = z.infer<
  typeof googleCalendarWebhookSchema
>;

export async function getGoogleOAuthUrl(): Promise<string> {
  return "";
}

export async function exchangeGoogleCode(
  input: GoogleOAuthInput,
): Promise<{ accessToken: string; refreshToken: string | null }> {
  googleOAuthSchema.parse(input);

  return {
    accessToken: "",
    refreshToken: null,
  };
}

export async function listGoogleCalendarEvents(): Promise<CalendarEvent[]> {
  return [];
}

export async function createGoogleCalendarEvent(
  input: GoogleCalendarEventInput,
): Promise<CalendarEvent> {
  const event = googleCalendarEventSchema.parse(input);

  return {
    id: event.id,
    externalId: null,
    title: event.title,
    description: event.description,
    start: event.start,
    end: event.end,
    status: event.status,
    source: "google",
    clientId: null,
    serviceId: null,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

export async function updateGoogleCalendarEvent(
  input: GoogleCalendarEventInput,
): Promise<CalendarEvent> {
  return createGoogleCalendarEvent(input);
}

export async function deleteGoogleCalendarEvent(eventId: string): Promise<void> {
  z.string().min(1, "ID do evento obrigatório.").parse(eventId);
}

export async function syncCalendarEvents(): Promise<CalendarSyncPayload> {
  return {
    events: [],
    nextSyncToken: null,
    syncedAt: new Date(0).toISOString(),
  };
}

export async function registerGoogleWebhook(): Promise<{
  channelId: string;
  expiration: string | null;
}> {
  return {
    channelId: "",
    expiration: null,
  };
}

export async function handleGoogleWebhook(
  input: GoogleCalendarWebhookInput,
): Promise<GoogleCalendarWebhookPayload> {
  const webhook = googleCalendarWebhookSchema.parse(input);

  return {
    channelId: webhook.channelId,
    resourceId: webhook.resourceId,
    resourceState: webhook.resourceState,
    resourceUri: webhook.resourceUri ?? null,
    receivedAt: new Date(0).toISOString(),
  };
}
