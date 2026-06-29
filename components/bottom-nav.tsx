"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Globe, Users, Calendar, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export function BottomNav() {
  const pathname = usePathname()

  const navItems = [
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
      title: "Config",
      href: "/configuracoes",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 md:hidden pb-safe">
      <div className="grid h-full grid-cols-5 mx-auto max-w-md">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex flex-col items-center justify-center px-2 group relative"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
                  isActive
                    ? "text-primary dark:text-blue-400 font-semibold"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeBottomNav"
                    className="absolute inset-x-2 inset-y-1 bg-primary/5 dark:bg-blue-500/10 rounded-2xl -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {item.icon}
                <span className="text-[10px] mt-1 tracking-tight">{item.title}</span>
              </motion.div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
