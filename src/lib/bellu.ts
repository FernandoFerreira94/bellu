import { z } from "zod";

import type { BelluMessage } from "@/types";

export const belluPromptSchema = z.object({
  prompt: z.string().min(1, "Prompt obrigatório."),
});

export type BelluPromptInput = z.infer<typeof belluPromptSchema>;

export async function sendBelluPrompt(
  input: BelluPromptInput,
): Promise<BelluMessage> {
  const payload = belluPromptSchema.parse(input);

  return {
    id: "bellu-response",
    role: "assistant",
    content: payload.prompt,
    createdAt: new Date(0).toISOString(),
  };
}
