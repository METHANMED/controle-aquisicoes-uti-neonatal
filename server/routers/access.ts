import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { createLocalUser, getEffectivePermissions, getSupplierProfile, listUsersWithAccess, updateUserAccess } from "../db";
import { permissionKeys } from "../permissions";

const permissionsInput = z.object(
  Object.fromEntries(permissionKeys.map(key => [key, z.boolean()])) as Record<(typeof permissionKeys)[number], z.ZodBoolean>,
);

const nullableText = (max: number) =>
  z.string().trim().max(max).nullable().transform(value => value || null);

export const accessRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => ({
    permissions: await getEffectivePermissions(ctx.user.id, ctx.user.role),
    supplierProfile: await getSupplierProfile(ctx.user.id),
  })),
  listUsers: adminProcedure.query(() => listUsersWithAccess()),
  createUser: adminProcedure
    .input(z.object({
      email: z.string().trim().email("Email inválido"),
      password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
      name: z.string().trim().max(255).nullable().transform(value => value || null),
      role: z.enum(["user", "admin", "supplier"]),
    }))
    .mutation(async ({ input }) => {
      try {
        await createLocalUser(input);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Não foi possível criar o usuário.",
        });
      }
      return listUsersWithAccess();
    }),
  updateUser: adminProcedure
    .input(z.object({
      userId: z.number().int().positive(),
      role: z.enum(["user", "admin", "supplier"]),
      isActive: z.boolean(),
      permissions: permissionsInput,
      companyName: nullableText(255),
      cnpj: nullableText(18),
      contactPhone: nullableText(32),
      name: nullableText(255).optional(),
      email: z.string().trim().email("Email inválido").nullable().optional(),
      newPassword: z
        .string()
        .trim()
        .transform(value => value || null)
        .refine(value => !value || value.length >= 6, "A senha deve ter pelo menos 6 caracteres")
        .nullable()
        .optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.id && (input.role !== "admin" || !input.isActive)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "O administrador não pode remover o próprio acesso." });
      }
      try {
        return await updateUserAccess({ ...input, updatedBy: ctx.user.id });
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Não foi possível atualizar o acesso.",
        });
      }
    }),
});
