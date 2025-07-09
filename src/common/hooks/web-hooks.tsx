import { useQuery } from "@tanstack/react-query"
import { useGezcezStore } from "../stores/gezcez-auth-store"
import { makeGezcezRequest } from "../utils/master"
import { API_URL } from "../constants"

export function useGetNetworks() {
	// const access_token = useGezcezStore((state) => state.access_token)
	return useQuery({
		queryKey: ["get_networks"],
		queryFn: async () => {
			const [data, request] = await makeGezcezRequest(`${API_URL}/web/networks/list`)
			return data
		},
	})
}