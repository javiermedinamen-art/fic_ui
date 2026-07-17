"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { Columns3, Filter, Search } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CheckboxGroup,
  type CheckboxOption,
} from "@/components/dashboard/checkbox-group"
import type { Predio } from "@/lib/data"

const columns: ColumnDef<Predio>[] = [
  {
    accessorKey: "nombre",
    header: "Nombre",
    cell: ({ row }) => (
      <HoverCard>
        <HoverCardTrigger
          render={
            <button
              type="button"
              className="font-medium underline-offset-4 hover:underline"
            />
          }
        >
          {row.getValue("nombre")}
        </HoverCardTrigger>
        <HoverCardContent side="right" className="w-56 space-y-1">
          <p className="font-medium">{row.original.nombre}</p>
          <p className="text-muted-foreground">
            Cultivo: {row.original.cultivo}
          </p>
          <p className="text-muted-foreground">
            Superficie: {row.original.metrica}
          </p>
        </HoverCardContent>
      </HoverCard>
    ),
  },
  {
    accessorKey: "agricultor",
    header: "Agricultor",
    cell: ({ row }) => {
      const name = row.getValue<string>("agricultor")
      const initials = name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)

      return (
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span>{name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "comuna",
    header: "Comuna",
  },
  {
    accessorKey: "metrica",
    header: "Métrica",
  },
]

const columnOptions: CheckboxOption[] = [
  { id: "nombre", label: "Nombre" },
  { id: "agricultor", label: "Agricultor" },
  { id: "comuna", label: "Comuna" },
  { id: "metrica", label: "Métrica" },
]

const sheetFilterOptions: CheckboxOption[] = [
  { id: "paltos", label: "Paltos" },
  { id: "citricos", label: "Cítricos" },
  { id: "quillota", label: "Quillota" },
  { id: "la-cruz", label: "La Cruz" },
]

type PrediosDataTableProps = {
  data: Predio[]
}

export function PrediosDataTable({ data }: PrediosDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [sheetFilters, setSheetFilters] = React.useState<string[]>([])

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  })

  const visibleColumnIds = columnOptions
    .filter((option) => table.getColumn(option.id)?.getIsVisible() !== false)
    .map((option) => option.id)

  function handleColumnVisibilityChange(values: string[]) {
    const next: VisibilityState = {}
    for (const option of columnOptions) {
      next[option.id] = values.includes(option.id)
    }
    setColumnVisibility(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={(table.getColumn("nombre")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("nombre")?.setFilterValue(event.target.value)
            }
            className="pl-8"
          />
        </div>

        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger
              render={<Button variant="outline" size="sm" />}
            >
              <Columns3 data-icon="inline-start" />
              Columnas
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Columnas visibles</SheetTitle>
                <SheetDescription>
                  Selecciona las columnas que quieres mostrar en la tabla.
                </SheetDescription>
              </SheetHeader>
              <div className="px-4">
                <CheckboxGroup
                  title="Columnas"
                  options={columnOptions}
                  values={visibleColumnIds}
                  onChange={handleColumnVisibilityChange}
                />
              </div>
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger
              render={<Button variant="outline" size="sm" />}
            >
              <Filter data-icon="inline-start" />
              Filter
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Filtros adicionales</SheetTitle>
                <SheetDescription>
                  Aplica filtros contextuales sobre cultivos y comunas.
                </SheetDescription>
              </SheetHeader>
              <div className="px-4">
                <CheckboxGroup
                  title="Opciones"
                  options={sheetFilterOptions}
                  values={sheetFilters}
                  onChange={setSheetFilters}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Sin resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
