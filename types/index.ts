export interface Pagamento {
  id?: string
  dataPagamento: string
  valorPago: number
  observacoes?: string
  dataRegistro: string
}

export interface Hospedagem {
  id?: string
  nome: string
  dataCriacao: string
  valor: number
  dataVencimento?: string
  status?: "ativo" | "inativo" | "pendente"
  cliente?: string
  observacoes?: string
  ultimoPagamento?: string
  cicloRenovacao: "mensal" | "trimestral" | "semestral" | "anual"
  pagamentoAntecipado?: boolean
  periodoAntecipado?: number
  emailContato?: string
  telefoneContato?: string
  pagamentos?: Pagamento[]
  asaasBillingId?: string
}

export interface Cliente {
  id?: string
  nome: string
  email: string
  telefone: string
  sites: string[]
  cnpj?: string
  razaoSocial?: string
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
}

export interface Configuracao {
  id?: string
  email: {
    smtpServer: string
    smtpPort: string
    smtpUser: string
    smtpPassword: string
    emailRemetente: string
    emailAssunto: string
  }
  notificacoes: {
    alertaVencimento30Dias: boolean
    alertaVencimento15Dias: boolean
    alertaVencimento7Dias: boolean
    alertaVencimento1Dia: boolean
    alertaHospedagemInativa: boolean
  }
  sistema: {
    diasAlertaVencimento: string
    moedaPadrao: string
    temaEscuro: boolean
  }
}
