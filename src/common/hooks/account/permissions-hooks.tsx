import { useQuery } from "@tanstack/react-query";
import { useGezcezStore } from "../../stores/gezcez-auth-store";
import { API_URL } from "@/common/constants";
import { makeGezcezRequest } from "@/common/utils/master";

export function useGetPermissions() {
	return useQuery({
		queryKey: ["get_permissions"],
		queryFn: async () => {
			const [data, request] = await makeGezcezRequest(`${API_URL}/shared/account/list-permissions`)
			return data
		},
	})
}