import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getEffectivePermissions, getSupplierProfile, listUsersWithAccess, updateUserAccess } from "../db";
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
  updateUser: adminProcedure
    .input(z.object({
      userId: z.number().int().positive(),
      role: z.enum(["user", "admin", "supplier"]),
      isActive: z.boolean(),
      permissions: permissionsInput,
      companyName: nullableText(255),
      cnpj: nullableText(18),
      contactPhone: nullableText(32),
    }))
    .mutation(({ input, ctx }) => {
      if (input.userId === ctx.user.id && (input.role !== "admin" || !input.isActive)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "O administrador não pode remover o próprio acesso." });
      }
      return updateUserAccess({ ...input, updatedBy: ctx.user.id });
    }),
});

