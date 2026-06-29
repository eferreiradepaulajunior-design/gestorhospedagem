"use client"

import { cn } from "@/lib/utils"

import type React from "react"

import { useState } from "react"
import { criarUsuario } from "@/services/usuarioService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, UserPlus, User, Mail, Lock, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import Link from "next/link"
import { motion } from "framer-motion"

// Schema de validação
const registerSchema = z
  .object({
    nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("Email inválido"),
    senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmacaoSenha: z.string(),
  })
  .refine((data) => data.senha === data.confirmacaoSenha, {
    message: "As senhas não coincidem",
    path: ["confirmacaoSenha"],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    nome: "",
    email: "",
    senha: "",
    confirmacaoSenha: "",
  })
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Limpar erro do campo quando o usuário digita
    if (errors[name as keyof RegisterFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const validateForm = () => {
    try {
      registerSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof RegisterFormData, string>> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof RegisterFormData] = err.message
          }
        })
        setErrors(newErrors)
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
      // Criar usuário usando o serviço
      await criarUsuario(formData.email, formData.senha, formData.nome)

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Você será redirecionado para o dashboard.",
      })

      // Redirecionar para o dashboard após o cadastro
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (error: unknown) {
      console.error("Erro ao cadastrar:", error)

      let mensagem = "Ocorreu um erro ao realizar o cadastro."

      if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string }
        if (firebaseError.code === "auth/email-already-in-use") {
          mensagem = "Este email já está em uso."
        }
      }

      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: mensagem,
      })

      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <CardTitle className="text-2xl font-bold">Criar conta</CardTitle>
            <div className="w-4"></div> {/* Espaçador para centralizar o título */}
          </div>
          <CardDescription className="text-center">
            Preencha os dados abaixo para se cadastrar no sistema
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium">
                Nome completo
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nome"
                  name="nome"
                  placeholder="Seu nome completo"
                  value={formData.nome}
                  onChange={handleChange}
                  className={cn("pl-10", errors.nome ? "border-destructive" : "")}
                />
              </div>
              {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={cn("pl-10", errors.email ? "border-destructive" : "")}
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha" className="text-sm font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="senha"
                  name="senha"
                  type="password"
                  placeholder="Sua senha"
                  value={formData.senha}
                  onChange={handleChange}
                  className={cn("pl-10", errors.senha ? "border-destructive" : "")}
                />
              </div>
              {errors.senha && <p className="text-sm text-destructive">{errors.senha}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmacaoSenha" className="text-sm font-medium">
                Confirmar senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmacaoSenha"
                  name="confirmacaoSenha"
                  type="password"
                  placeholder="Confirme sua senha"
                  value={formData.confirmacaoSenha}
                  onChange={handleChange}
                  className={cn("pl-10", errors.confirmacaoSenha ? "border-destructive" : "")}
                />
              </div>
              {errors.confirmacaoSenha && <p className="text-sm text-destructive">{errors.confirmacaoSenha}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit" disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cadastrar
                </>
              )}
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Já tem uma conta? </span>
              <Link
                href="/login"
                className="text-primary hover:underline hover:text-primary/80 transition-colors font-medium"
              >
                Faça login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  )
}
