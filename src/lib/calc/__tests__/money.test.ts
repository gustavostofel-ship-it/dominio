import { describe, expect, it } from "vitest";
import { centavosParaReais, formatarBRL, reaisParaCentavos, somarCentavos } from "../money";

describe("reaisParaCentavos", () => {
  it("converte valores exatos", () => {
    expect(reaisParaCentavos(10)).toBe(1000);
    expect(reaisParaCentavos(0.01)).toBe(1);
  });

  it("não sofre com erro clássico de ponto flutuante (19.9 -> 1990)", () => {
    // 19.9 * 100 em JS puro dá 1989.9999999999998
    expect(reaisParaCentavos(19.9)).toBe(1990);
    expect(reaisParaCentavos(2.32)).toBe(232);
    expect(reaisParaCentavos(0.29)).toBe(29);
  });

  it("rejeita valores não finitos", () => {
    expect(() => reaisParaCentavos(NaN)).toThrow();
    expect(() => reaisParaCentavos(Infinity)).toThrow();
  });
});

describe("centavosParaReais", () => {
  it("converte de volta", () => {
    expect(centavosParaReais(1000)).toBe(10);
    expect(centavosParaReais(1)).toBe(0.01);
  });
});

describe("formatarBRL", () => {
  it("formata em pt-BR com R$", () => {
    // NBSP ( ) é o separador padrão do Intl pt-BR entre "R$" e o valor
    expect(formatarBRL(123456)).toBe("R$ 1.234,56");
    expect(formatarBRL(0)).toBe("R$ 0,00");
  });
});

describe("somarCentavos", () => {
  it("soma múltiplos valores inteiros", () => {
    expect(somarCentavos(100, 200, 300)).toBe(600);
  });

  it("soma vazia é zero", () => {
    expect(somarCentavos()).toBe(0);
  });

  it("trunca valores não inteiros por segurança", () => {
    expect(somarCentavos(100.7, 200.2)).toBe(300);
  });
});
