import { describe, expect, it } from "vitest";
import { gerarParcelas, validarSomaParcelas } from "../parcelas";

describe("gerarParcelas", () => {
  it("divide um valor exatamente divisível", () => {
    const parcelas = gerarParcelas({
      valorTotalCentavos: 30000, // R$ 300,00
      numeroParcelas: 3,
      mesInicio: "2026-01",
    });

    expect(parcelas).toEqual([
      { numeroDaParcela: 1, mesReferencia: "2026-01", valorCentavos: 10000 },
      { numeroDaParcela: 2, mesReferencia: "2026-02", valorCentavos: 10000 },
      { numeroDaParcela: 3, mesReferencia: "2026-03", valorCentavos: 10000 },
    ]);
  });

  it("joga o resto do arredondamento para a ÚLTIMA parcela (100 / 3)", () => {
    const parcelas = gerarParcelas({
      valorTotalCentavos: 100, // R$ 1,00 em 3x -> 33,33,33 sobra 1 centavo
      numeroParcelas: 3,
      mesInicio: "2026-01",
    });

    expect(parcelas[0].valorCentavos).toBe(33);
    expect(parcelas[1].valorCentavos).toBe(33);
    expect(parcelas[2].valorCentavos).toBe(34); // recebe o centavo restante
  });

  it("nunca perde nem cria centavos: soma das parcelas === valor total (propriedade auditável)", () => {
    const casos = [
      { valorTotalCentavos: 199999, numeroParcelas: 7 },
      { valorTotalCentavos: 1, numeroParcelas: 1 },
      { valorTotalCentavos: 999, numeroParcelas: 12 },
      { valorTotalCentavos: 123456789, numeroParcelas: 24 },
      { valorTotalCentavos: 100, numeroParcelas: 3 },
    ];

    for (const caso of casos) {
      const parcelas = gerarParcelas({ ...caso, mesInicio: "2026-01" });
      expect(validarSomaParcelas(parcelas, caso.valorTotalCentavos)).toBe(true);
    }
  });

  it("compra à vista (1 parcela) mantém o valor cheio", () => {
    const parcelas = gerarParcelas({
      valorTotalCentavos: 15050,
      numeroParcelas: 1,
      mesInicio: "2026-03",
    });
    expect(parcelas).toEqual([{ numeroDaParcela: 1, mesReferencia: "2026-03", valorCentavos: 15050 }]);
  });

  it("gera os meses de referência corretamente cruzando o ano", () => {
    const parcelas = gerarParcelas({
      valorTotalCentavos: 1200,
      numeroParcelas: 4,
      mesInicio: "2026-11",
    });
    expect(parcelas.map((p) => p.mesReferencia)).toEqual(["2026-11", "2026-12", "2027-01", "2027-02"]);
  });

  it("rejeita valor total zero ou negativo", () => {
    expect(() => gerarParcelas({ valorTotalCentavos: 0, numeroParcelas: 3, mesInicio: "2026-01" })).toThrow();
    expect(() => gerarParcelas({ valorTotalCentavos: -100, numeroParcelas: 3, mesInicio: "2026-01" })).toThrow();
  });

  it("rejeita número de parcelas menor que 1", () => {
    expect(() => gerarParcelas({ valorTotalCentavos: 100, numeroParcelas: 0, mesInicio: "2026-01" })).toThrow();
  });
});
