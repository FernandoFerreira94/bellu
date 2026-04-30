import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type ViewType = "year" | "month" | "day";

interface CalendarHeaderProps {
  currentDate: Date;
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  onPrev: () => void;
  onNext: () => void;
  onBack?: () => void;
}

export function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onPrev,
  onNext,
  onBack,
}: CalendarHeaderProps) {
  // Format based on view level
  const title = view === "year" 
    ? format(currentDate, "yyyy")
    : view === "month"
      ? format(currentDate, "MMMM yyyy", { locale: ptBR })
      : format(currentDate, "dd 'de' MMMM", { locale: ptBR });

  const backLabel = view === "day" 
    ? format(currentDate, "MMM", { locale: ptBR }).replace(".", "")
    : view === "month"
      ? format(currentDate, "yyyy")
      : null;

  return (
    <div className="flex flex-col space-y-4 mb-6 px-4 lg:px-0">
      <div className="flex items-center justify-center w-full ">
        {/* Back Button (iOS style) */}
        <div className="w-24">
          {onBack && backLabel ? (
            <button 
              onClick={onBack}
              className=" items-center text-primary font-semibold hover:opacity-70 transition-all group active:scale-95 flex gap-2"
            >
              <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
              <span className="capitalize text-xl ">{backLabel}</span>
            </button>
          ) :
           ( 
            <div className="flex items-center space-x-2 w-full text-primary justify-center">
 <button 
            onClick={onPrev}
            className=" text-primary hover:text-primary transition-colors bg-stone-100 rounded-full active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        {/* Date Title */}
        <h2 className="text-xl font-bold text-primary capitalize text-center">
          {title}
        </h2>
  <button 
            onClick={onNext}
            className=" text-primary hover:text-primary transition-colors bg-stone-100 rounded-full active:scale-90"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        {/* Navigation Arrows */}
         
          
        
        </div>)}
        </div>
       
      </div>
    </div>
  );
}
