"use client"

import * as React from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FiltersSidebar } from "@/components/dashboard/filters-sidebar"
import { PrediosDataTable } from "@/components/dashboard/predios-data-table"
import { SummaryCards } from "@/components/dashboard/summary-cards"
import { comunas, cultivos, predios } from "@/lib/data"

export function Dashboard() {
  const [categoria1, setCategoria1] = React.useState<string[]>([])
  const [categoria2, setCategoria2] = React.useState<string[]>([])

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex items-start justify-between gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Predios</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col items-center gap-1">
          <Avatar size="lg">
            <AvatarFallback>As</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">Asesor</span>
        </div>
      </header>

      <section className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Bienvenido, Pedrito
        </h1>
        <p className="text-muted-foreground">
          Esta es la información de tus predios/cuarteles
        </p>
      </section>

      <SummaryCards
        predios={2}
        cuarteles={2}
        cultivos={cultivos}
        comunas={comunas}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <AspectRatio
          ratio={16 / 10}
          className="min-h-[420px] overflow-hidden rounded-xl ring-1 ring-foreground/10 sm:min-h-[520px]"
        >
          <Card className="absolute inset-0 size-full rounded-xl py-0 ring-0">
            <CardContent className="flex h-full flex-col gap-4 overflow-auto p-4 sm:p-5">
              <Tabs defaultValue="predio" className="flex min-h-0 flex-1 flex-col">
                <TabsList>
                  <TabsTrigger value="predio">Predio</TabsTrigger>
                  <TabsTrigger value="agricultor">Agricultor</TabsTrigger>
                  <TabsTrigger value="comuna">Comuna</TabsTrigger>
                </TabsList>

                <TabsContent value="predio" className="min-h-0 flex-1">
                  <PrediosDataTable data={predios} />
                </TabsContent>

                <TabsContent value="agricultor" className="min-h-0 flex-1">
                  <PrediosDataTable
                    data={[...predios].sort((a, b) =>
                      a.agricultor.localeCompare(b.agricultor)
                    )}
                  />
                </TabsContent>

                <TabsContent value="comuna" className="min-h-0 flex-1">
                  <PrediosDataTable
                    data={[...predios].sort((a, b) =>
                      a.comuna.localeCompare(b.comuna)
                    )}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </AspectRatio>

        <FiltersSidebar
          categoria1Values={categoria1}
          categoria2Values={categoria2}
          onCategoria1Change={setCategoria1}
          onCategoria2Change={setCategoria2}
        />
      </div>
    </div>
  )
}
