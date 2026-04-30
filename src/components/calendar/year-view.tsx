"use client";

import { format, startOfYear, addMonths, isSameMonth, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface YearViewProps {
  currentDate: Date;
  onSelectMonth: (date: Date) => void;
}

export function YearView({ currentDate, onSelectMonth }: YearViewProps) {
  const yearStart = startOfYear(currentDate);
  const months = Array.from({ length: 12 }).map((_, i) => addMonths(yearStart, i));
  const today = new Date();

  return (
    <div className="h-full w-full bg-white overflow-y-auto p-4 lg:p-10">
      {months.length === 0 && (
        <div className="flex items-center justify-center h-full text-red-500 font-bold">
          ERRO: Nenhum mês encontrado. Verifique a data.
        </div>
      )}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-x-2 gap-y-4 max-w-6xl mx-auto">
        {months.map((month, i) => {
          const isCurrentMonth = isSameMonth(month, today);
          
          return (
            <button
              key={i}
              onClick={() => onSelectMonth(month)}
              className={cn(
                "group flex flex-col items-center p-4 rounded-3xl transition-all hover:bg-stone-50 active:scale-95 text-center border border-transparent",
                isCurrentMonth && "border-primary/20 bg-primary/[0.03]"
              )}
            >
              <span className={cn(
                "text-lg font-black uppercase tracking-tighter mb-4 transition-colors",
                isCurrentMonth ? "text-primary" : "text-stone-300 group-hover:text-primary/70"
              )}>
                {format(month, "MMMM", { locale: ptBR })}
              </span>
              
              {/* Simplified Month visualization */}
              <div className="grid grid-cols-7 gap-1.5 w-full max-w-[120px]">
                {Array.from({ length: 28 }).map((_, dIdx) => (
                  <div 
                    key={dIdx} 
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isCurrentMonth && dIdx === today.getDate() % 28 ? "bg-primary scale-125" : "bg-stone-200"
                    )}
                  />
                ))}
              </div>

          
            </button>
          );
        })}
      </div>
    </div>
  );
}
