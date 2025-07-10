import { useGetAllRoles, useGetRolePermissionMatrix } from "@/common/hooks/manage/role-hooks"
import { useGezcezStore } from "@/common/stores/gezcez-auth-store"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import UserTooltip from "@/components/tooltips/user-tooltip"
import { Navigate } from "react-router-dom"
import PermissionTooltip from "@/components/tooltips/permission-tooltip"

export default function RolesMatrixTableComponent() {
	const network_id = useGezcezStore((state) => state.network_id)
	const { data, isLoading } = useGetRolePermissionMatrix()
	if (!network_id) return <Navigate to={{ pathname: "/dash" }} />
	console.log(data?.permissions)
	return (
		<div className="flex-1 flex self-center justify-center items-center">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>ID</TableHead>
						<TableHead>Role ID</TableHead>
						<TableHead>Permission ID</TableHead>
						<TableHead>Created By</TableHead>
						<TableHead>Created At</TableHead>
						<TableHead>Updated By</TableHead>
						<TableHead>Updated At</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{data?.role_permissions?.map(
						(role_permission: {
							created_at: string
							created_by: number
							id: number
							permission_id: number
							role_id: number
							updated_at: string
							updated_by: number
						}) => (
							<TableRow>
								<TableCell>{role_permission.id}</TableCell>
								<TableCell>{role_permission.role_id} | {data?.roles?.find((e:any)=>e.id===role_permission.role_id)?.name}</TableCell>
								<TableCell><PermissionTooltip permission_id={role_permission.id} permission_content={data?.permissions?.find((e:any)=>e.id===role_permission.permission_id)} /></TableCell>
								<TableCell><UserTooltip user_id={role_permission.created_by} /></TableCell>
								<TableCell>{role_permission.created_at}</TableCell>
								<TableCell><UserTooltip user_id={role_permission.updated_by} /></TableCell>
								<TableCell>{role_permission.updated_at}</TableCell>
							</TableRow>
						)
					)}
				</TableBody>
			</Table>
		</div>
	)
}
