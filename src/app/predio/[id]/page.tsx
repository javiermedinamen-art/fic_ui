import { PredioDetail } from "@/components/predio/predio-detail"
import { PREDIOS } from "@/lib/db"

type PageProps = {
  params: Promise<{ id: string }>
}

export function generateStaticParams() {
  return PREDIOS.map((p) => ({ id: p.id }))
}

export default async function PredioPage({ params }: PageProps) {
  const { id } = await params
  return <PredioDetail predioId={id} />
}
