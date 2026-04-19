import { cn } from "@/lib/utils"
import { ReactNode } from "react"
import { ArrowUpRight } from "lucide-react"

interface InfoCardProps {
  icon: ReactNode
  value: string
  label: string
  description: ReactNode
  className?: string
}

export function InfoCard({
  icon,
  value,
  label,
  description,
  className,
}: InfoCardProps) {
  return (
    <div
      className={cn(
        "p-5 bg-card rounded-2xl border border-border",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-xl bg-muted">{icon}</div>
        <button className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground">{value}</span>
          <span className="text-muted-foreground text-sm">{label}</span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
