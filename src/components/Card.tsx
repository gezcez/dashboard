import type { className } from "../common/types/className";

export default function Card(props:{children:any,className?:className}) {
	return <div className={`p-6 outline-5 rounded-2xl outline-dashed outline-blue-950 ${props.className}`}>{props.children}</div>
}