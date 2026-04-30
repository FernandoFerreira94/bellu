import { z } from "zod";

import type { LunaMessage } from "@/types";

export const lunaPromptSchema = z.object({
  prompt: z.string().min(1, "Prompt obrigatório."),
});

export type LunaPromptInput = z.infer<typeof lunaPromptSchema>;

export async function sendLunaPrompt(
  input: LunaPromptInput,
): Promise<LunaMessage> {
  const payload = lunaPromptSchema.parse(input);

  return {
    id: "luna-response",
    role: "assistant",
    content: payload.prompt,
    createdAt: new Date(0).toISOString(),
  };
}
