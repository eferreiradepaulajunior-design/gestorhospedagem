"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar, Download, Search, ArrowUpDown, Eye, DollarSign, BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EstatisticasCard } from "@/components/estatisticas-card"
import { PageTransition } from "@/components/page-transition"
import { obterTodasHospedagens } from "@/services/hospedagemService"
import { obterClientes } from "@/services/clienteService"
import { useAuth } from "@/providers/auth-provider"
import { formatCurrency } from "@/lib/utils"
import { exportarCSV } from "@/utils/exportarCsv"
import type { Cliente, Pagamento } from "@/types"
import { toast } from "sonner"

interface Transacao extends Pagamento {
  hospedagemNome: string
  hospedagemId: string
  clienteNome: string
  clienteId: string
}

export default function TransacoesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [filteredTransacoes, setFilteredTransacoes] = useState<Transacao[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [periodoFiltro, setPeriodoFiltro] = useState<{ from: Date; to: Date } | undefined>(undefined)
  const [clienteFiltro, setClienteFiltro] = useState<string>("todos")
  const [ordenacao, setOrdenacao] = useState<{ campo: keyof Transacao; direcao: "asc" | "desc" }>({
    campo: "dataPagamento",
    direcao: "desc",
  })
  const [clientes, setClientes] = useState<Cliente[]>([])
  const { user } = useAuth()
  const [estatisticas, setEstatisticas] = useState({
    totalRecebido: 0,
    mediaTransacao: 0,
    maiorTransacao: 0,
    transacoesMes: 0,
    valorMes: 0,
  })

  useEffect(() => {
    carregarDados()
  }, [user])

  useEffect(() => {
    aplicarFiltros()
  }, [transacoes, searchTerm, periodoFiltro, clienteFiltro, ordenacao])

  const carregarDados = async () => {
    if (!user) return;
    try {
      setLoading(true)

      // Carregar hospedagens e clientes
      const hospedagens = await obterTodasHospedagens(user!.uid)
      const clientesData = await obterClientes(user!.uid)
      setClientes(clientesData)

      // Extrair todas as transações das hospedagens
      const todasTransacoes: Transacao[] = []

      hospedagens.forEach((hospedagem) => {
        if (hospedagem.pagamentos && hospedagem.pagamentos.length > 0) {
          const cliente = clientesData.find((c) => c.id === hospedagem.cliente) || {
            id: "",
            nome: "Cliente não encontrado",
          }

          hospedagem.pagamentos.forEach((pagamento, index) => {
            todasTransacoes.push({
              ...pagamento,
              id: pagamento.id || `${hospedagem.id}-${pagamento.dataPagamento}-${pagamento.valorPago}-${index}`,
              hospedagemNome: hospedagem.nome,
              hospedagemId: hospedagem.id || "",
              clienteNome: cliente.nome,
              clienteId: cliente.id || "",
            })
          })
        }
      })

      // Ordenar por data de pagamento (mais recente primeiro)
      const transacoesOrdenadas = todasTransacoes.sort((a, b) => {
        const dateA = new Date(a.dataPagamento.split("/").reverse().join("-"))
        const dateB = new Date(b.dataPagamento.split("/").reverse().join("-"))
        return dateB.getTime() - dateA.getTime()
      })

      setTransacoes(transacoesOrdenadas)
      calcularEstatisticas(transacoesOrdenadas)
    } catch (error) {
      console.error("Erro ao carregar transações:", error)
      toast.error("Erro ao carregar transações")
    } finally {
      setLoading(false)
    }
  }

  const calcularEstatisticas = (transacoes: Transacao[]) => {
    // Total recebido
    const totalRecebido = transacoes.reduce((total, t) => total + t.valorPago, 0)

    // Média por transação
    const mediaTransacao = transacoes.length > 0 ? totalRecebido / transacoes.length : 0

    // Maior transação
    const maiorTransacao = transacoes.length > 0 ? Math.max(...transacoes.map((t) => t.valorPago)) : 0

    // Transações do mês atual
    const hoje = new Date()
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)

    const transacoesMes = transacoes.filter((t) => {
      const dataPagamento = new Date(t.dataPagamento.split("/").reverse().join("-"))
      return dataPagamento >= inicioMes && dataPagamento <= fimMes
    })

    const valorMes = transacoesMes.reduce((total, t) => total + t.valorPago, 0)

    setEstatisticas({
      totalRecebido,
      mediaTransacao,
      maiorTransacao,
      transacoesMes: transacoesMes.length,
      valorMes,
    })
  }

  const aplicarFiltros = () => {
    let resultado = [...transacoes]

    // Filtro de busca
    if (searchTerm) {
      const termoBusca = searchTerm.toLowerCase()
      resultado = resultado.filter(
        (t) =>
          t.hospedagemNome.toLowerCase().includes(termoBusca) ||
          t.clienteNome.toLowerCase().includes(termoBusca) ||
          t.observacoes?.toLowerCase().includes(termoBusca),
      )
    }

    // Filtro de período
    if (periodoFiltro && periodoFiltro.from && periodoFiltro.to) {
      resultado = resultado.filter((t) => {
        const dataPagamento = new Date(t.dataPagamento.split("/").reverse().join("-"))
        return dataPagamento >= periodoFiltro.from && dataPagamento <= periodoFiltro.to
      })
    }

    // Filtro de cliente
    if (clienteFiltro !== "todos") {
      resultado = resultado.filter((t) => t.clienteId === clienteFiltro)
    }

    // Ordenação
    resultado.sort((a, b) => {
      let valorA = a[ordenacao.campo]
      let valorB = b[ordenacao.campo]

      // Tratamento especial para datas
      if (ordenacao.campo === "dataPagamento" || ordenacao.campo === "dataRegistro") {
        valorA = new Date(String(valorA).split("/").reverse().join("-")).getTime()
        valorB = new Date(String(valorB).split("/").reverse().join("-")).getTime()
      }

      // Tratamento para strings
      if (typeof valorA === "string" && typeof valorB === "string") {
        return ordenacao.direcao === "asc" ? valorA.localeCompare(valorB) : valorB.localeCompare(valorA)
      }

      // Tratamento para números e datas (já convertidas para timestamp)
      return ordenacao.direcao === "asc" ? Number(valorA) - Number(valorB) : Number(valorB) - Number(valorA)
    })

    setFilteredTransacoes(resultado)
  }

  const handleOrdenar = (campo: keyof Transacao) => {
    setOrdenacao((prev) => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === "asc" ? "desc" : "asc",
    }))
  }

  const handleExportar = () => {
    const dados = filteredTransacoes.map((t) => ({
      ID: t.id || "",
      "Data do Pagamento": t.dataPagamento,
      "Valor Pago": formatCurrency(t.valorPago),
      Hospedagem: t.hospedagemNome,
      Cliente: t.clienteNome,
      "Data de Registro": t.dataRegistro,
      Observações: t.observacoes || "",
    }))

    exportarCSV(dados, "transacoes")
    toast.success("Arquivo CSV gerado com sucesso!")
  }

  const handleVerDetalhes = (hospedagemId: string) => {
    router.push(`/hospedagens/visualizar/${hospedagemId}`)
  }

  const mesAtual = format(new Date(), "MMMM", { locale: ptBR })

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground">Visualize e gerencie todos os pagamentos recebidos.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <EstatisticasCard
            titulo="Total Recebido"
            valor={formatCurrency(estatisticas.totalRecebido)}
            icone={<DollarSign className="h-4 w-4" />}
            loading={loading}
            corIcone="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          />

          <EstatisticasCard
            titulo={`Recebido em ${mesAtual}`}
            valor={formatCurrency(estatisticas.valorMes)}
            icone={<Calendar className="h-4 w-4" />}
            descricao={`${estatisticas.transacoesMes} transações`}
            loading={loading}
            corIcone="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          />

          <EstatisticasCard
            titulo="Média por Transação"
            valor={formatCurrency(estatisticas.mediaTransacao)}
            icone={<BarChart3 className="h-4 w-4" />}
            loading={loading}
            corIcone="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          />

          <EstatisticasCard
            titulo="Maior Transação"
            valor={formatCurrency(estatisticas.maiorTransacao)}
            icone={<ArrowUpDown className="h-4 w-4" />}
            loading={loading}
            corIcone="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          />
        </div>

        <Tabs defaultValue="lista" className="w-full">
          <TabsList>
            <TabsTrigger value="lista">Lista de Transações</TabsTrigger>
            <TabsTrigger value="graficos">Gráficos</TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transações</CardTitle>
                <CardDescription>Lista de todos os pagamentos recebidos.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por cliente, hospedagem ou observações..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <DatePickerWithRange onChange={setPeriodoFiltro} className="max-w-sm" />

                      <Select value={clienteFiltro} onValueChange={setClienteFiltro}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filtrar por cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os clientes</SelectItem>
                          {clientes.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id || ""}>
                              {cliente.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button variant="outline" size="sm" onClick={handleExportar}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                      </Button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="space-y-2">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                  ) : (
                    <>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[120px]">
                                <Button
                                  variant="ghost"
                                  onClick={() => handleOrdenar("dataPagamento")}
                                  className="flex items-center gap-1 p-0 font-medium"
                                >
                                  Data
                                  <ArrowUpDown className="h-3 w-3" />
                                </Button>
                              </TableHead>
                              <TableHead>
                                <Button
                                  variant="ghost"
                                  onClick={() => handleOrdenar("hospedagemNome")}
                                  className="flex items-center gap-1 p-0 font-medium"
                                >
                                  Hospedagem
                                  <ArrowUpDown className="h-3 w-3" />
                                </Button>
                              </TableHead>
                              <TableHead>
                                <Button
                                  variant="ghost"
                                  onClick={() => handleOrdenar("clienteNome")}
                                  className="flex items-center gap-1 p-0 font-medium"
                                >
                                  Cliente
                                  <ArrowUpDown className="h-3 w-3" />
                                </Button>
                              </TableHead>
                              <TableHead className="text-right">
                                <Button
                                  variant="ghost"
                                  onClick={() => handleOrdenar("valorPago")}
                                  className="flex items-center gap-1 p-0 font-medium ml-auto"
                                >
                                  Valor
                                  <ArrowUpDown className="h-3 w-3" />
                                </Button>
                              </TableHead>
                              <TableHead className="w-[100px] text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredTransacoes.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                  Nenhuma transação encontrada.
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredTransacoes.map((transacao) => (
                                <TableRow key={transacao.id}>
                                  <TableCell className="font-medium">{transacao.dataPagamento}</TableCell>
                                  <TableCell>{transacao.hospedagemNome}</TableCell>
                                  <TableCell>{transacao.clienteNome}</TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatCurrency(transacao.valorPago)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleVerDetalhes(transacao.hospedagemId)}
                                      title="Ver detalhes"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Mostrando {filteredTransacoes.length} de {transacoes.length} transações
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="graficos">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Transações</CardTitle>
                <CardDescription>Visualização gráfica das transações por período.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-[300px] items-center justify-center">
                  <p className="text-muted-foreground">Gráficos de análise serão implementados em breve.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  )
}
