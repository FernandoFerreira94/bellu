'use client'

import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, DollarSign, ChevronLeft, ChevronRight, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useTransactions } from '@/hooks/useFinance'
import { ExpenseSheet } from './expense-sheet'

const FULL_MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

type Period = 'day' | 'month' | 'year'

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function FinanceOverview() {
  const today = new Date()
  const [period, setPeriod] = useState<Period>('month')
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [day, setDay] = useState(today.getDate())
  const [expenseOpen, setExpenseOpen] = useState(false)

  const { from, to } = useMemo(() => {
    if (period === 'day') {
      return { from: new Date(year, month, day, 0, 0, 0), to: new Date(year, month, day, 23, 59, 59) }
    }
    if (period === 'month') {
      return { from: new Date(year, month, 1), to: new Date(year, month + 1, 0, 23, 59, 59) }
    }
    return { from: new Date(year, 0, 1), to: new Date(year, 11, 31, 23, 59, 59) }
  }, [period, year, month, day])

  const { data: transactions, isLoading, refetch } = useTransactions(from, to)

  const receita = useMemo(() =>
    (transactions ?? []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
    [transactions]
  )
  const despesas = useMemo(() =>
    (transactions ?? []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
    [transactions]
  )
  const lucro = receita - despesas

  function prevPeriod() {
    if (period === 'day') {
      const d = new Date(year, month, day - 1)
      setYear(d.getFullYear()); setMonth(d.getMonth()); setDay(d.getDate())
    } else if (period === 'month') {
      if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1)
    } else {
      setYear(y => y - 1)
    }
  }

  function nextPeriod() {
    if (period === 'day') {
      const d = new Date(year, month, day + 1)
      setYear(d.getFullYear()); setMonth(d.getMonth()); setDay(d.getDate())
    } else if (period === 'month') {
      if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1)
    } else {
      setYear(y => y + 1)
    }
  }

  function periodLabel() {
    if (period === 'day') return `${String(day).padStart(2, '0')} de ${FULL_MONTHS[month]} de ${year}`
    if (period === 'month') return `${FULL_MONTHS[month]} ${year}`
    return `${year}`
  }

  const isToday = period === 'day' && year === today.getFullYear() && month === today.getMonth() && day === today.getDate()
  const isCurrentMonth = period === 'month' && year === today.getFullYear() && month === today.getMonth()
  const isCurrentYear = period === 'year' && year === today.getFullYear()
  const isPresent = isToday || isCurrentMonth || isCurrentYear

  return (
    <div className="space-y-4">

      {/* Filtro de período */}
      <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
        <div className="flex bg-stone-100 rounded-xl p-0.5 gap-0.5">
          {(['day', 'month', 'year'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 text-xs font-medium py-1.5 rounded-[10px] transition-all ${
                period === p ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {p === 'day' ? 'Dia' : p === 'month' ? 'Mês' : 'Ano'}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button onClick={prevPeriod} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors">
            <ChevronLeft className="w-4 h-4 text-stone-400" />
          </button>
          <span className="text-sm font-medium text-stone-700">{periodLabel()}</span>
          <button
            onClick={nextPeriod}
            disabled={isPresent}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl border border-stone-100 p-3 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Receita</p>
            {isLoading
              ? <Skeleton className="h-5 w-16 mt-0.5 rounded-lg" />
              : <p className="text-base font-semibold text-stone-800 mt-0.5">{formatBRL(receita)}</p>
            }
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 p-3 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Despesas</p>
            {isLoading
              ? <Skeleton className="h-5 w-16 mt-0.5 rounded-lg" />
              : <p className="text-base font-semibold text-stone-800 mt-0.5">{formatBRL(despesas)}</p>
            }
          </div>
        </div>

        <div className={`rounded-2xl border p-3 space-y-2 ${lucro >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${lucro >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}>
            <DollarSign className={`w-4 h-4 ${lucro >= 0 ? 'text-emerald-600' : 'text-rose-500'}`} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Lucro</p>
            {isLoading
              ? <Skeleton className="h-5 w-16 mt-0.5 rounded-lg" />
              : <p className={`text-base font-semibold mt-0.5 ${lucro >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{formatBRL(lucro)}</p>
            }
          </div>
        </div>
      </div>

      {/* Lista de movimentações */}
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-50 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-widest text-stone-400">Movimentações</p>
          <button
            onClick={() => setExpenseOpen(true)}
            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-500 transition-colors font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Despesa
          </button>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5 text-stone-400" />
            </div>
            <p className="text-sm text-stone-500">Nenhuma movimentação</p>
            <p className="text-xs text-stone-400 mt-1">para {periodLabel()}</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  t.type === 'income' ? 'bg-emerald-50' : 'bg-rose-50'
                }`}>
                  {t.type === 'income'
                    ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    : <ArrowDownRight className="w-4 h-4 text-rose-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-800 truncate">{t.description ?? (t.type === 'income' ? 'Receita' : 'Despesa')}</p>
                  <p className="text-xs text-stone-400">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                </div>
                <p className={`text-sm font-semibold shrink-0 ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatBRL(Number(t.amount))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <ExpenseSheet open={expenseOpen} onOpenChange={setExpenseOpen} onSuccess={() => refetch()} />
    </div>
  )
}
