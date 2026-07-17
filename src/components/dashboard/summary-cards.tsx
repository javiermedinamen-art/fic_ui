"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

type SummaryCardsProps = {
  predios: number
  cuarteles: number
  cultivos: string[]
  comunas: string[]
}

export function SummaryCards({
  predios,
  cuarteles,
  cultivos,
  comunas,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card size="sm">
        <CardContent className="flex items-center justify-center py-4 text-center font-medium">
          {predios} Predios
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="flex items-center justify-center py-4 text-center font-medium">
          {cuarteles} Cuarteles
        </CardContent>
      </Card>

      <HoverCard>
        <HoverCardTrigger
          render={
            <Card size="sm" className="cursor-pointer transition-colors hover:bg-muted/40" />
          }
        >
          <CardContent className="flex items-center justify-center py-4 text-center font-medium">
            {cultivos.length} Cultivos
          </CardContent>
        </HoverCardTrigger>
        <HoverCardContent side="top" className="w-auto px-3 py-2">
          <p className="font-medium">{cultivos.join(" · ")}</p>
        </HoverCardContent>
      </HoverCard>

      <HoverCard>
        <HoverCardTrigger
          render={
            <Card size="sm" className="cursor-pointer transition-colors hover:bg-muted/40" />
          }
        >
          <CardContent className="flex items-center justify-center py-4 text-center font-medium">
            {comunas.length} Comuna
          </CardContent>
        </HoverCardTrigger>
        <HoverCardContent side="top" className="w-auto px-3 py-2">
          <p className="font-medium">{comunas.join(" · ")}</p>
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}
