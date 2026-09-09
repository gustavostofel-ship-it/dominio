"use client";

import { useEffect, useRef, useState } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);

  // Depois de um envio bem-sucedido, React reseta os campos "não
  // controlados" do form nativamente (disparando um evento "reset" no
  // <form>) — mas esse campo é controlado pelo próprio estado React, que
  // não escuta esse reset sozinho. Sem isso, o valor digitado ficava
  // preso na tela mesmo depois de salvar, prestes a ser reenviado por
  // engano na próxima dívida/compra.
  useEffect(() => {
    const form = inputRef.current?.closest("form");
    if (!form) return;
    const aoResetar = () => setCentavosDigitados(defaultValueReais ? String(Math.round(defaultValueReais * 100)) : "");
    form.addEventListener("reset", aoResetar);
    return () => form.removeEventListener("reset", aoResetar);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só precisa religar se o form mudar
  }, []);

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
        ref={inputRef}
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
