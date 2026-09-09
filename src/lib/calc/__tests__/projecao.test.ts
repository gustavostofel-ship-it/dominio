import { describe, expect, it } from "vitest";
import { gerarSequenciaDeMeses } from "../month";
import { gerarParcelas } from "../parcelas";
import { calcularResumoPorMes, type ItemProjecao } from "../projecao";

describe("calcularResumoPorMes", () => {
  it("soma parcelas de cartão pendentes por mês", () => {
    const parcelas = gerarParcelas({ valorTotalCentavos: 30000, numeroParcelas: 3, mesInicio: "2026-01" });
    const itens: ItemProjecao[] = parcelas.map((p) => ({
      origem: "parcela",
      id: `p${p.numeroDaParcela}`,
      nome: "Notebook",
      mesReferencia: p.mesReferencia,
      valorCentavos: p.valorCentavos,
      status: "pendente",
      atribuidoA: "eu",
    }));

    const resumo = calcularResumoPorMes(itens, gerarSequenciaDeMeses("2026-01", 3));
    expect(resumo.map((r) => r.totalDevidoCentavos)).toEqual([10000, 10000, 10000]);
  });

  it("exclui itens atribuídos a terceiros do total devido pelo usuário", () => {
    const itens: ItemProjecao[] = [
      { origem: "divida_fixa", id: "d1", nome: "Aluguel", mesReferencia: "2026-01", valorCentavos: 150000, status: "pendente", atribuidoA: "eu" },
      { origem: "divida_fixa", id: "d2", nome: "Cartão do irmão", mesReferencia: "2026-01", valorCentavos: 90000, status: "pendente", atribuidoA: "Irmão" },
    ];

    const [resumo] = calcularResumoPorMes(itens, ["2026-01"]);
    expect(resumo.totalDevidoCentavos).toBe(150000);
    expect(resumo.totalTerceirosCentavos).toBe(90000);
  });

  it("itens pagos (pago_no_mes ou quitado_antecipado) saem do total devido, mas aparecem no total pago", () => {
    const itens: ItemProjecao[] = [
      { origem: "parcela", id: "p1", nome: "Compra A", mesReferencia: "2026-01", valorCentavos: 10000, status: "pendente", atribuidoA: "eu" },
      { origem: "parcela", id: "p2", nome: "Compra B", mesReferencia: "2026-01", valorCentavos: 20000, status: "pago_no_mes", atribuidoA: "eu" },
      { origem: "divida_fixa", id: "d1", nome: "Aluguel", mesReferencia: "2026-01", valorCentavos: 150000, status: "quitado_antecipado", atribuidoA: "eu" },
    ];

    const [resumo] = calcularResumoPorMes(itens, ["2026-01"]);
    expect(resumo.totalDevidoCentavos).toBe(10000);
    expect(resumo.totalPagoCentavos).toBe(170000);
  });

  it("meses sem nenhum item lançam zero em todos os totais (nunca undefined/NaN)", () => {
    const [resumo] = calcularResumoPorMes([], ["2026-05"]);
    expect(resumo.totalDevidoCentavos).toBe(0);
    expect(resumo.totalPagoCentavos).toBe(0);
    expect(resumo.totalTerceirosCentavos).toBe(0);
    expect(resumo.itens).toEqual([]);
  });

  it("projeção de 12 meses cobre exatamente os 12 meses pedidos, na ordem", () => {
    const meses = gerarSequenciaDeMeses("2026-01", 12);
    const resumo = calcularResumoPorMes([], meses);
    expect(resumo.map((r) => r.mesReferencia)).toEqual(meses);
  });
});
