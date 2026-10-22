import {
  CheckIcon,
  ExternalLinkIcon,
  LanguagesIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  UsersRoundIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/auth/react"
import { env, isMock } from "@/env"
import { LANGUAGES, type Language } from "@/i18n"
import { useChangeLanguage } from "@/lib/language"
import { useMe } from "@/lib/me"
import { usePrefs, type ThemePref } from "@/lib/prefs-store"
import { cn } from "@/lib/utils"

const THEMES: { value: ThemePref; icon: typeof SunIcon }[] = [
  { value: "system", icon: MonitorIcon },
  { value: "light", icon: SunIcon },
  { value: "dark", icon: MoonIcon },
]

export function UserMenu({ collapsed }: { collapsed: boolean }) {
  const { t, i18n } = useTranslation()
  const auth = useAuth()
  const { data: me } = useMe()
  const theme = usePrefs((s) => s.theme)
  const setTheme = usePrefs((s) => s.setTheme)
  const changeLanguage = useChangeLanguage()
  if (!me) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("user.menu")}
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-sidebar-accent",
            collapsed && "justify-center",
          )}
        >
          <Avatar>
            <AvatarFallback>{me.user.avatar_initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{me.user.display_name}</span>
              <span className="block truncate text-xs text-sidebar-muted">
                {me.user.email_masked}
              </span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={collapsed ? "right" : "top"} align="start" className="w-64">
        <DropdownMenuLabel className="tracking-normal normal-case">
          <span className="block text-sm font-semibold text-foreground">
            {me.user.display_name}
          </span>
          <span className="block font-mono text-xs font-normal">
            {me.user.username ? `@${me.user.username}` : me.user.id}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <LanguagesIcon />
            {t("user.language")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {LANGUAGES.map((lng: Language) => (
              <DropdownMenuItem key={lng} onSelect={() => changeLanguage(lng)}>
                <span className="flex-1">{t(`language.${lng}`)}</span>
                {i18n.language === lng && <CheckIcon className="text-brand" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SunIcon />
            {t("user.theme")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {THEMES.map(({ value, icon: Icon }) => (
              <DropdownMenuItem key={value} onSelect={() => setTheme(value)}>
                <Icon />
                <span className="flex-1">{t(`theme.${value}`)}</span>
                {theme === value && <CheckIcon className="text-brand" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem asChild>
          <a href={`${env.VITE_OAUTH_URL}/account`} target="_blank" rel="noreferrer">
            <ExternalLinkIcon />
            {t("user.account")}
          </a>
        </DropdownMenuItem>
        {isMock && (
          <DropdownMenuItem
            onSelect={() => void auth.login({ prompt: "select_account", returnTo: "/" })}
          >
            <UsersRoundIcon />
            {t("user.switchPersona")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => void auth.logout()}>
          <LogOutIcon />
          {t("user.signOut")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <p className="px-2 py-1 font-mono text-[11px] text-muted-foreground">
          {t("user.build", { sha: __BUILD_SHA__, env: env.VITE_ENV })}
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
