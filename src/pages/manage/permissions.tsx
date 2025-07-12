import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import RolesTableComponent from "./roles/roles-table"
import { Separator } from "@/components/ui/separator"
import RolesMatrixTableComponent from "./roles/matrix-table"
import { Link, Navigate, useSearchParams } from "react-router-dom"
import EditRolePermissionsTable from "./roles/edit-role-permissions"
import { customHistory } from "@/common/utils/nav"
import { ArrowBigLeft, ArrowBigLeftDash, ArrowLeft, SeparatorVertical } from "lucide-react"
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarSeparator } from "@/components/ui/sidebar"
import PermissionsTableComponent from "./permissions/permissions-table"
import PathRegistryTableComponent from "./permissions/path-registry"

export default function ManagePermissionsPage() {
	const [search_params, set_search_params] = useSearchParams()
	const edit_permission_id = search_params.get("permission_id")
	let content_to_render = (
		<Tabs defaultValue="permissions">
			<CardHeader className="flex flex-1 flex-row space-x-4">
				<TabsList className="self-center" defaultValue={"permissions"}>
					<TabsTrigger value="permissions">Permissions</TabsTrigger>
					<TabsTrigger value="path-registry">Path Registry</TabsTrigger>
				</TabsList>
				<TabsContent value="permissions">
					<CardTitle>Permissions</CardTitle>
					<CardDescription>Global Permissions, immutable.</CardDescription>
				</TabsContent>

				<TabsContent value="path-registry">
					<CardTitle>Path Registry</CardTitle>
					<CardDescription>path-permission matrix.</CardDescription>
				</TabsContent>
			</CardHeader>
			<Separator className="my-4" />
			<TabsContent value="permissions">
				<CardContent className="grid gap-6">
					<PermissionsTableComponent />
				</CardContent>
			</TabsContent>
			<TabsContent value="path-registry">
				<CardContent className="grid gap-6">
					<PathRegistryTableComponent />
				</CardContent>
			</TabsContent>
		</Tabs>
	)
	if (edit_permission_id) {
		content_to_render = (
			<>
				<CardHeader className="flex flex-1 flex-row space-x-4">
					<Breadcrumb className="flex flex-row space-x-4">
						<Button
							variant={"secondary"}
							onClick={() => {
								console.log("goback pressed")
								customHistory.go(-1)
							}}
						>
							<ArrowLeft />
						</Button>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link to={{ pathname: "/dash" }}>home</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link to={{ search: "" }}>manage/roles</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbLink>{edit_permission_id}</BreadcrumbLink>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<Label className="flex-col items-start">
						<CardTitle>Permissios for role {edit_permission_id}</CardTitle>
						<CardDescription>Edit role permissions</CardDescription>
					</Label>
				</CardHeader>
				{/* <EditRolePermissionsTable permission_id={parseInt(edit_permission_id)} /> */}
			</>
		)
	}
	return (
		<div className="self-center h-full items-center p-16 justify-center flex-1 w-full flex-col gap-6">
			<Card>{content_to_render}</Card>
		</div>
	)
}
