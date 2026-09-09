"use client"

import * as React from "react"

import type { GeoBounds, LonLat } from "@/lib/raster-geo"

function lngToX(lng: number, b: GeoBounds) {
  return ((lng - b.west) / Math.max(b.east - b.west, 1e-12)) * 100
}

function latToY(lat: number, b: GeoBounds) {
  return ((b.north - lat) / Math.max(b.north - b.south, 1e-12)) * 100
}

/** Polígonos en coords 0–1 para SVG clipPathUnits=objectBoundingBox. */
function ringsToUnitPolygons(rings: LonLat[][], bounds: GeoBounds): string[] {
  const polys: string[] = []
  for (const ring of rings) {
    if (ring.length < 3) continue
    const pts = ring.map(([lng, lat]) => {
      const x = Math.max(0, Math.min(1, lngToX(lng, bounds) / 100))
      const y = Math.max(0, Math.min(1, latToY(lat, bounds) / 100))
      return `${x.toFixed(5)},${y.toFixed(5)}`
    })
    polys.push(pts.join(" "))
  }
  return polys
}

type ClippedRasterImageProps = {
  src: string
  alt: string
  bounds: GeoBounds | null
  /** Anillos [lng,lat] a mostrar (unión). Vacío = sin clip (raster crudo). */
  rings?: LonLat[][]
  className?: string
  overlay?: React.ReactNode
  onError?: () => void
}

export function ClippedRasterImage({
  src,
  alt,
  bounds,
  rings = [],
  className,
  overlay,
  onError,
}: ClippedRasterImageProps) {
  const clipId = React.useId().replace(/:/g, "")
  const unitPolys =
    bounds && rings.length > 0 ? ringsToUnitPolygons(rings, bounds) : []
  const hasClip = unitPolys.length > 0

  return (
    <div
      className={`absolute inset-0 overflow-hidden bg-black ${className ?? ""}`}
    >
      {hasClip ? (
        <svg
          aria-hidden
          className="pointer-events-none absolute h-0 w-0 overflow-hidden"
        >
          <defs>
            <clipPath id={clipId} clipPathUnits="objectBoundingBox">
              {unitPolys.map((points, i) => (
                <polygon key={i} points={points} />
              ))}
            </clipPath>
          </defs>
        </svg>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt={alt}
        className="absolute inset-0 size-full object-fill"
        style={
          hasClip
            ? {
                clipPath: `url(#${clipId})`,
                WebkitClipPath: `url(#${clipId})`,
              }
            : undefined
        }
        onError={onError}
      />
      {overlay}
    </div>
  )
}
