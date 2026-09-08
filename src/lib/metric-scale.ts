/**
 * Fixed stretch scales (same as fic_agro Sentinel-2 metadata) + elegant CSS palettes.
 */
import type { MetricKey } from "@/lib/db"

export type MetricScale = {
  vmin: number
  vmax: number
  /** CSS linear-gradient stops (left=vmin → right=vmax) */
  gradient: string
  colormap: string
}

/** Escala fija por métrica — no cambia entre semanas/predios/cuarteles. */
export const METRIC_SCALE: Record<MetricKey, MetricScale> = {
  ndvi: {
    vmin: 0,
    vmax: 0.98,
    colormap: "RdYlGn",
    gradient:
      "linear-gradient(90deg, #a50026 0%, #d73027 15%, #f46d43 30%, #fdae61 45%, #fee08b 55%, #d9ef8b 65%, #a6d96a 75%, #66bd63 85%, #1a9850 95%, #006837 100%)",
  },
  ndmi: {
    vmin: -0.55,
    vmax: 0.67,
    colormap: "RdYlBu",
    gradient:
      "linear-gradient(90deg, #a50026 0%, #d73027 12%, #f46d43 25%, #fdae61 38%, #fee090 50%, #e0f3f8 62%, #abd9e9 75%, #74add1 88%, #4575b4 100%)",
  },
  gndvi: {
    vmin: 0.12,
    vmax: 1,
    colormap: "YlGn",
    gradient:
      "linear-gradient(90deg, #ffffe5 0%, #f7fcb9 20%, #d9f0a3 40%, #addd8e 55%, #78c679 70%, #41ab5d 85%, #238443 95%, #005a32 100%)",
  },
  ndre: {
    // stretch sobre REDEDGE_POSITION (nm) normalizado visualmente en rasters
    vmin: 700,
    vmax: 750,
    colormap: "viridis",
    gradient:
      "linear-gradient(90deg, #440154 0%, #46327e 20%, #365c8d 35%, #277f8e 50%, #1fa187 65%, #4ac16d 80%, #a0da39 92%, #fde725 100%)",
  },
}

export type DroneLayerScaleKey = "rgb" | "ndvi" | "ndwi" | "termico" | "lidar"

export const DRONE_LAYER_SCALE: Record<
  Exclude<DroneLayerScaleKey, "rgb" | "lidar">,
  MetricScale
> = {
  ndvi: METRIC_SCALE.ndvi,
  ndwi: {
    vmin: -0.4,
    vmax: 0.4,
    colormap: "BrBG",
    gradient:
      "linear-gradient(90deg, #543005 0%, #8c510a 15%, #bf812d 30%, #dfc27d 45%, #f6e8c3 50%, #c7eae5 55%, #80cdc1 70%, #35978f 85%, #01665e 100%)",
  },
  termico: {
    vmin: 10,
    vmax: 40,
    colormap: "inferno",
    gradient:
      "linear-gradient(90deg, #000004 0%, #1b0c41 20%, #4a0c6b 35%, #781c6d 50%, #a52c60 65%, #cf4446 78%, #ed6925 88%, #fb9b06 95%, #fcffa4 100%)",
  },
}

export function formatScaleValue(metric: MetricKey, v: number) {
  if (metric === "ndre") return `${v.toFixed(0)}`
  return v.toFixed(2)
}
