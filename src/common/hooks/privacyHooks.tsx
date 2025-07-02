import { useQuery } from "@tanstack/react-query";
import { API_URL } from "../constants";

export function useGetProviders() {
	return useQuery({
		queryKey:["get-providers"],
		queryFn:async ()=>{
			const request = await fetch(`${API_URL}/privacy/providers`)
			return await request.json()
		}
	})
}