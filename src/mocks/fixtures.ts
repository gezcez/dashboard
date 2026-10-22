import { PERMISSION_KEYS, type PermissionKey } from "@/api/permission-keys.gen"
import type { components } from "@/api/schema.gen"

type S = components["schemas"]

export const CITIES = {
  kocaeli: { id: 41, slug: "kocaeli", name: "Kocaeli" },
  sakarya: { id: 54, slug: "sakarya", name: "Sakarya" },
  istanbul: { id: 34, slug: "istanbul", name: "İstanbul" },
} satisfies Record<string, S["CityRef"]>

export const NETWORKS: S["Network"][] = [
  {
    id: 4,
    slug: "kocaeli",
    name: "Kocaeli UlaşımPark",
    city: CITIES.kocaeli,
    visibility: "public",
    timezone: "Europe/Istanbul",
    operator: "UlaşımPark A.Ş.",
    binding_count: 1,
  },
  {
    id: 54,
    slug: "sakarya",
    name: "Sakarya Büyükşehir",
    city: CITIES.sakarya,
    visibility: "public",
    timezone: "Europe/Istanbul",
    operator: "SAKUS",
    binding_count: 1,
  },
  {
    id: 7,
    slug: "istanbul-iett",
    name: "İETT",
    city: CITIES.istanbul,
    visibility: "hidden",
    timezone: "Europe/Istanbul",
    operator: "İETT",
    binding_count: 0,
  },
]

const NETWORK_KEYS = [
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
  "audit.read",
  "flags.write",
] as const satisfies PermissionKey[]

/** Default role grants from backend 6.4.1. */
export const ROLES = {
  root: {
    id: 1,
    key: "root",
    name: "Root",
    level: 100,
    description: "Bypasses checks (audited).",
    immutable: true,
  },
  admin: {
    id: 2,
    key: "admin",
    name: "Admin",
    level: 90,
    description: "Everything except deleting permission keys and the provider kill switch.",
    immutable: true,
  },
  network_admin: {
    id: 3,
    key: "network_admin",
    name: "Network admin",
    level: 60,
    description: "All network permissions plus member role management.",
    immutable: true,
  },
  moderator: {
    id: 4,
    key: "moderator",
    name: "Moderator",
    level: 50,
    description: "Users, moderation and audit.",
    immutable: true,
  },
  analyst: {
    id: 5,
    key: "analyst",
    name: "Analyst",
    level: 30,
    description: "Overview, live map, tracker status, catalogue and analytics.",
    immutable: false,
  },
  viewer: {
    id: 6,
    key: "viewer",
    name: "Viewer",
    level: 10,
    description: "Overview, catalogue and analytics, read only.",
    immutable: false,
  },
} as const

export const ROLE_PERMISSIONS: Record<keyof typeof ROLES, PermissionKey[]> = {
  root: [...PERMISSION_KEYS],
  admin: PERMISSION_KEYS.filter((k) => k !== "permissions.write" && k !== "providers.kill"),
  network_admin: [...NETWORK_KEYS],
  moderator: ["users.read", "moderation.read", "moderation.write", "audit.read"],
  analyst: [
    "network.overview.read",
    "vehicles.live.read",
    "tracker.read",
    "catalog.read",
    "analytics.read",
    "analytics.export",
  ],
  viewer: ["network.overview.read", "catalog.read", "analytics.read"],
}

const roleRef = (key: keyof typeof ROLES): S["RoleRef"] => {
  const r = ROLES[key]
  return { id: r.id, key: r.key, name: r.name, level: r.level }
}

export interface Persona {
  id: string
  userId: string
  name: string
  username: string
  email: string
  description: { en: string; tr: string }
  globalRoles: (keyof typeof ROLES)[]
  networkRoles: { network: string; roles: (keyof typeof ROLES)[] }[]
}

export const PERSONAS: Persona[] = [
  {
    id: "founder",
    userId: "01JA0000000000000000FOUNDR",
    name: "phasenull",
    username: "phasenull",
    email: "phasenull@gezcez.com",
    description: {
      en: "Root. Sees every page and every network.",
      tr: "Root. Tüm sayfaları ve ağları görür.",
    },
    globalRoles: ["root"],
    networkRoles: [
      { network: "kocaeli", roles: ["network_admin"] },
      { network: "sakarya", roles: ["network_admin"] },
    ],
  },
  {
    id: "network-admin",
    userId: "01JA00000000000000000NADMN",
    name: "Elif Kaya",
    username: "elif",
    email: "elif.kaya@test.gezcez.com",
    description: {
      en: "Network admin in Kocaeli. No platform pages.",
      tr: "Kocaeli ağ yöneticisi. Platform sayfalarını görmez.",
    },
    globalRoles: [],
    networkRoles: [{ network: "kocaeli", roles: ["network_admin"] }],
  },
  {
    id: "analyst",
    userId: "01JA0000000000000000ANLYST",
    name: "Murat Demir",
    username: "murat",
    email: "murat.demir@test.gezcez.com",
    description: {
      en: "Operator analyst in Kocaeli and viewer in Sakarya.",
      tr: "Kocaeli'de operatör analisti, Sakarya'da izleyici.",
    },
    globalRoles: [],
    networkRoles: [
      { network: "kocaeli", roles: ["analyst"] },
      { network: "sakarya", roles: ["viewer"] },
    ],
  },
  {
    id: "moderator",
    userId: "01JA00000000000000000MODER",
    name: "Zeynep Arslan",
    username: "zeynep",
    email: "zeynep.arslan@test.gezcez.com",
    description: {
      en: "Global moderator. Users and audit, no networks.",
      tr: "Genel moderatör. Kullanıcılar ve denetim, ağ yok.",
    },
    globalRoles: ["moderator"],
    networkRoles: [],
  },
]

