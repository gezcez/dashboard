// unauthorized page to ask user to be redirected to oauth page

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Navigate, useSearchParams } from "react-router-dom"
import { useGezcezStore } from "@/common/stores/gezcez-auth-store"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"
import { APP_KEY } from "@/common/constants"
import { toast } from "sonner"
export default function UnauthorizedPage() {
	const clearState = useGezcezStore((state) => state.clearState)
	const [searchParams] = useSearchParams()
	const app_key = searchParams.get("app") || APP_KEY
	const t = searchParams.get("t")
	const redirect_uri = searchParams.get("redirect_uri")
	useEffect(() => {
		clearState()
	}, [])
	const handleRedirect = () => {
		const baseUrl = redirect_uri || `https://oauth.gezcez.com/`

		const finalUrl = `${baseUrl}?app=${app_key}&t=${Date.now()}${
			redirect_uri ? `&redirect_uri=${encodeURIComponent(redirect_uri)}` : ""
		}`
		window.location.href = finalUrl
	}
	return (
		<div className="justify-center space-y-6 self-center  flex h-full items-center flex-col">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-center">Yetkisiz Erişim</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-center text-muted-foreground">
						Lütfen giriş yapın veya kayıt olun.
					</p>
					<div className="flex justify-center">
						<Button onClick={handleRedirect}>Giriş Yap / Kayıt Ol</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
