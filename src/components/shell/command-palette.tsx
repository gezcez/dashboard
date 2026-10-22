import { useNavigate } from "@tanstack/react-router"
import { NetworkIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useMe } from "@/lib/me"
import { PAGES, type PageDef, visiblePages } from "@/lib/pages"
import { useCurrentNetwork } from "./use-shell"

/** Ctrl/Cmd+K: jump to a page or a network. Users, routes and vehicles come with their features. */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: me } = useMe()
  const network = useCurrentNetwork()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  const go = (fn: () => Promise<void>) => {
    onOpenChange(false)
    void fn()
  }
  const pages = [...visiblePages(me, "network", network), ...visiblePages(me, "platform")]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl overflow-hidden p-0" closeLabel={t("close")}>
        <DialogTitle className="sr-only">{t("command.open")}</DialogTitle>
        <Command>
          <CommandInput placeholder={t("command.placeholder")} />
          <CommandList>
            <CommandEmpty>{t("command.empty")}</CommandEmpty>
            <CommandGroup heading={t("command.pages")}>
              {pages.map((id) => {
                const page: PageDef = PAGES[id]
                const Icon = page.icon
                return (
                  <CommandItem
                    key={id}
                    value={`${t(page.label)} ${id}`}
                    onSelect={() =>
                      go(() =>
                        page.to === "/n/$network"
                          ? navigate({
                              to: "/n/$network",
                              params: { network: network?.slug ?? "" },
                            })
                          : navigate({ to: page.to }),
                      )
                    }
                  >
                    <Icon />
                    {t(page.label)}
                    {page.scope === "network" && network && (
                      <span className="ml-auto text-xs text-muted-foreground">{network.name}</span>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {(me?.networks.length ?? 0) > 0 && (
              <CommandGroup heading={t("command.networks")}>
                {me?.networks.map((n) => (
                  <CommandItem
                    key={n.id}
                    value={`${n.city.name} ${n.name} ${n.slug}`}
                    onSelect={() =>
                      go(() => navigate({ to: "/n/$network", params: { network: n.slug } }))
                    }
                  >
                    <NetworkIcon />
                    <span className="text-muted-foreground">{n.city.name} /</span> {n.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false)
  return { open, setOpen }
}
