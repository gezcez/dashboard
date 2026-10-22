import { OPERATION_AUTH, type PermissionKey } from "@/api/permission-keys.gen"
import type { components } from "@/api/schema.gen"
import { DAY, FIXTURE_NOW, maskEmail, PERSONAS, seeded, USERS, userRef } from "./fixtures"

type S = components["schemas"]

const iso = (ms: number) => new Date(ms).toISOString()

/** Backend 6.4.1 "Grants" column, one line per key. */
export const PERMISSION_DESCRIPTIONS: Record<PermissionKey, string> = {
  "system.health.read": "Global overview and system health",
  "system.config.read": "Sanitised runtime config and permission cache stats",
  "ops.logs": "Live ops log channel",
  "users.read": "User search and detail (masked emails)",
  "users.pii.read": "Reveal emails (audited), search by exact email",
  "users.sessions.revoke": "List and revoke a user's sessions and refresh families",
  "moderation.read": "Moderation log",
  "moderation.write": "Ban, unban, warn, notes",
  "roles.read": "Roles and the permission matrix",
  "roles.write": "Create and edit roles and their permission sets",
  "roles.assign": "Grant and revoke global roles",
  "permissions.read": "Permission keys and route registry",
  "permissions.write": "Delete orphaned keys",
  "apps.read": "OAuth clients",
  "apps.write": "Create and edit OAuth clients",
  "apps.secrets.rotate": "Rotate and revoke client secrets",
  "networks.read.all": "List every network in the switcher",
  "catalog.admin": "Create, edit and delete cities and networks",
  "providers.read": "Providers, adapters and config schemas",
  "providers.kill": "Provider kill switch",
  "archive.read": "Archive manifest and upload status",
  "archive.write": "Re-run an archive export",
  "email.read": "Email templates, previews, deliveries, suppressions",
  "email.test.send": "Test email to your own address",
  "email.test.send.any": "Test email to any address (audited)",
  "settings.read": "Settings and flags pages",
  "settings.write": "Edit settings",
  "flags.write": "Toggle feature flags",
  "jobs.read": "Scheduled jobs and run history",
  "jobs.run": "Run a job now",
  "audit.read": "Audit log",
  "network.overview.read": "Network overview",
  "vehicles.live.read": "Live map and one hour vehicle trails",
  "vehicles.history.read": "Playback beyond one hour",
  "tracker.read": "Tracker status, polls, stats and logs",
  "tracker.control": "Pause, resume, poll now, refresh token, clear fallback",
  "tracker.config.write": "Binding poll intervals, filters and dedup settings",
  "catalog.read": "Network profile, bindings, routes, stops, issues",
  "catalog.write": "Network profile, privacy data, bindings, issue status",
  "catalog.sync": "Trigger a static sync",
  "analytics.read": "All analytics metrics",
  "analytics.export": "CSV and Parquet exports",
  "members.read": "Users with roles in the network (masked)",
  "members.roles.write": "Grant and revoke network roles",
  "support.read": "Support inbox (reserved)",
  "support.reply": "Reply in the support inbox (reserved)",
}

/** Keys whose scope is network in backend 6.4.1; everything else is global. */
const NETWORK_SCOPED = new Set<string>([
  "network.overview.read",
  "vehicles.live.read",
  "vehicles.history.read",
  "tracker.read",
  "tracker.control",
  "tracker.config.write",
  "catalog.read",
  "catalog.write",
  "catalog.sync",
  "analytics.read",
  "analytics.export",
  "members.read",
  "members.roles.write",
])

/** Sudo routes from 6.4.1 that the stub spec does not model yet. */
const EXTRA_ROUTES: Partial<
  Record<PermissionKey, { method: string; path: string; sudo: boolean }[]>
> = {
  "providers.kill": [{ method: "POST", path: "/v1/dash/providers/{key}/kill", sudo: true }],
  "tracker.control": [
    { method: "POST", path: "/v1/dash/networks/{networkId}/tracker/{bindingId}/pause", sudo: true },
    {
      method: "POST",
      path: "/v1/dash/networks/{networkId}/tracker/{bindingId}/poll-now",
      sudo: false,
    },
  ],
  "settings.write": [{ method: "PATCH", path: "/v1/dash/settings", sudo: true }],
  "jobs.run": [{ method: "POST", path: "/v1/dash/jobs/{key}/run", sudo: false }],
  "catalog.write": [{ method: "POST", path: "/v1/dash/networks/{networkId}/bindings", sudo: true }],
}

