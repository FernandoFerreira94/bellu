import { create } from "zustand";

type DashboardUIStore = {
  activeCalendarView: "day" | "week" | "month" | "agenda";
  isMobileMenuOpen: boolean;
  setActiveCalendarView: (
    view: DashboardUIStore["activeCalendarView"],
  ) => void;
  setMobileMenuOpen: (isOpen: boolean) => void;
};

export const useDashboardUIStore = create<DashboardUIStore>((set) => ({
  activeCalendarView: "week",
  isMobileMenuOpen: false,
  setActiveCalendarView: (activeCalendarView) => set({ activeCalendarView }),
  setMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),
}));