export function findPersona(id: string | null | undefined): Persona | undefined {
  return PERSONAS.find((p) => p.id === id)
}

function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@")
  return `${local.slice(0, 1)}${"*".repeat(Math.max(local.length - 1, 3))}@${domain}`
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function permissionsFor(roles: (keyof typeof ROLES)[]): PermissionKey[] {
  return [...new Set(roles.flatMap((r) => ROLE_PERMISSIONS[r]))].sort()
}

export function meFor(persona: Persona, authTime: number): S["Me"] {
  return {
    user: {
      id: persona.userId,
      display_name: persona.name,
      username: persona.username,
      email_masked: maskEmail(persona.email),
      locale: "tr",
      avatar_initials: initials(persona.name),
    },
    auth_time: authTime,
    amr: ["otp"],
    global: {
      roles: persona.globalRoles.map(roleRef),
      permissions: permissionsFor(persona.globalRoles),
    },
    networks: persona.networkRoles.flatMap(({ network, roles }) => {
      const n = NETWORKS.find((x) => x.slug === network)
      if (!n) return []
      return [
        {
          id: n.id,
          slug: n.slug,
          name: n.name,
          city: n.city,
          roles: roles.map(roleRef),
          permissions: permissionsFor(roles),
        },
      ]
    }),
  }
}

// ---- Users, deterministic --------------------------------------------------------------------

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const FIRST = [
  "Ahmet",
  "Ayşe",
  "Mehmet",
  "Fatma",
  "Mustafa",
  "Emine",
  "Ali",
  "Hatice",
  "Hüseyin",
  "Zehra",
  "Can",
  "Deniz",
  "Ece",
  "Burak",
  "Selin",
  "Emre",
  "Gizem",
  "Kerem",
  "Naz",
  "Oğuz",
]
const LAST = [
  "Yılmaz",
  "Kaya",
  "Demir",
  "Şahin",
  "Çelik",
  "Yıldız",
  "Yıldırım",
  "Öztürk",
  "Aydın",
  "Özdemir",
  "Arslan",
  "Doğan",
  "Kılıç",
  "Aslan",
  "Çetin",
]
const STATUSES: S["UserStatus"][] = [
  "active",
  "active",
  "active",
  "active",
  "active",
  "unverified",
  "banned",
  "pending_deletion",
]
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

const DAY = 86_400_000
export const FIXTURE_NOW = Date.parse("2026-10-22T09:00:00Z")

export const USERS: S["DashUser"][] = (() => {
  const rand = seeded(7)
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]!
  const users: S["DashUser"][] = PERSONAS.map((p, i) => ({
    id: p.userId,
    display_name: p.name,
    username: p.username,
    email_masked: maskEmail(p.email),
    status: "active",
    locale: "tr",
    created_at: new Date(FIXTURE_NOW - (400 - i * 30) * DAY).toISOString(),
    last_active_at: new Date(FIXTURE_NOW - i * 3_600_000).toISOString(),
    email_verified: true,
    methods: { email_code: true, password: i === 0, passkeys: 0 },
    roles: [
      ...p.globalRoles.map((r) => ({
        network: null,
        role: roleRef(r),
        granted_at: new Date(FIXTURE_NOW - 300 * DAY).toISOString(),
        granted_by: null,
      })),
      ...p.networkRoles.flatMap(({ network, roles }) => {
        const n = NETWORKS.find((x) => x.slug === network)!
        return roles.map((r) => ({
          network: { id: n.id, slug: n.slug, name: n.name },
          role: roleRef(r),
          granted_at: new Date(FIXTURE_NOW - 200 * DAY).toISOString(),
          granted_by: {
            id: PERSONAS[0]!.userId,
            display_name: PERSONAS[0]!.name,
            username: PERSONAS[0]!.username,
          },
        }))
      }),
    ],
    ban: null,
  }))
  for (let i = 0; i < 180; i++) {
    const first = pick(FIRST)
    const last = pick(LAST)
    const status = pick(STATUSES)
    const created = FIXTURE_NOW - Math.floor(rand() * 500) * DAY
    const username =
      rand() > 0.4
        ? `${`${first}${last}`.toLowerCase().replace(/[^a-z]/g, "")}${Math.floor(rand() * 99)}`
        : null
    let id = "01J"
    for (let k = 0; k < 23; k++) id += CROCKFORD.charAt(Math.floor(rand() * 32))
    users.push({
      id,
      display_name: `${first} ${last}`,
      username,
      email_masked: maskEmail(`${first}.${last}@example.com`.toLowerCase()),
      status,
      locale: rand() > 0.2 ? "tr" : "en",
      created_at: new Date(created).toISOString(),
      last_active_at:
        status === "unverified"
          ? null
          : new Date(created + Math.floor(rand() * (FIXTURE_NOW - created))).toISOString(),
      email_verified: status !== "unverified",
      methods: { email_code: true, password: rand() > 0.7, passkeys: 0 },
      roles: [],
      ban:
        status === "banned"
          ? {
              public_reason: "Spam reports from several riders.",
              private_reason: "Automated signups from one IP block.",
              until: rand() > 0.5 ? new Date(FIXTURE_NOW + 20 * DAY).toISOString() : null,
              created_at: new Date(FIXTURE_NOW - 3 * DAY).toISOString(),
              created_by: {
                id: PERSONAS[3]!.userId,
                display_name: PERSONAS[3]!.name,
                username: PERSONAS[3]!.username,
              },
            }
          : null,
    })
  }
  return users
})()

