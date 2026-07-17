"use client"

import * as React from "react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

type PredioNotesProps = {
  predioId: string
  predioNombre: string
}

export function PredioNotes({ predioId }: PredioNotesProps) {
  const storageKey = `fic-notes-${predioId}`
  const [notes, setNotes] = React.useState("")
  const [savedAt, setSavedAt] = React.useState<string | null>(null)
  const [justSaved, setJustSaved] = React.useState(false)

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as { text: string; savedAt: string }
        setNotes(parsed.text)
        setSavedAt(parsed.savedAt)
      }
    } catch {
      /* ignore */
    }
  }, [storageKey])

  function save() {
    const ts = new Date().toLocaleString("es-CL")
    localStorage.setItem(storageKey, JSON.stringify({ text: notes, savedAt: ts }))
    setSavedAt(ts)
    setJustSaved(true)
    window.setTimeout(() => setJustSaved(false), 2000)
  }

  const hasNotes = notes.trim().length > 0

  return (
    <Card className="py-0">
      <CardContent className="px-4 py-1 sm:px-5">
        <Accordion>
          <AccordionItem value="notas" className="border-0">
            <AccordionTrigger className="py-3 hover:no-underline">
              <span className="flex items-center gap-2">
                Notas del asesor
                {hasNotes || savedAt ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-normal text-muted-foreground">
                    guardadas
                  </span>
                ) : null}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pb-3">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones breves del predio…"
                  className="min-h-24"
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {justSaved
                      ? "Guardado"
                      : savedAt
                        ? `Último guardado: ${savedAt}`
                        : "Opcional"}
                  </p>
                  <Button type="button" size="sm" onClick={save}>
                    Guardar
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
