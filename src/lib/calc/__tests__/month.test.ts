import { describe, expect, it } from "vitest";
import { compararMes, gerarSequenciaDeMeses, mesAtual, somarMeses } from "../month";

describe("somarMeses", () => {
  it("soma dentro do mesmo ano", () => {
    expect(somarMeses("2026-01", 3)).toBe("2026-04");
  });

  it("vira o ano corretamente", () => {
    expect(somarMeses("2026-11", 3)).toBe("2027-02");
  });

  it("aceita quantidade zero", () => {
    expect(somarMeses("2026-06", 0)).toBe("2026-06");
  });

  it("aceita quantidade negativa (mês anterior)", () => {
    expect(somarMeses("2026-01", -1)).toBe("2025-12");
  });

  it("lida com múltiplas voltas de ano", () => {
    expect(somarMeses("2026-01", 25)).toBe("2028-02");
  });
});

describe("compararMes", () => {
  it("ordena corretamente por string", () => {
    expect(compararMes("2026-01", "2026-02")).toBeLessThan(0);
    expect(compararMes("2026-12", "2027-01")).toBeLessThan(0);
    expect(compararMes("2026-05", "2026-05")).toBe(0);
    expect(compararMes("2026-06", "2026-05")).toBeGreaterThan(0);
  });
});

describe("gerarSequenciaDeMeses", () => {
  it("gera N meses consecutivos a partir do mês inicial", () => {
    expect(gerarSequenciaDeMeses("2026-11", 4)).toEqual([
      "2026-11",
      "2026-12",
      "2027-01",
      "2027-02",
    ]);
  });

  it("gera 12 meses para a projeção padrão", () => {
    const meses = gerarSequenciaDeMeses("2026-01", 12);
    expect(meses).toHaveLength(12);
    expect(meses[0]).toBe("2026-01");
    expect(meses[11]).toBe("2026-12");
  });
});

describe("mesAtual", () => {
  it("formata corretamente a partir de uma data", () => {
    expect(mesAtual(new Date(2026, 0, 15))).toBe("2026-01");
    expect(mesAtual(new Date(2026, 11, 1))).toBe("2026-12");
  });
});
