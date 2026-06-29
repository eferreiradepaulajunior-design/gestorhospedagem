"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save, Settings, Mail, Bell, Database, RefreshCw, Key, ShieldCheck } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/providers/auth-provider"
import { obterConfiguracoes, salvarConfiguracoes } from "@/services/configuracaoService"

export default function ConfiguracoesPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState("")

  const [emailConfig, setEmailConfig] = useState({
    smtpServer: "smtp.gmail.com",
    smtpPort: "587",
    smtpUser: "seu@email.com",
    smtpPassword: "",
    emailRemetente: "seu@email.com",
    emailAssunto: "Alerta de Vencimento - Sistema de Hospedagens",
  })

  const [notificacoes, setNotificacoes] = useState({
    alertaVencimento30Dias: true,
    alertaVencimento15Dias: true,
    alertaVencimento7Dias: true,
    alertaVencimento1Dia: true,
    alertaHospedagemInativa: true,
  })

  const [sistema, setSistema] = useState({
    diasAlertaVencimento: "30",
    moedaPadrao: "BRL",
    temaEscuro: false,
  })

  const [asaas, setAsaas] = useState({
    apiKey: "",
    env: "sandbox" as "sandbox" | "production",
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWebhookUrl(`https://${window.location.host}/api/webhooks/asaas`)
    }

    const carregarConfiguracoes = async () => {
      if (!user) return
      try {
        setLoading(true)
        const configs = await obterConfiguracoes(user.uid)
        
        if (configs) {
          if (configs.email) setEmailConfig((prev) => ({ ...prev, ...configs.email }))
          if (configs.notificacoes) setNotificacoes((prev) => ({ ...prev, ...configs.notificacoes }))
          if (configs.sistema) setSistema((prev) => ({ ...prev, ...configs.sistema }))
          if (configs.asaas) setAsaas((prev) => ({ ...prev, ...configs.asaas }))
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error)
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar as configurações do banco.",
        })
      } finally {
        setLoading(false)
      }
    }

    carregarConfiguracoes()
  }, [user])

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEmailConfig((prev) => ({ ...prev, [name]: value }))
  }

  const handleNotificacoesChange = (name: string, checked: boolean) => {
    setNotificacoes((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSistemaChange = (name: string, value: string | boolean) => {
    setSistema((prev) => ({ ...prev, [name]: value }))
  }

  const handleAsaasChange = (name: string, value: string) => {
    setAsaas((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)

    try {
      await salvarConfiguracoes(user.uid, {
        email: emailConfig,
        notificacoes,
        sistema,
        asaas,
      })

      toast({
        title: "Configurações salvas",
        description: "Suas configurações foram persistidas com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar as configurações no Firestore.",
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
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
      </div>
      <p className="text-muted-foreground">Gerencie as configurações e integrações do sistema</p>

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Sistema</span>
          </TabsTrigger>
          <TabsTrigger value="asaas" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Asaas</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Email */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Email</CardTitle>
              <CardDescription>Configure o servidor SMTP para envio de notificações por email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpServer">Servidor SMTP</Label>
                  <Input
                    id="smtpServer"
                    name="smtpServer"
                    value={emailConfig.smtpServer}
                    onChange={handleEmailChange}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">Porta SMTP</Label>
                  <Input id="smtpPort" name="smtpPort" value={emailConfig.smtpPort} onChange={handleEmailChange} placeholder="587" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">Usuário SMTP</Label>
                  <Input id="smtpUser" name="smtpUser" value={emailConfig.smtpUser} onChange={handleEmailChange} placeholder="seu@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">Senha SMTP</Label>
                  <Input
                    id="smtpPassword"
                    name="smtpPassword"
                    type="password"
                    value={emailConfig.smtpPassword}
                    onChange={handleEmailChange}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailRemetente">Email do Remetente</Label>
                <Input
                  id="emailRemetente"
                  name="emailRemetente"
                  value={emailConfig.emailRemetente}
                  onChange={handleEmailChange}
                  placeholder="remetente@empresa.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailAssunto">Assunto Padrão</Label>
                <Input
                  id="emailAssunto"
                  name="emailAssunto"
                  value={emailConfig.emailAssunto}
                  onChange={handleEmailChange}
                  placeholder="Aviso de Fatura"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tab Notificações */}
        <TabsContent value="notificacoes">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>Configure quando e como você deseja receber notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Alertas de Vencimento</h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="alertaVencimento30Dias">Alerta 30 dias antes</Label>
                    <p className="text-sm text-muted-foreground">Receba um alerta 30 dias antes do vencimento</p>
                  </div>
                  <Switch
                    id="alertaVencimento30Dias"
                    checked={notificacoes.alertaVencimento30Dias}
                    onCheckedChange={(checked) => handleNotificacoesChange("alertaVencimento30Dias", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="alertaVencimento15Dias">Alerta 15 dias antes</Label>
                    <p className="text-sm text-muted-foreground">Receba um alerta 15 dias antes do vencimento</p>
                  </div>
                  <Switch
                    id="alertaVencimento15Dias"
                    checked={notificacoes.alertaVencimento15Dias}
                    onCheckedChange={(checked) => handleNotificacoesChange("alertaVencimento15Dias", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="alertaVencimento7Dias">Alerta 7 dias antes</Label>
                    <p className="text-sm text-muted-foreground">Receba um alerta 7 dias antes do vencimento</p>
                  </div>
                  <Switch
                    id="alertaVencimento7Dias"
                    checked={notificacoes.alertaVencimento7Dias}
                    onCheckedChange={(checked) => handleNotificacoesChange("alertaVencimento7Dias", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="alertaVencimento1Dia">Alerta 1 dia antes</Label>
                    <p className="text-sm text-muted-foreground">Receba um alerta 1 dia antes do vencimento</p>
                  </div>
                  <Switch
                    id="alertaVencimento1Dia"
                    checked={notificacoes.alertaVencimento1Dia}
                    onCheckedChange={(checked) => handleNotificacoesChange("alertaVencimento1Dia", checked)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Outros Alertas</h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="alertaHospedagemInativa">Hospedagens inativas</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba alertas sobre hospedagens que ficaram inativas
                    </p>
                  </div>
                  <Switch
                    id="alertaHospedagemInativa"
                    checked={notificacoes.alertaHospedagemInativa}
                    onCheckedChange={(checked) => handleNotificacoesChange("alertaHospedagemInativa", checked)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tab Sistema */}
        <TabsContent value="sistema">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>Configure as preferências gerais do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="diasAlertaVencimento">Dias para alerta de vencimento</Label>
                  <Select
                    value={sistema.diasAlertaVencimento}
                    onValueChange={(value) => handleSistemaChange("diasAlertaVencimento", value)}
                  >
                    <SelectTrigger id="diasAlertaVencimento">
                      <SelectValue placeholder="Selecione os dias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="45">45 dias</SelectItem>
                      <SelectItem value="60">60 dias</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Define quantos dias antes do vencimento os itens aparecerão na lista de vencimentos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="moedaPadrao">Moeda padrão</Label>
                  <Select
                    value={sistema.moedaPadrao}
                    onValueChange={(value) => handleSistemaChange("moedaPadrao", value)}
                  >
                    <SelectTrigger id="moedaPadrao">
                      <SelectValue placeholder="Selecione a moeda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (R$)</SelectItem>
                      <SelectItem value="USD">Dólar (US$)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="temaEscuro">Tema escuro</Label>
                    <p className="text-sm text-muted-foreground">Ativar o tema escuro para o sistema</p>
                  </div>
                  <Switch
                    id="temaEscuro"
                    checked={sistema.temaEscuro}
                    onCheckedChange={(checked) => handleSistemaChange("temaEscuro", checked)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Backup e Restauração</h3>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" type="button">Exportar Dados</Button>
                  <Button variant="outline" type="button">Importar Backup</Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tab Asaas (Nova!) */}
        <TabsContent value="asaas">
          <Card>
            <CardHeader>
              <CardTitle>Integração com Asaas</CardTitle>
              <CardDescription>Configure a sua chave de API para validação automática de faturas de hospedagem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 border rounded-xl p-4 bg-gray-50 dark:bg-gray-800/20">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                  <Key className="h-4 w-4" />
                  Credenciais Asaas
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="asaasApiKey">Chave de API (Access Token)</Label>
                  <Input
                    id="asaasApiKey"
                    type="password"
                    value={asaas.apiKey}
                    onChange={(e) => handleAsaasChange("apiKey", e.target.value)}
                    placeholder="$asaas_access_token_..."
                    className="font-mono text-sm bg-white dark:bg-gray-950"
                  />
                  <p className="text-xs text-muted-foreground">
                    Obtenha o seu Token de Acesso em: <strong>Painel do Asaas &gt; Minha Conta &gt; Integrações &gt; Gerar Token</strong>.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="asaasEnv">Ambiente de Execução</Label>
                  <Select
                    value={asaas.env}
                    onValueChange={(value) => handleAsaasChange("env", value)}
                  >
                    <SelectTrigger id="asaasEnv" className="bg-white dark:bg-gray-950">
                      <SelectValue placeholder="Selecione o ambiente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox (Ambiente de Testes / Homologação)</SelectItem>
                      <SelectItem value="production">Produção (Ambiente Real com dinheiro real)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Informações sobre Webhook */}
              <div className="space-y-4 border rounded-xl p-4 bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/50">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-blue-900 dark:text-blue-300">
                  <ShieldCheck className="h-4 w-4 text-blue-500" />
                  Automatização Total via Webhook (Recomendado)
                </h3>
                <p className="text-xs text-blue-800 dark:text-blue-400">
                  Configure o Webhook no painel do Asaas para que a baixa seja realizada **imediatamente e de forma 100% automática** quando a fatura for paga, sem precisar clicar no botão de Sincronizar.
                </p>

                <div className="space-y-2">
                  <Label className="text-blue-900 dark:text-blue-300">URL do seu Webhook:</Label>
                  <Input
                    readOnly
                    value={webhookUrl}
                    className="bg-white dark:bg-gray-950 font-mono text-xs select-all text-blue-700 dark:text-blue-400"
                    onClick={(e) => {
                      (e.target as HTMLInputElement).select()
                      navigator.clipboard.writeText(webhookUrl)
                      toast({
                        title: "Copiado",
                        description: "URL do webhook copiada para a área de transferência.",
                      })
                    }}
                  />
                  <p className="text-[10px] text-blue-700/80 dark:text-blue-400/80">
                    Clique no campo acima para copiar a URL. Configure-a no Asaas em: <strong>Minha Conta &gt; Integrações &gt; Webhooks &gt; Fila de Cobrança</strong>. Selecione o evento <strong>"Pagamento Confirmado" (PAYMENT_RECEIVED)</strong>.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
