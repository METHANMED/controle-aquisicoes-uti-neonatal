import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getEffectivePermissions: vi.fn(),
  listEquipmentWithStages: vi.fn(),
  getEquipmentById: vi.fn(),
  getDashboardOverview: vi.fn(),
  listSupplierPortalItems: vi.fn(),
  upsertSupplierQuote: vi.fn(),
  getSupplierProfile: vi.fn(),
  listAllSupplierQuotes: vi.fn(),
  upsertSupplierProfile: vi.fn(),
  listUsersWithAccess: vi.fn(),
  updateUserAccess: vi.fn(),
  createEquipment: vi.fn(),
  updateEquipment: vi.fn(),
  updateProcurementStage: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";
import { defaultPermissionsForRole } from "./permissions";

const basePermissions = {
  canViewDashboard: false,
  canViewItems: true,
  canEditItems: false,
  canViewStages: false,
  canEditStages: false,
  canViewInvoices: false,
  canManageInvoices: false,
  canViewBudgetValues: false,
  canViewSupplierQuotes: false,
  canSubmitQuotes: true,
};

function context(role: "user" | "admin" | "supplier", id = 7, isActive = true): TrpcContext {
  return {
    user: {
      id,
      openId: `user-${id}`,
      email: `user${id}@example.com`,
      name: `Usuário ${id}`,
      loginMethod: "manus",
      role,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("permissões e cotações de fornecedores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getEffectivePermissions.mockResolvedValue(basePermissions);
    dbMocks.getSupplierProfile.mockResolvedValue(null);
    dbMocks.listSupplierPortalItems.mockResolvedValue([]);
    dbMocks.upsertSupplierQuote.mockResolvedValue([]);
    dbMocks.listAllSupplierQuotes.mockResolvedValue([]);
  });

  it("remove valores, nota fiscal e etapas das consultas sem permissão", async () => {
    dbMocks.listEquipmentWithStages.mockResolvedValue([{
      id: 1,
      itemNumber: 1,
      name: "Incubadora",
      brand: "Fanem",
      model: "1186",
      quantity: 2,
      unitValueCents: 100000,
      totalValueCents: 200000,
      invoiceUrl: "https://example.com/nota.pdf",
      createdBy: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      stages: [{ id: 1, equipmentId: 1, stageKey: "acquisition", status: "pending", stageDate: null, notes: null, updatedBy: null, createdAt: new Date(), updatedAt: new Date() }],
    }]);

    const [item] = await appRouter.createCaller(context("user")).procurement.list();
    expect(item).toMatchObject({ name: "Incubadora", quantity: 2, stages: [] });
    expect(item).not.toHaveProperty("unitValueCents");
    expect(item).not.toHaveProperty("totalValueCents");
    expect(item).not.toHaveProperty("invoiceUrl");
  });

  it("remove o valor consolidado do painel sem permissão financeira", async () => {
    dbMocks.getEffectivePermissions.mockResolvedValue({ ...basePermissions, canViewDashboard: true });
    dbMocks.getDashboardOverview.mockResolvedValue({ totalItems: 52, totalUnits: 162, totalValueCents: 431426540 });
    const result = await appRouter.createCaller(context("user")).procurement.dashboard();
    expect(result).toMatchObject({ totalItems: 52, totalUnits: 162 });
    expect(result).not.toHaveProperty("totalValueCents");
  });

  it("grava a cotação sempre no usuário fornecedor autenticado", async () => {
    const caller = appRouter.createCaller(context("supplier", 14));
    await caller.suppliers.saveQuote({
      equipmentId: 3,
      unitValueCents: 250000,
      offeredBrand: "Marca ofertada",
      offeredModel: "Modelo A",
      leadTimeDays: 30,
      notes: "Validade de 30 dias.",
      status: "submitted",
    });
    expect(dbMocks.upsertSupplierQuote).toHaveBeenCalledWith(expect.objectContaining({ supplierUserId: 14, equipmentId: 3, unitValueCents: 250000 }));
  });

  it("impede fornecedor de consultar cotações de outras empresas", async () => {
    await expect(appRouter.createCaller(context("supplier")).suppliers.compare()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(dbMocks.listAllSupplierQuotes).not.toHaveBeenCalled();
  });

  it("bloqueia integralmente um usuário desativado pelo administrador", async () => {
    await expect(appRouter.createCaller(context("user", 21, false)).procurement.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("permite ao administrador configurar perfil, ativação e visualizações de outra pessoa", async () => {
    dbMocks.updateUserAccess.mockResolvedValue([]);
    const permissions = { ...basePermissions, canViewDashboard: true, canViewStages: true };
    await appRouter.createCaller(context("admin", 1)).access.updateUser({
      userId: 9,
      role: "supplier",
      isActive: true,
      permissions,
      companyName: "Fornecedor Exemplo",
      cnpj: null,
      contactPhone: null,
    });
    expect(dbMocks.updateUserAccess).toHaveBeenCalledWith(expect.objectContaining({
      userId: 9,
      role: "supplier",
      permissions,
      updatedBy: 1,
    }));
  });

  it("mantém o valor do orçamento exclusivo do perfil Gerenciamento", () => {
    expect(defaultPermissionsForRole("admin").canViewBudgetValues).toBe(true);
    expect(defaultPermissionsForRole("user").canViewBudgetValues).toBe(false);
    expect(defaultPermissionsForRole("supplier").canViewBudgetValues).toBe(false);
  });
});
