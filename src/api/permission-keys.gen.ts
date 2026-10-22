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
  "DELETE /v1/dash/apps/{appId}/secret/previous": {
    "key": "apps.secrets.rotate",
    "scope": "global",
    "sudo": true
  },
  "DELETE /v1/dash/email/suppressions/{id}": {
    "key": "settings.write",
    "scope": "global",
    "sudo": false
  },
  "DELETE /v1/dash/permissions/{key}": {
    "key": "permissions.write",
    "scope": "global",
    "sudo": true
  },
  "DELETE /v1/dash/users/{userId}/sessions/{sessionId}": {
    "key": "users.sessions.revoke",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/apps": {
    "key": "apps.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/apps/{appId}": {
    "key": "apps.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/audit": {
    "key": "audit.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/cities": {
    "key": "catalog.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/email/deliveries": {
    "key": "email.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/email/suppressions": {
    "key": "email.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/email/templates": {
    "key": "email.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/moderation": {
    "key": "moderation.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/networks/{networkId}": {
    "key": "catalog.read",
    "scope": "network",
    "sudo": false
  },
  "GET /v1/dash/networks/{networkId}/analytics": {
    "key": "analytics.read",
    "scope": "network",
    "sudo": false
  },
  "GET /v1/dash/networks/{networkId}/analytics/{metric}": {
    "key": "analytics.read",
    "scope": "network",
    "sudo": false
  },
  "GET /v1/dash/networks/{networkId}/analytics/{metric}/export": {
    "key": "analytics.export",
    "scope": "network",
    "sudo": false
  },
  "GET /v1/dash/networks/{networkId}/audit": {
    "key": "audit.read",
    "scope": "network",
    "sudo": false
  },
  "GET /v1/dash/networks/{networkId}/bindings": {
    "key": "catalog.read",
    "scope": "network",
    "sudo": false
  },
  "GET /v1/dash/networks/{networkId}/bindings/{bindingId}": {
    "key": "catalog.read",
    "scope": "network",
    "sudo": false
  },
  "GET /v1/dash/networks/{networkId}/bindings/{bindingId}/polls": {
    "key": "tracker.read",
    "scope": "network",
    "sudo": false
  },
  "GET /v1/dash/networks/{networkId}/bindings/{bindingId}/series": {
    "key": "tracker.read",
    "scope": "network",
    "sudo": false
  },
  "GET /v1/dash/networks/{networkId}/bindings/{bindingId}/stats": {
    "key": "tracker.read",
    "scope": "network",
    "sudo": false
  },
  "GET /v1/dash/networks/{networkId}/issues": {
    "key": "catalog.read",
    "scope": "network",
    "sudo": false
  },
  "GET /v1/dash/networks/{networkId}/members": {
    "key": "members.read",
    "scope": "network",
    "sudo": false
  },
  "GET /v1/dash/networks/{networkId}/members/assignable-roles": {
    "key": "members.roles.write",
    "scope": "network",
    "sudo": false
  },
  "GET /v1/dash/networks/{networkId}/members/candidates": {
    "key": "members.roles.write",
    "scope": "network",
    "sudo": false
  },
  "GET /v1/dash/networks/{networkId}/overview": {
    "key": "network.overview.read",
    "scope": "network",
    "sudo": false
  },
  "GET /v1/dash/networks/{networkId}/replay": {
    "key": "vehicles.history.read",
    "scope": "network",
    "sudo": false
  },
  "GET /v1/dash/networks/{networkId}/sync-runs": {
    "key": "catalog.read",
    "scope": "network",
    "sudo": false
  },
  "GET /v1/dash/networks/{networkId}/tracker": {
    "key": "tracker.read",
    "scope": "network",
    "sudo": false
  },
  "GET /v1/dash/networks/{networkId}/vehicles/{vehicleId}/track": {
    "key": "vehicles.live.read",
    "scope": "network",
    "sudo": false
  },
  "GET /v1/dash/overview": {
    "key": "system.health.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/permissions": {
    "key": "permissions.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/permissions/registry": {
    "key": "permissions.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/providers": {
    "key": "providers.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/providers/{key}": {
    "key": "providers.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/roles": {
    "key": "roles.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/roles/{roleId}": {
    "key": "roles.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/roles/permission-matrix": {
    "key": "roles.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/system/health": {
    "key": "system.health.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/tracker/status": {
    "key": "tracker.read",
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
  "GET /v1/dash/users/{userId}/activity": {
    "key": "audit.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/users/{userId}/emails": {
    "key": "email.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/users/{userId}/privacy": {
    "key": "users.read",
    "scope": "global",
    "sudo": false
  },
  "GET /v1/dash/users/{userId}/sessions": {
    "key": "users.sessions.revoke",
    "scope": "global",
    "sudo": false
  },
  "PATCH /v1/dash/apps/{appId}": {
    "key": "apps.write",
    "scope": "global",
    "sudo": false
  },
  "PATCH /v1/dash/networks/{networkId}/bindings/{bindingId}/config": {
    "key": "tracker.config.write",
    "scope": "network",
    "sudo": true
  },
  "PATCH /v1/dash/networks/{networkId}/issues": {
    "key": "catalog.write",
    "scope": "network",
    "sudo": false
  },
  "PATCH /v1/dash/roles/{roleId}": {
    "key": "roles.write",
    "scope": "global",
    "sudo": true
  },
  "POST /v1/dash/apps": {
    "key": "apps.write",
    "scope": "global",
    "sudo": true
  },
  "POST /v1/dash/apps/{appId}/revoke-all": {
    "key": "apps.write",
    "scope": "global",
    "sudo": true
  },
  "POST /v1/dash/apps/{appId}/secret": {
    "key": "apps.secrets.rotate",
    "scope": "global",
    "sudo": true
  },
  "POST /v1/dash/email/templates/{key}/preview": {
    "key": "email.read",
    "scope": "global",
    "sudo": false
  },
  "POST /v1/dash/email/test": {
    "key": "email.test.send",
    "scope": "global",
    "sudo": false
  },
  "POST /v1/dash/networks/{networkId}/bindings/{bindingId}/control": {
    "key": "tracker.control",
    "scope": "network",
    "sudo": false
  },
  "POST /v1/dash/networks/{networkId}/bindings/{bindingId}/sync": {
    "key": "catalog.sync",
    "scope": "network",
    "sudo": false
  },
  "POST /v1/dash/networks/{networkId}/members/{userId}/roles": {
    "key": "members.roles.write",
    "scope": "network",
    "sudo": false
  },
  "POST /v1/dash/providers/{key}/kill": {
    "key": "providers.kill",
    "scope": "global",
    "sudo": true
  },
  "POST /v1/dash/roles": {
    "key": "roles.write",
    "scope": "global",
    "sudo": true
  },
  "POST /v1/dash/roles/permissions:batch": {
    "key": "roles.write",
    "scope": "global",
    "sudo": true
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
  "POST /v1/dash/users/{userId}/roles": {
    "key": "roles.assign",
    "scope": "global",
    "sudo": true
  },
  "POST /v1/dash/users/{userId}/sessions/revoke-all": {
    "key": "users.sessions.revoke",
    "scope": "global",
    "sudo": true
  },
  "POST /v1/dash/users/{userId}/unban": {
    "key": "moderation.write",
    "scope": "global",
    "sudo": false
  }
} as const satisfies Record<string, { key: PermissionKey; scope: "global" | "network"; sudo: boolean }>
