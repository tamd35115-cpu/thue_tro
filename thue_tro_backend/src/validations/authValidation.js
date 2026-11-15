import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[0-9+().\-\s]{8,20}$/)
  .refine(
    (value) => {
      const digitCount = value.replace(/\D/g, "").length;
      return digitCount >= 8 && digitCount <= 15;
    },
    "Số điện thoại không hợp lệ.",
  );

export const registerSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z
    .string()
    .trim()
    .email()
    .max(180)
    .transform((v) => v.toLowerCase()),
  phone: phoneSchema,
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(72),
});

export const updateProfileSchema = z
  .object({
    full_name: z.string().trim().min(2).max(120).optional(),
    phone: phoneSchema.optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "Cần ít nhất một trường để cập nhật.",
  );

export const updatePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8).max(72),
});
