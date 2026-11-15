import { z } from "zod";

const roomFieldsSchema = z.object({
  title: z.string().trim().min(5).max(200),
  description: z.string().trim().max(10000).optional().nullable(),
  price: z.coerce.number().min(0).max(100000000000),
  area: z.coerce.number().positive().max(100000),
  address_detail: z.string().trim().min(5).max(255),
  province_name: z.string().trim().min(2).max(120),
  commune_name: z.string().trim().min(2).max(120),
  deposit: z
    .preprocess(
      (value) => (value === "" || value === null ? null : value),
      z.number().min(0).max(100000000000).nullable(),
    )
    .optional(),
});

export const createRoomSchema = roomFieldsSchema.transform((data) => ({
  ...data,
  deposit: data.deposit ?? null,
}));

export const updateRoomSchema = roomFieldsSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Cần ít nhất một trường để cập nhật.",
  );
