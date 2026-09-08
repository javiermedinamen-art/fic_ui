import {
  VASQUEZ_AGRICULTORES,
  VASQUEZ_ASESOR,
  VASQUEZ_COMUNAS,
  VASQUEZ_CUARTELES,
  VASQUEZ_CUARTEL_SERIES,
  VASQUEZ_CULTIVOS,
  VASQUEZ_DRONES,
  VASQUEZ_PREDIOS,
  VASQUEZ_SERIES,
  VASQUEZ_WEEK_DATE,
} from "@/lib/vasquez-data"
import { LIDAR_CLOUD_MANIFEST } from "@/lib/drone-images"

export type MetricKey = "ndvi" | "ndre" | "ndmi" | "gndvi"

export const METRIC_META: Record<
  MetricKey,
  { label: string; short: string; description: string; unit: string }
> = {
  ndvi: {
    label: "NDVI",
    short: "NDVI",
    description:
      "Normalized Difference Vegetation Index (Sentinel-2). Estima vigor vegetativo a partir de reflectancia en rojo e infrarrojo cercano.",
    unit: "índice",
  },
  ndre: {
    label: "Red edge (nm)",
    short: "REDEDGE",
    description:
      "Posición del red edge (Sentinel-2, nm). Proxy de clorofila / estado del dosel; escala fija 700–750 nm.",
    unit: "nm",
  },
  ndmi: {
    label: "NDMI",
    short: "NDMI",
    description:
      "Normalized Difference Moisture Index (Sentinel-2). Relacionado con contenido de agua en la vegetación.",
    unit: "índice",
  },
  gndvi: {
    label: "GNDVI",
    short: "GNDVI",
    description:
      "Green NDVI (Sentinel-2). Variante del NDVI que usa la banda verde.",
    unit: "índice",
  },
}

export type Asesor = {
  id: string
  nombre: string
  iniciales: string
}

export type Agricultor = {
  id: string
  nombre: string
}

export type Predio = {
  id: string
  codigo: string
  nombre: string
  agricultorId: string
  comuna: string
  region: string
  mixtura: "mono" | "mixto"
  lat: number
  lng: number
}

export type Cuartel = {
  id: string
  predioId: string
  nombre: string
  cultivo: string
  hectareas: number
  ndviDesviacion: number
}

export type WeeklyPoint = {
  week: number
  label: string
  date: string
  medianaHistorica: number
  /** valores por cuartelId */
  cuarteles: Record<string, number>
  /** promedio predio (todos los cuarteles del cultivo filtrado) */
  promedioPredio: number
  /** métrica secundaria opcional por cuartel */
  secondary?: Record<string, number>
  secondaryPromedio?: number
  secondaryMediana?: number
}

export type DroneObservation = {
  id: string
  week: number
  cuartelId: string
  metric: MetricKey
  value: number
  layerUrl: string
  label: string
  /** Fecha del vuelo (YYYY-MM-DD), clave para rasters en /public/drone */
  date: string
}

export const ASESOR: Asesor = { ...VASQUEZ_ASESOR }

export const CULTIVOS = [...VASQUEZ_CULTIVOS]

export const COMUNAS = [...VASQUEZ_COMUNAS]

export const AGRICULTORES: Agricultor[] = [...VASQUEZ_AGRICULTORES]

export const PREDIOS: Predio[] = VASQUEZ_PREDIOS.map((p) => ({ ...p }))

export const CUARTELES: Cuartel[] = VASQUEZ_CUARTELES.map((c) => ({ ...c }))

export function getAgricultor(id: string) {
  return AGRICULTORES.find((a) => a.id === id)
}

export function getPredio(id: string) {
  return PREDIOS.find((p) => p.id === id)
}

export function getCuartelesByPredio(predioId: string) {
  return CUARTELES.filter((c) => c.predioId === predioId)
}

/** Superficie total = suma estricta de cuarteles monitoreados */
export function getPredioSuperficie(predioId: string) {
  return getCuartelesByPredio(predioId).reduce((s, c) => s + c.hectareas, 0)
}

type SeriesWeek = {
  historical_median: number | null
  value_2026: number | null
}

function seriesFor(predioId: string, metric: MetricKey): Record<string, SeriesWeek> {
  const byPredio = VASQUEZ_SERIES[predioId as keyof typeof VASQUEZ_SERIES]
  if (!byPredio) return {}
  return (byPredio[metric] ?? {}) as Record<string, SeriesWeek>
}

