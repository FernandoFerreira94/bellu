import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthViewProps {
  currentDate: Date;
  events: any[];
  onSelectDay: (date: Date) => void;
}

export function MonthView({ currentDate, events, onSelectDay }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <div className="flex flex-col bg-white relative animate-in fade-in zoom-in-95 duration-500 ">
      <div className="grid grid-cols-7 border-b border-stone-100 pb-2 bg-primary pt-2 ">
        {weekDays.map((day, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-secondary uppercase">
            {day}
          </div>
        ))}
      </div>
      
      <div className="flex-1 grid grid-cols-7 divide-x divide-y divide-stone-50 border-stone-50 ">
        {days.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isDayToday = isToday(day);
          
          return (
            <button
              key={i} 
              onClick={() => onSelectDay(day)}
              className={`p-1 flex flex-col min-h-[4rem] lg:min-h-[6rem] transition-all hover:bg-primary/5 active:scale-95 text-left ${
                !isCurrentMonth ? 'bg-stone-50/30 opacity-40' : ''
              }`}
            >
              <div className="flex justify-center mb-1">
                <span className={`text-xs w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                  isDayToday 
                    ? 'bg-primary text-secondary font-bold shadow-sm' 
                    : isCurrentMonth 
                      ? 'text-stone-700' 
                      : 'text-stone-400'
                }`}>
                  {format(day, "d")}
                </span>
              </div>
              
              <div className="flex-1 flex flex-col gap-1 overflow-hidden px-1">
                {/* Mock Events rendering */}
                {i % 8 === 0 && isCurrentMonth && (
                  <div className="bg-primary/10 border-l-2 border-primary text-primary text-[9px] font-bold px-1 py-0.5 rounded-sm truncate">
                    Agendado
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
