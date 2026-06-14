"use client"

import type { ReservationRecord } from "@/lib/reservations-store"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  CalendarClock,
  ChevronRight,
  Clock,
  Phone,
  Scissors,
  Sparkles,
  User,
} from "lucide-react"

export type StaffProfile = {
  id: string
  firstName: string
  lastName: string
  fullName: string
  phone?: string
  role?: string
}

function staffInitials(firstName: string, lastName: string) {
  const a = firstName.trim()[0] ?? ""
  const b = lastName.trim()[0] ?? ""
  return `${a}${b}`.toUpperCase() || "?"
}

function firstFreeSlot(visibleSlots: string[], bookings: ReservationRecord[]) {
  return visibleSlots.find((time) => !bookings.some((row) => row.startTime === time)) ?? null
}

export function StaffPickerGrid({
  staffList,
  getBookings,
  getVisibleSlots,
  onSelectStaff,
}: {
  staffList: StaffProfile[]
  getBookings: (staffId: string) => ReservationRecord[]
  getVisibleSlots: (staffId: string) => string[]
  onSelectStaff: (staff: StaffProfile) => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {staffList.map((staff) => {
        const bookings = getBookings(staff.id)
        const visibleSlots = getVisibleSlots(staff.id)
        const freeSlot = firstFreeSlot(visibleSlots, bookings)
        const busyMinutes = bookings.reduce((sum, row) => sum + row.totalMinutes, 0)

        return (
          <button
            key={staff.id}
            type="button"
            onClick={() => onSelectStaff(staff)}
            className="group text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
          >
            <Card
              className={cn(
                "gap-0 py-0 overflow-hidden border-0 shadow-md transition-all duration-300",
                "bg-gradient-to-br from-card via-card to-muted/40",
                "hover:shadow-xl hover:-translate-y-0.5",
              )}
            >
              <div className="h-1 w-full bg-gradient-to-r from-primary via-teal-500 to-emerald-400 opacity-80 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="size-14 ring-2 ring-background shadow-md">
                    <AvatarFallback className="bg-primary/15 text-primary text-base font-bold">
                      {staffInitials(staff.firstName, staff.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-lg font-semibold text-foreground leading-tight truncate">
                      {staff.firstName}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{staff.lastName || staff.fullName}</p>
                    {staff.role ? (
                      <Badge variant="secondary" className="mt-2 rounded-md text-[10px] font-normal">
                        {staff.role}
                      </Badge>
                    ) : null}
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground shrink-0 mt-1 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-background/80 border border-border/50 px-3 py-2.5 text-center">
                    <p className="text-xl font-semibold tabular-nums">{bookings.length}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">Randevu</p>
                  </div>
                  <div className="rounded-xl bg-background/80 border border-border/50 px-3 py-2.5 text-center">
                    <p className="text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {freeSlot ?? "—"}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">Musait</p>
                  </div>
                </div>

                {busyMinutes > 0 ? (
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    {busyMinutes} dk dolu program
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-3 text-center">Program acik</p>
                )}
              </CardContent>
            </Card>
          </button>
        )
      })}
    </div>
  )
}

function BookingMiniCard({ reservation }: { reservation: ReservationRecord }) {
  return (
    <div className="rounded-xl border bg-muted/30 px-3 py-2.5 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="rounded-md font-normal tabular-nums">
          <Clock className="size-3 mr-1" />
          {reservation.startTime}–{reservation.endTime}
        </Badge>
        <span className="text-[10px] text-muted-foreground">{reservation.totalMinutes} dk</span>
      </div>
      <p className="text-sm font-medium truncate">
        {reservation.customerName} {reservation.customerSurname}
      </p>
      <p className="text-xs text-muted-foreground truncate">{reservation.serviceNames.join(", ")}</p>
    </div>
  )
}

export function StaffScheduleSheet({
  open,
  onOpenChange,
  staff,
  dateLabel,
  bookings,
  visibleSlots,
  onPickTime,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: StaffProfile | null
  dateLabel: string
  bookings: ReservationRecord[]
  visibleSlots: string[]
  onPickTime: (time: string) => void
}) {
  if (!staff) {
    return null
  }

  const freeSlots = visibleSlots.filter((time) => !bookings.some((row) => row.startTime === time))
  const sortedBookings = [...bookings].sort((a, b) => a.startTime.localeCompare(b.startTime))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <div className="bg-gradient-to-br from-primary/90 via-teal-600 to-emerald-600 text-white px-6 pt-8 pb-6 shrink-0">
          <SheetHeader className="p-0 text-left space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 ring-2 ring-white/30">
                <AvatarFallback className="bg-white/20 text-white text-lg font-bold">
                  {staffInitials(staff.firstName, staff.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <SheetTitle className="text-white text-xl">
                  {staff.firstName} {staff.lastName}
                </SheetTitle>
                <SheetDescription className="text-white/75 mt-1">{dateLabel}</SheetDescription>
                {staff.role ? (
                  <Badge className="mt-2 bg-white/20 text-white border-0 hover:bg-white/20">{staff.role}</Badge>
                ) : null}
              </div>
            </div>
            {staff.phone ? (
              <p className="flex items-center gap-2 text-sm text-white/80">
                <Phone className="size-4 shrink-0" />
                {staff.phone}
              </p>
            ) : null}
          </SheetHeader>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 space-y-6">
            {sortedBookings.length > 0 ? (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Gunun randevulari</h3>
                  <Badge variant="secondary" className="rounded-md ml-auto">
                    {sortedBookings.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {sortedBookings.map((row) => (
                    <BookingMiniCard key={row.id} reservation={row} />
                  ))}
                </div>
              </section>
            ) : null}

            {sortedBookings.length > 0 && freeSlots.length > 0 ? <Separator /> : null}

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Musait saatler</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Saate tiklayarak bu personel icin yeni randevu olusturun.
              </p>

              {freeSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {freeSlots.map((time) => (
                    <Button
                      key={time}
                      type="button"
                      variant="outline"
                      onClick={() => onPickTime(time)}
                      className={cn(
                        "h-11 rounded-xl font-medium tabular-nums",
                        "hover:bg-primary hover:text-primary-foreground hover:border-primary",
                      )}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              ) : (
                <Empty className="border border-dashed rounded-2xl py-10">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Sparkles className="size-5" />
                    </EmptyMedia>
                    <EmptyTitle className="text-sm">Musait saat kalmadi</EmptyTitle>
                    <EmptyDescription className="text-xs">
                      Bu personelin programi secilen gun icin dolu.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </section>

            {sortedBookings.some((r) => r.serviceNames.length > 0) ? (
              <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground justify-center pb-2">
                <Scissors className="size-3" />
                
              </p>
            ) : null}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
