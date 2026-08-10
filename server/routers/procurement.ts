import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createEquipment,
  getDashboardOverview,
  getEffectivePermissions,
  getEquipmentById,
  listEquipmentWithStages,
  updateEquipment,
  updateProcurementStage,
} from "../db";
import type { AppPermissions, PermissionKey } from "../permissions";

const nullableText = (max: number) =>
  z.string().trim().max(max).nullable().transform(value => value || null);

const equipmentInput = z.object({
  name: z.string().trim().min(2).max(255),
  brand: nullableText(255),
  model: nullableText(2000),
  quantity: z.number().int().min(1).max(10_000),
  unitValueCents: z.number().int().min(0).max(2_000_000_000),
  invoiceUrl: z
    .union([z.string().trim().url().max(2048), z.literal(""), z.null()])
    .transform(value => value || null),
});

const stageInput = z.object({
  equipmentId: z.number().int().positive(),
  stageKey: z.enum(["acquisition", "invoice_link", "shipping", "expected_delivery", "delivery", "installation"]),
  status: z.enum(["pending", "in_progress", "completed", "blocked"]),
  stageDate: z.number().int().nonnegative().nullable(),
  notes: nullableText(5000),
});

async function permissionsFor(user: { id: number; role: "user" | "admin" | "supplier" }) {
  return getEffectivePermissions(user.id, user.role);
}

function requirePermission(permissions: AppPermissions, key: PermissionKey) {
  if (!permissions[key]) throw new TRPCError({ code: "FORBIDDEN", message: "Você não possui permissão para esta ação." });
}

function sanitizeItem<T extends Awaited<ReturnType<typeof getEquipmentById>>>(item: T, permissions: AppPermissions) {
  if (!item) return item;
  const { unitValueCents, totalValueCents, invoiceUrl, stages, ...base } = item;
  return {
    ...base,
    ...(permissions.canViewBudgetValues ? { unitValueCents, totalValueCents } : {}),
    ...(permissions.canViewInvoices ? { invoiceUrl } : {}),
    stages: permissions.canViewStages ? stages : [],
  };
}

export const procurementRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const permissions = await permissionsFor(ctx.user);
    requirePermission(permissions, "canViewItems");
    const items = await listEquipmentWithStages();
    return items.map(item => sanitizeItem(item, permissions));
  }),
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const permissions = await permissionsFor(ctx.user);
    requirePermission(permissions, "canViewDashboard");
    const overview = await getDashboardOverview();
    if (permissions.canViewBudgetValues) return overview;
    const { totalValueCents: _hidden, ...safeOverview } = overview;
    return safeOverview;
  }),
  detail: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const permissions = await permissionsFor(ctx.user);
      requirePermission(permissions, "canViewItems");
      const item = await getEquipmentById(input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Equipamento não encontrado." });
      return sanitizeItem(item, permissions);
    }),
  create: protectedProcedure
    .input(equipmentInput)
    .mutation(async ({ input, ctx }) => {
      const permissions = await permissionsFor(ctx.user);
      requirePermission(permissions, "canEditItems");
      const item = await createEquipment({
        ...input,
        unitValueCents: permissions.canViewBudgetValues ? input.unitValueCents : 0,
        invoiceUrl: permissions.canManageInvoices ? input.invoiceUrl : null,
      }, ctx.user.id);
      return sanitizeItem(item, permissions);
    }),
  update: protectedProcedure
    .input(equipmentInput.extend({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const permissions = await permissionsFor(ctx.user);
      requirePermission(permissions, "canEditItems");
      const { id, ...data } = input;
      const existing = await getEquipmentById(id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Equipamento não encontrado." });
      const item = await updateEquipment(id, {
        ...data,
        unitValueCents: permissions.canViewBudgetValues ? data.unitValueCents : existing.unitValueCents,
        invoiceUrl: permissions.canManageInvoices ? data.invoiceUrl : existing.invoiceUrl,
      });
      return sanitizeItem(item, permissions);
    }),
  updateStage: protectedProcedure
    .input(stageInput)
    .mutation(async ({ input, ctx }) => {
      const permissions = await permissionsFor(ctx.user);
      requirePermission(permissions, "canEditStages");
      const item = await updateProcurementStage({ ...input, userId: ctx.user.id });
      return sanitizeItem(item, permissions);
    }),
});

