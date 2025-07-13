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
import { forwardRef, useImperativeHandle, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { customHistory } from "@/common/utils/nav"
import { useEffect } from "react"
import CrudTooltip from "@/components/tooltips/crud-tooltip"
export default function EditRolePermissionsTable(props: { role_id?: number }) {
	const network_id = useGezcezStore((state) => state.network_id)
	const { role_id } = props
	const { data, refetch } = useGetRolePermissionMatrix()
	const tableRef = useRef<any>(null)
	if (!network_id) return <Navigate to={{ pathname: "/dash" }} />
	return (
		<div className="flex-1 flex self-center justify-center items-start">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Permission ID</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>CRUD</TableHead>
					</TableRow>
				</TableHeader>
				<BuildTableBody
					ref={tableRef}
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

const BuildTableBody = forwardRef(
	(
		props: {
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
		},
		ref: any
	) => {
		const { permissions, role_id, role_permissions } = props
		const { mutateAsync, isPending, data: mutateData } = mutateRolePermissions()
		const formRef = useRef<Record<string, "add" | "remove">>({})

		useImperativeHandle(ref, () => ({
			sendForm: () => {
				sendForm(formRef.current)
			},
		}))
		function updateForm(permission_id: number, operation: "add" | "remove") {
			console.log("updating form", permission_id, operation)
			const new_form = { ...formRef.current, [permission_id]: operation }
			formRef.current = new_form
		}
		function sendForm(send_form: any) {
			console.log("send_form", send_form)

			if (!role_id) {
				toast("role_id parametresi eksik!")
				return
			}
			if (!Object.entries(send_form).length) {
				toast("Kaydedilecek değişiklik bulunamadı.")
				return
			}
			mutateAsync({
				role_id: role_id,
				permissions: Object.entries(send_form).map(([permission_id, operation_type]: any) => ({
					operation_type: operation_type,
					permission_id: parseInt(permission_id),
				})),
			})
			props.onFormSent(send_form)
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
						<TableRow key={`${permission.key}-${permission.id}`}>
							<TableCell>
								<PermissionTooltip permission_id={permission.id} permission_content={permission} />
							</TableCell>
							<TableCell>
								<Checkbox
									onCheckedChange={(value) => updateForm(permission.id, value ? "add" : "remove")}
									defaultChecked={
										!!role_permissions?.find((e: any) => e.permission_id === permission.id && e.role_id === role_id)
									}
								></Checkbox>
							</TableCell>
							<TableCell><CrudTooltip data={role_permissions?.find((e: any) => e.permission_id === permission.id && e.role_id === role_id)}/></TableCell>
						</TableRow>
					)
				)}
			</TableBody>
		)
	}
)
