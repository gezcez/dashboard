import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card"
import { Separator } from "../ui/separator"
import { Skeleton } from "../ui/skeleton"
import UserTooltip from "./user-tooltip"

export default function CrudTooltip(props: {
	data: object & { created_by: number; created_at: string; updated_by: number; updated_at: string }
}) {
	return (
		<HoverCard>
			<HoverCardTrigger asChild>
				<Badge className="select-none">
					CRUD
				</Badge>
			</HoverCardTrigger>
			<ActualTooltipContent data={props.data} />
		</HoverCard>
	)
}

function ActualTooltipContent(props: {
	data: object & { created_by: number; created_at: string; updated_by: number; updated_at: string }
}) {
	const { data } = props
	if (!data) {
		return (
			<HoverCardContent className="w-80 space-y-4">
				<div className="flex flex-row items-center space-x-4">
					<Skeleton className="h-12 rounded-full w-12 inline-block" />
					<Skeleton className="h-6 w-48 inline-block" />
				</div>
				<Skeleton className="h-12 w-full" />
			</HoverCardContent>
		)
	}
	return (
		<HoverCardContent>
			<div className="flex justify-between gap-4">
				<div className="space-y-2">
					<h4 className="text-sm font-semibold">CRUD Operations</h4>
					<Separator className="h-4" />
					<p className="text-sm"></p>
					<div className="text-muted-foreground flex flex-col text-xs">
						<a>Created At: {data.created_at}</a>
						<a>
							Created By: <UserTooltip user_id={data.created_by} />
						</a>
						<a>Updated At: {data.updated_at}</a>
						<a>
							Updated By: <UserTooltip user_id={data.updated_by} />
						</a>
					</div>
				</div>
			</div>
		</HoverCardContent>
	)
}