export function routesFor(key: string): { method: string; path: string; sudo: boolean }[] {
  const generated = Object.entries(OPERATION_AUTH)
    .filter(([, rule]) => (rule.key as string) === key)
    .map(([op, rule]) => {
      const [method = "", path = ""] = op.split(" ")
      return { method, path, sudo: rule.sudo }
    })
  return [...generated, ...(EXTRA_ROUTES[key as PermissionKey] ?? [])]
}

export function permissionInfo(key: PermissionKey): S["PermissionInfo"] {
  return {
    key,
    scope: NETWORK_SCOPED.has(key) ? "network" : "global",
    sudo: routesFor(key).some((r) => r.sudo),
    description: PERMISSION_DESCRIPTIONS[key],
  }
}

/** A key the code no longer declares: shows the orphan flag and delete action. */
export const ORPHANED_KEYS = [
  {
    key: "legacy.reports.read",
    description: "Old rider reports screen (removed in the revamp)",
    first_registered_at: iso(FIXTURE_NOW - 700 * DAY),
    last_seen_at: iso(FIXTURE_NOW - 40 * DAY),
    orphaned_at: iso(FIXTURE_NOW - 40 * DAY),
  },
]

// ---- OAuth apps ------------------------------------------------------------------------------

export const SCOPES: S["ScopeInfo"][] = [
  {
    key: "openid",
    name: { tr: "Kimlik", en: "Identity" },
    description: { tr: "Hesap kimliğiniz", en: "Your account ID" },
  },
  {
    key: "profile",
    name: { tr: "Profil", en: "Profile" },
    description: { tr: "Ad, kullanıcı adı ve dil", en: "Name, username and language" },
  },
  {
    key: "email",
    name: { tr: "E-posta", en: "Email" },
    description: { tr: "E-posta adresiniz", en: "Your email address" },
  },
  {
    key: "offline_access",
    name: { tr: "Oturumu açık tut", en: "Stay signed in" },
    description: { tr: "Yenileme belirteci", en: "Refresh token" },
  },
  {
    key: "dash",
    name: { tr: "Panel", en: "Dashboard" },
    description: { tr: "Yönetim paneli API'si", en: "Dashboard API" },
  },
  {
    key: "transit",
    name: { tr: "Ulaşım", en: "Transit" },
    description: {
      tr: "Favoriler ve kişisel ulaşım verisi",
      en: "Favourites and personal transit data",
    },
  },
]

function usage(seed: number, base: number): { date: string; tokens: number }[] {
  const rand = seeded(seed)
  return Array.from({ length: 30 }, (_, i) => {
    const day = FIXTURE_NOW - (29 - i) * DAY
    const weekend = [0, 6].includes(new Date(day).getUTCDay())
    return {
      date: iso(day).slice(0, 10),
      tokens: Math.round(base * (weekend ? 0.6 : 1) * (0.8 + rand() * 0.4)),
    }
  })
}

const secret = (
  id: string,
  prefix: string,
  state: "current" | "previous",
  createdDaysAgo: number,
  expiresInDays: number | null,
): S["AppSecret"] => ({
  id,
  prefix,
  state,
  created_at: iso(FIXTURE_NOW - createdDaysAgo * DAY),
  last_used_at: iso(FIXTURE_NOW - 2 * 3_600_000),
  expires_at: expiresInDays === null ? null : iso(FIXTURE_NOW + expiresInDays * DAY),
})

