import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useGetAllRoles, mutateUserRoles, useGetUserRoleMatrix, useCheckUserEditPermission } from "@/common/hooks/manage/dashboard-hooks"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Edit, User, Shield, ShieldAlert, Lock } from "lucide-react"

interface EditUserRolesDialogProps {
	user: {
		id: number
		username: string
		email?: string
	}
	currentUserRoles?: number[]
	trigger?: React.ReactNode
}

export default function EditUserRolesDialog({ user, currentUserRoles = [], trigger }: EditUserRolesDialogProps) {
	const [open, setOpen] = useState(false)
	const [selectedRoles, setSelectedRoles] = useState<Set<number>>(new Set(currentUserRoles))
	const [isSubmitting, setIsSubmitting] = useState(false)

	const { data: rolesData } = useGetAllRoles()
	const { data: editPermissionData, isLoading: isCheckingPermission } = useCheckUserEditPermission(user.id)
	const mutation = mutateUserRoles()
	const queryClient = useQueryClient()

	const roles = rolesData?.roles || []
	const canEditUser = editPermissionData?.can_edit
	const editError = editPermissionData?.error

	// Check if user has protected roles (cannot be edited)
	const hasProtectedRoles = currentUserRoles.some(roleId => {
		const role = roles.find((r: any) => r.id === roleId)
		return role?.name === "network_admin" || role?.name === "root" || role?.name === "admin"
	})

	const isEditingDisabled = !canEditUser || hasProtectedRoles || isCheckingPermission

	const handleRoleToggle = (roleId: number, checked: boolean) => {
		if (isEditingDisabled) return
		
		const newSelectedRoles = new Set(selectedRoles)
		if (checked) {
			newSelectedRoles.add(roleId)
		} else {
			newSelectedRoles.delete(roleId)
		}
		setSelectedRoles(newSelectedRoles)
	}

	const handleSubmit = async () => {
		if (isEditingDisabled) {
			toast.error("Cannot edit this user", {
				description: editError || "You don't have permission to edit this user's roles"
			})
			return
		}

		setIsSubmitting(true)
		
		const currentRoleSet = new Set(currentUserRoles)
		const newRoleSet = new Set(selectedRoles)
		
		const operations: { role_id: number, operation_type: "add" | "remove" }[] = []
		
		// Find roles to add
		for (const roleId of newRoleSet) {
			if (!currentRoleSet.has(roleId)) {
				operations.push({ role_id: roleId, operation_type: "add" })
			}
		}
		
		// Find roles to remove
		for (const roleId of currentRoleSet) {
			if (!newRoleSet.has(roleId)) {
				operations.push({ role_id: roleId, operation_type: "remove" })
			}
		}

		if (operations.length === 0) {
			toast("No changes to save")
			setIsSubmitting(false)
			return
		}

		try {
			await mutation.mutateAsync({
				user_id: user.id,
				operations: operations
			})
			
			// Refresh the user role matrix data
			queryClient.invalidateQueries({ queryKey: ["get_user_role_matrix"] })
			
			toast("User roles updated successfully")
			setOpen(false)
		} catch (error) {
			toast("Failed to update user roles", {
				description: error instanceof Error ? error.message : "Unknown error"
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	const resetForm = () => {
		setSelectedRoles(new Set(currentUserRoles))
	}

	return (
		<Dialog open={open} onOpenChange={(newOpen) => {
			setOpen(newOpen)
			if (!newOpen) resetForm()
		}}>
			<DialogTrigger asChild>
				{trigger || (
					<Button variant="outline" size="sm">
						<Edit className="h-4 w-4 mr-2" />
						Edit Roles
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<User className="h-5 w-5" />
						Edit Roles for {user.username}
					</DialogTitle>
					<DialogDescription>
						{user.email && <div className="text-sm text-muted-foreground">{user.email}</div>}
						Manage user role assignments. Changes will be applied immediately.
					</DialogDescription>
				</DialogHeader>

				{isEditingDisabled ? (
					<div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
						<ShieldAlert className="h-5 w-5 text-destructive" />
						<div>
							<div className="font-medium text-destructive">
								{hasProtectedRoles ? "Cannot Edit Protected User" : "Insufficient Permissions"}
							</div>
							<div className="text-sm text-muted-foreground">
								{hasProtectedRoles 
									? "This user has admin or root privileges and cannot be modified."
									: editError || "You don't have permission to edit this user's roles."}
							</div>
						</div>
					</div>
				) : (
					<>
						<div className="space-y-2">
							<div className="text-sm font-medium">Current Roles:</div>
							<div className="flex flex-wrap gap-1">
								{currentUserRoles.length > 0 ? (
									currentUserRoles.map(roleId => {
										const role = roles.find((r: any) => r.id === roleId)
										return role ? (
											<Badge key={roleId} variant="outline">
												{role.name}
											</Badge>
										) : null
									})
								) : (
									<span className="text-sm text-muted-foreground">No roles assigned</span>
								)}
							</div>
						</div>

						<Separator />

						<div className="space-y-3">
							<div className="text-sm font-medium">Available Roles:</div>
							<ScrollArea className="h-64">
								<div className="space-y-2">
									{roles.map((role: any) => {
										const isProtectedRole = role.name === "network_admin" || role.name === "root" || role.name === "admin"
										const isImmutableRole = role.immutable
										const isRoleDisabled = isEditingDisabled || isImmutableRole
										
										return (
											<div key={role.id} className={`flex items-center space-x-2 p-2 rounded border ${isImmutableRole ? 'bg-muted/20' : ''}`}>
												<Checkbox
													id={`role-${role.id}`}
													checked={selectedRoles.has(role.id)}
													onCheckedChange={(checked) => handleRoleToggle(role.id, !!checked)}
													disabled={isRoleDisabled}
												/>
												<div className="flex-1">
													<label 
														htmlFor={`role-${role.id}`}
														className={`text-sm font-medium ${isRoleDisabled ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
													>
														{role.name}
														{isImmutableRole && (
															<span className="ml-1 text-xs text-muted-foreground">(Immutable)</span>
														)}
													</label>
													{role.description && (
														<div className="text-xs text-muted-foreground">
															{role.description}
														</div>
													)}
												</div>
												{isImmutableRole && (
													<div title="Immutable role - cannot be modified">
														<Lock className="h-4 w-4 text-muted-foreground" />
													</div>
												)}
												{isProtectedRole && !isImmutableRole && (
													<div title="Protected role">
														<Shield className="h-4 w-4 text-amber-500" />
													</div>
												)}
											</div>
										)
									})}
								</div>
							</ScrollArea>
						</div>
					</>
				)}

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					{!isEditingDisabled && (
						<>
							<Button variant="outline" onClick={resetForm}>
								Reset
							</Button>
							<Button onClick={handleSubmit} disabled={isSubmitting}>
								{isSubmitting ? "Saving..." : "Save Changes"}
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}