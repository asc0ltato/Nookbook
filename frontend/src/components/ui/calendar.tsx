import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-background text-foreground", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative transition-all duration-300 [&:has([aria-selected].day-range-start)]:rounded-l-md [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:bg-gradient-to-br [&:has([aria-selected].day-range-start)]:from-yellow-400 [&:has([aria-selected].day-range-start)]:via-yellow-400 [&:has([aria-selected].day-range-start)]:to-yellow-500 [&:has([aria-selected].day-range-end)]:bg-gradient-to-br [&:has([aria-selected].day-range-end)]:from-yellow-400 [&:has([aria-selected].day-range-end)]:via-yellow-400 [&:has([aria-selected].day-range-end)]:to-yellow-500 [&:has([aria-selected].day-range-middle)]:bg-gradient-to-r [&:has([aria-selected].day-range-middle)]:from-yellow-400/40 [&:has([aria-selected].day-range-middle)]:via-yellow-400/35 [&:has([aria-selected].day-range-middle)]:to-yellow-400/40 [&:has([aria-selected]:not(.day-range-start):not(.day-range-end):not(.day-range-middle))]:bg-gradient-to-br [&:has([aria-selected]:not(.day-range-start):not(.day-range-end):not(.day-range-middle))]:from-yellow-400 [&:has([aria-selected]:not(.day-range-start):not(.day-range-end):not(.day-range-middle))]:via-yellow-400 [&:has([aria-selected]:not(.day-range-start):not(.day-range-end):not(.day-range-middle))]:to-yellow-500 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(buttonVariants({ variant: "ghost" }), "h-full w-full p-0 font-normal aria-selected:opacity-100 hover:bg-yellow-400/15 hover:text-yellow-400 transition-all duration-200 rounded-none"),
        day_range_end: "day-range-end",
        day_range_start: "day-range-start",
        day_selected:
          "text-black hover:text-black focus:text-black font-semibold transition-all duration-300",
        day_today: "",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:text-black aria-selected:opacity-100",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "day-range-middle text-black transition-all duration-300",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
