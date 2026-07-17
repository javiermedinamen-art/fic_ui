"use client"

import Link from "next/link"

import { PageHeader } from "@/components/layout/page-header"
import { Separator } from "@/components/ui/separator"
import type { Predio } from "@/lib/db"
import { getAgricultor, getPredioSuperficie } from "@/lib/db"

type PredioHeaderProps = {
  predio: Predio
  cuartelesCount: number
}

export function PredioHeader({ predio, cuartelesCount }: PredioHeaderProps) {
  const agricultor = getAgricultor(predio.agricultorId)
  const superficie = getPredioSuperficie(predio.id)

  return (
    <div className="space-y-5">
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Cartera", href: "/cartera" },
          { label: `Predio ${predio.nombre}` },
        ]}
      />

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
              {predio.nombre}
            </h1>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{predio.codigo}</span>
              <span className="mx-2 text-border">·</span>
              {agricultor?.nombre}
            </p>
          </div>

          <div className="shrink-0 rounded-lg bg-muted/70 px-4 py-3 text-right sm:min-w-[9.5rem]">
            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
              Superficie
            </p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight">
              {superficie.toFixed(1)}
              <span className="ml-1 text-sm font-medium text-muted-foreground">
                ha
              </span>
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {cuartelesCount} cuarteles
            </p>
          </div>
        </div>

        <Separator />

        <dl className="grid gap-4 px-5 py-4 text-sm sm:grid-cols-3 sm:gap-6 sm:px-6">
          <div>
            <dt className="text-xs text-muted-foreground">Ubicación</dt>
            <dd className="mt-0.5 font-medium">
              {predio.comuna}, {predio.region}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Tipo</dt>
            <dd className="mt-0.5 font-medium">
              {predio.mixtura === "mixto" ? "Cultivos mixtos" : "Mono cultivo"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Coordenadas</dt>
            <dd className="mt-0.5 font-medium tabular-nums">
              {predio.lat.toFixed(2)}, {predio.lng.toFixed(2)}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
