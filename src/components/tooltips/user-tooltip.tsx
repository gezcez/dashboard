import { useGetUserInfoFromID } from "@/common/hooks/manage/dashboard-hooks";
import { Avatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { useGezcezStore } from "@/common/stores/gezcez-auth-store";
import { Link } from "react-router-dom";
import { Separator } from "../ui/separator";

export default function UserTooltip(props: { user_id: number }) {
	const { user_id } = props
	const { data, isLoading } = useGetUserInfoFromID(user_id)
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
	return <HoverCardContent>
		<div className="flex justify-between gap-4">
			<div className="space-y-2">
				<h4 className="text-sm font-semibold">{user_id} | {content?.user?.username}</h4>
				<Separator className="h-4"/>
				<p className="text-sm">
					{content?.roles?.filter(({ role, user_role }: any) => user_role.network_id === network_id).map(({ role, user_role }: any) => {
						return <Badge>
							{role.name}
						</Badge>
					})}
				</p>
				<div className="text-muted-foreground flex flex-col text-xs">
					<a>
						Created At: {new Date(content?.user?.created_at).toLocaleString()} (local)
					</a>
					<a>
						Activated At: {new Date(content?.user?.activated_at).toLocaleString()} (local)
					</a>
					<a>
						Ban Record: {content?.user?.ban_record || "null"}
					</a>
				</div>
			</div>
		</div>
	</HoverCardContent>
}