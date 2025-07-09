import { useQuery } from "@tanstack/react-query";
import { useGezcezStore } from "../../stores/GezcezAuthStore";

export function useGetPermissions() {
	const access_token = useGezcezStore((state) => state.access_token)
	return useQuery({
		queryKey: ["get_permissions", access_token],
		queryFn: async () => {

		}
	})
}