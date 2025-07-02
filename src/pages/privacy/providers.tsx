import { useGetProviders } from "../../common/hooks/privacyHooks";
import Card from "../../components/Card";

export default function ProvidersPage() {
	const {data,isError} = useGetProviders()
	return <div className="flex-col items-center justify-center">
		{isError ? <Card className="">
			something went wrong
		</Card> : "yo"}
	</div>
}