export const APPS: S["AppDetail"][] = [
  {
    client_id: "dashboard",
    name: "gezcez dashboard",
    description: "Operations console at dash.gezcez.com.",
    logo_url: null,
    homepage_url: "https://dash.gezcez.com",
    type: "public",
    platform: "web",
    first_party: true,
    system: true,
    redirect_uris: [
      "https://dash.gezcez.com/auth/callback",
      "https://dash.gezcez.com/auth/step-up",
    ],
    scopes: ["openid", "profile", "email", "offline_access", "dash"],
    access_ttl_s: 900,
    refresh_ttl_s: 30 * 86_400,
    refresh_max_s: 90 * 86_400,
    secrets: [],
    active_families: 14,
    tokens_24h: 1_310,
    usage: usage(1, 1_200),
    created_at: iso(FIXTURE_NOW - 420 * DAY),
    updated_at: iso(FIXTURE_NOW - 12 * DAY),
  },
  {
    client_id: "dashboard-dev",
    name: "gezcez dashboard (dev)",
    description: "Local development and PR previews.",
    logo_url: null,
    homepage_url: null,
    type: "public",
    platform: "dev",
    first_party: true,
    system: false,
    redirect_uris: [
      "http://localhost:5173/auth/callback",
      "http://localhost:5173/auth/step-up",
      "https://dash-staging.gezcez.com/auth/callback",
    ],
    scopes: ["openid", "profile", "email", "offline_access", "dash"],
    access_ttl_s: 900,
    refresh_ttl_s: 7 * 86_400,
    refresh_max_s: 30 * 86_400,
    secrets: [],
    active_families: 3,
    tokens_24h: 88,
    usage: usage(2, 70),
    created_at: iso(FIXTURE_NOW - 300 * DAY),
    updated_at: iso(FIXTURE_NOW - 30 * DAY),
  },
  {
    client_id: "gezcez-mobile",
    name: "gezcez",
    description: "Rider app for iOS and Android.",
    logo_url: null,
    homepage_url: "https://gezcez.com",
    type: "public",
    platform: "native",
    first_party: true,
    system: true,
    redirect_uris: ["gezcez://oauth/callback"],
    scopes: ["openid", "profile", "email", "offline_access", "transit"],
    access_ttl_s: 900,
    refresh_ttl_s: 90 * 86_400,
    refresh_max_s: 365 * 86_400,
    secrets: [],
    active_families: 2_904,
    tokens_24h: 41_220,
    usage: usage(3, 39_000),
    created_at: iso(FIXTURE_NOW - 410 * DAY),
    updated_at: iso(FIXTURE_NOW - 5 * DAY),
  },
  {
    client_id: "kocaeli-open-data",
    name: "Kocaeli open data portal",
    description: "Partner site that shows departures with rider sign-in.",
    logo_url: null,
    homepage_url: "https://acikveri.example.org",
    type: "confidential",
    platform: "web",
    first_party: false,
    system: false,
    redirect_uris: ["https://acikveri.example.org/oauth/gezcez/callback"],
    scopes: ["openid", "profile"],
    access_ttl_s: 900,
    refresh_ttl_s: 30 * 86_400,
    refresh_max_s: 90 * 86_400,
    secrets: [
      secret("sec_02", "gzs_7Hq2", "current", 6, null),
      secret("sec_01", "gzs_kP9x", "previous", 120, 1),
    ],
    active_families: 57,
    tokens_24h: 212,
    usage: usage(4, 190),
    created_at: iso(FIXTURE_NOW - 150 * DAY),
    updated_at: iso(FIXTURE_NOW - 6 * DAY),
  },
]

export function toAppListItem(a: S["AppDetail"]): S["AppListItem"] {
  return {
    client_id: a.client_id,
    name: a.name,
    type: a.type,
    platform: a.platform,
    first_party: a.first_party,
    system: a.system,
    redirect_uri_count: a.redirect_uris.length,
    active_families: a.active_families,
    tokens_24h: a.tokens_24h,
    created_at: a.created_at,
  }
}

// ---- Sessions, emails, privacy ---------------------------------------------------------------

const DEVICES = [
  "Chrome 141 on macOS",
  "Safari on iPhone",
  "gezcez 3.2 on Android 15",
  "Firefox 143 on Windows",
  "gezcez 3.2 on iOS 19",
]

export function sessionsFor(userId: string): S["UserSession"][] {
  const rand = seeded(Array.from(userId, (ch) => ch.charCodeAt(0)).reduce((a, b) => a + b, 0))
  const n = 1 + Math.floor(rand() * 4)
  const out: S["UserSession"][] = []
  for (let i = 0; i < n; i++) {
    const created = FIXTURE_NOW - Math.floor(rand() * 40) * DAY - Math.floor(rand() * DAY)
    const device = DEVICES[Math.floor(rand() * DEVICES.length)]!
    const mobile = device.startsWith("gezcez")
    out.push({
      id: `ses_${userId.slice(-6)}_${String(i)}`,
      kind: "sso",
      app: null,
      device,
      ip_prefix: `85.10${String(Math.floor(rand() * 9))}.${String(Math.floor(rand() * 250))}.0/24`,
      created_at: iso(created),
      last_used_at: iso(FIXTURE_NOW - Math.floor(rand() * 3 * DAY)),
      expires_at: iso(created + (mobile ? 90 : 30) * DAY),
    })
    out.push({
      id: `rtf_${userId.slice(-6)}_${String(i)}`,
      kind: "refresh",
      app: mobile
        ? { client_id: "gezcez-mobile", name: "gezcez" }
        : { client_id: "dashboard", name: "gezcez dashboard" },
      device,
      ip_prefix: out[out.length - 1]!.ip_prefix,
      created_at: iso(created + 60_000),
      last_used_at: iso(FIXTURE_NOW - Math.floor(rand() * DAY)),
      expires_at: iso(created + (mobile ? 90 : 30) * DAY),
    })
  }
  return out
}

