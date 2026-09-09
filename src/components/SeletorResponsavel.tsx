"use client";

import { useState } from "react";

/**
 * Escolha explícita de responsável (eu vs. terceiro), usada em qualquer
 * formulário que tenha o campo `atribuido_a`.
 *
 * Por que isso existe: a versão anterior era um campo de texto livre com
 * valor padrão "eu" — o preenchimento automático do navegador podia
 * substituir esse valor pelo nome salvo do usuário sem ele perceber,
 * fazendo uma dívida seria seja marcada como "de terceiro" por engano.
 * Com radio buttons isso não pode acontecer: o valor só muda se a pessoa
 * clicar explicitamente na segunda opção.
 */
export function SeletorResponsavel({
  valorInicial = "eu",
  nomeCampo = "atribuido_a",
  rotulo = "De quem é isso?",
}: {
  valorInicial?: string;
  nomeCampo?: string;
  rotulo?: string;
}) {
  const ehTerceiroInicial = valorInicial !== "eu";
  const [tipo, setTipo] = useState<"eu" | "terceiro">(ehTerceiroInicial ? "terceiro" : "eu");
  const [nomeTerceiro, setNomeTerceiro] = useState(ehTerceiroInicial ? valorInicial : "");

  const valorFinal = tipo === "eu" ? "eu" : nomeTerceiro.trim() || "Terceiro";

  return (
    <fieldset className="flex flex-col gap-2 sm:col-span-2">
      <legend className="text-sm font-medium">{rotulo}</legend>
      <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={tipo === "eu"}
            onChange={() => setTipo("eu")}
            className="h-4 w-4 accent-verde-600"
          />
          É meu (conta no meu total)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={tipo === "terceiro"}
            onChange={() => setTipo("terceiro")}
            className="h-4 w-4 accent-verde-600"
          />
          É 100% de outra pessoa (ex.: emprestei o cartão)
        </label>
        {tipo === "terceiro" && (
          <input
            value={nomeTerceiro}
            onChange={(e) => setNomeTerceiro(e.target.value)}
            placeholder="Nome da pessoa"
            autoComplete="off"
            className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-verde-500 focus:ring-2 focus:ring-verde-100"
          />
        )}
      </div>
      <input type="hidden" name={nomeCampo} value={valorFinal} />
    </fieldset>
  );
}
