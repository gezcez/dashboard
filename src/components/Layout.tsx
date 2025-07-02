import type { className } from "../common/types/className";

export default function Layout(props:{children:any}) {
	return <body className="h-screen overflow-hidden bg-gradient-to-br from-yellow-600 to-yellow-500">
		{props.children}
	</body>
}