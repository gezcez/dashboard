import { API_URL } from "@/common/constants"
import { useGezcezStore } from "@/common/stores/gezcez-auth-store"
import { makeGezcezRequest } from "@/common/utils/master"
import { useQuery } from "@tanstack/react-query"


export function useGetAllRoles() {
	const access_token = useGezcezStore((state) => state.access_token)
	const network_id = useGezcezStore((state) => state.network_id)
	return useQuery({
		queryKey: ["list_roles",network_id, access_token],
		queryFn: async () => {
			const [data, request] = await makeGezcezRequest(`${API_URL}/dashboard/${network_id}/list-roles`)
			return data
		},
		staleTime:60*1000
	})
}

export function useGetUserInfoFromID(user_id:number) {
	const access_token = useGezcezStore((state) => state.access_token)
	const network_id = useGezcezStore((state) => state.network_id)
	return useQuery({
		queryKey: ["get_user_info_from_id",user_id,network_id, access_token],
		queryFn: async () => {
			const [data, request] = await makeGezcezRequest(`${API_URL}/dashboard/${network_id}/get-user-info?user_id=${user_id}`)
			return data
		},
		staleTime:60*1000
	})
}