import { useQueryErrorResetBoundary } from "@tanstack/react-query"
import { useRouter, type ErrorComponentProps } from "@tanstack/react-router"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { isApiError } from "@/api/envelope"
import { isAuthError } from "@/auth/errors"
import { ForbiddenError } from "@/lib/permissions"
import { apiErrorMessage } from "@/lib/errors"
import { ErrorState, ForbiddenState, NotFoundState } from "./states"

/** Default route error: 403 for permission problems, 404 for NOT_FOUND, else a retryable error. */
export function RouteError({ error }: ErrorComponentProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const queryReset = useQueryErrorResetBoundary()
  useEffect(() => queryReset.reset(), [queryReset])

  if (error instanceof ForbiddenError) {
    return <ForbiddenState permission={error.permission} network={error.networkName} />
  }
  if (isApiError(error, "PERMISSION_MISSING")) {
    return <ForbiddenState permission={error.permission ?? "?"} />
  }
  if (isApiError(error, "NOT_FOUND")) return <NotFoundState />
  const retry = () => void router.invalidate()
  if (isApiError(error)) {
    return (
      <ErrorState message={apiErrorMessage(error)} requestId={error.requestId} onRetry={retry} />
    )
  }
  if (isAuthError(error, "network"))
    return <ErrorState message={t("_network", { ns: "errors" })} onRetry={retry} />
  return <ErrorState onRetry={retry} />
}
