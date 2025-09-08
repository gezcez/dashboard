import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Link, useSearchParams } from "react-router-dom"
import { customHistory } from "@/common/utils/nav"
import { ArrowLeft } from "lucide-react"
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Label } from "@/components/ui/label"
import UsersTableComponent from "./users/users-table.tsx"
import UserRoleMatrixTableComponent from "./users/user-role-matrix.tsx"

export default function ManageUsersPage() {
	const [search_params, set_search_params] = useSearchParams()
	const edit_user_id = search_params.get("user_id")
	
	let content_to_render = (
		<Tabs defaultValue="users">
			<CardHeader className="flex flex-1 flex-row space-x-4">
				<TabsList className="self-center" defaultValue={"users"}>
					<TabsTrigger value="users">Users</TabsTrigger>
					<TabsTrigger value="user-roles">User-Role Matrix</TabsTrigger>
				</TabsList>
				<TabsContent value="users">
					<CardTitle>Users</CardTitle>
					<CardDescription>Manage system users and their roles.</CardDescription>
				</TabsContent>

				<TabsContent value="user-roles">
					<CardTitle>User-Role Matrix</CardTitle>
					<CardDescription>User-Role assignments and permissions overview.</CardDescription>
				</TabsContent>
			</CardHeader>
			<Separator className="my-4" />
			<TabsContent value="users">
				<CardContent className="grid gap-6">
					<UsersTableComponent />
				</CardContent>
			</TabsContent>
			<TabsContent value="user-roles">
				<CardContent className="grid gap-6">
					<UserRoleMatrixTableComponent />
				</CardContent>
			</TabsContent>
		</Tabs>
	)
	
	if (edit_user_id) {
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
									<Link to={{ search: "" }}>manage/users</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbLink>{edit_user_id}</BreadcrumbLink>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<Label className="flex-col items-start">
						<CardTitle>User Details for ID {edit_user_id}</CardTitle>
						<CardDescription>Edit user information and permissions</CardDescription>
					</Label>
				</CardHeader>
				{/* TODO: Add EditUserDetailsComponent */}
				<CardContent className="grid gap-6">
					<div className="text-center text-muted-foreground p-8">
						User editing component coming soon...
					</div>
				</CardContent>
			</>
		)
	}
	
	return (
		<div className="self-center h-full items-center p-16 justify-center flex-1 w-full flex-col gap-6">
			<Card>{content_to_render}</Card>
		</div>
	)
}