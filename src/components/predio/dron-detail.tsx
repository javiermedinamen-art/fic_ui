"use client"

import * as React from "react"
import dynamic from "next/dynamic"
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
  availableDroneLayers,
  droneImageUrl,
  lidarPointcloudUrl,
  type DroneImageLayer,
} from "@/lib/drone-images"
import { cuartelRings, droneBoundsFor } from "@/lib/raster-geo"
import { ClippedRasterImage } from "@/components/predio/clipped-raster-image"
import { DroneColorLegend } from "@/components/predio/color-legend"
import {
  buildTimeSeries,
  getCuartelesByPredio,
  getPredio,
  type MetricKey,
} from "@/lib/db"

const LidarPointCloudViewer = dynamic(
  () =>
    import("@/components/predio/lidar-point-cloud-viewer").then(
      (m) => m.LidarPointCloudViewer
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-[#0c1210] text-sm text-white/80 ring-1 ring-foreground/10">
        Preparando visor LiDAR…
      </div>
    ),
  }
)

type DronLayer = DroneImageLayer

const DRON_LAYERS: {
  id: DronLayer
  label: string
  description: string
}[] = [
  { id: "rgb", label: "RGB", description: "Ortofoto visible" },
  { id: "ndvi", label: "NDVI", description: "Vigor vegetativo" },
  { id: "ndwi", label: "NDWI", description: "Contenido hídrico" },
  { id: "termico", label: "Térmico", description: "Temperatura de dosel" },
  { id: "lidar", label: "LiDAR", description: "Nube de puntos 3D (máxima densidad)" },
]

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

  const droneCuartelIds = React.useMemo(
    () => [...new Set(weekDrones.map((d) => d.cuartelId))],
    [weekDrones]
  )

  const [cuartelScope, setCuartelScope] = React.useState<string>("todo")

  const active =
    cuartelScope === "todo"
      ? weekDrones[0]
      : (weekDrones.find((d) => d.cuartelId === cuartelScope) ?? weekDrones[0])
  const selectedCuartel =
    cuartelScope === "todo"
      ? null
      : (cuarteles.find((c) => c.id === cuartelScope) ?? null)
  const flightDate = active.date
  const clipRings = cuartelRings(
    selectedCuartel != null ? [selectedCuartel.id] : droneCuartelIds
  )
  const rasterBounds = flightDate
    ? droneBoundsFor(predioId, flightDate)
    : null

  const rasterLayers = React.useMemo(
    () => availableDroneLayers(predioId, flightDate),
    [predioId, flightDate]
  )

  const visibleLayers = React.useMemo(
    () => DRON_LAYERS.filter((l) => rasterLayers.includes(l.id)),
    [rasterLayers]
  )

  const defaultLayer = React.useMemo<DronLayer>(
    () =>
      (rasterLayers.includes("rgb") && "rgb") || rasterLayers[0] || "lidar",
    [rasterLayers]
  )

  const [layer, setLayer] = React.useState<DronLayer>(defaultLayer)

  React.useEffect(() => {
    if (layer !== "lidar" && !rasterLayers.includes(layer)) {
      setLayer(defaultLayer)
    }
  }, [flightDate, predioId, defaultLayer, layer, rasterLayers])

  const imageUrl =
    flightDate && layer !== "lidar"
      ? droneImageUrl(predioId, flightDate, layer)
      : null
  const lidarUrl =
    flightDate && layer === "lidar"
      ? lidarPointcloudUrl(predioId, flightDate)
      : null

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
            {selectedCuartel ? selectedCuartel.nombre : "Todo el predio"}
            {flightDate ? ` · ${flightDate}` : ""} · {layerMeta.description}
          </p>
        </div>

        {droneCuartelIds.length > 1 ? (
          <div className="space-y-1.5">
            <Label className="text-xs">Ámbito del mapa</Label>
            <Select
              value={cuartelScope}
              onValueChange={(v) => {
                if (v) setCuartelScope(v)
              }}
            >
              <SelectTrigger className="min-w-[12rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">Todo el predio</SelectItem>
                {droneCuartelIds.map((id) => {
                  const c = cuarteles.find((x) => x.id === id)
                  return (
                    <SelectItem key={id} value={id}>
                      {c?.nombre ?? id}
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
          if (visibleLayers.some((l) => l.id === v)) setLayer(v as DronLayer)
        }}
      >
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
          {visibleLayers.map((l) => (
            <TabsTrigger key={l.id} value={l.id} className="px-3">
              {l.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <section>
        {lidarUrl ? (
          <LidarPointCloudViewer url={lidarUrl} />
        ) : (
          <>
            <AspectRatio
              ratio={16 / 9}
              className="w-full overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10"
            >
              {imageUrl ? (
                <ClippedRasterImage
                  src={imageUrl}
                  alt={`${layerMeta.label} · ${predio.nombre} · ${flightDate}`}
                  bounds={rasterBounds}
                  rings={clipRings}
                  overlay={
                    <div className="pointer-events-none absolute right-3 bottom-3 z-10 rounded-md bg-black/55 px-2.5 py-1 text-xs text-white">
                      {layerMeta.label} ·{" "}
                      {selectedCuartel?.nombre ?? "Todo el predio"}
                      {flightDate ? ` · ${flightDate}` : ""}
                    </div>
                  }
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900 px-6 text-center text-slate-200">
                  <p className="text-sm font-medium">
                    {layer === "lidar"
                      ? "No hay nube LiDAR para este vuelo."
                      : "Sin imagen para esta capa en este vuelo."}
                  </p>
                  <p className="text-xs text-slate-400">
                    Predio {predio.codigo}
                    {flightDate ? ` · ${flightDate}` : ""}
                  </p>
                </div>
              )}
            </AspectRatio>
            <DroneColorLegend layer={layer} className="mt-2" />
          </>
        )}
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
                const highlighted =
                  cuartelScope === "todo" || d.cuartelId === cuartelScope
                return (
                  <TableRow
                    key={d.id}
                    className={highlighted ? "bg-muted/40" : undefined}
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
