"use client"

import * as React from "react"
import {
  ClapperboardIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
} from "lucide-react"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { ClippedRasterImage } from "@/components/predio/clipped-raster-image"
import { SatelliteColorLegend } from "@/components/predio/color-legend"
import { METRIC_META, type Cuartel, type MetricKey } from "@/lib/db"
import { cuartelRings, s2BoundsFor } from "@/lib/raster-geo"
import { getEvolutionFrames } from "@/lib/satellite-images"

const SPEEDS = [
  { id: "slow", label: "0.5×", ms: 700 },
  { id: "normal", label: "1×", ms: 400 },
  { id: "fast", label: "2×", ms: 200 },
] as const

type SpeedId = (typeof SPEEDS)[number]["id"]

type PredioEvolutionPlayerProps = {
  predioId: string
  predioNombre: string
  cuarteles: Cuartel[]
}

export function PredioEvolutionPlayer({
  predioId,
  predioNombre,
  cuarteles,
}: PredioEvolutionPlayerProps) {
  const [open, setOpen] = React.useState(false)
  const [metric, setMetric] = React.useState<MetricKey>("ndvi")
  const [index, setIndex] = React.useState(0)
  const [playing, setPlaying] = React.useState(true)
  const [speed, setSpeed] = React.useState<SpeedId>("normal")
  const [cuartelScope, setCuartelScope] = React.useState<string>("todo")

  const frames = React.useMemo(
    () => getEvolutionFrames(predioId, metric),
    [predioId, metric]
  )
  const frame = frames[index] ?? frames[0]
  const speedMs = SPEEDS.find((s) => s.id === speed)?.ms ?? 400
  const bounds = s2BoundsFor(predioId)
  const rings = cuartelRings(
    cuartelScope === "todo"
      ? cuarteles.map((c) => c.id)
      : [cuartelScope]
  )
  React.useEffect(() => {
    setIndex(0)
  }, [predioId, metric])

  React.useEffect(() => {
    if (!open) {
      setPlaying(false)
      return
    }
    setPlaying(true)
  }, [open])

  React.useEffect(() => {
    if (!open || !playing || frames.length < 2) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % frames.length)
    }, speedMs)
    return () => window.clearInterval(id)
  }, [open, playing, speedMs, frames.length])

  React.useEffect(() => {
    if (!open || typeof window === "undefined") return
    const toPreload = [
      frames[index],
      frames[(index + 1) % frames.length],
      frames[(index + 2) % frames.length],
    ]
    for (const f of toPreload) {
      if (!f) continue
      const img = new window.Image()
      img.src = f.url
    }
  }, [open, frames, index])

  if (!frame) return null

  const scopeLabel =
    cuartelScope === "todo"
      ? "Todo el predio"
      : (cuarteles.find((c) => c.id === cuartelScope)?.nombre ?? cuartelScope)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button type="button" size="sm" variant="outline" />}
      >
        <ClapperboardIcon className="size-3.5" />
        Ver time-lapse
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl" showCloseButton>
        <DialogHeader>
          <DialogTitle>Time-lapse satelital · {predioNombre}</DialogTitle>
          <DialogDescription>
            Evolución Sentinel-2 · semanas 1–{frames.length} (2026)
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Label className="sr-only">Métrica</Label>
          <Select
            value={metric}
            onValueChange={(v) => {
              if (v && v in METRIC_META) setMetric(v as MetricKey)
            }}
          >
            <SelectTrigger className="w-[9rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(METRIC_META) as MetricKey[]).map((m) => (
                <SelectItem key={m} value={m}>
                  {METRIC_META[m].short}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {cuarteles.length > 1 ? (
            <Select
              value={cuartelScope}
              onValueChange={(v) => {
                if (v) setCuartelScope(v)
              }}
            >
              <SelectTrigger className="min-w-[11rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">Todo el predio</SelectItem>
                {cuarteles.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>

        <AspectRatio
          ratio={4 / 3}
          className="overflow-hidden rounded-xl bg-black ring-1 ring-foreground/10"
        >
          <ClippedRasterImage
            src={frame.url}
            alt={`Evolución ${METRIC_META[metric].short} · semana ${frame.week}`}
            bounds={bounds}
            rings={rings}
            overlay={
              <div className="pointer-events-none absolute right-2 bottom-2 z-10 rounded-md bg-black/60 px-2 py-0.5 text-[11px] text-white">
                S{frame.week} · {METRIC_META[metric].short} · {scopeLabel}
              </div>
            }
          />
        </AspectRatio>

        <SatelliteColorLegend metric={metric} compact />

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? (
                <>
                  <PauseIcon className="size-3.5" />
                  Pausar
                </>
              ) : (
                <>
                  <PlayIcon className="size-3.5" />
                  Reproducir
                </>
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setIndex(0)
                setPlaying(true)
              }}
            >
              <RotateCcwIcon className="size-3.5" />
              Reiniciar
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Velocidad</Label>
              <Select
                value={speed}
                onValueChange={(v) => {
                  if (v && SPEEDS.some((s) => s.id === v))
                    setSpeed(v as SpeedId)
                }}
              >
                <SelectTrigger className="h-8 w-[5.5rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPEEDS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Semana{" "}
                <span className="font-medium text-foreground">{frame.week}</span>
              </span>
              <span>
                {index + 1} / {frames.length}
              </span>
            </div>
            <Slider
              min={0}
              max={frames.length - 1}
              step={1}
              value={[index]}
              onValueChange={(v) => {
                const next = Array.isArray(v) ? v[0] : v
                if (typeof next === "number") {
                  setIndex(next)
                  setPlaying(false)
                }
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
