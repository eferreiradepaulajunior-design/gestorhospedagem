"use client"

import { useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, updateDoc, doc, writeBatch } from "firebase/firestore"
import { useAuth } from "@/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle2, Loader2, Database, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface MigrationResult {
  collection: string
  total: number
  updated: number
  skipped: number
}

export default function MigracaoPage() {
  const { user } = useAuth()
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [results, setResults] = useState<MigrationResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])

  const addLog = (message: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString("pt-BR")}] ${message}`])
  }

  const migrarColecao = async (nomeColecao: string, userId: string): Promise<MigrationResult> => {
    addLog(`Iniciando migração da coleção "${nomeColecao}"...`)

    const colecaoRef = collection(db, nomeColecao)
    const snapshot = await getDocs(colecaoRef)

    const result: MigrationResult = {
      collection: nomeColecao,
      total: snapshot.docs.length,
      updated: 0,
      skipped: 0,
    }

    addLog(`Encontrados ${snapshot.docs.length} documentos em "${nomeColecao}"`)

    // Processar em lotes de 500 (limite do Firestore batch)
    const BATCH_SIZE = 500
    let batchCount = 0

    for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db)
      const chunk = snapshot.docs.slice(i, i + BATCH_SIZE)

      for (const docSnap of chunk) {
        const data = docSnap.data()

        if (data.userId) {
          // Já tem userId, pular
          result.skipped++
          continue
        }

        // Adicionar userId ao documento
        const docRef = doc(db, nomeColecao, docSnap.id)
        batch.update(docRef, { userId })
        result.updated++
      }

      if (result.updated > batchCount) {
        await batch.commit()
        addLog(`Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${result.updated} documentos atualizados`)
      }
      batchCount = result.updated
    }

    addLog(
      `✅ "${nomeColecao}": ${result.updated} atualizados, ${result.skipped} já tinham userId (total: ${result.total})`,
    )

    return result
  }

  const executarMigracao = async () => {
    if (!user) {
      setError("Você precisa estar logado para executar a migração.")
      return
    }

    setRunning(true)
    setError(null)
    setResults([])
    setLog([])

    try {
      addLog(`Usuário logado: ${user.email} (UID: ${user.uid})`)
      addLog("─".repeat(50))

      // Migrar hospedagens
      const resultHospedagens = await migrarColecao("hospedagens", user.uid)

      // Migrar clientes
      const resultClientes = await migrarColecao("clientes", user.uid)

      addLog("─".repeat(50))
      addLog("🎉 Migração concluída com sucesso!")

      setResults([resultHospedagens, resultClientes])
      setCompleted(true)
    } catch (err) {
      console.error("Erro na migração:", err)
      const message = err instanceof Error ? err.message : "Erro desconhecido"
      setError(`Erro durante a migração: ${message}`)
      addLog(`❌ ERRO: ${message}`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Migração de Dados
          </CardTitle>
          <CardDescription>
            Adiciona o campo <code className="bg-muted px-1 py-0.5 rounded text-sm">userId</code> a todos os
            documentos existentes nas coleções <strong>hospedagens</strong> e <strong>clientes</strong> do Firestore.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Aviso */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800 dark:text-amber-300">Atenção</p>
              <ul className="mt-1 space-y-1 text-amber-700 dark:text-amber-400">
                <li>
                  • Todos os documentos <strong>sem</strong> userId serão atribuídos ao seu usuário:{" "}
                  <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">{user?.email || "..."}</code>
                </li>
                <li>• Documentos que já possuem userId serão ignorados (seguro para re-executar)</li>
                <li>• Execute esta migração apenas uma vez, com o usuário principal logado</li>
              </ul>
            </div>
          </div>

          {/* Botão de execução */}
          {!completed && (
            <Button onClick={executarMigracao} disabled={running || !user} size="lg" className="w-full">
              {running ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Migrando dados...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-5 w-5" />
                  Executar Migração
                </>
              )}
            </Button>
          )}

          {/* Erro */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Resultados */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Resultados
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.map((r) => (
                  <div key={r.collection} className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="font-medium text-green-800 dark:text-green-300 capitalize">{r.collection}</p>
                    <div className="mt-2 text-sm text-green-700 dark:text-green-400 space-y-1">
                      <p>Total: <strong>{r.total}</strong> documentos</p>
                      <p>Atualizados: <strong>{r.updated}</strong></p>
                      <p>Já tinham userId: <strong>{r.skipped}</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Log */}
          {log.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground">Log de Execução</h3>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs max-h-64 overflow-y-auto">
                {log.map((line, i) => (
                  <div key={i} className="py-0.5">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sucesso final */}
          {completed && (
            <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg text-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-green-800 dark:text-green-300">Migração concluída!</p>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                Todos os dados foram associados ao seu usuário. Você pode remover esta página.
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/dashboard">Voltar ao Dashboard</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
