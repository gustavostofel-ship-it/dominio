"use client";

import { formatarBRL } from "@/lib/calc";

/**
 * Variante controlada (sem form/hidden field) do campo de valor com
 * máscara de moeda — usada em listas dinâmicas (ex.: linhas de divisão de
 * gasto) onde o valor já vive num estado do componente pai.
 *
 * `valorReais` é a string decimal em reais (ex.: "9.50"); `onChange`
 * recebe a mesma representação a cada dígito digitado.
 */
export function InputValorMonetario({
  valorReais,
  onChange,
  placeholder = "R$ 0,00",
  className,
  required,
}: {
  valorReais: string;
  onChange: (valorReais: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}) {
  const centavos = valorReais ? Math.round(Number(valorReais) * 100) : 0;
  const exibicao = valorReais ? formatarBRL(centavos) : "";

  function aoDigitar(e: React.ChangeEvent<HTMLInputElement>) {
    const somenteDigitos = e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 8);
    onChange(somenteDigitos ? (Number(somenteDigitos) / 100).toFixed(2) : "");
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={exibicao}
      onChange={aoDigitar}
      placeholder={placeholder}
      required={required}
      className={
        className ??
        "rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-verde-500 focus:ring-2 focus:ring-verde-100"
      }
    />
  );
}
