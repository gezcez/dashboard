import { useGetUserRoleMatrix } from "@/common/hooks/manage/dashboard-hooks"
import { useGezcezStore } from "@/common/stores/gezcez-auth-store"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import UserTooltip from "@/components/tooltips/user-tooltip"
import RoleTooltip from "@/components/tooltips/role-tooltip"
import BanTooltip from "@/components/tooltips/ban-tooltip"
import { Link, Navigate } from "react-router-dom"
import CrudTooltip from "@/components/tooltips/crud-tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function UserRoleMatrixTableComponent() {
	const network_id = useGezcezStore((state) => state.network_id)
	const { data, isLoading } = useGetUserRoleMatrix()
	
	if (!network_id) return <Navigate to={{ pathname: "/dash" }} />
	
	return (
		<div className="flex-1 flex self-center justify-center items-center">
			<Table>
				<ScrollArea style={{ maxHeight: 150 * 4 }}>
					<TableHeader>
						<TableRow>
							<TableHead>ID</TableHead>
							<TableHead>User</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Network</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>CRUD</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={6}>
									<Skeleton className="h-16 w-full" />
								</TableCell>
							</TableRow>
						) : data?.user_roles?.length > 0 ? (
							data.user_roles.map((user_role_data: any) => (
								<TableRow key={`user-role-${user_role_data.user_role.id}`}>
									<TableCell>
										<Link to={{ pathname: "/manage/users", search: `user_id=${user_role_data.user_role.user_id}` }}>
											{user_role_data.user_role.id}
										</Link>
									</TableCell>
									<TableCell>
										<UserTooltip user_id={user_role_data.user_role.user_id} />
										{user_role_data.user?.email && (
											<div className="text-xs text-muted-foreground">
												{user_role_data.user.email}
											</div>
										)}
									</TableCell>
									<TableCell>
										<RoleTooltip 
											role={user_role_data.role}
											assignment={user_role_data.user_role}
										/>
										{user_role_data.role?.description && (
											<div className="text-xs text-muted-foreground">
												{user_role_data.role.description}
											</div>
										)}
									</TableCell>
									<TableCell>
										<Badge variant="outline">
											Network #{user_role_data.user_role.network_id}
										</Badge>
									</TableCell>
									<TableCell>
										<div className="flex gap-1">
											<Badge variant={user_role_data.user_role.status ? "default" : "secondary"}>
												{user_role_data.user_role.status ? "Active" : "Inactive"}
											</Badge>
											{user_role_data.user?.ban_record && (
												<BanTooltip user_id={user_role_data.user_role.user_id}>
													<Badge variant="destructive" className="cursor-help">
														Banned
													</Badge>
												</BanTooltip>
											)}
										</div>
									</TableCell>
									<TableCell>
										<CrudTooltip data={user_role_data.user_role} />
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={6} className="text-center text-muted-foreground">
									No user-role relationships found or endpoint not available
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</ScrollArea>
			</Table>
		</div>
	)
}