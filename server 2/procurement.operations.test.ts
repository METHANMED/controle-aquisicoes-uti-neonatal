import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  createEquipment: vi.fn(),
  updateEquipment: vi.fn(),
  updateProcurementStage: vi.fn(),
  listEquipmentWithStages: vi.fn(),
  getEquipmentById: vi.fn(),
  getDashboardOverview: vi.fn(),
  getEffectivePermissions: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

function adminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      name: "Gestor",
      email: "gestor@example.com",
      loginMethod: "manus",
      role: "admin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const equipment = {
  id: 1,
  itemNumber: 1,
  name: "Carro de Checagem",
  brand: "Meta Hospitalar",
  model: "MT 996",
  quantity: 1,
  unitValueCents: 800000,
  totalValueCents: 800000,
  invoiceUrl: null,
  createdBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  stages: [],
};

describe("operações principais da aquisição", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.createEquipment.mockResolvedValue(equipment);
    dbMocks.updateEquipment.mockResolvedValue(equipment);
    dbMocks.updateProcurementStage.mockResolvedValue(equipment);
    dbMocks.listEquipmentWithStages.mockResolvedValue([equipment]);
    dbMocks.getEquipmentById.mockResolvedValue(equipment);
    dbMocks.getDashboardOverview.mockResolvedValue({ totalItems: 1, totalUnits: 1 });
    dbMocks.getEffectivePermissions.mockResolvedValue({
      canViewDashboard: true,
      canViewItems: true,
      canEditItems: true,
      canViewStages: true,
      canEditStages: true,
      canViewInvoices: true,
      canManageInvoices: true,
      canViewBudgetValues: true,
      canViewSupplierQuotes: true,
      canSubmitQuotes: true,
    });
  });

  it("executa consulta, detalhe e painel para usuário autenticado", async () => {
    const caller = appRouter.createCaller(adminContext());
    await expect(caller.procurement.list()).resolves.toEqual([equipment]);
    await expect(caller.procurement.detail({ id: 1 })).resolves.toEqual(equipment);
    await expect(caller.procurement.dashboard()).resolves.toMatchObject({ totalItems: 1 });
    expect(dbMocks.listEquipmentWithStages).toHaveBeenCalledOnce();
    expect(dbMocks.getEquipmentById).toHaveBeenCalledWith(1);
    expect(dbMocks.getDashboardOverview).toHaveBeenCalledOnce();
  });

  it("cria e atualiza um equipamento com entrada válida", async () => {
    const caller = appRouter.createCaller(adminContext());
    const input = {
      name: "Carro de Checagem",
      brand: "Meta Hospitalar",
      model: "MT 996",
      quantity: 1,
      unitValueCents: 800000,
      invoiceUrl: "https://example.com/nota-fiscal.pdf",
    };
    await expect(caller.procurement.create(input)).resolves.toEqual(equipment);
    await expect(caller.procurement.update({ id: 1, ...input })).resolves.toEqual(equipment);
    expect(dbMocks.createEquipment).toHaveBeenCalledWith(input, 1);
    expect(dbMocks.updateEquipment).toHaveBeenCalledWith(1, input);
  });

  it("atualiza status, data e observações de uma etapa", async () => {
    const caller = appRouter.createCaller(adminContext());
    const input = {
      equipmentId: 1,
      stageKey: "acquisition" as const,
      status: "completed" as const,
      stageDate: Date.UTC(2026, 6, 29),
      notes: "Pedido aprovado.",
    };
    await expect(caller.procurement.updateStage(input)).resolves.toEqual(equipment);
    expect(dbMocks.updateProcurementStage).toHaveBeenCalledWith({ ...input, userId: 1 });
  });

  it("rejeita URL inválida, quantidade zero e data negativa", async () => {
    const caller = appRouter.createCaller(adminContext());
    await expect(
      caller.procurement.create({
        name: "Equipamento",
        brand: null,
        model: null,
        quantity: 0,
        unitValueCents: 0,
        invoiceUrl: "não-é-uma-url",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.procurement.updateStage({
        equipmentId: 1,
        stageKey: "delivery",
        status: "in_progress",
        stageDate: -1,
        notes: null,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMocks.createEquipment).not.toHaveBeenCalled();
    expect(dbMocks.updateProcurementStage).not.toHaveBeenCalled();
  });

  it("retorna não encontrado quando o detalhe não existe", async () => {
    dbMocks.getEquipmentById.mockResolvedValueOnce(null);
    const caller = appRouter.createCaller(adminContext());
    await expect(caller.procurement.detail({ id: 999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
