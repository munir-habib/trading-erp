import {
  getConversionRate,
  getNaoAvancouAnalysis,
  getTopSuppliers,
  getAverageTimePerPhase,
} from "@/server/actions/reports";
import { Badge } from "@/components/ui/badge";
import { BarChartCard, PieChartCard } from "@/components/analises/report-charts";
import { ExportReportButton } from "@/components/analises/export-report-button";

export default async function AnalisesPage() {
  const [conversion, naoAvancou, suppliers, phases] = await Promise.all([
    getConversionRate(),
    getNaoAvancouAnalysis(),
    getTopSuppliers(),
    getAverageTimePerPhase(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Análises</h1>
          <p className="text-sm text-muted-foreground">Relatórios e analytics (ADMIN).</p>
        </div>
        <ExportReportButton />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="hairline rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Taxa de conversão</p>
          <p className="text-2xl font-semibold">{conversion.conversionRate.toFixed(0)}%</p>
        </div>
        <div className="hairline rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Total de pedidos</p>
          <p className="text-2xl font-semibold">{conversion.total}</p>
        </div>
        <div className="hairline rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Não avançados</p>
          <p className="text-2xl font-semibold">{conversion.notAdvanced}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="hairline rounded-lg p-4">
          <h2 className="mb-2 text-sm font-semibold">Não avançou — por motivo</h2>
          {naoAvancou.byMotivo.length > 0 ? (
            <PieChartCard data={naoAvancou.byMotivo} />
          ) : (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          )}
        </div>
        <div className="hairline rounded-lg p-4">
          <h2 className="mb-2 text-sm font-semibold">Não avançou — por cliente</h2>
          {naoAvancou.byClient.length > 0 ? (
            <BarChartCard data={naoAvancou.byClient} dataKey="value" />
          ) : (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          )}
        </div>
        <div className="hairline rounded-lg p-4">
          <h2 className="mb-2 text-sm font-semibold">Tempo médio por fase (dias)</h2>
          {phases.length > 0 ? (
            <BarChartCard data={phases} dataKey="avgDays" />
          ) : (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          )}
        </div>
        <div className="hairline rounded-lg p-4">
          <h2 className="mb-2 text-sm font-semibold">Fornecedores mais usados e melhor avaliados</h2>
          <div className="flex flex-col gap-2">
            {suppliers.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <span>{s.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{s.usageCount} usos</Badge>
                  {s.ratingAvg != null && (
                    <Badge variant="secondary">★ {s.ratingAvg.toFixed(1)}</Badge>
                  )}
                </div>
              </div>
            ))}
            {suppliers.length === 0 && (
              <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
