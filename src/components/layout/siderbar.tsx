import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSubButton } from "@/components/ui/sidebar"
import { Calendar, ChevronDown, Home, Inbox, Search, Settings } from "lucide-react"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { useGetAccountMe, useGetAccountRoles } from "@/common/hooks/account/user-hooks"
import { Label } from "../ui/label"
import { Card } from "../ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { useGetPermissions } from "@/common/hooks/account/permissions-hooks"
import { useGetNetworks } from "@/common/hooks/web-hooks"
import SidebarNetworkSelector from "./sidebar/network-selector"
import { Skeleton } from "../ui/skeleton"
import { Badge } from "../ui/badge"
import { useGezcezStore } from "@/common/stores/gezcez-auth-store"
import SidebarManageNetworks from "./sidebar/manage-networks"
import { Link } from "react-router-dom"
const items = [
	{
		title: "Home",
		url: "/dash",
		icon: Home,
	}
]
export default function SidebarComponent() {
	const { data: user, isFetching: isAccountMeLoading } = useGetAccountMe()
	const { data: permissions, isFetching: isPermissionsLoading } = useGetPermissions()
	const setNetworkId = useGezcezStore((state) => state.setNetworkId)
	const network_id = useGezcezStore((state) => state.network_id)
	return <Sidebar>
		<SidebarHeader>
			<Card className="flex px-4 gap-x-4 flex-row">
				<Avatar >
					<AvatarFallback>{user?.account?.username.slice(0, 1)}</AvatarFallback>
				</Avatar>
				<Label>
					{user?.account?.username}
				</Label>
			</Card>
			<SidebarNetworkSelector value={network_id} onValueChange={(network) => { setNetworkId(parseInt(network)) }} />

		</SidebarHeader>
		<SidebarContent>
			<SidebarGroup>
				<SidebarGroupLabel>Application</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						{items.map((item) => (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton asChild>
									<Link to={{ pathname: item.url }}>
											<item.icon />
											<span>{item.title}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
			<SidebarManageNetworks />
		</SidebarContent>
	</Sidebar>
}