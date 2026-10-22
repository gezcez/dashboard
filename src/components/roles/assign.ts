import { GezcezApiError } from "@/api/envelope"
import { callApi } from "@/lib/api"

export type RoleOp = { role_id: number; op: "grant" | "revoke" }

/**
 * Grants or revokes roles for one user in one scope. Global roles go through the sudo-guarded
 * `POST /users/{id}/roles` (roles.assign); network roles through the members endpoint
 * (members.roles.write in that network). Both answer per operation; the first failure is thrown
 * as an API error so callers show one message and roll back.
 */
export async function assignRoles(
  sudo: <T>(action: () => Promise<T>) => Promise<T>,
  userId: string,
  network: { id: number } | null,
  operations: RoleOp[],
) {
  const { results } = network
    ? await callApi("post", "/v1/dash/networks/{networkId}/members/{userId}/roles", {
        params: { path: { networkId: String(network.id), userId } },
        body: { operations },
      })
    : await sudo(() =>
        callApi("post", "/v1/dash/users/{userId}/roles", {
          params: { path: { userId } },
          body: { operations },
        }),
      )
  const failed = results.find((r) => !r.ok)
  if (failed) {
    throw new GezcezApiError({
      code: failed.error_code ?? "INTERNAL",
      message: `role ${failed.op} failed`,
      status: 403,
      requestId: null,
      details: {},
    })
  }
  return results
}
