import { db } from "@/lib/firebase"
import type { Cliente } from "@/types"
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
} from "firebase/firestore"

// Coleção de clientes
const clienteCollection = collection(db, "clientes")

// Adicionar novo cliente
export const adicionarCliente = async (cliente: Cliente, userId: string) => {
  const novoCliente = {
    ...cliente,
    userId,
    createdAt: serverTimestamp(),
  }

  return await addDoc(clienteCollection, novoCliente)
}

// Obter todos os clientes
export const obterClientes = async (userId: string) => {
  const q = query(clienteCollection, where("userId", "==", userId), orderBy("nome", "asc"))
  const querySnapshot = await getDocs(q)

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Cliente[]
}

// Obter cliente por ID
export const obterClientePorId = async (id: string) => {
  const docRef = doc(db, "clientes", id)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Cliente
  }

  return null
}

// Atualizar cliente
export const atualizarCliente = async (id: string, dados: Partial<Cliente>) => {
  const docRef = doc(db, "clientes", id)
  return await updateDoc(docRef, {
    ...dados,
    updatedAt: serverTimestamp(),
  })
}

// Excluir cliente
export const excluirCliente = async (id: string) => {
  const docRef = doc(db, "clientes", id)
  return await deleteDoc(docRef)
}
