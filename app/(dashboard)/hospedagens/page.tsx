"use client"

import { useEffect, useState } from "react"
import { obterHospedagens, excluirHospedagem, registrarPagamento, importarDadosIniciais } from "@/services/hospedagemService"
import { useAuth } from "@/providers/auth-provider"
import { auth } from "@/lib/firebase"
import type { Hospedagem } from "@/types"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Download,
  RefreshCw,
  Receipt,
} from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { exportarHospedagensCsv, downloadCsv } from "@/utils/exportarCsv"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { StatusPagamento } from "@/components/status-pagamento"
import { RegistrarPagamentoDialog } from "@/components/registrar-pagamento-dialog"
import { verificarAtraso, verificarPagamentosEmDia } from "@/services/hospedagemService"

export default function HospedagensPage() {
  const [hospedagens, setHospedagens] = useState<Hospedagem[]>([])
  const [filteredHospedagens, setFilteredHospedagens] = useState<Hospedagem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [cicloFilter, setCicloFilter] = useState("todos")
  const [pagamentoFilter, setPagamentoFilter] = useState("todos")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    carregarHospedagens()
  }, [])

  useEffect(() => {
    filtrarHospedagens()
  }, [hospedagens, searchTerm, statusFilter, cicloFilter, pagamentoFilter])

  const carregarHospedagens = async () => {
    if (!user) return;
    try {
      setLoading(true)
      const dados = await obterHospedagens(user!.uid)
      setHospedagens(dados)
    } catch (error) {
      console.error("Erro ao carregar hospedagens:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as hospedagens.",
      })
    } finally {
      setLoading(false)
    }
  }

  const filtrarHospedagens = () => {
    let filtered = [...hospedagens]

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter((h) => h.nome.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Filtrar por status
    if (statusFilter !== "todos") {
      filtered = filtered.filter((h) => h.status === statusFilter)
    }

    // Filtrar por ciclo de renovação
    if (cicloFilter !== "todos") {
      filtered = filtered.filter((h) => h.cicloRenovacao === cicloFilter)
    }

    // Filtrar por status de pagamento
    if (pagamentoFilter !== "todos") {
      filtered = filtered.filter((h) => {
        // Implementar filtro por status de pagamento
        if (pagamentoFilter === "em_dia") {
          return !verificarAtraso(h).emAtraso && verificarPagamentosEmDia(h).emDia
        } else if (pagamentoFilter === "em_atraso") {
          return verificarAtraso(h).emAtraso
        } else if (pagamentoFilter === "pendente") {
          return !verificarAtraso(h).emAtraso && !verificarPagamentosEmDia(h).emDia
        }
        return true
      })
    }

    setFilteredHospedagens(filtered)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      // Excluir do banco de dados
      await excluirHospedagem(deleteId)

      // Atualizar o estado local para refletir a exclusão na UI
      setHospedagens((prev) => prev.filter((h) => h.id !== deleteId))

      toast({
        title: "Sucesso",
        description: "Hospedagem excluída com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao excluir hospedagem:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir a hospedagem.",
      })
    } finally {
      setShowDeleteDialog(false)
      setDeleteId(null)
    }
  }

  const handleSincronizarAsaas = async (hospedagem: Hospedagem) => {
    if (!hospedagem.asaasBillingId) return

    toast({
      title: "Asaas",
      description: "Consultando fatura no Asaas...",
    })

    try {
      const idToken = await auth.currentUser?.getIdToken()
      const response = await fetch(`/api/asaas/fatura/${hospedagem.asaasBillingId}`, {
        headers: {
          Authorization: `Bearer ${idToken || ""}`
        }
      })
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Não foi possível consultar a fatura no Asaas.")
      }

      const data = await response.json()

      if (data.pago) {
        // Formatar data do pagamento de AAAA-MM-DD para DD/MM/AAAA
        let dataPgtoFormatted = new Date().toLocaleDateString("pt-BR")
        if (data.dataPagamento) {
          const partes = data.dataPagamento.split("-")
          if (partes.length === 3) {
            dataPgtoFormatted = `${partes[2]}/${partes[1]}/${partes[0]}`
          }
        }

        // Registrar o pagamento no Firestore
        await registrarPagamento(hospedagem.id!, {
          dataPagamento: dataPgtoFormatted,
          valorPago: data.valor,
          observacoes: `Sincronizado automaticamente via Asaas (ID: ${hospedagem.asaasBillingId})`,
        })

        toast({
          title: "Sincronizado com sucesso",
          description: `A fatura está paga! O pagamento de R$ ${data.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} foi registrado.`,
        })

        // Recarregar hospedagens
        await carregarHospedagens()
      } else {
        toast({
          title: "Fatura Pendente",
          description: `A fatura do Asaas (Status: ${data.status}) ainda não foi paga.`,
        })
      }
    } catch (error) {
      console.error("Erro na sincronização Asaas:", error)
      toast({
        variant: "destructive",
        title: "Erro de Sincronização",
        description: error instanceof Error ? error.message : "Erro ao conectar com a API do Asaas.",
      })
    }
  }

  const handleImportarDados = async () => {
    try {
      const dadosIniciais = [
        { nome: "drviniciusbarros.com.br", dataCriacao: "18/09/2024", valor: 520.0, cicloRenovacao: "anual" },
        { nome: "simonettimoveis.com.br", dataCriacao: "09/03/2024", valor: 520.0, cicloRenovacao: "anual" },
        { nome: "polodasembalagens.com.br", dataCriacao: "22/11/2023", valor: 375.0, cicloRenovacao: "anual" },
        { nome: "dasc.com.br", dataCriacao: "07/06/2024", valor: 688.7, cicloRenovacao: "anual" },
        { nome: "vanderleiaterapeuta.com.br", dataCriacao: "10/09/2024", valor: 520.0, cicloRenovacao: "anual" },
        { nome: "clinicaricreare.com.br", dataCriacao: "20/09/2022", valor: 0.0, cicloRenovacao: "anual" },
        { nome: "inovalumens.com.br", dataCriacao: "05/10/2022", valor: 520.0, cicloRenovacao: "anual" },
        { nome: "clinicaeduardocarvalho.com", dataCriacao: "17/10/2022", valor: 0.0, cicloRenovacao: "anual" },
        { nome: "drigortobias.com", dataCriacao: "12/09/2024", valor: 520.0, cicloRenovacao: "anual" },
        { nome: "deboraormond.com.br", dataCriacao: "13/08/2024", valor: 520.0, cicloRenovacao: "anual" },
        { nome: "jessicacamposbiomed.com.br", dataCriacao: "12/08/2024", valor: 520.0, cicloRenovacao: "anual" },
        { nome: "alarmesegsolar.com.br", dataCriacao: "12/05/2023", valor: 0.0, cicloRenovacao: "anual" },
        { nome: "sk8rolamentos.com.br", dataCriacao: "05/08/2024", valor: 520.0, cicloRenovacao: "anual" },
        { nome: "mxhp.com.br", dataCriacao: "01/12/2023", valor: 0.0, cicloRenovacao: "anual" },
        { nome: "modellare.com.br", dataCriacao: "18/09/2024", valor: 2600.0, cicloRenovacao: "anual" },
        { nome: "msprevencao.com.br", dataCriacao: "12/08/2024", valor: 229.9, cicloRenovacao: "mensal" },
      ]

      await importarDadosIniciais(dadosIniciais, user!.uid)
      await carregarHospedagens()

      toast({
        title: "Sucesso",
        description: "Dados importados com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao importar dados:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível importar os dados.",
      })
    } finally {
      setShowImportDialog(false)
    }
  }

  const handleExportar = () => {
    try {
      const csv = exportarHospedagensCsv(hospedagens)
      downloadCsv(csv, `hospedagens-${new Date().toISOString().split("T")[0]}.csv`)

      toast({
        title: "Sucesso",
        description: "Dados exportados com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao exportar dados:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível exportar os dados.",
      })
    }
  }

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
      <motion.div variants={item} className="flex justify-between items-center">
        <div className="page-header">
          <h1>Hospedagens</h1>
          <p>Gerencie todas as hospedagens de sites</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" onClick={handleExportar}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button asChild>
            <Link href="/hospedagens/nova">
              <Plus className="h-4 w-4 mr-2" />
              Nova Hospedagem
            </Link>
          </Button>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <Card className="overflow-hidden border shadow-sm">
          <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b">
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtre as hospedagens por nome, status, ciclo ou pagamento</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="ativo">Ativos</SelectItem>
                    <SelectItem value="inativo">Inativos</SelectItem>
                    <SelectItem value="pendente">Pendentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select value={cicloFilter} onValueChange={setCicloFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por ciclo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os ciclos</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select value={pagamentoFilter} onValueChange={setPagamentoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os pagamentos</SelectItem>
                    <SelectItem value="em_dia">Em dia</SelectItem>
                    <SelectItem value="em_atraso">Em atraso</SelectItem>
                    <SelectItem value="pendente">Pagamento pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="overflow-hidden border shadow-sm">
          <div className="rounded-md overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Data de Vencimento</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                        <p className="text-muted-foreground">Carregando hospedagens...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredHospedagens.length > 0 ? (
                  filteredHospedagens.map((hospedagem, index) => (
                    <TableRow
                      key={hospedagem.id}
                      className={cn(
                        "transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
                        index % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-gray-50/50 dark:bg-gray-900/20",
                      )}
                    >
                      <TableCell className="font-medium">{hospedagem.nome}</TableCell>
                      <TableCell>{hospedagem.dataCriacao}</TableCell>
                      <TableCell>{hospedagem.dataVencimento || "-"}</TableCell>
                      <TableCell>{getCicloRenovacaoBadge(hospedagem.cicloRenovacao)}</TableCell>
                      <TableCell>
                        {hospedagem.valor.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                      <TableCell>{getStatusBadge(hospedagem.status)}</TableCell>
                      <TableCell>
                        <StatusPagamento hospedagem={hospedagem} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/hospedagens/visualizar/${hospedagem.id}`}
                                className="flex items-center cursor-pointer"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/hospedagens/${hospedagem.id}`} className="flex items-center cursor-pointer">
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <RegistrarPagamentoDialog
                                hospedagem={hospedagem}
                                onPagamentoRegistrado={carregarHospedagens}
                              >
                                <div className="flex items-center cursor-pointer">
                                  <Receipt className="h-4 w-4 mr-2" />
                                  Registrar Pagamento
                                </div>
                              </RegistrarPagamentoDialog>
                            </DropdownMenuItem>
                            {hospedagem.asaasBillingId && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-blue-600 dark:text-blue-400 focus:text-blue-700 flex items-center cursor-pointer"
                                  onClick={() => handleSincronizarAsaas(hospedagem)}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Sincronizar Asaas
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive flex items-center cursor-pointer"
                              onClick={() => {
                                setDeleteId(hospedagem.id)
                                setShowDeleteDialog(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-3">
                          <Search className="h-5 w-5 text-gray-500" />
                        </div>
                        <p className="font-medium mb-1">Nenhuma hospedagem encontrada</p>
                        <p className="text-sm text-muted-foreground">
                          Tente ajustar seus filtros ou adicione uma nova hospedagem
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir hospedagem</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta hospedagem? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Importar dados</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja importar os dados iniciais do JSON? Isso adicionará todas as hospedagens ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportarDados}>Importar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
