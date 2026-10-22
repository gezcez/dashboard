import { CheckIcon, ChevronDownIcon, SearchIcon, XIcon } from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useDebouncedValue } from "./use-debounced-value"

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mb-3 flex flex-wrap items-center gap-2">{children}</div>
}

/** Debounced search box bound to the URL's `q`. */
export function SearchFilter({
  value,
  onChange,
  placeholder,
}: {
  value: string | undefined
  onChange: (q: string | undefined) => void
  placeholder: string
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(value ?? "")
  const debounced = useDebouncedValue(draft)

  // Follow outside changes (back button, clear filters).
  useEffect(() => {
    setDraft(value ?? "")
  }, [value])

  useEffect(() => {
    const next = debounced.trim() || undefined
    if (next !== (value || undefined)) onChange(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced draft
  }, [debounced])

  return (
    <div className="relative w-full sm:w-72">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pr-8 pl-9"
      />
      {draft && (
        <button
          type="button"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
          aria-label={t("table.clearSearch")}
          onClick={() => {
            setDraft("")
            onChange(undefined)
          }}
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  )
}

/** Single-choice filter as a pill dropdown. `undefined` means "any". */
export function SelectFilter<V extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: V | undefined
  options: { value: V; label: string }[]
  onChange: (value: V | undefined) => void
}) {
  const { t } = useTranslation()
  const current = options.find((o) => o.value === value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(current && "border-primary/40 bg-accent")}
        >
          {label}
          {current && <span className="font-semibold">: {current.label}</span>}
          <ChevronDownIcon className="opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onSelect={() => {
            onChange(undefined)
          }}
        >
          <CheckIcon className={cn(value !== undefined && "invisible")} />
          {t("table.any")}
        </DropdownMenuItem>
        {options.map((o) => (
          <DropdownMenuItem
            key={o.value}
            onSelect={() => {
              onChange(o.value)
            }}
          >
            <CheckIcon className={cn(o.value !== value && "invisible")} />
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
