import { Suspense } from "react"

import { SemanaDetail } from "@/components/predio/semana-detail"
import { PREDIOS } from "@/lib/db"

type PageProps = {
  params: Promise<{ id: string; week: string }>
}

const WEEKS = Array.from({ length: 26 }, (_, i) => String(i + 1))

export function generateStaticParams() {
  return PREDIOS.flatMap((p) => WEEKS.map((week) => ({ id: p.id, week })))
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
