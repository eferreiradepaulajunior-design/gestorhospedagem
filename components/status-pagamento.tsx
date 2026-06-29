"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { verificarAtraso, verificarPagamentosEmDia } from "@/services/hospedagemService"
import type { Hospedagem } from "@/types"
import { AlertTriangle, CheckCircle, Clock, HelpCircle } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface StatusPagamentoProps {
  hospedagem: Hospedagem
  showTooltip?: boolean
}

export function StatusPagamento({ hospedagem, showTooltip = true }: StatusPagamentoProps) {
  const { emAtraso, diasAtraso } = verificarAtraso(hospedagem)
  const { emDia, pagamentosEsperados, pagamentosRealizados, ultimoPagamentoEsperado } =
    verificarPagamentosEmDia(hospedagem)

  // Se a hospedagem estiver inativa, não mostramos status de pagamento
  if (hospedagem.status === "inativo") {
    return (
      <Badge variant="outline" className="text-gray-500 border-gray-500">
        <HelpCircle className="h-3 w-3 mr-1" /> Inativo
      </Badge>
    )
  }

  // Se for pagamento antecipado e tiver pelo menos um pagamento, está em dia
  if (hospedagem.pagamentoAntecipado && hospedagem.pagamentos && hospedagem.pagamentos.length > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-success-500 hover:bg-success-600">
              <CheckCircle className="h-3 w-3 mr-1" /> Pago Antecipado
            </Badge>
          </TooltipTrigger>
          {showTooltip && (
            <TooltipContent>
              <p>
                Pagamento antecipado por {hospedagem.periodoAntecipado}{" "}
                {hospedagem.periodoAntecipado === 1 ? "ano" : "anos"}
              </p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Se estiver em atraso
  if (emAtraso) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" /> Em Atraso
            </Badge>
          </TooltipTrigger>
          {showTooltip && (
            <TooltipContent>
              <p>
                Vencido há {diasAtraso} {diasAtraso === 1 ? "dia" : "dias"}
              </p>
              <p>Data de vencimento: {hospedagem.dataVencimento}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Se os pagamentos não estiverem em dia de acordo com o ciclo
  if (!emDia) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-amber-500 border-amber-500 hover:bg-amber-50">
              <Clock className="h-3 w-3 mr-1" /> Pagamento Pendente
            </Badge>
          </TooltipTrigger>
          {showTooltip && (
            <TooltipContent>
              <p>Pagamentos esperados: {pagamentosEsperados}</p>
              <p>Pagamentos realizados: {pagamentosRealizados}</p>
              <p>Último pagamento esperado: {format(ultimoPagamentoEsperado, "dd/MM/yyyy", { locale: ptBR })}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Se estiver tudo em dia
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className="bg-success-500 hover:bg-success-600">
            <CheckCircle className="h-3 w-3 mr-1" /> Em Dia
          </Badge>
        </TooltipTrigger>
        {showTooltip && (
          <TooltipContent>
            <p>Todos os pagamentos estão em dia</p>
            <p>Próximo vencimento: {hospedagem.dataVencimento}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}
