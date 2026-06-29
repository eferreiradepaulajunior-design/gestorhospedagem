"use client"

import type React from "react"

import { useState } from "react"
import { fazerLogin } from "@/services/usuarioService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Lock, Mail } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export function AuthForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await fazerLogin(email, password)
      // O redirecionamento será tratado pelo AuthProvider
    } catch (error: unknown) {
      console.error("Erro de autenticação detalhado:", error)

      let mensagem = "Ocorreu um erro ao fazer login."

      if (error && typeof error === "object") {
        const errObj = error as Record<string, unknown>
        if ("code" in errObj && typeof errObj.code === "string") {
          const code = errObj.code
          if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
            mensagem = "Email ou senha inválidos."
          } else if (code === "auth/invalid-email") {
            mensagem = "Formato de e-mail inválido."
          } else if (code === "auth/user-disabled") {
            mensagem = "Esta conta foi desativada."
          } else if (code === "auth/too-many-requests") {
            mensagem = "Muitas tentativas falhas. Tente novamente mais tarde."
          } else {
            mensagem = `Erro (${code}): ${errObj.message || "Falha na autenticação"}`
          }
        } else if ("message" in errObj && typeof errObj.message === "string") {
          mensagem = errObj.message
        }
      }

      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: mensagem,
      })

      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">Entre com suas credenciais para acessar o sistema</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <Link
                  href="/recuperar-senha"
                  className="text-xs text-primary hover:underline hover:text-primary/80 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit" disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Não tem uma conta? </span>
              <Link
                href="/cadastro"
                className="text-primary hover:underline hover:text-primary/80 transition-colors font-medium"
              >
                Cadastre-se
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  )
}
