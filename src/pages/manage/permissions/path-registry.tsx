import {
	useGetAllPermissions,
	useGetAllRoles,
	useGetPathRegistry
} from "@/common/hooks/manage/dashboard-hooks"
import { useGezcezStore } from "@/common/stores/gezcez-auth-store"
import { Skeleton } from "@/components/ui/skeleton"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/components/ui/table"
import UserTooltip from "@/components/tooltips/user-tooltip"
import { Link, Navigate } from "react-router-dom"
import PermissionTooltip from "@/components/tooltips/permission-tooltip"
import CrudTooltip from "@/components/tooltips/crud-tooltip"
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Scrollbar } from "@radix-ui/react-scroll-area"

export default function PathRegistryTableComponent() {
	const { data: registry, isFetching } = useGetPathRegistry()
	return (
		<div className="flex-1 flex self-center justify-center items-center">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>ID</TableHead>
						<TableHead>Permission ID</TableHead>
						<TableHead>Method</TableHead>
						<TableHead>Path</TableHead>
						<TableHead>Description</TableHead>
						<TableHead>Type</TableHead>
						<TableHead>CRUD</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody className="w-full">
					{/* <ScrollArea className="w-full"> */}
						{/* <Scrollbar orientation="horizontal" /> */}
						{isFetching ? (
							<Skeleton className="h-16 w-full" />
						) : (
							registry?.path_registries?.map((path_registry: any) => (
								<TableRow key={`${path_registry.id}`}>
									<TableCell>{path_registry.id}</TableCell>
									<TableCell>
										<PermissionTooltip
											permission_id={path_registry.permission_id}
											permission_content={registry.permissions.find(
												(e: any) => e.id === path_registry.permission_id
											)}
										/>
										{/* <Link to={{ search: `permission_id=${path_registry.permission_id}` }}>{path_registry.permission_id}</Link> */}
									</TableCell>
									<TableCell>{path_registry.method}</TableCell>
									<TableCell>{path_registry.path}</TableCell>

									<TableCell>{path_registry.description}</TableCell>
									<TableCell>{path_registry.type}</TableCell>
									<TableCell>
										<CrudTooltip data={path_registry} />
									</TableCell>
								</TableRow>
							))
						)}
					{/* </ScrollArea> */}
				</TableBody>
			</Table>
		</div>
	)
}
