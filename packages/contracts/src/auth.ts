import { z } from "zod";

const passwordSchema = z.string().min(12).max(128);

export const loginRequestSchema = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email().max(320)),
    password: z.string().min(1).max(128)
  })
  .strict();

export const changePasswordRequestSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: passwordSchema
  })
  .strict()
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "The new password must be different",
    path: ["newPassword"]
  });

export const authResponseSchema = z.object({
  data: z.object({
    accessToken: z.string().min(1),
    tokenType: z.literal("Bearer"),
    expiresIn: z.number().int().positive(),
    user: z.object({
      id: z.uuid(),
      churchId: z.uuid(),
      roles: z.array(z.string())
    })
  }),
  meta: z.object({})
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
