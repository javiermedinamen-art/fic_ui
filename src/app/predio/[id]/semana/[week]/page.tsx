import { Suspense } from "react"

import { SemanaDetail } from "@/components/predio/semana-detail"

type PageProps = {
  params: Promise<{ id: string; week: string }>
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
