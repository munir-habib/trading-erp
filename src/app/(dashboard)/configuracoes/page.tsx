import { listCategories } from "@/server/actions/categories";
import { listMarginRules, upsertMarginRuleAction } from "@/server/actions/margins";
import { getAlertThresholds, updateAlertThresholdsAction } from "@/server/actions/alerts";
import { listChecklistTemplates, upsertChecklistTemplateAction } from "@/server/actions/documents";
import { listFixedCosts, createFixedCostAction } from "@/server/actions/fixed-costs";
import { getExchangeRates, upsertExchangeRateAction } from "@/server/actions/reports";
import { DeleteFixedCostButton } from "@/components/configuracoes/delete-fixed-cost-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { orderTypeValues } from "@/lib/validation/order";
import { DEFAULT_CHECKLIST_ITEMS } from "@/lib/default-checklists";

const ORDER_TYPE_LABELS: Record<string, string> = {
  MEDICAMENTOS: "Medicamentos",
  MATERIAL_CIRURGICO: "Material cirúrgico",
  EQUIPAMENTO: "Equipamento",
  OUTRO: "Outro",
};

export default async function ConfiguracoesPage() {
  const [categories, marginRules, thresholds, templates, fixedCosts, exchangeRates] =
    await Promise.all([
      listCategories(),
      listMarginRules(),
      getAlertThresholds(),
      listChecklistTemplates(),
      listFixedCosts(),
      getExchangeRates(),
    ]);

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Definições globais (só ADMIN).</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Alertas e limites</h2>
        <form action={updateAlertThresholdsAction} className="hairline flex flex-col gap-3 rounded-lg p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="supplierStaleDays">Fornecedor sem resposta (dias)</Label>
              <Input
                id="supplierStaleDays"
                name="supplierStaleDays"
                type="number"
                defaultValue={thresholds.supplierStaleDays}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="orderStaleDays">Pedido sem atualização (dias)</Label>
              <Input
                id="orderStaleDays"
                name="orderStaleDays"
                type="number"
                defaultValue={thresholds.orderStaleDays}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="freightThresholdPercent">Frete acima de (%)</Label>
              <Input
                id="freightThresholdPercent"
                name="freightThresholdPercent"
                type="number"
                defaultValue={thresholds.freightThresholdPercent}
              />
            </div>
          </div>
          <Button type="submit" size="sm" className="w-fit">
            Guardar limites
          </Button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Margens por categoria</h2>
        <form action={upsertMarginRuleAction} className="hairline flex flex-wrap items-end gap-3 rounded-lg p-4">
          <div className="flex flex-col gap-1.5">
            <Label>Categoria</Label>
            <Select name="categoryId">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Regra global (sem categoria)" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="percentage">Margem (%)</Label>
            <Input id="percentage" name="percentage" type="number" step="0.1" className="w-28" required />
          </div>
          <Button type="submit" size="sm">
            Adicionar regra
          </Button>
        </form>
        <div className="hairline overflow-hidden rounded-lg">
          {marginRules.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">Sem regras definidas.</p>
          )}
          {marginRules.map((r) => (
            <div key={r.id} className="hairline-b flex items-center justify-between px-3 py-2 text-sm last:border-b-0">
              <span>{r.category?.name ?? "Regra global"}</span>
              <span className="text-muted-foreground">{r.percentage}%</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Checklists por tipo de encomenda</h2>
        {orderTypeValues.map((type) => {
          const template = templates.find((t) => t.orderType === type);
          const items = (template?.items as string[] | undefined) ?? DEFAULT_CHECKLIST_ITEMS[type];
          return (
            <form
              key={type}
              action={upsertChecklistTemplateAction}
              className="hairline flex flex-col gap-2 rounded-lg p-4"
            >
              <input type="hidden" name="orderType" value={type} />
              <Label>{ORDER_TYPE_LABELS[type]}</Label>
              <Textarea name="items" rows={4} defaultValue={items.join("\n")} />
              <Button type="submit" size="sm" variant="outline" className="w-fit">
                Guardar checklist
              </Button>
            </form>
          );
        })}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Custos fixos</h2>
        <form action={createFixedCostAction} className="hairline flex flex-wrap items-end gap-3 rounded-lg p-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fc-name">Nome</Label>
            <Input id="fc-name" name="name" required className="w-40" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fc-amount">Valor mensal</Label>
            <Input id="fc-amount" name="monthlyAmount" type="number" step="0.01" required className="w-32" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Moeda</Label>
            <Select name="currency" defaultValue="EUR">
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="AOA">AOA</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" size="sm">
            Adicionar
          </Button>
        </form>
        <div className="hairline overflow-hidden rounded-lg">
          {fixedCosts.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">Sem custos fixos definidos.</p>
          )}
          {fixedCosts.map((fc) => (
            <div key={fc.id} className="hairline-b flex items-center justify-between px-3 py-2 text-sm last:border-b-0">
              <span>{fc.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {fc.monthlyAmount.toFixed(2)} {fc.currency}/mês
                </span>
                <DeleteFixedCostButton id={fc.id} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Câmbio</h2>
        <form action={upsertExchangeRateAction} className="hairline flex flex-wrap items-end gap-3 rounded-lg p-4">
          <div className="flex flex-col gap-1.5">
            <Label>De</Label>
            <Select name="fromCurrency" defaultValue="EUR">
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="AOA">AOA</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Para</Label>
            <Select name="toCurrency" defaultValue="AOA">
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="AOA">AOA</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rate">Taxa</Label>
            <Input id="rate" name="rate" type="number" step="0.0001" required className="w-32" />
          </div>
          <Button type="submit" size="sm">
            Guardar taxa
          </Button>
        </form>
        <div className="hairline overflow-hidden rounded-lg">
          {exchangeRates.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">Sem taxas definidas.</p>
          )}
          {exchangeRates.map((r) => (
            <div key={r.id} className="hairline-b flex items-center justify-between px-3 py-2 text-sm last:border-b-0">
              <span>{r.fromCurrency} → {r.toCurrency}</span>
              <span className="text-muted-foreground">{r.rate}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
