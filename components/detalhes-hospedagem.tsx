"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Hospedagem } from "@/types"
import {
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  User,
  FileText,
  Globe,
  Mail,
  Phone,
  RefreshCw,
  CreditCard,
  Receipt,
  AlertTriangle,
} from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RegistrarPagamentoDialog } from "@/components/registrar-pagamento-dialog"
import { StatusPagamento } from "@/components/status-pagamento"
import { verificarAtraso, verificarPagamentosEmDia } from "@/services/hospedagemService"

interface DetalhesHospedagemProps {
  hospedagem: Hospedagem
  onUpdate?: () => void
}

export function DetalhesHospedagem({ hospedagem, onUpdate }: DetalhesHospedagemProps) {
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "ativo":
        return (
          <Badge className="bg-success-500 hover:bg-success-600">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Ativo
          </Badge>
        )
      case "inativo":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" /> Inativo
          </Badge>
        )
      case "pendente":
        return (
          <Badge variant="outline" className="text-warning-500 border-warning-500 hover:bg-warning-50">
            <Clock className="h-3 w-3 mr-1" /> Pendente
          </Badge>
        )
      default:
        return <Badge variant="outline">Não definido</Badge>
    }
  }

  const getCicloRenovacaoBadge = (ciclo?: string) => {
    switch (ciclo) {
      case "mensal":
        return (
          <Badge variant="outline" className="text-blue-500 border-blue-500 hover:bg-blue-50">
            <RefreshCw className="h-3 w-3 mr-1" /> Mensal
          </Badge>
        )
      case "trimestral":
        return (
          <Badge variant="outline" className="text-purple-500 border-purple-500 hover:bg-purple-50">
            <RefreshCw className="h-3 w-3 mr-1" /> Trimestral
          </Badge>
        )
      case "semestral":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500 hover:bg-amber-50">
            <RefreshCw className="h-3 w-3 mr-1" /> Semestral
          </Badge>
        )
      case "anual":
        return (
          <Badge variant="outline" className="text-green-500 border-green-500 hover:bg-green-50">
            <RefreshCw className="h-3 w-3 mr-1" /> Anual
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <RefreshCw className="h-3 w-3 mr-1" /> {ciclo || "Não definido"}
          </Badge>
        )
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  // Verificar status de pagamento
  const { emAtraso, diasAtraso } = verificarAtraso(hospedagem)
  const { emDia, pagamentosEsperados, pagamentosRealizados } = verificarPagamentosEmDia(hospedagem)

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <Card className="overflow-hidden border-0 shadow-lg">
        <div
          className={cn(
            "h-2 w-full",
            hospedagem.status === "ativo"
              ? "bg-success-500"
              : hospedagem.status === "inativo"
                ? "bg-danger-500"
                : "bg-warning-500",
          )}
        />
        <CardHeader className="bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">{hospedagem.nome}</CardTitle>
              </div>
              <CardDescription>Detalhes da hospedagem</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {getStatusBadge(hospedagem.status)}
              {getCicloRenovacaoBadge(hospedagem.cicloRenovacao)}
              <StatusPagamento hospedagem={hospedagem} />
              {hospedagem.pagamentoAntecipado && (
                <Badge variant="outline" className="text-indigo-500 border-indigo-500 hover:bg-indigo-50">
                  <CreditCard className="h-3 w-3 mr-1" /> Pagamento Antecipado
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div variants={item} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">Data de Criação</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{hospedagem.dataCriacao}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">Data de Vencimento</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{hospedagem.dataVencimento || "Não definido"}</p>
                  {emAtraso && (
                    <div className="mt-2 text-sm text-red-500 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Vencido há {diasAtraso} {diasAtraso === 1 ? "dia" : "dias"}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Valor</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  {hospedagem.valor.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                  {hospedagem.cicloRenovacao && !hospedagem.pagamentoAntecipado && (
                    <span className="text-sm text-muted-foreground ml-2">
                      por{" "}
                      {hospedagem.cicloRenovacao === "mensal"
                        ? "mês"
                        : hospedagem.cicloRenovacao === "trimestral"
                          ? "trimestre"
                          : hospedagem.cicloRenovacao === "semestral"
                            ? "semestre"
                            : "ano"}
                    </span>
                  )}
                </p>
              </div>

              {hospedagem.pagamentoAntecipado && (
                <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg border-l-4 border-indigo-500">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-indigo-500" />
                    <h3 className="font-medium">Pagamento Antecipado</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {hospedagem.periodoAntecipado} {hospedagem.periodoAntecipado === 1 ? "ano" : "anos"}
                  </p>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">Último Pagamento</h3>
                  </div>
                  <RegistrarPagamentoDialog hospedagem={hospedagem} onPagamentoRegistrado={onUpdate || (() => {})}>
                    <Button variant="outline" size="sm">
                      <Receipt className="h-3 w-3 mr-1" />
                      Registrar Pagamento
                    </Button>
                  </RegistrarPagamentoDialog>
                </div>
                <p className="text-gray-600 dark:text-gray-300">{hospedagem.ultimoPagamento || "Não registrado"}</p>

                {!emDia && hospedagem.status === "ativo" && (
                  <div className="mt-2 text-sm text-amber-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Pagamentos esperados: {pagamentosEsperados}, realizados: {pagamentosRealizados}
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div variants={item} className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Cliente</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">{hospedagem.cliente || "Não definido"}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Ciclo de Renovação</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 capitalize">
                  {hospedagem.pagamentoAntecipado ? "Pagamento antecipado" : hospedagem.cicloRenovacao || "Anual"}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Email de Contato</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">{hospedagem.emailContato || "Não definido"}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Telefone de Contato</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">{hospedagem.telefoneContato || "Não definido"}</p>
              </div>
            </motion.div>
          </div>

          {/* Histórico de Pagamentos */}
          <motion.div variants={item} className="mt-6">
            <Card>
              <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Histórico de Pagamentos</CardTitle>
                    <CardDescription>Registro de todos os pagamentos realizados</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPagamento hospedagem={hospedagem} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {hospedagem.pagamentos && hospedagem.pagamentos.length > 0 ? (
                  <div className="space-y-4">
                    {hospedagem.pagamentos.map((pagamento, index) => (
                      <div key={index} className="border-b pb-4 last:border-0">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">
                              {pagamento.valorPago.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </p>
                            <p className="text-sm text-muted-foreground">Data: {pagamento.dataPagamento}</p>
                          </div>
                          <Badge variant="outline" className="text-green-500 border-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Pago
                          </Badge>
                        </div>
                        {pagamento.observacoes && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <p className="font-medium">Observações:</p>
                            <p>{pagamento.observacoes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-4">
                      <Receipt className="h-6 w-6 text-gray-500" />
                    </div>
                    <p className="text-center">Nenhum pagamento registrado ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {hospedagem.observacoes && (
            <motion.div variants={item} className="mt-6">
              <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Observações</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">{hospedagem.observacoes}</p>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
