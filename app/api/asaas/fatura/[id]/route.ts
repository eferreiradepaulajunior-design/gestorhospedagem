import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Obter o Token de Autorização do Header
    const authHeader = request.headers.get("Authorization")
    let uid = ""

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      try {
        const parts = token.split(".")
        if (parts.length === 3) {
          // Decodificar o payload Base64 do JWT para ler o UID (sub)
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"))
          uid = payload.sub || ""
        }
      } catch (e) {
        console.error("Erro ao decodificar ID Token:", e)
      }
    }

    // Variáveis Padrão (Fallback para o .env.local)
    let apiKey = process.env.ASAAS_API_KEY
    let apiUrl = process.env.ASAAS_API_URL || "https://sandbox.asaas.com/api/v3"

    // Se temos o uid do usuário, tentar obter a chave de API das configurações dele no Firestore
    if (uid) {
      try {
        const docRef = doc(db, "configuracoes", uid)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const configData = docSnap.data()
          if (configData.asaas && configData.asaas.apiKey) {
            apiKey = configData.asaas.apiKey
            apiUrl = configData.asaas.env === "production"
              ? "https://api.asaas.com/v3"
              : "https://sandbox.asaas.com/api/v3"
          }
        }
      } catch (err) {
        console.error("Erro ao carregar chave do Asaas do Firestore:", err)
      }
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "A chave de API do Asaas não está configurada. Configure a sua chave em Configurações > Asaas." },
        { status: 500 }
      )
    }

    if (!id) {
      return NextResponse.json(
        { error: "O ID da fatura é obrigatório." },
        { status: 400 }
      )
    }

    const response = await fetch(`${apiUrl}/payments/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        access_token: apiKey,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { 
          error: "Erro ao consultar a fatura no Asaas.", 
          details: errorData 
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Status de pagamento que representam sucesso no Asaas
    const estaPago = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(data.status)

    return NextResponse.json({
      id: data.id,
      status: data.status,
      valor: data.value,
      pago: estaPago,
      dataPagamento: data.paymentDate || data.clientPaymentDate || null,
      dueDate: data.dueDate,
      invoiceUrl: data.invoiceUrl || null,
      netValue: data.netValue || null,
    })
  } catch (error) {
    console.error("Erro na API de consulta do Asaas:", error)
    return NextResponse.json(
      { error: "Ocorreu um erro interno ao processar a consulta." },
      { status: 500 }
    )
  }
}
