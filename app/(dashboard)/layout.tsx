import type React from "react"
import Sidebar from "@/components/sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { ProtectedRoute } from "@/components/protected-route"
import { PageTransition } from "@/components/page-transition"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 md:pb-0">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto px-4 py-6 md:px-6 md:py-8 max-w-7xl">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}
