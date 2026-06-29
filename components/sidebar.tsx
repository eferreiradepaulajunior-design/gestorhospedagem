"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Globe,
  Users,
  Calendar,
  AlertTriangle,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  DollarSign,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn, getInitials } from "@/lib/utils"
import { useState, useEffect } from "react"
import { useAuth } from "@/providers/auth-provider"
import { fazerLogout } from "@/services/usuarioService"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Sidebar() {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [isMdScreen, setIsMdScreen] = useState(false)

  useEffect(() => {
    setMounted(true)

    const handleResize = () => {
      const isMd = window.innerWidth >= 768
      setIsMdScreen(isMd)
      if (isMd) {
        setSidebarOpen(true)
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const links = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Hospedagens",
      href: "/hospedagens",
      icon: <Globe className="h-5 w-5" />,
    },
    {
      title: "Clientes",
      href: "/clientes",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Vencimentos",
      href: "/vencimentos",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Alertas",
      href: "/alertas",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      title: "Transações",
      href: "/transacoes",
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      title: "Configurações",
      href: "/configuracoes",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  const handleLogout = async () => {
    try {
      await fazerLogout()
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao fazer logout.",
      })
    }
  }

  // Fechar sidebar ao clicar em um link em dispositivos móveis
  const handleLinkClick = () => {
    if (!isMdScreen) {
      setSidebarOpen(false)
    }
  }

  // Fechar sidebar quando clicar fora em dispositivos móveis
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("sidebar")
      const toggleButton = document.getElementById("sidebar-toggle")

      if (
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        toggleButton &&
        !toggleButton.contains(event.target as Node) &&
        !isMdScreen &&
        sidebarOpen
      ) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [sidebarOpen, isMdScreen])

  if (!mounted) {
    return (
      <div className="fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 md:relative md:flex"></div>
    )
  }

  const userInitials = user?.displayName
    ? getInitials(user.displayName)
    : user?.email
      ? user.email[0].toUpperCase()
      : "U"

  return (
    <>
      <Button
        id="sidebar-toggle"
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-white dark:bg-gray-800 shadow-md"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      <motion.div
        id="sidebar"
        initial={false}
        animate={{
          x: sidebarOpen || isMdScreen ? 0 : -320,
          opacity: sidebarOpen || isMdScreen ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg md:shadow-none md:translate-x-0 md:opacity-100",
          "md:relative md:flex",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-primary p-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-white"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M7 7h10" />
                  <path d="M7 12h10" />
                  <path d="M7 17h10" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold">S.C.H</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sistema de Hospedagens</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {links.map((route) => {
                const isActive = pathname === route.href || pathname.startsWith(`${route.href}/`)

                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center px-4 py-3 text-sm rounded-lg transition-colors",
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                    )}
                  >
                    {route.icon}
                    <span className="font-medium">{route.title}</span>
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-indicator"
                        className="ml-auto h-2 w-2 rounded-full bg-white"
                        transition={{ type: "spring", duration: 0.5 }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={user?.photoURL || undefined} />
                  <AvatarFallback className="bg-primary text-white">{userInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user?.displayName || user?.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Logado</p>
                </div>
              </div>
              <ThemeToggle />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/perfil" onClick={handleLinkClick}>
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
