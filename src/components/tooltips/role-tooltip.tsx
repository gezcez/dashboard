import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";
import { Skeleton } from "../ui/skeleton";
import { Separator } from "../ui/separator";
import UserTooltip from "./user-tooltip";
import { Link } from "react-router-dom";

interface RoleAssignmentData {
	id: number;
	role_id: number;
	user_id: number;
	network_id: number;
	status: boolean;
	created_by: number;
	updated_by: number;
	created_at: string;
	updated_at: string;
}

interface RoleData {
	id: number;
	name: string;
	description?: string;
	level: number;
	immutable: boolean;
}

export default function RoleTooltip(props: { 
	role: RoleData;
	assignment: RoleAssignmentData;
}) {
	const { role, assignment } = props;
	
	return (
		<HoverCard>
			<HoverCardTrigger asChild>
				<Link to={{ pathname: "/manage/roles", search: `role_id=${role.id}` }}>
					<Button variant="link" className="h-auto p-0">
						{role.name}
					</Button>
				</Link>
			</HoverCardTrigger>
			<ActualTooltipContent role={role} assignment={assignment} />
		</HoverCard>
	);
}

function ActualTooltipContent(props: { 
	role: RoleData;
	assignment: RoleAssignmentData;
}) {
	const { role, assignment } = props;
	
	if (!role || !assignment) {
		return (
			<HoverCardContent className="w-80 space-y-4">
				<div className="flex flex-row items-center space-x-4">
					<Skeleton className="h-12 rounded-full w-12 inline-block" />
					<Skeleton className="h-6 w-48 inline-block" />
				</div>
				<Skeleton className="h-12 w-full" />
			</HoverCardContent>
		);
	}
	
	return (
		<HoverCardContent className="w-80">
			<div className="flex justify-between gap-4">
				<div className="space-y-2 w-full">
					<h4 className="text-sm font-semibold">
						{role.name} (Level {role.level})
					</h4>
					
					{role.description && (
						<p className="text-sm text-muted-foreground">{role.description}</p>
					)}
					
					<div className="flex gap-2">
						<Badge variant={assignment.status ? "default" : "secondary"}>
							{assignment.status ? "Active" : "Inactive"}
						</Badge>
						{role.immutable && (
							<Badge variant="outline" className="text-orange-600 border-orange-600">
								Immutable
							</Badge>
						)}
					</div>
					
					<Separator className="h-4"/>
					
					<div className="text-muted-foreground flex flex-col text-xs space-y-1">
						<div className="flex items-center gap-1">
							<span className="font-medium">Assigned:</span>
							<span>{assignment.created_at ? new Date(assignment.created_at).toLocaleDateString() : "Unknown"}</span>
						</div>
						<div className="flex items-center gap-1">
							<span className="font-medium">Assigned by:</span>
							<UserTooltip user_id={assignment.created_by} />
						</div>
						{assignment.updated_at !== assignment.created_at && (
							<>
								<div className="flex items-center gap-1">
									<span className="font-medium">Updated:</span>
									<span>{assignment.updated_at ? new Date(assignment.updated_at).toLocaleDateString() : "Unknown"}</span>
								</div>
								<div className="flex items-center gap-1">
									<span className="font-medium">Updated by:</span>
									<UserTooltip user_id={assignment.updated_by} />
								</div>
							</>
						)}
						<div className="flex items-center gap-1">
							<span className="font-medium">Network:</span>
							<Badge variant="outline" className="text-xs">
								#{assignment.network_id}
							</Badge>
						</div>
					</div>
				</div>
			</div>
		</HoverCardContent>
	);
}