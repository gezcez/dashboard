import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RolesTableComponent from "./roles/roles-table";

export default function ManageRolesPage() {
	return <div className="self-center bg-red-400 h-full items-center p-16 justify-center flex-1 w-full flex-col gap-6">
		<Tabs>
			<TabsList className="self-center" defaultValue={"roles"}>
				<TabsTrigger value="roles">Roles</TabsTrigger>
				<TabsTrigger value="role-permission">Role-Permission Matrix</TabsTrigger>
			</TabsList>

			<TabsContent value="roles">
				<Card>
					<CardHeader>
						<CardTitle>Roles</CardTitle>
						<CardDescription>
							Global Roles, immutable.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-6">
						<RolesTableComponent/>
					</CardContent>
					<CardFooter>
						<Button>Save changes</Button>
					</CardFooter>
				</Card>
			</TabsContent>
			<TabsContent value="user-roles">
				<Card>
					<CardHeader>
						<CardTitle>Role-Permission Matrix</CardTitle>
						<CardDescription>
						Role-Permission Matrix, Immutable.
						</CardDescription>
					</CardHeader>
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
					<CardFooter>
						<Button>Save password</Button>
					</CardFooter>
				</Card>
			</TabsContent>
		</Tabs>
	</div>
}