import { useGetUserInfoFromID } from "@/common/hooks/manage/role-hooks";
import { Avatar } from "./ui/avatar";
import { Button } from "./ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { useGezcezStore } from "@/common/stores/gezcez-auth-store";
import { Link } from "react-router-dom";

export default function UserTooltip(props: { user_id: number }) {
	const { user_id } = props
	return <HoverCard>
		<HoverCardTrigger asChild>
			<Link to={{pathname:`/manage/users`,search:`user_id=${user_id}`}}>
			<Button variant="link">{user_id}</Button>
			</Link>
		</HoverCardTrigger>
		<ActualTooltipContent user_id={user_id} />
	</HoverCard>
}

function ActualTooltipContent(props: { user_id: number }) {

	const { user_id } = props
	const { data, isLoading } = useGetUserInfoFromID(user_id)
	const network_id = useGezcezStore((state) => state.network_id)
	if (isLoading) {
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
			<div className="space-y-2">
				<h4 className="text-sm font-semibold">{user_id} | {data?.user?.username}</h4>
				<p className="text-sm">
					{data?.roles?.filter(({ role, user_role }: any) => user_role.network_id === network_id).map(({ role, user_role }: any) => {
						return <Badge>
							{role.name}
						</Badge>
					})}
				</p>
				<div className="text-muted-foreground flex flex-col text-xs">
					<a>
						Created At: {new Date(data?.user?.created_at).toLocaleString()} (local)
					</a>
					<a>
						Activated At: {new Date(data?.user?.activated_at).toLocaleString()} (local)
					</a>
					<a>
						Ban Record: {data?.user?.ban_record || "null"}
					</a>
				</div>
			</div>
		</div>
	</HoverCardContent>
}