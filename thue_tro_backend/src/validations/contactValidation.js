import { z } from "zod";

export const contactCreateSchema = z.object({
  message: z.string().trim().max(1000).optional().nullable(),
});
