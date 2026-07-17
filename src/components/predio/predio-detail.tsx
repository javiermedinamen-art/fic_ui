"use client"

import { PredioHeader } from "@/components/predio/predio-header"
import { PredioChartPanel } from "@/components/predio/predio-chart-panel"
import { PredioNotes } from "@/components/predio/predio-notes"
import { getCuartelesByPredio, getPredio } from "@/lib/db"
import { notFound } from "next/navigation"

type PredioDetailProps = {
  predioId: string
}

export function PredioDetail({ predioId }: PredioDetailProps) {
  const predio = getPredio(predioId)
  if (!predio) notFound()

  const cuarteles = getCuartelesByPredio(predio.id)

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <PredioHeader predio={predio} cuartelesCount={cuarteles.length} />
      <PredioChartPanel predioId={predio.id} cuarteles={cuarteles} />
      <PredioNotes predioId={predio.id} predioNombre={predio.nombre} />
    </main>
  )
}
