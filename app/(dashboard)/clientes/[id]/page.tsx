"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2, Plus, Trash2, Search, MapPin, Building2, Globe } from "lucide-react"
import Link from "next/link"
import type { Cliente } from "@/types"
import { obterClientePorId, adicionarCliente, atualizarCliente } from "@/services/clienteService"
import { useAuth } from "@/providers/auth-provider"

export default function ClienteFormPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const id = params.id as string
  const isNovo = id === "novo"

  const [cliente, setCliente] = useState<Partial<Cliente>>({
    nome: "",
    email: "",
    telefone: "",
    sites: [""],
    cnpj: "",
    razaoSocial: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
  })

  const [cnpjBusca, setCnpjBusca] = useState("")
  const [buscandoCnpj, setBuscandoCnpj] = useState(false)
  const [loading, setLoading] = useState(!isNovo)
  const [saving, setSaving] = useState(false)

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value.length > 14) value = value.slice(0, 14)
    
    // Aplicar máscara XX.XXX.XXX/XXXX-XX
    if (value.length > 12) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
    } else if (value.length > 8) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})$/, "$1.$2.$3/$4")
    } else if (value.length > 5) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})$/, "$1.$2.$3")
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{3})$/, "$1.$2")
    }
    
    setCnpjBusca(value)
  }

  const handleBuscarCnpj = async () => {
    const cnpjLimpo = cnpjBusca.replace(/\D/g, "")
    if (cnpjLimpo.length !== 14) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Digite um CNPJ válido com 14 dígitos.",
      })
      return
    }

    setBuscandoCnpj(true)
    try {
      const response = await fetch(`https://publica.cnpj.ws/cnpj/${cnpjLimpo}`)
      
      if (!response.ok) {
        throw new Error("CNPJ não encontrado ou erro na consulta.")
      }

      const data = await response.json()
      
      const nomeFantasia = data.nome_fantasia || ""
      const razaoSocial = data.razao_social || ""
      const nomeEmpresa = nomeFantasia || razaoSocial
      
      const emailEmpresa = data.estabelecimento?.email || ""
      let telefoneEmpresa = ""
      if (data.estabelecimento?.ddd1 && data.estabelecimento?.telefone1) {
        telefoneEmpresa = `(${data.estabelecimento.ddd1}) ${data.estabelecimento.telefone1}`
      }

      const est = data.estabelecimento || {}
      const logradouroCompleto = est.tipo_logradouro 
        ? `${est.tipo_logradouro} ${est.logradouro || ""}`.trim()
        : (est.logradouro || "")

      setCliente((prev) => ({
        ...prev,
        nome: prev.nome || nomeEmpresa,
        razaoSocial: prev.razaoSocial || razaoSocial,
        cnpj: prev.cnpj || est.cnpj || cnpjLimpo,
        email: prev.email || emailEmpresa,
        telefone: prev.telefone || telefoneEmpresa,
        cep: prev.cep || est.cep || "",
        logradouro: prev.logradouro || logradouroCompleto,
        numero: prev.numero || est.numero || "",
        complemento: prev.complemento || est.complemento || "",
        bairro: prev.bairro || est.bairro || "",
        cidade: prev.cidade || est.cidade?.nome || "",
        uf: prev.uf || est.estado?.sigla || "",
      }))

      toast({
        title: "CNPJ Encontrado",
        description: `Dados de "${nomeEmpresa}" importados com sucesso!`,
      })
    } catch (err) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Erro na consulta",
        description: err instanceof Error ? err.message : "Não foi possível buscar os dados do CNPJ.",
      })
    } finally {
      setBuscandoCnpj(false)
    }
  }

  useEffect(() => {
    if (!isNovo) {
      carregarCliente()
    }
  }, [id, isNovo])

  const carregarCliente = async () => {
    try {
      setLoading(true)

      // Buscar cliente do banco de dados
      const dadosCliente = await obterClientePorId(id)

      if (dadosCliente) {
        setCliente(dadosCliente)
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Cliente não encontrado.",
        })
        router.push("/clientes")
      }
    } catch (error) {
      console.error("Erro ao carregar cliente:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados do cliente.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCliente((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSiteChange = (index: number, value: string) => {
    setCliente((prev) => {
      const updatedSites = [...(prev.sites || [])]
      updatedSites[index] = value
      return {
        ...prev,
        sites: updatedSites,
      }
    })
  }

  const handleAddSite = () => {
    setCliente((prev) => ({
      ...prev,
      sites: [...(prev.sites || []), ""],
    }))
  }

  const handleRemoveSite = (index: number) => {
    setCliente((prev) => {
      const updatedSites = [...(prev.sites || [])]
      updatedSites.splice(index, 1)
      return {
        ...prev,
        sites: updatedSites,
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (isNovo) {
        // Adicionar novo cliente ao banco de dados
        await adicionarCliente(cliente as Cliente, user!.uid)
        toast({
          title: "Sucesso",
          description: "Cliente adicionado com sucesso.",
        })
      } else {
        // Atualizar cliente existente no banco de dados
        await atualizarCliente(id, cliente)
        toast({
          title: "Sucesso",
          description: "Cliente atualizado com sucesso.",
        })
      }

      router.push("/clientes")
    } catch (error) {
      console.error("Erro ao salvar cliente:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar o cliente.",
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
          <Link href="/clientes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{isNovo ? "Novo Cliente" : "Editar Cliente"}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Dados Cadastrais Completos</CardTitle>
            <CardDescription>Preencha os dados da empresa e endereço do cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bloco de consulta do CNPJ */}
            {isNovo && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cnpjBusca" className="font-semibold text-blue-900 dark:text-blue-300">
                    Consulta rápida de CNPJ (Preenche tudo automaticamente)
                  </Label>
                  <Input
                    id="cnpjBusca"
                    placeholder="00.000.000/0000-00"
                    value={cnpjBusca}
                    onChange={handleCnpjChange}
                    className="bg-white dark:bg-gray-950"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleBuscarCnpj}
                  disabled={buscandoCnpj}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {buscandoCnpj ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Consultando...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Consultar CNPJ
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Seção 1: Informações da Empresa */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Dados da Empresa / Contato
              </h3>
              <div className="h-px bg-gray-200 dark:bg-gray-800" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="razaoSocial">Razão Social</Label>
                  <Input
                    id="razaoSocial"
                    name="razaoSocial"
                    value={cliente.razaoSocial || ""}
                    onChange={handleChange}
                    placeholder="Razão Social da Empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    name="cnpj"
                    value={cliente.cnpj || ""}
                    onChange={handleChange}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nome">Nome do Cliente / Fantasia</Label>
                  <Input
                    id="nome"
                    name="nome"
                    value={cliente.nome || ""}
                    onChange={handleChange}
                    placeholder="Nome de exibição ou Nome Fantasia"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    name="telefone"
                    value={cliente.telefone || ""}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={cliente.email || ""}
                  onChange={handleChange}
                  placeholder="contato@cliente.com"
                  required
                />
              </div>
            </div>

            {/* Seção 2: Endereço */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Dados de Endereço
              </h3>
              <div className="h-px bg-gray-200 dark:bg-gray-800" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    name="cep"
                    value={cliente.cep || ""}
                    onChange={handleChange}
                    placeholder="00000-000"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="logradouro">Logradouro (Rua/Av.)</Label>
                  <Input
                    id="logradouro"
                    name="logradouro"
                    value={cliente.logradouro || ""}
                    onChange={handleChange}
                    placeholder="Rua, Avenida, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    name="numero"
                    value={cliente.numero || ""}
                    onChange={handleChange}
                    placeholder="123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    name="complemento"
                    value={cliente.complemento || ""}
                    onChange={handleChange}
                    placeholder="Sala 402, Bloco B"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    name="bairro"
                    value={cliente.bairro || ""}
                    onChange={handleChange}
                    placeholder="Bairro"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    name="cidade"
                    value={cliente.cidade || ""}
                    onChange={handleChange}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uf">UF (Estado)</Label>
                  <Input
                    id="uf"
                    name="uf"
                    value={cliente.uf || ""}
                    onChange={handleChange}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            {/* Seção 3: Sites */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Sites / Domínios Registrados
              </h3>
              <div className="h-px bg-gray-200 dark:bg-gray-800" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Adicione os sites associados a este cliente</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddSite} className="h-8">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Adicionar Site
                  </Button>
                </div>

                {cliente.sites &&
                  cliente.sites.map((site, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={site}
                        onChange={(e) => handleSiteChange(index, e.target.value)}
                        placeholder="exemplo.com.br"
                        className="flex-1"
                      />
                      {cliente.sites && cliente.sites.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSite(index)}
                          className="text-destructive h-9 w-9"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-6 bg-gray-50/50 dark:bg-gray-900/10">
            <Button variant="outline" type="button" asChild>
              <Link href="/clientes">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={saving} className="min-w-[120px]">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isNovo ? "Adicionar Cliente" : "Atualizar Cadastro"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
