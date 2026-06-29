import { db } from "@/lib/firebase"
import type { Hospedagem, Pagamento } from "@/types"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
  arrayUnion,
} from "firebase/firestore"
import { addMonths, addYears, format, isBefore, differenceInDays, differenceInMonths } from "date-fns"
import { ptBR } from "date-fns/locale"

// Coleção de hospedagens
const hospedagemCollection = collection(db, "hospedagens")

// Calcular data de vencimento com base no ciclo de renovação ou período antecipado
const calcularDataVencimento = (
  dataCriacao: string,
  cicloRenovacao: string,
  pagamentoAntecipado?: boolean,
  periodoAntecipado?: number,
): string => {
  // Converter data de string para objeto Date
  const dataArray = dataCriacao.split("/")
  const dataObj = new Date(`${dataArray[2]}-${dataArray[1]}-${dataArray[0]}`)

  let novaData: Date

  // Se for pagamento antecipado, calcular com base no período antecipado (em anos)
  if (pagamentoAntecipado && periodoAntecipado && periodoAntecipado > 0) {
    novaData = addYears(dataObj, periodoAntecipado)
  } else {
    // Caso contrário, calcular com base no ciclo de renovação
    switch (cicloRenovacao) {
      case "mensal":
        novaData = addMonths(dataObj, 1)
        break
      case "trimestral":
        novaData = addMonths(dataObj, 3)
        break
      case "semestral":
        novaData = addMonths(dataObj, 6)
        break
      case "anual":
      default:
        novaData = addYears(dataObj, 1)
        break
    }
  }

  // Formatar data para o formato brasileiro
  return format(novaData, "dd/MM/yyyy", { locale: ptBR })
}

// Converter string de data no formato brasileiro para objeto Date
export const converterStringParaDate = (dataString: string): Date => {
  if (!dataString) return new Date()

  const partes = dataString.split("/")
  if (partes.length !== 3) return new Date()

  return new Date(
    Number.parseInt(partes[2]), // ano
    Number.parseInt(partes[1]) - 1, // mês (0-11)
    Number.parseInt(partes[0]), // dia
  )
}

// Verificar se uma hospedagem está em atraso
export const verificarAtraso = (hospedagem: Hospedagem): { emAtraso: boolean; diasAtraso: number } => {
  if (!hospedagem.dataVencimento) {
    return { emAtraso: false, diasAtraso: 0 }
  }

  const hoje = new Date()
  const dataVencimento = converterStringParaDate(hospedagem.dataVencimento)

  // Se a data de vencimento é anterior à data atual, está em atraso
  const emAtraso = isBefore(dataVencimento, hoje)

  // Calcular dias de atraso
  const diasAtraso = emAtraso ? differenceInDays(hoje, dataVencimento) : 0

  return { emAtraso, diasAtraso }
}

// Verificar se os pagamentos estão em dia de acordo com o ciclo
export const verificarPagamentosEmDia = (
  hospedagem: Hospedagem,
): {
  emDia: boolean
  pagamentosEsperados: number
  pagamentosRealizados: number
  ultimoPagamentoEsperado: Date
} => {
  // Se não tem pagamentos, retorna que não está em dia
  if (!hospedagem.pagamentos || hospedagem.pagamentos.length === 0) {
    return {
      emDia: false,
      pagamentosEsperados: 1,
      pagamentosRealizados: 0,
      ultimoPagamentoEsperado: new Date(),
    }
  }

  const dataCriacao = converterStringParaDate(hospedagem.dataCriacao)
  const hoje = new Date()

  // Calcular quantos pagamentos deveriam ter sido feitos com base no ciclo
  let pagamentosEsperados = 0
  let ultimoPagamentoEsperado = dataCriacao

  // Se for pagamento antecipado, o número esperado é 1
  if (hospedagem.pagamentoAntecipado) {
    pagamentosEsperados = 1
  } else {
    // Caso contrário, calcular com base no ciclo
    switch (hospedagem.cicloRenovacao) {
      case "mensal":
        pagamentosEsperados = differenceInMonths(hoje, dataCriacao) + 1
        ultimoPagamentoEsperado = addMonths(dataCriacao, pagamentosEsperados - 1)
        break
      case "trimestral":
        pagamentosEsperados = Math.floor(differenceInMonths(hoje, dataCriacao) / 3) + 1
        ultimoPagamentoEsperado = addMonths(dataCriacao, (pagamentosEsperados - 1) * 3)
        break
      case "semestral":
        pagamentosEsperados = Math.floor(differenceInMonths(hoje, dataCriacao) / 6) + 1
        ultimoPagamentoEsperado = addMonths(dataCriacao, (pagamentosEsperados - 1) * 6)
        break
      case "anual":
      default:
        pagamentosEsperados = Math.floor(differenceInMonths(hoje, dataCriacao) / 12) + 1
        ultimoPagamentoEsperado = addMonths(dataCriacao, (pagamentosEsperados - 1) * 12)
        break
    }
  }

  // Número de pagamentos realizados
  const pagamentosRealizados = hospedagem.pagamentos.length

  // Verificar se está em dia
  const emDia = pagamentosRealizados >= pagamentosEsperados

  return {
    emDia,
    pagamentosEsperados,
    pagamentosRealizados,
    ultimoPagamentoEsperado,
  }
}

