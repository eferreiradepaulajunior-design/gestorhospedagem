"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { obterHospedagens, verificarVencimentos, verificarAtraso } from "@/services/hospedagemService"
import { useAuth } from "@/providers/auth-provider"
import type { Hospedagem } from "@/types"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight } from "lucide-react"
import { EstatisticasCard } from "@/components/estatisticas-card"
import { Globe, DollarSign, CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import { StatusPagamento } from "@/components/status-pagamento"

export default function Dashboard() {
  const [hospedagens, setHospedagens] = useState<Hospedagem[]>([])
  const [vencimentos, setVencimentos] = useState<Hospedagem[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const carregarDados = async () => {
      if (!user) return;
      try {
        const dados = await obterHospedagens(user!.uid)
        setHospedagens(dados)

        const proximosVencimentos = await verificarVencimentos(user!.uid)
        setVencimentos(proximosVencimentos)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setLoading(false)
      }
    }

    carregarDados()

    // Adicionar um event listener para recarregar os dados quando a página receber foco
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        carregarDados()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [user])

  // Calcular estatísticas
  const totalHospedagens = hospedagens.length
  const totalAtivas = hospedagens.filter((h) => h.status === "ativo").length
  const totalInativas = hospedagens.filter((h) => h.status === "inativo").length
  const totalPendentes = hospedagens.filter((h) => h.status === "pendente").length

  const valorTotal = hospedagens.reduce((acc, curr) => acc + curr.valor, 0)
  const valorMensal = valorTotal / 12

  // Dados para o gráfico de barras (valores por mês)
  const dadosPorMes = Array(12)
    .fill(0)
    .map((_, i) => ({
      mes: new Date(2024, i, 1).toLocaleString("pt-BR", { month: "short" }),
      previsto: 0,
      recebido: 0,
    }))

  // Calcular faturamento previsto com base no ciclo de renovação (projeção recorrente)
  hospedagens.forEach((h) => {
    // Considerar apenas hospedagens ativas
    if (h.status === "ativo" && h.dataVencimento) {
      try {
        // Converter a data de vencimento para objeto Date
        const partes = h.dataVencimento.split("/")
        if (partes.length === 3) {
          const dataVencimento = new Date(
            Number.parseInt(partes[2]), // ano
            Number.parseInt(partes[1]) - 1, // mês (0-11)
            Number.parseInt(partes[0]), // dia
          )

          // Verificar se a data é válida
          if (!isNaN(dataVencimento.getTime())) {
            const mesVencimento = dataVencimento.getMonth()
            const ciclo = h.cicloRenovacao || "anual"

            if (ciclo === "mensal") {
              // Previsto para todos os 12 meses do ano
              for (let m = 0; m < 12; m++) {
                dadosPorMes[m].previsto += h.valor
              }
            } else if (ciclo === "trimestral") {
              // Projeta a cada 3 meses
              for (let m = 0; m < 12; m++) {
                if (Math.abs(m - mesVencimento) % 3 === 0) {
                  dadosPorMes[m].previsto += h.valor
                }
              }
            } else if (ciclo === "semestral") {
              // Projeta a cada 6 meses
              for (let m = 0; m < 12; m++) {
                if (Math.abs(m - mesVencimento) % 6 === 0) {
                  dadosPorMes[m].previsto += h.valor
                }
              }
            } else {
              // Anual ou padrão: apenas no mês do vencimento (se for o ano atual)
              if (dataVencimento.getFullYear() === new Date().getFullYear()) {
                dadosPorMes[mesVencimento].previsto += h.valor
              }
            }
          }
        }
      } catch (error) {
        console.error("Erro ao processar data de vencimento:", error)
      }
    }
  })

  // Calcular valores já recebidos no ano atual
  const anoAtual = new Date().getFullYear()
  hospedagens.forEach((h) => {
    if (h.pagamentos && h.pagamentos.length > 0) {
      h.pagamentos.forEach((pagamento) => {
        if (pagamento.dataPagamento) {
          try {
            // Converter a data do pagamento para objeto Date
            const partes = pagamento.dataPagamento.split("/")
            if (partes.length === 3) {
              const dataPagamento = new Date(
                Number.parseInt(partes[2]), // ano
                Number.parseInt(partes[1]) - 1, // mês (0-11)
                Number.parseInt(partes[0]), // dia
              )

              // Verificar se a data é válida e se é do ano atual
              if (!isNaN(dataPagamento.getTime()) && dataPagamento.getFullYear() === anoAtual) {
                const mes = dataPagamento.getMonth()
                dadosPorMes[mes].recebido += pagamento.valorPago
              }
            }
          } catch (error) {
            console.error("Erro ao processar data de pagamento:", error)
          }
        }
      })
    }
  })

  // Se não houver valores previstos, usar o valor da hospedagem como fallback
  if (dadosPorMes.every((item) => item.previsto === 0)) {
    hospedagens.forEach((h) => {
      if (h.status === "ativo") {
        const hoje = new Date()
        const mes = hoje.getMonth()
        dadosPorMes[mes].previsto += h.valor
      }
    })
  }

  // Dados para o gráfico de pizza (status)
  const dadosStatus = [
    { name: "Ativas", value: totalAtivas },
    { name: "Inativas", value: totalInativas },
    { name: "Pendentes", value: totalPendentes },
  ]

  const COLORS = ["#10b981", "#ef4444", "#f59e0b"]

  // Dados para o gráfico de faturamento do ano passado
  const dadosFaturamentoAnoPassado = Array(12)
    .fill(0)
    .map((_, i) => ({
      mes: new Date(2023, i, 1).toLocaleString("pt-BR", { month: "short" }),
      valor: 0,
    }))

  // Calcular faturamento real do ano passado com base nos pagamentos registrados
  const anoPassado = new Date().getFullYear() - 1 // 2023
  hospedagens.forEach((h) => {
    if (h.pagamentos && h.pagamentos.length > 0) {
      h.pagamentos.forEach((pagamento) => {
        if (pagamento.dataPagamento) {
          try {
            // Converter a data do pagamento para objeto Date
            const partes = pagamento.dataPagamento.split("/")
            if (partes.length === 3) {
              const dataPagamento = new Date(
                Number.parseInt(partes[2]), // ano
                Number.parseInt(partes[1]) - 1, // mês (0-11)
                Number.parseInt(partes[0]), // dia
              )

              // Verificar se a data é válida e se é do ano passado
              if (!isNaN(dataPagamento.getTime()) && dataPagamento.getFullYear() === anoPassado) {
                const mes = dataPagamento.getMonth()
                dadosFaturamentoAnoPassado[mes].valor += pagamento.valorPago
              }
            }
          } catch (error) {
            console.error("Erro ao processar data de pagamento:", error)
          }
        }
      })
    }
  })

  // Cores para o gráfico de status de pagamento
  const STATUS_COLORS = ["#10b981", "#ef4444", "#f59e0b"]

  // Calcular dados para o gráfico de status de pagamento
  const calcularDadosStatusPagamento = () => {
    // Simulação de dados - em um caso real, isso seria calculado com base nas hospedagens
    const emDia = hospedagens.filter((h) => !verificarAtraso(h).emAtraso && h.status === "ativo").length
    const emAtraso = hospedagens.filter((h) => verificarAtraso(h).emAtraso && h.status === "ativo").length
    const proximosVencer = vencimentos.length

    return [
      { name: "Em dia", value: emDia },
      { name: "Em atraso", value: emAtraso },
      { name: "Próximos a vencer", value: proximosVencer },
    ]
  }

  // Obter dados do status de pagamento
  const dadosStatusPagamento = calcularDadosStatusPagamento()

  // Calcular totais recebidos e previstos para o ano atual
  const totalRecebido = dadosPorMes.reduce((acc, item) => acc + item.recebido, 0)
  const totalPrevisto = dadosPorMes.reduce((acc, item) => acc + item.previsto, 0)
  const totalAReceber = totalPrevisto - totalRecebido

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

  return (
    <motion.div className="space-y-8" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="page-header">
        <h1>Dashboard</h1>
        <p>Visão geral do sistema de controle de hospedagens</p>
      </motion.div>

      <motion.div variants={item} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <EstatisticasCard
          titulo="Total de Hospedagens"
          valor={totalHospedagens}
          icone={<Globe className="h-4 w-4" />}
          loading={loading}
          corIcone="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />

        <EstatisticasCard
          titulo="Valor Total Anual"
          valor={valorTotal.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
          icone={<DollarSign className="h-4 w-4" />}
          loading={loading}
          descricao={
            <>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-green-600">
                  Recebido: {totalRecebido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
                <span className="text-blue-600">
                  A receber: {totalAReceber.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              <div className="text-xs mt-1">
                {`${valorMensal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} por mês`}
              </div>
            </>
          }
          corIcone="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          tendencia="up"
          tendenciaValor="8.2% vs. mês anterior"
        />

        <EstatisticasCard
          titulo="Hospedagens Ativas"
          valor={totalAtivas}
          icone={<CheckCircle2 className="h-4 w-4" />}
          loading={loading}
          corIcone="bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400"
        />

        <EstatisticasCard
          titulo="Próximos Vencimentos"
          valor={vencimentos.length}
          icone={<Clock className="h-4 w-4" />}
          loading={loading}
          descricao="Nos próximos 30 dias"
          corIcone="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
      </motion.div>

      <motion.div variants={item} className="grid gap-6 md:grid-cols-2">
        <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b">
            <CardTitle>Faturamento Mensal {new Date().getFullYear()}</CardTitle>
            <CardDescription>Valores recebidos e previstos para cada mês</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="h-80 flex items-center justify-center">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <ChartContainer
                config={{
                  previsto: {
                    label: "Previsto (R$)",
                    color: "hsl(var(--primary))",
                  },
                  recebido: {
                    label: "Recebido (R$)",
                    color: "#10b981",
                  },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosPorMes} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(0, 0, 0, 0.05)" }} />
                    <Legend />
                    <Bar
                      dataKey="previsto"
                      name="Previsto"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                    <Bar dataKey="recebido" name="Recebido" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b">
            <CardTitle>Status das Hospedagens</CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="h-80 flex items-center justify-center">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {dadosStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} hospedagens`, "Quantidade"]} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value, entry, index) => (
                        <span style={{ color: COLORS[index % COLORS.length] }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} className="grid gap-6 md:grid-cols-2">
        <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b">
            <CardTitle>Faturamento Ano Passado</CardTitle>
            <CardDescription>Pagamentos recebidos em cada mês de {new Date().getFullYear() - 1}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="h-80 flex items-center justify-center">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <ChartContainer
                config={{
                  valor: {
                    label: "Valor (R$)",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosFaturamentoAnoPassado} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(0, 0, 0, 0.05)" }} />
                    <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b">
            <CardTitle>Status de Pagamento</CardTitle>
            <CardDescription>Distribuição de clientes por status de pagamento</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="h-80 flex items-center justify-center">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosStatusPagamento}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {dadosStatusPagamento.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} hospedagens`, "Quantidade"]} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value, entry, index) => (
                        <span style={{ color: STATUS_COLORS[index % STATUS_COLORS.length] }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle>Próximos Vencimentos</CardTitle>
              <CardDescription>Hospedagens que vencem nos próximos 30 dias</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/vencimentos">
                Ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            ) : vencimentos && vencimentos.length > 0 ? (
              <div className="space-y-6">
                {vencimentos.map((hospedagem) => (
                  <div key={hospedagem.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {/* Exibir apenas o domínio, sem informações adicionais */}
                        {hospedagem.nome.split(" ")[0]}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span>
                            Vence em:{" "}
                            {hospedagem.dataVencimento && typeof hospedagem.dataVencimento === "string"
                              ? hospedagem.dataVencimento
                              : "Data não definida"}
                          </span>
                          {/* Adicionar status de pagamento */}
                          {hospedagem.status === "ativo" && (
                            <StatusPagamento hospedagem={hospedagem} showTooltip={false} />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="font-medium text-primary">
                      {hospedagem.valor.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-4">
                  <CheckCircle2 className="h-6 w-6 text-success-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Tudo em dia!</h3>
                <p className="text-center max-w-sm">
                  Não há vencimentos próximos. Todos os seus serviços estão em dia.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
