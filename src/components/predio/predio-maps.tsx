"use client"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Predio } from "@/lib/db"

type PredioMapsProps = {
  predio: Predio
}

/** Mapas comparativos compactos: histórico vs actual (mock visual NDVI) */
export function PredioMaps({ predio }: PredioMapsProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Mapas comparativos</CardTitle>
        <p className="text-xs text-muted-foreground">
          Histórico regional vs. captura actual — tamaño acotado para lectura rápida.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          <MapPanel
            title="Histórico (mediana regional)"
            subtitle={`${predio.comuna} · mediana 5 años`}
            variant="historic"
          />
          <MapPanel
            title="Actual (año en curso)"
            subtitle={`${predio.nombre} · última escena`}
            variant="current"
          />
        </div>
      </CardContent>
    </Card>
  )
}

function MapPanel({
  title,
  subtitle,
  variant,
}: {
  title: string
  subtitle: string
  variant: "historic" | "current"
}) {
  const bg =
    variant === "historic"
      ? "from-amber-200/80 via-lime-300/70 to-emerald-600/80"
      : "from-yellow-300/70 via-green-400/80 to-emerald-800/90"

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="text-[10px] text-muted-foreground">{subtitle}</span>
      </div>
      <AspectRatio
        ratio={4 / 3}
        className="max-h-48 overflow-hidden rounded-lg ring-1 ring-foreground/10"
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br ${bg}`}
          style={{
            backgroundImage:
              variant === "current"
                ? `radial-gradient(circle at 30% 40%, rgba(255,255,255,0.25), transparent 40%),
                   radial-gradient(circle at 70% 60%, rgba(0,0,0,0.2), transparent 35%),
                   linear-gradient(135deg, #fde047aa, #22c55ecc, #14532dcc)`
                : `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15), transparent 50%),
                   linear-gradient(160deg, #fcd34daa, #84cc16cc, #166534cc)`,
          }}
        >
          <div className="absolute inset-0 opacity-30 mix-blend-overlay"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(0,0,0,0.06) 8px, rgba(0,0,0,0.06) 9px), repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.06) 8px, rgba(0,0,0,0.06) 9px)",
            }}
          />
          <div className="absolute right-2 bottom-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
            NDVI falso color
          </div>
        </div>
      </AspectRatio>
    </div>
  )
}
