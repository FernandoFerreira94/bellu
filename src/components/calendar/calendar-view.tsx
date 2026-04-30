"use client";

import { useState } from "react";
import { addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarHeader, ViewType } from "./calendar-header";
import { DayView } from "./day-view";
import { MonthView } from "./month-view";
import { YearView } from "./year-view";

// Dummy events placeholder
const dummyEvents = [
  { id: 1, title: "Manutenção Acrílico", time: "10:00", client: "Maria Silva", status: "confirmed" },
];

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>("year");
  const [direction, setDirection] = useState(0); // 1 for zoom in, -1 for zoom out

  const handlePrev = () => {
    if (view === "day") setCurrentDate(subDays(currentDate, 1));
    if (view === "month") setCurrentDate(subMonths(currentDate, 1));
    if (view === "year") setCurrentDate(subMonths(currentDate, 12));
  };

  const handleNext = () => {
    if (view === "day") setCurrentDate(addDays(currentDate, 1));
    if (view === "month") setCurrentDate(addMonths(currentDate, 1));
    if (view === "year") setCurrentDate(addMonths(currentDate, 12));
  };

  const handleSelectMonth = (date: Date) => {
    setDirection(1);
    setCurrentDate(date);
    setView("month");
  };

  const handleSelectDay = (date: Date) => {
    setDirection(1);
    setCurrentDate(date);
    setView("day");
  };

  const handleBack = () => {
    setDirection(-1);
    if (view === "day") setView("month");
    else if (view === "month") setView("year");
  };

  const variants = {
    enter: (direction: number) => ({
      scale: direction > 0 ? 0.8 : 1.2,
      opacity: 0,
    }),
    center: {
      scale: 1,
      opacity: 1,
    },
    exit: (direction: number) => ({
      scale: direction > 0 ? 1.5 : 0.5,
      opacity: 0,
    }),
  };

  return (
    <div className="flex flex-col  bg-stone-50/50 p-0 lg:p-8 overflow-hidden">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={setView}
        onPrev={handlePrev}
        onNext={handleNext}
        onBack={view !== "year" ? handleBack : undefined}
      />

      <div className="flex-1 relative rounded-3xl bg-white shadow-sm border border-stone-100 overflow-hidden min-h-[500px]">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={view + currentDate.toISOString()}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              opacity: { duration: 0.2 }
            }}
            className="w-full h-full"
          >
            {view === "year" && (
              <YearView currentDate={currentDate} onSelectMonth={handleSelectMonth} />
            )}
            {view === "month" && (
              <MonthView currentDate={currentDate} events={dummyEvents} onSelectDay={handleSelectDay} />
            )}
            {view === "day" && (
              <DayView currentDate={currentDate} events={dummyEvents} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
