import { cn } from "@/lib/utils"
import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react"
import { ReactNode } from "react"

interface StatCardProps {
  title: string
  value: string
  change?: string
  changeType?: "positive" | "negative"
  subtitle?: string
  highlighted?: boolean
  icon?: ReactNode
  className?: string
}

export function StatCard({
  title,
  value,
  change,
  changeType = "positive",
  subtitle,
  highlighted = false,
  icon,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative p-5 rounded-2xl border transition-all",
        highlighted
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card border-border",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p
          className={cn(
            "text-sm font-medium",
            highlighted ? "text-primary-foreground/80" : "text-muted-foreground"
          )}
        >
          {title}
        </p>
        <button
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            highlighted
              ? "bg-primary-foreground/20 hover:bg-primary-foreground/30"
              : "bg-muted hover:bg-muted/80"
          )}
        >
          {icon || <ArrowUpRight className="w-4 h-4" />}
        </button>
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {change && (
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium",
                changeType === "positive"
                  ? highlighted
                    ? "bg-green-500/20 text-green-200"
                    : "bg-green-100 text-green-700"
                  : highlighted
                    ? "bg-red-500/20 text-red-200"
                    : "bg-red-100 text-red-700"
              )}
            >
              {changeType === "positive" ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {change}
            </span>
          </div>
        )}
        {subtitle && (
          <p
            className={cn(
              "text-xs",
              highlighted ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
