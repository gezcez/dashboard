import {
	useGetAccountRoles,
	useGetMyNetworks,
} from "@/common/hooks/account/user-hooks"
import { useGetNetworks } from "@/common/hooks/web-hooks"
import {
	getCookie,
	setCookie,
} from "@/common/utils/master"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { AvatarImage } from "@radix-ui/react-avatar"

export default function SidebarNetworkSelector(props: {
	value: number | undefined,
	onValueChange: (value: string) => void
}) {
	const {
		data: roles,
		isLoading: isRolesLoading,
	} = useGetAccountRoles()

	const {
		data,
		isLoading: isNetworksLoading,
	} = useGetMyNetworks()
	return (
		<Select
			onValueChange={(value) => {
				console.log(
					"network value changed",
					value
				)
				setCookie("network_id", value)
				props.onValueChange(value)
			}}
			defaultValue={`${props.value}`}
		>
			<SelectTrigger className="w-full">
				<SelectValue defaultValue={`${props.value}`} placeholder="Change network" />
			</SelectTrigger>
			{isNetworksLoading ? (
				<Skeleton />
			) : (
				<SelectContent>
					<SelectGroup>
						<SelectLabel
						>
							Networks
						</SelectLabel>
						{data?.networks?.map(
							(network: any, i: number) => (
								<SelectItem
									key={`${network.id}`}
									value={network.id}
								>
									<div className="flex w-full gap-y-2 flex-col">
										<Label >
											{network.id} - {network.name}
										</Label>
										<div className="flex-row flex gap-x-2">
											{roles?.roles
												?.filter(
													(e: any) =>
														e.user_role.network_id === network.id
												)
												.sort(
													(a: any, b: any) => b.role.level - a.role.level
												)
												.slice(0, 3)
												.map((role: any) => {
													return <Badge key={`${role.role.id}`}>
													{role.role.name}
												</Badge>
												}
												)}
										</div>
									</div>
								</SelectItem>
							)
						)}
					</SelectGroup>
				</SelectContent>
			)
			}
		</Select >
	)
}
