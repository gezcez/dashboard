import { useGetAllRoles } from "@/common/hooks/manage/role-hooks"
import { useGezcezStore } from "@/common/stores/gezcez-auth-store"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import UserTooltip from "@/components/tooltips/user-tooltip"
import { Navigate } from "react-router-dom"

export default function RolesTableComponent() {
	const network_id = useGezcezStore((state) => state.network_id)
	const { data: roles, isLoading } = useGetAllRoles()
	if (!network_id) return <Navigate to={{ pathname: "/dash" }} />
	return <div className="flex-1 flex self-center justify-center items-center">
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>
						ID
					</TableHead>
					<TableHead>
						Name
					</TableHead>
					<TableHead>
						Description
					</TableHead>
					<TableHead>
						Created By
					</TableHead>
					<TableHead>
						Created At
					</TableHead>
					<TableHead>
						Updated By
					</TableHead>
					<TableHead>
						Updated At
					</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{isLoading ? <Skeleton className="h-16 w-full" /> : roles?.roles?.map((role: any) => <TableRow key={`${role.id}`}>
					<TableCell>
						{role.id}
					</TableCell>
					<TableCell>
						{role.name}
					</TableCell>
					<TableCell>
						{role.description}
					</TableCell>
					<TableCell>
						<UserTooltip user_id={role.created_by}></UserTooltip>
					</TableCell>
					<TableCell>
						{role.created_at}
					</TableCell>
					<TableCell>
						{role.updated_by}
					</TableCell>
					<TableCell>
						{role.updated_at}
					</TableCell>
				</TableRow>)}
			</TableBody>
		</Table>
	</div>
}
