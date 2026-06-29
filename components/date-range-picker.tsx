"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"

interface DateRange {
  from: Date
  to: Date
}

interface DatePickerWithRangeProps {
  className?: string
  onChange?: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({ className, onChange }: DatePickerWithRangeProps) {
  const [fromDate, setFromDate] = React.useState<string>("")
  const [toDate, setToDate] = React.useState<string>("")
  const [isOpen, setIsOpen] = React.useState(false)

  const handleApply = () => {
    if (fromDate && toDate) {
      const from = new Date(fromDate)
      const to = new Date(toDate)
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        onChange?.({ from, to })
        setIsOpen(false)
      }
    }
  }

  const handleClear = () => {
    setFromDate("")
    setToDate("")
    onChange?.(undefined)
    setIsOpen(false)
  }

  const getDisplayText = () => {
    if (fromDate && toDate) {
      try {
        const from = new Date(fromDate)
        const to = new Date(toDate)
        if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
          return `${format(from, "dd/MM/yyyy", { locale: ptBR })} - ${format(to, "dd/MM/yyyy", { locale: ptBR })}`
        }
      } catch {
        return "Selecione um período"
      }
    }
    return "Selecione um período"
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !fromDate && !toDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {getDisplayText()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="from-date">Data Inicial</Label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="to-date">Data Final</Label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={handleClear}>
                <X className="mr-1 h-3 w-3" />
                Limpar
              </Button>
              <Button size="sm" onClick={handleApply} disabled={!fromDate || !toDate}>
                Aplicar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
