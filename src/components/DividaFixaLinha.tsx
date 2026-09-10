"use client";

import { useState } from "react";
import { atualizarDividaFixa, arquivarDividaFixa, encerrarDividaFixa } from "@/app/actions/dividas-fixas";
import { FormComErro } from "@/components/FormComErro";
import { SubmitButton } from "@/components/SubmitButton";
import { Campo } from "@/components/Campo";
import { CampoValorMonetario } from "@/components/CampoValorMonetario";
import { SeletorResponsavel } from "@/components/SeletorResponsavel";
import { CategoriaPill, SeletorCategoria } from "@/components/CategoriaGasto";
import { formatarBRL, mesAtual, somarMeses } from "@/lib/calc";
import type { CartaoRow, DividaFixaRow } from "@/types/database";

export function DividaFixaLinha({ divida, cartoes }: { divida: DividaFixaRow; cartoes: CartaoRow[] }) {
  const [editando, setEditando] = useState(false);
  const [confirmandoEncerrar, setConfirmandoEncerrar] = useState(false);
  const [mesFimEscolhido, setMesFimEscolhido] = useState(mesAtual());
  const ehDeTerceiro = divida.atribuido_a !== "eu";
  const cartao = cartoes.find((c) => c.id === divida.cartao_id);
  const mesFimRef = divida.mes_fim?.slice(0, 7) ?? null;
  const jaEncerrada = mesFimRef !== null && mesFimRef < mesAtual();
  const podeEncerrar = divida.ativo && divida.recorrente && (!mesFimRef || mesFimRef > mesAtual());
  const proximoMes = somarMeses(mesAtual(), 1);

  function abrirEncerrar() {
    setMesFimEscolhido(mesAtual());
    setConfirmandoEncerrar(true);
  }

  if (editando) {
    return (
      <li className="rounded-lg border border-border p-4">
        <FormComErro action={atualizarDividaFixa} onSucesso={() => setEditando(false)} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={divida.id} />
          <Campo label="Nome" name="nome" defaultValue={divida.nome} required />
          <CampoValorMonetario label="Valor" name="valor" defaultValueReais={divida.valor_centavos / 100} required />
          <Campo label="Dia de vencimento" name="dia_vencimento" type="number" min={1} max={31} defaultValue={divida.dia_vencimento} required />
          <Campo label="Mês final (opcional)" name="mes_fim" type="month" defaultValue={divida.mes_fim?.slice(0, 7) ?? ""} />
          <label className="flex flex-col gap-1 text-sm font-medium">
            Cobrada em algum cartão?
            <select
              name="cartao_id"
              defaultValue={divida.cartao_id ?? ""}
              className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-verde-500 focus:ring-2 focus:ring-verde-100"
            >
              <option value="">Não — é paga direto (boleto, débito, etc.)</option>
              {cartoes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          <SeletorResponsavel valorInicial={divida.atribuido_a} />
          <SeletorCategoria defaultValue={divida.categoria} />
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="recorrente" defaultChecked={divida.recorrente} className="h-4 w-4 accent-verde-600" />
            Recorrente
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <SubmitButton>Salvar</SubmitButton>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
            >
              Cancelar
            </button>
          </div>
        </FormComErro>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="flex flex-wrap items-center gap-2 font-medium">
            {divida.nome} {!divida.ativo && <span className="text-xs text-foreground-muted">(arquivada)</span>}
            <CategoriaPill categoria={divida.categoria} />
            {ehDeTerceiro && <span className="status-pill status-pill--amarelo">de {divida.atribuido_a}</span>}
          </p>
          <p className="text-xs text-foreground-muted">
            Vence dia {divida.dia_vencimento} · {divida.recorrente ? "recorrente" : "única"}
            {cartao && <> · cobrada no {cartao.nome}</>}
            {mesFimRef && <> · {jaEncerrada ? "encerrada em" : "encerra em"} {mesFimRef}</>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold">{formatarBRL(divida.valor_centavos)}</span>
          <button onClick={() => setEditando(true)} className="text-sm font-medium text-verde-700 hover:underline">
            Editar
          </button>
          {podeEncerrar && !confirmandoEncerrar && (
            <button onClick={abrirEncerrar} className="text-sm font-medium text-verde-700 hover:underline">
              Encerrar
            </button>
          )}
          {divida.ativo && (
            <form
              action={async (formData) => {
                await arquivarDividaFixa(formData);
              }}
            >
              <input type="hidden" name="id" value={divida.id} />
              <button type="submit" className="text-sm font-medium text-foreground-muted hover:underline">
                Arquivar
              </button>
            </form>
          )}
        </div>
      </div>

      {confirmandoEncerrar && (
        <FormComErro
          action={encerrarDividaFixa}
          onSucesso={() => setConfirmandoEncerrar(false)}
          className="rounded-lg border border-dashed border-verde-300 bg-verde-50 p-3 text-xs"
        >
          <input type="hidden" name="id" value={divida.id} />
          <p className="text-foreground-muted">
            Até qual mês essa dívida ainda deve contar? Se ela for cobrada num cartão e a fatura do
            ciclo atual já fechou antes do cancelamento, a cobrança ainda cai na fatura do mês
            seguinte — nesse caso escolha o mês seguinte, não o atual.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMesFimEscolhido(mesAtual())}
              className={`rounded-full border px-2.5 py-1 font-medium ${
                mesFimEscolhido === mesAtual() ? "border-verde-500 bg-verde-100" : "border-border bg-white"
              }`}
            >
              Até {mesAtual()} (este mês)
            </button>
            <button
              type="button"
              onClick={() => setMesFimEscolhido(proximoMes)}
              className={`rounded-full border px-2.5 py-1 font-medium ${
                mesFimEscolhido === proximoMes ? "border-verde-500 bg-verde-100" : "border-border bg-white"
              }`}
            >
              Até {proximoMes} (mês que vem)
            </button>
            <input
              type="month"
              name="mes_fim"
              value={mesFimEscolhido}
              min={mesAtual()}
              onChange={(e) => setMesFimEscolhido(e.target.value)}
              className="rounded-lg border border-border px-2 py-1 text-xs outline-none focus:border-verde-500 focus:ring-2 focus:ring-verde-100"
            />
          </div>
          <div className="mt-2 flex gap-3">
            <button type="submit" className="font-medium text-verde-700 hover:underline">
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => setConfirmandoEncerrar(false)}
              className="font-medium text-foreground-muted hover:underline"
            >
              Cancelar
            </button>
          </div>
        </FormComErro>
      )}
    </li>
  );
}
