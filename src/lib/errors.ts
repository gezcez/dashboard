import { isErrorCode, type GezcezApiError } from "@/api/envelope"
import { i18n } from "@/i18n"

/** Translated message for an API error (errors namespace); unknown codes fall back to the status. */
export function apiErrorMessage(error: GezcezApiError): string {
  const t = i18n.getFixedT(null, "errors")
  if (error.code === "NETWORK") return t("_network")
  if (isErrorCode(error.code)) return t(error.code)
  return t("_unknown", { code: String(error.status) })
}
