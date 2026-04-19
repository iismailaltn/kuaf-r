"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Bell, Search, Settings } from "lucide-react"

export function Header() {
  const today = new Date()
  const formattedDate = today.toLocaleDateString("tr-TR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Ara"
            className="pl-9 w-64 bg-muted/50 border-0 rounded-xl"
          />
        </div>
      </div>

      <div className="px-4 py-1.5 bg-muted/50 rounded-full text-sm text-muted-foreground">
        Bugun, {formattedDate}
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-xl hover:bg-muted transition-colors">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
        <button className="p-2 rounded-xl hover:bg-muted transition-colors relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </button>
        <Avatar className="w-9 h-9">
          <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" />
          <AvatarFallback>BA</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
