import { useGetAllPermissions, useGetAllRoles } from "@/common/hooks/manage/dashboard-hooks"
import { useGezcezStore } from "@/common/stores/gezcez-auth-store"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import UserTooltip from "@/components/tooltips/user-tooltip"
import { Link, Navigate } from "react-router-dom"
import CrudTooltip from "@/components/tooltips/crud-tooltip"

export default function PermissionsTableComponent() {
	const { data: permissions, isFetching } = useGetAllPermissions()
	return (
		<div className="flex-1 flex self-center justify-center items-center">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>ID</TableHead>
						<TableHead>App Key</TableHead>
						<TableHead>Permission Key</TableHead>
						<TableHead>Page Label</TableHead>
						<TableHead>Page Href</TableHead>
						<TableHead>CRUD</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{isFetching ? (
						<Skeleton className="h-16 w-full" />
					) : (
						permissions?.permissions?.map((permission: any) => (
							<TableRow key={`${permission.id}`}>
								<TableCell>
									<Link to={{ search: `permission_id=${permission.id}` }}>{permission.id}</Link>
								</TableCell>
								<TableCell>
									{permission.app}
								</TableCell>
								<TableCell>
									<Link to={{ search: `permission_id=${permission.id}` }}>{permission.key}</Link>
								</TableCell>
								<TableCell>
									{permission.page_label}
								</TableCell>
								
								<TableCell>
									{permission.page_href}
								</TableCell>
								<TableCell><CrudTooltip data={permission} /></TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	)
}