export const EMAIL_TEMPLATES: S["EmailTemplate"][] = [
  {
    key: "login_code",
    description: "Six digit sign-in code",
    locales: ["tr", "en"],
    variables: [
      { name: "code", description: "The code", example: "482913" },
      { name: "expires_in_min", description: "Minutes until it expires", example: "10" },
    ],
  },
  {
    key: "signup_code",
    description: "Code to finish creating an account",
    locales: ["tr", "en"],
    variables: [{ name: "code", description: "The code", example: "205561" }],
  },
  {
    key: "password_reset",
    description: "Code to reset a password",
    locales: ["tr", "en"],
    variables: [{ name: "code", description: "The code", example: "771204" }],
  },
  {
    key: "email_change",
    description: "Confirm a new email address",
    locales: ["tr", "en"],
    variables: [
      { name: "code", description: "The code", example: "330918" },
      { name: "new_email", description: "Masked new address", example: "e****@example.com" },
    ],
  },
  {
    key: "new_device_login",
    description: "Notice after a sign-in from a new device",
    locales: ["tr", "en"],
    variables: [
      { name: "device", description: "Device summary", example: "Safari on iPhone" },
      { name: "city", description: "Approximate place", example: "Kocaeli" },
    ],
  },
  {
    key: "deletion_scheduled",
    description: "Account deletion is scheduled in 14 days",
    locales: ["tr", "en"],
    variables: [{ name: "delete_after", description: "Date of deletion", example: "5 Kasım 2026" }],
  },
  {
    key: "export_ready",
    description: "Personal data export is ready",
    locales: ["tr", "en"],
    variables: [{ name: "expires", description: "Download link expiry", example: "29 Ekim 2026" }],
  },
]

const SUBJECTS: Record<string, { tr: string; en: string }> = {
  login_code: { tr: "gezcez giriş kodunuz: {{code}}", en: "Your gezcez sign-in code: {{code}}" },
  signup_code: { tr: "gezcez hesabınızı oluşturun", en: "Finish creating your gezcez account" },
  password_reset: { tr: "Şifre sıfırlama kodunuz", en: "Your password reset code" },
  email_change: { tr: "Yeni e-posta adresinizi doğrulayın", en: "Confirm your new email address" },
  new_device_login: { tr: "Yeni bir cihazdan giriş yapıldı", en: "New sign-in to your account" },
  deletion_scheduled: { tr: "Hesabınız silinecek", en: "Your account is scheduled for deletion" },
  export_ready: { tr: "Verileriniz hazır", en: "Your data export is ready" },
}

export function renderTemplate(
  key: string,
  locale: "tr" | "en",
  variables: Record<string, string>,
): { subject: string; html: string; text: string } {
  const fill = (s: string) =>
    s.replace(/\{\{(\w+)\}\}/g, (_, name: string) => variables[name] ?? `{{${name}}}`)
  const subject = fill(SUBJECTS[key]?.[locale] ?? key)
  const lines = Object.entries(variables).map(([k, v]) => `${k}: ${v}`)
  const intro = locale === "tr" ? "Merhaba," : "Hello,"
  const outro =
    locale === "tr"
      ? "Bu e-postayı siz istemediyseniz yok sayabilirsiniz."
      : "If you didn't ask for this, you can ignore this email."
  const escape = (v: string) =>
    v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  const html = `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;background:#fffbeb;color:#172554;padding:24px">
<div style="max-width:480px;margin:auto;background:#fff;border:1px solid #fde68a;border-radius:16px;padding:24px">
<p style="font-weight:700;font-size:18px;margin:0 0 12px">gezcez</p>
<h1 style="font-size:20px;margin:0 0 12px">${escape(subject)}</h1>
<p>${intro}</p>
${variables.code ? `<p style="font-size:28px;letter-spacing:6px;font-weight:700;background:#fef3c7;border-radius:12px;padding:12px;text-align:center">${escape(variables.code)}</p>` : ""}
<ul>${lines.map((l) => `<li>${escape(l)}</li>`).join("")}</ul>
<p style="color:#64748b;font-size:12px">${outro}</p>
</div></body></html>`
  const text = [subject, "", intro, ...lines, "", outro].join("\n")
  return { subject, html, text }
}

const STATUS_POOL: S["EmailStatus"][] = [
  "delivered",
  "delivered",
  "delivered",
  "delivered",
  "delivered",
  "sent",
  "bounced",
  "complained",
  "failed",
  "queued",
]

