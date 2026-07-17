import { Suspense } from "react"

import { DronDetail } from "@/components/predio/dron-detail"

type PageProps = {
  params: Promise<{ id: string; week: string }>
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