// Interface para informações detalhadas de atraso
export interface InfoAtraso {
  hospedagem: Hospedagem
  diasAtraso: number
  parcelasEmAtraso: number
  valorAcumulado: number
}

// Obter todas as hospedagens em atraso com informações detalhadas
export const obterHospedagensEmAtrasoDetalhado = async (userId: string): Promise<InfoAtraso[]> => {
  const hospedagens = await obterHospedagens(userId)
  const hospedagensEmAtraso: InfoAtraso[] = []

  for (const hospedagem of hospedagens) {
    const { emAtraso, diasAtraso } = verificarAtraso(hospedagem)

    if (emAtraso && hospedagem.status === "ativo") {
      // Calcular parcelas em atraso com base no ciclo de renovação
      let parcelasEmAtraso = 0

      if (diasAtraso > 0) {
        switch (hospedagem.cicloRenovacao) {
          case "mensal":
            parcelasEmAtraso = Math.ceil(diasAtraso / 30)
            break
          case "trimestral":
            parcelasEmAtraso = Math.ceil(diasAtraso / 90)
            break
          case "semestral":
            parcelasEmAtraso = Math.ceil(diasAtraso / 180)
            break
          case "anual":
          default:
            parcelasEmAtraso = Math.ceil(diasAtraso / 365)
            break
        }
      }

      // Calcular valor acumulado
      const valorAcumulado = hospedagem.valor * parcelasEmAtraso

      hospedagensEmAtraso.push({
        hospedagem,
        diasAtraso,
        parcelasEmAtraso,
        valorAcumulado,
      })
    }
  }

  // Ordenar por dias de atraso (do maior para o menor)
  return hospedagensEmAtraso.sort((a, b) => b.diasAtraso - a.diasAtraso)
}

// Obter todas as hospedagens em atraso
export const obterHospedagensEmAtraso = async (userId: string) => {
  const hospedagens = await obterHospedagens(userId)

  return hospedagens.filter((hospedagem) => {
    const { emAtraso } = verificarAtraso(hospedagem)
    return emAtraso && hospedagem.status === "ativo"
  })
}

// Adicionar nova hospedagem
export const adicionarHospedagem = async (hospedagem: Hospedagem, userId: string) => {
  // Definir ciclo de renovação padrão se não for fornecido
  const cicloRenovacao = hospedagem.cicloRenovacao || "anual"

  // Se a data de vencimento não foi fornecida manualmente, calcular com base no ciclo ou período antecipado
  let dataVencimento = hospedagem.dataVencimento
  if (!dataVencimento) {
    dataVencimento = calcularDataVencimento(
      hospedagem.dataCriacao,
      cicloRenovacao,
      hospedagem.pagamentoAntecipado,
      hospedagem.periodoAntecipado,
    )
  }

  const novaHospedagem = {
    ...hospedagem,
    userId,
    cicloRenovacao,
    dataVencimento,
    status: "ativo",
    createdAt: serverTimestamp(),
    pagamentos: [],
  }

  return await addDoc(hospedagemCollection, novaHospedagem)
}

// Obter todas as hospedagens
export const obterHospedagens = async (userId: string) => {
  const q = query(hospedagemCollection, where("userId", "==", userId), orderBy("dataCriacao", "desc"))
  const querySnapshot = await getDocs(q)

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Hospedagem[]
}

// Alias para obterHospedagens (para manter compatibilidade)
export const obterTodasHospedagens = obterHospedagens

// Obter hospedagens por ciclo de renovação
export const obterHospedagensPorCiclo = async (ciclo: string, userId: string) => {
  const q = query(hospedagemCollection, where("userId", "==", userId), where("cicloRenovacao", "==", ciclo))
  const querySnapshot = await getDocs(q)

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Hospedagem[]
}

// Obter hospedagens com pagamento antecipado
export const obterHospedagensPagamentoAntecipado = async (userId: string) => {
  const q = query(hospedagemCollection, where("userId", "==", userId), where("pagamentoAntecipado", "==", true))
  const querySnapshot = await getDocs(q)

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Hospedagem[]
}

// Obter hospedagem por ID
export const obterHospedagemPorId = async (id: string) => {
  const docRef = doc(db, "hospedagens", id)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Hospedagem
  }

  return null
}

