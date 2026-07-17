export type MetricKey = "ndvi" | "ndre" | "ndmi" | "gndvi"

export const METRIC_META: Record<
  MetricKey,
  { label: string; short: string; description: string; unit: string }
> = {
  ndvi: {
    label: "NDVI",
    short: "NDVI",
    description:
      "Normalized Difference Vegetation Index. Estima vigor vegetativo a partir de reflectancia en rojo e infrarrojo cercano. Valores altos indican mayor actividad fotosintética.",
    unit: "índice",
  },
  ndre: {
    label: "NDRE",
    short: "NDRE",
    description:
      "Normalized Difference Red Edge. Más sensible a clorofila en doseles densos; útil en etapas avanzadas del cultivo.",
    unit: "índice",
  },
  ndmi: {
    label: "NDMI",
    short: "NDMI",
    description:
      "Normalized Difference Moisture Index. Relacionado con contenido de agua en la vegetación y estrés hídrico.",
    unit: "índice",
  },
  gndvi: {
    label: "GNDVI",
    short: "GNDVI",
    description:
      "Green NDVI. Variante del NDVI que usa la banda verde; suele correlacionarse con nitrógeno foliar.",
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
}

export const ASESOR: Asesor = {
  id: "asesor-01",
  nombre: "Camila Mendoza",
  iniciales: "CM",
}

export const CULTIVOS = [
  "Paltos",
  "Cítricos",
  "Uva de mesa",
  "Nogales",
  "Olivos",
  "Cerezos",
] as const

export const COMUNAS = [
  "Quillota",
  "La Cruz",
  "Nogales",
  "Hijuelas",
  "Limache",
  "Olmue",
  "San Felipe",
  "Los Andes",
] as const

export const AGRICULTORES: Agricultor[] = [
  { id: "ag-01", nombre: "Pedro González" },
  { id: "ag-02", nombre: "María López" },
  { id: "ag-03", nombre: "Ana Torres" },
  { id: "ag-04", nombre: "Carlos Rivas" },
  { id: "ag-05", nombre: "Lucía Vargas" },
  { id: "ag-06", nombre: "Jorge Castillo" },
  { id: "ag-07", nombre: "Elena Soto" },
  { id: "ag-08", nombre: "Diego Fuentes" },
  { id: "ag-09", nombre: "Patricia Núñez" },
  { id: "ag-10", nombre: "Andrés Pizarro" },
  { id: "ag-11", nombre: "Sofía Herrera" },
  { id: "ag-12", nombre: "Miguel Bravo" },
]

export const PREDIOS: Predio[] = [
  { id: "pr-01", codigo: "PR-QLT-001", nombre: "Los Olivos", agricultorId: "ag-01", comuna: "Quillota", region: "Valparaíso", mixtura: "mixto", lat: -32.88, lng: -71.25 },
  { id: "pr-02", codigo: "PR-QLT-002", nombre: "Santa Rosa", agricultorId: "ag-01", comuna: "Quillota", region: "Valparaíso", mixtura: "mono", lat: -32.9, lng: -71.22 },
  { id: "pr-03", codigo: "PR-LCZ-003", nombre: "El Mirador", agricultorId: "ag-02", comuna: "La Cruz", region: "Valparaíso", mixtura: "mixto", lat: -32.82, lng: -71.23 },
  { id: "pr-04", codigo: "PR-LCZ-004", nombre: "Las Palmas", agricultorId: "ag-02", comuna: "La Cruz", region: "Valparaíso", mixtura: "mono", lat: -32.81, lng: -71.2 },
  { id: "pr-05", codigo: "PR-NOG-005", nombre: "San José", agricultorId: "ag-03", comuna: "Nogales", region: "Valparaíso", mixtura: "mixto", lat: -32.73, lng: -71.2 },
  { id: "pr-06", codigo: "PR-NOG-006", nombre: "La Esperanza", agricultorId: "ag-03", comuna: "Nogales", region: "Valparaíso", mixtura: "mono", lat: -32.74, lng: -71.18 },
  { id: "pr-07", codigo: "PR-HIJ-007", nombre: "Fundo Altos", agricultorId: "ag-04", comuna: "Hijuelas", region: "Valparaíso", mixtura: "mixto", lat: -32.8, lng: -71.15 },
  { id: "pr-08", codigo: "PR-HIJ-008", nombre: "El Roble", agricultorId: "ag-04", comuna: "Hijuelas", region: "Valparaíso", mixtura: "mono", lat: -32.79, lng: -71.12 },
  { id: "pr-09", codigo: "PR-LIM-009", nombre: "Vista Hermosa", agricultorId: "ag-05", comuna: "Limache", region: "Valparaíso", mixtura: "mixto", lat: -33.01, lng: -71.27 },
  { id: "pr-10", codigo: "PR-LIM-010", nombre: "Los Lingues", agricultorId: "ag-05", comuna: "Limache", region: "Valparaíso", mixtura: "mono", lat: -33.02, lng: -71.25 },
  { id: "pr-11", codigo: "PR-OLM-011", nombre: "Santa Inés", agricultorId: "ag-06", comuna: "Olmue", region: "Valparaíso", mixtura: "mixto", lat: -33.0, lng: -71.18 },
  { id: "pr-12", codigo: "PR-OLM-012", nombre: "El Sauce", agricultorId: "ag-06", comuna: "Olmue", region: "Valparaíso", mixtura: "mono", lat: -32.99, lng: -71.16 },
  { id: "pr-13", codigo: "PR-SFE-013", nombre: "Las Brisas", agricultorId: "ag-07", comuna: "San Felipe", region: "Valparaíso", mixtura: "mixto", lat: -32.75, lng: -70.73 },
  { id: "pr-14", codigo: "PR-SFE-014", nombre: "Don Manuel", agricultorId: "ag-07", comuna: "San Felipe", region: "Valparaíso", mixtura: "mono", lat: -32.76, lng: -70.7 },
  { id: "pr-15", codigo: "PR-AND-015", nombre: "Cerro Verde", agricultorId: "ag-08", comuna: "Los Andes", region: "Valparaíso", mixtura: "mixto", lat: -32.83, lng: -70.6 },
  { id: "pr-16", codigo: "PR-AND-016", nombre: "La Cascada", agricultorId: "ag-08", comuna: "Los Andes", region: "Valparaíso", mixtura: "mono", lat: -32.84, lng: -70.58 },
  { id: "pr-17", codigo: "PR-QLT-017", nombre: "Parcela 12", agricultorId: "ag-09", comuna: "Quillota", region: "Valparaíso", mixtura: "mixto", lat: -32.87, lng: -71.28 },
  { id: "pr-18", codigo: "PR-LCZ-018", nombre: "Los Aromos", agricultorId: "ag-09", comuna: "La Cruz", region: "Valparaíso", mixtura: "mono", lat: -32.83, lng: -71.21 },
  { id: "pr-19", codigo: "PR-NOG-019", nombre: "San Pedro", agricultorId: "ag-10", comuna: "Nogales", region: "Valparaíso", mixtura: "mixto", lat: -32.72, lng: -71.19 },
  { id: "pr-20", codigo: "PR-HIJ-020", nombre: "El Arrayán", agricultorId: "ag-10", comuna: "Hijuelas", region: "Valparaíso", mixtura: "mono", lat: -32.78, lng: -71.14 },
  { id: "pr-21", codigo: "PR-LIM-021", nombre: "La Quinta", agricultorId: "ag-11", comuna: "Limache", region: "Valparaíso", mixtura: "mixto", lat: -33.0, lng: -71.26 },
  { id: "pr-22", codigo: "PR-OLM-022", nombre: "Fundo Norte", agricultorId: "ag-11", comuna: "Olmue", region: "Valparaíso", mixtura: "mono", lat: -32.98, lng: -71.17 },
  { id: "pr-23", codigo: "PR-SFE-023", nombre: "Los Peumos", agricultorId: "ag-12", comuna: "San Felipe", region: "Valparaíso", mixtura: "mixto", lat: -32.74, lng: -70.72 },
  { id: "pr-24", codigo: "PR-AND-024", nombre: "Santa Clara", agricultorId: "ag-12", comuna: "Los Andes", region: "Valparaíso", mixtura: "mono", lat: -32.85, lng: -70.59 },
]

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function buildCuarteles(): Cuartel[] {
  const rand = seededRandom(42)
  const rows: Cuartel[] = []
  let n = 1

  for (const predio of PREDIOS) {
    const cuartelCount = 3 + Math.floor(rand() * 4)
    const cultivosPredio =
      predio.mixtura === "mono"
        ? [CULTIVOS[Math.floor(rand() * CULTIVOS.length)]]
        : [
            CULTIVOS[Math.floor(rand() * CULTIVOS.length)],
            CULTIVOS[Math.floor(rand() * CULTIVOS.length)],
          ].filter((v, i, a) => a.indexOf(v) === i)

    if (cultivosPredio.length === 1 && predio.mixtura === "mixto") {
      cultivosPredio.push(
        CULTIVOS[(CULTIVOS.indexOf(cultivosPredio[0] as (typeof CULTIVOS)[number]) + 2) % CULTIVOS.length]
      )
    }

    for (let i = 0; i < cuartelCount; i++) {
      const cultivo = cultivosPredio[i % cultivosPredio.length]
      const hectareas = +(1.2 + rand() * 14).toFixed(1)
      const ndviDesviacion = +((rand() - 0.48) * 0.42).toFixed(3)

      rows.push({
        id: `cu-${String(n).padStart(3, "0")}`,
        predioId: predio.id,
        nombre: `Cuartel ${String.fromCharCode(65 + i)}`,
        cultivo,
        hectareas,
        ndviDesviacion,
      })
      n += 1
    }
  }
  return rows
}

export const CUARTELES = buildCuarteles()

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

function metricBaseline(metric: MetricKey, week: number, rand: () => number) {
  const seasonal = 0.55 + 0.18 * Math.sin(((week - 8) / 52) * Math.PI * 2)
  const noise = (rand() - 0.5) * 0.04
  const offset =
    metric === "ndvi" ? 0 : metric === "ndre" ? -0.05 : metric === "ndmi" ? -0.08 : -0.03
  return +(seasonal + offset + noise).toFixed(3)
}

/** Serie semanal año actual + mediana histórica regional */
export function buildTimeSeries(
  predioId: string,
  metric: MetricKey,
  cultivo: string,
  secondary?: MetricKey
): { weeks: WeeklyPoint[]; drones: DroneObservation[] } {
  const cuarteles = getCuartelesByPredio(predioId).filter((c) => c.cultivo === cultivo)
  const rand = seededRandom(
    predioId.split("").reduce((a, c) => a + c.charCodeAt(0), metric.length * 17)
  )

  const weeks: WeeklyPoint[] = []
  const drones: DroneObservation[] = []

  for (let week = 1; week <= 26; week++) {
    const medianaHistorica = metricBaseline(metric, week, rand)
    const cuartelValues: Record<string, number> = {}
    let sum = 0

    for (const c of cuarteles) {
      const drift = c.ndviDesviacion * (0.6 + rand() * 0.8)
      const v = +(medianaHistorica + drift + (rand() - 0.5) * 0.03).toFixed(3)
      cuartelValues[c.id] = v
      sum += v
    }

    const promedioPredio = cuarteles.length ? +(sum / cuarteles.length).toFixed(3) : 0

    let secondaryMap: Record<string, number> | undefined
    let secondaryPromedio: number | undefined
    let secondaryMediana: number | undefined

    if (secondary) {
      secondaryMediana = metricBaseline(secondary, week, rand)
      secondaryMap = {}
      let s2 = 0
      for (const c of cuarteles) {
        const v = +(
          (secondaryMediana ?? 0) +
          c.ndviDesviacion * 0.5 +
          (rand() - 0.5) * 0.025
        ).toFixed(3)
        secondaryMap[c.id] = v
        s2 += v
      }
      secondaryPromedio = cuarteles.length ? +(s2 / cuarteles.length).toFixed(3) : 0
    }

    const month = Math.ceil(week / 4.34)
    const day = ((week - 1) % 4) * 7 + 3
    weeks.push({
      week,
      label: `S${week}`,
      date: `2026-${String(Math.min(month, 6)).padStart(2, "0")}-${String(Math.min(day, 28)).padStart(2, "0")}`,
      medianaHistorica,
      cuarteles: cuartelValues,
      promedioPredio,
      secondary: secondaryMap,
      secondaryPromedio,
      secondaryMediana,
    })

    // Vuelos de dron esporádicos (no serie continua)
    if (week % 5 === 0 && cuarteles.length) {
      const c = cuarteles[Math.floor(rand() * cuarteles.length)]
      drones.push({
        id: `drone-${predioId}-${week}-${c.id}`,
        week,
        cuartelId: c.id,
        metric,
        value: cuartelValues[c.id],
        layerUrl: `#drone-layer-${c.id}-w${week}`,
        label: `Vuelo dron · ${c.nombre}`,
      })
    }
  }

  return { weeks, drones }
}

export function formatNdvi(v: number) {
  const sign = v > 0 ? "+" : ""
  return `${sign}${v.toFixed(3)}`
}

/** Desviación vs histórico según métrica satelital (mock a partir de Δ NDVI del cuartel) */
export function getMetricDeviation(
  ndviDesviacion: number,
  metric: MetricKey
): number {
  switch (metric) {
    case "ndvi":
      return ndviDesviacion
    case "ndre":
      return +(ndviDesviacion * 0.88 + 0.008).toFixed(3)
    case "ndmi":
      return +(ndviDesviacion * 0.75 - 0.015).toFixed(3)
    case "gndvi":
      return +(ndviDesviacion * 0.92 + 0.004).toFixed(3)
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
