"use client"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  CheckboxGroup,
  type CheckboxOption,
} from "@/components/dashboard/checkbox-group"

const categoria1: CheckboxOption[] = [
  { id: "lunes", label: "Lunes" },
  { id: "martes", label: "martes" },
  { id: "miercoles", label: "miercoles" },
]

const categoria2: CheckboxOption[] = [
  { id: "bla-bla", label: "bla bla" },
  { id: "ble-ble", label: "ble ble" },
  { id: "bli-bli", label: "bli bli" },
  { id: "blo", label: "blo" },
]

type FiltersSidebarProps = {
  categoria1Values: string[]
  categoria2Values: string[]
  onCategoria1Change: (values: string[]) => void
  onCategoria2Change: (values: string[]) => void
}

export function FiltersSidebar({
  categoria1Values,
  categoria2Values,
  onCategoria1Change,
  onCategoria2Change,
}: FiltersSidebarProps) {
  return (
    <Card className="h-fit">
      <CardHeader className="border-b">
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        <AspectRatio
          ratio={16 / 9}
          className="overflow-hidden rounded-lg bg-muted"
        >
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-emerald-100 to-lime-50 text-xs text-muted-foreground">
            Vista del predio
          </div>
        </AspectRatio>

        <CheckboxGroup
          title="Categoría 1"
          options={categoria1}
          values={categoria1Values}
          onChange={onCategoria1Change}
        />

        <Separator />

        <CheckboxGroup
          title="Categoría 2"
          options={categoria2}
          values={categoria2Values}
          onChange={onCategoria2Change}
        />
      </CardContent>
    </Card>
  )
}
