import { format, startOfDay, addHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DayViewProps {
  currentDate: Date;
  events: any[];
}

export function DayView({ currentDate, events }: DayViewProps) {
  const start = startOfDay(currentDate);
  const hours = Array.from({ length: 24 }).map((_, i) => addHours(start, i));

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex border-b border-stone-100 pb-2">
    
        <div className="flex-1 flex flex-col items-center bg-primary">
          <span className="text-xs font-medium text-secondary uppercase mt-2">
            {format(currentDate, "EEE", { locale: ptBR })}
          </span>
          <span className="text-2xl font-semibold text-secondary flex items-center justify-center">
            {format(currentDate, "d")}
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto relative">
        <div className="flex">
          {/* Time column */}
          <div className="w-16 flex-shrink-0 flex flex-col">
            {hours.map((hour, i) => (
              <div key={i} className="h-20 border-r border-stone-100 relative">
                <span className="absolute -top-3 right-2 text-xs text-stone-400">
                  {format(hour, "HH:mm")}
                </span>
              </div>
            ))}
          </div>
          
          {/* Grid lines */}
          <div className="flex-1 relative">
            {hours.map((_, i) => (
              <div key={i} className="h-20 border-b border-stone-50" />
            ))}
            
            {/* Events (mock rendering) */}
            {events.map((event, i) => (
              <div 
                key={i}
                className="absolute left-2 right-4 bg-primary/20 border-l-4 border-primary rounded-md p-2 hover:bg-primary/30 transition-colors cursor-pointer"
                style={{ top: '10rem', height: '4rem' }} // Mock positions
              >
                <div className="text-sm font-semibold text-stone-800">{event.title}</div>
                <div className="text-xs text-stone-600">{event.time} - {event.client}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
