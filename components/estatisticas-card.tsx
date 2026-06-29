"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface EstatisticasCardProps {
  titulo: string
  valor: string | number
  valorRecebido?: string | number
  valorAReceber?: string | number
  mostrarDuploValor?: boolean
  icone: React.ReactNode
  descricao?: string
  loading?: boolean
  className?: string
  tendencia?: "up" | "down" | "neutral"
  tendenciaValor?: string
  corIcone?: string
}

export function EstatisticasCard({
  titulo,
  valor,
  valorRecebido,
  valorAReceber,
  mostrarDuploValor = false,
  icone,
  descricao,
  loading = false,
  className,
  tendencia,
  tendenciaValor,
  corIcone,
}: EstatisticasCardProps) {
  return (
    <Card className={cn("overflow-hidden transition-all duration-200 hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{titulo}</CardTitle>
        <div className={cn("rounded-full p-2", corIcone || "bg-primary/10 text-primary")}>{icone}</div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-10 w-28" />
        ) : (
          <>
            {mostrarDuploValor ? (
              <div className="space-y-1">
                <motion.div
                  className="text-2xl font-bold"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {valor}
                </motion.div>
                <div className="flex justify-between text-sm">
                  <div className="text-success-600">
                    <span className="font-medium">Recebido:</span> {valorRecebido || "R$ 0,00"}
                  </div>
                  <div className="text-amber-600">
                    <span className="font-medium">A receber:</span> {valorAReceber || "R$ 0,00"}
                  </div>
                </div>
              </div>
            ) : (
              <motion.div
                className="text-2xl font-bold"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {valor}
              </motion.div>
            )}
            <div className="mt-1 flex items-center">
              {tendencia && (
                <div
                  className={cn(
                    "mr-2 flex items-center text-xs",
                    tendencia === "up"
                      ? "text-success-600"
                      : tendencia === "down"
                        ? "text-danger-600"
                        : "text-gray-500",
                  )}
                >
                  {tendencia === "up" && (
                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                  {tendencia === "down" && (
                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                  {tendenciaValor}
                </div>
              )}
              {descricao && <div className="text-xs text-muted-foreground">{descricao}</div>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
