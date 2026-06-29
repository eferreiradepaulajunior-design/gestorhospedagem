"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { obterHospedagemPorId, atualizarHospedagem, adicionarHospedagem } from "@/services/hospedagemService"
import { useAuth } from "@/providers/auth-provider"
import type { Hospedagem } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2, Calendar } from "lucide-react"
import Link from "next/link"
import { Switch } from "@/components/ui/switch"
import { format, addMonths, addYears } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function HospedagemFormPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const id = params.id as string
  const isNovo = id === "nova"

  const [hospedagem, setHospedagem] = useState<Partial<Hospedagem>>({
    nome: "",
    dataCriacao: new Date().toLocaleDateString("pt-BR"),
    valor: 0,
    status: "ativo",
    cliente: "",
    observacoes: "",
    cicloRenovacao: "anual",
    dataVencimento: "",
    pagamentoAntecipado: false,
    periodoAntecipado: 1,
    asaasBillingId: "",
  })

  const [editarDataVencimento, setEditarDataVencimento] = useState(false)
  const [loading, setLoading] = useState(!isNovo)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isNovo) {
      carregarHospedagem()
    }
  }, [id, isNovo])

  // Calcular data de vencimento com base no ciclo e período antecipado
  const calcularDataVencimento = () => {
    const dataArray = hospedagem.dataCriacao?.split("/") || []

    // Verificar se a data está completa (dia/mês/ano)
    if (dataArray.length !== 3 || dataArray[0].length < 1 || dataArray[1].length < 1 || dataArray[2].length < 4) {
      // Se a data estiver incompleta, não atualizar a data de vencimento
      return
    }

    try {
      // Tentar criar um objeto Date válido
      const dia = Number.parseInt(dataArray[0], 10)
      const mes = Number.parseInt(dataArray[1], 10) - 1 // Mês em JS é 0-indexed
      const ano = Number.parseInt(dataArray[2], 10)

      // Verificar se os valores são números válidos
      if (isNaN(dia) || isNaN(mes) || isNaN(ano) || dia < 1 || dia > 31 || mes < 0 || mes > 11 || ano < 1900) {
        return
      }

      const dataObj = new Date(ano, mes, dia)

      // Verificar se a data é válida (ex: 31/02/2024 não é válida)
      if (dataObj.getDate() !== dia || dataObj.getMonth() !== mes || dataObj.getFullYear() !== ano) {
        return
      }

      let novaData: Date

      if (hospedagem.pagamentoAntecipado && hospedagem.periodoAntecipado) {
        // Se for pagamento antecipado, calcular com base no período antecipado (em anos)
        novaData = addYears(dataObj, hospedagem.periodoAntecipado)
      } else {
        // Caso contrário, calcular com base no ciclo de renovação
        switch (hospedagem.cicloRenovacao) {
          case "mensal":
            novaData = addMonths(dataObj, 1)
            break
          case "trimestral":
            novaData = addMonths(dataObj, 3)
            break
          case "semestral":
            novaData = addMonths(dataObj, 6)
            break
          case "anual":
          default:
            novaData = addYears(dataObj, 1)
            break
        }
      }

      // Formatar data para o formato brasileiro
      const dataFormatada = format(novaData, "dd/MM/yyyy", { locale: ptBR })

      // Atualizar a data de vencimento apenas se não estiver em modo de edição manual
      if (!editarDataVencimento) {
        setHospedagem((prev) => ({
          ...prev,
          dataVencimento: dataFormatada,
        }))
      }
    } catch (error) {
      console.error("Erro ao calcular data de vencimento:", error)
      // Não atualizar a data de vencimento em caso de erro
    }
  }

  // Recalcular data de vencimento quando ciclo, data de criação ou período antecipado mudar
  useEffect(() => {
    if (
      hospedagem.dataCriacao &&
      (hospedagem.cicloRenovacao || hospedagem.pagamentoAntecipado) &&
      !editarDataVencimento
    ) {
      calcularDataVencimento()
    }
  }, [
    hospedagem.dataCriacao,
    hospedagem.cicloRenovacao,
    hospedagem.pagamentoAntecipado,
    hospedagem.periodoAntecipado,
    editarDataVencimento,
  ])

  const carregarHospedagem = async () => {
    try {
      const dados = await obterHospedagemPorId(id)
      if (dados) {
        setHospedagem(dados)
        // Se já tem data de vencimento personalizada, habilitar edição manual
        if (dados.dataVencimento) {
          setEditarDataVencimento(true)
        }
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Hospedagem não encontrada.",
        })
        router.push("/hospedagens")
      }
    } catch (error) {
      console.error("Erro ao carregar hospedagem:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados da hospedagem.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setHospedagem((prev) => ({
      ...prev,
      [name]: name === "valor" || name === "periodoAntecipado" ? Number.parseFloat(value) : value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setHospedagem((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setHospedagem((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (isNovo) {
        await adicionarHospedagem(hospedagem as Hospedagem, user!.uid)
        toast({
          title: "Sucesso",
          description: "Hospedagem adicionada com sucesso.",
        })
      } else {
        await atualizarHospedagem(id, hospedagem)
        toast({
          title: "Sucesso",
          description: "Hospedagem atualizada com sucesso.",
        })
      }

      router.push("/hospedagens")
    } catch (error) {
      console.error("Erro ao salvar hospedagem:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar a hospedagem.",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/hospedagens">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{isNovo ? "Nova Hospedagem" : "Editar Hospedagem"}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Dados da Hospedagem</CardTitle>
            <CardDescription>Preencha os dados da hospedagem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Domínio</Label>
                <Input id="nome" name="nome" value={hospedagem.nome} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataCriacao">Data de Criação</Label>
                <Input
                  id="dataCriacao"
                  name="dataCriacao"
                  value={hospedagem.dataCriacao}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  name="valor"
                  type="number"
                  step="0.01"
                  value={hospedagem.valor}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cicloRenovacao">Ciclo de Renovação</Label>
                <Select
                  value={hospedagem.cicloRenovacao}
                  onValueChange={(value) => handleSelectChange("cicloRenovacao", value)}
                  disabled={hospedagem.pagamentoAntecipado}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ciclo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={hospedagem.status} onValueChange={(value) => handleSelectChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Seção de Pagamento Antecipado */}
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-medium">Pagamento Antecipado</h3>
                  <p className="text-sm text-muted-foreground">
                    Ative esta opção para registrar pagamentos de longo prazo
                  </p>
                </div>
                <Switch
                  checked={hospedagem.pagamentoAntecipado}
                  onCheckedChange={(checked) => handleSwitchChange("pagamentoAntecipado", checked)}
                />
              </div>

              {hospedagem.pagamentoAntecipado && (
                <div className="space-y-2 mt-4">
                  <Label htmlFor="periodoAntecipado">Período Antecipado (anos)</Label>
                  <Input
                    id="periodoAntecipado"
                    name="periodoAntecipado"
                    type="number"
                    min="1"
                    max="10"
                    step="1"
                    value={hospedagem.periodoAntecipado}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Informe por quantos anos o cliente pagou antecipadamente
                  </p>
                </div>
              )}
            </div>

            {/* Seção de Data de Vencimento */}
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-medium">Data de Vencimento</h3>
                  <p className="text-sm text-muted-foreground">
                    {editarDataVencimento
                      ? "Edição manual da data de vencimento"
                      : "Data calculada automaticamente com base no ciclo"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="editarDataVencimento" className="text-sm">
                    Editar manualmente
                  </Label>
                  <Switch
                    id="editarDataVencimento"
                    checked={editarDataVencimento}
                    onCheckedChange={setEditarDataVencimento}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                </div>
                <Input
                  id="dataVencimento"
                  name="dataVencimento"
                  value={hospedagem.dataVencimento}
                  onChange={handleChange}
                  disabled={!editarDataVencimento}
                  className={!editarDataVencimento ? "bg-muted" : ""}
                />
                {!editarDataVencimento && (
                  <p className="text-xs text-muted-foreground">Ative "Editar manualmente" para modificar esta data</p>
                )}
              </div>
            </div>

            {/* Seção de Integração com Asaas */}
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/30 border-blue-100 dark:border-blue-900/50">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-base font-medium flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                    Integração com Asaas
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Informe o ID da fatura/cobrança no Asaas para sincronizar o status de pagamento
                  </p>
                </div>
              </div>
              <div className="space-y-2 mt-3">
                <Label htmlFor="asaasBillingId">ID da Cobrança Asaas</Label>
                <Input
                  id="asaasBillingId"
                  name="asaasBillingId"
                  value={hospedagem.asaasBillingId || ""}
                  onChange={handleChange}
                  placeholder="pay_xxxxxxxxxxxx"
                  className="bg-white dark:bg-gray-950 font-mono text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  Formatos aceitos: pay_xxxxxxxxxxxx. Quando preenchido, você poderá validar o pagamento diretamente pela API.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Input id="cliente" name="cliente" value={hospedagem.cliente || ""} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                value={hospedagem.observacoes || ""}
                onChange={handleChange}
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/hospedagens">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isNovo ? "Adicionar" : "Atualizar"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
