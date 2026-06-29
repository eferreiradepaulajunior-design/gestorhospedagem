import { db, auth } from "@/lib/firebase"
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  type User,
} from "firebase/auth"
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"

export interface UsuarioData {
  nome: string
  email: string
  cargo?: string
  telefone?: string
  dataCadastro?: string
  ultimoAcesso?: string
}

// Criar novo usuário
export const criarUsuario = async (email: string, senha: string, nome: string) => {
  try {
    // Criar usuário no Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha)
    const user = userCredential.user

    // Atualizar o perfil do usuário com o nome
    await updateProfile(user, {
      displayName: nome,
    })

    // Salvar dados adicionais no Firestore
    await setDoc(doc(db, "usuarios", user.uid), {
      nome,
      email,
      cargo: "Usuário",
      dataCadastro: serverTimestamp(),
      ultimoAcesso: serverTimestamp(),
    })

    return user
  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    throw error
  }
}

// Fazer login
export const fazerLogin = async (email: string, senha: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha)

    // Atualizar último acesso (usa setDoc merge para criar o documento se não existir)
    if (userCredential.user) {
      await setDoc(doc(db, "usuarios", userCredential.user.uid), {
        ultimoAcesso: serverTimestamp(),
      }, { merge: true })
    }

    return userCredential.user
  } catch (error) {
    console.error("Erro ao fazer login:", error)
    throw error
  }
}

// Fazer logout
export const fazerLogout = async () => {
  return await signOut(auth)
}

// Obter dados do usuário
export const obterDadosUsuario = async (userId: string): Promise<UsuarioData | null> => {
  try {
    const docRef = doc(db, "usuarios", userId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data() as UsuarioData
    }

    return null
  } catch (error) {
    console.error("Erro ao obter dados do usuário:", error)
    throw error
  }
}

// Atualizar dados do usuário
export const atualizarDadosUsuario = async (userId: string, dados: Partial<UsuarioData>) => {
  try {
    const docRef = doc(db, "usuarios", userId)
    await updateDoc(docRef, {
      ...dados,
      updatedAt: serverTimestamp(),
    })

    // Se o email foi atualizado, atualizar também no Authentication
    if (dados.email && auth.currentUser) {
      await updateEmail(auth.currentUser, dados.email)
    }

    // Se o nome foi atualizado, atualizar também no Authentication
    if (dados.nome && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: dados.nome,
      })
    }

    return true
  } catch (error) {
    console.error("Erro ao atualizar dados do usuário:", error)
    throw error
  }
}

// Enviar email de redefinição de senha
export const enviarEmailRedefinicaoSenha = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email)
    return true
  } catch (error) {
    console.error("Erro ao enviar email de redefinição de senha:", error)
    throw error
  }
}

// Atualizar senha do usuário
export const atualizarSenhaUsuario = async (user: User, novaSenha: string) => {
  try {
    await updatePassword(user, novaSenha)
    return true
  } catch (error) {
    console.error("Erro ao atualizar senha:", error)
    throw error
  }
}
