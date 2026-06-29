import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, serverTimestamp } from "firebase/firestore"
import { addMonths, addYears, format } from "date-fns"
import { ptBR } from "date-fns/locale"

// Função para calcular próxima data de vencimento
const calcularDataVencimento = (dataCriacao: string, cicloRenovacao: string): string => {
  const dataArray = dataCriacao.split("/")
  if (dataArray.length !== 3) return new Date().toLocaleDateString("pt-BR")
  
  const dataObj = new Date(`${dataArray[2]}-${dataArray[1]}-${dataArray[0]}`)
  let novaData: Date

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
  return format(novaData, "dd/MM/yyyy", { locale: ptBR })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const asaasToken = request.headers.get("asaas-access-token")

    console.log("Recebido Webhook do Asaas:", body.event)

    // Eventos que indicam sucesso no pagamento no Asaas
    if (body.event === "PAYMENT_RECEIVED" || body.event === "PAYMENT_CONFIRMED") {
      const payment = body.payment
      const billingId = payment.id

      if (!billingId) {
        return NextResponse.json({ error: "ID da cobrança ausente" }, { status: 400 })
      }

      // Buscar a hospedagem no Firestore pelo asaasBillingId
      const hospedagensRef = collection(db, "hospedagens")
      const q = query(hospedagensRef, where("asaasBillingId", "==", billingId))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        console.log(`Nenhuma hospedagem encontrada com o asaasBillingId: ${billingId}`)
        return NextResponse.json({ message: "Nenhuma hospedagem correspondente encontrada" }, { status: 200 })
      }

      // Registrar o pagamento no documento encontrado
      const docSnap = querySnapshot.docs[0]
      const hospedagemId = docSnap.id
      const hospedagemData = docSnap.data()

      // Formatar data do pagamento
      let dataPgtoFormatted = new Date().toLocaleDateString("pt-BR")
      if (payment.paymentDate) {
        const partes = payment.paymentDate.split("-")
        if (partes.length === 3) {
          dataPgtoFormatted = `${partes[2]}/${partes[1]}/${partes[0]}`
        }
      }

      const novoPagamento = {
        dataPagamento: dataPgtoFormatted,
        valorPago: payment.value,
        observacoes: `Baixa automática via Webhook do Asaas (ID: ${billingId})`,
        dataRegistro: new Date().toLocaleDateString("pt-BR"),
      }

      const novaDataVencimento = calcularDataVencimento(dataPgtoFormatted, hospedagemData.cicloRenovacao || "anual")
      const docRef = doc(db, "hospedagens", hospedagemId)
      
      // Atualizar o documento no Firestore com o novo pagamento
      // Nota: Para este webhook anônimo conseguir rodar em produção, as regras do firestore.rules
      // devem permitir escrita de dados legados ou usar Firebase Admin SDK.
      await updateDoc(docRef, {
        pagamentos: arrayUnion(novoPagamento),
        ultimoPagamento: dataPgtoFormatted,
        dataVencimento: novaDataVencimento,
        updatedAt: serverTimestamp(),
      })

      console.log(`Baixa de pagamento automática registrada com sucesso para a hospedagem ${hospedagemData.nome}!`)
      return NextResponse.json({ success: true, message: "Baixa registrada com sucesso" }, { status: 200 })
    }

    return NextResponse.json({ message: "Evento ignorado pelo sistema" }, { status: 200 })
  } catch (error) {
    console.error("Erro ao processar webhook do Asaas:", error)
    return NextResponse.json({ error: "Erro interno no processamento" }, { status: 500 })
  }
}
