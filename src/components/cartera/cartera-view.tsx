"use client"

import Link from "next/link"
import { ChevronRightIcon, InfoIcon, SearchIcon, XIcon } from "lucide-react"

import * as React from "react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  tabsListVariants,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ASESOR,
  AGRICULTORES,
  COMUNAS,
  CUARTELES,
  CULTIVOS,
  METRIC_META,
  PREDIOS,
  formatNdvi,
  getAgricultor,
  getPredioSuperficie,
  haBucket,
  weightedMetricDeviation,
  type MetricKey,
} from "@/lib/db"

type TabKey = "predio" | "agricultor" | "comuna"

const HA_LABELS: Record<string, string> = {
  lt5: "< 5 ha",
  "5to10": "5–10 ha",
  gt10: "> 10 ha",
}

export function CarteraView() {
  const [tab, setTab] = React.useState<TabKey>("predio")
  const [metric, setMetric] = React.useState<MetricKey>("ndvi")
  const [search, setSearch] = React.useState("")
  const [sortKey, setSortKey] = React.useState("metric")
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc")
  const [cultivoF, setCultivoF] = React.useState<Set<string>>(new Set())
  const [comunaF, setComunaF] = React.useState<Set<string>>(new Set())
  const [haF, setHaF] = React.useState<Set<string>>(new Set())

  const metricMeta = METRIC_META[metric]

  const filteredCuarteles = React.useMemo(() => {
    return CUARTELES.filter((r) => {
      if (cultivoF.size && !cultivoF.has(r.cultivo)) return false
      const predio = PREDIOS.find((p) => p.id === r.predioId)
      if (comunaF.size && predio && !comunaF.has(predio.comuna)) return false
      if (haF.size && !haF.has(haBucket(r.hectareas))) return false
      return true
    })
  }, [cultivoF, comunaF, haF])

  function MetricCell({ value }: { value: number }) {
    const cls =
      value > 0.01
        ? "bg-green-100 text-green-800"
        : value < -0.01
          ? "bg-red-100 text-red-800"
          : "bg-muted text-muted-foreground"
    return (
      <span
        className={`inline-flex min-w-[4.5rem] justify-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${cls}`}
      >
        {formatNdvi(value)}
      </span>
    )
  }

  const predioRows = React.useMemo(() => {
    const map = new Map<
      string,
      {
        id: string
        nombre: string
        agricultor: string
        comuna: string
        cultivos: Set<string>
        items: typeof filteredCuarteles
      }
    >()
    for (const r of filteredCuarteles) {
      const predio = PREDIOS.find((p) => p.id === r.predioId)!
      if (!map.has(predio.id)) {
        map.set(predio.id, {
          id: predio.id,
          nombre: predio.nombre,
          agricultor: getAgricultor(predio.agricultorId)?.nombre ?? "",
          comuna: predio.comuna,
          cultivos: new Set(),
          items: [],
        })
      }
      const g = map.get(predio.id)!
      g.cultivos.add(r.cultivo)
      g.items.push(r)
    }
    return [...map.values()].map((g) => {
      const ha = g.items.reduce((s, r) => s + r.hectareas, 0)
      return {
        id: g.id,
        nombre: g.nombre,
        agricultor: g.agricultor,
        comuna: g.comuna,
        cultivos: [...g.cultivos].join(", "),
        cuarteles: g.items.length,
        ha,
        delta: weightedMetricDeviation(g.items, metric),
        search: `${g.nombre} ${g.agricultor} ${g.comuna}`,
      }
    })
  }, [filteredCuarteles, metric])

  const agricultorRows = React.useMemo(() => {
    const map = new Map<
      string,
      {
        nombre: string
        predios: Set<string>
        comunas: Set<string>
        items: typeof filteredCuarteles
      }
    >()
    for (const r of filteredCuarteles) {
      const predio = PREDIOS.find((p) => p.id === r.predioId)!
      const ag = getAgricultor(predio.agricultorId)!
      if (!map.has(ag.id)) {
        map.set(ag.id, {
          nombre: ag.nombre,
          predios: new Set(),
          comunas: new Set(),
          items: [],
        })
      }
      const g = map.get(ag.id)!
      g.predios.add(predio.id)
      g.comunas.add(predio.comuna)
      g.items.push(r)
    }
    return [...map.values()].map((g) => {
      const ha = g.items.reduce((s, r) => s + r.hectareas, 0)
      return {
        id: g.nombre,
        nombre: g.nombre,
        predios: g.predios.size,
        cuarteles: g.items.length,
        comunas: [...g.comunas].join(", "),
        ha,
        delta: weightedMetricDeviation(g.items, metric),
        search: `${g.nombre} ${[...g.comunas].join(" ")}`,
      }
    })
  }, [filteredCuarteles, metric])

  const comunaRows = React.useMemo(() => {
    const map = new Map<
      string,
      {
        agricultores: Set<string>
        predios: Set<string>
        items: typeof filteredCuarteles
      }
    >()
    for (const r of filteredCuarteles) {
      const predio = PREDIOS.find((p) => p.id === r.predioId)!
      if (!map.has(predio.comuna)) {
        map.set(predio.comuna, {
          agricultores: new Set(),
          predios: new Set(),
          items: [],
        })
      }
      const g = map.get(predio.comuna)!
      g.agricultores.add(predio.agricultorId)
      g.predios.add(predio.id)
      g.items.push(r)
    }
    return [...map.entries()].map(([comuna, g]) => {
      const ha = g.items.reduce((s, r) => s + r.hectareas, 0)
      return {
        id: comuna,
        nombre: comuna,
        agricultores: g.agricultores.size,
        predios: g.predios.size,
        cuarteles: g.items.length,
        ha,
        delta: weightedMetricDeviation(g.items, metric),
        search: comuna,
      }
    })
  }, [filteredCuarteles, metric])

  function sortRows<
    T extends { delta: number; ha: number; nombre: string; search: string },
  >(rows: T[]) {
    let list = rows
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((r) => r.search.toLowerCase().includes(q))
    }
    return [...list].sort((a, b) => {
      const av =
        sortKey === "ha" ? a.ha : sortKey === "nombre" ? a.nombre : a.delta
      const bv =
        sortKey === "ha" ? b.ha : sortKey === "nombre" ? b.nombre : b.delta
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), "es")
      return sortDir === "asc" ? cmp : -cmp
    })
  }

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  function SortHead({ label, k }: { label: string; k: string }) {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-foreground"
        onClick={() => toggleSort(k)}
      >
        {label}
        {sortKey === k ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
      </button>
    )
  }

  function toggleSet(
    set: Set<string>,
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    value: string,
    checked: boolean
  ) {
    const next = new Set(set)
    if (checked) next.add(value)
    else next.delete(value)
    setter(next)
  }

  function clearFilters() {
    setCultivoF(new Set())
    setComunaF(new Set())
    setHaF(new Set())
  }

  const activeChips = [
    ...[...cultivoF].map((v) => ({
      key: `c-${v}`,
      label: v,
      clear: () =>
        setCultivoF((s) => {
          const n = new Set(s)
          n.delete(v)
          return n
        }),
    })),
    ...[...comunaF].map((v) => ({
      key: `m-${v}`,
      label: v,
      clear: () =>
        setComunaF((s) => {
          const n = new Set(s)
          n.delete(v)
          return n
        }),
    })),
    ...[...haF].map((v) => ({
      key: `h-${v}`,
      label: HA_LABELS[v] ?? v,
      clear: () =>
        setHaF((s) => {
          const n = new Set(s)
          n.delete(v)
          return n
        }),
    })),
  ]

  const visibleCount =
    tab === "predio"
      ? sortRows(predioRows).length
      : tab === "agricultor"
        ? sortRows(agricultorRows).length
        : sortRows(comunaRows).length

  const kpis = [
    { value: AGRICULTORES.length, label: "Agricultores" },
    { value: PREDIOS.length, label: "Predios" },
    { value: CUARTELES.length, label: "Cuarteles" },
    { value: CULTIVOS.length, label: "Cultivos" },
  ]

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader crumbs={[{ label: "Home", href: "/" }, { label: "Cartera" }]} />

      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Hola, {ASESOR.nombre.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          Prioriza predios con peor desviación y abre su monitoreo.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-border bg-card px-4 py-4 text-center"
          >
            <p className="text-2xl font-semibold tabular-nums tracking-tight">
              {k.value}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <Card className="overflow-hidden py-0">
          <CardContent className="space-y-3 p-4 sm:p-5">
            <Tabs
              value={tab}
              onValueChange={(v) => {
                if (v === "predio" || v === "agricultor" || v === "comuna") {
                  setTab(v)
                  setSortKey("metric")
                  setSortDir("asc")
                }
              }}
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <TabsList>
                    <TabsTrigger value="predio">Predio</TabsTrigger>
                    <TabsTrigger value="agricultor">Agricultor</TabsTrigger>
                    <TabsTrigger value="comuna">Comuna</TabsTrigger>
                  </TabsList>

                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <div
                      role="group"
                      aria-label="Métrica"
                      className={cn(tabsListVariants({ variant: "default" }), "h-8")}
                    >
                      {(Object.keys(METRIC_META) as MetricKey[]).map((k) => {
                        const active = metric === k
                        return (
                          <button
                            key={k}
                            type="button"
                            aria-pressed={active}
                            onClick={() => {
                              setMetric(k)
                              setSortKey("metric")
                              setSortDir("asc")
                            }}
                            className={cn(
                              "inline-flex h-[calc(100%-1px)] items-center justify-center rounded-md px-2 py-0.5 text-sm font-medium transition-all",
                              active
                                ? "bg-background text-foreground shadow-sm"
                                : "text-foreground/60 hover:text-foreground"
                            )}
                          >
                            {METRIC_META[k].short}
                          </button>
                        )
                      })}
                    </div>
                    <HoverCard>
                      <HoverCardTrigger
                        render={
                          <button
                            type="button"
                            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label={`Qué es ${metricMeta.label}`}
                          />
                        }
                      >
                        <InfoIcon className="size-3.5" />
                      </HoverCardTrigger>
                      <HoverCardContent
                        side="bottom"
                        align="end"
                        className="w-72 text-xs leading-relaxed"
                      >
                        <p className="font-medium">{metricMeta.label}</p>
                        <p className="mt-1 text-muted-foreground">
                          {metricMeta.description}
                        </p>
                        <p className="mt-2 text-muted-foreground">
                          La columna Δ muestra la desviación frente al
                          histórico del cuartel para esta métrica.
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    {visibleCount} resultado{visibleCount === 1 ? "" : "s"}
                    {" · "}
                    ordenado por Δ {metricMeta.short} (peor primero)
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <span className="size-2 rounded-full bg-red-500" /> Negativo
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="size-2 rounded-full bg-neutral-400" /> Neutro
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="size-2 rounded-full bg-green-600" /> Positivo
                    </span>
                  </div>
                </div>
              </div>

              {activeChips.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {activeChips.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={chip.clear}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs hover:bg-muted"
                    >
                      {chip.label}
                      <XIcon className="size-3" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    Limpiar todo
                  </button>
                </div>
              ) : null}

              <div className="relative max-w-sm">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <TabsContent value="predio" className="mt-1">
                <DataTableOrEmpty empty={visibleCount === 0}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <SortHead label="Predio" k="nombre" />
                        </TableHead>
                        <TableHead>Agricultor</TableHead>
                        <TableHead>Comuna</TableHead>
                        <TableHead>Cultivos</TableHead>
                        <TableHead>
                          <SortHead label="Ha" k="ha" />
                        </TableHead>
                        <TableHead>
                          <SortHead label={`Δ ${metricMeta.short}`} k="metric" />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortRows(predioRows).map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <Link
                              href={`/predio/${r.id}`}
                              className="group inline-flex items-center gap-1 font-medium underline decoration-transparent underline-offset-4 transition-colors hover:decoration-foreground"
                            >
                              {r.nombre}
                              <ChevronRightIcon className="size-3.5 opacity-40 transition-opacity group-hover:opacity-100" />
                            </Link>
                            <div className="text-xs text-muted-foreground">
                              {getPredioSuperficie(r.id).toFixed(1)} ha ·{" "}
                              {r.cuarteles} cuarteles
                            </div>
                          </TableCell>
                          <TableCell>{r.agricultor}</TableCell>
                          <TableCell>{r.comuna}</TableCell>
                          <TableCell className="max-w-[10rem] truncate">
                            {r.cultivos}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {r.ha.toFixed(1)}
                          </TableCell>
                          <TableCell>
                            <MetricCell value={r.delta} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </DataTableOrEmpty>
              </TabsContent>

              <TabsContent value="agricultor" className="mt-1">
                <DataTableOrEmpty empty={visibleCount === 0}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <SortHead label="Agricultor" k="nombre" />
                        </TableHead>
                        <TableHead>Predios</TableHead>
                        <TableHead>Comunas</TableHead>
                        <TableHead>
                          <SortHead label="Ha" k="ha" />
                        </TableHead>
                        <TableHead>
                          <SortHead label={`Δ ${metricMeta.short}`} k="metric" />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortRows(agricultorRows).map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.nombre}</TableCell>
                          <TableCell>{r.predios}</TableCell>
                          <TableCell className="max-w-[12rem] truncate">
                            {r.comunas}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {r.ha.toFixed(1)}
                          </TableCell>
                          <TableCell>
                            <MetricCell value={r.delta} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </DataTableOrEmpty>
              </TabsContent>

              <TabsContent value="comuna" className="mt-1">
                <DataTableOrEmpty empty={visibleCount === 0}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <SortHead label="Comuna" k="nombre" />
                        </TableHead>
                        <TableHead>Agricultores</TableHead>
                        <TableHead>Predios</TableHead>
                        <TableHead>
                          <SortHead label="Ha" k="ha" />
                        </TableHead>
                        <TableHead>
                          <SortHead label={`Δ ${metricMeta.short}`} k="metric" />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortRows(comunaRows).map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.nombre}</TableCell>
                          <TableCell>{r.agricultores}</TableCell>
                          <TableCell>{r.predios}</TableCell>
                          <TableCell className="tabular-nums">
                            {r.ha.toFixed(1)}
                          </TableCell>
                          <TableCell>
                            <MetricCell value={r.delta} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </DataTableOrEmpty>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <aside className="flex h-fit flex-col overflow-hidden rounded-xl border border-border bg-card text-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-medium">Filtros</h2>
          </div>
          <div className="max-h-[70vh] space-y-4 overflow-auto px-4 py-4">
            <FilterGroup title="Cultivo">
              {CULTIVOS.map((c) => (
                <FilterCheck
                  key={c}
                  id={`cult-${c}`}
                  label={c}
                  checked={cultivoF.has(c)}
                  onChange={(v) => toggleSet(cultivoF, setCultivoF, c, v)}
                />
              ))}
            </FilterGroup>
            <Separator />
            <FilterGroup title="Comuna">
              {COMUNAS.map((c) => (
                <FilterCheck
                  key={c}
                  id={`com-${c}`}
                  label={c}
                  checked={comunaF.has(c)}
                  onChange={(v) => toggleSet(comunaF, setComunaF, c, v)}
                />
              ))}
            </FilterGroup>
            <Separator />
            <FilterGroup title="Hectáreas (cuartel)">
              {(
                [
                  ["lt5", "Menor a 5"],
                  ["5to10", "Entre 5 y 10"],
                  ["gt10", "Mayor a 10"],
                ] as const
              ).map(([id, label]) => (
                <FilterCheck
                  key={id}
                  id={`ha-${id}`}
                  label={label}
                  checked={haF.has(id)}
                  onChange={(v) => toggleSet(haF, setHaF, id, v)}
                />
              ))}
            </FilterGroup>
          </div>
          <div className="border-t px-4 py-3">
            <Button
              variant="outline"
              className="w-full"
              size="sm"
              onClick={clearFilters}
              disabled={activeChips.length === 0}
            >
              Limpiar filtros
            </Button>
          </div>
        </aside>
      </div>
    </main>
  )
}

function DataTableOrEmpty({
  empty,
  children,
}: {
  empty: boolean
  children: React.ReactNode
}) {
  if (empty) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-12 text-center">
        <p className="text-sm font-medium">Sin resultados</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Prueba quitando filtros o cambiando la búsqueda.
        </p>
      </div>
    )
  }
  return <div className="overflow-hidden rounded-lg border">{children}</div>
}

function FilterGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </legend>
      <div className="space-y-2">{children}</div>
    </fieldset>
  )
}

function FilterCheck({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(!!v)}
      />
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
    </div>
  )
}
