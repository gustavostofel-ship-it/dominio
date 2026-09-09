"use client";

import { useState } from "react";
import { formatarBRL } from "@/lib/calc";

/**
 * Campo de valor em reais com máscara de moeda "estilo calculadora": você
 * digita só números e eles preenchem da direita pra esquerda (centavos
 * primeiro), sempre mostrando "R$ 1.234,56" completo — nunca um número cru
 * ambíguo tipo "95" (é R$ 95,00? R$ 0,95?).
 *
 * O campo visível é texto (pra poder mostrar "R$"), e um campo hidden
 * carrega o valor em reais como decimal simples (ex.: "9.50") — o mesmo
 * formato que as server actions já esperam via `Number(formData.get(...))`.
 */
export function CampoValorMonetario({
  label,
  name,
  required,
  defaultValueReais,
  className,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValueReais?: number;
  className?: string;
}) {
  const [centavosDigitados, setCentavosDigitados] = useState<string>(() =>
    defaultValueReais ? String(Math.round(defaultValueReais * 100)) : ""
  );

  const centavos = Number(centavosDigitados || "0");
  const valorReais = (centavos / 100).toFixed(2);
  const exibicao = centavosDigitados ? formatarBRL(centavos) : "";

  function aoDigitar(e: React.ChangeEvent<HTMLInputElement>) {
    const somenteDigitos = e.target.value.replace(/\D/g, "");
    // remove zeros à esquerda além do necessário, sem impedir digitar "0"
    const limpo = somenteDigitos.replace(/^0+(?=\d)/, "");
    // trava em ~R$ 999.999,99 (8 dígitos) pra não deixar o número crescer sem limite por engano
    setCentavosDigitados(limpo.slice(0, 8));
  }

  return (
    <label className={`flex flex-col gap-1 text-sm font-medium ${className ?? ""}`}>
      {label}
      <input
        type="text"
        inputMode="decimal"
        value={exibicao}
        onChange={aoDigitar}
        placeholder="R$ 0,00"
        required={required}
        className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-verde-500 focus:ring-2 focus:ring-verde-100"
      />
      <input type="hidden" name={name} value={centavosDigitados ? valorReais : ""} />
    </label>
  );
}
