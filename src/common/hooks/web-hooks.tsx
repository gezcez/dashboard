import { useQuery } from "@tanstack/react-query"
import { useGezcezStore } from "../stores/gezcez-auth-store"
import { makeGezcezRequest } from "../utils/master"
import { API_URL } from "../constants"

export function useGetNetworks() {
	return useQuery({
		queryKey: ["get_networks"],
		queryFn: async () => {
			const [data, request] = await makeGezcezRequest(`${API_URL}/web/networks/list`)
			return data
		},
	})
}