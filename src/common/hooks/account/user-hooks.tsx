import { useQuery } from "@tanstack/react-query"
import { useGezcezStore } from "../../stores/GezcezAuthStore"
import { fetchJSON, makeGezcezRequest } from "../../utils/master"
import { API_URL } from "../../constants"

export function useGetAccessToken() {
	const refresh_token = useGezcezStore((state) => state.refresh_token)
	const set_access_token = useGezcezStore((state) => state.setAccessToken)
	return useQuery({
		queryKey: ["get_access_token", refresh_token],
		queryFn: async () => {
			const [data, request] = await makeGezcezRequest(`${API_URL}/oauth/account/access`, {
				body: JSON.stringify({
					app_key: "dashboard"
				})
			},true)
			set_access_token(data.token)
			return data
		},
		refetchInterval: 3 * 60 * 1000
	})
}

export function useGetAccountMe() {
	const access_token = useGezcezStore((state) => state.access_token)
	return useQuery({
		queryKey: ["get_account_me", access_token],
		queryFn: async () => {
			const [data, request] = await makeGezcezRequest(`${API_URL}/shared/account/me`)
			return data
		},
	})
}