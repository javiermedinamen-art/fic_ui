"use client"

import * as React from "react"
import { useSearchParams, notFound } from "next/navigation"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  buildTimeSeries,
  getCuartelesByPredio,
  getPredio,
  type MetricKey,
} from "@/lib/db"

type DronLayer = "rgb" | "ndvi" | "ndwi" | "termico" | "lidar"

const DRON_LAYERS: {
  id: DronLayer
  label: string
  description: string
}[] = [
  { id: "rgb", label: "RGB", description: "Ortofoto visible" },
  { id: "ndvi", label: "NDVI", description: "Vigor vegetativo" },
  { id: "ndwi", label: "NDWI", description: "Contenido hídrico" },
  { id: "termico", label: "Térmico", description: "Temperatura de dosel" },
  { id: "lidar", label: "LiDAR", description: "Altura / 3D" },
]

const LAYER_STYLE: Record<
  DronLayer,
  { background: string; overlay?: string; badge: string }
> = {
  rgb: {
    background:
      "linear-gradient(145deg, #86efac 0%, #4ade80 35%, #166534 70%, #854d0e 100%)",
    overlay:
      "radial-gradient(circle at 40% 35%, rgba(255,255,255,0.2), transparent 45%)",
    badge: "RGB",
  },
  ndvi: {
    background:
      "linear-gradient(135deg, #fef08a 0%, #84cc16 40%, #15803d 75%, #14532d 100%)",
    badge: "NDVI",
  },
  ndwi: {
    background:
      "linear-gradient(135deg, #fef3c7 0%, #67e8f9 40%, #0284c7 80%, #0c4a6e 100%)",
    badge: "NDWI",
  },
  termico: {
    background:
      "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 30%, #f97316 65%, #fef08a 100%)",
    badge: "Térmico",
  },
  lidar: {
    background:
      "linear-gradient(160deg, #0f172a 0%, #334155 40%, #94a3b8 70%, #e2e8f0 100%)",
    overlay:
      "repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(255,255,255,0.08) 24px, rgba(255,255,255,0.08) 25px), repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(255,255,255,0.08) 24px, rgba(255,255,255,0.08) 25px)",
    badge: "LiDAR 3D",
  },
}

function layerValue(base: number, layer: DronLayer, seed: number) {
  const offset = ((seed % 7) - 3) * 0.012
  switch (layer) {
    case "rgb":
      return "—"
    case "ndvi":
      return (base + offset).toFixed(3)
    case "ndwi":
      return (base * 0.72 + offset).toFixed(3)
    case "termico":
      return `${(18 + base * 22 + seed * 0.4).toFixed(1)} °C`
    case "lidar":
      return `${(2.4 + base * 4 + (seed % 5) * 0.3).toFixed(1)} m`
    default:
      return "—"
  }
}

type DronDetailProps = {
  predioId: string
  week: number
}

export function DronDetail({ predioId, week }: DronDetailProps) {
  const searchParams = useSearchParams()
  const predio = getPredio(predioId)
  if (!predio) notFound()

  const allCuarteles = getCuartelesByPredio(predioId)
  const cultivo =
    searchParams.get("cultivo") ?? allCuarteles[0]?.cultivo ?? "Paltos"
  const metric = (searchParams.get("metric") as MetricKey) || "ndvi"
  const cuartelIds = (searchParams.get("cuarteles") ?? "")
    .split(",")
    .filter(Boolean)

  const cuarteles = allCuarteles.filter(
    (c) =>
      c.cultivo === cultivo &&
      (cuartelIds.length === 0 || cuartelIds.includes(c.id))
  )

  const { weeks, drones } = buildTimeSeries(predioId, metric, cultivo)
  const point = weeks.find((w) => w.week === week)
  if (!point) notFound()

  const weekDrones = drones.filter(
    (d) => d.week === week && cuarteles.some((c) => c.id === d.cuartelId)
  )

  if (weekDrones.length === 0) notFound()

  const [layer, setLayer] = React.useState<DronLayer>("rgb")
  const [cuartelId, setCuartelId] = React.useState(weekDrones[0].cuartelId)

  const active =
    weekDrones.find((d) => d.cuartelId === cuartelId) ?? weekDrones[0]
  const cuartel = cuarteles.find((c) => c.id === active.cuartelId)
  const style = LAYER_STYLE[layer]
  const layerMeta = DRON_LAYERS.find((l) => l.id === layer)!

  const query = searchParams.toString()
  const semanaHref = `/predio/${predioId}/semana/${week}${query ? `?${query}` : ""}`

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Cartera", href: "/cartera" },
          { label: `Predio ${predio.nombre}`, href: `/predio/${predio.id}` },
          { label: `Semana ${week}`, href: semanaHref },
          { label: "Vuelo de dron" },
        ]}
      />

      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Vuelo de dron · S{week}
          </h1>
          <p className="text-sm text-muted-foreground">
            {cuartel?.nombre} · {layerMeta.description}
          </p>
        </div>

        {weekDrones.length > 1 ? (
          <div className="space-y-1.5">
            <Label className="text-xs">Cuartel</Label>
            <Select
              value={cuartelId}
              onValueChange={(v) => {
                if (v) setCuartelId(v)
              }}
            >
              <SelectTrigger className="min-w-[10rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {weekDrones.map((d) => {
                  const c = cuarteles.find((x) => x.id === d.cuartelId)
                  return (
                    <SelectItem key={d.id} value={d.cuartelId}>
                      {c?.nombre ?? d.cuartelId}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </section>

      <Tabs
        value={layer}
        onValueChange={(v) => {
          if (DRON_LAYERS.some((l) => l.id === v)) setLayer(v as DronLayer)
        }}
      >
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
          {DRON_LAYERS.map((l) => (
            <TabsTrigger key={l.id} value={l.id} className="px-3">
              {l.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <section>
        <AspectRatio
          ratio={16 / 9}
          className="w-full overflow-hidden rounded-xl ring-1 ring-foreground/10"
        >
          <div
            className="absolute inset-0"
            style={{ background: style.background }}
          >
            {style.overlay ? (
              <div
                className="absolute inset-0"
                style={{ backgroundImage: style.overlay }}
              />
            ) : null}
            {layer === "lidar" ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="size-[55%] max-w-md rounded-lg border border-white/20 bg-white/5 shadow-2xl"
                  style={{
                    transform:
                      "perspective(800px) rotateX(58deg) rotateZ(-18deg)",
                    backgroundImage:
                      "linear-gradient(135deg, rgba(148,163,184,0.5), rgba(15,23,42,0.8))",
                    boxShadow:
                      "0 40px 80px rgba(0,0,0,0.45), inset 0 0 40px rgba(255,255,255,0.08)",
                  }}
                />
              </div>
            ) : null}
            <div className="absolute right-3 bottom-3 rounded-md bg-black/55 px-2.5 py-1 text-xs text-white">
              {style.badge} · {cuartel?.nombre}
            </div>
          </div>
        </AspectRatio>
      </section>

      <Card className="py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base font-medium">
            Valores · {layerMeta.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cuartel</TableHead>
                <TableHead>{layerMeta.label}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weekDrones.map((d, i) => {
                const c = cuarteles.find((x) => x.id === d.cuartelId)
                return (
                  <TableRow
                    key={d.id}
                    className={
                      d.cuartelId === active.cuartelId
                        ? "bg-muted/40"
                        : undefined
                    }
                  >
                    <TableCell className="font-medium">
                      {c?.nombre ?? d.cuartelId}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {layerValue(d.value, layer, i + week)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
