"use client"

import { useState, useEffect } from "react"
import { Bell, X, Check, AlertTriangle, Info, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

type Notification = {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  read: boolean
  date: Date
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  // Simulação de notificações
  useEffect(() => {
    // Dados de exemplo
    const mockNotifications: Notification[] = [
      {
        id: "1",
        title: "Vencimento próximo",
        message: "A hospedagem drviniciusbarros.com.br vence em 7 dias",
        type: "warning",
        read: false,
        date: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
      },
      {
        id: "2",
        title: "Hospedagem renovada",
        message: "A hospedagem simonettimoveis.com.br foi renovada com sucesso",
        type: "success",
        read: true,
        date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
      },
      {
        id: "3",
        title: "Novo cliente",
        message: "Um novo cliente foi adicionado ao sistema",
        type: "info",
        read: false,
        date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
      },
    ]

    setNotifications(mockNotifications)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? "dia" : "dias"} atrás`
    } else if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? "hora" : "horas"} atrás`
    } else if (diffMins > 0) {
      return `${diffMins} ${diffMins === 1 ? "minuto" : "minutos"} atrás`
    } else {
      return "Agora mesmo"
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "info":
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-white">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notificações</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-8" onClick={markAllAsRead}>
              <Check className="h-3 w-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length > 0 ? (
            <AnimatePresence>
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn("p-4 border-b last:border-0 flex gap-3", !notification.read && "bg-muted/30")}
                >
                  <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium">{notification.title}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 -mr-2 -mt-2 text-muted-foreground"
                        onClick={() => removeNotification(notification.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">{formatTimeAgo(notification.date)}</span>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Marcar como lida
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Não há notificações</p>
            </div>
          )}
        </div>
        <div className="p-2 border-t">
          <Button variant="outline" size="sm" className="w-full text-xs">
            Ver todas as notificações
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
