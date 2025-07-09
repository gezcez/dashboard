import { useGetAccessToken, useGetAccountMe } from "../../common/hooks/account/user-hooks";
import { useGezcezStore } from "../../common/stores/gezcez-auth-store";

export default function DashIndex() {
	const {data:account} = useGetAccountMe()
	return <div>
		<p className="font-extrabold font-mono">
		{JSON.stringify(account,undefined,4)}
		</p>
	</div>
}