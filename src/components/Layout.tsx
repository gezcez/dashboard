import { useEffect } from "react";
import { useGezcezStore } from "../common/stores/gezcez-auth-store";
import type { className } from "../common/types/className";
import { useSearchParams } from "react-router-dom";
import { useGetAccessToken } from "../common/hooks/account/user-hooks";
import { SidebarProvider } from "./ui/sidebar";
import SidebarComponent from "./layout/siderbar";
import { Toaster } from "./ui/sonner";

export default function Layout(props: { children: any }) {

	const [urlSearchParams, setUrlSearchParams] = useSearchParams()
	const checkOAuth = useGezcezStore((state) => state.checkOAuth)
	const setRefreshToken = useGezcezStore((state) => state.setRefreshToken)

	const { data, isLoading,isFetching, isError, error } = useGetAccessToken()
	useEffect(() => {
		const token_param = urlSearchParams.get("_")
		if (token_param) {
			setRefreshToken(token_param)
			setUrlSearchParams(new URLSearchParams())
		} else {
			checkOAuth()
		}
	}, [urlSearchParams])
	let component_to_render
	if (isFetching) component_to_render= <div>loading...</div>
	if (isError) component_to_render= <div>err:{error.message}</div>
	return <SidebarProvider>
		<SidebarComponent />
		<main className="h-screen w-full overflow-hidden bg-gradient-to-br from-yellow-600 to-yellow-500">
			<Toaster />
			{component_to_render|| props.children}
		</main>
	</SidebarProvider>
}