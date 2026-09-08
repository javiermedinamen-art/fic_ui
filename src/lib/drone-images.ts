/* Auto-generated drone image inventory (Guillermo Vasquez predios). */
export const DRONE_IMAGE_MANIFEST: Record<
  string,
  Array<"rgb" | "ndvi" | "ndwi" | "termico">
> = {
  "d_mondaca|2026-01-21": ["ndvi", "ndwi", "rgb"],
  "d_mondaca|2026-06-12": ["ndvi", "ndwi", "rgb", "termico"],
  "e_sazo|2026-01-21": ["ndvi", "ndwi", "rgb"],
  "e_sazo|2026-06-12": ["ndvi", "ndwi", "rgb", "termico"],
  "j_contreras|2026-01-21": ["ndvi", "ndwi", "rgb", "termico"],
  "l_martinez|2026-01-21": ["ndvi", "ndwi", "rgb"],
  "l_martinez|2026-06-12": ["ndvi", "ndwi", "rgb", "termico"],
  "o_herrera|2026-01-21": ["ndvi", "ndwi", "rgb"],
  "r_pani|2026-01-21": ["ndvi", "ndwi", "rgb"],
  "r_pani|2026-06-12": ["ndvi", "ndwi", "rgb", "termico"],
} as const

/** Pointclouds LiDAR binarios (Z = altura dosel, RGB 8-bit) por predio|fecha */
export const LIDAR_CLOUD_MANIFEST: Record<string, string> = {
  "l_martinez|2026-06-12": "l_martinez_20260612.ficpcd",
  "r_pani|2026-06-12": "r_pani_20260612.ficpcd",
  "d_mondaca|2026-06-12": "d_mondaca_20260612.ficpcd",
  "e_sazo|2026-06-12": "e_sazo_20260612.ficpcd",
  "j_contreras|2026-06-18": "j_contreras_20260618.ficpcd",
}

export type DroneImageLayer = "rgb" | "ndvi" | "ndwi" | "termico" | "lidar"

/** Cap de render alineado con fic_agro explorador (máxima densidad usable). */
export const LIDAR_RENDER_POINT_CAP = 2_300_000

export function lidarPointcloudUrl(
  predioId: string,
  date: string
): string | null {
  const key = `${predioId}|${date}`
  const file = LIDAR_CLOUD_MANIFEST[key]
  if (!file) return null
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
  return `${base}/lidar/${file}`
}

/** public/drone/{PREDIO}_{YYYY}_{MM}_{DD}_{rgb|ndvi|ndwi|thermal}.webp */
export function droneImageUrl(
  predioId: string,
  date: string,
  layer: DroneImageLayer
): string | null {
  if (layer === "lidar") return null
  const key = `${predioId}|${date}`
  const available = DRONE_IMAGE_MANIFEST[key as keyof typeof DRONE_IMAGE_MANIFEST]
  if (!available?.includes(layer as "rgb" | "ndvi" | "ndwi" | "termico")) {
    return null
  }
  const code = predioId.toUpperCase()
  const stamp = date.replaceAll("-", "_")
  const fileLayer = layer === "termico" ? "thermal" : layer
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
  return `${base}/drone/${code}_${stamp}_${fileLayer}.webp`
}

export function availableDroneLayers(
  predioId: string,
  date: string
): DroneImageLayer[] {
  const key = `${predioId}|${date}`
  const layers: DroneImageLayer[] = [
    ...(DRONE_IMAGE_MANIFEST[key as keyof typeof DRONE_IMAGE_MANIFEST] ?? []),
  ]
  if (lidarPointcloudUrl(predioId, date)) layers.push("lidar")
  return layers
}
