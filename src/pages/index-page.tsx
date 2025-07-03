import { Link } from "react-router-dom"
import Card from "../components/Card"
import Text from "../components/Text"
import logo from "/logo.png"
export default function IndexPage() {
	return <div>
		<title>Gezcez.com</title>
		<div className="flex flex-col  m-2 sm:flex-row items-center justify-center h-screen">
			<div className="text-center">
				<img className="h-48 w-48 mb-4 object-contain" src={logo} />
				<Text>Gezcez.com</Text>
			</div>
			<Card className="m-16 flex-col">
				<Text className="text-[18px] sm:text-lg">Şey- biz daha hazır değiliz de,
					Sonra uğrasanız olur mu?
				</Text>
				<br />
				<Text>
					Lazım olursa bize ulaşın: <a href="mailto:info@gezcez.com" className="text-blue-500 hover:text-blue-400 hover:animate-pulse transition-all duration-150 scale-125">info@gezcez.com</a>
				</Text>
				<div className="flex text-center items-center flex-col justify-center mt-12">
					<Link to={"https://github.com/gezcez"} target="_blank">
					GitHub sayfamız
						<img className="h-8" src="https://github.githubassets.com/assets/GitHub-Logo-ee398b662d42.png"></img>
						</Link>
				</div>
			</Card>
		</div>
	</div>
}