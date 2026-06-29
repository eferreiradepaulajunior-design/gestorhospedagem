import type { Hospedagem, Cliente } from "@/types"

// Função para converter array de objetos para CSV
export const converterParaCsv = <T extends Record<string, any>>(
  dados: T[],
  colunas: { chave: keyof T; titulo: string }[],
): string => {
  // Cabeçalho
  const cabecalho = colunas.map((coluna) => coluna.titulo).join(",")

  // Linhas
  const linhas = dados.map((item) => {
    return colunas
      .map((coluna) => {
        const valor = item[coluna.chave]

        // Tratar valores especiais
        if (valor === null || valor === undefined) {
          return ""
        }

        if (typeof valor === "string") {
          // Escapar aspas e adicionar aspas ao redor de strings
          return `"${valor.replace(/"/g, '""')}"`
        }

        if (Array.isArray(valor)) {
          return `"${valor.join("; ")}"`
        }

        return valor
      })
      .join(",")
  })

  return [cabecalho, ...linhas].join("\n")
}

// Função para exportar hospedagens para CSV
export const exportarHospedagensCsv = (hospedagens: Hospedagem[]): string => {
  const colunas = [
    { chave: "nome" as keyof Hospedagem, titulo: "Nome" },
    { chave: "dataCriacao" as keyof Hospedagem, titulo: "Data de Criação" },
    { chave: "dataVencimento" as keyof Hospedagem, titulo: "Data de Vencimento" },
    { chave: "valor" as keyof Hospedagem, titulo: "Valor" },
    { chave: "status" as keyof Hospedagem, titulo: "Status" },
    { chave: "cliente" as keyof Hospedagem, titulo: "Cliente" },
    { chave: "observacoes" as keyof Hospedagem, titulo: "Observações" },
    { chave: "ultimoPagamento" as keyof Hospedagem, titulo: "Último Pagamento" },
  ]

  return converterParaCsv(hospedagens, colunas)
}

// Função para exportar clientes para CSV
export const exportarClientesCsv = (clientes: Cliente[]): string => {
  const colunas = [
    { chave: "nome" as keyof Cliente, titulo: "Nome" },
    { chave: "email" as keyof Cliente, titulo: "Email" },
    { chave: "telefone" as keyof Cliente, titulo: "Telefone" },
    { chave: "sites" as keyof Cliente, titulo: "Sites" },
  ]

  return converterParaCsv(clientes, colunas)
}

// Função para fazer download do CSV
export const downloadCsv = (conteudo: string, nomeArquivo: string): void => {
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", nomeArquivo)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Função genérica para exportar qualquer array de objetos para CSV
export const exportarCSV = <T extends Record<string, any>>(dados: T[], nomeArquivo: string): void => {
  if (dados.length === 0) {
    return
  }

  // Pegar as chaves do primeiro objeto como cabeçalho
  const colunas = Object.keys(dados[0]).map((chave) => ({
    chave: chave as keyof T,
    titulo: chave,
  }))

  const conteudo = converterParaCsv(dados, colunas)
  downloadCsv(conteudo, `${nomeArquivo}.csv`)
}
