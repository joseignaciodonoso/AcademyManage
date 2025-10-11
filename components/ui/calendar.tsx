"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()
  const displayMonth: Date = (props as any).month ?? new Date()
  const onMonthChange = (props as any).onMonthChange as ((month: Date) => void) | undefined
  const goPrev = () => onMonthChange && onMonthChange(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))
  const goNext = () => onMonthChange && onMonthChange(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))
  const monthLabel = displayMonth.toLocaleDateString("es-ES", { month: "long", year: "numeric" })

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <Button variant="ghost" size="icon" className="size-12 md:size-14 rounded-full bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50" onClick={goPrev}>
          <ChevronLeftIcon className="size-6" />
        </Button>
        <div className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white capitalize tracking-tight">
          {monthLabel}
        </div>
        <Button variant="ghost" size="icon" className="size-12 md:size-14 rounded-full bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50" onClick={goNext}>
          <ChevronRightIcon className="size-6" />
        </Button>
      </div>
      <DayPicker
      showOutsideDays={showOutsideDays}
      locale={(props as any).locale ?? es}
      className={cn(
        "group/calendar p-6 rounded-xl [--cell-size:4rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        ...formatters,
      }}
      classNames={{
        root: cn("w-full", defaultClassNames.root),
        months: cn(
          "flex gap-6 flex-col md:flex-row relative",
          defaultClassNames.months
        ),
        month: cn(
          "flex flex-col w-full gap-3 rounded-lg border border-gray-700/50 bg-gray-900/30 p-4",
          defaultClassNames.month
        ),
        nav: cn("hidden", defaultClassNames.nav),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 rounded-full bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 rounded-full bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_next
        ),
        month_caption: cn("hidden", defaultClassNames.month_caption),
        dropdowns: cn("hidden", defaultClassNames.dropdowns),
        dropdown_root: cn(
          "relative has-focus:border-ring border border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute bg-popover inset-0 opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-semibold text-white",
          captionLayout === "label"
            ? "text-base tracking-tight"
            : "rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex px-1", defaultClassNames.weekdays),
        weekday: cn(
          "text-gray-400 rounded-md flex-1 text-center font-semibold text-sm md:text-base uppercase tracking-wide select-none",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full mt-1", defaultClassNames.week),
        week_number_header: cn(
          "select-none w-(--cell-size)",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.8rem] select-none text-muted-foreground",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative w-full h-full p-0 text-center group/day aspect-square select-none",
          defaultClassNames.day
        ),
        range_start: cn(
          "rounded-l-md bg-accent",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
        today: cn("rounded-md", defaultClassNames.today),
        outside: cn(
          "text-gray-500/50 aria-selected:text-gray-500/50",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
    </div>
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "relative flex items-center justify-center w-16 h-16 mx-auto rounded-md leading-none font-semibold text-gray-200 hover:text-white transition-colors",
        "hover:bg-gray-800/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
        // Selected states
        "data-[selected-single=true]:bg-gradient-to-br data-[selected-single=true]:from-indigo-600/90 data-[selected-single=true]:to-purple-600/90 data-[selected-single=true]:text-white data-[selected-single=true]:shadow-lg data-[selected-single=true]:shadow-indigo-500/20",
        "data-[range-middle=true]:bg-indigo-600/20 data-[range-middle=true]:text-white",
        "data-[range-start=true]:bg-indigo-600/30 data-[range-start=true]:text-white",
        "data-[range-end=true]:bg-indigo-600/30 data-[range-end=true]:text-white",
        // Today subtle ring
        modifiers.today && "ring-1 ring-indigo-500/30",
        // Check-in window indicator (optional custom modifier)
        modifiers.checkin_window && "ring-2 ring-emerald-500/40",
        // Event dot indicator (applies when modifiers.has_events is true)
        modifiers.has_events &&
          "after:content-[''] after:absolute after:bottom-2 after:left-1/2 after:-translate-x-1/2 after:h-2 after:w-2 after:rounded-full after:bg-gradient-to-r after:from-indigo-500 after:to-purple-500 after:opacity-90",
        // Busy day -> larger dot and greenish gradient
        modifiers.busy_day &&
          "after:h-2.5 after:w-2.5 after:from-emerald-500 after:to-green-500",
        // Cancelled day present -> override to red
        modifiers.cancelled_day &&
          "after:!bg-red-500 after:!from-red-500 after:!to-rose-500",
        // Weekend subtle tint
        modifiers.weekend && "text-muted-foreground",
        "[&>span]:text-base md:[&>span]:text-lg [&>span]:opacity-90",
        defaultClassNames.day,
        className
      )}
      {...(props as any)}
    />
  )
}

export { Calendar, CalendarDayButton }
