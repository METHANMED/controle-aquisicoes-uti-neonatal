import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function contextFor(role: "admin" | "user"): TrpcContext {
  return {
    user: {
      id: role === "admin" ? 1 : 2,
      openId: `${role}-open-id`,
      name: role === "admin" ? "Gestor" : "Acompanhamento",
      email: `${role}@example.com`,
      loginMethod: "manus",
      role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("controle de acesso da aquisição", () => {
  it("impede o perfil Acompanhamento de criar equipamentos", async () => {
    const caller = appRouter.createCaller(contextFor("user"));
    await expect(
      caller.procurement.create({
        name: "Equipamento",
        brand: null,
        model: null,
        quantity: 1,
        unitValueCents: 0,
        invoiceUrl: null,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("impede o perfil Acompanhamento de alterar etapas", async () => {
    const caller = appRouter.createCaller(contextFor("user"));
    await expect(
      caller.procurement.updateStage({
        equipmentId: 1,
        stageKey: "acquisition",
        status: "completed",
        stageDate: Date.UTC(2026, 6, 29),
        notes: "Teste",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("impede o perfil Acompanhamento de alterar equipamentos", async () => {
    const caller = appRouter.createCaller(contextFor("user"));
    await expect(
      caller.procurement.update({
        id: 1,
        name: "Equipamento alterado",
        brand: "Marca",
        model: "Modelo",
        quantity: 1,
        unitValueCents: 100,
        invoiceUrl: null,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
