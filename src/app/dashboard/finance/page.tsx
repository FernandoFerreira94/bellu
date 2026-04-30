import { FinanceOverview } from '@/components/finance/finance-overview'

export default function FinancePage() {
  return (
    <section className="space-y-4 px-1">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-stone-400">Finanças</p>
        <h2 className="mt-1 text-2xl font-semibold text-stone-800">Resumo financeiro</h2>
      </div>
      <FinanceOverview />
    </section>
  )
}
