import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"

export interface ConfiguracoesData {
  email: {
    smtpServer: string
    smtpPort: string
    smtpUser: string
    smtpPassword?: string
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
  asaas?: {
    apiKey: string
    env: "sandbox" | "production"
  }
}

// Obter as configurações do usuário do Firestore
export const obterConfiguracoes = async (userId: string): Promise<Partial<ConfiguracoesData> | null> => {
  try {
    const docRef = doc(db, "configuracoes", userId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data() as ConfiguracoesData
    }

    return null
  } catch (error) {
    console.error("Erro ao carregar configurações do Firestore:", error)
    throw error
  }
}

// Salvar as configurações do usuário no Firestore
export const salvarConfiguracoes = async (userId: string, dados: Partial<ConfiguracoesData>) => {
  try {
    const docRef = doc(db, "configuracoes", userId)
    return await setDoc(docRef, {
      ...dados,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  } catch (error) {
    console.error("Erro ao salvar configurações no Firestore:", error)
    throw error
  }
}
