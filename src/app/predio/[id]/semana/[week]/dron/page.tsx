import { Suspense } from "react"

import { DronDetail } from "@/components/predio/dron-detail"
import {
  PREDIOS,
  buildTimeSeries,
  getCuartelesByPredio,
  type MetricKey,
} from "@/lib/db"

type PageProps = {
  params: Promise<{ id: string; week: string }>
}

export function generateStaticParams() {
  const params: { id: string; week: string }[] = []
  const metric: MetricKey = "ndvi"

  for (const predio of PREDIOS) {
    const cultivos = [
      ...new Set(getCuartelesByPredio(predio.id).map((c) => c.cultivo)),
    ]
    const weeks = new Set<number>()

    for (const cultivo of cultivos) {
      const { drones } = buildTimeSeries(predio.id, metric, cultivo)
      for (const d of drones) weeks.add(d.week)
    }

    for (const week of weeks) {
      params.push({ id: predio.id, week: String(week) })
    }
  }

  return params
}

export default async function DronPage({ params }: PageProps) {
  const { id, week } = await params

  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-muted-foreground">Cargando dron…</div>
      }
    >
      <DronDetail predioId={id} week={Number(week)} />
    </Suspense>
  )
}
