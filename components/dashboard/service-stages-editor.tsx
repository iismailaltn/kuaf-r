"use client"

import {
  createStageId,
  defaultStagesForService,
  type SalonServiceStage,
} from "@/lib/salon-service-stages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2 } from "lucide-react"

interface ServiceStagesEditorProps {
  serviceName: string
  durationMinutes: number
  stages: SalonServiceStage[]
  onChange: (stages: SalonServiceStage[]) => void
}

export function ServiceStagesEditor({
  serviceName,
  durationMinutes,
  stages,
  onChange,
}: ServiceStagesEditorProps) {
  const totalMinutes = stages.reduce((sum, stage) => sum + stage.durationMinutes, 0)
  const staffMinutes = stages
    .filter((stage) => stage.requiresStaff)
    .reduce((sum, stage) => sum + stage.durationMinutes, 0)

  const updateStage = (stageId: string, patch: Partial<SalonServiceStage>) => {
    onChange(stages.map((stage) => (stage.id === stageId ? { ...stage, ...patch } : stage)))
  }

  const removeStage = (stageId: string) => {
    if (stages.length <= 1) {
      return
    }
    onChange(stages.filter((stage) => stage.id !== stageId))
  }

  const addStage = () => {
    onChange([
      ...stages,
      {
        id: createStageId(),
        name: "Yeni asama",
        durationMinutes: 15,
        requiresStaff: true,
        requiresWorkspace: true,
      },
    ])
  }

  const applyHairColorTemplate = () => {
    onChange(defaultStagesForService("Sac boyasi", durationMinutes))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          Toplam: <span className="font-medium text-foreground">{totalMinutes} dk</span>
          {" · "}
          Personel meşgul: <span className="font-medium text-foreground">{staffMinutes} dk</span>
        </div>
        <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={applyHairColorTemplate}>
          Sac boyasi sablonu
        </Button>
      </div>

      <div className="space-y-3">
        {stages.map((stage, index) => (
          <div key={stage.id} className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">Asama {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={stages.length <= 1}
                onClick={() => removeStage(stage.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Asama adi</Label>
                <Input
                  value={stage.name}
                  onChange={(e) => updateStage(stage.id, { name: e.target.value })}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sure (dk)</Label>
                <Input
                  type="number"
                  min={5}
                  step={5}
                  value={stage.durationMinutes}
                  onChange={(e) =>
                    updateStage(stage.id, { durationMinutes: Math.max(5, Number(e.target.value) || 5) })
                  }
                  className="rounded-lg"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center justify-between gap-2 flex-1">
                <Label className="text-sm">Personel gerekli</Label>
                <Switch
                  checked={stage.requiresStaff}
                  onCheckedChange={(checked) => updateStage(stage.id, { requiresStaff: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-2 flex-1">
                <Label className="text-sm">Calisma alani gerekli</Label>
                <Switch
                  checked={stage.requiresWorkspace}
                  onCheckedChange={(checked) => updateStage(stage.id, { requiresWorkspace: checked })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" className="rounded-lg gap-1" onClick={addStage}>
        <Plus className="w-4 h-4" />
        Asama ekle
      </Button>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Randevu takviminde musteri <strong>{totalMinutes} dk</strong> gorur; personel takviminde yalnizca
        personel gerekli asamalar ({staffMinutes} dk) kapanir. Bekleme asamalarinda ayni personele baska islem
        atanabilir.
      </p>
    </div>
  )
}
