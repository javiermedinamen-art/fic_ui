"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Scatter,
  XAxis,
  YAxis,
} from "recharts"
import { InfoIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
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
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import type { Cuartel, MetricKey } from "@/lib/db"
import { METRIC_META, buildTimeSeries } from "@/lib/db"

const CUARTEL_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#0d9488",
  "#7c3aed",
  "#ea580c",
]

type PredioChartPanelProps = {
  predioId: string
  cuarteles: Cuartel[]
}

export function PredioChartPanel({ predioId, cuarteles }: PredioChartPanelProps) {
  const router = useRouter()
  const cultivos = React.useMemo(
    () => [...new Set(cuarteles.map((c) => c.cultivo))],
    [cuarteles]
  )

  const [cultivo, setCultivo] = React.useState(cultivos[0] ?? "")
  const cuartelesCultivo = React.useMemo(
    () => cuarteles.filter((c) => c.cultivo === cultivo),
    [cuarteles, cultivo]
  )

  const [selectedCuarteles, setSelectedCuarteles] = React.useState<string[]>(
    () => cuartelesCultivo.map((c) => c.id)
  )

  React.useEffect(() => {
    setSelectedCuarteles(cuartelesCultivo.map((c) => c.id))
  }, [cultivo]) // eslint-disable-line react-hooks/exhaustive-deps

  const [metricA, setMetricA] = React.useState<MetricKey>("ndvi")
  const [metricB, setMetricB] = React.useState<MetricKey | "none">("none")
  const [mode, setMode] = React.useState<"promedio" | "individual">("promedio")

  const { weeks, drones } = React.useMemo(
    () =>
      buildTimeSeries(
        predioId,
        metricA,
        cultivo,
        metricB === "none" ? undefined : metricB
      ),
    [predioId, metricA, cultivo, metricB]
  )

  const chartData = React.useMemo(() => {
    return weeks.map((w) => {
      const row: Record<string, string | number | null> = {
        week: w.week,
        label: w.label,
        mediana: w.medianaHistorica,
        promedio: w.promedioPredio,
        secondaryMediana: w.secondaryMediana ?? null,
        secondaryPromedio: w.secondaryPromedio ?? null,
      }

      for (const id of selectedCuarteles) {
        row[`c_${id}`] = w.cuarteles[id] ?? null
        if (w.secondary) row[`s_${id}`] = w.secondary[id] ?? null
      }

      const droneHits = drones.filter(
        (d) =>
          d.week === w.week &&
          selectedCuarteles.includes(d.cuartelId) &&
          d.metric === metricA
      )
      row.droneY = droneHits[0]?.value ?? null
      row.droneId = droneHits[0]?.id ?? null

      return row
    })
  }, [weeks, selectedCuarteles, drones, metricA])

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      mediana: { label: "Mediana histórica regional", color: "#737373" },
      promedio: {
        label: `Promedio predio · ${METRIC_META[metricA].short}`,
        color: "#15803d",
      },
      secondaryPromedio: {
        label:
          metricB !== "none"
            ? `Promedio · ${METRIC_META[metricB].short}`
            : "Métrica 2",
        color: "#1d4ed8",
      },
      droneY: { label: "Observación dron", color: "#b45309" },
    }
    cuartelesCultivo.forEach((c, i) => {
      config[`c_${c.id}`] = {
        label: c.nombre,
        color: CUARTEL_COLORS[i % CUARTEL_COLORS.length],
      }
    })
    return config
  }, [metricA, metricB, cuartelesCultivo])

  function toggleCuartel(id: string, checked: boolean) {
    setSelectedCuarteles((prev) => {
      if (checked) return [...prev, id]
      if (prev.length <= 1) return prev
      return prev.filter((x) => x !== id)
    })
  }

  function openWeek(week: number) {
    const params = new URLSearchParams({
      cultivo,
      metric: metricA,
      ...(metricB !== "none" ? { metric2: metricB } : {}),
      cuarteles: selectedCuarteles.join(","),
    })
    router.push(`/predio/${predioId}/semana/${week}?${params.toString()}`)
  }

  function onChartClick(state: {
    activeLabel?: string | number
    activePayload?: { payload?: { week?: number } }[]
  }) {
    const week =
      state.activePayload?.[0]?.payload?.week ??
      weeks.find((w) => w.label === state.activeLabel)?.week
    if (week != null) openWeek(Number(week))
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <Card className="h-fit">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Cultivo</Label>
            <Select
              value={cultivo}
              onValueChange={(v) => {
                if (v) setCultivo(v)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cultivos.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === "individual" ? (
            <fieldset className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <legend className="text-sm font-medium">Cuarteles</legend>
                <button
                  type="button"
                  className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() =>
                    setSelectedCuarteles(cuartelesCultivo.map((c) => c.id))
                  }
                >
                  Todos
                </button>
              </div>
              {cuartelesCultivo.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <Checkbox
                    id={c.id}
                    checked={selectedCuarteles.includes(c.id)}
                    onCheckedChange={(v) => toggleCuartel(c.id, !!v)}
                  />
                  <Label htmlFor={c.id} className="font-normal">
                    {c.nombre}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({c.hectareas} ha)
                    </span>
                  </Label>
                </div>
              ))}
            </fieldset>
          ) : (
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Vista agregada del predio. Cambia a “Por cuarteles” para elegir
              unidades.
            </p>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label>Métrica</Label>
              <MetricInfo metric={metricA} />
            </div>
            <Select
              value={metricA}
              onValueChange={(v) => {
                if (v) setMetricA(v as MetricKey)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(METRIC_META) as MetricKey[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {METRIC_META[k].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label>Comparar con</Label>
              {metricB !== "none" ? <MetricInfo metric={metricB} /> : null}
            </div>
            <Select
              value={metricB}
              onValueChange={(v) => {
                if (v) setMetricB(v as MetricKey | "none")
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                {(Object.keys(METRIC_META) as MetricKey[])
                  .filter((k) => k !== metricA)
                  .map((k) => (
                    <SelectItem key={k} value={k}>
                      {METRIC_META[k].label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Serie temporal</CardTitle>
            <p className="text-xs text-muted-foreground">
              Clic en un punto para abrir la semana.
            </p>
          </div>
          <Tabs
            value={mode}
            onValueChange={(v) => {
              if (v === "promedio" || v === "individual") setMode(v)
            }}
          >
            <TabsList>
              <TabsTrigger value="promedio">Todo el predio</TabsTrigger>
              <TabsTrigger value="individual">Por cuarteles</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-[16/7] w-full cursor-pointer">
            <ComposedChart
              data={chartData}
              margin={{
                top: 8,
                right: metricB !== "none" ? 12 : 8,
                left: 0,
                bottom: 0,
              }}
              onClick={onChartClick}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                domain={["auto", "auto"]}
                width={42}
                tickFormatter={(v) => Number(v).toFixed(2)}
              />
              {metricB !== "none" ? (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  domain={["auto", "auto"]}
                  width={42}
                  tickFormatter={(v) => Number(v).toFixed(2)}
                />
              ) : null}
              <Legend />

              <Line
                yAxisId="left"
                type="monotone"
                dataKey="mediana"
                name="Mediana histórica"
                stroke="var(--color-mediana)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={{ r: 2.5, strokeWidth: 0, fill: "#737373" }}
                activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff" }}
              />

              {mode === "promedio" ? (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="promedio"
                  name={`Predio · ${METRIC_META[metricA].short}`}
                  stroke="var(--color-promedio)"
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 0, fill: "#15803d" }}
                  activeDot={{ r: 8, strokeWidth: 2, stroke: "#fff" }}
                />
              ) : (
                selectedCuarteles.map((id, i) => {
                  const c = cuartelesCultivo.find((x) => x.id === id)
                  const color = CUARTEL_COLORS[i % CUARTEL_COLORS.length]
                  return (
                    <Line
                      key={id}
                      yAxisId="left"
                      type="monotone"
                      dataKey={`c_${id}`}
                      name={c?.nombre ?? id}
                      stroke={color}
                      strokeWidth={1.75}
                      dot={{ r: 2.5, strokeWidth: 0, fill: color }}
                      activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff" }}
                    />
                  )
                })
              )}

              {metricB !== "none" ? (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="secondaryPromedio"
                  name={`Predio · ${METRIC_META[metricB].short}`}
                  stroke="var(--color-secondaryPromedio)"
                  strokeWidth={2}
                  strokeDasharray="2 2"
                  dot={{ r: 2.5, strokeWidth: 0, fill: "#1d4ed8" }}
                  activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff" }}
                />
              ) : null}

              <Scatter
                yAxisId="left"
                dataKey="droneY"
                name="Dron"
                fill="#b45309"
                shape={(props: {
                  cx?: number
                  cy?: number
                  payload?: { week?: number; droneId?: string | null }
                }) => {
                  const { cx, cy, payload } = props
                  if (cx == null || cy == null || !payload?.droneId) {
                    return <g />
                  }
                  return (
                    <g
                      transform={`translate(${cx},${cy})`}
                      style={{ cursor: "pointer" }}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        if (payload.week != null) openWeek(payload.week)
                      }}
                    >
                      <circle
                        r={5}
                        fill="#b45309"
                        className="transition-all"
                      />
                      <circle
                        r={9}
                        fill="transparent"
                        stroke="#b45309"
                        strokeWidth={1.5}
                        opacity={0.35}
                      />
                    </g>
                  )
                }}
              />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricInfo({ metric }: { metric: MetricKey }) {
  const meta = METRIC_META[metric]
  return (
    <HoverCard>
      <HoverCardTrigger
        render={
          <button
            type="button"
            className="inline-flex text-muted-foreground hover:text-foreground"
            aria-label={`Definición de ${meta.label}`}
          />
        }
      >
        <InfoIcon className="size-3.5" />
      </HoverCardTrigger>
      <HoverCardContent side="right" className="w-72 text-xs leading-relaxed">
        <p className="font-medium">{meta.label}</p>
        <p className="mt-1 text-muted-foreground">{meta.description}</p>
      </HoverCardContent>
    </HoverCard>
  )
}
