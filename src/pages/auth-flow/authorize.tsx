import { Navigate, useSearchParams } from "react-router-dom";
import { useGezcezStore } from "../../common/stores/gezcez-auth-store";
import Card from "../../components/Card";
import { useEffect } from "react";
import { useGetAccessToken } from "@/common/hooks/account/user-hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

export default function AuthorizePage() {
	const {data,isLoading} = useGetAccessToken()
	const clearState = useGezcezStore((state)=>state.clearState)
	if (isLoading) {
		return <div className="justify-center space-y-6 self-center  flex h-full items-center flex-col">
			<Label className="justify-center text-3xl text-center">Hesap bilgileri kontrol ediliyor...</Label>
		</div>
	}
	if (!data.token) {
		clearState()
		return
	}
	return <Navigate to={{pathname:"/dash"}}/>
}