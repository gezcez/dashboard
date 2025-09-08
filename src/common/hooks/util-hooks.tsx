import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { makeGezcezRequest } from "../utils/master"
import { API_URL } from "../constants"


interface SendTestEmailResponse {
	email_result: any
	email_uuid: string
	insert_result: any
	log_result: any
}

interface ApiResponse<T> {
	result: {
		success: boolean
		message?: string
		data?: T
	}
}

async function sendTestEmail(): Promise<SendTestEmailResponse> {
	const [data, error] = await makeGezcezRequest(
		`${API_URL}/dashboard/utils/send-test-email`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			}
		}
	)
  if (data?.result?.success !== true) {
    throw new Error(data?.result?.message)
  }

	return data
}

export function useSendTestEmail() {
	return useMutation({
		mutationFn: sendTestEmail,
		onSuccess: (data) => {
			console.log("Email test result:", data)
		},
		onError: (error: Error) => {
			console.error("Email test error:", error)
		}
	})
}
