import { useGetAllRoles, useGetRolePermissionMatrix } from "@/common/hooks/manage/dashboard-hooks"
import { useGezcezStore } from "@/common/stores/gezcez-auth-store"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import UserTooltip from "@/components/tooltips/user-tooltip"
import { Link, Navigate } from "react-router-dom"
import PermissionTooltip from "@/components/tooltips/permission-tooltip"
import CrudTooltip from "@/components/tooltips/crud-tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function RolesMatrixTableComponent() {
	const network_id = useGezcezStore((state) => state.network_id)
	const { data, isLoading } = useGetRolePermissionMatrix()
	if (!network_id) return <Navigate to={{ pathname: "/dash" }} />
	console.log(data?.permissions)
	return (
		<div className="flex-1 flex self-center justify-center items-center">
			<Table>
				<ScrollArea style={{ maxHeight: 150 * 4 }}>
					<TableHeader>
						<TableRow>
							<TableHead>ID</TableHead>
							<TableHead>Role ID</TableHead>
							<TableHead>Permission ID</TableHead>
							<TableHead>CRUD</TableHead>
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
									<TableCell>
										<Link to={{ pathname: "/manage/roles", search: `role_id=${role_permission.role_id}` }}>
											{role_permission.id}
										</Link>
									</TableCell>
									<TableCell>
										<Link to={{ pathname: "/manage/roles", search: `role_id=${role_permission.role_id}` }}>
											{role_permission.role_id} | {data?.roles?.find((e: any) => e.id === role_permission.role_id)?.name}
										</Link>
									</TableCell>
									<TableCell>
										<PermissionTooltip
											permission_id={role_permission.id}
											permission_content={data?.permissions?.find((e: any) => e.id === role_permission.permission_id)}
										/>
									</TableCell>
									<TableCell>
										<CrudTooltip data={role_permission} />
									</TableCell>
								</TableRow>
							)
						)}
					</TableBody>
				</ScrollArea>
			</Table>
		</div>
	)
}
