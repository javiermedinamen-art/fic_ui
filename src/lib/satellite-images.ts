/* Sentinel-2 weekly rasters for Guillermo Vasquez predios.
 * Files: public/satellite/S2_{PREDIO}_weekly_{hist|current}_W{WW}_{BAND}.webp
 */

import type { MetricKey } from "@/lib/db"

export type SatelliteVariant = "historic" | "current"

const METRIC_BAND: Record<MetricKey, string> = {
  ndvi: "NDVI",
  ndmi: "NDMI",
  gndvi: "GNDVI",
  // Sentinel export usa MNDWI (proxy NDWI de agua / humedad)
  ndwi: "MNDWI",
}

function weekToken(week: number) {
  return `W${String(week).padStart(2, "0")}`
}

function variantToken(variant: SatelliteVariant) {
  return variant === "historic" ? "hist" : "current"
}

/** Ruta pública del raster S2 para predio / semana / métrica / variante. */
export function satelliteImageUrl(
  predioId: string,
  week: number,
  metric: MetricKey,
  variant: SatelliteVariant
): string {
  const code = predioId.toUpperCase()
  const band = METRIC_BAND[metric]
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
  return `${base}/satellite/S2_${code}_weekly_${variantToken(variant)}_${weekToken(week)}_${band}.webp`
}

/**
 * Semanas con raster "current" disponibles para el time-lapse.
 * Los 6 predios de Vasquez tienen W01–W34 exportados para NDVI/NDMI/GNDVI/MNDWI.
 */
export const EVOLUTION_WEEKS = Array.from(
  { length: 34 },
  (_, i) => i + 1
) as readonly number[]

export type EvolutionFrame = {
  week: number
  url: string
}

export function getEvolutionFrames(
  predioId: string,
  metric: MetricKey = "ndvi"
): EvolutionFrame[] {
  return EVOLUTION_WEEKS.map((week) => ({
    week,
    url: satelliteImageUrl(predioId, week, metric, "current"),
  }))
}
