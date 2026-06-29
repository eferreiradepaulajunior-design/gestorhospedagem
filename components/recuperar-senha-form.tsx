"use client"

import type React from "react"

import { useState } from "react"
import { enviarEmailRedefinicaoSenha } from "@/services/usuarioService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Mail } from "lucide-react"
import { z } from "zod"

// Schema de validação
const recuperarSenhaSchema = z.object({
  email: z.string().email("Email inválido"),
})

export function RecuperarSenhaForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setError(null)
  }

  const validateForm = () => {
    try {
      recuperarSenhaSchema.parse({ email })
      setError(null)
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.errors[0].message)
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      await enviarEmailRedefinicaoSenha(email)

      setEnviado(true)

      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      })
    } catch (error: unknown) {
      console.error("Erro ao enviar email:", error)

      let mensagem = "Ocorreu um erro ao enviar o email de recuperação."

      if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string }
        if (firebaseError.code === "auth/user-not-found") {
          mensagem = "Não encontramos uma conta com este email."
        }
      }

      toast({
        variant: "destructive",
        title: "Erro",
        description: mensagem,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Recuperar senha</CardTitle>
        <CardDescription>Digite seu email para receber um link de recuperação de senha</CardDescription>
      </CardHeader>
      {!enviado ? (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={handleChange}
                className={error ? "border-destructive" : ""}
                required
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar link de recuperação
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      ) : (
        <CardContent className="space-y-4">
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Email enviado com sucesso</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
