import {
	mutateRolePermissions,
	useGetAllRoles,
	useGetRolePermissionMatrix,
} from "@/common/hooks/manage/dashboard-hooks"
import { useGezcezStore } from "@/common/stores/gezcez-auth-store"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import UserTooltip from "@/components/tooltips/user-tooltip"
import { Navigate } from "react-router-dom"
import PermissionTooltip from "@/components/tooltips/permission-tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { useImperativeHandle, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { customHistory } from "@/common/utils/nav"
import { useEffect } from "react"
export default function EditRolePermissionsTable(props: { role_id?: number }) {
	const network_id = useGezcezStore((state) => state.network_id)
	const { role_id } = props
	const { data, isLoading, refetch } = useGetRolePermissionMatrix()
	const tableRef = useRef<any>(undefined)

	if (!network_id) return <Navigate to={{ pathname: "/dash" }} />
	return (
		<div className="flex-1 flex self-center justify-center items-start">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Permission ID</TableHead>
						<TableHead>Created By</TableHead>
						<TableHead>Created At</TableHead>
						<TableHead>Status</TableHead>
					</TableRow>
				</TableHeader>
				<BuildTableBody
					permissions={data?.permissions}
					role_id={role_id}
					role_permissions={data?.role_permissions}
					onFormSent={() => refetch}
				/>
			</Table>
			<Button variant={"default"} onClick={tableRef?.current?.sendForm}>
				SAVE
			</Button>
		</div>
	)
}

function BuildTableBody(props: {
	role_id: number | undefined
	permissions: {
		created_at: string
		created_by: number
		id: number
		key: string
		updated_at: string
		updated_by: number
	}[]
	role_permissions: any
	onFormSent: (form: { [permission_id: number]: "add" | "remove" }) => void
}) {
	const { permissions, role_id, role_permissions } = props
	const { mutateAsync, isPending, data: mutateData } = mutateRolePermissions()
	const [form, setForm] = useState<{
		[permission_id: number]: "add" | "remove"
	}>({})

	async function sendForm() {
		console.log(form)

		if (!role_id) {
			toast("role_id parametresi eksik!")
			return
		}
		if (!Object.entries(form).length) {
			toast("Kaydedilecek değişiklik bulunamadı.")
			return
		}
		await mutateAsync({
			role_id: role_id,
			permissions: Object.entries(form).map(([permission_id, operation_type]) => ({
				operation_type: operation_type,
				permission_id: parseInt(permission_id),
			})),
		})
		props.onFormSent(form)
	}
	return (
		<TableBody>
			{permissions?.map(
				(permission: {
					created_at: string
					created_by: number
					id: number
					key: string
					updated_at: string
					updated_by: number
				}) => (
					<TableRow key={permission.id}>
						<TableCell>
							<PermissionTooltip permission_id={permission.id} permission_content={permission} />
						</TableCell>
						<TableCell>
							<UserTooltip user_id={permission.created_by} />
						</TableCell>
						<TableCell>{permission.created_at}</TableCell>
						<TableCell>
							<Checkbox
								onCheckedChange={(value) => {
									setForm({ ...form, [`${permission.id}`]: value ? "add" : "remove" })
								}}
								defaultChecked={
									!!role_permissions?.find((e: any) => e.permission_id === permission.id && e.role_id === role_id)
								}
							></Checkbox>
						</TableCell>
					</TableRow>
				)
			)}
		</TableBody>
	)
}
