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
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** @enum {string} */
        Amr: "otp" | "pwd" | "webauthn";
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
        CityRef: {
            id: number;
            name: string;
            slug: string;
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
        SystemHealth: {
            checks: components["schemas"]["HealthCheck"][];
            git_sha: string;
            /** @enum {string} */
            mode: "api" | "tracker" | "all";
            uptime_s: number;
            version: string;
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
}