function cuartelSeriesFor(
  predioId: string,
  cuartelId: string,
  metric: MetricKey
): Record<string, SeriesWeek> {
  const byPredio =
    VASQUEZ_CUARTEL_SERIES[predioId as keyof typeof VASQUEZ_CUARTEL_SERIES]
  if (!byPredio) return {}
  const byCu =
    byPredio[cuartelId as keyof typeof byPredio] as
      | Record<MetricKey, Record<string, SeriesWeek>>
      | undefined
  if (!byCu) return {}
  return (byCu[metric] ?? {}) as Record<string, SeriesWeek>
}

function weekValue(
  series: Record<string, SeriesWeek>,
  week: number
): SeriesWeek | null {
  return series[String(week)] ?? series[week as unknown as string] ?? null
}

function pickCurrent(point: SeriesWeek | null): number | null {
  if (!point) return null
  if (point.value_2026 != null) return point.value_2026
  return null
}

function pickHist(point: SeriesWeek | null): number | null {
  if (!point) return null
  if (point.historical_median != null) return point.historical_median
  return point.value_2026
}

/**
 * Jerarquía: cada cuartel usa su media zonal Sentinel-2.
 * El promedio del predio (para el cultivo filtrado) es el promedio ponderado por ha.
 */
function buildMetricWeek(
  predioId: string,
  metric: MetricKey,
  week: number,
  cuarteles: Cuartel[]
): {
  medianaHistorica: number
  cuartelValues: Record<string, number>
  promedioPredio: number
} | null {
  const predioPoint = weekValue(seriesFor(predioId, metric), week)

  const cuartelValues: Record<string, number> = {}
  const cuartelHist: Record<string, number> = {}
  let weightSum = 0
  let valueSum = 0
  let histSum = 0
  let histWeight = 0

  for (const c of cuarteles) {
    const point = weekValue(cuartelSeriesFor(predioId, c.id, metric), week)
    const current = pickCurrent(point)
    const hist = pickHist(point)

    // Fallback AOI solo si el cuartel no tiene píxeles válidos esa semana
    const fallbackCurrent = pickCurrent(predioPoint)
    const fallbackHist = pickHist(predioPoint)

    const v = current ?? fallbackCurrent
    const h = hist ?? fallbackHist
    if (v == null && h == null) continue

    const value = +(v ?? h ?? 0).toFixed(4)
    cuartelValues[c.id] = value
    if (h != null) {
      cuartelHist[c.id] = +h.toFixed(4)
      histSum += h * c.hectareas
      histWeight += c.hectareas
    }

    valueSum += value * c.hectareas
    weightSum += c.hectareas
  }

  if (!weightSum) {
    // sin cuarteles: usar AOI predio
    if (!predioPoint) return null
    const medianaHistorica = +(
      pickHist(predioPoint) ??
      pickCurrent(predioPoint) ??
      0
    ).toFixed(4)
    const promedioPredio = +(
      pickCurrent(predioPoint) ?? medianaHistorica
    ).toFixed(4)
    return { medianaHistorica, cuartelValues: {}, promedioPredio }
  }

  const promedioPredio = +(valueSum / weightSum).toFixed(4)
  const medianaHistorica = histWeight
    ? +(histSum / histWeight).toFixed(4)
    : +(pickHist(predioPoint) ?? promedioPredio).toFixed(4)

  return { medianaHistorica, cuartelValues, promedioPredio }
}

