import type { className } from "../common/types/className";

export default function Text(props:{children:any,className?:className}) {
	return <div className={`text-lg font-medium text-blue-950 ${props.className}`}>{props.children}</div>
}