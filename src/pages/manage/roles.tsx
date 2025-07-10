import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RolesTableComponent from "./roles/roles-table";
import { Separator } from "@/components/ui/separator";

export default function ManageRolesPage() {
	return <div className="self-center h-full items-center p-16 justify-center flex-1 w-full flex-col gap-6">
		<Card>
			<Tabs defaultValue="roles">
				<CardHeader className="flex flex-1 flex-row space-x-4">
					<TabsList className="self-center" defaultValue={"roles"}>
						<TabsTrigger value="roles">Roles</TabsTrigger>
						<TabsTrigger value="role-permission">Role-Permission Matrix</TabsTrigger>
					</TabsList>
					<TabsContent value="roles">
						<CardTitle>Roles</CardTitle>
						<CardDescription>
							Global Roles, immutable.
						</CardDescription>
					</TabsContent>

					<TabsContent value="role-permission">
						<CardTitle>Role-Permission Matrix</CardTitle>
						<CardDescription>
							Role-Permission Matrix, Immutable.
						</CardDescription>
					</TabsContent>
				</CardHeader>
				<Separator className="my-4"/>
				<TabsContent value="roles">
					<CardContent className="grid gap-6">
						<RolesTableComponent />
					</CardContent>
				</TabsContent>
				<TabsContent value="role-permission">

					<CardContent className="grid gap-6">
						<div className="grid gap-3">
							<Label htmlFor="tabs-demo-current">Current password</Label>
							<Input id="tabs-demo-current" type="password" />
						</div>
						<div className="grid gap-3">
							<Label htmlFor="tabs-demo-new">New password</Label>
							<Input id="tabs-demo-new" type="password" />
						</div>
					</CardContent>
				</TabsContent>
			</Tabs>
		</Card>
	</div >
}