export function toListItem(u: S["DashUser"]): S["DashUserListItem"] {
  return {
    id: u.id,
    display_name: u.display_name,
    username: u.username,
    email_masked: u.email_masked,
    status: u.status,
    created_at: u.created_at,
    last_active_at: u.last_active_at,
    role_count: u.roles.length,
  }
}

// ---- Audit -----------------------------------------------------------------------------------

const ACTIONS: { action: string; severity: S["AuditEntry"]["severity"]; target: string }[] = [
  { action: "user.ban", severity: "warn", target: "user" },
  { action: "user.unban", severity: "info", target: "user" },
  { action: "role.grant", severity: "warn", target: "user" },
  { action: "role.revoke", severity: "info", target: "user" },
  { action: "tracker.pause", severity: "critical", target: "binding" },
  { action: "tracker.resume", severity: "info", target: "binding" },
  { action: "app.secret.rotate", severity: "critical", target: "app" },
  { action: "role.permissions.update", severity: "warn", target: "role" },
  { action: "settings.update", severity: "warn", target: "settings" },
  { action: "auth.refresh_reuse", severity: "critical", target: "session" },
]

/** Plausible before/after payloads so the audit diff view has something to show. */
function CHANGES(
  action: string,
  network: string | null,
): Pick<S["AuditEntry"], "before" | "after"> {
  switch (action) {
    case "settings.update":
      return {
        before: { signup_open: true, min_app_version: "3.1.0" },
        after: { signup_open: false, min_app_version: "3.2.0" },
      }
    case "user.ban":
      return {
        before: { status: "active" },
        after: { status: "banned", duration: "7d", public_reason: "Spam" },
      }
    case "user.unban":
      return { before: { status: "banned" }, after: { status: "active" } }
    case "role.grant":
      return { before: null, after: { role: "analyst", network: "kocaeli" } }
    case "role.revoke":
      return { before: { role: "viewer", network: "sakarya" }, after: null }
    case "role.permissions.update":
      return {
        before: { added: [], removed: [] },
        after: { added: ["analytics.export"], removed: ["vehicles.history.read"] },
      }
    case "tracker.pause":
    case "tracker.resume":
      return {
        before: { paused: action === "tracker.resume", network },
        after: { paused: action === "tracker.pause", network },
      }
    default:
      return { before: null, after: null }
  }
}

export const AUDIT: S["AuditEntry"][] = (() => {
  const rand = seeded(42)
  const out: S["AuditEntry"][] = []
  for (let i = 0; i < 240; i++) {
    const a = ACTIONS[Math.floor(rand() * ACTIONS.length)]!
    const actor = PERSONAS[Math.floor(rand() * 2) === 0 ? 0 : 3]!
    const target = USERS[Math.floor(rand() * USERS.length)]!
    const network = a.target === "binding" ? NETWORKS[Math.floor(rand() * 2)]! : null
    out.push({
      id: `aud_${(1000 + i).toString(36)}`,
      at: new Date(FIXTURE_NOW - i * 47 * 60_000 - Math.floor(rand() * 600_000)).toISOString(),
      action: a.action,
      severity: a.severity,
      actor: { id: actor.userId, display_name: actor.name, username: actor.username },
      target_type: a.target,
      target_id:
        a.target === "user"
          ? target.id
          : a.target === "binding"
            ? `kentkart/${network?.id ?? 4}`
            : null,
      target_label:
        a.target === "user"
          ? target.display_name
          : a.target === "binding"
            ? `kentkart/${String(network?.id ?? 4).padStart(3, "0")}`
            : null,
      network_id: network?.id ?? null,
      ip_prefix: "85.105.12.0/24",
      request_id: `req_${(5000 + i).toString(36)}`,
      ...CHANGES(a.action, network?.slug ?? null),
    })
  }
  return out
})()