// Atualizar hospedagem
export const atualizarHospedagem = async (id: string, dados: Partial<Hospedagem>) => {
  const docRef = doc(db, "hospedagens", id)

  // Se a data de vencimento não foi fornecida manualmente, mas outros parâmetros relevantes foram alterados,
  // recalcular a data de vencimento
  if (
    !dados.dataVencimento &&
    (dados.dataCriacao ||
      dados.cicloRenovacao ||
      dados.pagamentoAntecipado !== undefined ||
      dados.periodoAntecipado !== undefined) &&
    id
  ) {
    const hospedagemAtual = await obterHospedagemPorId(id)

    if (hospedagemAtual) {
      const dataCriacao = dados.dataCriacao || hospedagemAtual.dataCriacao
      const cicloRenovacao = dados.cicloRenovacao || hospedagemAtual.cicloRenovacao
      const pagamentoAntecipado =
        dados.pagamentoAntecipado !== undefined ? dados.pagamentoAntecipado : hospedagemAtual.pagamentoAntecipado
      const periodoAntecipado =
        dados.periodoAntecipado !== undefined ? dados.periodoAntecipado : hospedagemAtual.periodoAntecipado

      dados.dataVencimento = calcularDataVencimento(dataCriacao, cicloRenovacao, pagamentoAntecipado, periodoAntecipado)
    }
  }

  return await updateDoc(docRef, {
    ...dados,
    updatedAt: serverTimestamp(),
  })
}

// Renovar hospedagem
export const renovarHospedagem = async (id: string) => {
  const hospedagem = await obterHospedagemPorId(id)

  if (!hospedagem) {
    throw new Error("Hospedagem não encontrada")
  }

  // Calcular nova data de vencimento com base no ciclo de renovação ou período antecipado
  const dataVencimento = calcularDataVencimento(
    new Date().toLocaleDateString("pt-BR"), // Data atual como base para nova renovação
    hospedagem.cicloRenovacao,
    hospedagem.pagamentoAntecipado,
    hospedagem.periodoAntecipado,
  )

  // Atualizar hospedagem com nova data de vencimento e último pagamento
  return await atualizarHospedagem(id, {
    dataVencimento,
    ultimoPagamento: new Date().toLocaleDateString("pt-BR"),
  })
}

// Registrar pagamento
export interface RegistroPagamento {
  dataPagamento: string
  valorPago: number
  observacoes?: string
}

export const registrarPagamento = async (id: string, dados: RegistroPagamento) => {
  const docRef = doc(db, "hospedagens", id)

  // Obter a hospedagem atual para acessar o ciclo de renovação
  const hospedagem = await obterHospedagemPorId(id)

  if (!hospedagem) {
    throw new Error("Hospedagem não encontrada")
  }

  // Criar objeto de pagamento
  const novoPagamento: Pagamento = {
    dataPagamento: dados.dataPagamento,
    valorPago: dados.valorPago,
    observacoes: dados.observacoes,
    dataRegistro: new Date().toLocaleDateString("pt-BR"),
  }

  // Calcular nova data de vencimento com base na data do pagamento e ciclo de renovação
  const novaDataVencimento = calcularDataVencimento(
    dados.dataPagamento, // Usar a data do pagamento como base
    hospedagem.cicloRenovacao,
    hospedagem.pagamentoAntecipado,
    hospedagem.periodoAntecipado,
  )

  // Atualizar a hospedagem com o novo pagamento, data do último pagamento e nova data de vencimento
  return await updateDoc(docRef, {
    pagamentos: arrayUnion(novoPagamento),
    ultimoPagamento: dados.dataPagamento,
    dataVencimento: novaDataVencimento, // Atualizar a data de vencimento
    updatedAt: serverTimestamp(),
  })
}

// Excluir hospedagem
export const excluirHospedagem = async (id: string) => {
  const docRef = doc(db, "hospedagens", id)
  return await deleteDoc(docRef)
}

// Verificar hospedagens próximas do vencimento (30 dias)
export const verificarVencimentos = async (userId: string) => {
  const hoje = new Date()
  const trintaDiasDepois = new Date()
  trintaDiasDepois.setDate(hoje.getDate() + 30)

  const q = query(hospedagemCollection, where("userId", "==", userId))
  const querySnapshot = await getDocs(q)

  return querySnapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Hospedagem)
    .filter((hospedagem) => {
      if (!hospedagem.dataVencimento) return false

      const dataVenc = converterStringParaDate(hospedagem.dataVencimento)
      return dataVenc >= hoje && dataVenc <= trintaDiasDepois
    })
}

// Importar dados iniciais do JSON
export const importarDadosIniciais = async (dados: Hospedagem[], userId: string) => {
  const batch = []

  for (const item of dados) {
    batch.push(adicionarHospedagem(item, userId))
  }

  return Promise.all(batch)
}
