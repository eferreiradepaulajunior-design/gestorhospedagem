"use client"

import { useEffect, useState } from "react"
import { verificarVencimentos, obterHospedagensEmAtraso } from "@/services/hospedagemService"
import { useAuth } from "@/providers/auth-provider"
import type { Hospedagem } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { AlertTriangle, Loader2, AlertCircle, BellRing, Receipt, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StatusPagamento } from "@/components/status-pagamento"
import { RegistrarPagamentoDialog } from "@/components/registrar-pagamento-dialog"

export default function AlertasPage() {
  const [vencimentos, setVencimentos] = useState<Hospedagem[]>([])
  const [hospedagensEmAtraso, setHospedagensEmAtraso] = useState<Hospedagem[]>([])
  const [hospedagensInativas, setHospedagensInativas] = useState<Hospedagem[]>([])
  const [hospedagensGratuitas, setHospedagensGratuitas] = useState<Hospedagem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  // Função para carregar os dados
  const carregarDados = async () => {
    if (!user) return;
    try {
      setLoading(true)

      // Carregar vencimentos próximos
      const dadosVencimentos = await verificarVencimentos(user!.uid)
      setVencimentos(dadosVencimentos)

      // Carregar hospedagens em atraso
      const dadosEmAtraso = await obterHospedagensEmAtraso(user!.uid)
      setHospedagensEmAtraso(dadosEmAtraso)

      // Simular carregamento de hospedagens inativas e gratuitas
      // Em um sistema real, você teria serviços específicos para isso
      setTimeout(() => {
        // Hospedagens inativas (simulação)
        setHospedagensInativas([
          {
            id: "1",
            nome: "clinicaricreare.com.br",
            dataCriacao: "20/09/2022",
            valor: 0.0,
            status: "inativo",
            cicloRenovacao: "anual",
          },
          {
            id: "2",
            nome: "alarmesegsolar.com.br",
            dataCriacao: "12/05/2023",
            valor: 0.0,
            status: "inativo",
            cicloRenovacao: "anual",
          },
          {
            id: "3",
            nome: "mxhp.com.br",
            dataCriacao: "01/12/2023",
            valor: 0.0,
            status: "inativo",
            cicloRenovacao: "anual",
          },
        ])

        // Hospedagens gratuitas (simulação)
        setHospedagensGratuitas([
          {
            id: "4",
            nome: "clinicaricreare.com.br",
            dataCriacao: "20/09/2022",
            valor: 0.0,
            status: "ativo",
            cicloRenovacao: "anual",
          },
          {
            id: "5",
            nome: "clinicaeduardocarvalho.com",
            dataCriacao: "17/10/2022",
            valor: 0.0,
            status: "ativo",
            cicloRenovacao: "anual",
          },
          {
            id: "6",
            nome: "alarmesegsolar.com.br",
            dataCriacao: "12/05/2023",
            valor: 0.0,
            status: "ativo",
            cicloRenovacao: "anual",
          },
          {
            id: "7",
            nome: "mxhp.com.br",
            dataCriacao: "01/12/2023",
            valor: 0.0,
            status: "ativo",
            cicloRenovacao: "anual",
          },
        ])

        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os alertas.",
      })
      setLoading(false)
    }
  }

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

  const AlertCard = ({
    title,
    description,
    icon: Icon,
    items,
    emptyMessage,
    iconColor,
    actionLink,
    actionText,
    showPagamento = false,
    onUpdate,
  }: {
    title: string
    description: string
    icon: any
    items: Hospedagem[]
    emptyMessage: string
    iconColor: string
    actionLink: string
    actionText: string
    showPagamento?: boolean
    onUpdate?: () => void
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <div className={`p-2 rounded-full ${iconColor}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando...</span>
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col border-b pb-4 last:border-b-0">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">{item.nome}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {showPagamento ? (
                        <StatusPagamento hospedagem={item} showTooltip={false} />
                      ) : (
                        <>Criado em: {item.dataCriacao}</>
                      )}
                    </div>
                  </div>
                  <Badge variant={item.status === "ativo" ? "outline" : "destructive"}>
                    {item.status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                {showPagamento && (
                  <div className="flex justify-end mt-2 mb-1">
                    <RegistrarPagamentoDialog hospedagem={item} onPagamentoRegistrado={onUpdate || carregarDados}>
                      <Button variant="outline" size="sm">
                        <Receipt className="h-3 w-3 mr-1" />
                        Pagar
                      </Button>
                    </RegistrarPagamentoDialog>
                  </div>
                )}
              </div>
            ))}
            <Button asChild className="w-full mt-4">
              <Link href={actionLink}>{actionText}</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
            <p>{emptyMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BellRing className="h-6 w-6 text-amber-500" />
        <h1 className="text-3xl font-bold tracking-tight">Alertas</h1>
      </div>
      <p className="text-muted-foreground">Visualize alertas importantes sobre suas hospedagens</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AlertCard
          title="Vencimentos Próximos"
          description="Hospedagens que vencem nos próximos 30 dias"
          icon={AlertTriangle}
          items={vencimentos}
          emptyMessage="Não há vencimentos próximos"
          iconColor="bg-amber-500"
          actionLink="/vencimentos"
          actionText="Ver todos os vencimentos"
        />

        <AlertCard
          title="Pagamentos em Atraso"
          description="Hospedagens com pagamentos atrasados"
          icon={AlertCircle}
          items={hospedagensEmAtraso}
          emptyMessage="Não há hospedagens em atraso"
          iconColor="bg-red-500"
          actionLink="/hospedagens?pagamentoFilter=em_atraso"
          actionText="Ver hospedagens em atraso"
          showPagamento={true}
          onUpdate={carregarDados}
        />

        <AlertCard
          title="Hospedagens Inativas"
          description="Sites que estão inativos no momento"
          icon={AlertCircle}
          items={hospedagensInativas}
          emptyMessage="Não há hospedagens inativas"
          iconColor="bg-gray-500"
          actionLink="/hospedagens?status=inativo"
          actionText="Ver hospedagens inativas"
        />
      </div>
    </div>
  )
}
