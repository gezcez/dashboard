import { useGetUserInfoFromID } from "@/common/hooks/manage/dashboard-hooks";
import { useGezcezStore } from "@/common/stores/gezcez-auth-store";
import { Link } from "react-router-dom";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { Separator } from "../ui/separator";
import UserTooltip from "./user-tooltip";

export default function PermissionTooltip(props: { permission_id: number,permission_content:any }) {
	const { permission_content,permission_id } = props
	return <HoverCard>
		<HoverCardTrigger asChild>
			<Link to={{pathname:`/manage/permissions`,search:`permission_id=${permission_id}`}}>
			<Button variant="link">{permission_id} | {permission_content.key}</Button>
			</Link>
		</HoverCardTrigger>
		<ActualTooltipContent permission_id={permission_id} permission_content={permission_content} />
	</HoverCard>
}

function ActualTooltipContent(props: { permission_id: number,permission_content:any }) {

	const { permission_content,permission_id } = props
	return <HoverCardContent>
		<div className="flex justify-between gap-4">
			<div className="space-y-2">
				<h4 className="text-sm font-semibold">{permission_id} | {permission_content?.key}</h4>
				<Separator className="h-4"/>
				<p className="text-sm">
				{permission_content?.description}
				</p>
				<div className="text-muted-foreground flex flex-col text-xs">
					<a>
						Created By: <UserTooltip user_id={permission_content.created_by}/>
					</a>
					<a>
						Created At: {new Date(permission_content?.created_at).toLocaleString()} (local)
					</a>
					<a>
						Updated By: <UserTooltip user_id={permission_content.updated_by}/>
					</a>
					<a>
						Updated At: {new Date(permission_content?.updated_at).toLocaleString()} (local)
					</a>
				</div>
			</div>
		</div>
	</HoverCardContent>
}