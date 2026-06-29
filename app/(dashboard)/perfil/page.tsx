"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save, User } from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { obterDadosUsuario, atualizarDadosUsuario, atualizarSenhaUsuario } from "@/services/usuarioService"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { z } from "zod"

// Schema de validação para o perfil
const perfilSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z.string().optional(),
  cargo: z.string().optional(),
})

// Schema de validação para a senha
const senhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "A senha atual é obrigatória"),
    novaSenha: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres"),
    confirmacaoSenha: z.string(),
  })
  .refine((data) => data.novaSenha === data.confirmacaoSenha, {
    message: "As senhas não coincidem",
    path: ["confirmacaoSenha"],
  })

export default function PerfilPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [perfil, setPerfil] = useState({
    nome: "",
    email: "",
    telefone: "",
    cargo: "",
    dataCadastro: "",
    ultimoAcesso: "",
  })

  const [senhas, setSenhas] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmacaoSenha: "",
  })

  const [errosPerfil, setErrosPerfil] = useState<Record<string, string>>({})
  const [errosSenha, setErrosSenha] = useState<Record<string, string>>({})
  const [loadingPerfil, setLoadingPerfil] = useState(false)
  const [loadingSenha, setLoadingSenha] = useState(false)
  const [loadingDados, setLoadingDados] = useState(true)

  useEffect(() => {
    if (user) {
      carregarDadosUsuario()
    }
  }, [user])

  const carregarDadosUsuario = async () => {
    if (!user) return

    try {
      setLoadingDados(true)
      const dados = await obterDadosUsuario(user.uid)

      if (dados) {
        setPerfil({
          nome: dados.nome || user.displayName || "",
          email: dados.email || user.email || "",
          telefone: dados.telefone || "",
          cargo: dados.cargo || "",
          dataCadastro: dados.dataCadastro || "",
          ultimoAcesso: dados.ultimoAcesso || "",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados do perfil.",
      })
    } finally {
      setLoadingDados(false)
    }
  }

  const handlePerfilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPerfil((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Limpar erro do campo quando o usuário digita
    if (errosPerfil[name]) {
      setErrosPerfil((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const handleSenhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSenhas((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Limpar erro do campo quando o usuário digita
    if (errosSenha[name]) {
      setErrosSenha((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validarPerfil = () => {
    try {
      perfilSchema.parse(perfil)
      setErrosPerfil({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message
          }
        })
        setErrosPerfil(newErrors)
      }
      return false
    }
  }

  const validarSenha = () => {
    try {
      senhaSchema.parse(senhas)
      setErrosSenha({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message
          }
        })
        setErrosSenha(newErrors)
      }
      return false
    }
  }

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validarPerfil() || !user) {
      return
    }

    setLoadingPerfil(true)

    try {
      await atualizarDadosUsuario(user.uid, {
        nome: perfil.nome,
        email: perfil.email,
        telefone: perfil.telefone,
        cargo: perfil.cargo,
      })

      toast({
        title: "Perfil atualizado",
        description: "Seus dados foram atualizados com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
      })
    } finally {
      setLoadingPerfil(false)
    }
  }

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validarSenha() || !user) {
      return
    }

    setLoadingSenha(true)

    try {
      // Aqui você precisaria implementar a verificação da senha atual
      // e a atualização da nova senha
      await atualizarSenhaUsuario(user, senhas.novaSenha)

      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso.",
      })

      // Limpar campos de senha
      setSenhas({
        senhaAtual: "",
        novaSenha: "",
        confirmacaoSenha: "",
      })
    } catch (error) {
      console.error("Erro ao alterar senha:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar a senha.",
      })
    } finally {
      setLoadingSenha(false)
    }
  }

  if (loadingDados) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <User className="h-6 w-6" />
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
      </div>
      <p className="text-muted-foreground">Gerencie suas informações pessoais e senha</p>

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="perfil">Informações Pessoais</TabsTrigger>
          <TabsTrigger value="senha">Alterar Senha</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <Card>
            <form onSubmit={handleSalvarPerfil}>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>Atualize suas informações de perfil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input
                    id="nome"
                    name="nome"
                    value={perfil.nome}
                    onChange={handlePerfilChange}
                    className={errosPerfil.nome ? "border-destructive" : ""}
                  />
                  {errosPerfil.nome && <p className="text-sm text-destructive">{errosPerfil.nome}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={perfil.email}
                    onChange={handlePerfilChange}
                    className={errosPerfil.email ? "border-destructive" : ""}
                  />
                  {errosPerfil.email && <p className="text-sm text-destructive">{errosPerfil.email}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input id="telefone" name="telefone" value={perfil.telefone} onChange={handlePerfilChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input id="cargo" name="cargo" value={perfil.cargo} onChange={handlePerfilChange} disabled />
                  </div>
                </div>

                {perfil.dataCadastro && (
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground">
                      Cadastrado em: {new Date(perfil.dataCadastro).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={loadingPerfil}>
                  {loadingPerfil ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar alterações
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="senha">
          <Card>
            <form onSubmit={handleAlterarSenha}>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>Atualize sua senha de acesso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="senhaAtual">Senha atual</Label>
                  <Input
                    id="senhaAtual"
                    name="senhaAtual"
                    type="password"
                    value={senhas.senhaAtual}
                    onChange={handleSenhaChange}
                    className={errosSenha.senhaAtual ? "border-destructive" : ""}
                  />
                  {errosSenha.senhaAtual && <p className="text-sm text-destructive">{errosSenha.senhaAtual}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="novaSenha">Nova senha</Label>
                  <Input
                    id="novaSenha"
                    name="novaSenha"
                    type="password"
                    value={senhas.novaSenha}
                    onChange={handleSenhaChange}
                    className={errosSenha.novaSenha ? "border-destructive" : ""}
                  />
                  {errosSenha.novaSenha && <p className="text-sm text-destructive">{errosSenha.novaSenha}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmacaoSenha">Confirmar nova senha</Label>
                  <Input
                    id="confirmacaoSenha"
                    name="confirmacaoSenha"
                    type="password"
                    value={senhas.confirmacaoSenha}
                    onChange={handleSenhaChange}
                    className={errosSenha.confirmacaoSenha ? "border-destructive" : ""}
                  />
                  {errosSenha.confirmacaoSenha && (
                    <p className="text-sm text-destructive">{errosSenha.confirmacaoSenha}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={loadingSenha}>
                  {loadingSenha ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Alterar senha
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
