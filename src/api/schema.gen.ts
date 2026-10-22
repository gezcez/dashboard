/**
 * GENERATED FILE, DO NOT EDIT. Run `bun run api:gen` to regenerate.
 * Source: openapi/stub.openapi.json
 * Spec: gezcez API (STUB) 0.0.0-stub
 * STUB: generated from the hand-written openapi/stub.openapi.json. Regenerate against the
 * backend's published openapi.json as soon as it exists, then delete the stub.
 */
export interface paths {
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
    "/v1/dash/roles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listRoles"];
        put?: never;
        post?: never;
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
        /** @enum {string} */
        PermissionKey: "system.health.read" | "system.config.read" | "ops.logs" | "users.read" | "users.pii.read" | "users.sessions.revoke" | "moderation.read" | "moderation.write" | "roles.read" | "roles.write" | "roles.assign" | "permissions.read" | "permissions.write" | "apps.read" | "apps.write" | "apps.secrets.rotate" | "networks.read.all" | "catalog.admin" | "providers.read" | "providers.kill" | "archive.read" | "archive.write" | "email.read" | "email.test.send" | "email.test.send.any" | "settings.read" | "settings.write" | "flags.write" | "jobs.read" | "jobs.run" | "audit.read" | "network.overview.read" | "vehicles.live.read" | "vehicles.history.read" | "tracker.read" | "tracker.control" | "tracker.config.write" | "catalog.read" | "catalog.write" | "catalog.sync" | "analytics.read" | "analytics.export" | "members.read" | "members.roles.write" | "support.read" | "support.reply";
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
        RoleRef: {
            id: number;
            key: string;
            level: number;
            name: string;
        };
        SystemHealth: {
            checks: components["schemas"]["HealthCheck"][];
            git_sha: string;
            /** @enum {string} */
            mode: "api" | "tracker" | "all";
            uptime_s: number;
            version: string;
        };
        UserRef: {
            display_name: string;
            id: string;
            username: string | null;
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
            429: components["responses"]["Error"];
            500: components["responses"]["Error"];
        };
    };
}
