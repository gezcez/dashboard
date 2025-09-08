import { useGetAllUsers, useGetUserRoleMatrix, useCheckUserEditPermission } from "@/common/hooks/manage/dashboard-hooks"
import { useGezcezStore } from "@/common/stores/gezcez-auth-store"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import UserTooltip from "@/components/tooltips/user-tooltip"
import BanTooltip from "@/components/tooltips/ban-tooltip"
import { Link, Navigate } from "react-router-dom"
import CrudTooltip from "@/components/tooltips/crud-tooltip"
import { Button } from "@/components/ui/button"
import EditUserRolesDialog from "./edit-user-roles"
import { Edit, ShieldAlert, Shield, Loader2, Lock } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Component to handle edit button with permission checking
function EditUserButton({ user, currentUserRoles }: { user: any, currentUserRoles: number[] }) {
	const { data: editPermissionData, isLoading: isCheckingPermission } = useCheckUserEditPermission(user.id)
	
	const canEditUser = editPermissionData?.can_edit
	const editError = editPermissionData?.error
	const isDisabled = !canEditUser || isCheckingPermission

	// Check if user has protected roles
	const hasProtectedRoles = currentUserRoles.some(roleId => {
		// This is a simple check - in a real scenario, you'd want to get role names
		// For now, we'll rely on the backend check
		return false // Backend will handle this
	})

	const getTooltipContent = () => {
		if (isCheckingPermission) return "Checking permissions..."
		if (!canEditUser) {
			// Provide more detailed error messages
			if (editError?.includes("higher or equal authority")) {
				return "Cannot edit users with higher or equal authority level"
			} else if (editError?.includes("admin/root privileges")) {
				return "Cannot edit users with admin or root privileges"
			} else if (editError?.includes("immutable role")) {
				return "User has immutable roles that cannot be modified"
			} else {
				return editError || "You don't have permission to edit this user's roles"
			}
		}
		return "Edit user roles"
	}

	const editButton = (
		<Button 
			variant="outline" 
			size="sm" 
			disabled={isDisabled}
			className={isDisabled ? "opacity-50 cursor-not-allowed" : ""}
		>
			{isCheckingPermission ? (
				<Loader2 className="h-4 w-4 mr-1 animate-spin" />
			) : isDisabled ? (
				<ShieldAlert className="h-4 w-4 mr-1 text-destructive" />
			) : (
				<Edit className="h-4 w-4 mr-1" />
			)}
			Edit Roles
		</Button>
	)

	if (isDisabled) {
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						{editButton}
					</TooltipTrigger>
					<TooltipContent className="max-w-sm">
						<div className="space-y-1">
							<p className="font-medium text-sm">{getTooltipContent()}</p>
							{isDisabled && !isCheckingPermission && (
								<p className="text-xs text-muted-foreground">
									Contact an administrator if you need access to edit this user.
								</p>
							)}
						</div>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		)
	}

	return (
		<EditUserRolesDialog
			user={{ id: user.id, username: user.username, email: user.email }}
			currentUserRoles={currentUserRoles}
			trigger={editButton}
		/>
	)
}

export default function UsersTableComponent() {
	const network_id = useGezcezStore((state) => state.network_id)
	// Note: This hook doesn't exist yet - we'll need to create it or ask for backend endpoint
	const { data: users, isFetching } = useGetAllUsers()
	const { data: userRoleData } = useGetUserRoleMatrix()
	
	if (!network_id) return <Navigate to={{ pathname: "/dash" }} />

	// Create a map of user ID to their roles for quick lookup
	const userRolesMap = new Map<number, any[]>()
	if (userRoleData?.user_roles) {
		userRoleData.user_roles.forEach((userRole: any) => {
			const userId = userRole.user_role.user_id
			if (!userRolesMap.has(userId)) {
				userRolesMap.set(userId, [])
			}
			userRolesMap.get(userId)?.push(userRole.role)
		})
	}
	
	return (
		<div className="flex-1 flex self-center justify-center items-center">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>ID</TableHead>
						<TableHead>Username</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Created</TableHead>
						<TableHead>Roles</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{isFetching ? (
						<TableRow>
							<TableCell colSpan={7}>
								<Skeleton className="h-16 w-full" />
							</TableCell>
						</TableRow>
					) : users?.users?.length > 0 ? (
						users.users.map((user: any) => {
							const userRoles = userRolesMap.get(user.id) || []
							const userRoleIds = userRoles.map((role: any) => role?.id).filter(Boolean)
							
							return (
								<TableRow key={`user-${user.id}`}>
									<TableCell>
										<Link to={{ search: `user_id=${user.id}` }}>{user.id}</Link>
									</TableCell>
									<TableCell>
										<UserTooltip user_id={user.id} />
									</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>
										<Badge variant={user.activated_at ? "default" : "secondary"}>
											{user.activated_at ? "Active" : "Inactive"}
										</Badge>
										{user.ban_record && (
											<BanTooltip user_id={user.id}>
												<Badge variant="destructive" className="ml-2 cursor-help">
													Banned
												</Badge>
											</BanTooltip>
										)}
									</TableCell>
									<TableCell>
										{user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
									</TableCell>
									<TableCell>
										<div className="flex flex-wrap gap-1">
											{userRoles.length > 0 ? (
												userRoles.map((role: any) => {
													if (!role) return null
													
													const isProtectedRole = role.name === "network_admin" || role.name === "root" || role.name === "admin"
													const isImmutableRole = role.immutable
													
													return (
														<Badge 
															key={role.id} 
															variant={isProtectedRole ? "destructive" : isImmutableRole ? "secondary" : "outline"}
															className={`text-xs ${(isProtectedRole || isImmutableRole) ? 'flex items-center gap-1' : ''}`}
														>
															{isProtectedRole && <Shield className="h-3 w-3" />}
															{isImmutableRole && !isProtectedRole && <Lock className="h-3 w-3" />}
															{role.name}
														</Badge>
													)
												})
											) : (
												<span className="text-xs text-muted-foreground">No roles</span>
											)}
										</div>
									</TableCell>
									<TableCell>
										<EditUserButton 
											user={user}
											currentUserRoles={userRoleIds}
										/>
									</TableCell>
									<TableCell>
										<CrudTooltip data={user} />
									</TableCell>
								</TableRow>
							)
						})
					) : (
						<TableRow>
							<TableCell colSpan={7} className="text-center text-muted-foreground">
								No users found or endpoint not available
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	)
}