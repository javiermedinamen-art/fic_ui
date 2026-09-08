import { Suspense } from "react"

import { SemanaDetail } from "@/components/predio/semana-detail"
import { PREDIOS, getAvailableWeeks } from "@/lib/db"

type PageProps = {
  params: Promise<{ id: string; week: string }>
}

export function generateStaticParams() {
  const weeks = getAvailableWeeks().map(String)
  return PREDIOS.flatMap((p) => weeks.map((week) => ({ id: p.id, week })))
}

export default async function SemanaPage({ params }: PageProps) {
  const { id, week } = await params
  const weekNum = Number(week)

  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Cargando semana…</div>}>
      <SemanaDetail predioId={id} week={weekNum} />
    </Suspense>
  )
}
