"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { registrarPagamento } from "@/services/hospedagemService"
import { Loader2, Receipt } from "lucide-react"
import type { Hospedagem } from "@/types"

interface RegistrarPagamentoDialogProps {
  hospedagem: Hospedagem
  onPagamentoRegistrado: () => void
  children?: React.ReactNode
}

export function RegistrarPagamentoDialog({
  hospedagem,
  onPagamentoRegistrado,
  children,
}: RegistrarPagamentoDialogProps) {
  const [open, setOpen] = useState(false)
  const [dataPagamento, setDataPagamento] = useState(new Date().toLocaleDateString("pt-BR"))
  const [valorPago, setValorPago] = useState(hospedagem.valor.toString())
  const [observacoes, setObservacoes] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await registrarPagamento(hospedagem.id!, {
        dataPagamento,
        valorPago: Number(valorPago),
        observacoes,
      })

      toast({
        title: "Pagamento registrado",
        description: "O pagamento foi registrado com sucesso.",
      })

      setOpen(false)
      onPagamentoRegistrado()
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível registrar o pagamento.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Registre o pagamento para a hospedagem <strong>{hospedagem.nome}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dataPagamento" className="text-right">
                Data
              </Label>
              <Input
                id="dataPagamento"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="valorPago" className="text-right">
                Valor (R$)
              </Label>
              <Input
                id="valorPago"
                type="number"
                step="0.01"
                value={valorPago}
                onChange={(e) => setValorPago(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="observacoes" className="text-right">
                Observações
              </Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Receipt className="mr-2 h-4 w-4" />
                  Registrar Pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
