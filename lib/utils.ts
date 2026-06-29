import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatDate(date: string | Date): string {
  if (!date) return ""

  const dateObj = typeof date === "string" ? new Date(date.split("/").reverse().join("-")) : date

  return new Intl.DateTimeFormat("pt-BR").format(dateObj)
}

export function getInitials(name: string): string {
  if (!name) return ""

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text

  return `${text.substring(0, maxLength)}...`
}
