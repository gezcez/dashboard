import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { CheckIcon, ChevronsUpDownIcon, NetworkIcon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { apiQuery } from "@/lib/api"
import { useMe } from "@/lib/me"
import { canSeePage, PAGES, type PageDef } from "@/lib/pages"
import { can } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { useCurrentNetwork, useCurrentPageId } from "./use-shell"

interface Entry {
  id: number
  slug: string
  name: string
  city: string
  roles: string[]
}

/**
 * City / Network combobox. Switching keeps the current sub-page when the user has that page's
 * permission in the target network; otherwise it goes to the target's overview. Route-specific
 * ids are dropped because pages in the registry only take the network param.
 */
export function NetworkSwitcher({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean
  onNavigate?: () => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { data: me } = useMe()
  const current = useCurrentNetwork()
  const pageId = useCurrentPageId()
  const readAll = can(me, "networks.read.all", "global") === true
  const all = useQuery({
    ...apiQuery("/v1/dash/networks", { params: { query: { limit: 200 } } }),
    enabled: readAll,
  })

  const mine: Entry[] = (me?.networks ?? []).map((n) => ({
    id: n.id,
    slug: n.slug,
    name: n.name,
    city: n.city.name,
    roles: n.roles.slice(0, 3).map((r) => r.name),
  }))
  const others: Entry[] = (all.data?.items ?? [])
    .filter((n) => !mine.some((m) => m.id === n.id))
    .map((n) => ({ id: n.id, slug: n.slug, name: n.name, city: n.city.name, roles: [] }))

  const select = (entry: Entry) => {
    setOpen(false)
    onNavigate?.()
    const page: PageDef | null = pageId ? PAGES[pageId] : null
    const keep = page?.scope === "network" && pageId && canSeePage(me, pageId, entry)
    void navigate({ to: keep && page ? page.to : "/n/$network", params: { network: entry.slug } })
  }

  if (!me) return null
  const label = current ? current.name : t("network.none")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("network.switch")}
          className={cn(
            "flex w-full items-center gap-2 rounded-2xl border border-sidebar-border bg-sidebar-accent px-3 py-2 text-left transition-colors hover:bg-white/10",
            collapsed && "justify-center px-0",
          )}
        >
          <NetworkIcon className="size-4 shrink-0 text-sidebar-active" />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs text-sidebar-muted">
                  {current?.cityName ?? t("network.switch")}
                </span>
                <span className="block truncate text-sm font-semibold">{label}</span>
              </span>
              <ChevronsUpDownIcon className="size-4 shrink-0 text-sidebar-muted" />
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" side={collapsed ? "right" : "bottom"}>
        <Command>
          <CommandInput placeholder={t("network.searchPlaceholder")} />
          <CommandList>
            <CommandEmpty>
              {mine.length || others.length ? t("network.empty") : t("network.noNetworks")}
            </CommandEmpty>
            {mine.length > 0 && (
              <CommandGroup heading={t("network.yourNetworks")}>
                {mine.map((n) => (
                  <NetworkItem
                    key={n.id}
                    entry={n}
                    active={current?.id === n.id}
                    onSelect={select}
                  />
                ))}
              </CommandGroup>
            )}
            {others.length > 0 && (
              <CommandGroup heading={t("network.allNetworks")}>
                {others.map((n) => (
                  <NetworkItem
                    key={n.id}
                    entry={n}
                    active={current?.id === n.id}
                    onSelect={select}
                  />
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function NetworkItem({
  entry,
  active,
  onSelect,
}: {
  entry: Entry
  active: boolean
  onSelect: (e: Entry) => void
}) {
  return (
    <CommandItem
      value={`${entry.city} ${entry.name} ${entry.slug}`}
      onSelect={() => onSelect(entry)}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate">
          <span className="text-muted-foreground">{entry.city} / </span>
          {entry.name}
        </span>
        {entry.roles.length > 0 && (
          <span className="mt-1 flex flex-wrap gap-1">
            {entry.roles.map((r) => (
              <Badge key={r} variant="brand" className="px-1.5 py-0 text-[11px]">
                {r}
              </Badge>
            ))}
          </span>
        )}
      </span>
      {active && <CheckIcon className="size-4 text-brand" />}
    </CommandItem>
  )
}
