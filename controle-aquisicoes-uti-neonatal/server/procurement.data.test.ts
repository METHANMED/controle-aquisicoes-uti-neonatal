import { describe, expect, it } from "vitest";
import { PROJECT_INFO, SOURCE_EQUIPMENT, STAGE_DEFINITIONS } from "../shared/procurement";

describe("integridade dos dados do orçamento", () => {
  it("preserva os totais da proposta comercial", () => {
    expect(SOURCE_EQUIPMENT).toHaveLength(PROJECT_INFO.equipmentTypes);
    expect(SOURCE_EQUIPMENT.reduce((sum, item) => sum + item.quantity, 0)).toBe(PROJECT_INFO.totalUnits);
    expect(SOURCE_EQUIPMENT.reduce((sum, item) => sum + item.totalValueCents, 0)).toBe(PROJECT_INFO.totalValueCents);
  });

  it("mantém os itens numerados de 1 a 52 sem duplicidade", () => {
    const itemNumbers = SOURCE_EQUIPMENT.map(item => item.itemNumber);
    expect(new Set(itemNumbers).size).toBe(52);
    expect(itemNumbers).toEqual(Array.from({ length: 52 }, (_, index) => index + 1));
  });

  it("usa exatamente os seis rótulos de etapa aprovados", () => {
    expect(STAGE_DEFINITIONS.map(stage => stage.label)).toEqual([
      "Aquisição",
      "Link da Nota Fiscal",
      "Envio",
      "Previsão de Entrega",
      "Entrega",
      "Instalação",
    ]);
  });
});

