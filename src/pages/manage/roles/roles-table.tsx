import { useGetAllRoles } from "@/common/hooks/manage/dashboard-hooks"
import { useGezcezStore } from "@/common/stores/gezcez-auth-store"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import UserTooltip from "@/components/tooltips/user-tooltip"
import { Link, Navigate } from "react-router-dom"
import CrudTooltip from "@/components/tooltips/crud-tooltip"

export default function RolesTableComponent() {
	const network_id = useGezcezStore((state) => state.network_id)
	const { data: roles, isFetching } = useGetAllRoles()
	if (!network_id) return <Navigate to={{ pathname: "/dash" }} />
	return (
		<div className="flex-1 flex self-center justify-center items-center">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>ID</TableHead>
						<TableHead>Name</TableHead>
						<TableHead>Description</TableHead>
						<TableHead>CRUD</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{isFetching ? (
						<Skeleton className="h-16 w-full" />
					) : (
						roles?.roles?.map((role: any) => (
							<TableRow key={`${role.id}`}>
								<TableCell>
									<Link to={{ search: `role_id=${role.id}` }}>{role.id}</Link>
								</TableCell>
								<TableCell>
									<Link to={{ search: `role_id=${role.id}` }}>{role.name}</Link>
								</TableCell>
								<TableCell>
									<Link to={{ search: `role_id=${role.id}` }}>{role.description}</Link>
								</TableCell>
								<TableCell>
									<CrudTooltip data={role}/>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	)
}
