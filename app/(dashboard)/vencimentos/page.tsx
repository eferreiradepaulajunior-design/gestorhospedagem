"use client"

import { useEffect, useState } from "react"
import {
  verificarVencimentos,
  renovarHospedagem,
  obterHospedagensEmAtrasoDetalhado,
  type InfoAtraso,
} from "@/services/hospedagemService"
import { useAuth } from "@/providers/auth-provider"
import type { Hospedagem } from "@/types"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, Calendar, CheckCircle2, Loader2, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function VencimentosPage() {
  const [vencimentos, setVencimentos] = useState<Hospedagem[]>([])
  const [atrasados, setAtrasados] = useState<InfoAtraso[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAtrasos, setLoadingAtrasos] = useState(true)
  const [renovando, setRenovando] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
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

  const carregarDados = async () => {
    await Promise.all([carregarVencimentos(), carregarAtrasados()])
  }

  const carregarVencimentos = async () => {
    if (!user) return;
    try {
      setLoading(true)
      const dados = await verificarVencimentos(user!.uid)
      setVencimentos(dados)
    } catch (error) {
      console.error("Erro ao carregar vencimentos:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os vencimentos.",
      })
    } finally {
      setLoading(false)
    }
  }

  const carregarAtrasados = async () => {
    if (!user) return;
    try {
      setLoadingAtrasos(true)
      const dados = await obterHospedagensEmAtrasoDetalhado(user!.uid)
      setAtrasados(dados)
    } catch (error) {
      console.error("Erro ao carregar hospedagens em atraso:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as hospedagens em atraso.",
      })
    } finally {
      setLoadingAtrasos(false)
    }
  }

  const handleRenovar = async (id?: string) => {
    if (!id) return

    setRenovando(id)

    try {
      await renovarHospedagem(id)

      // Recarregar dados após renovação
      await carregarDados()

      toast({
        title: "Sucesso",
        description: "Hospedagem renovada com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao renovar hospedagem:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível renovar a hospedagem.",
      })
    } finally {
      setRenovando(null)
    }
  }

  const calcularDiasRestantes = (dataVencimento?: string) => {
    if (!dataVencimento) return 0

    try {
      const hoje = new Date()
      const partes = dataVencimento.split("/")

      // Verificar se a data está no formato correto
      if (partes.length !== 3) return 0

      const dataVenc = new Date(Number.parseInt(partes[2]), Number.parseInt(partes[1]) - 1, Number.parseInt(partes[0]))

      // Verificar se a data é válida
      if (isNaN(dataVenc.getTime())) return 0

      const diffTime = dataVenc.getTime() - hoje.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      return diffDays
    } catch (error) {
      console.error("Erro ao calcular dias restantes:", error)
      return 0
    }
  }

  const getBadgeDiasRestantes = (dias: number) => {
    if (dias <= 7) {
      return <Badge variant="destructive">{dias} dias</Badge>
    } else if (dias <= 15) {
      return (
        <Badge variant="outline" className="text-amber-500 border-amber-500">
          {dias} dias
        </Badge>
      )
    } else {
      return <Badge variant="outline">{dias} dias</Badge>
    }
  }

  const getBadgeDiasAtraso = (dias: number) => {
    if (dias > 30) {
      return <Badge variant="destructive">{dias} dias</Badge>
    } else {
      return (
        <Badge variant="outline" className="text-red-500 border-red-500">
          {dias} dias
        </Badge>
      )
    }
  }

  const getBadgeParcelasAtraso = (parcelas: number) => {
    return (
      <Badge variant="outline" className="bg-red-50">
        {parcelas} {parcelas === 1 ? "parcela" : "parcelas"}
      </Badge>
    )
  }

  const getCicloRenovacaoBadge = (ciclo?: string) => {
    switch (ciclo) {
      case "mensal":
        return (
          <Badge variant="outline" className="text-blue-500 border-blue-500">
            <RefreshCw className="h-3 w-3 mr-1" /> Mensal
          </Badge>
        )
      case "trimestral":
        return (
          <Badge variant="outline" className="text-purple-500 border-purple-500">
            <RefreshCw className="h-3 w-3 mr-1" /> Trimestral
          </Badge>
        )
      case "semestral":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500">
            <RefreshCw className="h-3 w-3 mr-1" /> Semestral
          </Badge>
        )
      case "anual":
        return (
          <Badge variant="outline" className="text-green-500 border-green-500">
            <RefreshCw className="h-3 w-3 mr-1" /> Anual
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <RefreshCw className="h-3 w-3 mr-1" /> {ciclo || "Anual"}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vencimentos</h1>
        <p className="text-muted-foreground">Gerencie vencimentos e pagamentos em atraso</p>
      </div>

      {/* Seção de Pagamentos em Atraso */}
      <Card className="border-red-200 shadow-sm">
        <CardHeader className="bg-red-50 dark:bg-red-900/20 border-b border-red-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <div>
                <CardTitle>Pagamentos em Atraso</CardTitle>
                <CardDescription>Hospedagens com pagamentos em atraso e valores acumulados</CardDescription>
              </div>
            </div>
            {atrasados.length > 0 && (
              <Badge variant="destructive" className="text-sm">
                {atrasados.length} {atrasados.length === 1 ? "hospedagem" : "hospedagens"} em atraso
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="border rounded-md border-red-100">
            <Table>
              <TableHeader className="bg-red-50/50 dark:bg-red-900/10">
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data de Vencimento</TableHead>
                  <TableHead>Dias em Atraso</TableHead>
                  <TableHead>Parcelas em Atraso</TableHead>
                  <TableHead>Valor Acumulado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingAtrasos ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Carregando pagamentos em atraso...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : atrasados.length > 0 ? (
                  atrasados.map((item) => (
                    <TableRow key={item.hospedagem.id}>
                      <TableCell className="font-medium">
                        {typeof item.hospedagem.nome === "string" ? item.hospedagem.nome : "Nome não disponível"}
                      </TableCell>
                      <TableCell>
                        {item.hospedagem.dataVencimento &&
                        typeof item.hospedagem.dataVencimento === "string" &&
                        item.hospedagem.dataVencimento.split("/").length === 3
                          ? item.hospedagem.dataVencimento
                          : "Data não definida"}
                      </TableCell>
                      <TableCell>{getBadgeDiasAtraso(item.diasAtraso)}</TableCell>
                      <TableCell>{getBadgeParcelasAtraso(item.parcelasEmAtraso)}</TableCell>
                      <TableCell className="font-medium text-red-600">
                        {item.valorAcumulado.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => handleRenovar(item.hospedagem.id)}
                          disabled={renovando === item.hospedagem.id}
                          size="sm"
                          variant="destructive"
                        >
                          {renovando === item.hospedagem.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Renovando...
                            </>
                          ) : (
                            <>
                              <Calendar className="h-4 w-4 mr-2" />
                              Renovar
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                        <p>Não há hospedagens com pagamentos em atraso</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Seção de Próximos Vencimentos */}
      <Card>
        <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Próximos Vencimentos</CardTitle>
              <CardDescription>Hospedagens que vencem nos próximos 30 dias</CardDescription>
            </div>
            {vencimentos.length > 0 && (
              <Badge variant="outline" className="text-sm">
                {vencimentos.length} {vencimentos.length === 1 ? "vencimento" : "vencimentos"} próximo(s)
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data de Vencimento</TableHead>
                  <TableHead>Dias Restantes</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Carregando vencimentos...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : vencimentos.length > 0 ? (
                  vencimentos.map((hospedagem) => {
                    const diasRestantes = calcularDiasRestantes(hospedagem.dataVencimento)

                    return (
                      <TableRow key={hospedagem.id}>
                        <TableCell className="font-medium">
                          {typeof hospedagem.nome === "string" ? hospedagem.nome : "Nome não disponível"}
                        </TableCell>
                        <TableCell>
                          {hospedagem.dataVencimento &&
                          typeof hospedagem.dataVencimento === "string" &&
                          hospedagem.dataVencimento.split("/").length === 3
                            ? hospedagem.dataVencimento
                            : "Data não definida"}
                        </TableCell>
                        <TableCell>
                          {diasRestantes > 0 ? (
                            getBadgeDiasRestantes(diasRestantes)
                          ) : (
                            <Badge variant="outline">Data inválida</Badge>
                          )}
                        </TableCell>
                        <TableCell>{getCicloRenovacaoBadge(hospedagem.cicloRenovacao)}</TableCell>
                        <TableCell>
                          {hospedagem.valor.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={() => handleRenovar(hospedagem.id)}
                            disabled={renovando === hospedagem.id}
                            size="sm"
                          >
                            {renovando === hospedagem.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Renovando...
                              </>
                            ) : (
                              <>
                                <Calendar className="h-4 w-4 mr-2" />
                                Renovar
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                        <p>Não há hospedagens próximas do vencimento</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
