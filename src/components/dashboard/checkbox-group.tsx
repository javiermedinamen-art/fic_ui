"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export type CheckboxOption = {
  id: string
  label: string
}

type CheckboxGroupProps = {
  title: string
  options: CheckboxOption[]
  values: string[]
  onChange: (values: string[]) => void
}

export function CheckboxGroup({
  title,
  options,
  values,
  onChange,
}: CheckboxGroupProps) {
  function toggle(id: string, checked: boolean) {
    if (checked) {
      onChange([...values, id])
      return
    }
    onChange(values.filter((value) => value !== id))
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-foreground">{title}</legend>
      <div className="space-y-2.5">
        {options.map((option) => {
          const checked = values.includes(option.id)
          return (
            <div key={option.id} className="flex items-center gap-2">
              <Checkbox
                id={option.id}
                checked={checked}
                onCheckedChange={(value) => toggle(option.id, !!value)}
              />
              <Label htmlFor={option.id} className="font-normal capitalize">
                {option.label}
              </Label>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}
