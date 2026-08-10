import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getEffectivePermissions,
  getSupplierProfile,
  listAllSupplierQuotes,
  listSupplierPortalItems,
  upsertSupplierProfile,
  upsertSupplierQuote,
} from "../db";

const nullableText = (max: number) =>
  z.string().trim().max(max).nullable().transform(value => value || null);

async function requirePermission(
  user: { id: number; role: "user" | "admin" | "supplier" },
  key: "canSubmitQuotes" | "canViewSupplierQuotes",
) {
  const permissions = await getEffectivePermissions(user.id, user.role);
  if (!permissions[key]) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso não autorizado para esta operação." });
  return permissions;
}

export const suppliersRouter = router({
  portal: protectedProcedure.query(async ({ ctx }) => {
    await requirePermission(ctx.user, "canSubmitQuotes");
    return {
      profile: await getSupplierProfile(ctx.user.id),
      items: await listSupplierPortalItems(ctx.user.id),
    };
  }),
  saveQuote: protectedProcedure
    .input(z.object({
      equipmentId: z.number().int().positive(),
      unitValueCents: z.number().int().min(1).max(2_000_000_000),
      offeredBrand: nullableText(255),
      offeredModel: nullableText(2000),
      leadTimeDays: z.number().int().min(0).max(3650).nullable(),
      notes: nullableText(5000),
      status: z.enum(["draft", "submitted"]),
    }))
    .mutation(async ({ input, ctx }) => {
      await requirePermission(ctx.user, "canSubmitQuotes");
      return upsertSupplierQuote({ ...input, supplierUserId: ctx.user.id });
    }),
  updateProfile: protectedProcedure
    .input(z.object({
      companyName: nullableText(255),
      cnpj: nullableText(18),
      contactPhone: nullableText(32),
    }))
    .mutation(async ({ input, ctx }) => {
      await requirePermission(ctx.user, "canSubmitQuotes");
      return upsertSupplierProfile({ ...input, userId: ctx.user.id });
    }),
  compare: protectedProcedure.query(async ({ ctx }) => {
    await requirePermission(ctx.user, "canViewSupplierQuotes");
    return listAllSupplierQuotes();
  }),
});

