import { describe, expect, it } from "vitest";
import { calcularStatusFinanceiro } from "../status";

const faixas = { faixaVerdePct: 60, faixaAmarelaPct: 90 };

describe("calcularStatusFinanceiro", () => {
  it("verde quando dívidas <= 60% da renda", () => {
    expect(
      calcularStatusFinanceiro({ dividasPendentesCentavos: 5000, rendaMensalEsperadaCentavos: 10000, ...faixas })
    ).toBe("verde");
  });

  it("é verde exatamente no limite (60%)", () => {
    expect(
      calcularStatusFinanceiro({ dividasPendentesCentavos: 6000, rendaMensalEsperadaCentavos: 10000, ...faixas })
    ).toBe("verde");
  });

  it("amarelo logo acima do limite verde", () => {
    expect(
      calcularStatusFinanceiro({ dividasPendentesCentavos: 6001, rendaMensalEsperadaCentavos: 10000, ...faixas })
    ).toBe("amarelo");
  });

  it("é amarelo exatamente no limite (90%)", () => {
    expect(
      calcularStatusFinanceiro({ dividasPendentesCentavos: 9000, rendaMensalEsperadaCentavos: 10000, ...faixas })
    ).toBe("amarelo");
  });

  it("vermelho acima de 90%", () => {
    expect(
      calcularStatusFinanceiro({ dividasPendentesCentavos: 9001, rendaMensalEsperadaCentavos: 10000, ...faixas })
    ).toBe("vermelho");
  });

  it("vermelho quando dívidas superam a renda (>100%)", () => {
    expect(
      calcularStatusFinanceiro({ dividasPendentesCentavos: 15000, rendaMensalEsperadaCentavos: 10000, ...faixas })
    ).toBe("vermelho");
  });

  it("vermelho quando a renda esperada é zero", () => {
    expect(
      calcularStatusFinanceiro({ dividasPendentesCentavos: 0, rendaMensalEsperadaCentavos: 0, ...faixas })
    ).toBe("vermelho");
  });

  it("vermelho quando a renda esperada é negativa", () => {
    expect(
      calcularStatusFinanceiro({ dividasPendentesCentavos: 100, rendaMensalEsperadaCentavos: -500, ...faixas })
    ).toBe("vermelho");
  });

  it("faixas customizadas: 40% cai em amarelo quando verde=30 e amarelo=50", () => {
    expect(
      calcularStatusFinanceiro({
        dividasPendentesCentavos: 4000,
        rendaMensalEsperadaCentavos: 10000,
        faixaVerdePct: 30,
        faixaAmarelaPct: 50,
      })
    ).toBe("amarelo");
  });
});
