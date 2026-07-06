"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  checkIn: Date | undefined;
  checkOut: Date | undefined;
  onCheckInChange: (date: Date | undefined) => void;
  onCheckOutChange: (date: Date | undefined) => void;
  mode: "checkin" | "checkout";
  onModeChange: (mode: "checkin" | "checkout") => void;
  onClose?: () => void;
  dateConstraint?: "future-only" | "past-only";
}

export const DateRangePicker = ({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  mode,
  onModeChange,
  onClose,
  dateConstraint = "future-only",
}: DateRangePickerProps) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const normalizeDate = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  
  const [selectedMonth, setSelectedMonth] = useState<Date>(checkIn || today);
  const [hoveredDate, setHoveredDate] = useState<Date | undefined>();
  const monthListRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);

  const months =
    dateConstraint === "past-only"
      ? Array.from({ length: 24 }, (_, i) => {
          const date = new Date(today);
          date.setDate(1);
          date.setMonth(date.getMonth() - (23 - i));
          return date;
        })
      : Array.from({ length: 13 }, (_, i) => {
          const date = new Date(today);
          date.setDate(1);
          date.setMonth(date.getMonth() + i);
          return date;
        });

  const isDateDisabled = (date: Date) => {
    const dateOnly = normalizeDate(date);
    const todayOnly = normalizeDate(today);
    if (dateConstraint === "past-only") {
      return dateOnly > todayOnly;
    }
    return dateOnly < todayOnly;
  };

  useEffect(() => {
    if (checkIn) {
      setSelectedMonth(checkIn);
    }
  }, [checkIn]);

  useEffect(() => {
    if (dateConstraint !== "past-only" || !calendarRef.current) return;
    const el = calendarRef.current;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [dateConstraint]);

  useEffect(() => {
    const calendarElement = calendarRef.current;
    if (!calendarElement) return;

    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) {
        isProgrammaticScrollRef.current = false;
        return;
      }

      const scrollTop = calendarElement.scrollTop;
      const monthHeight = 300;
      const currentMonthIndex = Math.floor(scrollTop / monthHeight);
      
      if (months[currentMonthIndex]) {
        setSelectedMonth(months[currentMonthIndex]);
      }
    };

    calendarElement.addEventListener("scroll", handleScroll);
    return () => calendarElement.removeEventListener("scroll", handleScroll);
  }, [months]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const dateOnly = normalizeDate(date);
    const checkInOnly = checkIn ? normalizeDate(checkIn) : null;

    setSelectedMonth(dateOnly);

    if (mode === "checkin") {
      if (checkInOnly && dateOnly.getTime() === checkInOnly.getTime()) {
        onCheckInChange(undefined);
        onCheckOutChange(undefined);
        return;
      }
      
      onCheckInChange(dateOnly);
      onCheckOutChange(undefined);
      onModeChange("checkout");
    } else {
      if (!checkInOnly) {
        onCheckInChange(dateOnly);
        onCheckOutChange(undefined);
        return;
      }

      if (dateOnly < checkInOnly) {
        onCheckInChange(dateOnly);
        onCheckOutChange(undefined);
      } else {
        onCheckOutChange(dateOnly);
        if (onClose) {
          setTimeout(() => {
            onClose();
          }, 100);
        }
      }
    }
  };

  const handleMonthClick = (month: Date) => {
    isProgrammaticScrollRef.current = true;
    setSelectedMonth(month);
    
    if (calendarRef.current) {
      const monthIndex = months.findIndex(m => 
        m.getMonth() === month.getMonth() && m.getFullYear() === month.getFullYear()
      );
      if (monthIndex !== -1) {
        const scrollTop = monthIndex * 300;
        calendarRef.current.scrollTo({
          top: scrollTop,
          behavior: 'instant' as ScrollBehavior
        });
      }
    }
  };

  const getSelectedRange = () => {
    if (mode === "checkin") {
      return checkIn ? { from: checkIn, to: checkIn } : undefined;
    } else {
      if (checkIn && checkOut) {
        return { from: checkIn, to: checkOut };
      }
      if (checkIn && hoveredDate) {
        const hovered = normalizeDate(hoveredDate);
        const checkInOnly = normalizeDate(checkIn);
        if (hovered > checkInOnly) {
          return { from: checkIn, to: hovered };
        }
      }
      if (checkIn) {
        return { from: checkIn, to: checkIn };
      }
    }
    return undefined;
  };

  return (
    <div className="flex w-auto">
      <div className="w-48 border-r border-border overflow-y-auto max-h-[80vh] bg-card flex-shrink-0">
        <div className="p-4">
          <div className="space-y-1" ref={monthListRef}>
            {months.map((month, index) => {
              const isSelected = 
                month.getMonth() === selectedMonth.getMonth() &&
                month.getFullYear() === selectedMonth.getFullYear();
              
              return (
                <button
                  key={index}
                  onClick={() => handleMonthClick(month)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors",
                    isSelected && "bg-accent font-medium"
                  )}
                >
                  {format(month, "MMMM yyyy", { locale: ru })}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div 
        ref={calendarRef}
        className="flex-1 overflow-y-auto max-h-[80vh]"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="space-y-8 p-4">
          {months.map((monthStart, monthIndex) => (
            <div key={monthIndex} className="min-h-[300px]">
                <div className="mb-2">
                <div className="text-sm font-semibold text-foreground text-center py-2">
                  {format(monthStart, "MMMM yyyy", { locale: ru })}
                </div>
                {mode === "checkin" ? (
                  <CalendarComponent
                    mode="single"
                    selected={checkIn}
                    onSelect={(selected) => {
                      handleDateSelect(selected);
                    }}
                    month={monthStart}
                    onMonthChange={() => {}}
                    disabled={isDateDisabled}
                    locale={ru}
                    className="rounded-lg bg-background text-foreground"
                    classNames={{
                      nav: "hidden",
                      months: "flex flex-col",
                      month: "space-y-4",
                      caption: "hidden",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "h-9 w-9 text-center text-sm p-0 relative transition-all duration-300 [&:has([aria-selected].day-range-start)]:rounded-l-md [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:bg-gradient-to-br [&:has([aria-selected].day-range-start)]:from-yellow-400 [&:has([aria-selected].day-range-start)]:via-yellow-400 [&:has([aria-selected].day-range-start)]:to-yellow-500 [&:has([aria-selected].day-range-end)]:bg-gradient-to-br [&:has([aria-selected].day-range-end)]:from-yellow-400 [&:has([aria-selected].day-range-end)]:via-yellow-400 [&:has([aria-selected].day-range-end)]:to-yellow-500 [&:has([aria-selected].day-range-middle)]:bg-gradient-to-r [&:has([aria-selected].day-range-middle)]:from-yellow-400/40 [&:has([aria-selected].day-range-middle)]:via-yellow-400/35 [&:has([aria-selected].day-range-middle)]:to-yellow-400/40 [&:has([aria-selected]:not(.day-range-start):not(.day-range-end):not(.day-range-middle))]:bg-gradient-to-br [&:has([aria-selected]:not(.day-range-start):not(.day-range-end):not(.day-range-middle))]:from-yellow-400 [&:has([aria-selected]:not(.day-range-start):not(.day-range-end):not(.day-range-middle))]:via-yellow-400 [&:has([aria-selected]:not(.day-range-start):not(.day-range-end):not(.day-range-middle))]:to-yellow-500 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                      day: "h-full w-full p-0 font-normal aria-selected:opacity-100 hover:bg-yellow-400/15 hover:text-yellow-400 transition-all duration-200 rounded-none",
                      day_selected: "text-black hover:text-black font-semibold transition-all duration-300",
                      day_range_start: "",
                      day_range_end: "",
                    }}
                    components={{
                      IconLeft: () => null,
                      IconRight: () => null,
                    }}
                  />
                ) : (
                  <CalendarComponent
                    mode="range"
                    selected={getSelectedRange()}
                    onSelect={(range) => {
                      if (!range?.from) return;
                      
                      const rangeFrom = normalizeDate(range.from);
                      const checkInOnly = checkIn ? normalizeDate(checkIn) : null;
                      const checkOutOnly = checkOut ? normalizeDate(checkOut) : null;
                      
                      if (checkInOnly && rangeFrom.getTime() === checkInOnly.getTime()) {
                        onCheckInChange(undefined);
                        onCheckOutChange(undefined);
                        onModeChange("checkin");
                        return;
                      }
                      
                      if (checkOutOnly && rangeFrom.getTime() === checkOutOnly.getTime()) {
                        onCheckOutChange(undefined);
                        return;
                      }
                      
                      handleDateSelect(range.from);
                    }}
                    month={monthStart}
                    onMonthChange={() => {}}
                    disabled={isDateDisabled}
                    onDayMouseEnter={(date) => {
                      if (checkIn) {
                        setHoveredDate(date);
                      }
                    }}
                    onDayMouseLeave={() => {
                      setHoveredDate(undefined);
                    }}
                    locale={ru}
                    className="rounded-lg bg-background text-foreground"
                    classNames={{
                      nav: "hidden",
                      months: "flex flex-col",
                      month: "space-y-4",
                      caption: "hidden",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "h-9 w-9 text-center text-sm p-0 relative transition-all duration-300 [&:has([aria-selected].day-range-start)]:rounded-l-md [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:bg-gradient-to-br [&:has([aria-selected].day-range-start)]:from-yellow-400 [&:has([aria-selected].day-range-start)]:via-yellow-400 [&:has([aria-selected].day-range-start)]:to-yellow-500 [&:has([aria-selected].day-range-end)]:bg-gradient-to-br [&:has([aria-selected].day-range-end)]:from-yellow-400 [&:has([aria-selected].day-range-end)]:via-yellow-400 [&:has([aria-selected].day-range-end)]:to-yellow-500 [&:has([aria-selected].day-range-middle)]:bg-gradient-to-r [&:has([aria-selected].day-range-middle)]:from-yellow-400/40 [&:has([aria-selected].day-range-middle)]:via-yellow-400/35 [&:has([aria-selected].day-range-middle)]:to-yellow-400/40 [&:has([aria-selected]:not(.day-range-start):not(.day-range-end):not(.day-range-middle))]:bg-gradient-to-br [&:has([aria-selected]:not(.day-range-start):not(.day-range-end):not(.day-range-middle))]:from-yellow-400 [&:has([aria-selected]:not(.day-range-start):not(.day-range-end):not(.day-range-middle))]:via-yellow-400 [&:has([aria-selected]:not(.day-range-start):not(.day-range-end):not(.day-range-middle))]:to-yellow-500 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                      day: "h-full w-full p-0 font-normal aria-selected:opacity-100 hover:bg-yellow-400/15 hover:text-yellow-400 transition-all duration-200 rounded-none",
                      day_selected: "text-black hover:text-black font-semibold transition-all duration-300",
                      day_range_middle: "text-black transition-all duration-300",
                      day_range_start: "",
                      day_range_end: "",
                    }}
                    components={{
                      IconLeft: () => null,
                      IconRight: () => null,
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

