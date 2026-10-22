/**
 * GENERATED FILE, DO NOT EDIT. Run `bun run api:gen` to regenerate.
 * Source: openapi/stub.openapi.json
 * Spec: gezcez API (STUB) 0.0.0-stub
 * STUB: generated from the hand-written openapi/stub.openapi.json. Regenerate against the
 * backend's published openapi.json as soon as it exists, then delete the stub.
 */
export interface paths {
    "/v1/dash/apps": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listApps"];
        put?: never;
        post: operations["createApp"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/apps/{appId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getApp"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** @description redirect_uris and first_party changes additionally need a fresh sign-in (403 AUTH_STEP_UP_REQUIRED). */
        patch: operations["updateApp"];
        trace?: never;
    };
    "/v1/dash/apps/{appId}/revoke-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["revokeAllAppTokens"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/apps/{appId}/secret": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["rotateAppSecret"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/apps/{appId}/secret/previous": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["revokePreviousAppSecret"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/audit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listAudit"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/cities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description (copied from backend rewrite-transit) */
        get: operations["Networks_cities"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/email/deliveries": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listEmailDeliveries"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/email/suppressions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listEmailSuppressions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/email/suppressions/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["deleteEmailSuppression"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/email/templates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listEmailTemplates"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/email/templates/{key}/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["previewEmailTemplate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/email/test": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description Own verified address by default; `to` needs email.test.send.any. */
        post: operations["sendTestEmail"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/moderation": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listModeration"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/networks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Membership networks, or every network with networks.read.all. */
        get: operations["listNetworks"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/networks/{networkId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getNetwork"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/networks/{networkId}/analytics/{metric}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * One metric of backend 6.9 as columnar JSON
         * @description PLANNED (backend 7.2), not in the backend yet. Shape written by the dashboard.
         */
        get: operations["Analytics_metric"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/networks/{networkId}/analytics/{metric}/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * CSV or Parquet stream of the same query
         * @description PLANNED (backend 7.2), not in the backend yet. Shape written by the dashboard.
         */
        get: operations["Analytics_export"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/networks/{networkId}/audit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listNetworkAudit"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/networks/{networkId}/bindings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description (copied from backend rewrite-transit) */
        get: operations["Networks_bindings"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/networks/{networkId}/bindings/{bindingId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description (copied from backend rewrite-transit) */
        get: operations["Networks_binding"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/networks/{networkId}/bindings/{bindingId}/config": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Edit poll intervals and adapter config (validated against config_schema)
         * @description PLANNED (backend 7.2), not in the backend yet. Shape written by the dashboard.
         */
        patch: operations["TrackerAdmin_config"];
        trace?: never;
    };
    "/v1/dash/networks/{networkId}/bindings/{bindingId}/control": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description (copied from backend rewrite-transit) */
        post: operations["TrackerAdmin_control"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/networks/{networkId}/bindings/{bindingId}/polls": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description (copied from backend rewrite-transit) */
        get: operations["TrackerAdmin_polls"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/networks/{networkId}/bindings/{bindingId}/series": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Bucketed poll latency, outcomes, vehicles, lag and dedup ratio
         * @description PLANNED (backend 7.2), not in the backend yet. Shape written by the dashboard.
         */
        get: operations["TrackerAdmin_series"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/networks/{networkId}/bindings/{bindingId}/stats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description (copied from backend rewrite-transit) */
        get: operations["TrackerAdmin_stats"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/networks/{networkId}/bindings/{bindingId}/sync": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description (copied from backend rewrite-transit) */
        post: operations["TransitAdmin_run"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/networks/{networkId}/issues": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Catalog_issues
         * @description PLANNED (backend 7.2), not in the backend yet. Shape written by the dashboard.
         */
        get: operations["Catalog_issues"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Bulk status change
         * @description PLANNED (backend 7.2), not in the backend yet. Shape written by the dashboard.
         */
        patch: operations["Catalog_issuesUpdate"];
        trace?: never;
    };
    "/v1/dash/networks/{networkId}/members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listMembers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/networks/{networkId}/members/{userId}/roles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["assignNetworkRoles"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/networks/{networkId}/members/assignable-roles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description STUB EXTENSION: roles strictly below the caller's level in this network. */
        get: operations["listAssignableRoles"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/networks/{networkId}/members/candidates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description STUB EXTENSION: user lookup for Add member (username prefix; exact email needs users.pii.read). */
        get: operations["searchMemberCandidates"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/networks/{networkId}/overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getNetworkOverview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/networks/{networkId}/replay": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Columnar positions for playback (6 h network-wide, 24 h per route)
         * @description PLANNED (backend 7.2), not in the backend yet. Shape written by the dashboard.
         */
        get: operations["Vehicles_replay"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/networks/{networkId}/sync-runs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description (copied from backend rewrite-transit) */
        get: operations["TransitAdmin_runs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/networks/{networkId}/tracker": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description (copied from backend rewrite-transit) */
        get: operations["TrackerAdmin_overview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/networks/{networkId}/vehicles/{vehicleId}/track": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Trail up to 1 h back
         * @description PLANNED (backend 7.2), not in the backend yet. Shape written by the dashboard.
         */
        get: operations["Vehicles_track"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getDashOverview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/permissions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listPermissions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/permissions/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["deletePermission"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/permissions/registry": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getPermissionRegistry"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/providers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description (copied from backend rewrite-transit) */
        get: operations["Networks_providers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/providers/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description (copied from backend rewrite-transit) */
        get: operations["Networks_provider"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/providers/{key}/kill": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** @description (copied from backend rewrite-transit) */
        post: operations["Networks_kill"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/roles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listRoles"];
        put?: never;
        post: operations["createRole"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/roles/{roleId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getRole"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["updateRole"];
        trace?: never;
    };
    "/v1/dash/roles/permission-matrix": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getPermissionMatrix"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/roles/permissions:batch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["batchRolePermissions"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/system/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getSystemHealth"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/tracker/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Per-binding state across networks (global tracker grid)
         * @description PLANNED (backend 7.2), not in the backend yet. Shape written by the dashboard.
         */
        get: operations["TrackerAdmin_status"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listUsers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/users/{userId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getUser"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/users/{userId}/activity": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listUserActivity"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/users/{userId}/ban": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["banUser"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/users/{userId}/emails": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listUserEmails"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/users/{userId}/privacy": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description STUB EXTENSION: not in backend 7.2 yet. Data export and deletion requests. */
        get: operations["getUserPrivacy"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/users/{userId}/reveal-email": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["revealUserEmail"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/users/{userId}/roles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["assignGlobalRoles"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/users/{userId}/sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listUserSessions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/users/{userId}/sessions/{sessionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["revokeUserSession"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/users/{userId}/sessions/revoke-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["revokeAllUserSessions"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/dash/users/{userId}/unban": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["unbanUser"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getMe"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["patchMe"];
        trace?: never;
    };
    "/v1/networks/{networkId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description (copied from backend rewrite-transit) */
        get: operations["Cities_network"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/networks/{networkId}/routes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description (copied from backend rewrite-transit) */
        get: operations["Transit_routes"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/networks/{networkId}/stops": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description (copied from backend rewrite-transit) */
        get: operations["Transit_stops"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/networks/{networkId}/vehicles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description (copied from backend rewrite-transit) */
        get: operations["Vehicles_snapshot"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/oauth/scopes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listScopes"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/routes/{routeId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description (copied from backend rewrite-transit) */
        get: operations["Transit_route"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/routes/{routeId}/shape": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description (copied from backend rewrite-transit) */
        get: operations["Transit_shape"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/routes/{routeId}/timetable": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description (copied from backend rewrite-transit) */
        get: operations["Transit_timetable"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/stops/{stopId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description (copied from backend rewrite-transit) */
        get: operations["Transit_stop"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/stops/{stopId}/departures": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description (copied from backend rewrite-transit) */
        get: operations["Vehicles_departures"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/vehicles/{vehicleId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description (copied from backend rewrite-transit) */
        get: operations["Vehicles_vehicle"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** @enum {string} */
        Amr: "otp" | "pwd" | "webauthn";
        /** @enum {string} */
        AnalyticsMetric: "fleet.hourly" | "fleet.vehicle-days" | "runs.runtime" | "runs.departures" | "headways.observed" | "adherence.departure" | "speed.heatmap" | "segments.travel-time" | "dwell.stops" | "quality.feed" | "coverage.routes" | "headways.marey";
        AnalyticsResultDto: {
            columns: string[];
            meta: {
                generated_at: string;
                n: number;
                /** @enum {string} */
                source: "hot" | "archive" | "rollup";
                /** @description adherence.departure: false when the network has no timetable */
                timetable?: boolean;
                timezone?: string;
            };
            rows: (string | number | boolean | null)[][];
        };
        ApiError: {
            code: components["schemas"]["ErrorCode"];
            details?: {
                [key: string]: unknown;
            };
            message: string;
            request_id: string;
        };
        AppDetail: {
            access_ttl_s: number;
            active_families: number;
            client_id: string;
            /** Format: date-time */
            created_at: string;
            description: string;
            first_party: boolean;
            homepage_url: string | null;
            logo_url: string | null;
            name: string;
            platform: components["schemas"]["AppPlatform"];
            redirect_uris: string[];
            refresh_max_s: number;
            refresh_ttl_s: number;
            scopes: string[];
            secrets: components["schemas"]["AppSecret"][];
            system: boolean;
            tokens_24h: number;
            type: components["schemas"]["AppType"];
            /** Format: date-time */
            updated_at: string;
            usage: {
                date: string;
                tokens: number;
            }[];
        };
        AppListItem: {
            active_families: number;
            client_id: string;
            /** Format: date-time */
            created_at: string;
            first_party: boolean;
            name: string;
            platform: components["schemas"]["AppPlatform"];
            redirect_uri_count: number;
            system: boolean;
            tokens_24h: number;
            type: components["schemas"]["AppType"];
        };
        /** @enum {string} */
        AppPlatform: "web" | "native" | "dev";
        AppSecret: {
            /** Format: date-time */
            created_at: string;
            expires_at: string | null;
            id: string;
            last_used_at: string | null;
            prefix: string;
            /** @enum {string} */
            state: "current" | "previous";
        };
        /** @enum {string} */
        AppType: "public" | "confidential";
        AuditEntry: {
            action: string;
            actor: components["schemas"]["UserRef"] | null;
            after: {
                [key: string]: unknown;
            } | null;
            /** Format: date-time */
            at: string;
            before: {
                [key: string]: unknown;
            } | null;
            id: string;
            ip_prefix: string | null;
            network_id: number | null;
            request_id: string | null;
            /** @enum {string} */
            severity: "info" | "warn" | "critical";
            target_id: string | null;
            target_label: string | null;
            target_type: string | null;
        };
        Ban: {
            /** Format: date-time */
            created_at: string;
            created_by: components["schemas"]["UserRef"] | null;
            private_reason: string | null;
            public_reason: string;
            until: string | null;
        };
        BindingConfigPatchDto: {
            config?: {
                [key: string]: unknown;
            };
            idle_poll_interval_s?: number;
            poll_interval_s?: number;
            reason?: string;
        };
        /** @description One row per bucket. `errors` holds per error code counts aligned with `t`. */
        BindingSeriesDto: {
            bucket_s: number;
            dedup_ratio: (number | null)[];
            errors: {
                [key: string]: number[];
            };
            failed: number[];
            /** @description Poll gaps longer than 3 intervals, [from, to] ISO */
            gaps: string[][];
            lag_p50_s: (number | null)[];
            lag_p95_s: (number | null)[];
            latency_p50_ms: (number | null)[];
            latency_p95_ms: (number | null)[];
            ok: number[];
            polls: number[];
            /** @description Bucket start (ISO) */
            t: string[];
            vehicles: (number | null)[];
        };
        BindingStatsDto: {
            binding_id: number;
            live_vehicles: number;
            open_runs: number;
            polls: {
                [key: string]: number;
            };
            positions_hot: number;
            success_rate: number | null;
            window_hours: number;
        };
        CityRef: {
            id: number;
            name: string;
            slug: string;
        };
        ControlResultDto: {
            error: string | null;
            ok: boolean;
            status: {
                binding_id: number;
                consecutive_failures: number;
                credentials: {
                    expires_at: string | null;
                    failures: number;
                    realm: string;
                    refreshed_at: string | null;
                    secrets_set: {
                        [key: string]: boolean;
                    };
                    /** @enum {string} */
                    state: "ok" | "missing" | "refreshing" | "auth_failed" | "unknown";
                } | null;
                interval_s: number | null;
                last_feed_at: string | null;
                last_outcome: string | null;
                last_poll_at: string | null;
                live_vehicles: number;
                message: string | null;
                next_poll_at: string | null;
                /** @enum {string} */
                state: "ok" | "degraded" | "down" | "paused" | "killed" | "unknown";
                subscribers: number;
                url_variant: ("primary" | "fallback") | null;
            } | null;
        };
        DashBindingDto: {
            capabilities: {
                alerts: boolean;
                /** @constant */
                bike_share: false;
                card: {
                    balance: boolean;
                    history: boolean;
                    label: {
                        en: string;
                        tr: string;
                    };
                    number_format: string | null;
                    requires_provider_account: boolean;
                } | null;
                /** @enum {string} */
                realtime_departures: "none" | "estimated" | "live";
                realtime_vehicles: boolean;
                routes: boolean;
                shapes: boolean;
                stops: boolean;
                timetables: boolean;
                /** @constant */
                trip_planner: false;
                trip_updates: boolean;
            };
            config: {
                [key: string]: unknown;
            };
            created_at: string;
            disabled_reason: string | null;
            external_ref: string;
            id: number;
            idle_poll_interval_s: number;
            last_feed_at: string | null;
            network_id: number;
            poll_interval_s: number;
            provider_key: string;
            /** @description Served by the fake provider (PROVIDER_REPLAY) */
            replayed: boolean;
            /** @enum {string} */
            state: "ok" | "degraded" | "down" | "paused" | "killed" | "unknown";
            state_message: string | null;
            /** @enum {string} */
            status: "active" | "paused" | "disabled";
            updated_at: string | null;
        };
        DashCityDto: {
            bbox: [
                number,
                number,
                number,
                number
            ] | null;
            center_lat: number | null;
            center_lon: number | null;
            country_code: string;
            id: number;
            name: {
                en: string;
                tr: string;
            };
            slug: string;
            sort: number;
            /** @enum {string} */
            status: "draft" | "public" | "hidden";
            timezone: string;
        };
        DashOverview: {
            kpis: {
                active_sessions_24h: number;
                active_vehicles: number;
                networks_live: number;
                networks_total: number;
                open_issues: number;
                signups_7d: number;
                users_total: number;
            };
            recent_events: components["schemas"]["AuditEntry"][];
        };
        DashProviderDetailDto: {
            /** @description An adapter for this key exists in this build */
            adapter: boolean;
            binding_count: number;
            capabilities: {
                alerts: boolean;
                /** @constant */
                bike_share: false;
                card: {
                    balance: boolean;
                    history: boolean;
                    label: {
                        en: string;
                        tr: string;
                    };
                    number_format: string | null;
                    requires_provider_account: boolean;
                } | null;
                /** @enum {string} */
                realtime_departures: "none" | "estimated" | "live";
                realtime_vehicles: boolean;
                routes: boolean;
                shapes: boolean;
                stops: boolean;
                timetables: boolean;
                /** @constant */
                trip_planner: false;
                trip_updates: boolean;
            } | null;
            config_schema: {
                [key: string]: unknown;
            } | null;
            credentials: {
                expires_at: string | null;
                failures: number;
                realm: string;
                refreshed_at: string | null;
                secrets_set: {
                    [key: string]: boolean;
                };
                /** @enum {string} */
                state: "ok" | "missing" | "refreshing" | "auth_failed" | "unknown";
            }[];
            disabled_reason: string | null;
            /** @description Dashboard kill switch (providers.enabled) */
            enabled: boolean;
            /** @description PROVIDER_<KEY>_ENABLED hard kill */
            env_enabled: boolean;
            image_url: string | null;
            key: string;
            legal_note: string | null;
            name: string;
            pulled_data: {
                can_optout: boolean;
                details: string;
                is_collected: boolean;
                key: string;
            }[];
            rate_hint: {
                host: string;
                requests_per_second: number;
            } | null;
            replayed: boolean;
            url: string | null;
        };
        DashProviderDto: {
            /** @description An adapter for this key exists in this build */
            adapter: boolean;
            binding_count: number;
            capabilities: {
                alerts: boolean;
                /** @constant */
                bike_share: false;
                card: {
                    balance: boolean;
                    history: boolean;
                    label: {
                        en: string;
                        tr: string;
                    };
                    number_format: string | null;
                    requires_provider_account: boolean;
                } | null;
                /** @enum {string} */
                realtime_departures: "none" | "estimated" | "live";
                realtime_vehicles: boolean;
                routes: boolean;
                shapes: boolean;
                stops: boolean;
                timetables: boolean;
                /** @constant */
                trip_planner: false;
                trip_updates: boolean;
            } | null;
            disabled_reason: string | null;
            /** @description Dashboard kill switch (providers.enabled) */
            enabled: boolean;
            /** @description PROVIDER_<KEY>_ENABLED hard kill */
            env_enabled: boolean;
            image_url: string | null;
            key: string;
            legal_note: string | null;
            name: string;
            pulled_data: {
                can_optout: boolean;
                details: string;
                is_collected: boolean;
                key: string;
            }[];
            replayed: boolean;
            url: string | null;
        };
        DashUser: {
            ban: components["schemas"]["Ban"] | null;
            /** Format: date-time */
            created_at: string;
            display_name: string;
            email_masked: string;
            email_verified: boolean;
            id: string;
            last_active_at: string | null;
            locale: components["schemas"]["Locale"];
            methods: {
                email_code: boolean;
                passkeys: number;
                password: boolean;
            };
            roles: components["schemas"]["RoleAssignment"][];
            status: components["schemas"]["UserStatus"];
            username: string | null;
        };
        DashUserListItem: {
            /** Format: date-time */
            created_at: string;
            display_name: string;
            email_masked: string;
            id: string;
            last_active_at: string | null;
            role_count: number;
            status: components["schemas"]["UserStatus"];
            username: string | null;
        };
        DeparturesDto: {
            generated_at: string;
            items: {
                cancelled: boolean;
                headsign: string | null;
                predicted_at: string | null;
                route: {
                    agency: string | null;
                    colour: string | null;
                    /** @description Stable public id, e.g. 1.42041 */
                    id: string;
                    long_name: string;
                    /** @enum {string} */
                    mode: "tram" | "metro" | "rail" | "bus" | "ferry" | "cable_tram" | "aerial_lift" | "funicular" | "trolleybus" | "monorail";
                    network_id: number;
                    route_type: number;
                    short_name: string;
                    text_colour: string | null;
                };
                scheduled_at: string | null;
                /** @enum {string} */
                source: "schedule" | "live" | "live_eta";
                stops_away: number | null;
                trip_id: string | null;
                vehicle_id: string | null;
            }[];
            stop: {
                code: string | null;
                /** @description Stable public id, e.g. 1.41003 */
                id: string;
                lat: number;
                lon: number;
                name: string;
                network_id: number;
            };
        };
        EmailDelivery: {
            /** Format: date-time */
            created_at: string;
            id: string;
            locale: components["schemas"]["Locale"];
            status: components["schemas"]["EmailStatus"];
            subject: string;
            template: string;
            to_masked: string;
            /** Format: date-time */
            updated_at: string;
            user: components["schemas"]["UserRef"] | null;
        };
        /** @enum {string} */
        EmailStatus: "queued" | "sent" | "delivered" | "bounced" | "complained" | "failed";
        EmailSuppression: {
            /** Format: date-time */
            created_at: string;
            detail: string | null;
            email_masked: string;
            id: string;
            /** @enum {string} */
            reason: "bounce" | "complaint" | "manual";
        };
        EmailTemplate: {
            description: string;
            key: string;
            locales: components["schemas"]["Locale"][];
            variables: {
                description: string;
                example: string;
                name: string;
            }[];
        };
        /** @enum {string} */
        ErrorCode: "VALIDATION_FAILED" | "AUTH_REQUIRED" | "AUTH_SESSION_REQUIRED" | "AUTH_TOKEN_INVALID" | "AUTH_TOKEN_EXPIRED" | "AUTH_SESSION_REVOKED" | "AUTH_CODE_INVALID" | "AUTH_CODE_EXPIRED" | "AUTH_CODE_ATTEMPTS" | "AUTH_PASSWORD_INVALID" | "AUTH_PASSWORD_WEAK" | "AUTH_PASSWORD_BREACHED" | "AUTH_TURNSTILE_FAILED" | "AUTH_STEP_UP_REQUIRED" | "CSRF_INVALID" | "OAUTH_INVALID_CLIENT" | "OAUTH_INVALID_REDIRECT_URI" | "OAUTH_REQUEST_EXPIRED" | "OAUTH_REQUEST_NOT_FOUND" | "SCOPE_MISSING" | "PERMISSION_MISSING" | "ROLE_LEVEL_TOO_LOW" | "ROLE_IMMUTABLE" | "USER_BANNED" | "USER_PENDING_DELETION" | "USER_DELETED" | "EMAIL_TAKEN" | "USERNAME_TAKEN" | "NOT_FOUND" | "CONFLICT" | "VERSION_CONFLICT" | "RATE_LIMITED" | "PROVIDER_DISABLED" | "PROVIDER_UNAVAILABLE" | "CAPABILITY_UNSUPPORTED" | "CARD_NOT_FOUND" | "ANALYTICS_TIMEOUT" | "INTERNAL";
        ErrorEnvelope: {
            error: components["schemas"]["ApiError"];
            /** @constant */
            ok: false;
        };
        HealthCheck: {
            key: string;
            /** @enum {string} */
            status: "ok" | "warn" | "error";
            threshold: string | null;
            value: string | null;
        };
        IssueDto: {
            details: string | null;
            entity: {
                id: string;
                label: string | null;
                /** @enum {string} */
                type: "route" | "stop" | "vehicle" | "binding" | "trip";
            };
            first_detected_at: string;
            id: string;
            last_detected_at: string;
            occurrences: number;
            reason: string | null;
            severity: components["schemas"]["IssueSeverity"];
            status: components["schemas"]["IssueStatus"];
            type: components["schemas"]["IssueType"];
            updated_at: string | null;
            updated_by: components["schemas"]["UserRef"] | null;
        };
        IssuePageDto: {
            /** @description Open issues per severity, for the header */
            counts: {
                [key: string]: number;
            };
            items: components["schemas"]["IssueDto"][];
            next_cursor: string | null;
            prev_cursor: string | null;
            total: number | null;
        };
        /** @enum {string} */
        IssueSeverity: "info" | "warning" | "critical";
        /** @enum {string} */
        IssueStatus: "open" | "acknowledged" | "resolved" | "ignored";
        /** @enum {string} */
        IssueType: "route_not_in_catalog" | "route_never_seen" | "stop_without_coordinates" | "duplicate_stops" | "trip_without_timetable" | "staff_route_leak";
        IssueUpdateDto: {
            ids: string[];
            /** @description Required for ignored */
            reason?: string;
            status: components["schemas"]["IssueStatus"];
        };
        IssueUpdateResultDto: {
            updated: number;
        };
        /** @enum {string} */
        Locale: "tr" | "en";
        Me: {
            amr: components["schemas"]["Amr"][];
            /** @description unix seconds */
            auth_time: number;
            global: {
                permissions: components["schemas"]["PermissionKey"][];
                roles: components["schemas"]["RoleRef"][];
            };
            networks: components["schemas"]["MeNetwork"][];
            user: components["schemas"]["MeUser"];
        };
        Member: {
            email_masked: string;
            last_active_at: string | null;
            roles: {
                /** Format: date-time */
                granted_at: string;
                granted_by: components["schemas"]["UserRef"] | null;
                role: components["schemas"]["RoleRef"];
            }[];
            user: components["schemas"]["UserRef"];
        };
        MeNetwork: {
            city: components["schemas"]["CityRef"];
            id: number;
            name: string;
            permissions: components["schemas"]["PermissionKey"][];
            roles: components["schemas"]["RoleRef"][];
            slug: string;
        };
        MeUser: {
            avatar_initials: string;
            display_name: string;
            email_masked: string;
            id: string;
            locale: components["schemas"]["Locale"];
            username: string | null;
        };
        ModerationAction: {
            /** @enum {string} */
            action: "ban" | "unban" | "warn" | "note";
            active: boolean;
            /** Format: date-time */
            at: string;
            by: components["schemas"]["UserRef"] | null;
            id: string;
            private_reason: string | null;
            public_reason: string | null;
            until: string | null;
            user: components["schemas"]["UserRef"];
        };
        Network: {
            binding_count: number;
            city: components["schemas"]["CityRef"];
            id: number;
            name: string;
            operator: string | null;
            slug: string;
            timezone: string;
            /** @enum {string} */
            visibility: "hidden" | "public";
        };
        NetworkManifestDto: {
            attribution: {
                name: string;
                provider: string;
                url: string | null;
            }[];
            capabilities: {
                alerts: boolean;
                /** @constant */
                bike_share: false;
                card: {
                    balance: boolean;
                    history: boolean;
                    label: {
                        en: string;
                        tr: string;
                    };
                    number_format: string | null;
                    requires_provider_account: boolean;
                } | null;
                /** @enum {string} */
                realtime_departures: "none" | "estimated" | "live";
                realtime_vehicles: boolean;
                routes: boolean;
                shapes: boolean;
                stops: boolean;
                timetables: boolean;
                /** @constant */
                trip_planner: false;
                trip_updates: boolean;
            };
            city_id: number;
            colour: string | null;
            freshness: {
                realtime_feed_at: string | null;
                static_may_be_outdated: boolean;
                static_synced_at: string | null;
            };
            id: number;
            modes: ("tram" | "metro" | "rail" | "bus" | "ferry" | "cable_tram" | "aerial_lift" | "funicular" | "trolleybus" | "monorail")[];
            name: string;
            operator_name: string | null;
            /** @description Changes whenever the static data changes */
            pack_version: string | null;
            privacy: {
                provider: string;
                pulled_data: {
                    can_optout: boolean;
                    details: string;
                    is_collected: boolean;
                    key: string;
                }[];
            }[];
            slug: string;
            /** @enum {string} */
            status: "active" | "degraded" | "disabled";
            status_message: string | null;
        };
        NetworkOverview: {
            kpis: {
                median_feed_lag_s: number | null;
                open_issues: number;
                quality_score: number | null;
                routes_running: number | null;
                vehicles_now: number | null;
            };
            network: components["schemas"]["Network"];
        };
        NetworkRef: {
            id: number;
            name: string;
            slug: string;
        };
        PermissionInfo: {
            description: string;
            key: components["schemas"]["PermissionKey"];
            /** @enum {string} */
            scope: "global" | "network";
            sudo: boolean;
        };
        /** @enum {string} */
        PermissionKey: "system.health.read" | "system.config.read" | "ops.logs" | "users.read" | "users.pii.read" | "users.sessions.revoke" | "moderation.read" | "moderation.write" | "roles.read" | "roles.write" | "roles.assign" | "permissions.read" | "permissions.write" | "apps.read" | "apps.write" | "apps.secrets.rotate" | "networks.read.all" | "catalog.admin" | "providers.read" | "providers.kill" | "archive.read" | "archive.write" | "email.read" | "email.test.send" | "email.test.send.any" | "settings.read" | "settings.write" | "flags.write" | "jobs.read" | "jobs.run" | "audit.read" | "network.overview.read" | "vehicles.live.read" | "vehicles.history.read" | "tracker.read" | "tracker.control" | "tracker.config.write" | "catalog.read" | "catalog.write" | "catalog.sync" | "analytics.read" | "analytics.export" | "members.read" | "members.roles.write" | "support.read" | "support.reply";
        PermissionRegistryEntry: {
            description: string;
            /** Format: date-time */
            first_registered_at: string;
            key: string;
            /** Format: date-time */
            last_seen_at: string;
            orphaned_at: string | null;
            roles: components["schemas"]["RoleRef"][];
            routes: {
                method: string;
                path: string;
                sudo: boolean;
            }[];
            /** @enum {string} */
            scope: "global" | "network";
            sudo: boolean;
        };
        PollPageDto: {
            items: {
                accepted: number;
                binding_id: number;
                dropped: {
                    [key: string]: number;
                } | null;
                duration_ms: number;
                entities: number;
                error: string | null;
                feed_at: string | null;
                http_status: number | null;
                id: number;
                inserted: number;
                outcome: string;
                started_at: string;
                url_variant: ("primary" | "fallback") | null;
            }[];
            next_cursor: string | null;
            prev_cursor: string | null;
            total: number | null;
        };
        ProviderKillDto: {
            enabled: boolean;
            reason: string;
        };
        /** @description Columnar positions. Row i is vehicle vehicles[idx[i]] at start + t[i] seconds. */
        ReplayDto: {
            end: number;
            /** @description Poll gaps [from, to] in seconds after start */
            gaps: number[][];
            idx: number[];
            /** @description Microdegrees */
            lat: number[];
            /** @description Microdegrees */
            lon: number[];
            plates?: (string | null)[];
            /** @description Route id per vehicle */
            routes: (string | null)[];
            /** @description Unix seconds */
            start: number;
            /** @description Seconds after start */
            t: number[];
            vehicles: string[];
        };
        Role: {
            description: string;
            id: number;
            immutable: boolean;
            key: string;
            level: number;
            member_count: number;
            name: string;
            permission_count: number;
        };
        RoleAssignment: {
            /** Format: date-time */
            granted_at: string;
            granted_by: components["schemas"]["UserRef"] | null;
            network: components["schemas"]["NetworkRef"] | null;
            role: components["schemas"]["RoleRef"];
        };
        RoleDetail: {
            /** Format: date-time */
            created_at: string;
            description: string;
            id: number;
            immutable: boolean;
            key: string;
            level: number;
            member_count: number;
            members_by_network: {
                count: number;
                network: components["schemas"]["NetworkRef"] | null;
            }[];
            name: string;
            permission_count: number;
            permissions: components["schemas"]["PermissionKey"][];
            /** Format: date-time */
            updated_at: string;
        };
        RoleRef: {
            id: number;
            key: string;
            level: number;
            name: string;
        };
        RouteDetailDto: {
            agency: string | null;
            colour: string | null;
            directions: {
                direction: number;
                headsign: string | null;
                patterns: {
                    headsign: string;
                    id: string;
                    length_m: number;
                    stops: {
                        /** @description Stable public id, e.g. 1.41003 */
                        id: string;
                        lat: number;
                        lon: number;
                        name: string;
                        network_id: number;
                        offset_s: number | null;
                        seq: number;
                    }[];
                }[];
            }[];
            /** @description Stable public id, e.g. 1.42041 */
            id: string;
            long_name: string;
            /** @enum {string} */
            mode: "tram" | "metro" | "rail" | "bus" | "ferry" | "cable_tram" | "aerial_lift" | "funicular" | "trolleybus" | "monorail";
            network_id: number;
            route_type: number;
            short_name: string;
            text_colour: string | null;
        };
        RoutePageDto: {
            items: {
                agency: string | null;
                colour: string | null;
                /** @description Stable public id, e.g. 1.42041 */
                id: string;
                long_name: string;
                /** @enum {string} */
                mode: "tram" | "metro" | "rail" | "bus" | "ferry" | "cable_tram" | "aerial_lift" | "funicular" | "trolleybus" | "monorail";
                network_id: number;
                route_type: number;
                short_name: string;
                text_colour: string | null;
            }[];
            next_cursor: string | null;
            prev_cursor: string | null;
            total: number | null;
        };
        RouteShapeDto: {
            /** @constant */
            precision: 6;
            route_id: string;
            shapes: {
                direction: number;
                pattern_id: string;
                polyline: string;
            }[];
        };
        ScopeInfo: {
            description: {
                en: string;
                tr: string;
            };
            key: string;
            name: {
                en: string;
                tr: string;
            };
        };
        StopDetailDto: {
            code: string | null;
            /** @description Stable public id, e.g. 1.41003 */
            id: string;
            lat: number;
            lon: number;
            name: string;
            network_id: number;
            routes: {
                agency: string | null;
                colour: string | null;
                /** @description Stable public id, e.g. 1.42041 */
                id: string;
                long_name: string;
                /** @enum {string} */
                mode: "tram" | "metro" | "rail" | "bus" | "ferry" | "cable_tram" | "aerial_lift" | "funicular" | "trolleybus" | "monorail";
                network_id: number;
                route_type: number;
                short_name: string;
                text_colour: string | null;
            }[];
        };
        StopPageDto: {
            items: {
                code: string | null;
                /** @description Stable public id, e.g. 1.41003 */
                id: string;
                lat: number;
                lon: number;
                name: string;
                network_id: number;
            }[];
            next_cursor: string | null;
            prev_cursor: string | null;
            total: number | null;
        };
        SyncResultDto: {
            binding_id: number;
            counts: {
                [key: string]: number;
            };
            error: string | null;
            run_id: number;
            /** @enum {string} */
            status: "ok" | "unchanged" | "failed";
            version_id: number | null;
            warnings: string[];
        };
        SyncRunPageDto: {
            items: {
                binding_id: number;
                counts: {
                    [key: string]: number;
                } | null;
                error: string | null;
                finished_at: string | null;
                id: number;
                started_at: string;
                /** @enum {string} */
                status: "running" | "ok" | "unchanged" | "failed";
                trigger: string;
                version_id: number | null;
                warnings: string[] | null;
            }[];
            next_cursor: string | null;
            prev_cursor: string | null;
            total: number | null;
        };
        SystemHealth: {
            checks: components["schemas"]["HealthCheck"][];
            git_sha: string;
            /** @enum {string} */
            mode: "api" | "tracker" | "all";
            uptime_s: number;
            version: string;
        };
        TimetableDto: {
            date: string | null;
            /** @enum {string} */
            day_type: "weekday" | "saturday" | "sunday";
            patterns: {
                departures: {
                    headsign: string | null;
                    start: string;
                    start_s: number;
                    trip_id: string;
                }[];
                direction: number;
                headsign: string;
                id: string;
                stops: {
                    id: string;
                    name: string;
                    offset_s: number | null;
                }[];
            }[];
            route_id: string;
            service_labels: string[];
        };
        TrackerControlDto: {
            /** @enum {string} */
            action: "pause" | "resume" | "poll-now" | "reset-url" | "refresh-token";
            reason?: string;
        };
        TrackerGridDto: {
            bindings: {
                external_ref: string;
                network_id: number;
                network_name: string;
                network_slug: string;
                provider_key: string;
                status: {
                    binding_id: number;
                    consecutive_failures: number;
                    credentials: {
                        expires_at: string | null;
                        failures: number;
                        realm: string;
                        refreshed_at: string | null;
                        secrets_set: {
                            [key: string]: boolean;
                        };
                        /** @enum {string} */
                        state: "ok" | "missing" | "refreshing" | "auth_failed" | "unknown";
                    } | null;
                    interval_s: number | null;
                    last_feed_at: string | null;
                    last_outcome: string | null;
                    last_poll_at: string | null;
                    live_vehicles: number;
                    message: string | null;
                    next_poll_at: string | null;
                    /** @enum {string} */
                    state: "ok" | "degraded" | "down" | "paused" | "killed" | "unknown";
                    subscribers: number;
                    url_variant: ("primary" | "fallback") | null;
                };
            }[];
        };
        TrackerOverviewDto: {
            bindings: {
                binding_id: number;
                consecutive_failures: number;
                credentials: {
                    expires_at: string | null;
                    failures: number;
                    realm: string;
                    refreshed_at: string | null;
                    secrets_set: {
                        [key: string]: boolean;
                    };
                    /** @enum {string} */
                    state: "ok" | "missing" | "refreshing" | "auth_failed" | "unknown";
                } | null;
                interval_s: number | null;
                last_feed_at: string | null;
                last_outcome: string | null;
                last_poll_at: string | null;
                live_vehicles: number;
                message: string | null;
                next_poll_at: string | null;
                /** @enum {string} */
                state: "ok" | "degraded" | "down" | "paused" | "killed" | "unknown";
                subscribers: number;
                url_variant: ("primary" | "fallback") | null;
            }[];
            /** @enum {string} */
            runner: "worker" | "inline" | "manual" | "external" | "off";
            running: boolean;
        };
        UserPrivacy: {
            deletion: {
                /** Format: date-time */
                delete_after: string;
                /** Format: date-time */
                requested_at: string;
                /** @enum {string} */
                status: "scheduled" | "cancelled" | "completed";
            } | null;
            exports: {
                expires_at: string | null;
                id: string;
                ready_at: string | null;
                /** Format: date-time */
                requested_at: string;
                /** @enum {string} */
                status: "pending" | "ready" | "expired" | "failed";
            }[];
        };
        UserRef: {
            display_name: string;
            id: string;
            username: string | null;
        };
        UserSession: {
            app: {
                client_id: string;
                name: string;
            } | null;
            /** Format: date-time */
            created_at: string;
            device: string;
            /** Format: date-time */
            expires_at: string;
            id: string;
            ip_prefix: string | null;
            /** @enum {string} */
            kind: "sso" | "refresh";
            last_used_at: string | null;
        };
        /** @enum {string} */
        UserStatus: "active" | "unverified" | "banned" | "pending_deletion";
        VehicleDetailDto: {
            accessible: boolean | null;
            current_run: {
                direction: number | null;
                end_reason: string | null;
                ended_at: string | null;
                first_stop_seq: number | null;
                last_stop_seq: number | null;
                route_id: string | null;
                scheduled_start: string | null;
                start_delay_s: number | null;
                started_at: string;
                trip_id: string | null;
            } | null;
            direction: number | null;
            id: string;
            label: string | null;
            last_seen_at: string;
            live: boolean;
            network_id: number;
            plate: string | null;
            position: {
                bearing: number | null;
                feed_ts: number;
                lat: number;
                lon: number;
                speed_ms: number | null;
                stale: boolean;
                vehicle_ts: number;
            } | null;
            route: {
                agency: string | null;
                colour: string | null;
                /** @description Stable public id, e.g. 1.42041 */
                id: string;
                long_name: string;
                /** @enum {string} */
                mode: "tram" | "metro" | "rail" | "bus" | "ferry" | "cable_tram" | "aerial_lift" | "funicular" | "trolleybus" | "monorail";
                network_id: number;
                route_type: number;
                short_name: string;
                text_colour: string | null;
            } | null;
            runs_today: {
                direction: number | null;
                end_reason: string | null;
                ended_at: string | null;
                first_stop_seq: number | null;
                last_stop_seq: number | null;
                route_id: string | null;
                scheduled_start: string | null;
                start_delay_s: number | null;
                started_at: string;
                trip_id: string | null;
            }[];
            stop_id: string | null;
            stop_seq: number | null;
            trip_id: string | null;
        };
        VehicleSnapshotDto: {
            /** @description Unix seconds of the newest poll */
            feed_ts: number | null;
            fields: string[];
            message: string | null;
            network_id: number;
            /** @enum {string} */
            status: "active" | "degraded" | "disabled";
            vehicles: (string | number | null)[][];
        };
        VehicleTrackDto: {
            /** @description Today's duty span start */
            first_seen_at: string | null;
            last_seen_at: string | null;
            lat: number[];
            lon: number[];
            speed_ms: (number | null)[];
            /** @description Unix seconds */
            t: number[];
            vehicle_id: string;
        };
        WsClientMessage: {
            token: string;
            /** @constant */
            type: "auth";
        } | {
            /** @enum {string} */
            channel: "vehicles" | "departures" | "tracker.status" | "tracker.logs";
            id: string;
            /** @default {} */
            params: {
                [key: string]: unknown;
            };
            /** @constant */
            type: "subscribe";
        } | {
            id: string;
            /** @constant */
            type: "unsubscribe";
        } | {
            t?: number;
            /** @constant */
            type: "ping";
        } | {
            t?: number;
            /** @constant */
            type: "pong";
        };
        WsDeparturesParams: {
            /** @default 10 */
            limit: number;
            stop: string;
        };
        WsServerMessage: {
            heartbeat_s: number;
            limits: {
                max_bbox_span_deg: number;
                max_routes_per_sub: number;
                max_subs: number;
            };
            /** @constant */
            type: "hello";
            /** @constant */
            v: 1;
        } | {
            exp: number;
            /** @constant */
            type: "auth_ok";
        } | {
            feed_ts: number | null;
            fields: string[];
            seq: number;
            sub: string;
            /** @constant */
            type: "snapshot";
            vehicles: (string | number | null)[][];
        } | {
            feed_ts: number | null;
            remove: string[];
            seq: number;
            sub: string;
            /** @constant */
            type: "delta";
            upsert: (string | number | null)[][];
        } | {
            generated_at: string;
            items: {
                cancelled: boolean;
                headsign: string | null;
                predicted_at: string | null;
                route: {
                    agency: string | null;
                    colour: string | null;
                    /** @description Stable public id, e.g. 1.42041 */
                    id: string;
                    long_name: string;
                    /** @enum {string} */
                    mode: "tram" | "metro" | "rail" | "bus" | "ferry" | "cable_tram" | "aerial_lift" | "funicular" | "trolleybus" | "monorail";
                    network_id: number;
                    route_type: number;
                    short_name: string;
                    text_colour: string | null;
                };
                scheduled_at: string | null;
                /** @enum {string} */
                source: "schedule" | "live" | "live_eta";
                stops_away: number | null;
                trip_id: string | null;
                vehicle_id: string | null;
            }[];
            seq: number;
            stop: string;
            sub: string;
            /** @constant */
            type: "departures";
        } | {
            binding: number;
            message?: string | null;
            network: number;
            seq: number;
            /** @enum {string} */
            state: "ok" | "degraded" | "down" | "paused" | "killed" | "unknown";
            sub: string;
            /** @constant */
            type: "status";
        } | {
            data: unknown;
            seq: number;
            sub: string;
            /** @constant */
            type: "event";
        } | {
            code: string;
            id?: string;
            message: string;
            /** @constant */
            type: "error";
        } | {
            t: number;
            /** @constant */
            type: "ping";
        } | {
            t?: number;
            /** @constant */
            type: "pong";
        };
        WsVehiclesParams: {
            /** @description [west, south, east, north] */
            bbox?: [
                number,
                number,
                number,
                number
            ];
            /**
             * @default compact
             * @enum {string}
             */
            detail: "compact" | "full";
            direction?: 0 | 1;
            network: string | number;
            routes?: string[];
        };
    };
    responses: {
        /** @description Error envelope */
        Error: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorEnvelope"];
            };
        };
    };
    parameters: {
        Cursor: string;
        Limit: number;
        Q: string;
        /** @description Comma list of field:asc|desc */
        Sort: string;
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    listApps: {
        parameters: {
            query?: {
                cursor?: components["parameters"]["Cursor"];
                limit?: components["parameters"]["Limit"];
                q?: components["parameters"]["Q"];
                /** @description Comma list of field:asc|desc */
                sort?: components["parameters"]["Sort"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["AppListItem"][];
                            next_cursor: string | null;
                            prev_cursor: string | null;
                            total: number | null;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    createApp: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    description: string;
                    homepage_url: string | null;
                    name: string;
                    platform: components["schemas"]["AppPlatform"];
                    redirect_uris: string[];
                    type: components["schemas"]["AppType"];
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            app: components["schemas"]["AppDetail"];
                            secret: string | null;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    getApp: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description OAuth client_id */
                appId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["AppDetail"];
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    updateApp: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description OAuth client_id */
                appId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    access_ttl_s?: number;
                    description?: string;
                    first_party?: boolean;
                    homepage_url?: string | null;
                    logo_url?: string | null;
                    name?: string;
                    redirect_uris?: string[];
                    refresh_max_s?: number;
                    refresh_ttl_s?: number;
                    scopes?: string[];
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["AppDetail"];
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    revokeAllAppTokens: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description OAuth client_id */
                appId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    reason: string;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            revoked: number;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    rotateAppSecret: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description OAuth client_id */
                appId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @enum {string} */
                    grace: "none" | "24h" | "7d";
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            meta: components["schemas"]["AppSecret"];
                            secret: string;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    revokePreviousAppSecret: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description OAuth client_id */
                appId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            revoked: boolean;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    listAudit: {
        parameters: {
            query?: {
                action?: string;
                actor?: string;
                cursor?: components["parameters"]["Cursor"];
                from?: string;
                limit?: components["parameters"]["Limit"];
                network_id?: number;
                q?: components["parameters"]["Q"];
                /** @description Comma list of field:asc|desc */
                sort?: components["parameters"]["Sort"];
                target_id?: string;
                target_type?: string;
                to?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["AuditEntry"][];
                            next_cursor: string | null;
                            prev_cursor: string | null;
                            total: number | null;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    Networks_cities: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["DashCityDto"][];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listEmailDeliveries: {
        parameters: {
            query?: {
                cursor?: components["parameters"]["Cursor"];
                limit?: components["parameters"]["Limit"];
                q?: components["parameters"]["Q"];
                /** @description Comma list of field:asc|desc */
                sort?: components["parameters"]["Sort"];
                status?: components["schemas"]["EmailStatus"];
                template?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["EmailDelivery"][];
                            next_cursor: string | null;
                            prev_cursor: string | null;
                            total: number | null;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    listEmailSuppressions: {
        parameters: {
            query?: {
                cursor?: components["parameters"]["Cursor"];
                limit?: components["parameters"]["Limit"];
                q?: components["parameters"]["Q"];
                /** @description Comma list of field:asc|desc */
                sort?: components["parameters"]["Sort"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["EmailSuppression"][];
                            next_cursor: string | null;
                            prev_cursor: string | null;
                            total: number | null;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    deleteEmailSuppression: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    reason: string;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            deleted: boolean;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    listEmailTemplates: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["EmailTemplate"][];
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    previewEmailTemplate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    locale: components["schemas"]["Locale"];
                    variables: {
                        [key: string]: string;
                    };
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            html: string;
                            subject: string;
                            text: string;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    sendTestEmail: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    locale: components["schemas"]["Locale"];
                    template: string;
                    /** Format: email */
                    to?: string;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            delivery_id: string;
                            to_masked: string;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    listModeration: {
        parameters: {
            query?: {
                action?: "ban" | "unban" | "warn" | "note";
                /** @description Only bans still in force */
                active?: boolean;
                cursor?: components["parameters"]["Cursor"];
                limit?: components["parameters"]["Limit"];
                q?: components["parameters"]["Q"];
                /** @description Comma list of field:asc|desc */
                sort?: components["parameters"]["Sort"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["ModerationAction"][];
                            next_cursor: string | null;
                            prev_cursor: string | null;
                            total: number | null;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    listNetworks: {
        parameters: {
            query?: {
                city?: string;
                cursor?: components["parameters"]["Cursor"];
                limit?: components["parameters"]["Limit"];
                q?: components["parameters"]["Q"];
                /** @description Comma list of field:asc|desc */
                sort?: components["parameters"]["Sort"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["Network"][];
                            next_cursor: string | null;
                            prev_cursor: string | null;
                            total: number | null;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    getNetwork: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Network slug or numeric id */
                networkId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["Network"];
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    Analytics_metric: {
        parameters: {
            query?: {
                compare?: "previous" | "last_week";
                /** @description headways.marey */
                date?: string;
                day_type?: "all" | "weekday" | "saturday" | "sunday";
                direction?: 0 | 1;
                /** @description First day (network timezone), inclusive */
                from?: string;
                /** @description fleet.hourly */
                granularity?: "5m" | "1h" | "1d";
                /** @description speed.heatmap */
                hour?: number;
                hour_from?: number;
                hour_to?: number;
                /** @description speed.heatmap */
                res?: number;
                /** @description runs.runtime, headways.marey */
                route_id?: string;
                /** @description Comma separated stable route ids */
                routes?: string;
                /** @description dwell.stops */
                stop_id?: string;
                /** @description Last day (network timezone), inclusive; at most 90 days after from */
                to?: string;
            };
            header?: never;
            path: {
                metric: components["schemas"]["AnalyticsMetric"];
                networkId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["AnalyticsResultDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    Analytics_export: {
        parameters: {
            query?: {
                compare?: "previous" | "last_week";
                /** @description headways.marey */
                date?: string;
                day_type?: "all" | "weekday" | "saturday" | "sunday";
                direction?: 0 | 1;
                format?: "csv" | "parquet";
                /** @description First day (network timezone), inclusive */
                from?: string;
                /** @description fleet.hourly */
                granularity?: "5m" | "1h" | "1d";
                /** @description speed.heatmap */
                hour?: number;
                hour_from?: number;
                hour_to?: number;
                /** @description speed.heatmap */
                res?: number;
                /** @description runs.runtime, headways.marey */
                route_id?: string;
                /** @description Comma separated stable route ids */
                routes?: string;
                /** @description dwell.stops */
                stop_id?: string;
                /** @description Last day (network timezone), inclusive; at most 90 days after from */
                to?: string;
            };
            header?: never;
            path: {
                metric: components["schemas"]["AnalyticsMetric"];
                networkId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description File stream */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.apache.parquet": string;
                    "text/csv": string;
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listNetworkAudit: {
        parameters: {
            query?: {
                action?: string;
                actor?: string;
                cursor?: components["parameters"]["Cursor"];
                from?: string;
                limit?: components["parameters"]["Limit"];
                q?: components["parameters"]["Q"];
                /** @description Comma list of field:asc|desc */
                sort?: components["parameters"]["Sort"];
                target_id?: string;
                target_type?: string;
                to?: string;
            };
            header?: never;
            path: {
                /** @description Network slug or numeric id */
                networkId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["AuditEntry"][];
                            next_cursor: string | null;
                            prev_cursor: string | null;
                            total: number | null;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    Networks_bindings: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                networkId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["DashBindingDto"][];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    Networks_binding: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                bindingId: string;
                networkId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["DashBindingDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    TrackerAdmin_config: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                bindingId: string;
                networkId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BindingConfigPatchDto"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["DashBindingDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    TrackerAdmin_control: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                bindingId: string;
                networkId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TrackerControlDto"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["ControlResultDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    TrackerAdmin_polls: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
            };
            header?: never;
            path: {
                bindingId: string;
                networkId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["PollPageDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    TrackerAdmin_series: {
        parameters: {
            query?: {
                bucket?: "5m" | "15m" | "1h";
                from?: string;
                to?: string;
            };
            header?: never;
            path: {
                bindingId: string;
                networkId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["BindingSeriesDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    TrackerAdmin_stats: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                bindingId: string;
                networkId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["BindingStatsDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    TransitAdmin_run: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                bindingId: string;
                networkId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["SyncResultDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    Catalog_issues: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
                q?: string;
                severity?: components["schemas"]["IssueSeverity"];
                sort?: string;
                status?: components["schemas"]["IssueStatus"];
                type?: components["schemas"]["IssueType"];
            };
            header?: never;
            path: {
                networkId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["IssuePageDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    Catalog_issuesUpdate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                networkId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IssueUpdateDto"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["IssueUpdateResultDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listMembers: {
        parameters: {
            query?: {
                cursor?: components["parameters"]["Cursor"];
                limit?: components["parameters"]["Limit"];
                q?: components["parameters"]["Q"];
                role?: string;
                /** @description Comma list of field:asc|desc */
                sort?: components["parameters"]["Sort"];
            };
            header?: never;
            path: {
                /** @description Network slug or numeric id */
                networkId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["Member"][];
                            next_cursor: string | null;
                            prev_cursor: string | null;
                            total: number | null;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    assignNetworkRoles: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Network slug or numeric id */
                networkId: string;
                /** @description User public ULID */
                userId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    operations: {
                        /** @enum {string} */
                        op: "grant" | "revoke";
                        role_id: number;
                    }[];
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            results: {
                                error_code: components["schemas"]["ErrorCode"] | null;
                                ok: boolean;
                                /** @enum {string} */
                                op: "grant" | "revoke";
                                role_id: number;
                            }[];
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    listAssignableRoles: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Network slug or numeric id */
                networkId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["RoleRef"][];
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    searchMemberCandidates: {
        parameters: {
            query: {
                q: string;
            };
            header?: never;
            path: {
                /** @description Network slug or numeric id */
                networkId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["UserRef"][];
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    getNetworkOverview: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Network slug or numeric id */
                networkId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["NetworkOverview"];
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    Vehicles_replay: {
        parameters: {
            query?: {
                from?: string;
                routes?: string;
                to?: string;
            };
            header?: never;
            path: {
                networkId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["ReplayDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    TransitAdmin_runs: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
            };
            header?: never;
            path: {
                networkId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["SyncRunPageDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    TrackerAdmin_overview: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                networkId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["TrackerOverviewDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    Vehicles_track: {
        parameters: {
            query?: {
                /** @description Seconds back, default 3600 */
                since?: number;
            };
            header?: never;
            path: {
                networkId: string;
                vehicleId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["VehicleTrackDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    getDashOverview: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["DashOverview"];
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    listPermissions: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["PermissionInfo"][];
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    deletePermission: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            deleted: boolean;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    getPermissionRegistry: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["PermissionRegistryEntry"][];
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    Networks_providers: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["DashProviderDto"][];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    Networks_provider: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["DashProviderDetailDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    Networks_kill: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProviderKillDto"];
            };
        };
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["DashProviderDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listRoles: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["Role"][];
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    createRole: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    description: string;
                    key: string;
                    level: number;
                    name: string;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["Role"];
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    getRole: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                roleId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["RoleDetail"];
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    updateRole: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                roleId: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    description?: string;
                    level?: number;
                    name?: string;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["Role"];
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    getPermissionMatrix: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            grants: {
                                permissions: components["schemas"]["PermissionKey"][];
                                role_id: number;
                            }[];
                            permissions: components["schemas"]["PermissionInfo"][];
                            roles: components["schemas"]["Role"][];
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    batchRolePermissions: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    operations: {
                        /** @enum {string} */
                        op: "grant" | "revoke";
                        permission_key: components["schemas"]["PermissionKey"];
                        role_id: number;
                    }[];
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            results: {
                                error_code: components["schemas"]["ErrorCode"] | null;
                                ok: boolean;
                                /** @enum {string} */
                                op: "grant" | "revoke";
                                permission_key: components["schemas"]["PermissionKey"];
                                role_id: number;
                            }[];
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    getSystemHealth: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["SystemHealth"];
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    TrackerAdmin_status: {
        parameters: {
            query?: {
                /** @description Network slug or id; omitted: every network */
                network?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["TrackerGridDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listUsers: {
        parameters: {
            query?: {
                cursor?: components["parameters"]["Cursor"];
                from?: string;
                limit?: components["parameters"]["Limit"];
                network_id?: number;
                q?: components["parameters"]["Q"];
                role?: string;
                /** @description Comma list of field:asc|desc */
                sort?: components["parameters"]["Sort"];
                status?: components["schemas"]["UserStatus"];
                to?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["DashUserListItem"][];
                            next_cursor: string | null;
                            prev_cursor: string | null;
                            total: number | null;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    getUser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description User public ULID */
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["DashUser"];
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    listUserActivity: {
        parameters: {
            query?: {
                cursor?: components["parameters"]["Cursor"];
                limit?: components["parameters"]["Limit"];
                q?: components["parameters"]["Q"];
                /** @description Comma list of field:asc|desc */
                sort?: components["parameters"]["Sort"];
            };
            header?: never;
            path: {
                /** @description User public ULID */
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["AuditEntry"][];
                            next_cursor: string | null;
                            prev_cursor: string | null;
                            total: number | null;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    banUser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description User public ULID */
                userId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @enum {string} */
                    duration: "1d" | "7d" | "30d" | "permanent";
                    private_reason?: string;
                    public_reason: string;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["Ban"];
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    listUserEmails: {
        parameters: {
            query?: {
                cursor?: components["parameters"]["Cursor"];
                limit?: components["parameters"]["Limit"];
                q?: components["parameters"]["Q"];
                /** @description Comma list of field:asc|desc */
                sort?: components["parameters"]["Sort"];
            };
            header?: never;
            path: {
                /** @description User public ULID */
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            items: components["schemas"]["EmailDelivery"][];
                            next_cursor: string | null;
                            prev_cursor: string | null;
                            total: number | null;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    getUserPrivacy: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description User public ULID */
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["UserPrivacy"];
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    revealUserEmail: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description User public ULID */
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            /** Format: email */
                            email: string;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    assignGlobalRoles: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description User public ULID */
                userId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    operations: {
                        /** @enum {string} */
                        op: "grant" | "revoke";
                        role_id: number;
                    }[];
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            results: {
                                error_code: components["schemas"]["ErrorCode"] | null;
                                ok: boolean;
                                /** @enum {string} */
                                op: "grant" | "revoke";
                                role_id: number;
                            }[];
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    listUserSessions: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description User public ULID */
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["UserSession"][];
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    revokeUserSession: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                sessionId: string;
                /** @description User public ULID */
                userId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    reason: string;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            revoked: number;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    revokeAllUserSessions: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description User public ULID */
                userId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    reason: string;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            revoked: number;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    unbanUser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description User public ULID */
                userId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    reason: string;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            unbanned: boolean;
                        };
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    getMe: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["Me"];
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    patchMe: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    display_name?: string;
                    locale?: components["schemas"]["Locale"];
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["MeUser"];
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    Cities_network: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                networkId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description One network's slice of the city manifest */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["NetworkManifestDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    Transit_routes: {
        parameters: {
            query?: {
                cursor?: string;
                limit?: number;
                q?: string;
                type?: number;
            };
            header?: never;
            path: {
                networkId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Routes of a network (pagination when limit is set) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["RoutePageDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    Transit_stops: {
        parameters: {
            query?: {
                bbox?: string;
                cursor?: string;
                limit?: number;
                q?: string;
                sort?: string;
            };
            header?: never;
            path: {
                networkId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Stops of a network, optionally inside a bbox */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["StopPageDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    Vehicles_snapshot: {
        parameters: {
            query?: {
                /** @description w,s,e,n; max 0.5 degree span, snapped to z12 tiles */
                bbox?: string;
                direction?: number;
                /** @description Comma separated stable route ids (max 12) */
                routes?: string;
            };
            header?: never;
            path: {
                networkId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Live vehicles as compact arrays in the order of `fields` (same as the WS snapshot) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["VehicleSnapshotDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listScopes: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["ScopeInfo"][];
                        /** @constant */
                        ok: true;
                    };
                };
            };
            400: components["responses"]["Error"];
            401: components["responses"]["Error"];
            403: components["responses"]["Error"];
            404: components["responses"]["Error"];
            409: components["responses"]["Error"];
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
    Transit_route: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                routeId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["RouteDetailDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    Transit_shape: {
        parameters: {
            query?: {
                direction?: number;
            };
            header?: never;
            path: {
                routeId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Encoded polylines (precision 6) per direction */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["RouteShapeDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    Transit_timetable: {
        parameters: {
            query?: {
                date?: string;
                day_type?: "weekday" | "saturday" | "sunday";
                direction?: number;
            };
            header?: never;
            path: {
                routeId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Timetable for a date or a day type */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["TimetableDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    Transit_stop: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                stopId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Success */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["StopDetailDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    Vehicles_departures: {
        parameters: {
            query?: {
                limit?: number;
            };
            header?: never;
            path: {
                stopId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Scheduled departures merged with live vehicles */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["DeparturesDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    Vehicles_vehicle: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vehicleId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Live state, current run and runs today */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: components["schemas"]["VehicleDetailDto"];
                        /** @enum {boolean} */
                        ok: true;
                    };
                };
            };
            /** @description Error envelope */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
}
