import { useGetAccessToken, useGetAccountMe } from "../../common/hooks/account/user-hooks";
import { useGezcezStore } from "../../common/stores/GezcezAuthStore";

export default function DashIndex() {
	const {data:account} = useGetAccountMe()
	return <div className="">
		<p className="font-extrabold font-mono">
		{JSON.stringify(account,undefined,4)}
		</p>
	</div>
}