"use client"

import Link from "next/link"
import { useSearchParams, notFound } from "next/navigation"
import { ChevronLeftIcon, ChevronRightIcon, DroneIcon } from "lucide-react"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  METRIC_META,
  buildTimeSeries,
  formatNdvi,
  getCuartelesByPredio,
  getPredio,
  type MetricKey,
} from "@/lib/db"

type SemanaDetailProps = {
  predioId: string
  week: number
}

export function SemanaDetail({ predioId, week }: SemanaDetailProps) {
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

  const hasDrones = drones.some(
    (d) => d.week === week && cuarteles.some((c) => c.id === d.cuartelId)
  )

  const query = searchParams.toString()
  const qs = query ? `?${query}` : ""
  const droneHref = `/predio/${predioId}/semana/${week}/dron${qs}`
  const prevWeek = week > 1 ? week - 1 : null
  const nextWeek = week < weeks.length ? week + 1 : null
  const deltaAvg = point.promedioPredio - point.medianaHistorica

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Cartera", href: "/cartera" },
          { label: `Predio ${predio.nombre}`, href: `/predio/${predio.id}` },
          { label: `Semana ${week}` },
        ]}
      />

      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Satélite · S{week}
          </h1>
          <p className="text-sm text-muted-foreground">
            {point.date} · {METRIC_META[metric].short} · {cultivo}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {prevWeek ? (
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/predio/${predioId}/semana/${prevWeek}${qs}`} />}
            >
              <ChevronLeftIcon data-icon="inline-start" />
              Ant.
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeftIcon data-icon="inline-start" />
              Ant.
            </Button>
          )}
          {nextWeek ? (
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/predio/${predioId}/semana/${nextWeek}${qs}`} />}
            >
              Sig.
              <ChevronRightIcon data-icon="inline-end" />
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Sig.
              <ChevronRightIcon data-icon="inline-end" />
            </Button>
          )}
        </div>
      </section>

      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          deltaAvg < -0.01
            ? "border-red-200 bg-red-50 text-red-900"
            : deltaAvg > 0.01
              ? "border-green-200 bg-green-50 text-green-900"
              : "border-border bg-muted/40 text-muted-foreground"
        }`}
      >
        Δ predio vs mediana histórica:{" "}
        <span className="font-semibold tabular-nums">{formatNdvi(deltaAvg)}</span>
      </div>

      <section className="grid gap-6 sm:grid-cols-2">
        <MapBlock
          title="Histórico"
          value={point.medianaHistorica}
          metric={metric}
          variant="historic"
        />
        <MapBlock
          title="Actual"
          value={point.promedioPredio}
          metric={metric}
          variant="current"
        />
      </section>

      {hasDrones ? (
        <Link
          href={droneHref}
          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-800 ring-1 ring-amber-200">
              <DroneIcon className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium">Hay vuelo de dron esta semana</p>
              <p className="text-xs text-muted-foreground">
                RGB, NDVI, NDWI, térmico y LiDAR
              </p>
            </div>
          </div>
          <ChevronRightIcon className="size-4 text-muted-foreground" />
        </Link>
      ) : null}

      <Card className="py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base font-medium">Valores</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cuartel</TableHead>
                <TableHead>{METRIC_META[metric].short}</TableHead>
                <TableHead>Δ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cuarteles.map((c) => {
                const val = point.cuarteles[c.id]
                const delta = val - point.medianaHistorica
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nombre}</TableCell>
                    <TableCell className="tabular-nums">
                      {val?.toFixed(3)}
                    </TableCell>
                    <TableCell>
                      <Delta value={delta} />
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

function Delta({ value }: { value: number }) {
  const cls =
    value > 0.01
      ? "font-medium text-green-700"
      : value < -0.01
        ? "font-medium text-red-700"
        : "text-muted-foreground"
  return <span className={cls}>{formatNdvi(value)}</span>
}

function MapBlock({
  title,
  value,
  metric,
  variant,
}: {
  title: string
  value: number
  metric: MetricKey
  variant: "historic" | "current"
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium">{title}</h2>
        <span className="text-sm tabular-nums text-muted-foreground">
          {METRIC_META[metric].short} {value.toFixed(3)}
        </span>
      </div>
      <AspectRatio
        ratio={4 / 3}
        className="overflow-hidden rounded-xl ring-1 ring-foreground/10"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              variant === "current"
                ? `radial-gradient(circle at 30% 40%, rgba(255,255,255,0.25), transparent 40%),
                   linear-gradient(135deg, #fde047aa, #22c55ecc, #14532dcc)`
                : `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15), transparent 50%),
                   linear-gradient(160deg, #fcd34daa, #84cc16cc, #166534cc)`,
          }}
        />
      </AspectRatio>
    </div>
  )
}
