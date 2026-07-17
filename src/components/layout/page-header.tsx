"use client"

import Link from "next/link"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ASESOR } from "@/lib/db"

export type Crumb = {
  label: string
  href?: string
}

type PageHeaderProps = {
  crumbs: Crumb[]
}

export function PageHeader({ crumbs }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1
            return (
              <span key={`${crumb.label}-${i}`} className="contents">
                {i > 0 ? <BreadcrumbSeparator /> : null}
                <BreadcrumbItem>
                  {isLast || !crumb.href ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link href={crumb.href} />}>
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col items-center gap-1">
        <Avatar size="lg">
          <AvatarFallback>{ASESOR.iniciales}</AvatarFallback>
        </Avatar>
        <span className="text-xs text-muted-foreground">Asesor</span>
      </div>
    </header>
  )
}
