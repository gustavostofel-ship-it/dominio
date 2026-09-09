import { describe, expect, it } from "vitest";
import { dividaFixaAplicavelNoMes, gerarInstanciasDividasFixas, type DividaFixaDef } from "../dividas-fixas";

describe("dividaFixaAplicavelNoMes", () => {
  it("dívida recorrente sem mes_fim se aplica indefinidamente a partir do início", () => {
    const aluguel: DividaFixaDef = {
      id: "1",
      valorCentavos: 150000,
      recorrente: true,
      mesInicio: "2026-01",
      mesFim: null,
      atribuidoA: "eu",
    };
    expect(dividaFixaAplicavelNoMes(aluguel, "2025-12")).toBe(false);
    expect(dividaFixaAplicavelNoMes(aluguel, "2026-01")).toBe(true);
    expect(dividaFixaAplicavelNoMes(aluguel, "2030-01")).toBe(true);
  });

  it("dívida recorrente com mes_fim para de se aplicar depois do fim", () => {
    const emprestimo: DividaFixaDef = {
      id: "2",
      valorCentavos: 30000,
      recorrente: true,
      mesInicio: "2026-01",
      mesFim: "2026-06",
      atribuidoA: "eu",
    };
    expect(dividaFixaAplicavelNoMes(emprestimo, "2026-06")).toBe(true);
    expect(dividaFixaAplicavelNoMes(emprestimo, "2026-07")).toBe(false);
  });

  it("dívida não recorrente só se aplica no próprio mês de início", () => {
    const unica: DividaFixaDef = {
      id: "3",
      valorCentavos: 5000,
      recorrente: false,
      mesInicio: "2026-03",
      mesFim: null,
      atribuidoA: "eu",
    };
    expect(dividaFixaAplicavelNoMes(unica, "2026-02")).toBe(false);
    expect(dividaFixaAplicavelNoMes(unica, "2026-03")).toBe(true);
    expect(dividaFixaAplicavelNoMes(unica, "2026-04")).toBe(false);
  });
});

describe("gerarInstanciasDividasFixas", () => {
  const dividas: DividaFixaDef[] = [
    { id: "aluguel", valorCentavos: 150000, recorrente: true, mesInicio: "2026-01", mesFim: null, atribuidoA: "eu" },
    { id: "cartao-irmao", valorCentavos: 40000, recorrente: true, mesInicio: "2026-01", mesFim: null, atribuidoA: "Irmão" },
  ];
  const meses = ["2026-01", "2026-02", "2026-03"];

  it("gera uma instância por mês aplicável, status padrão pendente", () => {
    const instancias = gerarInstanciasDividasFixas(dividas, [], meses);
    expect(instancias).toHaveLength(6);
    expect(instancias.every((i) => i.status === "pendente")).toBe(true);
  });

  it("aplica override de status (quitação antecipada) só na instância certa", () => {
    const instancias = gerarInstanciasDividasFixas(
      dividas,
      [{ dividaFixaId: "aluguel", mesReferencia: "2026-02", status: "quitado_antecipado", dataPagamentoReal: "2026-01-20" }],
      meses
    );

    const fevAluguel = instancias.find((i) => i.dividaFixaId === "aluguel" && i.mesReferencia === "2026-02");
    const janAluguel = instancias.find((i) => i.dividaFixaId === "aluguel" && i.mesReferencia === "2026-01");

    expect(fevAluguel?.status).toBe("quitado_antecipado");
    expect(janAluguel?.status).toBe("pendente");
  });

  it("preserva o atribuido_a de cada dívida na instância gerada", () => {
    const instancias = gerarInstanciasDividasFixas(dividas, [], meses);
    const doIrmao = instancias.filter((i) => i.dividaFixaId === "cartao-irmao");
    expect(doIrmao.every((i) => i.atribuidoA === "Irmão")).toBe(true);
  });
});
