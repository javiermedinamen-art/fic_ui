import { PredioDetail } from "@/components/predio/predio-detail"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function PredioPage({ params }: PageProps) {
  const { id } = await params
  return <PredioDetail predioId={id} />
}
