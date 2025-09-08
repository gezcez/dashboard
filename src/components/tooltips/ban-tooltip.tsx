import { useGetUserInfoFromID } from "@/common/hooks/manage/dashboard-hooks";
import { Badge } from "../ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";
import { Skeleton } from "../ui/skeleton";
import { Separator } from "../ui/separator";
import { AlertTriangle, Calendar, User, FileText, Shield, MessageSquare } from "lucide-react";
import UserTooltip from "./user-tooltip";

interface BanTooltipProps {
	user_id: number;
	children: React.ReactNode;
}

export default function BanTooltip({ user_id, children }: BanTooltipProps) {
	const { data, isFetching } = useGetUserInfoFromID(user_id)
	
	return (
		<HoverCard>
			<HoverCardTrigger asChild>
				{children}
			</HoverCardTrigger>
			<BanTooltipContent user_id={user_id} content={data} isLoading={isFetching} />
		</HoverCard>
	)
}

function BanTooltipContent({ user_id, content, isLoading }: { user_id: number, content: any, isLoading: boolean }) {
	if (isLoading || !content) {
		return (
			<HoverCardContent className="w-80 space-y-4">
				<div className="flex flex-row items-center space-x-4">
					<Skeleton className="h-6 w-6" />
					<Skeleton className="h-6 w-48" />
				</div>
				<Skeleton className="h-12 w-full" />
			</HoverCardContent>
		)
	}

	const user = content.user;
	const banRecord = user?.ban_record;
	const banDetails = content.ban_details;

	if (!banRecord) {
		return (
			<HoverCardContent className="w-80">
				<div className="flex items-center gap-2">
					<AlertTriangle className="h-4 w-4 text-muted-foreground" />
					<span className="text-sm text-muted-foreground">No ban information available</span>
				</div>
			</HoverCardContent>
		)
	}

	return (
		<HoverCardContent className="w-80 space-y-3">
			<div className="flex items-center gap-2">
				<AlertTriangle className="h-5 w-5 text-destructive" />
				<h4 className="text-sm font-semibold text-destructive">User Banned</h4>
			</div>
			
			<Separator />
			
			<div className="space-y-2">
				<div className="flex items-center gap-2 text-sm">
					<User className="h-4 w-4 text-muted-foreground" />
					<span className="font-medium">User:</span>
					<span>{user.username} (ID: {user_id})</span>
				</div>
				
				<div className="flex items-center gap-2 text-sm">
					<FileText className="h-4 w-4 text-muted-foreground" />
					<span className="font-medium">Ban Record ID:</span>
					<Badge variant="outline">{banRecord}</Badge>
				</div>

				{banDetails && (
					<>
						{banDetails.created_at && (
							<div className="flex items-center gap-2 text-sm">
								<Calendar className="h-4 w-4 text-muted-foreground" />
								<span className="font-medium">Banned:</span>
								<span className="text-muted-foreground">
									{new Date(banDetails.created_at).toLocaleDateString()}
								</span>
							</div>
						)}

						{banDetails.created_by && (
							<div className="flex items-center gap-2 text-sm">
								<Shield className="h-4 w-4 text-muted-foreground" />
								<span className="font-medium">Banned by:</span>
								<UserTooltip user_id={banDetails.created_by} />
							</div>
						)}

						{banDetails.public_reason && (
							<div className="space-y-1">
								<div className="flex items-center gap-2 text-sm">
									<MessageSquare className="h-4 w-4 text-muted-foreground" />
									<span className="font-medium">Public Reason:</span>
								</div>
								<div className="text-sm text-muted-foreground pl-6 bg-muted/50 p-2 rounded">
									{banDetails.public_reason}
								</div>
							</div>
						)}

						{banDetails.private_reason && (
							<div className="space-y-1">
								<div className="flex items-center gap-2 text-sm">
									<FileText className="h-4 w-4 text-muted-foreground" />
									<span className="font-medium">Internal Notes:</span>
								</div>
								<div className="text-sm text-muted-foreground pl-6 bg-destructive/10 p-2 rounded border border-destructive/20">
									{banDetails.private_reason}
								</div>
							</div>
						)}
					</>
				)}
				
				{user.created_at && (
					<div className="flex items-center gap-2 text-sm">
						<Calendar className="h-4 w-4 text-muted-foreground" />
						<span className="font-medium">Account Created:</span>
						<span className="text-muted-foreground">
							{new Date(user.created_at).toLocaleDateString()}
						</span>
					</div>
				)}
			</div>
			
			<div className="text-xs text-muted-foreground pt-2 border-t">
				{banDetails ? (
					"This ban was issued by a moderator. Contact an administrator for appeals."
				) : (
					"Contact an administrator for more details about this ban."
				)}
			</div>
		</HoverCardContent>
	)
}