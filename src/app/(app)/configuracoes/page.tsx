import { exigirUsuarioComConta } from "@/lib/data/context";
import { atualizarConfiguracoes } from "@/app/actions/configuracoes";
import type { ConfiguracoesRow } from "@/types/database";
import { FormComErro } from "@/components/FormComErro";
import { SubmitButton } from "@/components/SubmitButton";
import { Campo } from "@/components/Campo";
import { CampoValorMonetario } from "@/components/CampoValorMonetario";

export default async function ConfiguracoesPage() {
  const { supabase, usuario } = await exigirUsuarioComConta();

  const { data } = await supabase
    .from("configuracoes")
    .select("*")
    .eq("conta_id", usuario.conta_id)
    .maybeSingle();

  const config = (data as ConfiguracoesRow | null) ?? {
    conta_id: usuario.conta_id,
    renda_mensal_esperada_centavos: 0,
    limite_uso_cartao_mes_centavos: null,
    faixa_verde_pct: 60,
    faixa_amarela_pct: 90,
    atualizado_em: new Date().toISOString(),
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-foreground-muted">
          Ajuste a renda esperada e as faixas usadas para calcular o status verde/amarelo/vermelho.
        </p>
      </div>

      <section className="card p-6">
        <FormComErro action={atualizarConfiguracoes} className="grid gap-4 sm:grid-cols-2">
          <CampoValorMonetario
            label="Renda mensal esperada"
            name="renda_mensal_esperada"
            defaultValueReais={config.renda_mensal_esperada_centavos / 100}
            required
          />
          <CampoValorMonetario
            label="Limite de uso do cartão este mês (opcional)"
            name="limite_uso_cartao_mes"
            defaultValueReais={config.limite_uso_cartao_mes_centavos ? config.limite_uso_cartao_mes_centavos / 100 : undefined}
          />
          <Campo
            label="Faixa verde até (% da renda)"
            name="faixa_verde_pct"
            type="number"
            step="1"
            min="1"
            max="99"
            defaultValue={config.faixa_verde_pct}
            required
          />
          <Campo
            label="Faixa amarela até (% da renda)"
            name="faixa_amarela_pct"
            type="number"
            step="1"
            min="1"
            max="99"
            defaultValue={config.faixa_amarela_pct}
            required
          />
          <SubmitButton className="sm:col-span-2 sm:w-fit">Salvar</SubmitButton>
        </FormComErro>
      </section>
    </div>
  );
}