/** Serie semanal año actual + mediana histórica (Sentinel-2 fic_agro). */
export function buildTimeSeries(
  predioId: string,
  metric: MetricKey,
  cultivo: string,
  secondary?: MetricKey
): { weeks: WeeklyPoint[]; drones: DroneObservation[] } {
  const cuarteles = getCuartelesByPredio(predioId).filter((c) => c.cultivo === cultivo)
  const series = seriesFor(predioId, metric)
  const weekSet = new Set<number>()
  for (const w of Object.keys(series)) weekSet.add(Number(w))
  for (const c of cuarteles) {
    for (const w of Object.keys(cuartelSeriesFor(predioId, c.id, metric))) {
      weekSet.add(Number(w))
    }
  }
  const weekNums = [...weekSet]
    .filter((w) => Number.isFinite(w))
    .sort((a, b) => a - b)

  const weeks: WeeklyPoint[] = []

  for (const week of weekNums) {
    const primary = buildMetricWeek(predioId, metric, week, cuarteles)
    if (!primary) continue

    let secondaryMap: Record<string, number> | undefined
    let secondaryPromedio: number | undefined
    let secondaryMediana: number | undefined

    if (secondary) {
      const sec = buildMetricWeek(predioId, secondary, week, cuarteles)
      if (sec) {
        secondaryMap = sec.cuartelValues
        secondaryPromedio = sec.promedioPredio
        secondaryMediana = sec.medianaHistorica
      }
    }

    const date =
      VASQUEZ_WEEK_DATE[String(week) as keyof typeof VASQUEZ_WEEK_DATE] ??
      `2026-W${String(week).padStart(2, "0")}`

    weeks.push({
      week,
      label: `S${week}`,
      date,
      medianaHistorica: primary.medianaHistorica,
      cuarteles: primary.cuartelValues,
      promedioPredio: primary.promedioPredio,
      secondary: secondaryMap,
      secondaryPromedio,
      secondaryMediana,
    })
  }

  const rawDrones = VASQUEZ_DRONES[predioId as keyof typeof VASQUEZ_DRONES] ?? []
  const cultivoIds = new Set(cuarteles.map((c) => c.id))
  const drones: DroneObservation[] = rawDrones
    .filter((d) => cultivoIds.has(d.cuartelId))
    .map((d) => ({
      id: d.id,
      week: d.week,
      cuartelId: d.cuartelId,
      metric: d.metric as MetricKey,
      value: d.value,
      layerUrl: d.layerUrl,
      label: d.label,
      date: "date" in d && typeof d.date === "string" ? d.date : "",
    }))

  // Asegura semanas con nube LiDAR aunque no haya orto RGB/NDVI ese día
  for (const [key, file] of Object.entries(LIDAR_CLOUD_MANIFEST)) {
    const [pid, date] = key.split("|")
    if (pid !== predioId || !date) continue
    const week = isoWeekFromYmd(date)
    if (!week) continue
    for (const c of cuarteles) {
      if (drones.some((d) => d.week === week && d.cuartelId === c.id)) continue
      drones.push({
        id: `lidar-${pid}-${week}-${c.id}`,
        week,
        cuartelId: c.id,
        metric: "ndvi",
        value: 0,
        layerUrl: `#lidar-${file}`,
        label: `Vuelo LiDAR · ${c.nombre} · ${date}`,
        date,
      })
    }
  }

  return { weeks, drones }
}

function isoWeekFromYmd(isoDate: string): number | null {
  const d = new Date(`${isoDate}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return null
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export function formatNdvi(v: number) {
  const sign = v > 0 ? "+" : ""
  return `${sign}${v.toFixed(3)}`
}

/** Desviación vs histórico según métrica satelital */
export function getMetricDeviation(
  ndviDesviacion: number,
  metric: MetricKey
): number {
  switch (metric) {
    case "ndvi":
      return ndviDesviacion
    case "ndre":
      return +(ndviDesviacion * 0.92).toFixed(4)
    case "ndmi":
      return +(ndviDesviacion * 0.85).toFixed(4)
    case "gndvi":
      return +(ndviDesviacion * 0.95).toFixed(4)
  }
}

export function weightedMetricDeviation(
  items: { hectareas: number; ndviDesviacion: number }[],
  metric: MetricKey
) {
  const total = items.reduce((s, r) => s + r.hectareas, 0)
  if (!total) return 0
  return (
    items.reduce(
      (s, r) => s + getMetricDeviation(r.ndviDesviacion, metric) * r.hectareas,
      0
    ) / total
  )
}

export function haBucket(ha: number) {
  if (ha < 5) return "lt5"
  if (ha <= 10) return "5to10"
  return "gt10"
}

/** Semanas disponibles para static export (unión de series Vasquez). */
export function getAvailableWeeks(): number[] {
  const set = new Set<number>()
  for (const predioId of Object.keys(VASQUEZ_SERIES)) {
    const ndvi = seriesFor(predioId, "ndvi")
    for (const w of Object.keys(ndvi)) set.add(Number(w))
  }
  return [...set].filter((w) => Number.isFinite(w)).sort((a, b) => a - b)
}
