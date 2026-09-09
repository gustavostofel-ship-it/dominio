"use client";

import { useEffect, useState } from "react";

/**
 * Escolha explícita de responsável por um gasto/dívida:
 *
 * - "Nós" — a conta é compartilhada pela família (ex.: você + esposa), então
 *   isso NÃO é "eu" no sentido individual; é o total da família/conta.
 *   Internamente ainda gravamos como "eu" (o valor sentinela usado pelo
 *   motor de cálculo para "conta no total da conta"), só a rotulagem muda.
 * - "Outro" — 100% de responsabilidade de alguém de fora da conta. Exige um
 *   nome (campo obrigatório) — não dá pra marcar "outro" sem dizer quem é.
 *
 * Usa radio buttons (não texto livre) de propósito: um campo de texto com
 * valor padrão "eu" já causou uma dívida real ser marcada como "de
 * terceiro" por autopreenchimento do navegador. Com radio, só muda se a
 * pessoa clicar.
 */
export function SeletorResponsavel({
  valorInicial = "eu",
  nomeCampo = "atribuido_a",
  rotulo = "De quem é isso?",
  aoMudar,
}: {
  valorInicial?: string;
  nomeCampo?: string;
  rotulo?: string;
  /** Chamado sempre que o valor final (a ser gravado em atribuido_a) muda. */
  aoMudar?: (valor: string) => void;
}) {
  const ehOutroInicial = valorInicial !== "eu";
  const [tipo, setTipo] = useState<"nos" | "outro">(ehOutroInicial ? "outro" : "nos");
  const [nomeOutro, setNomeOutro] = useState(ehOutroInicial ? valorInicial : "");

  const valorFinal = tipo === "nos" ? "eu" : nomeOutro.trim();

  useEffect(() => {
    aoMudar?.(valorFinal);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só queremos disparar quando o valor final muda
  }, [valorFinal]);

  return (
    <fieldset className="flex flex-col gap-2 sm:col-span-2">
      <legend className="text-sm font-medium">{rotulo}</legend>
      <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={tipo === "nos"}
            onChange={() => setTipo("nos")}
            className="h-4 w-4 accent-verde-600"
          />
          Nós (conta no total da conta)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={tipo === "outro"}
            onChange={() => setTipo("outro")}
            className="h-4 w-4 accent-verde-600"
          />
          Outro (é 100% de outra pessoa)
        </label>
        {tipo === "outro" && (
          <input
            value={nomeOutro}
            onChange={(e) => setNomeOutro(e.target.value)}
            placeholder="Nome da pessoa (obrigatório)"
            autoComplete="off"
            required
            className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-verde-500 focus:ring-2 focus:ring-verde-100"
          />
        )}
      </div>
      <input type="hidden" name={nomeCampo} value={valorFinal} />
    </fieldset>
  );
}
