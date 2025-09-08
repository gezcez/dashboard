import { useGetUserInfoFromID } from "@/common/hooks/manage/dashboard-hooks";
import { Avatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { useGezcezStore } from "@/common/stores/gezcez-auth-store";
import { Link } from "react-router-dom";
import { Separator } from "../ui/separator";
import { AlertTriangle } from "lucide-react";

export default function UserTooltip(props: { user_id: number }) {
	const { user_id } = props
	const { data, isFetching } = useGetUserInfoFromID(user_id)
	const network_id = useGezcezStore((state) => state.network_id)
	return <HoverCard>
		<HoverCardTrigger asChild>
			<Link to={{pathname:`/manage/users`,search:`user_id=${user_id}`}}>
			<Button variant="link">{user_id} {data?.user ? `| ${data?.user?.username}` : ""}</Button>
			</Link>
		</HoverCardTrigger>
		<ActualTooltipContent user_id={user_id} content={data} />
	</HoverCard>
}

function ActualTooltipContent(props: { user_id: number, content:any }) {

	const network_id = useGezcezStore((state) => state.network_id)
	const { user_id,content } = props
	if (!content) {
		return <HoverCardContent className="w-80 space-y-4">
			<div className="flex flex-row items-center space-x-4">
				<Skeleton className="h-12 rounded-full w-12 inline-block" />
				<Skeleton className="h-6 w-48 inline-block" />
			</div>
			<Skeleton className="h-12 w-full" />
		</HoverCardContent>
	}
	return <HoverCardContent className="w-80">
		<div className="flex justify-between gap-4">
			<div className="space-y-2 w-full">
				<h4 className="text-sm font-semibold">{user_id} | {content?.user?.username}</h4>
				
				{content?.user?.ban_record && (
					<div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded">
						<AlertTriangle className="h-4 w-4 text-destructive" />
						<span className="text-sm text-destructive font-medium">User is banned</span>
						<Badge variant="outline" className="text-destructive">
							Record #{content.user.ban_record}
						</Badge>
					</div>
				)}
				
				<Separator className="h-4"/>
				<p className="text-sm">
					{content?.roles?.filter(({ role, user_role }: any) => user_role.network_id === network_id).map(({ role, user_role }: any) => {
						return <Badge key={role.id} className="mr-1">
							{role.name}
						</Badge>
					})}
				</p>
				<div className="text-muted-foreground flex flex-col text-xs space-y-1">
					<div>
						<span className="font-medium">Created:</span> {content?.user?.created_at ? new Date(content.user.created_at).toLocaleDateString() : "Unknown"}
					</div>
					<div>
						<span className="font-medium">Activated:</span> {content?.user?.activated_at ? new Date(content.user.activated_at).toLocaleDateString() : "Not activated"}
					</div>
				</div>
			</div>
		</div>
	</HoverCardContent>
}