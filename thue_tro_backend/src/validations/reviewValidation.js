import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().trim().max(3000).optional().nullable(),
});