export const DELIVERIES: S["EmailDelivery"][] = (() => {
  const rand = seeded(99)
  const out: S["EmailDelivery"][] = []
  for (let i = 0; i < 320; i++) {
    const user = USERS[Math.floor(rand() * USERS.length)]!
    const tpl = EMAIL_TEMPLATES[Math.floor(rand() * 3.4)]!
    const locale = user.locale
    const at = FIXTURE_NOW - i * 23 * 60_000 - Math.floor(rand() * 600_000)
    out.push({
      id: `eml_${(4000 + i).toString(36)}`,
      template: tpl.key,
      subject: renderTemplate(tpl.key, locale, { code: "••••••" }).subject,
      to_masked: user.email_masked,
      locale,
      status: STATUS_POOL[Math.floor(rand() * STATUS_POOL.length)]!,
      user: { id: user.id, display_name: user.display_name, username: user.username },
      created_at: iso(at),
      updated_at: iso(at + 4_000),
    })
  }
  return out
})()

export const SUPPRESSIONS: S["EmailSuppression"][] = DELIVERIES.filter(
  (d) => d.status === "bounced" || d.status === "complained",
)
  .slice(0, 14)
  .map((d, i) => ({
    id: `sup_${String(i + 1)}`,
    email_masked: d.to_masked,
    reason: d.status === "bounced" ? "bounce" : "complaint",
    created_at: d.updated_at,
    detail: d.status === "bounced" ? "550 5.1.1 mailbox unavailable" : "Marked as spam",
  }))

export function privacyFor(user: S["DashUser"]): S["UserPrivacy"] {
  const rand = seeded(user.id.charCodeAt(5) + user.id.charCodeAt(9))
  const exports: S["UserPrivacy"]["exports"] =
    rand() < 0.35
      ? [
          {
            id: `exp_${user.id.slice(-5)}`,
            status: rand() < 0.5 ? "ready" : "expired",
            requested_at: iso(FIXTURE_NOW - 9 * DAY),
            ready_at: iso(FIXTURE_NOW - 9 * DAY + 600_000),
            expires_at: iso(FIXTURE_NOW - 2 * DAY),
          },
        ]
      : []
  const deletion: S["UserPrivacy"]["deletion"] =
    user.status === "pending_deletion"
      ? {
          status: "scheduled",
          requested_at: iso(FIXTURE_NOW - 4 * DAY),
          delete_after: iso(FIXTURE_NOW + 10 * DAY),
        }
      : null
  return { exports, deletion }
}

/** Moderation history from the seeded bans plus a few older warnings and unbans. */
export const MODERATION: S["ModerationAction"][] = (() => {
  const moderator = userRef(PERSONAS[3]!)
  const out: S["ModerationAction"][] = []
  USERS.forEach((u, i) => {
    const ref = { id: u.id, display_name: u.display_name, username: u.username }
    if (u.ban) {
      out.push({
        id: `mod_${String(i)}_b`,
        action: "ban",
        user: ref,
        by: u.ban.created_by,
        public_reason: u.ban.public_reason,
        private_reason: u.ban.private_reason,
        until: u.ban.until,
        active: true,
        at: u.ban.created_at,
      })
    } else if (i % 23 === 5) {
      out.push(
        {
          id: `mod_${String(i)}_ob`,
          action: "ban",
          user: ref,
          by: moderator,
          public_reason: "Abusive messages in route reports.",
          private_reason: null,
          until: iso(FIXTURE_NOW - 20 * DAY),
          active: false,
          at: iso(FIXTURE_NOW - 27 * DAY - i * 3_600_000),
        },
        {
          id: `mod_${String(i)}_u`,
          action: "unban",
          user: ref,
          by: moderator,
          public_reason: "Ban period ended early after appeal.",
          private_reason: null,
          until: null,
          active: false,
          at: iso(FIXTURE_NOW - 22 * DAY - i * 3_600_000),
        },
      )
    } else if (i % 31 === 7) {
      out.push({
        id: `mod_${String(i)}_w`,
        action: "warn",
        user: ref,
        by: moderator,
        public_reason: "Please keep reports about the service, not people.",
        private_reason: null,
        until: null,
        active: false,
        at: iso(FIXTURE_NOW - 12 * DAY - i * 3_600_000),
      })
    }
  })
  return out.sort((a, b) => b.at.localeCompare(a.at))
})()

/** The persona's mock email, for "send test to my own address". */
export function personaEmail(userId: string): string | null {
  return PERSONAS.find((p) => p.userId === userId)?.email ?? null
}

export { maskEmail }
