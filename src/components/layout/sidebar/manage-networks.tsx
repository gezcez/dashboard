import { useGetMyPages } from "@/common/hooks/account/user-hooks";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressIndicator } from "@radix-ui/react-progress";
import { HomeIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function SidebarManageNetworks() {
	const { data: pages, isLoading } = useGetMyPages()
	if (isLoading) {
		return <SidebarGroup>
			<SidebarGroupLabel>Manage Network</SidebarGroupLabel>
			<SidebarGroupContent className="space-y-4">
				
				<Skeleton className="h-4 px-12" />
				<Skeleton className="h-4 px-12" />
				<Skeleton className="h-4 px-12" />
			</SidebarGroupContent>
		</SidebarGroup>
	}
	return <SidebarGroup>
		<SidebarGroupLabel>Manage Network</SidebarGroupLabel>
		<SidebarGroupContent>
			<SidebarMenu>
				{pages?.pages?.filter((e: any) => e.href && e.label).map(({ id, description, key, href, label }: any) => (
					<SidebarMenuItem key={key}>
						<SidebarMenuButton asChild>
							<Link to={{ pathname: href }}>
								{/* <item.icon /> */}
								<span>{label}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroupContent>
	</SidebarGroup>
}