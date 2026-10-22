/**
 * GENERATED FILE, DO NOT EDIT. Run `bun run api:gen` to regenerate.
 * Source: openapi/stub.openapi.json
 * Spec: gezcez API (STUB) 0.0.0-stub
 * STUB: generated from the hand-written openapi/stub.openapi.json. Regenerate against the
 * backend's published openapi.json as soon as it exists, then delete the stub.
 */
export const PERMISSION_KEYS = [
  "analytics.export",
  "analytics.read",
  "apps.read",
  "apps.secrets.rotate",
  "apps.write",
  "archive.read",
  "archive.write",
  "audit.read",
  "catalog.admin",
  "catalog.read",
  "catalog.sync",
  "catalog.write",
  "email.read",
  "email.test.send",
  "email.test.send.any",
  "flags.write",
  "jobs.read",
  "jobs.run",
  "members.read",
  "members.roles.write",
  "moderation.read",
  "moderation.write",
  "network.overview.read",
  "networks.read.all",
  "ops.logs",
  "permissions.read",
  "permissions.write",
  "providers.kill",
  "providers.read",
  "roles.assign",
  "roles.read",
  "roles.write",
  "settings.read",
  "settings.write",
  "support.read",
  "support.reply",
  "system.config.read",
  "system.health.read",
  "tracker.config.write",
  "tracker.control",
  "tracker.read",
  "users.pii.read",
  "users.read",
  "users.sessions.revoke",
  "vehicles.history.read",
  "vehicles.live.read"
] as const

export type PermissionKey = "analytics.export" | "analytics.read" | "apps.read" | "apps.secrets.rotate" | "apps.write" | "archive.read" | "archive.write" | "audit.read" | "catalog.admin" | "catalog.read" | "catalog.sync" | "catalog.write" | "email.read" | "email.test.send" | "email.test.send.any" | "flags.write" | "jobs.read" | "jobs.run" | "members.read" | "members.roles.write" | "moderation.read" | "moderation.write" | "network.overview.read" | "networks.read.all" | "ops.logs" | "permissions.read" | "permissions.write" | "providers.kill" | "providers.read" | "roles.assign" | "roles.read" | "roles.write" | "settings.read" | "settings.write" | "support.read" | "support.reply" | "system.config.read" | "system.health.read" | "tracker.config.write" | "tracker.control" | "tracker.read" | "users.pii.read" | "users.read" | "users.sessions.revoke" | "vehicles.history.read" | "vehicles.live.read"

/** `METHOD /path` to the permission and step-up flag the backend enforces (x-gezcez-permission, x-gezcez-sudo). */
export const OPERATION_AUTH = {
  "GET /v1/dash/audit": {
    "key": "audit.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/networks/{networkId}": {
    "key": "catalog.read",
    "scope": "network",
    "sudo": false
  },
  "GET /v1/dash/networks/{networkId}/overview": {
    "key": "network.overview.read",
    "scope": "network",
    "sudo": false
  },
  "GET /v1/dash/overview": {
    "key": "system.health.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/roles": {
    "key": "roles.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/system/health": {
    "key": "system.health.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/users": {
    "key": "users.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/users/{userId}": {
    "key": "users.read",
    "scope": "global",
    "sudo": false
  },
  "POST /v1/dash/users/{userId}/ban": {
    "key": "moderation.write",
    "scope": "global",
    "sudo": true
  },
  "POST /v1/dash/users/{userId}/reveal-email": {
    "key": "users.pii.read",
    "scope": "global",
    "sudo": false
  },
  "POST /v1/dash/users/{userId}/unban": {
    "key": "moderation.write",
    "scope": "global",
    "sudo": false
  }
} as const satisfies Record<string, { key: PermissionKey; scope: "global" | "network"; sudo: boolean }>
