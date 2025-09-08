import { API_URL } from "@/common/constants"
import { useGezcezStore } from "@/common/stores/gezcez-auth-store"
import { makeGezcezRequest } from "@/common/utils/master"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

export function useGetAllRoles() {
	const access_token = useGezcezStore((state) => state.access_token)
	const network_id = useGezcezStore((state) => state.network_id)
	return useQuery({
		queryKey: ["list_all_roles", network_id, access_token],
		queryFn: async () => {
			const [data, request] = await makeGezcezRequest(`${API_URL}/dashboard/${network_id}/roles/list-all`)
			return data
		},
		staleTime: 60 * 1000,
	})
}

export function useGetRolePermissionMatrix(filter_roles?: number[]) {
	const access_token = useGezcezStore((state) => state.access_token)
	const network_id = useGezcezStore((state) => state.network_id)
	return useQuery({
		queryKey: ["get_roles_permissions_matrix", network_id, access_token, `roles-${filter_roles}`],
		queryFn: async () => {
			const [data, request] = await makeGezcezRequest(
				`${API_URL}/dashboard/${network_id}/roles/get-permission-matrix?role_ids=${filter_roles?.join(",")}`
			)
			return data
		}
	})
}

export function useGetUserInfoFromID(user_id: number) {
	const access_token = useGezcezStore((state) => state.access_token)
	const network_id = useGezcezStore((state) => state.network_id)
	return useQuery({
		queryKey: ["get_user_info_from_id", user_id||0	, network_id||"?", access_token],
		queryFn: async () => {
			if (!user_id || isNaN(user_id)) return {}
			const [data, request] = await makeGezcezRequest(
				`${API_URL}/dashboard/${network_id}/get-user-info?user_id=${user_id}`
			)
			return data
		},
		staleTime: 60 * 1000,
	})
}


export function mutateRolePermissions() {
	
	const access_token = useGezcezStore((state) => state.access_token)
	return useMutation({
		mutationKey:["write-role-permissions"],
		mutationFn:async (vars:{role_id:number,permissions:{permission_id:number,operation_type:"add"|"remove"}[]})=>{
			const {permissions,role_id} = vars
			if (!role_id || isNaN(role_id) || !permissions ||!permissions.length) return {}
			const [data, request] = await makeGezcezRequest(
				`${API_URL}/dashboard/manage/roles/write-permission`,{body:JSON.stringify({role_id:role_id,operations:permissions.map((e)=>({
					permission_id:e.permission_id,
					operation_type:e.operation_type
				}))})}
			)
			for (const result of data?.results) {
				console.log(result)
				toast(`Yetki ${result.permission_id} hata verdi:`,{duration:5000,description:result.error})
			}
			return data
		}
	})
}

export function useGetAllPermissions() {
	
	const access_token = useGezcezStore((state) => state.access_token)
	return useQuery({
		queryKey:["get_all_permissions"],
		queryFn:async()=>{
			const [data,request]= await makeGezcezRequest(`${API_URL}/dashboard/manage/permissions/list-all`)
			return data
		}
	})
}


export function useGetPathRegistry() {
	
	const access_token = useGezcezStore((state) => state.access_token)
	return useQuery({
		queryKey:["get_path_registry"],
		queryFn:async()=>{
			const [data,request]= await makeGezcezRequest(`${API_URL}/dashboard/manage/permissions/get-registry`)
			return data
		}
	})
}

export function useGetAllUsers() {
	const access_token = useGezcezStore((state) => state.access_token)
	const network_id = useGezcezStore((state) => state.network_id)
	return useQuery({
		queryKey: ["list_all_users", network_id, access_token],
		queryFn: async () => {
			// Note: This endpoint might not exist yet and may need to be created in the backend
			const [data, request] = await makeGezcezRequest(`${API_URL}/dashboard/${network_id}/users/list-all`)
			return data
		},
		retry: false, // Don't retry if endpoint doesn't exist
	})
}

export function useGetUserRoleMatrix(filter_users?: number[]) {
	const access_token = useGezcezStore((state) => state.access_token)
	const network_id = useGezcezStore((state) => state.network_id)
	return useQuery({
		queryKey: ["get_user_role_matrix", network_id, access_token, `users-${filter_users}`],
		queryFn: async () => {
			const [data, request] = await makeGezcezRequest(
				`${API_URL}/dashboard/${network_id}/users/get-role-matrix?user_ids=${filter_users?.join(",") || ""}`
			)
			return data
		},
		retry: false, // Don't retry if endpoint doesn't exist
	})
}

export function mutateUserRoles() {
	const access_token = useGezcezStore((state) => state.access_token)
	const network_id = useGezcezStore((state) => state.network_id)
	return useMutation({
		mutationKey: ["write-user-roles"],
		mutationFn: async (vars: { user_id: number, operations: { role_id: number, operation_type: "add" | "remove" }[] }) => {
			const { operations, user_id } = vars
			if (!user_id || isNaN(user_id) || !operations || !operations.length) return {}
			const [data, request] = await makeGezcezRequest(
				`${API_URL}/dashboard/${network_id}/users/write-roles`, {
				body: JSON.stringify({
					user_id: user_id,
					operations: operations.map((e) => ({
						role_id: e.role_id,
						operation_type: e.operation_type
					}))
				})
			}
			)
			for (const result of data?.results || []) {
				console.log(result)
				toast(`Role ${result.role_id} operation failed:`, { duration: 5000, description: result.error })
			}
			return data
		}
	})
}

export function useCheckUserEditPermission(user_id: number) {
	const access_token = useGezcezStore((state) => state.access_token)
	const network_id = useGezcezStore((state) => state.network_id)
	
	return useQuery({
		queryKey: ["check-user-edit-permission", user_id, network_id],
		queryFn: async () => {
			if (!user_id || !network_id) return null
			const [data] = await makeGezcezRequest(
				`${API_URL}/dashboard/${network_id}/users/check-edit-permission`,
				{
					body: JSON.stringify({ user_id }),
					method: "POST"
				}
			)
			return data
		},
		enabled: !!(user_id && network_id && access_token)
	})
}