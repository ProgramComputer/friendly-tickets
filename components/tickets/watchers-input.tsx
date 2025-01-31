"use client"

import { Control } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { useState } from "react"
import { WatchersInputProps } from '@/types/shared/props'

interface WatchersInputProps {
  control: Control<any>
  ccName: string
  bccName: string
}

export function WatchersInput({ control, ccName, bccName }: WatchersInputProps) {
  const [ccInput, setCcInput] = useState("")
  const [bccInput, setBccInput] = useState("")

  const validateEmail = (email: string) => {
    return email
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      )
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: { value: string[]; onChange: (value: string[]) => void },
    inputValue: string,
    setInputValue: (value: string) => void
  ) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      const email = inputValue.trim()

      if (email && validateEmail(email)) {
        if (!field.value.includes(email)) {
          field.onChange([...(field.value || []), email])
        }
        setInputValue("")
      }
    }
  }

  const removeEmail = (
    email: string,
    field: { value: string[]; onChange: (value: string[]) => void }
  ) => {
    field.onChange(field.value.filter((e) => e !== email))
  }

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name={ccName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>CC</FormLabel>
            <div className="space-y-2">
              <Input
                placeholder="Enter email and press Enter"
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
                onKeyDown={(e) =>
                  handleKeyDown(e, field, ccInput, setCcInput)
                }
              />
              {field.value?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {field.value.map((email: string) => (
                    <Badge
                      key={email}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeEmail(email, field)}
                        className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {email}</span>
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={bccName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>BCC</FormLabel>
            <div className="space-y-2">
              <Input
                placeholder="Enter email and press Enter"
                value={bccInput}
                onChange={(e) => setBccInput(e.target.value)}
                onKeyDown={(e) =>
                  handleKeyDown(e, field, bccInput, setBccInput)
                }
              />
              {field.value?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {field.value.map((email: string) => (
                    <Badge
                      key={email}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeEmail(email, field)}
                        className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {email}</span>
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
} 