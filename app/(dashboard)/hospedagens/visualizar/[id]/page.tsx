"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { obterHospedagemPorId } from "@/services/hospedagemService"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2, Pencil, Receipt } from "lucide-react"
import Link from "next/link"
import type { Hospedagem } from "@/types"
import { DetalhesHospedagem } from "@/components/detalhes-hospedagem"
import { RegistrarPagamentoDialog } from "@/components/registrar-pagamento-dialog"

export default function VisualizarHospedagemPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const id = params.id as string

  const [hospedagem, setHospedagem] = useState<Hospedagem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarHospedagem()
  }, [id])

  const carregarHospedagem = async () => {
    try {
      setLoading(true)
      const dados = await obterHospedagemPorId(id)

      if (dados) {
        setHospedagem(dados)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!hospedagem) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/hospedagens">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Detalhes da Hospedagem</h1>
        </div>

        <div className="flex gap-2">
          <RegistrarPagamentoDialog hospedagem={hospedagem} onPagamentoRegistrado={carregarHospedagem}>
            <Button variant="outline">
              <Receipt className="h-4 w-4 mr-2" />
              Registrar Pagamento
            </Button>
          </RegistrarPagamentoDialog>

          <Button asChild>
            <Link href={`/hospedagens/${hospedagem.id}`}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <DetalhesHospedagem hospedagem={hospedagem} onUpdate={carregarHospedagem} />
    </div>
  )
}
