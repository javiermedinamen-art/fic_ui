import { cn } from "@/lib/utils"
import {
  DRONE_LAYER_SCALE,
  METRIC_SCALE,
  formatScaleValue,
  type DroneLayerScaleKey,
  type MetricScale,
} from "@/lib/metric-scale"
import type { MetricKey } from "@/lib/db"

type ColorLegendProps = {
  label: string
  scale: MetricScale
  formatMin?: string
  formatMax?: string
  className?: string
  compact?: boolean
}

export function ColorLegend({
  label,
  scale,
  formatMin,
  formatMax,
  className,
  compact,
}: ColorLegendProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground/80">{label}</span>
        <span className="tabular-nums">
          stretch fijo · {scale.colormap}
        </span>
      </div>
      <div
        className={cn(
          "h-2.5 w-full rounded-full ring-1 ring-foreground/10",
          compact && "h-2"
        )}
        style={{ backgroundImage: scale.gradient }}
        title={`Escala fija ${formatMin ?? scale.vmin} → ${formatMax ?? scale.vmax}`}
      />
      <div className="flex justify-between text-[10px] tabular-nums text-muted-foreground">
        <span>{formatMin ?? String(scale.vmin)}</span>
        <span>{formatMax ?? String(scale.vmax)}</span>
      </div>
    </div>
  )
}

export function SatelliteColorLegend({
  metric,
  className,
  compact,
}: {
  metric: MetricKey
  className?: string
  compact?: boolean
}) {
  const scale = METRIC_SCALE[metric]
  return (
    <ColorLegend
      label={`${metric.toUpperCase()} · escala fija`}
      scale={scale}
      formatMin={formatScaleValue(metric, scale.vmin)}
      formatMax={formatScaleValue(metric, scale.vmax)}
      className={className}
      compact={compact}
    />
  )
}

export function DroneColorLegend({
  layer,
  className,
}: {
  layer: DroneLayerScaleKey
  className?: string
}) {
  if (layer === "rgb" || layer === "lidar") return null
  const scale = DRONE_LAYER_SCALE[layer]
  const unit = layer === "termico" ? " °C" : ""
  return (
    <ColorLegend
      label={`${layer === "termico" ? "Térmico" : layer.toUpperCase()} · escala fija`}
      scale={scale}
      formatMin={`${scale.vmin}${unit}`}
      formatMax={`${scale.vmax}${unit}`}
      className={className}
    />
  )
}
