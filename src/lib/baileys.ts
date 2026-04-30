import { z } from "zod";

import type { WhatsAppSession } from "@/types";

export const whatsappMessageSchema = z.object({
  phone: z.string().min(8, "Telefone inválido."),
  message: z.string().min(1, "Mensagem obrigatória."),
});

export type WhatsAppMessageInput = z.infer<typeof whatsappMessageSchema>;

export async function createWhatsAppSession(): Promise<WhatsAppSession> {
  return {
    id: "default",
    status: "disconnected",
    qrCode: null,
    phone: null,
    sessionPath: process.env.WHATSAPP_SESSION_PATH ?? "./whatsapp-session",
    updatedAt: new Date(0).toISOString(),
  };
}

export async function getWhatsAppSession(): Promise<WhatsAppSession> {
  return createWhatsAppSession();
}

export async function sendWhatsAppMessage(
  input: WhatsAppMessageInput,
): Promise<{ queued: boolean }> {
  whatsappMessageSchema.parse(input);

  return { queued: false };
}
