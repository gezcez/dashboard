import { useEffect } from "react";
import { useGezcezStore } from "../common/stores/GezcezAuthStore";
import type { className } from "../common/types/className";
import { useSearchParams } from "react-router-dom";
import { useGetAccessToken } from "../common/hooks/account/user-hooks";

export default function Layout(props: { children: any }) {

	const [urlSearchParams, setUrlSearchParams] = useSearchParams()
	const checkOAuth = useGezcezStore((state) => state.checkOAuth)
	const setRefreshToken = useGezcezStore((state) => state.setRefreshToken)

	const { data, isLoading, isError, error } = useGetAccessToken()
	useEffect(() => {
		const token_param = urlSearchParams.get("_")
		if (token_param) {
			setRefreshToken(token_param)
			setUrlSearchParams(new URLSearchParams())
		} else {
			checkOAuth()
		}
	}, [urlSearchParams])
	if (isLoading) return <div>loading...</div>
	if (isError) return <div>err:{error.message}</div>
	return <body className="h-screen overflow-hidden bg-gradient-to-br from-yellow-600 to-yellow-500">
		{props.children}
	</body>
}