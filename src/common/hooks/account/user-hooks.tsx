import { useQuery } from "@tanstack/react-query"
import { useGezcezStore } from "../../stores/gezcez-auth-store"
import { fetchJSON, makeGezcezRequest } from "../../utils/master"
import { API_URL, ENV } from "../../constants"

export function useGetAccessToken() {
	const refresh_token = useGezcezStore((state) => state.refresh_token)
	const set_access_token = useGezcezStore((state) => state.setAccessToken)
	return useQuery({
		queryKey: ["get_access_token", refresh_token],
		queryFn: async () => {
			const [data, request] = await makeGezcezRequest(
				`${API_URL}/oauth/account/access`,
				{
					body: JSON.stringify({
						app_key: ENV === "production" ? "dashboard" : "dashboard_dev"
					})
				},
				true
			)
			set_access_token(data.token)
			return data
		},
		refetchInterval: 3 * 60 * 1000,
		staleTime: 60 * 1000
	})
}

export function useGetAccountMe() {
	return useQuery({
		queryKey: ["get_account_me"],
		queryFn: async () => {
			const [data, request] = await makeGezcezRequest(
				`${API_URL}/shared/account/me`
			)
			return data
		}
	})
}
export function useGetAccountRoles() {
	return useQuery({
		queryKey: ["get_account_roles"],
		queryFn: async () => {
			const [data, request] = await makeGezcezRequest(
				`${API_URL}/shared/account/list-roles`
			)
			return data
		},
		staleTime: 5 * 1000
	})
}
export function useGetMyNetworks() {
	const access_token = useGezcezStore((state) => state.access_token)
	return useQuery({
		queryKey: ["get_my_networks",access_token],
		queryFn: async () => {
			const [data, request] = await makeGezcezRequest(
				`${API_URL}/dashboard/account/list-networks`
			)
			return data
		}
	})
}

export function useGetMyPages() {
	const network_id = useGezcezStore((state) => state.network_id)
	const access_token = useGezcezStore((state) => state.access_token)
	return useQuery({
		queryKey: ["get_my_networks", network_id,access_token],
		queryFn: async () => {
			const [data, request] = await makeGezcezRequest(
				`${API_URL}/dashboard/${network_id}/get-page-buttons`
			)
			return data
		},
		staleTime: 60 * 1000
	})
}
